import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { GamificationEngine, Milestone } from '@/services/GamificationEngine';
import { Database } from '@/services/Database';

export default function CelebrationScreen() {
  const { driveId, newlyAchieved } = useLocalSearchParams();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [streak, setStreak] = useState({ current: 0, best: 0 });
  const [drive, setDrive] = useState<any>(null);

  useEffect(() => {
    if (newlyAchieved) {
      try { setMilestones(JSON.parse(newlyAchieved as string)); } catch (e) {}
    }
    GamificationEngine.getStreak().then(res => setStreak(res));
    if (driveId) {
      Database.getDriveById(parseInt(driveId as string, 10)).then(d => setDrive(d));
    }
  }, [newlyAchieved, driveId]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#09090F' }}>
      {/* Green glow */}
      <View style={{ position: 'absolute', top: -60, left: '50%', marginLeft: -150, width: 300, height: 300, borderRadius: 150, backgroundColor: '#22C55E', opacity: 0.06 }} />

      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        {/* Check icon */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <View style={s.checkCircle}>
            <Feather name="check-circle" size={52} color="#22C55E" />
          </View>
        </View>

        {/* Title */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <Text style={{ color: 'white', fontSize: 28, fontWeight: '700', lineHeight: 34 }}>Drive Complete!</Text>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 6 }}>Great drive — here's your summary</Text>
        </View>

        {/* Quick stats */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          {[
            { label: 'Distance', value: drive?.distance || '--' },
            { label: 'Duration', value: drive?.duration || '--' },
            { label: 'Top', value: drive?.topSpeed || '--' },
            { label: 'Avg', value: drive?.avgSpeed || '--' },
          ].map((st) => (
            <View key={st.label} style={s.statCard}>
              <Text style={{ fontSize: 15, color: 'white', fontWeight: '700' }}>{st.value}</Text>
              <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{st.label}</Text>
            </View>
          ))}
        </View>

        {/* Streak card */}
        <View style={s.streakCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 28 }}>🔥</Text>
              <View>
                <Text style={{ color: '#EAB308', fontSize: 14, fontWeight: '700' }}>Driving Streak</Text>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>Keep it up — drive tomorrow!</Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: '#EAB308', fontSize: 28, fontWeight: '800', lineHeight: 30 }}>{streak.current}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>days</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(234,179,8,0.15)' }}>
            <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>Current: <Text style={{ color: '#EAB308', fontWeight: '700' }}>🔥 {streak.current}</Text></Text>
            <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>Best: <Text style={{ color: 'white', fontWeight: '700' }}>⭐ {streak.best}</Text></Text>
          </View>
        </View>

        {/* Milestones */}
        {milestones.length > 0 && (
          <View style={{ marginTop: 16 }}>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.6, marginBottom: 8 }}>MILESTONES UNLOCKED</Text>
            <View style={{ gap: 8 }}>
              {milestones.map(m => (
                <View key={m.id} style={s.milestoneCard}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(75,126,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                    <Feather name={m.icon as any || "award"} size={18} color="#4B7EFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: 'white', fontSize: 13, fontWeight: '600' }}>{m.title}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{m.description}</Text>
                  </View>
                  <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, backgroundColor: 'rgba(34,197,94,0.15)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)' }}>
                    <Text style={{ color: '#22C55E', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 }}>NEW</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* CTA Buttons */}
        <View style={{ marginTop: 32, gap: 12 }}>
          <Pressable style={s.primaryBtn} onPress={() => {
            if (driveId) router.replace(`/drive/${driveId}`);
            else router.replace('/(tabs)/history');
          }}>
            <Feather name="bar-chart-2" size={18} color="white" />
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>View Drive Summary</Text>
          </Pressable>
          <Pressable style={s.ghostBtn} onPress={() => router.replace('/(tabs)/map')}>
            <Feather name="map" size={16} color="rgba(255,255,255,0.7)" />
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: '600' }}>Back to Map</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  checkCircle: {
    width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(34,197,94,0.15)', borderWidth: 2, borderColor: 'rgba(34,197,94,0.3)',
  },
  statCard: {
    flex: 1, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center',
    backgroundColor: '#111120', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  streakCard: {
    borderRadius: 16, padding: 16,
    backgroundColor: 'rgba(234,179,8,0.08)', borderWidth: 1, borderColor: 'rgba(234,179,8,0.2)',
  },
  milestoneCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, paddingHorizontal: 12, paddingVertical: 12,
    backgroundColor: 'rgba(75,126,255,0.1)', borderWidth: 1, borderColor: 'rgba(75,126,255,0.2)',
  },
  primaryBtn: {
    height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 8,
    backgroundColor: '#4B7EFF',
    shadowColor: '#4B7EFF', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12,
  },
  ghostBtn: {
    height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
});
