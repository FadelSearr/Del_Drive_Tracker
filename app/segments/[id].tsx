import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Database, SegmentData } from '@/services/Database';
import { Feather } from '@expo/vector-icons';
import LeafletMap from '@/components/LeafletMap';

export default function SegmentDetailScreen() {
  const { id } = useLocalSearchParams();
  const [segment, setSegment] = useState<SegmentData | null>(null);

  useEffect(() => {
    const load = async () => {
      const data = await Database.getAllSegments();
      const s = data.find(x => x.id === id);
      if (s) setSegment(s);
    };
    load();
  }, [id]);

  const handleDelete = () => {
    Alert.alert('Delete Zone', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await Database.deleteSegment(id as string);
        router.back();
      }}
    ]);
  };

  if (!segment) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#09090F' }}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.iconBtn}>
          <Feather name="arrow-left" size={24} color="white" />
        </Pressable>
        <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>Zone Detail</Text>
        <Pressable onPress={handleDelete} style={s.iconBtn}>
          <Feather name="trash-2" size={20} color="#EF4444" />
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }}>
        <View style={{ height: 250, backgroundColor: '#1A1A24' }}>
          {segment.coordinates && segment.coordinates.length > 0 && (
            <LeafletMap 
              interactive={false}
              userLocation={null}
              coordinates={segment.coordinates}
              showHeatmap={true}
              heatmapData={segment.coordinates}
              mapMode="free"
              autoFitBounds={true}
            />
          )}
        </View>

        <View style={{ padding: 20, gap: 24 }}>
          <View>
            <Text style={{ color: 'white', fontSize: 24, fontWeight: '800', marginBottom: 12 }}>{segment.title}</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={s.badge}>
                <Text style={s.badgeText}>{segment.type}</Text>
              </View>
              {segment.speedLimit && (
                <View style={[s.badge, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                  <Text style={[s.badgeText, { color: '#EF4444' }]}>Limit: {segment.speedLimit} km/h</Text>
                </View>
              )}
            </View>
          </View>

          {/* Stats Grid */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <View style={s.statCard}>
              <Text style={s.statLabel}>Best Time</Text>
              <Text style={s.statValue}>{segment.bestTime ? `${Math.floor(segment.bestTime / 60)}:${Math.floor(segment.bestTime % 60).toString().padStart(2, '0')}` : '--:--'}</Text>
            </View>
            <View style={s.statCard}>
              <Text style={s.statLabel}>Top Speed</Text>
              <Text style={s.statValue}>{segment.topSpeed || '--'} <Text style={{fontSize: 14, color: 'rgba(255,255,255,0.5)'}}>km/h</Text></Text>
            </View>
            <View style={s.statCard}>
              <Text style={s.statLabel}>Attempts</Text>
              <Text style={s.statValue}>{segment.attempts?.length || 0}</Text>
            </View>
            <View style={s.statCard}>
              <Text style={s.statLabel}>Avg Speed (Best)</Text>
              <Text style={s.statValue}>
                {segment.attempts?.length 
                  ? Math.round(Math.max(...segment.attempts.map(a => a.avgSpeed))) 
                  : '--'} 
                <Text style={{fontSize: 14, color: 'rgba(255,255,255,0.5)'}}> km/h</Text>
              </Text>
            </View>
          </View>

          {/* Graph Section */}
          <View style={s.graphCard}>
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '700', marginBottom: 16 }}>Attempt History</Text>
            {segment.attempts && segment.attempts.length > 0 ? (
              <View style={s.graphContainer}>
                {segment.attempts
                  .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i) // Filter duplicates by ID
                  .slice(-5)
                  .map((att, i) => {
                    const maxTime = Math.max(...segment.attempts!.map(a => a.time)) + 15;
                    const heightPct = Math.max(10, (att.time / maxTime) * 100);
                    const isBest = att.time === segment.bestTime;
                    
                    const d = new Date(att.date);
                    const label = `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;

                    return (
                      <View key={att.id} style={s.barColumn}>
                        <Text style={s.barValue}>{Math.floor(att.time / 60)}:{(att.time % 60).toString().padStart(2, '0')}</Text>
                        <View style={[s.bar, { height: `${heightPct}%`, backgroundColor: isBest ? '#4B7EFF' : 'rgba(255,255,255,0.1)' }]} />
                        <Text style={s.barLabel} numberOfLines={1}>{label}</Text>
                      </View>
                    );
                  })}
              </View>
            ) : (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <Text style={{ color: 'rgba(255,255,255,0.4)' }}>No attempts recorded yet</Text>
              </View>
            )}
          </View>
        </View>
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
  badge: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)'
  },
  badgeText: {
    color: 'white', fontSize: 12, fontWeight: '700'
  },
  statCard: {
    backgroundColor: '#141424',
    padding: 16,
    borderRadius: 16,
    width: '48%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  statLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginBottom: 8,
    fontWeight: '600'
  },
  statValue: {
    color: 'white',
    fontSize: 20,
    fontWeight: '800'
  },
  graphCard: {
    backgroundColor: '#141424',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  graphContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 150,
    paddingTop: 20,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end'
  },
  bar: {
    width: 24,
    borderRadius: 6,
    marginVertical: 8,
  },
  barValue: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600'
  },
  barLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
  }
});
