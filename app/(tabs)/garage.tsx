import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from '@/components/tw';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Database, VehicleData } from '@/services/Database';
import { Feather } from '@expo/vector-icons';
import { Alert, Modal } from 'react-native';

export default function GarageTabScreen() {
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [showModal, setShowModal] = useState(false);
  
  // Form state
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [category, setCategory] = useState('Daily');

  const loadVehicles = async () => {
    const list = await Database.getAllVehicles();
    setVehicles(list);
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const handleSelectVehicle = async (id: number) => {
    await Database.setCurrentVehicle(id);
    loadVehicles();
  };

  const handleAddVehicle = async () => {
    if (!make.trim() || !model.trim() || !year.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    const fullName = `${make.trim()} ${model.trim()}`;
    const fullCategory = `${category} • ${year.trim()}`;
    
    await Database.addVehicle(fullName, fullCategory);
    
    // Reset form
    setMake('');
    setModel('');
    setYear('');
    setCategory('Daily');
    setShowModal(false);
    
    // Reload
    loadVehicles();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <ScrollView className="flex-1 bg-sf-bg px-4 pt-4">
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-3xl font-bold text-sf-text">My Garage</Text>
          <Pressable 
            onPress={() => setShowModal(true)}
            className="bg-sf-blue px-4 py-2 rounded-full flex-row items-center gap-1"
          >
            <Feather name="plus" size={16} color="white" />
            <Text className="text-white font-bold text-sm">Add Car</Text>
          </Pressable>
        </View>

        {vehicles.map((v) => (
          <Pressable 
            key={v.id}
            onPress={() => handleSelectVehicle(v.id)}
            className={`bg-sf-bg-2 rounded-3xl p-5 mb-4 shadow-sm border ${
              v.isCurrent ? 'border-sf-blue bg-sf-blue/5' : 'border-transparent'
            }`}
          >
            <View className="flex-row justify-between items-start mb-1">
              <Text className="text-sf-text text-xl font-bold">{v.name}</Text>
              {v.isCurrent === 1 && (
                <View className="bg-sf-blue px-2.5 py-0.5 rounded-full">
                  <Text className="text-white text-[10px] font-bold uppercase tracking-wider">Active</Text>
                </View>
              )}
            </View>
            <Text className="text-sf-text-2 mb-4">{v.category}</Text>
            
            <View className="flex-row justify-between border-t border-sf-gray/20 pt-4">
              <View>
                <Text className="text-sf-gray text-[10px] uppercase font-bold tracking-wider mb-0.5">Total Dist</Text>
                <Text className="text-sf-text font-black">{Math.round(v.totalDistance).toLocaleString()} km</Text>
              </View>
              <View>
                <Text className="text-sf-gray text-[10px] uppercase font-bold tracking-wider mb-0.5">Top Speed</Text>
                <Text className="text-sf-text font-black">{v.topSpeed} km/h</Text>
              </View>
              <View>
                <Text className="text-sf-gray text-[10px] uppercase font-bold tracking-wider mb-0.5">Elo Rating</Text>
                <Text className="text-sf-blue font-black">{v.eloRating}</Text>
              </View>
            </View>
          </Pressable>
        ))}

        {vehicles.length === 0 && (
          <View className="items-center justify-center py-20">
            <Feather name="truck" size={48} color="#8E8E93" style={{ marginBottom: 16 }} />
            <Text className="text-sf-gray font-bold">No vehicles in garage yet</Text>
          </View>
        )}
      </ScrollView>

      {/* Add Car Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-sf-bg-2 rounded-t-3xl p-6 border-t border-sf-gray/20">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-sf-text">Add New Vehicle</Text>
              <Pressable onPress={() => setShowModal(false)} className="p-1">
                <Feather name="x" size={24} color="#8E8E93" />
              </Pressable>
            </View>

            <View className="gap-y-4 mb-6">
              <View>
                <Text className="text-sf-gray text-xs font-bold uppercase mb-2">Brand / Make</Text>
                <TextInput
                  placeholder="e.g. Porsche, Toyota, Honda"
                  placeholderTextColor="#8E8E93"
                  value={make}
                  onChangeText={setMake}
                  className="bg-sf-bg px-4 py-3 rounded-xl text-sf-text border border-sf-gray/10"
                />
              </View>

              <View>
                <Text className="text-sf-gray text-xs font-bold uppercase mb-2">Model</Text>
                <TextInput
                  placeholder="e.g. 911 GT3 RS, Civic Type R"
                  placeholderTextColor="#8E8E93"
                  value={model}
                  onChangeText={setModel}
                  className="bg-sf-bg px-4 py-3 rounded-xl text-sf-text border border-sf-gray/10"
                />
              </View>

              <View className="flex-row gap-4">
                <View className="flex-1">
                  <Text className="text-sf-gray text-xs font-bold uppercase mb-2">Year</Text>
                  <TextInput
                    placeholder="e.g. 2024"
                    placeholderTextColor="#8E8E93"
                    keyboardType="numeric"
                    value={year}
                    onChangeText={setYear}
                    className="bg-sf-bg px-4 py-3 rounded-xl text-sf-text border border-sf-gray/10"
                  />
                </View>

                <View className="flex-1">
                  <Text className="text-sf-gray text-xs font-bold uppercase mb-2">Use Case</Text>
                  <View className="bg-sf-bg rounded-xl border border-sf-gray/10 flex-row justify-around py-3 px-1">
                    {['Daily', 'Track', 'Off-road'].map((type) => (
                      <Pressable
                        key={type}
                        onPress={() => setCategory(type)}
                        className={`px-3 py-1 rounded-lg ${category === type ? 'bg-sf-blue' : ''}`}
                      >
                        <Text className={`text-xs font-bold ${category === type ? 'text-white' : 'text-sf-gray'}`}>{type}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
            </View>

            <Pressable
              onPress={handleAddVehicle}
              className="bg-sf-blue py-4 rounded-2xl items-center shadow-md mb-4"
            >
              <Text className="text-white font-bold text-base">Save Vehicle</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
