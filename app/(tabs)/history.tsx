import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Database, DriveData } from '@/services/Database';
import { Feather } from '@expo/vector-icons';
import LeafletMap from '@/components/LeafletMap';

const speedColors = ['#3B82F6', '#22C55E', '#F97316', '#EF4444'];

export default function HistoryTabScreen() {
  const [drives, setDrives] = useState<DriveData[]>([]);
  const [tab, setTab] = useState<'activities' | 'stats'>('activities');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      const allDrives = await Database.getAllDrives();
      setDrives(allDrives.reverse());
    };
    loadData();
  }, [refreshKey]);

  const handleDelete = (id: number, title: string) => {
    Alert.alert(
      "Delete Drive",
      `Are you sure you want to delete "${title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            await Database.deleteDrive(id);
            setRefreshKey(prev => prev + 1);
          }
        }
      ]
    );
  };

  const totalDistance = drives.reduce((acc, d) => acc + parseFloat(d.distance || '0'), 0).toFixed(1);
  const totalDrives = drives.length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#09090F' }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: '700' }}>History</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Your drive log</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable style={s.iconBtn}>
              <Feather name="search" size={16} color="rgba(255,255,255,0.5)" />
            </Pressable>
            <Pressable style={s.iconBtn}>
              <Feather name="sliders" size={16} color="rgba(255,255,255,0.5)" />
            </Pressable>
          </View>
        </View>

        {/* Summary Cards */}
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12 }}>
          {[
            { label: 'TOTAL DISTANCE', value: `${totalDistance} km`, color: '#4B7EFF' },
            { label: 'DRIVES', value: `${totalDrives}`, color: '#22C55E' },
            { label: 'FAVORITES', value: '0', color: '#EAB308' },
          ].map((s) => (
            <View key={s.label} style={{ flex: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center', backgroundColor: `${s.color}12`, borderWidth: 1, borderColor: `${s.color}20` }}>
              <Text style={{ fontSize: 16, color: s.color, fontWeight: '700' }}>{s.value}</Text>
              <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.5 }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Tab Switcher */}
        <View style={{ marginHorizontal: 16, marginBottom: 12, flexDirection: 'row', borderRadius: 12, padding: 4, backgroundColor: '#111120', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
          {(['activities', 'stats'] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={{ flex: 1, paddingVertical: 6, borderRadius: 8, alignItems: 'center', backgroundColor: tab === t ? '#1E1E32' : 'transparent' }}
            >
              <Text style={{ color: tab === t ? 'white' : 'rgba(255,255,255,0.35)', fontSize: 13, fontWeight: tab === t ? '600' : '400', textTransform: 'capitalize' }}>{t}</Text>
            </Pressable>
          ))}
        </View>

        {tab === 'activities' ? (
          /* Drive Cards */
          drives.length > 0 ? (
            <View style={{ paddingHorizontal: 16, gap: 12 }}>
              {drives.map((drive, idx) => {
                const color = speedColors[idx % speedColors.length];
                return (
                  <Pressable
                    key={drive.id}
                    onPress={() => router.push(`/drive/${drive.id}`)}
                    style={s.driveCard}
                  >
                    {/* Color stripe */}
                    <View style={{ height: 2, width: '100%', backgroundColor: color, opacity: 0.6 }} />
                    <View style={{ padding: 12 }}>
                      <View style={{ flexDirection: 'row', gap: 12 }}>
                        {/* Mini map */}
                        <View style={{ width: 66, height: 50, borderRadius: 10, overflow: 'hidden', backgroundColor: '#141424' }}>
                          {drive.coordinates && drive.coordinates.length > 0 ? (
                            <LeafletMap
                              interactive={false}
                              userLocation={drive.coordinates[0]}
                              coordinates={drive.coordinates}
                            />
                          ) : (
                            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                              <Feather name="map" size={16} color="rgba(255,255,255,0.2)" />
                            </View>
                          )}
                        </View>

                        {/* Info */}
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: 'white', fontSize: 14, fontWeight: '600', marginBottom: 2 }} numberOfLines={1}>{drive.title}</Text>
                          <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>{drive.date} · {drive.car}</Text>
                          <View style={{ flexDirection: 'row', gap: 16 }}>
                            {[
                              { v: drive.distance, l: 'Dist' },
                              { v: drive.duration, l: 'Time' },
                              { v: drive.avgSpeed, l: 'Avg' },
                            ].map((st) => (
                              <View key={st.l}>
                                <Text style={{ fontSize: 13, color: 'white', fontWeight: '600' }}>{st.v}</Text>
                                <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{st.l}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      </View>

                      {/* Bottom actions */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' }}>
                        <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, backgroundColor: `${color}18` }}>
                          <Text style={{ color: color, fontSize: 10, fontWeight: '600' }}>Top {drive.topSpeed}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                          <Feather name="heart" size={16} color="rgba(255,255,255,0.25)" />
                          <Feather name="share-2" size={16} color="rgba(255,255,255,0.25)" />
                          <Pressable onPress={() => drive.id !== undefined && handleDelete(drive.id, drive.title)}>
                            <Feather name="trash-2" size={16} color="#EF4444" />
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
              <Text style={{ fontSize: 48 }}>🗺️</Text>
              <Text style={{ color: 'white', fontSize: 16, fontWeight: '600', marginTop: 12 }}>No drives found</Text>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Start your first drive on the Map tab</Text>
            </View>
          )
        ) : (
          /* Stats Tab */
          <View style={{ paddingHorizontal: 16, gap: 8 }}>
            {[
              { label: 'Avg Drive Distance', value: totalDrives > 0 ? `${(parseFloat(totalDistance) / totalDrives).toFixed(1)} km` : '0 km' },
              { label: 'Total Drive Time', value: '--' },
              { label: 'Best Day', value: drives.length > 0 ? drives[0].date?.split(',')[0] || '--' : '--' },
            ].map((st) => (
              <View key={st.label} style={s.statsRow}>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{st.label}</Text>
                <Text style={{ color: 'white', fontSize: 14, fontWeight: '700' }}>{st.value}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#111120',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  driveCard: {
    backgroundColor: '#111120',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#111120',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
});
