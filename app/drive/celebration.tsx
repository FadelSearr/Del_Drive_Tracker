import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, KeyboardAvoidingView, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Database, VehicleData, DriveData } from '@/services/Database';
import { Feather, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const WEATHER_OPTIONS = [
  { id: 'Sunny', icon: 'sun' },
  { id: 'Cloudy', icon: 'cloud' },
  { id: 'Rainy', icon: 'cloud-rain' },
  { id: 'Night', icon: 'moon' }
];

const DRIVE_STYLES = [
  { id: 'Normal', icon: 'coffee', color: '#3B82F6' },
  { id: 'Focus', icon: 'crosshair', color: '#F97316' },
  { id: 'Aggressive', icon: 'zap', color: '#EF4444' }
];

export default function SaveDriveScreen() {
  const { driveId } = useLocalSearchParams();
  const [title, setTitle] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [driveStyle, setDriveStyle] = useState('Normal');
  const [weather, setWeather] = useState('Sunny');
  const [privacy, setPrivacy] = useState('Public');
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);

  useEffect(() => {
    const init = async () => {
      const v = await Database.getAllVehicles();
      setVehicles(v);
      const current = v.find(v => v.isCurrent === 1);
      if (current) setSelectedVehicleId(current.id);
    };
    init();
  }, []);

  const handleSave = async () => {
    if (!driveId) {
      router.replace('/(tabs)');
      return;
    }
    
    const carName = vehicles.find(v => v.id === selectedVehicleId)?.name;
    const detailsToUpdate: Partial<DriveData> = { 
      title, 
      driveStyle, 
      weather, 
      vehicleId: selectedVehicleId || undefined, 
      privacy 
    };
    if (carName) {
       detailsToUpdate.car = carName;
    }
    
    await Database.updateDriveDetails(Number(driveId), detailsToUpdate);
    
    router.replace(`/drive/${driveId}`);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#09090F' }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        {/* Header */}
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.iconBtn}>
            <Feather name="x" size={24} color="white" />
          </Pressable>
          <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>Save Drive</Text>
          <Pressable onPress={handleSave} style={s.saveBtn}>
            <Text style={{ color: 'black', fontSize: 14, fontWeight: '700' }}>Save</Text>
          </Pressable>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 24 }}>
          
          {/* Title Input */}
          <View>
            <Text style={s.label}>Title</Text>
            <TextInput
              style={s.input}
              placeholder="e.g., Morning Commute, Weekend Touge"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Add Photos */}
          <View>
             <Text style={s.label}>Photos</Text>
             <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                <Pressable style={s.addPhotoBtn}>
                   <Feather name="camera" size={24} color="rgba(255,255,255,0.4)" />
                   <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4, fontWeight: '600' }}>Add Photo</Text>
                </Pressable>
             </ScrollView>
          </View>

          {/* Drive Style */}
          <View>
            <Text style={s.label}>Drive Style</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {DRIVE_STYLES.map(style => {
                const isActive = driveStyle === style.id;
                return (
                  <Pressable 
                    key={style.id} 
                    onPress={() => setDriveStyle(style.id)}
                    style={[s.optionChip, isActive && { borderColor: style.color, backgroundColor: `${style.color}20` }]}
                  >
                    <Feather name={style.icon as any} size={16} color={isActive ? style.color : 'rgba(255,255,255,0.4)'} />
                    <Text style={{ color: isActive ? style.color : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: '600', marginLeft: 8 }}>{style.id}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Weather */}
          <View>
            <Text style={s.label}>Weather</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {WEATHER_OPTIONS.map(w => {
                const isActive = weather === w.id;
                return (
                  <Pressable 
                    key={w.id} 
                    onPress={() => setWeather(w.id)}
                    style={[s.iconOption, isActive && { backgroundColor: '#4B7EFF', borderColor: '#4B7EFF' }]}
                  >
                    <Feather name={w.icon as any} size={20} color={isActive ? 'white' : 'rgba(255,255,255,0.4)'} />
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Vehicle Selection */}
          <View>
            <Text style={s.label}>Vehicle</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {vehicles.map(v => {
                const isActive = selectedVehicleId === v.id;
                return (
                  <Pressable 
                    key={v.id} 
                    onPress={() => setSelectedVehicleId(v.id)}
                    style={[s.optionChip, isActive && { borderColor: '#22C55E', backgroundColor: 'rgba(34,197,94,0.1)' }]}
                  >
                    <Feather name="truck" size={16} color={isActive ? '#22C55E' : 'rgba(255,255,255,0.4)'} />
                    <Text style={{ color: isActive ? '#22C55E' : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: '600', marginLeft: 8 }}>{v.name}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Privacy */}
          <View>
             <Text style={s.label}>Privacy</Text>
             <View style={{ flexDirection: 'row', gap: 12 }}>
                <Pressable onPress={() => setPrivacy('Public')} style={[s.optionChip, privacy === 'Public' && { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                   <Feather name="globe" size={16} color={privacy === 'Public' ? 'white' : 'rgba(255,255,255,0.4)'} />
                   <Text style={{ color: privacy === 'Public' ? 'white' : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: '600', marginLeft: 8 }}>Public</Text>
                </Pressable>
                <Pressable onPress={() => setPrivacy('Private')} style={[s.optionChip, privacy === 'Private' && { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                   <Feather name="lock" size={16} color={privacy === 'Private' ? 'white' : 'rgba(255,255,255,0.4)'} />
                   <Text style={{ color: privacy === 'Private' ? 'white' : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: '600', marginLeft: 8 }}>Only Me</Text>
                </Pressable>
             </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)'
  },
  iconBtn: {
    width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center'
  },
  saveBtn: {
    backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20
  },
  label: {
    color: 'white', fontSize: 16, fontWeight: '700', marginBottom: 12
  },
  input: {
    backgroundColor: '#111120', color: 'white', fontSize: 16, padding: 16,
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
  },
  addPhotoBtn: {
    width: 100, height: 100, borderRadius: 16, backgroundColor: '#111120',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center'
  },
  optionChip: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 12, backgroundColor: '#111120', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'
  },
  iconOption: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: '#111120',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'
  }
});
