import React, { useState, useEffect } from 'react';
import { View, Text } from '@/components/tw';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Accelerometer } from 'expo-sensors';

export default function HUDTabScreen() {
  const [speed, setSpeed] = useState(0);
  const [gForce, setGForce] = useState(1.0); // 1G is resting gravity
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;
    let accelSubscription: any = null;

    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        (location) => {
          // Speed is in m/s, convert to km/h
          const speedInMs = location.coords.speed || 0;
          setSpeed(Math.max(0, Math.round(speedInMs * 3.6)));
        }
      );

      Accelerometer.setUpdateInterval(500);
      accelSubscription = Accelerometer.addListener(accelerometerData => {
        // Calculate magnitude of acceleration vector
        const { x, y, z } = accelerometerData;
        const totalG = Math.sqrt(x * x + y * y + z * z);
        setGForce(parseFloat(totalG.toFixed(2)));
      });
    })();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
      if (accelSubscription) {
        accelSubscription.remove();
      }
    };
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View className="flex-1 items-center justify-center bg-sf-bg">
        {/* Speedometer */}
        <View className="items-center justify-center border-8 border-sf-blue w-64 h-64 rounded-full">
          <Text className="text-7xl font-bold text-sf-text">{speed}</Text>
          <Text className="text-xl text-sf-gray mt-2 font-mono tracking-widest">KM/H</Text>
        </View>

        {/* Telemetry Row */}
        <View className="flex-row mt-12 gap-8 w-full px-8 justify-center">
          <View className="items-center bg-sf-bg-2 p-4 rounded-2xl w-32 shadow-sm">
            <Text className="text-sf-gray text-sm uppercase tracking-wider mb-1">G-Force</Text>
            <Text className="text-2xl font-bold text-sf-text">{gForce} G</Text>
          </View>
          <View className="items-center bg-sf-bg-2 p-4 rounded-2xl w-32 shadow-sm">
            <Text className="text-sf-gray text-sm uppercase tracking-wider mb-1">Status</Text>
            <Text className="text-lg font-bold text-sf-green">REC</Text>
          </View>
        </View>

        {/* Error Message */}
        {errorMsg && (
          <View className="mt-8 p-4 bg-sf-red/20 rounded-lg">
            <Text className="text-sf-red text-center">{errorMsg}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
