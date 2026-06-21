import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, useWindowDimensions, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import * as Location from 'expo-location';
import { Accelerometer } from 'expo-sensors';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';

// --- SVG Speedometer ---
function buildSpeedometerSvg(speed: number, maxSpeed: number = 200): string {
  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const r = 130;
  const circumference = 2 * Math.PI * r;
  const arcFraction = 0.75;
  const arcLength = circumference * arcFraction;
  const normalized = Math.min(speed / maxSpeed, 1);
  const dashOffset = arcLength - normalized * arcLength;

  const color = '#00E5FF'; // Neon blue

  // Tick marks
  let ticks = '';
  for (let i = 0; i <= 20; i++) {
    const fraction = i / 20;
    const angle = (135 + fraction * 270) * (Math.PI / 180);
    const inner = r - 14;
    const major = i % 5 === 0;
    const outer = r - (major ? 24 : 16);
    const x1 = cx + Math.cos(angle) * inner;
    const y1 = cy + Math.sin(angle) * inner;
    const x2 = cx + Math.cos(angle) * outer;
    const y2 = cy + Math.sin(angle) * outer;
    ticks += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${major ? '#3A3A5C' : '#252538'}" stroke-width="${major ? 3 : 2}" />`;
  }

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <radialGradient id="innerGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#111125" />
        <stop offset="100%" stop-color="#0C0C1A" />
      </radialGradient>
      <!-- Neon Glow Filter -->
      <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="6" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <!-- Track ring -->
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#1A1A2E" stroke-width="24"
      stroke-dasharray="${arcLength} ${circumference}" stroke-dashoffset="0"
      transform="rotate(135 ${cx} ${cy})" />
    <!-- Progress ring -->
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="24"
      stroke-linecap="round" stroke-dasharray="${arcLength} ${circumference}"
      stroke-dashoffset="${dashOffset}" transform="rotate(135 ${cx} ${cy})" filter="url(#neonGlow)" />
    <!-- Tick marks -->
    ${ticks}
    <!-- Inner disc -->
    <circle cx="${cx}" cy="${cy}" r="${r - 34}" fill="url(#innerGrad)" />
    <!-- Speed value -->
    <text x="${cx}" y="${cy}" text-anchor="middle" fill="white" font-size="72" font-weight="700" font-family="system-ui">${Math.round(speed)}</text>
    <text x="${cx}" y="${cy + 24}" text-anchor="middle" fill="${color}" font-size="14" font-weight="600" font-family="system-ui" letter-spacing="3">KM/H</text>
    <!-- Color dot -->
    <circle cx="${cx}" cy="${cy + 55}" r="6" fill="${color}" filter="url(#neonGlow)" />
  </svg>`;
}


export default function HUDTabScreen() {
  const [speed, setSpeed] = useState(0);
  const [gForce, setGForce] = useState(0.12);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const navigation = useNavigation();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const [isNavHidden, setIsNavHidden] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      tabBarStyle: isNavHidden ? { display: 'none' } : { backgroundColor: '#09090F', borderTopWidth: 0, elevation: 0 },
    });
  }, [isNavHidden, navigation]);

  const tickRef = useRef(0);
  const lastLocation = useRef<Location.LocationObject | null>(null);
  const startTime = useRef<number>(0);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;
    let accelSubscription: any = null;

    (async () => {
      startTime.current = Date.now();
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }
      let bgStatus = await Location.requestBackgroundPermissionsAsync();
      if (bgStatus.status === 'granted') {
        await Location.startLocationUpdatesAsync('BACKGROUND_LOCATION_TASK', {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 1,
          foregroundService: {
            notificationTitle: 'Del Road',
            notificationBody: 'Tracking your drive in the background',
            notificationColor: '#3B82F6',
          },
        });
      }

      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        (location) => {
          const speedInMs = location.coords.speed || 0;
          const currentSpeedKmH = Math.max(0, speedInMs * 3.6);
          setSpeed(currentSpeedKmH);
          lastLocation.current = location;
        }
      );

      Accelerometer.setUpdateInterval(100);
      accelSubscription = Accelerometer.addListener(accelerometerData => {
        const { x, y, z } = accelerometerData;
        const totalG = Math.sqrt(x * x + y * y + z * z);
        setGForce(totalG);
      });
    })();

    // Tick for G-Force animation
    const interval = setInterval(() => {
      tickRef.current += 0.1;
    }, 100);

    return () => {
      clearInterval(interval);
      if (locationSubscription) locationSubscription.remove();
      if (accelSubscription) accelSubscription.remove();
      Location.stopLocationUpdatesAsync('BACKGROUND_LOCATION_TASK').catch(() => {});
    };
  }, []);

  const { hasPermission: hasCameraPermission, requestPermission: requestCameraPermission } = useCameraPermission();
  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('back');
  const device = useCameraDevice(cameraPosition);
  const [isCameraActive, setIsCameraActive] = useState(true);
  
  useEffect(() => {
    (async () => {
      if (!hasCameraPermission) {
        await requestCameraPermission();
      }
    })();
  }, [hasCameraPermission]);

  return (
    <View style={{ flex: 1, backgroundColor: '#09090F' }}>
      <StatusBar hidden={isNavHidden} translucent={true} backgroundColor="transparent" />
      {/* Background Camera */}
      {hasCameraPermission && device && isCameraActive ? (
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
          <Feather name="camera-off" size={48} color="rgba(255,255,255,0.2)" />
        </View>
      )}

      {/* Dark Gradient Overlay for better readability */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.1)' }]} pointerEvents="none" />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right', 'bottom']}>
        {/* Top Right: Camera Toggle & Nav Toggle */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, paddingTop: 12, gap: 12 }}>
          <Pressable 
            onPress={() => setIsNavHidden(!isNavHidden)}
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}
          >
            <Feather name={isNavHidden ? "maximize" : "minimize"} size={20} color="white" />
          </Pressable>

          <Pressable 
            onPress={() => setCameraPosition(p => p === 'back' ? 'front' : 'back')}
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}
          >
            <Feather name="refresh-ccw" size={20} color="white" />
          </Pressable>

          <Pressable 
            onPress={() => setIsCameraActive(!isCameraActive)}
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: isCameraActive ? 'rgba(0,0,0,0.5)' : 'rgba(239,68,68,0.8)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: isCameraActive ? 'rgba(255,255,255,0.2)' : 'rgba(239,68,68,1)' }}
          >
            <Feather name={isCameraActive ? "camera" : "camera-off"} size={20} color="white" />
          </Pressable>
        </View>

        {/* Bottom Right: Speedometer */}
        <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'flex-end', paddingBottom: 20, paddingRight: 20 }}>
          <SvgXml xml={buildSpeedometerSvg(speed)} width={140} height={140} />
        </View>

        {/* Error Message */}
        {errorMsg && (
          <View style={{ position: 'absolute', bottom: 20, left: 20, right: 180, padding: 12, backgroundColor: 'rgba(239,68,68,0.8)', borderRadius: 12 }}>
            <Text style={{ color: 'white', textAlign: 'center', fontSize: 12, fontWeight: '600' }}>{errorMsg}</Text>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}
