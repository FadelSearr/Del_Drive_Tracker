import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Database, VehicleData } from '@/services/Database';
import { Feather } from '@expo/vector-icons';

const USE_CASES = ['Daily', 'Track', 'Off-road'] as const;
const categoryColors: Record<string, string> = { Daily: '#22C55E', Track: '#EF4444', 'Off-road': '#F97316', Off: '#F97316' };

function EloBar({ elo }: { elo: number }) {
  const pct = Math.min(100, ((elo - 800) / 1400) * 100);
  const color = elo > 1600 ? '#EF4444' : elo > 1300 ? '#F97316' : '#3B82F6';
  const tier = elo > 1600 ? '🏆 Elite' : elo > 1300 ? '🥇 Pro' : '🥈 Amateur';
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Elo Rating</Text>
        <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{tier}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)' }}>
          <View style={{ height: '100%', borderRadius: 3, width: `${pct}%`, backgroundColor: color }} />
        </View>
        <Text style={{ fontSize: 12, color, fontWeight: '700' }}>{elo}</Text>
      </View>
    </View>
  );
}

export default function GarageTabScreen() {
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [category, setCategory] = useState('Daily');

  const loadVehicles = async () => { setVehicles(await Database.getAllVehicles()); };
  useEffect(() => { loadVehicles(); }, []);

  const handleSelectVehicle = async (id: number) => {
    await Database.setCurrentVehicle(id);
    loadVehicles();
  };

  const handleAddVehicle = async () => {
    if (!make.trim() || !model.trim() || !year.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    await Database.addVehicle(`${make.trim()} ${model.trim()}`, `${category} • ${year.trim()}`);
    setMake(''); setModel(''); setYear(''); setCategory('Daily');
    setShowModal(false);
    loadVehicles();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#09090F' }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: '700' }}>Garage</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''}</Text>
          </View>
          <Pressable onPress={() => setShowModal(true)} style={s.addBtn}>
            <Feather name="plus" size={15} color="white" />
            <Text style={{ color: 'white', fontSize: 13, fontWeight: '600' }}>Add</Text>
          </Pressable>
        </View>

        {/* Vehicle Cards */}
        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          {vehicles.map((v) => {
            const catColor = categoryColors[v.category?.split(' ')[0] || 'Daily'] || '#3B82F6';
            const isActive = v.isCurrent === 1;
            return (
              <Pressable key={v.id} onPress={() => handleSelectVehicle(v.id)} style={[s.vehicleCard, isActive && { borderColor: `${catColor}40` }]}>
                {isActive && <View style={{ height: 2, width: '100%', backgroundColor: catColor, opacity: 0.6 }} />}
                <View style={{ padding: 16 }}>
                  {/* Top row */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>{v.name}</Text>
                        {isActive && (
                          <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, backgroundColor: 'rgba(34,197,94,0.15)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.25)' }}>
                            <Text style={{ color: '#22C55E', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 }}>ACTIVE</Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                        {v.category?.split(' • ')[1] || ''} · <Text style={{ color: catColor }}>{v.category?.split(' ')[0] || 'Daily'}</Text>
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.2)" />
                  </View>

                  {/* Stats */}
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                    {[
                      { label: 'Distance', value: `${Math.round(v.totalDistance)} km` },
                      { label: 'Top Speed', value: `${v.topSpeed} km/h` },
                      { label: 'Drives', value: `${(v as any).driveCount || 0}` },
                    ].map((st) => (
                      <View key={st.label} style={{ flex: 1, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 8, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)' }}>
                        <Text style={{ fontSize: 13, color: 'white', fontWeight: '700' }}>{st.value}</Text>
                        <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>{st.label}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Elo */}
                  <EloBar elo={v.eloRating || 1000} />
                </View>
              </Pressable>
            );
          })}
        </View>

        {vehicles.length === 0 && (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
            <Text style={{ fontSize: 48 }}>🚗</Text>
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '600', marginTop: 12 }}>No vehicles yet</Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Add your first car above</Text>
          </View>
        )}
      </ScrollView>

      {/* Add Vehicle Modal */}
      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <Pressable style={{ flex: 1 }} onPress={() => setShowModal(false)} />
          <View style={s.modalSheet}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginBottom: 16 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>Add Vehicle</Text>
              <Pressable onPress={() => setShowModal(false)}>
                <Feather name="x" size={20} color="rgba(255,255,255,0.4)" />
              </Pressable>
            </View>

            <View style={{ gap: 12 }}>
              {/* Brand */}
              <View>
                <Text style={s.inputLabel}>BRAND</Text>
                <TextInput value={make} onChangeText={setMake} placeholder="e.g. Porsche" placeholderTextColor="rgba(255,255,255,0.2)" style={s.input} />
              </View>
              {/* Model */}
              <View>
                <Text style={s.inputLabel}>MODEL</Text>
                <TextInput value={model} onChangeText={setModel} placeholder="e.g. 911 GT3 RS" placeholderTextColor="rgba(255,255,255,0.2)" style={s.input} />
              </View>
              {/* Year */}
              <View>
                <Text style={s.inputLabel}>YEAR</Text>
                <TextInput value={year} onChangeText={setYear} placeholder="2024" placeholderTextColor="rgba(255,255,255,0.2)" keyboardType="numeric" style={s.input} />
              </View>
              {/* Use Case */}
              <View>
                <Text style={s.inputLabel}>USE CASE</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {USE_CASES.map((uc) => (
                    <Pressable key={uc} onPress={() => setCategory(uc)} style={{
                      flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
                      backgroundColor: category === uc ? `${categoryColors[uc]}22` : 'rgba(255,255,255,0.04)',
                      borderWidth: 1, borderColor: category === uc ? `${categoryColors[uc]}40` : 'rgba(255,255,255,0.07)',
                    }}>
                      <Text style={{ color: category === uc ? categoryColors[uc] : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: '600' }}>{uc}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <Pressable onPress={handleAddVehicle} style={s.submitBtn}>
                <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>Add to Garage</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12,
  },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
    backgroundColor: '#4B7EFF',
  },
  vehicleCard: {
    backgroundColor: '#111120', borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  modalSheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20,
    backgroundColor: '#0F0F1E', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 0,
  },
  inputLabel: {
    fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.6, marginBottom: 6,
  },
  input: {
    backgroundColor: '#1A1A2C', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12, height: 46, color: 'white', fontSize: 14, paddingHorizontal: 14,
  },
  submitBtn: {
    height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 4,
    backgroundColor: '#4B7EFF',
  },
});
