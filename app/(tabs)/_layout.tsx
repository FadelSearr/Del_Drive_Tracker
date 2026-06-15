import React from 'react';
import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Platform, StyleSheet } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'dark';
  const themeColors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4B7EFF',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.3)',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0C0C18',
          position: 'absolute',
          borderTopColor: 'rgba(255,255,255,0.08)',
          borderTopWidth: StyleSheet.hairlineWidth,
          elevation: 0,
          shadowOpacity: 0,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '700',
          marginTop: 2,
          letterSpacing: 0.3,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'HUD',
          tabBarIcon: ({ color }) => <Feather name="activity" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => <Feather name="map" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="dashcam"
        options={{
          title: 'Dashcam',
          tabBarIcon: ({ color }) => <Feather name="video" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <Feather name="clock" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Feather name="user" size={20} color={color} />,
        }}
      />
    </Tabs>
  );
}
