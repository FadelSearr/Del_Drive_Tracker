
import LeafletMap from '@/components/LeafletMap';
import { Database, SegmentAttempt } from '@/services/Database';
import { GamificationEngine } from '@/services/GamificationEngine';
import { Feather } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library/legacy';
import * as FileSystem from 'expo-file-system/legacy';
import * as Location from 'expo-location';
import { router } from 'expo-router';

import { Accelerometer } from 'expo-sensors';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

const LOCATION_TASK_NAME = 'background-location-task';

let TaskManager: any = null;
try {
// eslint-disable-next-line @typescript-eslint/no-require-imports
  TaskManager = require('expo-task-manager');
  TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }: { data: any; error: any }) => {
    if (error) {
      console.error("Background Location Error:", error);
      return;
    }
    if (data) {
      const { locations } = data as any;
      console.log("Background Location received:", locations);
    }
  });
} catch {
  console.log("TaskManager is not available (likely in Expo Go).");
}

// Haversine formula to calculate distance between two coordinates in km
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function MapTabScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<{latitude: number; longitude: number; speed?: number}[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [mapMode] = useState<'follow' | 'free' | '3d'>('follow');
  const [showHeatmap] = useState(false);
  const [heatmapCoords, setHeatmapCoords] = useState<{latitude: number; longitude: number; speed?: number}[]>([]);
  
  // HUD Messages & Speed Zone tracking
  const [, setActiveZone] = useState<{ id: string; startTime: number } | null>(null);
  const activeZoneRef = React.useRef<{ id: string; startTime: number } | null>(null);
  const [hudMessage, setHudMessage] = useState<{ title: string; subtitle: string; type: 'trap' | 'zone_start' | 'zone_end' } | null>(null);
  


  const updateActiveZoneState = (zone: { id: string; startTime: number } | null) => {
    activeZoneRef.current = zone;
    setActiveZone(zone);
  };
  
  const [currentCarName, setCurrentCarName] = useState('Porsche 911 GT3 RS');
  
  const [allSegments, setAllSegments] = useState<any[]>([]);
  const loadSegments = async () => {
    const segments = await Database.getAllSegments();
    setAllSegments(segments);
  };

  useEffect(() => {
    const loadCurrentVehicle = async () => {
      const active = await Database.getCurrentVehicle();
      if (active) {
        setCurrentCarName(active.name);
      }
    };
    loadCurrentVehicle();
  }, [isTracking]);

  const loadHeatmapData = async () => {
    let coords: {latitude: number; longitude: number}[] = [];
    const allDrives = await Database.getAllDrives();
    allDrives.forEach(d => {
      if (d.coordinates) {
        coords = [...coords, ...d.coordinates];
      }
    });
    setHeatmapCoords(coords);
  };

  useEffect(() => {
    Database.init();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHeatmapData();

    loadSegments();
  }, []);

  // Real-time tracking stats
  const [seconds, setSeconds] = useState(0);
  const [distance, setDistance] = useState(0);
  const [topSpeed, setTopSpeed] = useState(0);
  const [currentAltitude, setCurrentAltitude] = useState(0);

  // Telematics / Sensor statistics
  const [brakePressedCount, setBrakePressedCount] = useState(0);
  const [maxAcc, setMaxAcc] = useState(0);
  const [maxDec, setMaxDec] = useState(0);
  const [leftTurnsCount, setLeftTurnsCount] = useState(0);
  const [rightTurnsCount, setRightTurnsCount] = useState(0);
  const [stopsCount, setStopsCount] = useState(0);
  const [stopsDurationSecs, setStopsDurationSecs] = useState(0);
  const [isCurrentlyStopped, setIsCurrentlyStopped] = useState(false);
  const [laneChangesCount, setLaneChangesCount] = useState(0);

  // Refs to avoid restarting the timer / GPS watcher on every state change
  const locationRef = React.useRef<Location.LocationObject | null>(null);
  const isTrackingRef = React.useRef(isTracking);
  const hasStartedRef = React.useRef(hasStarted);
  const isCurrentlyStoppedRef = React.useRef(isCurrentlyStopped);

  useEffect(() => { locationRef.current = location; }, [location]);
  useEffect(() => { isTrackingRef.current = isTracking; }, [isTracking]);
  useEffect(() => { hasStartedRef.current = hasStarted; }, [hasStarted]);
  useEffect(() => { isCurrentlyStoppedRef.current = isCurrentlyStopped; }, [isCurrentlyStopped]);

  // Timer & Stops Duration Tracker
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isTracking && hasStarted) {
      interval = setInterval(() => {
        setSeconds(prev => prev + 1);
        const currentLoc = locationRef.current;
        const currentSpeedKmh = currentLoc ? Math.max(0, Math.round((currentLoc.coords.speed || 0) * 3.6)) : 0;
        if (currentSpeedKmh < 1.0) {
          setStopsDurationSecs(prev => prev + 1);
          if (!isCurrentlyStoppedRef.current) {
            setIsCurrentlyStopped(true);
            setStopsCount(prev => prev + 1);
          }
        } else {
          setIsCurrentlyStopped(false);
        }
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isTracking, hasStarted]);

  // Accelerometer Telematics (Smoothed & Speed-Gated)
  useEffect(() => {
    let subscription: any = null;
    if (isTracking && hasStarted) {
      Accelerometer.setUpdateInterval(100);
      let lastBrakeTime = 0;
      let lastLaneChangeTime = 0;
      
      let gravityX = 0, gravityY = 0, gravityZ = 0;
      let lastGpsSpeed = 0;
      const alpha = 0.8;

      subscription = Accelerometer.addListener(data => {
        gravityX = alpha * gravityX + (1 - alpha) * data.x;
        gravityY = alpha * gravityY + (1 - alpha) * data.y;
        gravityZ = alpha * gravityZ + (1 - alpha) * data.z;
        
        const currentSpeedMs = locationRef.current?.coords?.speed || 0;
        const speedDelta = currentSpeedMs - lastGpsSpeed;
        
        // Run at 10Hz, but update lastGpsSpeed slowly to see trend
        if (Math.random() < 0.1) lastGpsSpeed = currentSpeedMs; 
        
        if (currentSpeedMs < 1.5) return; // Ignored if < 5 km/h
        
        const gMag = Math.sqrt(gravityX*gravityX + gravityY*gravityY + gravityZ*gravityZ) || 1;
        const gx = gravityX / gMag, gy = gravityY / gMag, gz = gravityZ / gMag;
        
        const linX = data.x - gravityX, linY = data.y - gravityY, linZ = data.z - gravityZ;
        const vertAcc = linX * gx + linY * gy + linZ * gz;
        
        const horizX = linX - vertAcc * gx;
        const horizY = linY - vertAcc * gy;
        const horizZ = linZ - vertAcc * gz;
        const horizMag = Math.sqrt(horizX*horizX + horizY*horizY + horizZ*horizZ) * 9.81;

        if (speedDelta > 0.2 && horizMag > 0.5) {
          setMaxAcc(prev => Math.max(prev, horizMag));
        } else if (speedDelta < -0.2 && horizMag > 0.5) {
          setMaxDec(prev => Math.max(prev, horizMag));
          const now = Date.now();
          if (horizMag > 2.5 && now - lastBrakeTime > 2000) {
            setBrakePressedCount(prev => prev + 1);
            lastBrakeTime = now;
          }
        }
        
        // Cornering / Lane Change proxy (if speed is stable but horizMag is high)
        if (Math.abs(speedDelta) < 0.2 && horizMag > 2.0) {
          const now = Date.now();
          if (now - lastLaneChangeTime > 3000) {
            setLaneChangesCount(prev => prev + 1);
            lastLaneChangeTime = now;
          }
        }
      });
    }
    return () => {
      if (subscription) subscription.remove();
      Location.stopLocationUpdatesAsync('BACKGROUND_LOCATION_TASK').catch(() => {});
    };
  }, [isTracking, hasStarted]);

  // GPS Location Tracking
  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;
    (async () => {
      let { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
      if (fgStatus !== 'granted') return;
      
      let bgStatus = 'undetermined';
      try {
        const result = await Location.requestBackgroundPermissionsAsync();
        bgStatus = result.status;
      } catch {
        console.log("Background location permission request skipped or failed (expected in Expo Go without config plugins)");
      }
      
      if (bgStatus !== 'granted') {
        console.warn("Background location permission denied");
      }

      if (bgStatus === 'granted') {
        await Location.startLocationUpdatesAsync('BACKGROUND_LOCATION_TASK', {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 2,
          showsBackgroundLocationIndicator: true,
          foregroundService: {
            notificationTitle: 'Del Road',
            notificationBody: 'Recording your drive...',
            notificationColor: '#3B82F6',
          },
        }).catch(e => console.log('Failed to start bg location', e));
      }

      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);

      locationSubscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 1000, distanceInterval: 2 },
        (newLocation) => {
          const prevLoc = locationRef.current;
          setLocation(newLocation);
          if (isTrackingRef.current && hasStartedRef.current) {
            if (newLocation.coords.altitude !== null) setCurrentAltitude(Math.round(newLocation.coords.altitude));
            const currentSpeedKmh = Math.max(0, Math.round((newLocation.coords.speed || 0) * 3.6));
            setTopSpeed(prev => Math.max(prev, currentSpeedKmh));
            if (prevLoc && prevLoc.coords.heading !== null && newLocation.coords.heading !== null) {
              const currentSpeedMs = newLocation.coords.speed || 0;
              // Only register turns if vehicle is moving > 15 km/h to prevent GPS drift rotation while stopped
              if (currentSpeedMs > 4.1) {
                const headingDiff = newLocation.coords.heading - prevLoc.coords.heading;
                const normalizedDiff = ((headingDiff + 180) % 360) - 180;
                if (Math.abs(normalizedDiff) > 45 && Math.abs(normalizedDiff) < 135) {
                  if (normalizedDiff > 0) setRightTurnsCount(prev => prev + 1);
                  else setLeftTurnsCount(prev => prev + 1);
                }
              }
            }
            setRouteCoordinates(prev => {
              const currentSpeedMs = newLocation.coords.speed || 0;
              // Anti-GPS Drift: Only accumulate distance if actually moving (> ~5 km/h)
              if (prev.length > 0 && currentSpeedMs > 1.4) {
                const lastCoord = prev[prev.length - 1];
                const newDist = getDistance(lastCoord.latitude, lastCoord.longitude, newLocation.coords.latitude, newLocation.coords.longitude);
                if (newDist > 0.005) setDistance(d => d + newDist);
              }
              const speedVal = Math.max(0, Math.round(currentSpeedMs * 3.6));
              return [...prev, { latitude: newLocation.coords.latitude, longitude: newLocation.coords.longitude, speed: speedVal }];
            });
            // Speed Trap & Zone checks
            (async () => {
              const spd = Math.max(0, Math.round((newLocation.coords.speed || 0) * 3.6));
              
              // Custom Segments Tracking
              if (!activeZoneRef.current) {
                // Check if entering a segment
                for (const segment of allSegments) {
                  const distToStart = getDistance(newLocation.coords.latitude, newLocation.coords.longitude, segment.startCoords.latitude, segment.startCoords.longitude);
                  if (distToStart < 0.05) { // within 50 meters
                    updateActiveZoneState({ id: segment.id, startTime: Date.now() });
                    setHudMessage({ title: 'SEGMENT ENTERED!', subtitle: `Beat your time for ${segment.name}!`, type: 'zone_start' });
                    setTimeout(() => setHudMessage(null), 4000);
                    break;
                  }
                }
              } else {
                // Currently in a segment, check if finished
                const currentSegment = allSegments.find(s => s.id === activeZoneRef.current?.id);
                if (currentSegment) {
                   const distToEnd = getDistance(newLocation.coords.latitude, newLocation.coords.longitude, currentSegment.endCoords.latitude, currentSegment.endCoords.longitude);
                    if (distToEnd < 0.05) { // within 50 meters
                      const timeTaken = Math.round((Date.now() - activeZoneRef.current.startTime) / 1000);
                      
                      // Calculate avg speed for the current attempt based on routeCoords since zone start
                      // Find the index when we started the zone or just use the current top speed for simplicity if tracking isn't point-to-point enough
                      const attemptTopSpeed = topSpeed; 
                      const attemptAvgSpeed = Math.round((distance / (seconds || 1)) * 3600) || 0; // Rough estimate or use better logic if needed

                      const newAttempt: SegmentAttempt = {
                        id: Date.now().toString(),
                        date: new Date().toISOString(),
                        time: timeTaken,
                        topSpeed: attemptTopSpeed,
                        avgSpeed: attemptAvgSpeed,
                        // driveId could be added if we had a current drive ID
                      };

                      const isNewRecord = (currentSegment.bestTime || 0) === 0 || timeTaken < currentSegment.bestTime;
                      
                      if (!currentSegment.attempts) currentSegment.attempts = [];
                      currentSegment.attempts.push(newAttempt);

                      if (isNewRecord) {
                        currentSegment.bestTime = timeTaken;
                        if (attemptTopSpeed > (currentSegment.topSpeed || 0)) {
                          currentSegment.topSpeed = attemptTopSpeed;
                        }
                      }
                      
                      await Database.saveSegment(currentSegment);
                      
                      updateActiveZoneState(null);
                      setHudMessage({ title: 'SEGMENT COMPLETED!', subtitle: `${currentSegment.title}: ${timeTaken}s ${isNewRecord ? '(NEW RECORD!)' : ''}`, type: 'zone_end' });
                      setTimeout(() => setHudMessage(null), 5000);
                    }
                }
              }

              const trapResult = await GamificationEngine.checkSpeedTrap(newLocation.coords.latitude, newLocation.coords.longitude, spd);
              if (trapResult) {
                setHudMessage({ title: 'SPEED TRAP TRIGGERED!', subtitle: `${trapResult.name}: ${trapResult.speed} km/h ${trapResult.isNewRecord ? '(NEW RECORD!)' : ''}`, type: 'trap' });
                setTimeout(() => setHudMessage(null), 4000);
              }
            })();
          }
        }
      );
    })();
    return () => { if (locationSubscription) locationSubscription.remove(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const displayMins = mins.toString().padStart(2, '0');
    const displaySecs = secs.toString().padStart(2, '0');
    if (hrs > 0) return `${hrs.toString().padStart(2, '0')}:${displayMins}:${displaySecs}`;
    return `${displayMins}:${displaySecs}`;
  };

  const formatStopsDuration = (totalSecs: number) => {
    if (totalSecs === 0) return '0s';
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const handleStartDrive = async () => {
    try {
      const activeVehicle = await Database.getCurrentVehicle();
      if (!activeVehicle) {
        Alert.alert("No Vehicle", "Please add and select a vehicle in Garage first");
        return;
      }
      setIsTracking(true);
      setHasStarted(true);
      
      // Start background location tracking
      const hasBgPermission = (await Location.getBackgroundPermissionsAsync()).granted;
      if (hasBgPermission) {
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
          accuracy: Location.Accuracy.High,
          showsBackgroundLocationIndicator: true,
          foregroundService: {
            notificationTitle: "Del Road Tracking",
            notificationBody: "Your drive is currently being tracked.",
            notificationColor: "#4B7EFF",
          }
        });
      }

      if (isDashcamActive) {
        setIsRecordingVideo(true);
      }
    } catch (e) {
      console.log(e);
    }
    setSeconds(0); setDistance(0); setTopSpeed(0);
    setBrakePressedCount(0); setMaxAcc(0); setMaxDec(0);
    setLeftTurnsCount(0); setRightTurnsCount(0);
    setStopsCount(0); setStopsDurationSecs(0); setLaneChangesCount(0);
    dashcamUriRef.current = null; setDashcamUri(null);
    if (location && location.coords) {
      const initialSpeed = Math.max(0, Math.round((location.coords.speed || 0) * 3.6));
      setRouteCoordinates([{ latitude: location.coords.latitude, longitude: location.coords.longitude, speed: initialSpeed }]);
      if (location.coords.altitude !== null) setCurrentAltitude(Math.round(location.coords.altitude));
    } else {
      setRouteCoordinates([]);
    }
  };


  const handleEndDrive = async () => {
    if (isRecordingVideo) {
      setIsRecordingVideo(false);
      // Wait for the recording callback to populate the Ref (up to 5 seconds)
      let attempts = 0;
      while (!dashcamUriRef.current && attempts < 10) {
        await new Promise(r => setTimeout(r, 500));
        attempts++;
      }
    }
    
    const finalDashcamUri = dashcamUriRef.current;
    console.log("Starting final save process with URI:", finalDashcamUri);
    const finalDuration = formatTime(seconds);
    const finalDistance = `${distance.toFixed(1)} km`;
    const finalTopSpeed = `${topSpeed} km/h`;
    const validSpeeds = routeCoordinates.filter(c => c.speed !== undefined).map(c => c.speed as number);
    const avgSpeedVal = validSpeeds.length > 0 
      ? Math.round(validSpeeds.reduce((a, b) => a + b, 0) / validSpeeds.length)
      : 0;
    const finalAvgSpeed = `${avgSpeedVal} km/h`;

    const finalTopBrakeForce = `${(maxDec / 9.81).toFixed(2)} G`;

    // Fetch the actual current vehicle right before saving
    const activeCar = await Database.getCurrentVehicle();
    const actualCarName = activeCar ? activeCar.name : currentCarName;

    const newDrive = await Database.addDrive({
      title: `Drive ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      distance: finalDistance, duration: finalDuration, avgSpeed: finalAvgSpeed, topSpeed: finalTopSpeed,
      weather: '28°C', car: actualCarName,
      route: routeCoordinates.length > 0 ? 'TANGERANG SELATAN' : 'LOCAL DRIVE',
      coordinates: routeCoordinates,
      altitude: `${currentAltitude} m`, brakePressed: brakePressedCount,
      topAcceleration: `${maxAcc.toFixed(1)} m/s²`, topDeceleration: `${maxDec.toFixed(1)} m/s²`,
      laneChanges: laneChangesCount, topBrakeForce: finalTopBrakeForce,
      leftTurns: leftTurnsCount, rightTurns: rightTurnsCount,
      stopsCount: stopsCount, stopsDuration: formatStopsDuration(stopsDurationSecs),
      dashcamUri: dashcamUri || undefined,
    });

    const newlyAchieved = await GamificationEngine.evaluateDrive(newDrive);
    const achievedStr = JSON.stringify(newlyAchieved);
    setRouteCoordinates([]); setSeconds(0); setDistance(0); setTopSpeed(0);
    setMaxAcc(0); setMaxDec(0); setIsTracking(false); setHasStarted(false); setIsDashcamActive(false);
    loadHeatmapData();
    // Stop background tracking
    try {
      const hasTask = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
      if (hasTask) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      }
    } catch (e) {
      console.log("Error stopping background location", e);
    }



    router.push({
      pathname: '/drive/celebration', params: { driveId: newDrive.id, newlyAchieved: achievedStr } });

  };

  const currentSpeed = location ? Math.max(0, Math.round((location.coords.speed || 0) * 3.6)) : 0;
  const statusColor = isTracking ? '#22C55E' : hasStarted ? '#F97316' : '#3A3A5A';
  const statusLabel = isTracking ? 'Recording' : hasStarted ? 'Paused' : 'Standby';

  return (
    <View style={styles.container}>
        {location ? (
          <LeafletMap 
            userLocation={{ latitude: location.coords.latitude, longitude: location.coords.longitude }}
            coordinates={routeCoordinates}
            mapMode={mapMode}
            showHeatmap={showHeatmap}
            heatmapData={heatmapCoords}
          />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#09090F' }}>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Locating...</Text>
          </View>
        )}



      {/* Floating UI Elements */}
      <SafeAreaView style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <View style={styles.headerHudContainer}>
          {/* Top HUD — Speed (Centered) */}
          <View style={{ position: 'absolute', left: 0, right: 0, top: 0, alignItems: 'center', pointerEvents: 'none' }}>
            <View style={styles.topHud}>
              <Text style={{ fontSize: 38, fontWeight: '800', color: 'white', letterSpacing: -1 }}>{currentSpeed}</Text>
              <Text style={{ fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.3)', letterSpacing: 1 }}>KM/H</Text>
            </View>
          </View>

          {/* Status badge (Right aligned) */}
          <View style={[styles.statusBadge, { marginLeft: 'auto' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: statusColor }} />
              <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>{statusLabel.toUpperCase()}</Text>
            </View>
          </View>
        </View>


        {/* HUD Message Banner */}
        {hudMessage && (
          <View style={[styles.hudBanner, {
            backgroundColor: hudMessage.type === 'trap' ? 'rgba(249,115,22,0.92)' : hudMessage.type === 'zone_start' ? 'rgba(75,126,255,0.92)' : 'rgba(34,197,94,0.92)',
            borderColor: hudMessage.type === 'trap' ? '#F97316' : hudMessage.type === 'zone_start' ? '#4B7EFF' : '#22C55E',
          }]}>
            <Feather 
              name={hudMessage.type === 'trap' ? 'zap' : hudMessage.type === 'zone_start' ? 'play-circle' : 'award'} 
              size={22} color="#FFF" style={{ marginRight: 12 }} 
            />
            <View style={{ flex: 1 }}>
              <Text style={{ color: 'white', fontWeight: '800', fontSize: 12, letterSpacing: 1 }}>{hudMessage.title}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11 }}>{hudMessage.subtitle}</Text>
            </View>
          </View>
        )}
      </SafeAreaView>


      {/* Bottom Control Panel */}
      <View style={styles.bottomPanel}>
        {/* Live Stats */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          {[
            { label: 'TIME', value: formatTime(seconds) },
            { label: 'TOP SPEED', value: `${topSpeed} km/h` },
            { label: 'DISTANCE', value: `${distance.toFixed(2)} km` },
          ].map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: 1, marginBottom: 4 }}>{s.label}</Text>
              <Text style={{ fontSize: 15, color: 'white', fontWeight: '700' }}>{s.value}</Text>
            </View>
          ))}
        </View>

        {/* Speed Zone Info */}
        <View style={styles.zoneCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 16 }}>⚡</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: 'white', fontWeight: '600' }}>Speed Zone</Text>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Active monitoring · GPS 10Hz</Text>
            </View>
            <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, backgroundColor: 'rgba(75,126,255,0.15)' }}>
              <Text style={{ color: '#60A5FA', fontSize: 10 }}>ZONE</Text>
            </View>
          </View>
        </View>

        {/* Control Buttons */}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
          {!hasStarted ? (
            <Pressable style={styles.startBtn} onPress={handleStartDrive}>
              <Feather name="play" size={22} color="white" />
              <Text style={{ color: 'white', fontSize: 17, fontWeight: '700' }}>Start Drive</Text>
            </Pressable>
          ) : isTracking ? (
            <Pressable style={styles.pauseBtn} onPress={() => setIsTracking(false)}>
              <Feather name="pause" size={18} color="white" />
              <Text style={{ color: 'white', fontSize: 15, fontWeight: '600' }}>Pause</Text>
            </Pressable>
          ) : (
            <>
              <Pressable style={styles.resumeBtn} onPress={() => setIsTracking(true)}>
                <Feather name="play" size={18} color="white" />
                <Text style={{ color: 'white', fontSize: 15, fontWeight: '600' }}>Resume</Text>
              </Pressable>
              <Pressable style={styles.endBtn} onPress={handleEndDrive}>
                <Feather name="square" size={16} color="white" />
                <Text style={{ color: 'white', fontSize: 15, fontWeight: '600' }}>End Drive</Text>
              </Pressable>
            </>
          )}
        </View>

        {/* GPS Active Indicator */}
        {isTracking && (
          <View style={styles.gpsIndicator}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#22C55E' }} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#22C55E', fontSize: 12, fontWeight: '600' }}>GPS Active · High Accuracy</Text>
              <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>Haversine distance · 2s polling · Accel @ 10Hz</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090F',
  },
  headerHudContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: Platform.OS === 'android' ? 60 : 50,
  },

  topHud: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(9,9,15,0.95)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    minWidth: 120,
    justifyContent: 'center',

  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(9,9,15,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  hudBanner: {
    marginTop: 20,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },

  bottomPanel: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
    borderRadius: 24,
    backgroundColor: 'rgba(9,9,15,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(17,17,32,0.8)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  zoneCard: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(17,17,32,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  startBtn: {
    flex: 1,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#22C55E',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  pauseBtn: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#1C1C2E',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  resumeBtn: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#22C55E',
  },
  endBtn: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  gpsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(34,197,94,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.15)',
  },
  dashcamToggle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(9,9,15,0.95)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },



  dashcamToggleActive: {
    backgroundColor: '#4B7EFF',
    borderColor: '#4B7EFF',
  },
});
