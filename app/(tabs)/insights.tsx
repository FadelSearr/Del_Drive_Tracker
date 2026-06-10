import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, Dimensions } from 'react-native';
import { View, Text, Pressable } from '@/components/tw';
import { SafeAreaView } from 'react-native-safe-area-context';
import LeafletMap from '@/components/LeafletMap';
import { Database, DriveData } from '@/services/Database';
import { GamificationEngine, Milestone } from '@/services/GamificationEngine';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

export default function InsightsTabScreen() {
  const [drives, setDrives] = useState<DriveData[]>([]);
  const [heatmapCoords, setHeatmapCoords] = useState<{latitude: number; longitude: number}[]>([]);
  const [achievedMilestones, setAchievedMilestones] = useState<Milestone[]>([]);
  
  // Aggregate stats
  const [totalDistance, setTotalDistance] = useState(0);
  const [maxSpeedOverall, setMaxSpeedOverall] = useState(0);

  // Speed Distribution percentages (city, suburban, highway, track)
  const [speedDistribution, setSpeedDistribution] = useState({
    city: 40,
    suburban: 35,
    highway: 20,
    track: 5,
  });

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        const allDrives = await Database.getAllDrives();
        setDrives(allDrives);

        // Fetch Milestones
        const milestones = await GamificationEngine.initMilestones();
        setAchievedMilestones(milestones.filter(m => m.achieved));

        let dist = 0;
        let topS = 0;
        let coords: {latitude: number; longitude: number}[] = [];

        // Simple calculation for speed distribution profiling
        let cityScore = 0;
        let suburbanScore = 0;
        let highwayScore = 0;
        let trackScore = 0;

        allDrives.forEach(d => {
          dist += parseFloat(d.distance.split(' ')[0]) || 0;
          const ts = parseFloat(d.topSpeed.split(' ')[0]) || 0;
          const avgS = parseFloat(d.avgSpeed.split(' ')[0]) || 0;

          if (ts > topS) topS = ts;
          if (d.coordinates) {
            coords = [...coords, ...d.coordinates];
          }

          // Distribute based on average/top speeds of drives
          if (avgS < 30) {
            cityScore += 3;
            suburbanScore += 1;
          } else if (avgS < 60) {
            cityScore += 1;
            suburbanScore += 3;
            highwayScore += 1;
          } else {
            suburbanScore += 1;
            highwayScore += 3;
          }

          if (ts > 120) {
            trackScore += 2;
          }
        });

        const totalScore = (cityScore + suburbanScore + highwayScore + trackScore) || 1;
        setSpeedDistribution({
          city: Math.round((cityScore / totalScore) * 100) || 40,
          suburban: Math.round((suburbanScore / totalScore) * 100) || 35,
          highway: Math.round((highwayScore / totalScore) * 100) || 20,
          track: Math.round((trackScore / totalScore) * 100) || 5,
        });

        setTotalDistance(dist);
        setMaxSpeedOverall(topS);
        setHeatmapCoords(coords);
      };

      loadData();
    }, [])
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#E6E4E0' }}>
      <ScrollView className="flex-1">
        <View className="px-4 pt-6 pb-4">
          <Text className="text-4xl font-bold text-sf-bg mb-2">Insights</Text>
          <Text className="text-sf-gray text-base font-semibold">Your driving DNA over time.</Text>
        </View>

        {/* Global Stats */}
        <View className="flex-row px-4 gap-4 mb-6">
          <View className="flex-1 bg-white rounded-3xl p-5 shadow-sm">
            <Feather name="map" size={24} color="#0A84FF" style={{ marginBottom: 12 }} />
            <Text className="text-sf-gray text-xs font-bold uppercase tracking-wider mb-1">Total Distance</Text>
            <Text className="text-3xl font-bold text-sf-bg">{totalDistance.toFixed(1)} <Text className="text-base text-sf-gray">km</Text></Text>
          </View>
          <View className="flex-1 bg-white rounded-3xl p-5 shadow-sm">
            <Feather name="zap" size={24} color="#FF9F0A" style={{ marginBottom: 12 }} />
            <Text className="text-sf-gray text-xs font-bold uppercase tracking-wider mb-1">All-Time Top Speed</Text>
            <Text className="text-3xl font-bold text-sf-bg">{maxSpeedOverall.toFixed(0)} <Text className="text-base text-sf-gray">km/h</Text></Text>
          </View>
        </View>

        {/* Speed Distribution Profiler */}
        <View className="px-4 mb-6">
          <Text className="text-sf-bg font-bold text-xl mb-4">Speed Profile</Text>
          <View className="bg-white rounded-3xl p-6 shadow-sm">
            {/* Custom Horizontal Stacked Bar */}
            <View className="h-6 w-full bg-gray-100 rounded-full flex-row overflow-hidden mb-6">
              <View style={{ width: `${speedDistribution.city}%` }} className="h-full bg-green-400" />
              <View style={{ width: `${speedDistribution.suburban}%` }} className="h-full bg-yellow-400" />
              <View style={{ width: `${speedDistribution.highway}%` }} className="h-full bg-orange-400" />
              <View style={{ width: `${speedDistribution.track}%` }} className="h-full bg-red-500" />
            </View>

            <View className="flex-row flex-wrap justify-between gap-y-4">
              <View className="w-[45%] flex-row items-center">
                <View className="w-3 h-3 rounded-full bg-green-400 mr-2" />
                <View>
                  <Text className="text-xs text-sf-gray font-semibold">City (0-40)</Text>
                  <Text className="text-lg font-bold text-sf-bg">{speedDistribution.city}%</Text>
                </View>
              </View>
              <View className="w-[45%] flex-row items-center">
                <View className="w-3 h-3 rounded-full bg-yellow-400 mr-2" />
                <View>
                  <Text className="text-xs text-sf-gray font-semibold">Suburban (40-80)</Text>
                  <Text className="text-lg font-bold text-sf-bg">{speedDistribution.suburban}%</Text>
                </View>
              </View>
              <View className="w-[45%] flex-row items-center">
                <View className="w-3 h-3 rounded-full bg-orange-400 mr-2" />
                <View>
                  <Text className="text-xs text-sf-gray font-semibold">Highway (80-120)</Text>
                  <Text className="text-lg font-bold text-sf-bg">{speedDistribution.highway}%</Text>
                </View>
              </View>
              <View className="w-[45%] flex-row items-center">
                <View className="w-3 h-3 rounded-full bg-red-500 mr-2" />
                <View>
                  <Text className="text-xs text-sf-gray font-semibold">Track (120+)</Text>
                  <Text className="text-lg font-bold text-sf-bg">{speedDistribution.track}%</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Driving Heatmap */}
        <View className="px-4 mb-6">
          <Text className="text-sf-bg font-bold text-xl mb-4">Driving Heatmap</Text>
          <View className="w-full h-80 rounded-3xl overflow-hidden bg-gray-200 shadow-sm">
            {heatmapCoords.length > 0 ? (
              <LeafletMap 
                interactive={true}
                userLocation={heatmapCoords[0]}
                showHeatmap={true}
                heatmapData={heatmapCoords}
              />
            ) : (
              <View className="flex-1 items-center justify-center bg-white rounded-3xl">
                <Feather name="map-pin" size={36} color="#8E8E93" style={{ marginBottom: 12 }} />
                <Text className="text-sf-gray font-semibold">No telemetry coordinate history.</Text>
              </View>
            )}
          </View>
        </View>

        {/* Best Moments / Milestone Timeline */}
        <View className="px-4 mb-8">
          <Text className="text-sf-bg font-bold text-xl mb-4">Best Moments</Text>
          {achievedMilestones.length > 0 ? (
            <View className="bg-white rounded-3xl p-5 shadow-sm">
              {achievedMilestones.map((m, index) => (
                <View key={m.id} className={`flex-row items-center py-3 ${index !== 0 ? 'border-t border-gray-100' : ''}`}>
                  <View className="w-10 h-10 rounded-2xl bg-orange-100 items-center justify-center mr-4">
                    <Feather name={m.icon as any} size={20} color="#FF9F0A" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sf-bg font-bold text-base">{m.title}</Text>
                    <Text className="text-sf-gray text-xs">{m.description}</Text>
                  </View>
                  <Text className="text-xs text-sf-gray font-bold">UNLOCKED</Text>
                </View>
              ))}
            </View>
          ) : (
            <View className="bg-white rounded-3xl p-6 items-center justify-center shadow-sm">
              <Feather name="award" size={36} color="#8E8E93" style={{ marginBottom: 12 }} />
              <Text className="text-sf-gray font-semibold text-center">Complete drives to unlock milestones and streaking records.</Text>
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
