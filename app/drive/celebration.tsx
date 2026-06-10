import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView } from '@/components/tw';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { GamificationEngine, Milestone } from '@/services/GamificationEngine';

export default function CelebrationScreen() {
  const { driveId, newlyAchieved } = useLocalSearchParams();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [streak, setStreak] = useState({ current: 0, best: 0 });

  useEffect(() => {
    if (newlyAchieved) {
      try {
        setMilestones(JSON.parse(newlyAchieved as string));
      } catch (e) {
        console.error("Failed to parse newly achieved milestones", e);
      }
    }
    GamificationEngine.getStreak().then(res => setStreak(res));
  }, [newlyAchieved]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        
        <View className="items-center mb-10">
          <View className="w-24 h-24 bg-[#0A84FF]/20 rounded-full items-center justify-center mb-6">
            <Feather name="check-circle" size={48} color="#0A84FF" />
          </View>
          <Text className="text-4xl font-bold text-white mb-2">Drive Complete!</Text>
          <Text className="text-gray-400 text-center">Great job logging your recent drive.</Text>
        </View>

        {/* Streaks Card */}
        <View className="bg-[#1C1C1E] p-6 rounded-3xl mb-6 flex-row items-center justify-between">
           <View className="flex-row items-center gap-4">
              <View className="w-12 h-12 bg-[#FF9F0A]/20 rounded-full items-center justify-center">
                 <Feather name="zap" size={24} color="#FF9F0A" />
              </View>
              <View>
                 <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Current Streak</Text>
                 <Text className="text-2xl font-bold text-white">{streak.current} Days</Text>
              </View>
           </View>
           <View className="items-end">
             <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">Best</Text>
             <Text className="text-white font-bold">{streak.best}</Text>
           </View>
        </View>

        {/* Unlocked Milestones */}
        {milestones.length > 0 && (
          <View className="mb-8">
            <Text className="text-white font-bold text-lg mb-4">Milestones Unlocked</Text>
            {milestones.map(m => (
              <View key={m.id} className="bg-[#1C1C1E] p-4 rounded-2xl mb-3 flex-row items-center gap-4">
                <View className="w-12 h-12 bg-[#30D158]/20 rounded-full items-center justify-center">
                  <Feather name={m.icon as any || "award"} size={20} color="#30D158" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold text-base mb-1">{m.title}</Text>
                  <Text className="text-gray-400 text-xs">{m.description}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View className="mt-auto pt-8">
          <Pressable 
            className="bg-[#0A84FF] py-4 rounded-2xl items-center mb-4"
            onPress={() => {
              if (driveId) {
                router.replace(`/drive/${driveId}`);
              } else {
                router.replace('/(tabs)/history');
              }
            }}
          >
            <Text className="text-white font-bold text-lg">View Drive Summary</Text>
          </Pressable>
          <Pressable 
            className="py-4 rounded-2xl items-center"
            onPress={() => router.replace('/(tabs)/map')}
          >
            <Text className="text-[#0A84FF] font-bold text-lg">Back to Map</Text>
          </Pressable>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
