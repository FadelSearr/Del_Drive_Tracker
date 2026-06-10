import React from 'react';
import { View, Text, ScrollView } from '@/components/tw';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileTabScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <ScrollView className="flex-1 bg-sf-bg px-4 pt-4">
        
        {/* Profile Header */}
        <View className="items-center mb-8 mt-4">
          <View className="w-24 h-24 bg-sf-blue rounded-full items-center justify-center mb-4">
             <Text className="text-white text-3xl font-bold">JD</Text>
          </View>
          <Text className="text-2xl font-bold text-sf-text">John Doe</Text>
          <Text className="text-sf-blue font-bold mt-1">Pro Driver • Elo 1850</Text>
        </View>

        {/* Stats Grid */}
        <View className="flex-row flex-wrap justify-between mb-8">
          <View className="w-[48%] bg-sf-bg-2 p-4 rounded-2xl mb-4">
            <Text className="text-sf-gray text-xs uppercase">Total Distance</Text>
            <Text className="text-sf-text text-xl font-bold">46,240 km</Text>
          </View>
          <View className="w-[48%] bg-sf-bg-2 p-4 rounded-2xl mb-4">
            <Text className="text-sf-gray text-xs uppercase">Max Speed</Text>
            <Text className="text-sf-text text-xl font-bold">295 km/h</Text>
          </View>
          <View className="w-[48%] bg-sf-bg-2 p-4 rounded-2xl">
            <Text className="text-sf-gray text-xs uppercase">Max G-Force</Text>
            <Text className="text-sf-text text-xl font-bold">1.4 G</Text>
          </View>
          <View className="w-[48%] bg-sf-bg-2 p-4 rounded-2xl">
            <Text className="text-sf-gray text-xs uppercase">Convoys</Text>
            <Text className="text-sf-text text-xl font-bold">12</Text>
          </View>
        </View>

        <Text className="text-xl font-bold text-sf-text mb-4">Local Leaderboard</Text>
        
        {/* Leaderboard Item */}
        <View className="flex-row items-center justify-between bg-sf-bg-2 p-4 rounded-2xl mb-2 border border-sf-blue/20">
          <View className="flex-row items-center">
            <Text className="text-sf-blue font-bold w-6">1</Text>
            <Text className="text-sf-text font-bold">John Doe</Text>
          </View>
          <Text className="text-sf-text font-bold">1850</Text>
        </View>
        
        <View className="flex-row items-center justify-between bg-sf-bg-2 p-4 rounded-2xl mb-2">
          <View className="flex-row items-center">
            <Text className="text-sf-gray font-bold w-6">2</Text>
            <Text className="text-sf-text">SpeedRacer99</Text>
          </View>
          <Text className="text-sf-text font-bold">1820</Text>
        </View>

        <View className="flex-row items-center justify-between bg-sf-bg-2 p-4 rounded-2xl mb-8">
          <View className="flex-row items-center">
            <Text className="text-sf-gray font-bold w-6">3</Text>
            <Text className="text-sf-text">DriftKing</Text>
          </View>
          <Text className="text-sf-text font-bold">1795</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
