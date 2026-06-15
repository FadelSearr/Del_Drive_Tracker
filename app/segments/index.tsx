import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Database, SegmentData } from '@/services/Database';
import { Feather } from '@expo/vector-icons';

export default function SegmentsListScreen() {
  const [segments, setSegments] = useState<SegmentData[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await Database.getAllSegments();
      setSegments(data);
    };
    load();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#09090F' }}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.iconBtn}>
          <Feather name="arrow-left" size={24} color="white" />
        </Pressable>
        <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>Segments & Speed Zones</Text>
        <Pressable onPress={() => router.push('/segments/create' as any)} style={s.iconBtn}>
          <Feather name="plus" size={24} color="#4B7EFF" />
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16 }}>
        {segments.length === 0 ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
            <Feather name="flag" size={48} color="rgba(255,255,255,0.2)" />
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '600', marginTop: 16 }}>No segments yet</Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4, textAlign: 'center' }}>
              Create a speed zone or segment to track your times and stay within speed limits.
            </Text>
          </View>
        ) : (
          segments.map(seg => (
            <Pressable key={seg.id} onPress={() => router.push(`/segments/${seg.id}` as any)} style={s.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>{seg.title}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{seg.type}</Text>
                </View>
                <Feather name="chevron-right" size={20} color="rgba(255,255,255,0.3)" />
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)'
  },
  iconBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center'
  },
  card: {
    backgroundColor: '#111120', padding: 16, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'
  }
});
