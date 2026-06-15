import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Database, VehicleData } from '@/services/Database';
import { GamificationEngine, Milestone } from '@/services/GamificationEngine';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

export default function ProfileTabScreen() {
  const [totalDistance, setTotalDistance] = useState(0);
  const [maxSpeed, setMaxSpeed] = useState(0);
  const [totalDrives, setTotalDrives] = useState(0);
  const [maxGForce, setMaxGForce] = useState(0);
  
  const [achievedCount, setAchievedCount] = useState(0);
  const [totalMilestones, setTotalMilestones] = useState(0);
  const [allMilestones, setAllMilestones] = useState<Milestone[]>([]);

  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [newVehicleName, setNewVehicleName] = useState('');
  const [newVehicleCat, setNewVehicleCat] = useState('Car');

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
        setAllMilestones(milestones);
        setTotalMilestones(milestones.length);
        setAchievedCount(milestones.filter(m => m.achieved).length);

        const v = await Database.getAllVehicles();
        setVehicles(v);
      };
      loadStats();
    }, [])
  );

  const handleAddVehicle = async () => {
    if (!newVehicleName) return;
    const added = await Database.addVehicle(newVehicleName, newVehicleCat);
    setVehicles([...vehicles, added]);
    setShowAddVehicle(false);
    setNewVehicleName('');
  };

  const handleSetCurrent = async (id: number) => {
    await Database.setCurrentVehicle(id);
    const updated = vehicles.map(v => ({ ...v, isCurrent: v.id === id ? 1 : 0 }));
    setVehicles(updated);
  };

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
          <Text style={{ color: 'white', fontSize: 28, fontWeight: '800' }}>Profile</Text>
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
            <Feather name="activity" size={16} color="#EAB308" />
            <Text style={{ color: '#EAB308', fontSize: 13, fontWeight: '600' }}>{totalDrives > 0 ? Math.min(totalDrives, 7) : 0}-day streak</Text>
            <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>· Best: {totalDrives > 0 ? Math.min(totalDrives, 12) : 0}</Text>
          </View>
        </View>

        {/* Stats 2×2 */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, marginBottom: 16 }}>
          {[
            { label: 'Total Distance', value: `${totalDistance.toFixed(1)} km`, icon: 'map', color: '#4B7EFF' },
            { label: 'Max Speed', value: `${maxSpeed} km/h`, icon: 'zap', color: '#F97316' },
            { label: 'Total Drives', value: `${totalDrives}`, icon: 'map-pin', color: '#22C55E' },
            { label: 'Max G-Force', value: maxGForce > 0 ? `${maxGForce.toFixed(2)} G` : '— G', icon: 'alert-triangle', color: '#A855F7' },
          ].map((s) => (
            <View key={s.label} style={[st.statCard, { width: '48%' }]}>
              <Feather name={s.icon as any} size={24} color={s.color} style={{ marginBottom: 4 }} />
              <Text style={{ fontSize: 20, color: s.color, fontWeight: '700', lineHeight: 22 }}>{s.value}</Text>
              <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Garage Section */}
        <View style={[st.card, { marginHorizontal: 16, marginBottom: 16, padding: 0, overflow: 'hidden' }]}>
          <View style={{ padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }}>
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>My Garage</Text>
            <Pressable onPress={() => setShowAddVehicle(!showAddVehicle)} style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 }}>
              <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>{showAddVehicle ? 'Cancel' : '+ Add'}</Text>
            </Pressable>
          </View>
          
          {showAddVehicle && (
            <View style={{ padding: 16, backgroundColor: 'rgba(255,255,255,0.02)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }}>
              <TextInput
                placeholder="Vehicle Name (e.g. Civic Type R)"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={newVehicleName}
                onChangeText={setNewVehicleName}
                style={{ backgroundColor: '#09090F', color: 'white', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
              />
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                {['Car', 'Motorcycle'].map(cat => (
                  <Pressable key={cat} onPress={() => setNewVehicleCat(cat)} style={{ flex: 1, paddingVertical: 8, alignItems: 'center', backgroundColor: newVehicleCat === cat ? '#4B7EFF' : '#111120', borderRadius: 8 }}>
                    <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>{cat}</Text>
                  </Pressable>
                ))}
              </View>
              <Pressable onPress={handleAddVehicle} style={{ backgroundColor: '#22C55E', paddingVertical: 12, borderRadius: 8, alignItems: 'center' }}>
                <Text style={{ color: 'white', fontSize: 14, fontWeight: '700' }}>Save Vehicle</Text>
              </Pressable>
            </View>
          )}

          <View style={{ padding: 16, gap: 12 }}>
            {vehicles.map(v => (
              <Pressable 
                key={v.id} 
                onPress={() => handleSetCurrent(v.id)}
                style={{
                  flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12,
                  backgroundColor: v.isCurrent ? 'rgba(75,126,255,0.1)' : 'rgba(255,255,255,0.03)',
                  borderWidth: 1, borderColor: v.isCurrent ? '#4B7EFF' : 'rgba(255,255,255,0.05)'
                }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: v.isCurrent ? '#4B7EFF' : 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Ionicons name={v.category === 'Motorcycle' ? 'bicycle' : 'car-sport'} size={20} color="white" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: 'white', fontSize: 15, fontWeight: '600' }}>{v.name}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{v.totalDistance.toFixed(1)} km · Top: {v.topSpeed} km/h</Text>
                </View>
                {v.isCurrent === 1 && (
                  <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: '#4B7EFF', marginRight: 8 }}>
                    <Text style={{ color: 'white', fontSize: 10, fontWeight: '700' }}>ACTIVE</Text>
                  </View>
                )}
                <Pressable
                  onPress={() => {
                    Alert.alert(
                      "Delete Vehicle",
                      `Are you sure you want to delete ${v.name}?`,
                      [
                        { text: "Cancel", style: "cancel" },
                        { 
                          text: "Delete", 
                          style: "destructive", 
                          onPress: async () => {
                            await Database.deleteVehicle(v.id);
                            const updatedVehicles = await Database.getAllVehicles();
                            setVehicles(updatedVehicles);
                          }
                        }
                      ]
                    );
                  }}
                  style={{ padding: 8 }}
                >
                  <Feather name="trash-2" size={16} color="rgba(239,68,68,0.8)" />
                </Pressable>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Milestones bar */}
        <View style={[st.card, { marginHorizontal: 16, marginBottom: 16 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>Milestones</Text>
            <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>{achievedCount} / {totalMilestones} unlocked</Text>
          </View>
          <View style={{ height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.08)' }}>
            <View style={{ height: '100%', borderRadius: 4, width: `${achievementPct}%`, backgroundColor: '#4B7EFF' }} />
          </View>
          
          <View style={{ marginTop: 16, gap: 8 }}>
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

        {/* Auth & Sync Actions */}
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', letterSpacing: 0.8, marginBottom: 4 }}>CLOUD & ACCOUNT</Text>
          <View style={{ backgroundColor: '#111120', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
            <Pressable 
              onPress={() => Database.syncNow()}
              style={({pressed}) => [st.menuItem, pressed && { backgroundColor: 'rgba(255,255,255,0.05)' }]}
            >
              <View style={[st.menuIcon, { backgroundColor: 'rgba(59,130,246,0.1)' }]}>
                <Feather name="refresh-cw" size={18} color="#3B82F6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={st.menuLabel}>Sync to Cloud</Text>
                <Text style={st.menuSub}>Backup latest drives to Supabase</Text>
              </View>
              <Feather name="chevron-right" size={20} color="rgba(255,255,255,0.2)" />
            </Pressable>

            <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.05)' }} />

            <Pressable 
              onPress={async () => {
                const { supabase } = await import('@/services/Supabase');
                await supabase.auth.signOut();
              }}
              style={({pressed}) => [st.menuItem, pressed && { backgroundColor: 'rgba(255,255,255,0.05)' }]}
            >
              <View style={[st.menuIcon, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                <Feather name="log-out" size={18} color="#EF4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={st.menuLabel}>Log Out</Text>
                <Text style={st.menuSub}>Sign out from Google account</Text>
              </View>
              <Feather name="chevron-right" size={20} color="rgba(255,255,255,0.2)" />
            </Pressable>
          </View>
        </View>

        {/* App branding */}
        <View style={{ alignItems: 'center', paddingTop: 24, gap: 4 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.2)' }}>Del Road</Text>
          <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.12)' }}>Built with passion using React Native & Expo</Text>
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
  menuIcon: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: {
    color: 'white', fontSize: 14, fontWeight: '600',
  },
  menuSub: {
    color: 'rgba(255,255,255,0.3)', fontSize: 11,
  },
});
