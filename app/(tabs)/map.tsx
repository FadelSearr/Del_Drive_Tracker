import React, { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { View, Text, Pressable } from '@/components/tw';
import LeafletMap from '@/components/LeafletMap';
import * as Location from 'expo-location';
import { Accelerometer } from 'expo-sensors';
import { router } from 'expo-router';
import { Database } from '@/services/Database';
import { GamificationEngine } from '@/services/GamificationEngine';
import { Feather } from '@expo/vector-icons';

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
  }, []);

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
    const allDrives = await Database.getAllDrives();
    let coords: {latitude: number; longitude: number}[] = [];
    allDrives.forEach(d => {
      if (d.coordinates) {
        coords = [...coords, ...d.coordinates];
      }
    });
    setHeatmapCoords(coords);
  };

  // Real-time tracking stats
  const [seconds, setSeconds] = useState(0);
  const [distance, setDistance] = useState(0); // in km
  const [topSpeed, setTopSpeed] = useState(0); // in km/h
  const [currentAltitude, setCurrentAltitude] = useState(0); // in meters

  // Telematics / Sensor statistics
  const [brakePressedCount, setBrakePressedCount] = useState(0);
  const [maxAcc, setMaxAcc] = useState(0); // in m/s^2
  const [maxDec, setMaxDec] = useState(0); // in m/s^2
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

  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  useEffect(() => {
    isTrackingRef.current = isTracking;
  }, [isTracking]);

  useEffect(() => {
    hasStartedRef.current = hasStarted;
  }, [hasStarted]);

  useEffect(() => {
    isCurrentlyStoppedRef.current = isCurrentlyStopped;
  }, [isCurrentlyStopped]);

  // Timer & Stops Duration Tracker
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isTracking && hasStarted) {
      interval = setInterval(() => {
        setSeconds(prev => prev + 1);
        
        // Track stops (speed < 1.0 km/h)
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
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking, hasStarted]);

  // Accelerometer Telematics / Driving Event Handler
  useEffect(() => {
    let subscription: any = null;
    if (isTracking && hasStarted) {
      Accelerometer.setUpdateInterval(100); // 10Hz sampling rate
      let lastBrakeTime = 0;
      let lastLaneChangeTime = 0;

      subscription = Accelerometer.addListener(data => {
        // Accelerations in m/s^2 (G * 9.81)
        const accY = data.y * 9.81; // forward/backward axis
        const accX = data.x * 9.81; // lateral/side-to-side axis

        // Track Top Acceleration
        if (accY > 0.1) {
          setMaxAcc(prev => Math.max(prev, accY));
        }

        // Track Deceleration & Braking
        if (accY < -0.1) {
          const decVal = Math.abs(accY);
          setMaxDec(prev => Math.max(prev, decVal));

          // Significant deceleration indicates a brake press event (> 2.0 m/s^2)
          const now = Date.now();
          if (decVal > 2.0 && now - lastBrakeTime > 2000) {
            setBrakePressedCount(prev => prev + 1);
            lastBrakeTime = now;
          }
        }

        // Detect Lane Changes (significant lateral movement > 1.8 m/s^2)
        const now = Date.now();
        if (Math.abs(accX) > 1.8 && now - lastLaneChangeTime > 3000) {
          setLaneChangesCount(prev => prev + 1);
          lastLaneChangeTime = now;
        }
      });
    }
    return () => {
      if (subscription) subscription.remove();
    };
  }, [isTracking, hasStarted]);

  // GPS Location Tracking
  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);

      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 2000,
          distanceInterval: 5,
        },
        (newLocation) => {
          const prevLoc = locationRef.current;
          setLocation(newLocation);
          if (isTrackingRef.current && hasStartedRef.current) {
            // Update Altitude
            if (newLocation.coords.altitude !== null) {
              setCurrentAltitude(Math.round(newLocation.coords.altitude));
            }

            // Update Top Speed
            const currentSpeedKmh = Math.max(0, Math.round((newLocation.coords.speed || 0) * 3.6));
            setTopSpeed(prev => Math.max(prev, currentSpeedKmh));

            // Detect Turns via GPS Heading differences
            if (prevLoc && prevLoc.coords.heading !== null && newLocation.coords.heading !== null) {
              const headingDiff = newLocation.coords.heading - prevLoc.coords.heading;
              // Normalize heading difference to range [-180, 180]
              const normalizedDiff = ((headingDiff + 180) % 360) - 180;
              
              if (Math.abs(normalizedDiff) > 45) { // Significant heading angle change
                if (normalizedDiff > 0) {
                  setRightTurnsCount(prev => prev + 1);
                } else {
                  setLeftTurnsCount(prev => prev + 1);
                }
              }
            }

            // Update route coordinates and distance
            setRouteCoordinates(prev => {
              if (prev.length > 0) {
                const lastCoord = prev[prev.length - 1];
                const newDist = getDistance(
                  lastCoord.latitude,
                  lastCoord.longitude,
                  newLocation.coords.latitude,
                  newLocation.coords.longitude
                );
                if (newDist > 0.005) { // filter GPS drift
                  setDistance(d => d + newDist);
                }
              }
              const speedVal = Math.max(0, Math.round((newLocation.coords.speed || 0) * 3.6));
              return [...prev, { latitude: newLocation.coords.latitude, longitude: newLocation.coords.longitude, speed: speedVal }];
            });

            // Speed Trap & Zone live engine checks
            (async () => {
              const currentSpeedKmh = Math.max(0, Math.round((newLocation.coords.speed || 0) * 3.6));
              
              // 1. Check Traps
              const trapResult = await GamificationEngine.checkSpeedTrap(
                newLocation.coords.latitude,
                newLocation.coords.longitude,
                currentSpeedKmh
              );
              if (trapResult) {
                setHudMessage({
                  title: 'SPEED TRAP TRIGGERED!',
                  subtitle: `${trapResult.name}: ${trapResult.speed} km/h ${trapResult.isNewRecord ? '(NEW RECORD!)' : ''}`,
                  type: 'trap'
                });
                setTimeout(() => setHudMessage(null), 4000);
              }

              // 2. Check Zones
              const zoneResult = await GamificationEngine.checkSpeedZone(
                newLocation.coords.latitude,
                newLocation.coords.longitude,
                activeZoneRef.current
              );
              if (zoneResult) {
                if (zoneResult.action === 'started') {
                  updateActiveZoneState({ id: zoneResult.zoneId, startTime: Date.now() });
                  setHudMessage({
                    title: 'SPEED ZONE ENTERED!',
                    subtitle: `Beat your time for ${zoneResult.name}!`,
                    type: 'zone_start'
                  });
                  setTimeout(() => setHudMessage(null), 4000);
                } else if (zoneResult.action === 'completed') {
                  updateActiveZoneState(null);
                  setHudMessage({
                    title: 'SPEED ZONE BEATEN!',
                    subtitle: `${zoneResult.name}: ${zoneResult.timeSecs}s ${zoneResult.isNewRecord ? '(NEW RECORD!)' : ''}`,
                    type: 'zone_end'
                  });
                  setTimeout(() => setHudMessage(null), 5000);
                }
              }
            })();
          }
        }
      );
    })();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  // Format seconds into readable timestamp (e.g. 45:56)
  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    const displayMins = mins.toString().padStart(2, '0');
    const displaySecs = secs.toString().padStart(2, '0');

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${displayMins}:${displaySecs}`;
    }
    return `${displayMins}:${displaySecs}`;
  };

  // Format Stop duration
  const formatStopsDuration = (totalSecs: number) => {
    if (totalSecs === 0) return '0s';
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  // Start Ride Handler
  const handleStartDrive = () => {
    setHasStarted(true);
    setIsTracking(true);
    setSeconds(0);
    setDistance(0);
    setTopSpeed(0);
    setBrakePressedCount(0);
    setMaxAcc(0);
    setMaxDec(0);
    setLeftTurnsCount(0);
    setRightTurnsCount(0);
    setStopsCount(0);
    setStopsDurationSecs(0);
    setLaneChangesCount(0);

    if (location && location.coords) {
      const initialSpeed = Math.max(0, Math.round((location.coords.speed || 0) * 3.6));
      setRouteCoordinates([{ latitude: location.coords.latitude, longitude: location.coords.longitude, speed: initialSpeed }]);
      if (location.coords.altitude !== null) {
        setCurrentAltitude(Math.round(location.coords.altitude));
      }
    } else {
      setRouteCoordinates([]);
    }
  };

  // End Ride & Save Handler
  const handleEndDrive = async () => {
    const finalDuration = formatTime(seconds);
    const finalDistance = `${distance.toFixed(1)} km`;
    const finalTopSpeed = `${topSpeed} km/h`;
    
    // Average Speed Calculation
    const hours = seconds / 3600;
    const avg = hours > 0 ? Math.round(distance / hours) : 0;
    const finalAvgSpeed = `${avg} km/h`;

    // G-Force Deceleration conversion
    const finalTopBrakeForce = `${(maxDec / 9.81).toFixed(2)} G`;
    const finalAltitude = `${currentAltitude} m`;

    // Save to Database
    const newDrive = await Database.addDrive({
      title: `Drive ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      distance: finalDistance,
      duration: finalDuration,
      avgSpeed: finalAvgSpeed,
      topSpeed: finalTopSpeed,
      weather: '28°C',
      car: currentCarName,
      route: routeCoordinates.length > 0 ? 'TANGERANG SELATAN' : 'LOCAL DRIVE',
      coordinates: routeCoordinates,
      // Save Telematics
      altitude: `${currentAltitude} m`,
      brakePressed: brakePressedCount,
      topAcceleration: `${maxAcc.toFixed(1)} m/s²`,
      topDeceleration: `${maxDec.toFixed(1)} m/s²`,
      laneChanges: laneChangesCount,
      topBrakeForce: finalTopBrakeForce,
      leftTurns: leftTurnsCount,
      rightTurns: rightTurnsCount,
      stopsCount: stopsCount,
      stopsDuration: formatStopsDuration(stopsDurationSecs),
    });

    // Evaluate Gamification
    const newlyAchieved = await GamificationEngine.evaluateDrive(newDrive);
    const achievedStr = JSON.stringify(newlyAchieved);

    // Reset Tracking state
    setRouteCoordinates([]);
    setSeconds(0);
    setDistance(0);
    setTopSpeed(0);
    setMaxAcc(0);
    setMaxDec(0);
    setIsTracking(false);
    setHasStarted(false);
    
    // Reload heatmap coords to include the new drive
    loadHeatmapData();

    // Navigate to celebration
    router.push({
      pathname: '/drive/celebration',
      params: { driveId: newDrive.id, newlyAchieved: achievedStr }
    });
  };

  // Get speed display
  const currentSpeed = location ? Math.max(0, Math.round((location.coords.speed || 0) * 3.6)) : 0;

  return (
    <View style={styles.container}>
      {location ? (
        <LeafletMap 
          userLocation={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          }}
          coordinates={routeCoordinates}
          mapMode={mapMode}
          showHeatmap={showHeatmap}
          heatmapData={heatmapCoords}
        />
      ) : (
        <View className="flex-1 items-center justify-center bg-[#E6E4E0]">
          <Text className="text-sf-bg">Locating...</Text>
        </View>
      )}
      
      {/* Top HUD (Current Speed & Altitude) */}
      <View className="absolute top-16 self-center bg-white/90 px-6 py-3 rounded-3xl shadow-sm items-center">
         <Text className="text-4xl font-bold text-sf-bg">{currentSpeed}</Text>
         <Text className="text-sf-gray text-[10px] font-bold tracking-wider mb-1">KM/H</Text>
         <Text className="text-sf-bg text-xs font-semibold">ALT: {currentAltitude}m</Text>
      </View>

      {/* HUD Message Banner (Traps / Zones Alerts) */}
      {hudMessage && (
        <View 
          className={`absolute top-36 left-4 right-4 p-4 rounded-2xl shadow-lg flex-row items-center border ${
            hudMessage.type === 'trap' 
              ? 'bg-[#FF9F0A]/95 border-[#FF9F0A]' 
              : hudMessage.type === 'zone_start' 
                ? 'bg-[#0A84FF]/95 border-[#0A84FF]' 
                : 'bg-[#30D158]/95 border-[#30D158]'
          }`}
        >
          <Feather 
            name={hudMessage.type === 'trap' ? 'zap' : hudMessage.type === 'zone_start' ? 'play-circle' : 'award'} 
            size={24} 
            color="#FFF" 
            style={{ marginRight: 12 }} 
          />
          <View className="flex-1">
            <Text className="text-white font-black text-sm tracking-wider uppercase">{hudMessage.title}</Text>
            <Text className="text-white text-xs font-semibold">{hudMessage.subtitle}</Text>
          </View>
        </View>
      )}


      {/* Bottom Control Panel */}
      <View className="absolute bottom-6 left-4 right-4 bg-white/95 p-5 rounded-3xl shadow-lg">
         <View className="flex-row justify-between mb-6 px-2">
            <View className="items-center">
               <Text className="text-2xl font-bold text-sf-bg">{formatTime(seconds)}</Text>
               <Text className="text-sf-gray text-xs font-bold uppercase tracking-wider">Time</Text>
            </View>
            <View className="items-center">
               <Text className="text-2xl font-bold text-sf-bg">{topSpeed}</Text>
               <Text className="text-sf-gray text-xs font-bold uppercase tracking-wider">Top KM/H</Text>
            </View>
            <View className="items-center">
               <Text className="text-2xl font-bold text-sf-bg">{distance.toFixed(1)}</Text>
               <Text className="text-sf-gray text-xs font-bold uppercase tracking-wider">KM</Text>
            </View>
         </View>

         <View className="flex-row gap-4">
            {!hasStarted ? (
              <Pressable 
                className="flex-1 bg-blue-500 py-4 rounded-2xl items-center shadow-md"
                onPress={handleStartDrive}
              >
                <Text className="text-white font-bold text-lg">Start Drive</Text>
              </Pressable>
            ) : isTracking ? (
              <Pressable 
                className="flex-1 bg-red-100 py-4 rounded-2xl items-center"
                onPress={() => setIsTracking(false)}
              >
                <Text className="text-red-500 font-bold text-lg">Pause</Text>
              </Pressable>
            ) : (
              <>
                <Pressable 
                  className="flex-1 bg-blue-100 py-4 rounded-2xl items-center"
                  onPress={() => setIsTracking(true)}
                >
                  <Text className="text-sf-blue font-bold text-lg">Resume</Text>
                </Pressable>
                <Pressable 
                  className="flex-1 bg-red-100 py-4 rounded-2xl items-center"
                  onPress={handleEndDrive}
                >
                  <Text className="text-red-500 font-bold text-lg">End</Text>
                </Pressable>
              </>
            )}
         </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E6E4E0'
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
