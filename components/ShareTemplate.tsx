import { DriveData } from '@/services/Database';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Stop } from 'react-native-svg';

interface ShareTemplateProps {
  data: DriveData;
  backgroundImageUri?: string;
  videoUri?: string;
  heatmapData?: { latitude: number; longitude: number; speed?: number }[];
  animated?: boolean;
  hideBackground?: boolean;
}

const getNormalizedPoints = (
  coords: { latitude: number; longitude: number; speed?: number }[],
  width: number,
  height: number,
  padding = 28
) => {
  if (!coords || coords.length === 0)
    return { points: [], minLat: 0, minLon: 0, scale: 1 };

  let minLat = coords[0].latitude, maxLat = coords[0].latitude;
  let minLon = coords[0].longitude, maxLon = coords[0].longitude;
  coords.forEach(c => {
    if (c.latitude < minLat) minLat = c.latitude;
    if (c.latitude > maxLat) maxLat = c.latitude;
    if (c.longitude < minLon) minLon = c.longitude;
    if (c.longitude > maxLon) maxLon = c.longitude;
  });

  const latDiff = maxLat - minLat;
  const lonDiff = maxLon - minLon;
  const scaleX = (width - padding * 2) / (lonDiff || 0.0001);
  const scaleY = (height - padding * 2) / (latDiff || 0.0001);
  const scale = Math.min(scaleX, scaleY);

  const offsetX = (width - padding * 2 - lonDiff * scale) / 2;
  const offsetY = (height - padding * 2 - latDiff * scale) / 2;

  const points = coords.map(c => ({
    x: padding + offsetX + (c.longitude - minLon) * scale,
    y: height - padding - offsetY - (c.latitude - minLat) * scale,
    speed: c.speed || 0,
  }));

  return { points, minLat, minLon, scale };
};

// speed 0–1 → premium color mapping matching history
const speedToColor = (t: number) => {
  if (t < 0.1) return '#4B7EFF'; // Slow: Blue
  if (t < 0.3) return '#00D4AA'; // Low: Teal
  if (t < 0.5) return '#30D158'; // Mid: Green
  if (t < 0.7) return '#FFD60A'; // High: Yellow
  if (t < 0.9) return '#FF9F0A'; // Fast: Orange
  return '#FF3B30';              // Peak: Red
};


export default function ShareTemplate({
  data,
  backgroundImageUri,
  videoUri,
  heatmapData = [],
  animated: shouldAnimate = false,
  hideBackground = false,
}: ShareTemplateProps) {
  const width = 1080 / 3;   // 360
  const height = 1920 / 3;  // 640

  const svgWidth = width;
  const svgHeight = height * 0.55;

  const { points } = getNormalizedPoints(data.coordinates || [], svgWidth, svgHeight, 28);

  const maxSpeed = points.reduce((m, p) => Math.max(m, p.speed), 0.01);

  // Animated marker
  // eslint-disable-next-line react-hooks/refs
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!shouldAnimate || points.length < 2) return;
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 5000,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: false,
    }).start(() => {
      // loop
      Animated.timing(progress, {
        toValue: 1,
        duration: 0,
        useNativeDriver: false,
      }).start();
    });
  }, [shouldAnimate, points.length, progress]);

  // Interpolated marker position
  const hasPoints = points && points.length >= 2;
  const animInputRange = hasPoints
    ? points.map((_, i) => i / (points.length - 1))
    : [0, 1];
  const animOutputRangeX = hasPoints
    ? points.map(p => p.x)
    : [0, 0];
  const animOutputRangeY = hasPoints
    ? points.map(p => p.y)
    : [0, 0];

  // eslint-disable-next-line react-hooks/refs
  const markerX = progress.interpolate({
    inputRange: animInputRange,
    outputRange: animOutputRangeX,
    extrapolate: 'clamp',
  });
  // eslint-disable-next-line react-hooks/refs
  const markerY = progress.interpolate({
    inputRange: animInputRange,
    outputRange: animOutputRangeY,
    extrapolate: 'clamp',
  });

  const startPt = points[0];
  const endPt = points[points.length - 1];

  // Build color segments
  const segments = points.slice(0, -1).map((p, i) => {
    const next = points[i + 1];
    const t = maxSpeed > 0 ? p.speed / maxSpeed : 0;
    return { x1: p.x, y1: p.y, x2: next.x, y2: next.y, color: speedToColor(t) };
  });

  const player = useVideoPlayer(videoUri || '', (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  return (
    <View style={[s.container, { width, height, backgroundColor: hideBackground ? 'transparent' : '#0A0A12' }]}>
      {/* Dark Overlay for Video Sticker */}
      {hideBackground && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' }} />
      )}
      
      {/* Background */}
      {!hideBackground && (
        backgroundImageUri ? (
          <>
            <Image source={{ uri: backgroundImageUri }} style={s.bgImage} />
            <View style={s.bgOverlay} />
          </>
        ) : videoUri ? (
          <>
            <VideoView
              player={player}
              style={s.bgImage}
              contentFit="cover"
              nativeControls={false}
            />
            <View style={s.bgOverlay} />
          </>
        ) : (
          <View style={s.bgSolid}>
            <View style={s.bgGrid}>
              {Array.from({ length: 48 }).map((_, i) => (
                <View key={i} style={[s.gridCell, { width: width / 4, height: width / 4 },
                  i % 2 === 0 ? s.bgWhite : s.bgTransparent]} />
              ))}
            </View>
          </View>
        )
      )}


      {/* Header */}
      <View style={s.header}>
        <View style={s.logoRow}>
          <Text style={s.logoText}>DEL ROAD</Text>
        </View>
        <Text style={s.date}>{data.date}</Text>
      </View>

      {/* Track SVG */}
      <View style={[s.mapContainer, { width: svgWidth, height: svgHeight }]}>
        {points.length > 1 ? (
          <>
            <Svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
              <Defs>
                <LinearGradient id="glowGrad" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0" stopColor="#4B7EFF" stopOpacity="0.3" />
                  <Stop offset="1" stopColor="#FF3B30" stopOpacity="0.3" />
                </LinearGradient>
              </Defs>

              {/* Shadow/glow pass */}
              {segments.map((seg, i) => (
                <Line
                  key={`glow-${i}`}
                  x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2}
                  stroke={seg.color}
                  strokeWidth={10}
                  strokeLinecap="round"
                  opacity={0.2}
                />
              ))}

              {/* Main colored line */}
              {segments.map((seg, i) => (
                <Line
                  key={`seg-${i}`}
                  x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2}
                  stroke={seg.color}
                  strokeWidth={3.5}
                  strokeLinecap="round"
                />
              ))}

              {/* Start dot */}
              {startPt && (
                <Circle cx={startPt.x} cy={startPt.y} r={6} fill="#30D158" stroke="white" strokeWidth={2} />
              )}
              {/* End dot */}
              {endPt && (
                <Circle cx={endPt.x} cy={endPt.y} r={6} fill="#FF3B30" stroke="white" strokeWidth={2} />
              )}
            </Svg>

            {/* Animated marker (car dot) */}
            {shouldAnimate && (
              <Animated.View
                style={[
                  s.markerDot,
                  { transform: [{ translateX: markerX as any }, { translateY: markerY as any }] },
                ]}
              >
                <View style={s.markerInner} />
              </Animated.View>
            )}
          </>
        ) : (
          <Text style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 60 }}>
            No GPS Data
          </Text>
        )}
      </View>


      {/* Stats Grid */}
      <View style={s.statsContainer}>
        <View style={s.statRow}>
          {[
            { label: 'DISTANCE', val: data.distance?.replace(/[^0-9.]/g, '') || '0', unit: 'km' },
            { label: 'DURATION', val: data.duration || '0m', unit: '' },
          ].map(st => (
            <View key={st.label} style={s.statBox}>
              <Text style={s.statLabel}>{st.label}</Text>
              <View style={s.statValRow}>
                <Text style={s.statVal}>{st.val}</Text>
                {!!st.unit && <Text style={s.statUnit}>{st.unit}</Text>}
              </View>
            </View>
          ))}
        </View>
        <View style={[s.statRow, { marginTop: 12 }]}>
          {[
            { label: 'TOP SPEED', val: data.topSpeed?.replace(/[^0-9.]/g, '') || '0', unit: 'km/h' },
            { label: 'AVG SPEED', val: data.avgSpeed?.replace(/[^0-9.]/g, '') || '0', unit: 'km/h' },
          ].map(st => (
            <View key={st.label} style={s.statBox}>
              <Text style={s.statLabel}>{st.label}</Text>
              <View style={s.statValRow}>
                <Text style={s.statVal}>{st.val}</Text>
                <Text style={s.statUnit}>{st.unit}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Bottom brand watermark */}
      <View style={s.watermark}>
        <View style={s.watermarkDot} />
        <Text style={s.watermarkText}>Del Road • Drive Tracker</Text>
      </View>
    </View>
  );
}

const s: any = StyleSheet.create({
  container: { backgroundColor: '#0A0A12', alignItems: 'center', position: 'relative', overflow: 'hidden' },
  bgImage: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', opacity: 0.55 },
  bgOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)' },
  bgSolid: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#0A0A12' },
  bgGrid: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row', flexWrap: 'wrap', opacity: 0.07 },
  gridCell: {},
  bgWhite: { backgroundColor: 'white' },
  bgTransparent: { backgroundColor: 'transparent' },
  centerGlow: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(75,126,255,0.06)', top: '30%', left: '50%',
    transform: [{ translateX: -150 }, { translateY: -150 }],
  },
  header: { position: 'absolute', top: 44, left: 0, right: 0, alignItems: 'center' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  logoDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4B7EFF' },
  logoText: { color: 'white', fontWeight: '900', fontSize: 22, letterSpacing: 6 },
  date: { color: 'rgba(255,255,255,0.35)', fontSize: 9, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
  mapContainer: { position: 'absolute', top: 90, left: 0 },
  legend: { position: 'absolute', top: 98, right: 12, flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 7, fontWeight: '700' },
  legendBar: { flexDirection: 'row', borderRadius: 2, overflow: 'hidden' },
  legendChip: { width: 10, height: 4 },
  statsContainer: { position: 'absolute', bottom: 40, left: 24, right: 24 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: { alignItems: 'center', flex: 1 },
  statLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: '700', letterSpacing: 2, marginBottom: 2 },
  statValRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  statVal: { color: 'white', fontSize: 24, fontWeight: '900' },
  statUnit: { color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '700' },
  markerDot: {
    position: 'absolute', width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.25)', borderWidth: 2, borderColor: 'white',
    alignItems: 'center', justifyContent: 'center',
    marginLeft: -10, marginTop: -10,
    shadowColor: 'white', shadowRadius: 8, shadowOpacity: 0.8,
  },
  markerInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'white' },
  watermark: { position: 'absolute', bottom: 14, flexDirection: 'row', alignItems: 'center', gap: 6 },
  watermarkDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#4B7EFF' },
  watermarkText: { color: 'rgba(255,255,255,0.2)', fontSize: 8, fontWeight: '700', letterSpacing: 1.5 },
  dashcamBadge: {
    position: 'absolute',
    top: 110,
    left: 24,
    backgroundColor: 'rgba(239,68,68,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  dashcamBadgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
