import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Database } from '@/services/Database';
import { Feather } from '@expo/vector-icons';
import LeafletMap from '@/components/LeafletMap';

export default function CreateSegmentScreen() {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Speed Zone');
  const [speedLimit, setSpeedLimit] = useState('60');

  const handleSave = async () => {
    if (!title) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    // Mock coordinates for the zone
    const coords = [
      { latitude: -6.2, longitude: 106.8 },
      { latitude: -6.21, longitude: 106.81 }
    ];
    await Database.addSegment(title, type, coords, parseInt(speedLimit));
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#09090F' }}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.iconBtn}>
          <Feather name="arrow-left" size={24} color="white" />
        </Pressable>
        <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>New Zone</Text>
        <Pressable onPress={handleSave} style={s.saveBtn}>
          <Text style={{ color: 'black', fontSize: 14, fontWeight: '700' }}>Save</Text>
        </Pressable>
      </View>

      <View style={{ flex: 1 }}>
        <View style={{ height: '40%', backgroundColor: '#1A1A24' }}>
          <LeafletMap interactive={true} userLocation={{latitude: -6.2, longitude: 106.8}} />
        </View>
        
        <View style={{ padding: 20, gap: 20 }}>
          <View>
            <Text style={s.label}>Zone Title</Text>
            <TextInput
              style={s.input}
              placeholder="e.g., Sudirman Speed Zone"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View>
            <Text style={s.label}>Zone Type</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {['Speed Zone', 'Sprint Segment'].map(t => (
                <Pressable
                  key={t}
                  onPress={() => setType(t)}
                  style={[s.chip, type === t && { borderColor: '#4B7EFF', backgroundColor: 'rgba(75,126,255,0.1)' }]}
                >
                  <Text style={{ color: type === t ? '#4B7EFF' : 'rgba(255,255,255,0.4)', fontWeight: '600' }}>{t}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {type === 'Speed Zone' && (
            <View>
              <Text style={s.label}>Speed Limit (km/h)</Text>
              <TextInput
                style={s.input}
                keyboardType="numeric"
                value={speedLimit}
                onChangeText={setSpeedLimit}
              />
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)'
  },
  iconBtn: {
    width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center'
  },
  saveBtn: {
    backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20
  },
  label: { color: 'white', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: {
    backgroundColor: '#111120', color: 'white', padding: 16, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
  },
  chip: {
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12,
    backgroundColor: '#111120', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'
  }
});
