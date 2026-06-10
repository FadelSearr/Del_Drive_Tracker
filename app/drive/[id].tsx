import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { View, Text, Pressable, Image } from '@/components/tw';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import LeafletMap from '@/components/LeafletMap';
import { Feather } from '@expo/vector-icons';
import ShareTemplate from '@/components/ShareTemplate';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { FontAwesome } from '@expo/vector-icons';
import { Modal } from 'react-native';

// Safe require for Expo Image Picker to prevent crash in Expo Go
let ImagePicker: any = null;
try {
  ImagePicker = require('expo-image-picker');
} catch (e) {
  console.warn("ImagePicker not available");
}

const isImagePickerAvailable = !!(ImagePicker && ImagePicker.launchImageLibraryAsync);

import { Database, DriveData } from '@/services/Database';

export default function DriveDetailScreen() {
  const { id } = useLocalSearchParams();
  const viewShotRef = useRef<any>(null);
  const [driveData, setDriveData] = useState<DriveData | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<'dark' | 'light' | 'neon'>('dark');
  const [isFavorite, setIsFavorite] = useState(false);
  const [distMode, setDistMode] = useState<'time' | 'distance'>('time');
  const [showShareModal, setShowShareModal] = useState(false);
  const [bgImage, setBgImage] = useState<string | undefined>(undefined);

  useEffect(() => {
    const loadDrive = async () => {
      if (id) {
        const data = await Database.getDriveById(Number(id));
        setDriveData(data);
        setIsFavorite(!!data?.isFavorite);
      }
    };
    loadDrive();
  }, [id]);

  const handleToggleFavorite = async () => {
    if (driveData?.id) {
      const newState = await Database.toggleFavorite(driveData.id);
      setIsFavorite(newState);
    }
  };

  const pickImage = async () => {
    if (!ImagePicker || !isImagePickerAvailable) {
      Alert.alert(
        "Feature Unavailable", 
        "Gallery access is not available in this Expo Go session. Please restart your server or use a Development Build."
      );
      return;
    }

    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 1,
      });

      if (!result.canceled) {
        setBgImage(result.assets[0].uri);
      }
    } catch (e) {
      console.error("ImagePicker Error:", e);
    }
  };

  const handleShare = async () => {
    try {
      if (viewShotRef.current && viewShotRef.current.capture) {
        const uri = await viewShotRef.current.capture();
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: 'Share your drive',
          });
        } else {
          Alert.alert("Sharing isn't available on this platform");
        }
      }
    } catch (err) {
      console.error("Error capturing view:", err);
      Alert.alert("Error", "Could not create share image");
    }
  };

  if (!driveData) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#E6E4E0', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0A84FF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#E6E4E0' }}>
      
      {/* Hidden Share Template for ViewShot to capture */}
      <View style={{ position: 'absolute', top: -10000, left: -10000 }}>
         <ViewShot ref={viewShotRef} options={{ format: "png", quality: 1.0 }}>
            <ShareTemplate data={driveData} backgroundImageUri={bgImage} />
         </ViewShot>
      </View>

      <ScrollView className="flex-1">
        {/* Header */}
        <View className="flex-row justify-between items-center px-4 pt-2 pb-4">
          <Pressable onPress={() => router.back()} className="p-2">
            <Feather name="chevron-left" size={24} color="#1C1C1E" />
          </Pressable>
          <Text className="text-sf-bg font-bold text-lg">{driveData.date}</Text>
          <Pressable onPress={handleToggleFavorite} className="p-2">
            <FontAwesome 
              name={isFavorite ? "star" : "star-o"} 
              size={22} 
              color={isFavorite ? "#FF9F0A" : "#1C1C1E"} 
            />
          </Pressable>
        </View>

        {/* Static Map View */}
        <View className="mx-4 h-64 rounded-3xl overflow-hidden mb-6 bg-gray-300">
           <LeafletMap 
             interactive={false}
             userLocation={driveData.coordinates && driveData.coordinates.length > 0 ? driveData.coordinates[0] : null}
             coordinates={driveData.coordinates || []}
           />
        </View>

        {/* Stats Grid */}
        <View className="px-6 mb-8">
           <View className="flex-row justify-between mb-8">
             <View>
               <Text className="text-sf-gray text-xs font-bold uppercase tracking-wider mb-1">Time</Text>
               <Text className="text-3xl font-bold text-sf-bg">{driveData.duration}</Text>
             </View>
             <View>
               <Text className="text-sf-gray text-xs font-bold uppercase tracking-wider mb-1">Distance</Text>
               <Text className="text-3xl font-bold text-sf-bg">{driveData.distance}</Text>
             </View>
           </View>

           <View className="flex-row justify-between">
             <View>
               <Text className="text-sf-gray text-xs font-bold uppercase tracking-wider mb-1">Top KM/H</Text>
               <Text className="text-3xl font-bold text-sf-bg">{driveData.topSpeed}</Text>
             </View>
             <View>
               <Text className="text-sf-gray text-xs font-bold uppercase tracking-wider mb-1">Avg KM/H</Text>
               <Text className="text-3xl font-bold text-sf-bg">{driveData.avgSpeed}</Text>
             </View>
             <View>
               <Text className="text-sf-gray text-xs font-bold uppercase tracking-wider mb-1">Weather</Text>
               <Text className="text-3xl font-bold text-sf-bg">{driveData.weather}</Text>
             </View>
           </View>
        </View>

         {/* Vehicle Info */}
         <View className="px-6 mb-8">
            <Text className="text-sf-gray text-xs font-bold uppercase tracking-wider mb-2">Vehicle</Text>
            <Text className="text-xl font-bold text-sf-bg">{driveData.car}</Text>
         </View>

         {/* Driving Telematics Report */}
         <View className="px-6 mb-8">
            <Text className="text-sf-bg font-bold text-lg mb-4">Driving Telematics</Text>
            <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex-row flex-wrap justify-between gap-y-4">
               
               <View className="w-[45%]">
                  <Text className="text-sf-gray text-[10px] font-bold uppercase tracking-wider mb-1">Brake Pressed</Text>
                  <Text className="text-lg font-bold text-sf-bg">{driveData.brakePressed ?? 0} times</Text>
               </View>
               
               <View className="w-[45%]">
                  <Text className="text-sf-gray text-[10px] font-bold uppercase tracking-wider mb-1">Top Brake Force</Text>
                  <Text className="text-lg font-bold text-sf-bg">{driveData.topBrakeForce ?? '0.0 G'}</Text>
               </View>
               
               <View className="w-[45%]">
                  <Text className="text-sf-gray text-[10px] font-bold uppercase tracking-wider mb-1">Top Acceleration</Text>
                  <Text className="text-lg font-bold text-sf-bg">{driveData.topAcceleration ?? '0.0 m/s²'}</Text>
               </View>
               
               <View className="w-[45%]">
                  <Text className="text-sf-gray text-[10px] font-bold uppercase tracking-wider mb-1">Top Deceleration</Text>
                  <Text className="text-lg font-bold text-sf-bg">{driveData.topDeceleration ?? '0.0 m/s²'}</Text>
               </View>
               
               <View className="w-[45%]">
                  <Text className="text-sf-gray text-[10px] font-bold uppercase tracking-wider mb-1">Turns (L / R)</Text>
                  <Text className="text-lg font-bold text-sf-bg">{driveData.leftTurns ?? 0}L / {driveData.rightTurns ?? 0}R</Text>
               </View>

               <View className="w-[45%]">
                  <Text className="text-sf-gray text-[10px] font-bold uppercase tracking-wider mb-1">Lane Changes</Text>
                  <Text className="text-lg font-bold text-sf-bg">{driveData.laneChanges ?? 0} times</Text>
               </View>

               <View className="w-[45%]">
                  <Text className="text-sf-gray text-[10px] font-bold uppercase tracking-wider mb-1">Stops</Text>
                  <Text className="text-lg font-bold text-sf-bg">{driveData.stopsCount ?? 0} ({driveData.stopsDuration ?? '0s'})</Text>
               </View>

               <View className="w-[45%]">
                  <Text className="text-sf-gray text-[10px] font-bold uppercase tracking-wider mb-1">Altitude</Text>
                  <Text className="text-lg font-bold text-sf-bg">{driveData.altitude ?? '0 m'}</Text>
               </View>

            </View>
         </View>

          {/* Speed Distribution Section */}
          <View className="px-6 mb-8">
            <View className="flex-row justify-between items-end mb-4">
              <Text className="text-sf-bg font-bold text-lg">Speed Distribution</Text>
              <View className="bg-gray-200 p-1 rounded-xl flex-row">
                <Pressable 
                  onPress={() => setDistMode('time')}
                  className={`px-3 py-1 rounded-lg ${distMode === 'time' ? 'bg-white shadow-sm' : ''}`}
                >
                  <Text className={`text-[10px] font-bold ${distMode === 'time' ? 'text-sf-bg' : 'text-sf-gray'}`}>Time</Text>
                </Pressable>
                <Pressable 
                  onPress={() => setDistMode('distance')}
                  className={`px-3 py-1 rounded-lg ${distMode === 'distance' ? 'bg-white shadow-sm' : ''}`}
                >
                  <Text className={`text-[10px] font-bold ${distMode === 'distance' ? 'text-sf-bg' : 'text-sf-gray'}`}>Distance</Text>
                </Pressable>
              </View>
            </View>

            {(() => {
              // Parse topSpeed string (e.g., "120 km/h")
              const topSpeedNum = parseInt(driveData.topSpeed) || 100;
              
              // Dynamic ranges based on topSpeed
              // 0-20%, 20-40%, 40-60%, 60-80%, 80%+
              const step = topSpeedNum / 5;
              const ranges = [
                { label: `0–${Math.round(step)}`, min: 0, max: step, color: '#0A84FF' },
                { label: `${Math.round(step)}–${Math.round(step * 2)}`, min: step, max: step * 2, color: '#30D158' },
                { label: `${Math.round(step * 2)}–${Math.round(step * 3)}`, min: step * 2, max: step * 3, color: '#FF9F0A' },
                { label: `${Math.round(step * 3)}–${Math.round(step * 4)}`, min: step * 3, max: step * 4, color: '#FF3B30' },
                { label: `${Math.round(step * 4)}+`, min: step * 4, max: 9999, color: '#AF52DE' },
              ];

              const coords = driveData.coordinates || [];
              if (coords.length === 0) return null;

              // Calculate Time Distribution
              // Total duration from driveData string (e.g. "12:45")
              const durationParts = driveData.duration.split(':').map(Number);
              const totalSeconds = durationParts.length === 3 
                ? durationParts[0] * 3600 + durationParts[1] * 60 + durationParts[2]
                : durationParts[0] * 60 + durationParts[1];
              
              const stats = ranges.map(r => ({ ...r, count: 0, distance: 0 }));
              
              // Simplistic estimation: coordinates are sampled every ~2s
              coords.forEach((c, idx) => {
                const speed = c.speed || 0;
                const rangeIdx = ranges.findIndex(r => speed >= r.min && speed < r.max);
                if (rangeIdx !== -1) {
                  stats[rangeIdx].count += 1;
                  
                  // Distance contribution
                  if (idx > 0) {
                    const prev = coords[idx-1];
                    const R = 6371;
                    const dLat = (c.latitude - prev.latitude) * Math.PI / 180;
                    const dLon = (c.longitude - prev.longitude) * Math.PI / 180;
                    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                              Math.cos(prev.latitude * Math.PI / 180) * Math.cos(c.latitude * Math.PI / 180) * 
                              Math.sin(dLon/2) * Math.sin(dLon/2);
                    const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                    stats[rangeIdx].distance += dist;
                  }
                }
              });

              const totalPoints = coords.length;
              const totalDist = stats.reduce((acc, s) => acc + s.distance, 0);

              const processed = stats.map(s => {
                const percent = distMode === 'time' 
                  ? (totalPoints > 0 ? (s.count / totalPoints) * 100 : 0)
                  : (totalDist > 0 ? (s.distance / totalDist) * 100 : 0);
                
                const timeSecs = (s.count / totalPoints) * totalSeconds;
                const m = Math.floor(timeSecs / 60);
                const sRem = Math.floor(timeSecs % 60);
                const timeStr = `${m}m ${sRem}s`;
                
                return { ...s, percent, timeStr };
              });

              const dominant = [...processed].sort((a, b) => b.percent - a.percent)[0];

              return (
                <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                  <Text className="text-sf-gray text-xs font-semibold mb-3">
                    Dominant: {dominant.label} km/h • {Math.round(dominant.percent)}%
                  </Text>
                  
                  {/* Multi-segment Progress Bar */}
                  <View className="h-2 w-full bg-gray-100 rounded-full overflow-hidden flex-row mb-6">
                    {processed.map((p, i) => (
                      <View 
                        key={i} 
                        style={{ width: `${p.percent}%`, backgroundColor: p.color }} 
                        className="h-full"
                      />
                    ))}
                  </View>

                  <View className="gap-y-4">
                    {processed.map((p, i) => (
                      <View key={i} className={`flex-row items-center justify-between p-2 rounded-xl ${dominant.label === p.label ? 'bg-gray-50' : ''}`}>
                        <View className="flex-row items-center">
                          <View style={{ backgroundColor: p.color }} className="w-2 h-2 rounded-full mr-3" />
                          <Text className="text-sf-bg font-bold text-sm">{p.label} km/h</Text>
                        </View>
                        <View className="flex-row items-center">
                          <Text className="text-sf-gray text-xs font-bold mr-4">{Math.round(p.percent)}%</Text>
                          <Text className="text-sf-gray text-xs w-16 text-right">{p.timeStr}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })()}
          </View>

         {/* Photos Section */}
        <View className="px-6 mb-8">
           <Text className="text-sf-bg font-bold text-lg mb-4">Photos</Text>
           <View className="flex-row gap-4">
              <View className="w-24 h-24 bg-gray-300 rounded-2xl items-center justify-center">
                 <Feather name="plus" size={24} color="#8E8E93" />
              </View>
           </View>
        </View>

      </ScrollView>

      {/* Card Style Selector */}
      <View className="px-4 py-3 bg-white border-t border-gray-100 flex-row justify-between items-center">
         <Text className="text-sf-bg font-bold text-sm">Card Style</Text>
         <View className="flex-row gap-2">
            {(['dark', 'light', 'neon'] as const).map((styleOpt) => (
              <Pressable
                key={styleOpt}
                onPress={() => setSelectedStyle(styleOpt)}
                className={`px-3 py-1.5 rounded-xl border ${selectedStyle === styleOpt ? 'bg-sf-bg border-sf-bg' : 'bg-gray-50 border-gray-200'}`}
              >
                <Text className={`text-xs font-bold capitalize ${selectedStyle === styleOpt ? 'text-white' : 'text-sf-gray'}`}>
                  {styleOpt}
                </Text>
              </Pressable>
            ))}
         </View>
      </View>

      {/* Bottom Action Bar */}
      <View className="p-4 bg-white border-t border-gray-200 flex-row gap-4">
         <Pressable 
            className="flex-1 bg-gray-100 py-4 rounded-2xl items-center flex-row justify-center"
            onPress={() => setShowShareModal(true)}
         >
            <Feather name="share" size={20} color="#1C1C1E" style={{ marginRight: 8 }} />
            <Text className="text-sf-bg font-bold text-lg">Share Card</Text>
         </Pressable>
      </View>

      {/* Share Preview Modal */}
      <Modal
        visible={showShareModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowShareModal(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#E6E4E0' }}>
          <View className="flex-row justify-between items-center px-4 py-4">
            <Pressable onPress={() => setShowShareModal(false)} className="p-2 bg-white rounded-full">
              <Feather name="x" size={20} color="#1C1C1E" />
            </Pressable>
            <Text className="text-sf-bg font-bold">Share Preview</Text>
            <View className="w-10" />
          </View>

          <ScrollView contentContainerClassName="items-center pb-10">
            {/* Card Preview */}
            <View className="shadow-2xl rounded-[32px] overflow-hidden bg-black mb-8">
              <ViewShot ref={viewShotRef} options={{ format: "png", quality: 1.0 }}>
                <ShareTemplate data={driveData} backgroundImageUri={bgImage} />
              </ViewShot>
            </View>

            {/* Controls */}
            <View className="w-full px-8 items-center">
              <Text className="text-sf-gray text-xs font-bold uppercase mb-4">Customize Background</Text>
              
              <View className="flex-row gap-6 mb-10">
                <Pressable 
                  onPress={() => setBgImage(undefined)}
                  className={`w-12 h-12 rounded-full items-center justify-center border-2 ${!bgImage ? 'border-sf-blue bg-white' : 'border-gray-300 bg-gray-100'}`}
                >
                  <Feather name="grid" size={20} color={!bgImage ? '#0A84FF' : '#8E8E93'} />
                </Pressable>

                <Pressable 
                  onPress={pickImage}
                  className={`w-12 h-12 rounded-full items-center justify-center border-2 ${bgImage ? 'border-sf-blue bg-white' : 'border-gray-300 bg-gray-100'}`}
                >
                  <Feather name="image" size={20} color={bgImage ? '#0A84FF' : '#8E8E93'} />
                </Pressable>
              </View>

              <View className="flex-row gap-4 w-full">
                <Pressable 
                  className="flex-1 bg-sf-bg py-4 rounded-2xl items-center border border-gray-200"
                  onPress={() => setShowShareModal(false)}
                >
                  <Text className="text-white font-bold">Cancel</Text>
                </Pressable>
                <Pressable 
                  className="flex-1 bg-sf-blue py-4 rounded-2xl items-center shadow-lg"
                  onPress={handleShare}
                >
                  <Text className="text-white font-bold">Share Now</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
