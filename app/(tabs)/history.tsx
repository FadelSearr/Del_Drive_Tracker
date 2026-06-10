import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable } from '@/components/tw';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';

import { Database, DriveData } from '@/services/Database';
import { FontAwesome } from '@expo/vector-icons';

export default function HistoryTabScreen() {
  const [drives, setDrives] = useState<DriveData[]>([]);

  useFocusEffect(
    useCallback(() => {
      const loadDrives = async () => {
        const allDrives = await Database.getAllDrives();
        // Assuming getAllDrives returns them in order, if not we could sort by date
        setDrives(allDrives.reverse()); // Show newest first
      };
      loadDrives();
    }, [])
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <ScrollView className="flex-1 bg-sf-bg px-4 pt-4">
        <Text className="text-3xl font-bold text-sf-text mb-6">Drive History</Text>

        {drives.map((drive) => (
          <Pressable 
            key={drive.id} 
            className="bg-sf-bg-2 rounded-3xl p-4 mb-4 shadow-sm"
            onPress={() => router.push(`/drive/${drive.id}`)}
          >
            <View className="flex-row justify-between items-start mb-3">
              <View>
                <Text className="text-sf-text font-bold text-lg">{drive.title}</Text>
                <Text className="text-sf-text-2 text-xs">{drive.date}</Text>
              </View>
              {!!drive.isFavorite && (
                <FontAwesome name="star" size={18} color="#FF9F0A" />
              )}
            </View>
            
            <View className="w-full h-32 bg-[#1C1C1E] rounded-xl mb-3 items-center justify-center overflow-hidden">
               {/* Map Preview Placeholder */}
               <Text className="text-sf-text-2">Map Route Preview</Text>
            </View>
            
            <View className="flex-row justify-between pt-2 border-t border-sf-gray/20">
              <View>
                <Text className="text-sf-gray text-xs uppercase">Distance</Text>
                <Text className="text-sf-text font-bold">{drive.distance}</Text>
              </View>
              <View>
                <Text className="text-sf-gray text-xs uppercase">Duration</Text>
                <Text className="text-sf-text font-bold">{drive.duration}</Text>
              </View>
              <View>
                <Text className="text-sf-gray text-xs uppercase">Avg Speed</Text>
                <Text className="text-sf-text font-bold">{drive.avgSpeed}</Text>
              </View>
            </View>
          </Pressable>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}
