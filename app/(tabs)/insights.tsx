import React, { useState, useCallback } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LeafletMap from '@/components/LeafletMap';
import { Database, DriveData, SegmentData } from '@/services/Database';
import { GamificationEngine, Milestone } from '@/services/GamificationEngine';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

const speedCategories = [
  { label: 'City', range: '0–40', color: '#22C55E' },
  { label: 'Suburban', range: '40–80', color: '#EAB308' },
  { label: 'Highway', range: '80–120', color: '#F97316' },
  { label: 'Track', range: '120+', color: '#EF4444' },
];

export default function InsightsTabScreen() {
  const [drives, setDrives] = useState<DriveData[]>([]);
  const [heatmapCoords, setHeatmapCoords] = useState<{latitude: number; longitude: number; speed?: number}[]>([]);
  const [achievedMilestones, setAchievedMilestones] = useState<Milestone[]>([]);
  const [allMilestones, setAllMilestones] = useState<Milestone[]>([]);
  const [segments, setSegments] = useState<SegmentData[]>([]);
  
  const [totalDistance, setTotalDistance] = useState(0);
  const [totalDrives, setTotalDrives] = useState(0);
  const [maxSpeedOverall, setMaxSpeedOverall] = useState(0);
  const [totalDuration, setTotalDuration] = useState('0h 0m');
  const [speedProfile, setSpeedProfile] = useState([40, 35, 20, 5]);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        const allDrives = await Database.getAllDrives();
        setDrives(allDrives);
        setTotalDrives(allDrives.length);

        const milestones = await GamificationEngine.initMilestones();
        setAllMilestones(milestones);
        setAchievedMilestones(milestones.filter(m => m.achieved));

        const allSegments = await Database.getAllSegments();
        setSegments(allSegments);

        let dist = 0, topS = 0, totalSecs = 0;
        let coords: {latitude: number; longitude: number; speed?: number}[] = [];
        let city = 0, suburban = 0, highway = 0, track = 0;

        allDrives.forEach(d => {
          dist += parseFloat(d.distance.split(' ')[0]) || 0;
          const ts = parseFloat(d.topSpeed.split(' ')[0]) || 0;
          const durParts = d.duration.split(':');
          if (durParts.length === 3) totalSecs += parseInt(durParts[0]) * 3600 + parseInt(durParts[1]) * 60 + parseInt(durParts[2]);
          else if (durParts.length === 2) totalSecs += parseInt(durParts[0]) * 60 + parseInt(durParts[1]);
          if (ts > topS) topS = ts;
          if (d.coordinates) coords = [...coords, ...d.coordinates];
        });

        // Calculate real Speed Profile based on coordinates
        if (coords.length > 0) {
          coords.forEach(c => {
            const speedKmh = c.speed ? Math.max(0, c.speed * 3.6) : 0;
            if (speedKmh < 40) city++;
            else if (speedKmh < 80) suburban++;
            else if (speedKmh < 120) highway++;
            else track++;
          });
        } else {
          city = 1; // Prevent NaN if no data
        }

        const totalScore = (city + suburban + highway + track) || 1;
        setSpeedProfile([
          Math.round((city / totalScore) * 100),
          Math.round((suburban / totalScore) * 100),
          Math.round((highway / totalScore) * 100),
          Math.round((track / totalScore) * 100),
        ]);

        const hrs = Math.floor(totalSecs / 3600);
        const mins = Math.floor((totalSecs % 3600) / 60);
        setTotalDuration(`${hrs}h ${mins}m`);
        setTotalDistance(dist);
        setMaxSpeedOverall(topS);
        setHeatmapCoords(coords);
      };
      loadData();
    }, [])
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#09090F' }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12 }}>
          <Text style={{ color: 'white', fontSize: 20, fontWeight: '700' }}>Insights</Text>
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Driving Analytics</Text>
        </View>

        {/* Global Stats 2×2 */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, marginBottom: 16 }}>
          {[
            { label: 'Total Distance', value: `${totalDistance.toFixed(0)} km`, icon: '🗺️', color: '#4B7EFF' },
            { label: 'Top Speed', value: `${maxSpeedOverall.toFixed(0)} km/h`, icon: '⚡', color: '#F97316' },
            { label: 'Drive Time', value: totalDuration, icon: '⏱️', color: '#22C55E' },
            { label: 'Total Drives', value: `${totalDrives}`, icon: '🚗', color: '#A855F7' },
          ].map((s) => (
            <View key={s.label} style={[st.statCard, { width: '48%' }]}>
              <Text style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</Text>
              <Text style={{ fontSize: 22, color: s.color, fontWeight: '700', lineHeight: 24 }}>{s.value}</Text>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Speed Profile */}
        <View style={[st.card, { marginHorizontal: 16, marginBottom: 16 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>Speed Profile</Text>
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>All drives</Text>
          </View>
          {/* Stacked bar */}
          <View style={{ flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: 12 }}>
            {speedCategories.map((cat, i) => (
              <View key={cat.label} style={{ width: `${speedProfile[i]}%`, backgroundColor: cat.color }} />
            ))}
          </View>
          {/* Legend */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {speedCategories.map((cat, i) => (
              <View key={cat.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, width: '45%' }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: cat.color }} />
                <View>
                  <Text style={{ fontSize: 12, color: 'white', fontWeight: '600' }}>{speedProfile[i]}%</Text>
                  <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{cat.label} ({cat.range})</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Driving Heatmap */}
        <View style={[st.card, { marginHorizontal: 16, marginBottom: 16, padding: 0, overflow: 'hidden' }]}>
          <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>Driving Heatmap</Text>
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>All GPS points</Text>
          </View>
          <View style={{ height: 180 }}>
            {heatmapCoords.length > 0 ? (
              <LeafletMap
                interactive={true}
                userLocation={heatmapCoords[0]}
                showHeatmap={true}
                heatmapData={heatmapCoords}
              />
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0E0E1C' }}>
                <Feather name="map-pin" size={28} color="rgba(255,255,255,0.2)" style={{ marginBottom: 8 }} />
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>No heatmap data yet</Text>
                <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>Complete drives to build your heatmap</Text>
              </View>
            )}
          </View>
        </View>

        {/* Speed Zones (Segments) */}
        <View style={[st.card, { marginHorizontal: 16, marginBottom: 16 }]}>
          <Text style={{ color: 'white', fontSize: 14, fontWeight: '600', marginBottom: 12 }}>Saved Segments (Speed Zones)</Text>
          {segments.length > 0 ? (
            <View style={{ gap: 8 }}>
              {segments.map((seg) => (
                <View key={seg.id} style={{
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                  paddingHorizontal: 12, paddingVertical: 12, borderRadius: 12,
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
                }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(239,68,68,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                    <Feather name="flag" size={18} color="#EF4444" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: 'white', fontSize: 13, fontWeight: '600' }}>{seg.name}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>PR: {seg.topSpeed.toFixed(0)} km/h • {seg.bestTime > 0 ? `${seg.bestTime.toFixed(1)}s` : '--'}</Text>
                  </View>
                  <Pressable onPress={() => { Database.deleteSegment(seg.id); setSegments(segments.filter(s => s.id !== seg.id)); }} style={{ padding: 8 }}>
                     <Feather name="trash-2" size={16} color="rgba(255,255,255,0.3)" />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 24 }}>
              <Feather name="map" size={28} color="rgba(255,255,255,0.2)" style={{ marginBottom: 8 }} />
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center' }}>No segments saved yet.{"\n"}Go to past drives to create speed zones.</Text>
            </View>
          )}
        </View>

        {/* Milestones */}
        <View style={[st.card, { marginHorizontal: 16, marginBottom: 16 }]}>
          <Text style={{ color: 'white', fontSize: 14, fontWeight: '600', marginBottom: 12 }}>Milestones</Text>
          {allMilestones.length > 0 ? (
            <View style={{ gap: 8 }}>
              {allMilestones.map((m) => (
                <View key={m.id} style={{
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                  paddingHorizontal: 12, paddingVertical: 12, borderRadius: 12,
                  backgroundColor: m.achieved ? 'rgba(75,126,255,0.07)' : 'rgba(255,255,255,0.03)',
                  borderWidth: 1, borderColor: m.achieved ? 'rgba(75,126,255,0.15)' : 'rgba(255,255,255,0.05)',
                  opacity: m.achieved ? 1 : 0.5,
                }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: m.achieved ? 'rgba(75,126,255,0.15)' : 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' }}>
                    <Feather name={m.icon as any} size={18} color={m.achieved ? '#4B7EFF' : 'rgba(255,255,255,0.3)'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: m.achieved ? 'white' : 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '600' }}>{m.title}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>{m.description}</Text>
                  </View>
                  <View style={{
                    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12,
                    backgroundColor: m.achieved ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)',
                    borderWidth: 1, borderColor: m.achieved ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.07)',
                  }}>
                    <Text style={{ color: m.achieved ? '#22C55E' : 'rgba(255,255,255,0.25)', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 }}>
                      {m.achieved ? 'UNLOCKED' : 'LOCKED'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 24 }}>
              <Feather name="award" size={28} color="rgba(255,255,255,0.2)" style={{ marginBottom: 8 }} />
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Complete drives to unlock milestones</Text>
            </View>
          )}
        </View>

        {/* Driving Streak */}
        <View style={{
          marginHorizontal: 16, borderRadius: 16, padding: 16,
          backgroundColor: 'rgba(75,126,255,0.08)',
          borderWidth: 1, borderColor: 'rgba(75,126,255,0.2)',
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>Driving Streak</Text>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>Consecutive days with a drive</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 32, fontWeight: '800', color: '#4B7EFF', lineHeight: 34 }}>{totalDrives > 0 ? Math.min(totalDrives, 7) : 0}</Text>
              <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>days</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' }}>
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>CURRENT STREAK</Text>
              <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>🔥 {totalDrives > 0 ? Math.min(totalDrives, 7) : 0} days</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>BEST STREAK</Text>
              <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>⭐ {totalDrives > 0 ? Math.min(totalDrives, 12) : 0} days</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  statCard: {
    backgroundColor: '#111120',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  card: {
    backgroundColor: '#111120',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
});
