import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Text, Pressable, ActivityIndicator, Modal, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import LeafletMap from '@/components/LeafletMap';
import { Feather, FontAwesome } from '@expo/vector-icons';
import ShareTemplate from '@/components/ShareTemplate';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import Share from 'react-native-share';
import { Database, DriveData } from '@/services/Database';

let ImagePicker: any = null;
// eslint-disable-next-line @typescript-eslint/no-require-imports
try { ImagePicker = require('expo-image-picker'); } catch {}
const isImagePickerAvailable = !!(ImagePicker && ImagePicker.launchImageLibraryAsync);

type VideoDuration = 10 | 20 | 30 | 'dynamic';

export default function DriveDetailScreen() {
  const { id } = useLocalSearchParams();
  const viewShotRef = useRef<any>(null);
  const stickerShotRef = useRef<any>(null);
  const [driveData, setDriveData] = useState<DriveData | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [distMode, setDistMode] = useState<'time' | 'distance'>('time');
  const [showShareModal, setShowShareModal] = useState(false);
  const [bgImage, setBgImage] = useState<string | undefined>(undefined);
  const [bgVideo, setBgVideo] = useState<string | undefined>(undefined);
  const [mediaTab, setMediaTab] = useState<'image' | 'video'>('image');
  const [videoDuration, setVideoDuration] = useState<VideoDuration>(10);
  const [animatedTrack, setAnimatedTrack] = useState(true);

  const [showSegmentModal, setShowSegmentModal] = useState(false);
  const [segStartPct, setSegStartPct] = useState(0);
  const [segEndPct, setSegEndPct] = useState(100);
  const [segmentName, setSegmentName] = useState('');

  // Recap Stats
  const [heatmapCoords, setHeatmapCoords] = useState<{latitude: number, longitude: number}[]>([]);

  useEffect(() => {
    Database.getAllDrives().then(all => {
      let coords: {latitude: number, longitude: number}[] = [];
      all.forEach(d => {
        if (d.coordinates) coords = [...coords, ...d.coordinates];
      });
      setHeatmapCoords(coords);
    });
  }, []);

  useEffect(() => {
    if (id) {
      Database.getDriveById(Number(id)).then(data => {
        setDriveData(data);
        setIsFavorite(!!data?.isFavorite);
      });
    }
  }, [id]);

  const handleToggleFavorite = async () => {
    if (driveData?.id) {
      const newState = await Database.toggleFavorite(driveData.id);
      setIsFavorite(newState);
    }
  };

  const pickImage = async () => {
    if (!isImagePickerAvailable) return;
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, aspect: [9, 16], quality: 1,
      });
      if (!result.canceled) { setBgImage(result.assets[0].uri); setBgVideo(undefined); }
    } catch {}
  };

  const pickVideo = async () => {
    if (!isImagePickerAvailable) return;
    try {
      const maxSec = videoDuration === 'dynamic' ? 60 : (videoDuration as number);
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        videoMaxDuration: maxSec,
        quality: 1,
      });
      if (!result.canceled) { setBgVideo(result.assets[0].uri); setBgImage(undefined); }
    } catch { Alert.alert('Error', 'Could not pick video'); }
  };

  const handleShare = async () => {
    try {
      const activeVideo = bgVideo || driveData?.dashcamUri;
      if (mediaTab === 'video' && activeVideo) {
        // Share video with sticker to Instagram Stories
        if (stickerShotRef.current?.capture) {
          const stickerUri = await stickerShotRef.current.capture();
          
          await Share.shareSingle({
            social: Share.Social.INSTAGRAM_STORIES,
            appId: '1000000000000000', // Dummy App ID for IG Stories if not set
            backgroundVideo: activeVideo,
            stickerImage: stickerUri,
          });
        }
      } else {
        // Share standard image
        if (viewShotRef.current?.capture) {
          const uri = await viewShotRef.current.capture();
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share your drive' });
          }
        }
      }
    } catch (err: any) {
      console.log('Share error:', err);
      Alert.alert('Share Failed', err?.message || 'Could not share to Instagram Stories.');
    }
  };

  const saveSegmentFromHistory = async () => {
    try {
      if (!driveData?.coordinates || driveData.coordinates.length < 2) {
        Alert.alert("Error", "Drive has no valid coordinates.");
        return;
      }
      const sIdx = Math.floor((segStartPct / 100) * (driveData.coordinates.length - 1));
      const eIdx = Math.floor((segEndPct / 100) * (driveData.coordinates.length - 1));
      const actualStart = Math.min(sIdx, eIdx);
      const actualEnd = Math.max(sIdx, eIdx);
      
      if (actualStart === actualEnd) {
        Alert.alert("Error", "Segment is too short");
        return;
      }
      
      const startCoords = driveData.coordinates[actualStart];
      const endCoords = driveData.coordinates[actualEnd];
      
      if (!startCoords || !endCoords) {
        Alert.alert("Error", "Invalid coordinates selected.");
        return;
      }
      
      const segmentCoords = driveData.coordinates.slice(actualStart, actualEnd + 1);
      
      // Calculate attempt data
      const timeInSeconds = segmentCoords.length; // Assuming 1 coord per second for simplicity, or we should use real timestamps if available
      const speeds = segmentCoords.map(c => c.speed || 0);
      const topSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;
      const sumSpeed = speeds.reduce((a, b) => a + b, 0);
      const avgSpeed = speeds.length > 0 ? sumSpeed / speeds.length : 0;

      const firstAttempt = {
        id: Date.now().toString(),
        date: driveData.date || new Date().toISOString(),
        time: timeInSeconds,
        topSpeed,
        avgSpeed,
        driveId: driveData.id
      };

      const newSegment = {
        id: Date.now().toString(),
        title: segmentName || `Segment from ${driveData.title || 'Drive'}`,
        type: 'Speed Zone',
        coordinates: segmentCoords,
        startCoords: { latitude: startCoords.latitude, longitude: startCoords.longitude },
        endCoords: { latitude: endCoords.latitude, longitude: endCoords.longitude },
        bestTime: timeInSeconds,
        topSpeed: topSpeed,
        attempts: [firstAttempt]
      };
      await Database.saveSegment(newSegment);
      Alert.alert("Success", "Segment saved!");
      setShowSegmentModal(false);
    } catch (e: any) {
      Alert.alert("Save Error", e?.message || "Unknown error occurred");
    }
  };

  if (!driveData) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#09090F', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4B7EFF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#09090F' }}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Hidden Sticker Share Template for Video Sharing */}
      <View style={{ position: 'absolute', top: -10000, left: -10000 }}>
        <ViewShot ref={stickerShotRef} options={{ format: "png", quality: 1.0 }}>
          <ShareTemplate data={driveData} heatmapData={heatmapCoords} hideBackground={true} animated={animatedTrack} />
        </ViewShot>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 }}>
          <Pressable onPress={() => router.back()} style={s.iconBtn}>
            <Feather name="chevron-left" size={20} color="white" />
          </Pressable>
          <Text style={{ color: 'white', fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center' }} numberOfLines={1}>{driveData.title}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable onPress={handleToggleFavorite} style={s.iconBtn}>
              <FontAwesome name={isFavorite ? "star" : "star-o"} size={18} color={isFavorite ? "#EAB308" : "white"} />
            </Pressable>
            <Pressable onPress={() => setShowShareModal(true)} style={s.iconBtn}>
              <Feather name="share-2" size={18} color="white" />
            </Pressable>
            <Pressable 
              onPress={() => {
                Alert.alert("Delete Drive", "Are you sure you want to delete this drive?", [
                  { text: "Cancel", style: "cancel" },
                  { text: "Delete", style: "destructive", onPress: async () => {
                      if (driveData?.id) {
                        await Database.deleteDrive(driveData.id);
                        router.back();
                      }
                  }}
                ]);
              }} 
              style={[s.iconBtn, { borderColor: 'rgba(239,68,68,0.2)' }]}
            >
              <Feather name="trash-2" size={18} color="#EF4444" />
            </Pressable>
          </View>
        </View>

        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, textAlign: 'center', marginBottom: 16 }}>{driveData.date}</Text>

        {/* Map Card */}
        <View style={[s.card, { marginHorizontal: 16, marginBottom: 16, padding: 0, overflow: 'hidden' }]}>
          <View style={{ height: 200, backgroundColor: '#141424' }}>
            <LeafletMap 
              interactive={false}
              userLocation={null}
              coordinates={driveData.coordinates || []}
              mapMode="free"
              autoFitBounds={true}
            />
          </View>
          {/* Quick Stats Row */}
          <View style={{ flexDirection: 'row', padding: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' }}>
            {[
              { label: 'Distance', val: driveData.distance },
              { label: 'Time', val: driveData.duration },
              { label: 'Avg', val: driveData.avgSpeed },
              { label: 'Top', val: driveData.topSpeed },
            ].map(st => (
              <View key={st.label} style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ color: 'white', fontSize: 14, fontWeight: '700' }}>{st.val}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 4 }}>{st.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Vehicle & Weather */}
        <View style={{ flexDirection: 'row', gap: 12, marginHorizontal: 16, marginBottom: 16 }}>
          <View style={[s.card, { flex: 1 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Feather name="truck" size={14} color="#4B7EFF" />
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' }}>Vehicle</Text>
            </View>
            <Text style={{ color: 'white', fontSize: 15, fontWeight: '600' }}>{driveData.car}</Text>
          </View>
          <View style={[s.card, { flex: 1 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Feather name="sun" size={14} color="#F97316" />
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' }}>Weather</Text>
            </View>
            <Text style={{ color: 'white', fontSize: 15, fontWeight: '600' }}>{driveData.weather}</Text>
          </View>
        </View>

        {/* Telematics Grid */}
        <View style={[s.card, { marginHorizontal: 16, marginBottom: 16 }]}>
          <Text style={{ color: 'white', fontSize: 14, fontWeight: '600', marginBottom: 16 }}>Driving Telematics</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {[
              { label: 'Max G-Force', val: driveData.topBrakeForce ?? '0.00 G', icon: 'stop-circle', color: '#EF4444' },
              { label: 'Hard Brakes', val: `${driveData.brakePressed ?? 0}x`, icon: 'alert-triangle', color: '#F97316' },
              { label: 'Max Accel', val: driveData.topAcceleration ?? '0.0 m/s²', icon: 'fast-forward', color: '#22C55E' },
              { label: 'Max Decel', val: driveData.topDeceleration ?? '0.0 m/s²', icon: 'rewind', color: '#FB923C' },
              { label: 'Cornering', val: `${driveData.leftTurns ?? 0}L / ${driveData.rightTurns ?? 0}R`, icon: 'corner-up-left', color: '#3B82F6' },
              { label: 'Lane Changes', val: `${driveData.laneChanges ?? 0}x`, icon: 'shuffle', color: '#A855F7' },
              { label: 'Stops', val: `${driveData.stopsCount ?? 0} (${driveData.stopsDuration ?? '0s'})`, icon: 'octagon', color: '#EAB308' },
              { label: 'Elevation', val: driveData.altitude ?? '0 m', icon: 'triangle', color: '#64748B' },
            ].map(t => (
              <View key={t.label} style={s.telematicsItem}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Feather name={t.icon as any} size={12} color={t.color} />
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, letterSpacing: 0.5, textTransform: 'uppercase' }}>{t.label}</Text>
                </View>
                <Text style={{ color: 'white', fontSize: 14, fontWeight: '700' }}>{t.val}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Speed Distribution */}
        <View style={[s.card, { marginHorizontal: 16, marginBottom: 16 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>Speed Distribution</Text>
            <View style={{ flexDirection: 'row', backgroundColor: '#09090F', borderRadius: 8, padding: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
              <Pressable onPress={() => setDistMode('time')} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: distMode === 'time' ? '#1E1E32' : 'transparent' }}>
                <Text style={{ fontSize: 10, fontWeight: '600', color: distMode === 'time' ? 'white' : 'rgba(255,255,255,0.4)' }}>Time</Text>
              </Pressable>
              <Pressable onPress={() => setDistMode('distance')} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: distMode === 'distance' ? '#1E1E32' : 'transparent' }}>
                <Text style={{ fontSize: 10, fontWeight: '600', color: distMode === 'distance' ? 'white' : 'rgba(255,255,255,0.4)' }}>Dist</Text>
              </Pressable>
            </View>
          </View>

          {(() => {
            const topSpeedNum = parseInt(driveData.topSpeed) || 100;
            const step = topSpeedNum / 5;
            const ranges = [
              { label: `0–${Math.round(step)}`, min: 0, max: step, color: '#3B82F6' },
              { label: `${Math.round(step)}–${Math.round(step * 2)}`, min: step, max: step * 2, color: '#22C55E' },
              { label: `${Math.round(step * 2)}–${Math.round(step * 3)}`, min: step * 2, max: step * 3, color: '#EAB308' },
              { label: `${Math.round(step * 3)}–${Math.round(step * 4)}`, min: step * 3, max: step * 4, color: '#F97316' },
              { label: `${Math.round(step * 4)}+`, min: step * 4, max: 9999, color: '#EF4444' },
            ];

            const coords = driveData.coordinates || [];
            if (coords.length === 0) return null;

            const durationParts = driveData.duration.split(':').map(Number);
            const totalSeconds = durationParts.length === 3 ? durationParts[0] * 3600 + durationParts[1] * 60 + durationParts[2] : durationParts[0] * 60 + durationParts[1];
            
            const stats = ranges.map(r => ({ ...r, count: 0, distance: 0 }));
            
            coords.forEach((c, idx) => {
              const speed = c.speed || 0;
              const rangeIdx = ranges.findIndex(r => speed >= r.min && speed < r.max);
              if (rangeIdx !== -1) {
                stats[rangeIdx].count += 1;
                if (idx > 0) {
                  const prev = coords[idx-1];
                  const dLat = (c.latitude - prev.latitude) * Math.PI / 180;
                  const dLon = (c.longitude - prev.longitude) * Math.PI / 180;
                  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(prev.latitude * Math.PI / 180) * Math.cos(c.latitude * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
                  stats[rangeIdx].distance += 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                }
              }
            });

            const totalPoints = coords.length;
            const totalDist = stats.reduce((acc, s) => acc + s.distance, 0);

            const processed = stats.map(s => {
              const percent = distMode === 'time' ? (totalPoints > 0 ? (s.count / totalPoints) * 100 : 0) : (totalDist > 0 ? (s.distance / totalDist) * 100 : 0);
              const timeSecs = (s.count / totalPoints) * totalSeconds;
              return { ...s, percent, timeStr: `${Math.floor(timeSecs / 60)}m ${Math.floor(timeSecs % 60)}s` };
            });

            const dominant = [...processed].sort((a, b) => b.percent - a.percent)[0];

            return (
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>Dominant Range:</Text>
                  <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, backgroundColor: `${dominant.color}20`, borderWidth: 1, borderColor: `${dominant.color}40` }}>
                    <Text style={{ color: dominant.color, fontSize: 10, fontWeight: '600' }}>{dominant.label} km/h</Text>
                  </View>
                </View>
                
                <View style={{ height: 6, borderRadius: 3, flexDirection: 'row', overflow: 'hidden', marginBottom: 16 }}>
                  {processed.map((p, i) => <View key={i} style={{ width: `${p.percent}%`, backgroundColor: p.color }} />)}
                </View>

                <View style={{ gap: 8 }}>
                  {processed.map((p, i) => (
                    <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: p.color }} />
                        <Text style={{ color: 'white', fontSize: 13, fontWeight: '500' }}>{p.label} km/h</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{p.timeStr}</Text>
                        <Text style={{ color: 'white', fontSize: 13, fontWeight: '700', width: 40, textAlign: 'right' }}>{Math.round(p.percent)}%</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            );
          })()}
        </View>

        {/* Segment Button full width */}
        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <Pressable onPress={() => { setSegStartPct(0); setSegEndPct(100); setSegmentName(''); setShowSegmentModal(true); }} style={[s.primaryBtn, {backgroundColor: '#1E1E32'}]}>
            <Feather name="scissors" size={18} color="white" />
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>Create Segment from Drive</Text>
          </Pressable>
        </View>

        {/* Done Button full width */}
        <View style={{ paddingHorizontal: 16 }}>
          <Pressable onPress={() => router.replace('/(tabs)/history')} style={s.primaryBtn}>
            <Feather name="check" size={18} color="white" />
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>Done</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal visible={showShareModal} animationType="slide" onRequestClose={() => setShowShareModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#09090F' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 }}>
            <Pressable onPress={() => setShowShareModal(false)} style={s.iconBtn}>
              <Feather name="x" size={20} color="white" />
            </Pressable>
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>Share Preview</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView contentContainerStyle={{ alignItems: 'center', paddingBottom: 40 }}>
            {/* Template Preview */}
            <View style={{ borderRadius: 24, overflow: 'hidden', marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
              <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }}>
                <ShareTemplate
                  data={driveData}
                  backgroundImageUri={bgImage}
                  videoUri={bgVideo || driveData.dashcamUri}
                  heatmapData={heatmapCoords}
                  animated={animatedTrack}
                />
              </ViewShot>
            </View>

            <View style={{ width: '100%', paddingHorizontal: 24, gap: 20 }}>

              {/* Animated track toggle */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#111120', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
                <View style={{ gap: 2 }}>
                  <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>Animated Track</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>Marker berjalan 5 detik</Text>
                </View>
                <Pressable
                  onPress={() => setAnimatedTrack(p => !p)}
                  style={{ width: 48, height: 28, borderRadius: 14, backgroundColor: animatedTrack ? '#4B7EFF' : 'rgba(255,255,255,0.1)', justifyContent: 'center', paddingHorizontal: 3 }}
                >
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: 'white', alignSelf: animatedTrack ? 'flex-end' : 'flex-start' }} />
                </Pressable>
              </View>

              {/* Media tab selector */}
              <View style={{ flexDirection: 'row', backgroundColor: '#111120', borderRadius: 12, padding: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
                <Pressable
                  onPress={() => setMediaTab('image')}
                  style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: mediaTab === 'image' ? '#1E1E32' : 'transparent' }}
                >
                  <Text style={{ color: mediaTab === 'image' ? 'white' : 'rgba(255,255,255,0.4)', fontWeight: '700', fontSize: 13 }}>📷  Foto</Text>
                </Pressable>
                <Pressable
                  onPress={() => setMediaTab('video')}
                  style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: mediaTab === 'video' ? '#1E1E32' : 'transparent' }}
                >
                  <Text style={{ color: mediaTab === 'video' ? 'white' : 'rgba(255,255,255,0.4)', fontWeight: '700', fontSize: 13 }}>🎬  Video</Text>
                </Pressable>
              </View>

              {/* Image panel */}
              {mediaTab === 'image' && (
                <View style={{ gap: 12 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, letterSpacing: 1 }}>BACKGROUND FOTO</Text>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <Pressable onPress={() => { setBgImage(undefined); setBgVideo(undefined); }} style={[s.bgBtn, !bgImage && !bgVideo && s.bgBtnActive]}>
                      <Feather name="grid" size={20} color={!bgImage && !bgVideo ? '#4B7EFF' : 'rgba(255,255,255,0.4)'} />
                    </Pressable>
                    <Pressable onPress={pickImage} style={[s.bgBtn, bgImage && s.bgBtnActive]}>
                      <Feather name="image" size={20} color={bgImage ? '#4B7EFF' : 'rgba(255,255,255,0.4)'} />
                    </Pressable>
                  </View>
                  {bgImage && <Text style={{ color: '#30D158', fontSize: 11 }}>✓ Foto dipilih — dapat dipotong saat picker</Text>}
                </View>
              )}

              {/* Video panel */}
              {mediaTab === 'video' && (
                <View style={{ gap: 14 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, letterSpacing: 1 }}>DURASI VIDEO</Text>
                  <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                    {([10, 20, 30, 'dynamic'] as VideoDuration[]).map(dur => (
                      <Pressable
                        key={String(dur)}
                        onPress={() => setVideoDuration(dur)}
                        style={{
                          paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
                          backgroundColor: videoDuration === dur ? '#4B7EFF' : '#111120',
                          borderWidth: 1, borderColor: videoDuration === dur ? '#4B7EFF' : 'rgba(255,255,255,0.06)'
                        }}
                      >
                        <Text style={{ color: 'white', fontWeight: '700', fontSize: 13 }}>
                          {dur === 'dynamic' ? '⚡ Dynamic' : `${dur}s`}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>
                    {videoDuration === 'dynamic' ? 'Durasi bebas — potong sendiri di video picker.' : `Video akan dipotong maks ${videoDuration} detik saat dipilih.`}
                  </Text>
                  <Pressable onPress={pickVideo} style={[s.bgBtn, bgVideo && s.bgBtnActive, { width: '100%', height: 52, borderRadius: 14, flexDirection: 'row', gap: 10 }]}>
                    <Feather name="film" size={20} color={bgVideo ? '#4B7EFF' : 'rgba(255,255,255,0.4)'} />
                    <Text style={{ color: bgVideo ? '#4B7EFF' : 'rgba(255,255,255,0.4)', fontWeight: '700' }}>{bgVideo ? 'Ganti Video' : 'Pilih Video dari Galeri'}</Text>
                  </Pressable>
                  {bgVideo && <Text style={{ color: '#30D158', fontSize: 11 }}>✓ Video dipilih — sudah dipotong sesuai durasi</Text>}
                  {!bgVideo && driveData.dashcamUri && (
                    <View style={{ backgroundColor: 'rgba(75,126,255,0.1)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(75,126,255,0.2)' }}>
                      <Text style={{ color: '#4B7EFF', fontSize: 11, fontWeight: '700' }}>✓ Dashcam video detected for this drive</Text>
                    </View>
                  )}
                </View>
              )}

              <Pressable onPress={handleShare} style={s.primaryBtn}>
                <Feather name="share-2" size={18} color="white" />
                <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>Share Now</Text>
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={showSegmentModal} animationType="slide" onRequestClose={() => setShowSegmentModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#09090F' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 }}>
            <Pressable onPress={() => setShowSegmentModal(false)} style={s.iconBtn}>
              <Feather name="x" size={20} color="white" />
            </Pressable>
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>Cut Segment</Text>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
             <Text style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 24 }}>Adjust the start and end of the segment to save it as a speed zone.</Text>
             
             {/* Map Preview */}
             {driveData?.coordinates && driveData.coordinates.length > 0 && (() => {
                const sIdx = Math.floor((segStartPct / 100) * (driveData.coordinates.length - 1));
                const eIdx = Math.floor((segEndPct / 100) * (driveData.coordinates.length - 1));
                const start = Math.min(sIdx, eIdx);
                const end = Math.max(sIdx, eIdx);
                const previewCoords = driveData.coordinates.slice(start, end + 1);

                return (
                  <View style={{ height: 200, borderRadius: 12, overflow: 'hidden', marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                    <LeafletMap 
                      interactive={true}
                      userLocation={previewCoords[0]}
                      coordinates={previewCoords}
                      mapMode="free"
                      autoFitBounds={true}
                    />
                  </View>
                );
             })()}
             
             {/* Name input */}
             <TextInput 
                style={{ backgroundColor: '#111120', color: 'white', padding: 16, borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
                placeholder="Segment Name (Optional)"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={segmentName}
                onChangeText={setSegmentName}
             />

             {/* Start Slider */}
             <Text style={{ color: 'white', fontWeight: 'bold', marginBottom: 8 }}>Start Point: {segStartPct}%</Text>
             <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 }}>
               <Pressable onPress={() => setSegStartPct(Math.max(0, segStartPct - 5))} style={s.iconBtn}><Feather name="minus" size={20} color="white"/></Pressable>
               <View style={{ flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.1)' }}>
                 <View style={{ position: 'absolute', left: 0, width: `${segStartPct}%`, height: 4, backgroundColor: '#EF4444' }} />
               </View>
               <Pressable onPress={() => setSegStartPct(Math.min(segEndPct - 5, segStartPct + 5))} style={s.iconBtn}><Feather name="plus" size={20} color="white"/></Pressable>
             </View>

             {/* End Slider */}
             <Text style={{ color: 'white', fontWeight: 'bold', marginBottom: 8 }}>End Point: {segEndPct}%</Text>
             <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 32 }}>
               <Pressable onPress={() => setSegEndPct(Math.max(segStartPct + 5, segEndPct - 5))} style={s.iconBtn}><Feather name="minus" size={20} color="white"/></Pressable>
               <View style={{ flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.1)' }}>
                 <View style={{ position: 'absolute', left: 0, width: `${segEndPct}%`, height: 4, backgroundColor: '#22C55E' }} />
               </View>
               <Pressable onPress={() => setSegEndPct(Math.min(100, segEndPct + 5))} style={s.iconBtn}><Feather name="plus" size={20} color="white"/></Pressable>
             </View>
             
             <Pressable onPress={saveSegmentFromHistory} style={s.primaryBtn}>
                <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>Save Segment</Text>
             </Pressable>
          </ScrollView>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  iconBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#111120',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  card: {
    backgroundColor: '#111120', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  telematicsItem: {
    width: '47%', padding: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)',
  },
  primaryBtn: {
    height: 56, borderRadius: 16, backgroundColor: '#4B7EFF',
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8,
  },
  bgBtn: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: '#111120',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  bgBtnActive: {
    backgroundColor: 'rgba(75,126,255,0.1)', borderColor: 'rgba(75,126,255,0.3)',
  },
});
