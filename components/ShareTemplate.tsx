import { Text, View, Image } from '@/components/tw';
import React from 'react';
import LeafletMap from '@/components/LeafletMap';
import { DriveData } from '@/services/Database';

interface ShareTemplateProps {
  data: DriveData;
  backgroundImageUri?: string;
}

export default function ShareTemplate({ data, backgroundImageUri }: ShareTemplateProps) {
  // Typical IG Story dimensions ratio is 9:16
  const width = 1080 / 3;
  const height = 1920 / 3;

  return (
    <View style={[{ width, height }]} className="bg-[#0F0F0F] items-center relative overflow-hidden">
      
      {/* Background Photo from Gallery */}
      {backgroundImageUri && (
        <>
          <Image 
            source={{ uri: backgroundImageUri }} 
            className="absolute inset-0 w-full h-full"
            style={{ opacity: 0.6 }}
          />
          {/* Subtle gradient overlay to ensure text contrast */}
          <View className="absolute inset-0 bg-black/30" />
        </>
      )}

      {/* Grid pattern overlay (chess-like) if no background is set, or as a texture */}
      {!backgroundImageUri && (
        <View className="absolute inset-0 flex-row flex-wrap opacity-10">
           {Array.from({ length: 24 }).map((_, i) => (
             <View key={i} style={{ width: width / 3, height: width / 3 }} className={i % 2 === 0 ? 'bg-white' : 'bg-transparent'} />
           ))}
        </View>
      )}
      
      {/* Top Header */}
      <View className="mt-20 items-center">
        <Text className="text-white font-black text-4xl tracking-[0.1em] italic">OPEN ROAD</Text>
      </View>

      {/* Main Track Record (Polyline Only) */}
      <View className="flex-1 w-full justify-center items-center">
        <View className="w-[85%] aspect-square pointer-events-none">
          <LeafletMap 
            interactive={false}
            coordinates={data.coordinates || []}
          />
        </View>
      </View>

      {/* Bottom Stats Container */}
      <View className="w-full px-8 pb-16">
        <View className="flex-row justify-between items-end">
            
            <View className="items-center">
                <Text className="text-gray-400 text-[10px] font-bold tracking-widest uppercase mb-2">Distance</Text>
                <Text className="text-white font-black text-xl italic">{data.distance.toUpperCase()}</Text>
            </View>

            <View className="items-center">
                <Text className="text-gray-400 text-[10px] font-bold tracking-widest uppercase mb-2">Duration</Text>
                <Text className="text-white font-black text-xl italic">{data.duration}</Text>
            </View>

            <View className="items-center">
                <Text className="text-gray-400 text-[10px] font-bold tracking-widest uppercase mb-2">Avg Speed</Text>
                <Text className="text-white font-black text-xl italic">{data.avgSpeed.toUpperCase()}</Text>
            </View>

        </View>
      </View>

    </View>
  );
}
