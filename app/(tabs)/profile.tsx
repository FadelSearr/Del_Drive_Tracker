import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Database } from '@/services/Database';
import { GamificationEngine } from '@/services/GamificationEngine';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

export default function ProfileTabScreen() {
  const [totalDistance, setTotalDistance] = useState(0);
  const [maxSpeed, setMaxSpeed] = useState(0);
  const [totalDrives, setTotalDrives] = useState(0);
  const [maxGForce, setMaxGForce] = useState(0);
  const [achievedCount, setAchievedCount] = useState(0);
  const [totalMilestones, setTotalMilestones] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const loadStats = async () => {
        const allDrives = await Database.getAllDrives();
        setTotalDrives(allDrives.length);
        let dist = 0, topS = 0, topG = 0;
        allDrives.forEach(d => {
          dist += parseFloat(d.distance.split(' ')[0]) || 0;
          const ts = parseFloat(d.topSpeed.split(' ')[0]) || 0;
          if (ts > topS) topS = ts;
          if (d.topDeceleration) {
            const decel = parseFloat(d.topDeceleration.split(' ')[0]);
            if (!isNaN(decel)) { const g = decel / 9.81; if (g > topG) topG = g; }
          }
        });
        setTotalDistance(dist);
        setMaxSpeed(topS);
        setMaxGForce(topG);

        const milestones = await GamificationEngine.initMilestones();
        setTotalMilestones(milestones.length);
        setAchievedCount(milestones.filter(m => m.achieved).length);
      };
      loadStats();
    }, [])
  );

  const menuItems = [
    { icon: 'settings' as const, label: 'Settings', sub: 'App preferences & notifications' },
    { icon: 'download' as const, label: 'Export Data', sub: 'Download all drives as JSON' },
    { icon: 'info' as const, label: 'About Del Road', sub: 'Version 1.0.0 · FadelSearr' },
  ];

  const achievementPct = totalMilestones > 0 ? (achievedCount / totalMilestones) * 100 : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#09090F' }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
          <Text style={{ color: 'white', fontSize: 20, fontWeight: '700' }}>Profile</Text>
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Your driver dashboard</Text>
        </View>

        {/* Avatar */}
        <View style={{ alignItems: 'center', paddingBottom: 20 }}>
          <View style={{ position: 'relative', marginBottom: 12 }}>
            <View style={st.avatar}>
              <Text style={{ fontSize: 28, fontWeight: '800', color: 'white', letterSpacing: -1 }}>FS</Text>
            </View>
            <View style={st.proBadge}>
              <Text style={{ color: 'white', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 }}>PRO</Text>
            </View>
          </View>
          <Text style={{ color: 'white', fontSize: 20, fontWeight: '700' }}>FadelSearr</Text>
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Pro Driver · Jakarta, ID</Text>

          {/* Streak badge */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(234,179,8,0.1)', borderWidth: 1, borderColor: 'rgba(234,179,8,0.2)' }}>
            <Text style={{ fontSize: 16 }}>🔥</Text>
            <Text style={{ color: '#EAB308', fontSize: 13, fontWeight: '600' }}>{totalDrives > 0 ? Math.min(totalDrives, 7) : 0}-day streak</Text>
            <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>· Best: {totalDrives > 0 ? Math.min(totalDrives, 12) : 0}</Text>
          </View>
        </View>

        {/* Stats 2×2 */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, marginBottom: 16 }}>
          {[
            { label: 'Total Distance', value: `${totalDistance.toFixed(1)} km`, icon: '🗺️', color: '#4B7EFF' },
            { label: 'Max Speed', value: `${maxSpeed} km/h`, icon: '⚡', color: '#F97316' },
            { label: 'Total Drives', value: `${totalDrives}`, icon: '🚗', color: '#22C55E' },
            { label: 'Max G-Force', value: maxGForce > 0 ? `${maxGForce.toFixed(2)} G` : '— G', icon: '💥', color: '#A855F7' },
          ].map((s) => (
            <View key={s.label} style={[st.statCard, { width: '48%' }]}>
              <Text style={{ fontSize: 24, marginBottom: 4 }}>{s.icon}</Text>
              <Text style={{ fontSize: 20, color: s.color, fontWeight: '700', lineHeight: 22 }}>{s.value}</Text>
              <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Achievements bar */}
        <View style={[st.card, { marginHorizontal: 16, marginBottom: 16 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>Achievements</Text>
            <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>{achievedCount} / {totalMilestones} unlocked</Text>
          </View>
          <View style={{ height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.08)' }}>
            <View style={{ height: '100%', borderRadius: 4, width: `${achievementPct}%`, backgroundColor: '#4B7EFF' }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            {['🏅', '⚡', '🗺️', '🪶'].map((icon, i) => (
              <View key={i} style={{
                width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
                backgroundColor: i < achievedCount ? 'rgba(75,126,255,0.15)' : 'rgba(255,255,255,0.05)',
                borderWidth: 1, borderColor: i < achievedCount ? 'rgba(75,126,255,0.25)' : 'rgba(255,255,255,0.07)',
                opacity: i < achievedCount ? 1 : 0.35,
              }}>
                <Text style={{ fontSize: 18 }}>{icon}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={{ paddingHorizontal: 16, gap: 8 }}>
          <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', letterSpacing: 0.8, marginBottom: 4 }}>QUICK ACTIONS</Text>
          {menuItems.map((item) => (
            <Pressable key={item.label} style={st.menuItem}>
              <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(75,126,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                <Feather name={item.icon} size={17} color="#4B7EFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>{item.label}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>{item.sub}</Text>
              </View>
              <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.2)" />
            </Pressable>
          ))}
        </View>

        {/* App branding */}
        <View style={{ alignItems: 'center', paddingTop: 24, gap: 4 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.2)' }}>🚗 Del Road</Text>
          <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.12)' }}>Built with ❤️ using React Native & Expo</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  avatar: {
    width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#4B7EFF',
    shadowColor: '#4B7EFF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 15,
  },
  proBadge: {
    position: 'absolute', bottom: -4, right: -4,
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12,
    backgroundColor: '#F97316', borderWidth: 1.5, borderColor: '#09090F',
  },
  statCard: {
    backgroundColor: '#111120', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  card: {
    backgroundColor: '#111120', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16,
    backgroundColor: '#111120', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
});
