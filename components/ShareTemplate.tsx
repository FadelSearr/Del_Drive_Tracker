import { Text, View, Image } from '@/components/tw';
import React from 'react';
import Svg, { Polyline, Circle } from 'react-native-svg';
import { DriveData } from '@/services/Database';

interface ShareTemplateProps {
  data: DriveData;
  backgroundImageUri?: string;
}

// Helper to normalize coordinates to SVG viewbox
const getNormalizedPoints = (coords: {latitude: number, longitude: number}[], width: number, height: number, padding: number = 20) => {
  if (!coords || coords.length === 0) return { pointsStr: '', endPoint: null };
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
  const scaleX = (width - padding * 2) / (lonDiff || 1);
  const scaleY = (height - padding * 2) / (latDiff || 1);
  const scale = Math.min(scaleX, scaleY); // Maintain aspect ratio

  const points = coords.map(c => {
    const x = padding + (c.longitude - minLon) * scale;
    const y = height - padding - (c.latitude - minLat) * scale; // Invert Y
    return `${x},${y}`;
  });
  
  const endP = coords.length > 0 ? { 
    x: padding + (coords[coords.length-1].longitude - minLon) * scale, 
    y: height - padding - (coords[coords.length-1].latitude - minLat) * scale 
  } : null;

  return { pointsStr: points.join(' '), endPoint: endP };
};

export default function ShareTemplate({ data, backgroundImageUri }: ShareTemplateProps) {
  // Typical IG Story dimensions ratio is 9:16
  const width = 1080 / 3;
  const height = 1920 / 3;
  
  const svgWidth = width * 0.85;
  const svgHeight = svgWidth;
  const { pointsStr, endPoint } = getNormalizedPoints(data.coordinates || [], svgWidth, svgHeight);

  return (
    <View style={[{ width, height }]} className="bg-[#0F0F0F] items-center relative overflow-hidden">
      
      {/* Background Photo from Gallery */}
      {backgroundImageUri ? (
        <>
          <Image 
            source={{ uri: backgroundImageUri }} 
            className="absolute inset-0 w-full h-full"
            style={{ opacity: 0.7 }}
          />
          {/* Vignette / Gradient overlay for premium feel */}
          <View className="absolute inset-0 bg-black/40" />
        </>
      ) : (
        <View className="absolute inset-0 bg-[#0F0F0F]">
          {/* Abstract Grid Pattern for empty background */}
          <View className="absolute inset-0 flex-row flex-wrap opacity-10">
             {Array.from({ length: 48 }).map((_, i) => (
               <View key={i} style={{ width: width / 4, height: width / 4 }} className={i % 2 === 0 ? 'bg-white' : 'bg-transparent'} />
             ))}
          </View>
        </View>
      )}
      
      {/* Top Header */}
      <View className="mt-16 items-center">
        <View className="px-6 py-2 border-y border-white/20">
          <Text className="text-white font-black text-3xl tracking-[0.2em] italic">OPEN ROAD</Text>
        </View>
        <Text className="text-white/50 text-[10px] font-bold tracking-widest uppercase mt-4">{data.date}</Text>
      </View>

      {/* Main Track Record (Polyline Only) */}
      <View className="flex-1 w-full justify-center items-center">
        <View className="w-[85%] aspect-square items-center justify-center">
          {pointsStr ? (
            <Svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
              <Polyline
                points={pointsStr}
                fill="none"
                stroke="#3B82F6"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {endPoint && (
                <Circle cx={endPoint.x} cy={endPoint.y} r="6" fill="white" />
              )}
            </Svg>
          ) : (
            <Text style={{color: 'rgba(255,255,255,0.3)'}}>No GPS Data</Text>
          )}
        </View>
      </View>

      {/* Stats Container - Grid Style */}
      <View className="w-full px-6 pb-12">
        <View className="bg-black/50 backdrop-blur-md rounded-[32px] p-6 border border-white/10">
          
          {/* Main Row: Distance & Time */}
          <View className="flex-row justify-between mb-6 pb-6 border-b border-white/10">
            <View>
              <Text className="text-white/40 text-[9px] font-bold tracking-[0.2em] uppercase mb-1">Distance</Text>
              <Text className="text-white font-black text-2xl italic">{data.distance}</Text>
            </View>
            <View className="items-end">
              <Text className="text-white/40 text-[9px] font-bold tracking-[0.2em] uppercase mb-1">Time</Text>
              <Text className="text-white font-black text-2xl italic">{data.duration}</Text>
            </View>
          </View>

          {/* Secondary Row: Top & Avg Speed */}
          <View className="flex-row justify-between">
            <View>
              <Text className="text-white/40 text-[9px] font-bold tracking-[0.2em] uppercase mb-1">Top Speed</Text>
              <Text className="text-white font-black text-xl italic">{data.topSpeed}</Text>
            </View>
            <View className="items-end">
              <Text className="text-white/40 text-[9px] font-bold tracking-[0.2em] uppercase mb-1">Avg Speed</Text>
              <Text className="text-white font-black text-xl italic">{data.avgSpeed}</Text>
            </View>
          </View>

        </View>

        {/* Branding Footer */}
        <View className="mt-6 flex-row items-center justify-center opacity-40">
           <View className="h-[1px] flex-1 bg-white/50" />
           <Text className="text-white text-[8px] font-bold tracking-[0.3em] mx-4 uppercase">Track Record</Text>
           <View className="h-[1px] flex-1 bg-white/50" />
        </View>
      </View>

    </View>
  );
}
