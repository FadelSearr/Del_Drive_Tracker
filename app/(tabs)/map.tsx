import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import LeafletMap from '@/components/LeafletMap';
import * as Location from 'expo-location';
import { Accelerometer } from 'expo-sensors';
import { router } from 'expo-router';
import { Database } from '@/services/Database';
import { GamificationEngine } from '@/services/GamificationEngine';
import { Feather } from '@expo/vector-icons';

const LOCATION_TASK_NAME = 'background-location-task';

let TaskManager: any = null;
try {
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
} catch (e) {
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
  const [mapMode, setMapMode] = useState<'follow' | 'free' | '3d'>('follow');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [heatmapCoords, setHeatmapCoords] = useState<{latitude: number; longitude: number; speed?: number}[]>([]);
  
  // Segment Creation State
  const [isCreatingSegment, setIsCreatingSegment] = useState(false);
  const [segmentStartCoords, setSegmentStartCoords] = useState<{latitude: number; longitude: number} | null>(null);
  
  // HUD Messages & Speed Zone tracking
  const [activeZone, setActiveZone] = useState<{ id: string; startTime: number } | null>(null);
  const activeZoneRef = React.useRef<{ id: string; startTime: number } | null>(null);
  const [hudMessage, setHudMessage] = useState<{ title: string; subtitle: string; type: 'trap' | 'zone_start' | 'zone_end' } | null>(null);

  const updateActiveZoneState = (zone: { id: string; startTime: number } | null) => {
    activeZoneRef.current = zone;
    setActiveZone(zone);
  };
  
  const [currentCarName, setCurrentCarName] = useState('Porsche 911 GT3 RS');
  
  useEffect(() => {
    Database.init();
    loadHeatmapData();
    loadSegments();
  }, []);

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

  // Accelerometer Telematics
  useEffect(() => {
    let subscription: any = null;
    if (isTracking && hasStarted) {
      Accelerometer.setUpdateInterval(100);
      let lastBrakeTime = 0;
      let lastLaneChangeTime = 0;

      subscription = Accelerometer.addListener(data => {
        const accY = data.y * 9.81;
        const accX = data.x * 9.81;
        if (accY > 0.1) setMaxAcc(prev => Math.max(prev, accY));
        if (accY < -0.1) {
          const decVal = Math.abs(accY);
          setMaxDec(prev => Math.max(prev, decVal));
          const now = Date.now();
          if (decVal > 2.0 && now - lastBrakeTime > 2000) {
            setBrakePressedCount(prev => prev + 1);
            lastBrakeTime = now;
          }
        }
        const now = Date.now();
        if (Math.abs(accX) > 1.8 && now - lastLaneChangeTime > 3000) {
          setLaneChangesCount(prev => prev + 1);
          lastLaneChangeTime = now;
        }
      });
    }
    return () => { if (subscription) subscription.remove(); };
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
      } catch (e) {
        console.log("Background location permission request skipped or failed (expected in Expo Go without config plugins)");
      }
      
      if (bgStatus !== 'granted') {
        console.warn("Background location permission denied");
      }

      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);

      locationSubscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 2000, distanceInterval: 5 },
        (newLocation) => {
          const prevLoc = locationRef.current;
          setLocation(newLocation);
          if (isTrackingRef.current && hasStartedRef.current) {
            if (newLocation.coords.altitude !== null) setCurrentAltitude(Math.round(newLocation.coords.altitude));
            const currentSpeedKmh = Math.max(0, Math.round((newLocation.coords.speed || 0) * 3.6));
            setTopSpeed(prev => Math.max(prev, currentSpeedKmh));
            if (prevLoc && prevLoc.coords.heading !== null && newLocation.coords.heading !== null) {
              const headingDiff = newLocation.coords.heading - prevLoc.coords.heading;
              const normalizedDiff = ((headingDiff + 180) % 360) - 180;
              if (Math.abs(normalizedDiff) > 45) {
                if (normalizedDiff > 0) setRightTurnsCount(prev => prev + 1);
                else setLeftTurnsCount(prev => prev + 1);
              }
            }
            setRouteCoordinates(prev => {
              if (prev.length > 0) {
                const lastCoord = prev[prev.length - 1];
                const newDist = getDistance(lastCoord.latitude, lastCoord.longitude, newLocation.coords.latitude, newLocation.coords.longitude);
                if (newDist > 0.005) setDistance(d => d + newDist);
              }
              const speedVal = Math.max(0, Math.round((newLocation.coords.speed || 0) * 3.6));
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
                     const isNewRecord = currentSegment.bestTime === 0 || timeTaken < currentSegment.bestTime;
                     
                     if (isNewRecord) {
                       currentSegment.bestTime = timeTaken;
                       // We should ideally update top speed in segment too, but keeping it simple for now
                       await Database.saveSegment(currentSegment);
                     }
                     
                     updateActiveZoneState(null);
                     setHudMessage({ title: 'SEGMENT COMPLETED!', subtitle: `${currentSegment.name}: ${timeTaken}s ${isNewRecord ? '(NEW RECORD!)' : ''}`, type: 'zone_end' });
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
        alert("Please add and select a vehicle in Garage first");
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
    } catch (e) {
      console.log(e);
    }
    setSeconds(0); setDistance(0); setTopSpeed(0);
    setBrakePressedCount(0); setMaxAcc(0); setMaxDec(0);
    setLeftTurnsCount(0); setRightTurnsCount(0);
    setStopsCount(0); setStopsDurationSecs(0); setLaneChangesCount(0);
    if (location && location.coords) {
      const initialSpeed = Math.max(0, Math.round((location.coords.speed || 0) * 3.6));
      setRouteCoordinates([{ latitude: location.coords.latitude, longitude: location.coords.longitude, speed: initialSpeed }]);
      if (location.coords.altitude !== null) setCurrentAltitude(Math.round(location.coords.altitude));
    } else {
      setRouteCoordinates([]);
    }
  };

  const handleEndDrive = async () => {
    const finalDuration = formatTime(seconds);
    const finalDistance = `${distance.toFixed(1)} km`;
    const finalTopSpeed = `${topSpeed} km/h`;
    const hours = seconds / 3600;
    const avg = hours > 0 ? Math.round(distance / hours) : 0;
    const finalAvgSpeed = `${avg} km/h`;
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
    });

    const newlyAchieved = await GamificationEngine.evaluateDrive(newDrive);
    const achievedStr = JSON.stringify(newlyAchieved);
    setRouteCoordinates([]); setSeconds(0); setDistance(0); setTopSpeed(0);
    setMaxAcc(0); setMaxDec(0); setIsTracking(false); setHasStarted(false);
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
      
      {/* Top HUD — Speed + Status */}
      <View style={styles.topHud}>
        <Text style={{ fontSize: 48, fontWeight: '800', color: 'white', letterSpacing: -2 }}>{currentSpeed}</Text>
        <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.3)', letterSpacing: 2, marginTop: 2 }}>KM/H</Text>
      </View>

      {/* Status indicator */}
      <View style={styles.statusBadge}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: statusColor }} />
          <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{statusLabel}</Text>
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
  topHud: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 24,
    backgroundColor: 'rgba(9,9,15,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statusBadge: {
    position: 'absolute',
    top: 60,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(9,9,15,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  hudBanner: {
    position: 'absolute',
    top: 140,
    left: 16,
    right: 16,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 28,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#09090F',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#111120',
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
    backgroundColor: '#111120',
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
});
