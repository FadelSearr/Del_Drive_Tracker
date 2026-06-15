import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import * as Location from 'expo-location';
import { Accelerometer } from 'expo-sensors';

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

// --- G-Force Crosshair SVG ---
function buildGForceSvg(gForce: number, tick: number): string {
  const dotX = Math.sin(tick * 0.8) * Math.min(gForce, 1.5) * 0.55;
  const dotY = Math.cos(tick * 0.6) * Math.min(gForce, 1.5) * 0.35;
  return `<svg width="72" height="72" viewBox="-1 -1 2 2">
    <circle cx="0" cy="0" r="1" fill="none" stroke="#1E2040" stroke-width="0.06" />
    <circle cx="0" cy="0" r="0.66" fill="none" stroke="#1A1C38" stroke-width="0.04" />
    <circle cx="0" cy="0" r="0.33" fill="none" stroke="#161830" stroke-width="0.03" />
    <line x1="-1" y1="0" x2="1" y2="0" stroke="#1A1C38" stroke-width="0.04" />
    <line x1="0" y1="-1" x2="0" y2="1" stroke="#1A1C38" stroke-width="0.04" />
    <circle cx="${dotX * 0.8}" cy="${dotY * 0.8}" r="0.14" fill="rgba(249,115,22,0.25)" />
    <circle cx="${dotX}" cy="${dotY}" r="0.1" fill="#F97316" />
    <circle cx="${dotX}" cy="${dotY}" r="0.05" fill="white" />
  </svg>`;
}

// --- Compass SVG ---
function buildCompassSvg(heading: number): string {
  const cardinals = [
    { d: 'N', angle: -90, color: '#EF4444' },
    { d: 'E', angle: 0, color: '#3A4060' },
    { d: 'S', angle: 90, color: '#3A4060' },
    { d: 'W', angle: 180, color: '#3A4060' },
  ];
  let labels = '';
  cardinals.forEach(c => {
    const a = c.angle * (Math.PI / 180);
    const x = 36 + Math.cos(a) * 22;
    const y = 36 + Math.sin(a) * 22 + 4;
    labels += `<text x="${x}" y="${y}" text-anchor="middle" fill="${c.color}" font-size="9" font-weight="700">${c.d}</text>`;
  });
  return `<svg width="72" height="72" viewBox="0 0 72 72">
    <circle cx="36" cy="36" r="32" fill="#0E0E1C" stroke="#1E2040" stroke-width="2" />
    ${labels}
    <g transform="rotate(${heading} 36 36)">
      <polygon points="36,10 38.5,36 36,42 33.5,36" fill="#EF4444" />
      <polygon points="36,62 38.5,36 36,30 33.5,36" fill="#2A3060" />
    </g>
    <circle cx="36" cy="36" r="4" fill="#1A1A2E" stroke="rgba(255,255,255,0.2)" stroke-width="1.5" />
  </svg>`;
}

export default function HUDTabScreen() {
  const [speed, setSpeed] = useState(0);
  const [gForce, setGForce] = useState(0.12);
  const [topSpeed, setTopSpeed] = useState(0);
  const [avgSpeed, setAvgSpeed] = useState(0);
  const [distance, setDistance] = useState(0); // in km
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const tickRef = useRef(0);
  const lastLocation = useRef<Location.LocationObject | null>(null);
  const startTime = useRef<number>(Date.now());

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;
    let accelSubscription: any = null;

    (async () => {
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
          
          setTopSpeed(prev => Math.max(prev, currentSpeedKmH));

          if (lastLocation.current) {
            // Calculate distance in km
            const R = 6371; // Radius of the earth in km
            const dLat = (location.coords.latitude - lastLocation.current.coords.latitude) * (Math.PI / 180);
            const dLon = (location.coords.longitude - lastLocation.current.coords.longitude) * (Math.PI / 180);
            const a = 
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lastLocation.current.coords.latitude * (Math.PI / 180)) * Math.cos(location.coords.latitude * (Math.PI / 180)) * 
              Math.sin(dLon / 2) * Math.sin(dLon / 2); 
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
            const d = R * c; // Distance in km
            
            setDistance(prev => {
              const newDist = prev + d;
              // Calculate avg speed
              const hoursElapsed = (Date.now() - startTime.current) / 3600000;
              if (hoursElapsed > 0) {
                setAvgSpeed(newDist / hoursElapsed);
              }
              return newDist;
            });
          }
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
      setTick(tickRef.current);
    }, 100);

    return () => {
      clearInterval(interval);
      if (locationSubscription) locationSubscription.remove();
      if (accelSubscription) accelSubscription.remove();
      Location.stopLocationUpdatesAsync('BACKGROUND_LOCATION_TASK').catch(() => {});
    };
  }, []);

  const speedColor = '#00E5FF'; // Neon blue
  const speedLabel = speed < 40 ? 'City' : speed < 80 ? 'Suburban' : speed < 120 ? 'Highway' : 'Track';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#09090F' }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
          <View>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: '700' }}>HUD</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Live Dashboard</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(34,197,94,0.12)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.25)' }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' }} />
            <Text style={{ color: '#22C55E', fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>LIVE</Text>
          </View>
        </View>

        {/* Speedometer */}
        <View style={{ alignItems: 'center', paddingTop: 24, paddingBottom: 16 }}>
          <SvgXml xml={buildSpeedometerSvg(speed)} width={320} height={320} />
        </View>

        {/* Speed Mode Badge */}
        <View style={{ alignItems: 'center', marginBottom: 12 }}>
          <View style={{ paddingHorizontal: 16, paddingVertical: 4, borderRadius: 20, backgroundColor: `${speedColor}18`, borderWidth: 1, borderColor: `${speedColor}30` }}>
            <Text style={{ color: speedColor, fontSize: 12, fontWeight: '600', letterSpacing: 0.5 }}>{speedLabel} Mode</Text>
          </View>
        </View>

        {/* Bottom Stats */}
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 8 }}>
          {[
            { label: 'G-FORCE', value: `${gForce.toFixed(2)} G` },
            { label: 'GPS LOCK', value: 'Active' },
            { label: 'ACCURACY', value: '±3 m' },
          ].map((s) => (
            <View key={s.label} style={{ flex: 1, backgroundColor: '#111120', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' }}>
              <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: 1, marginBottom: 4 }}>{s.label}</Text>
              <Text style={{ fontSize: 13, color: 'white', fontWeight: '600' }}>{s.value}</Text>
            </View>
          ))}
        </View>

        {/* Error Message */}
        {errorMsg && (
          <View style={{ marginHorizontal: 16, marginTop: 8, padding: 16, backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)' }}>
            <Text style={{ color: '#EF4444', textAlign: 'center', fontSize: 13 }}>{errorMsg}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
