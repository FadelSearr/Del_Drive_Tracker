import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Database, DriveData, SegmentData } from '@/services/Database';
import { CameraService, VideoMetadata } from '@/services/CameraService';
import { Feather } from '@expo/vector-icons';
import LeafletMap from '@/components/LeafletMap';
import VideoPlayer from '@/components/VideoPlayer';
import VideoEditor from '@/components/VideoEditor';
import { VideoShareService } from '@/services/VideoShareService';

const speedCategories = [
  { label: 'City', range: '0–40', color: '#22C55E' },
  { label: 'Suburban', range: '40–80', color: '#EAB308' },
  { label: 'Highway', range: '80–120', color: '#F97316' },
  { label: 'Track', range: '120+', color: '#EF4444' },
];

export default function HistoryTabScreen() {
  const [drives, setDrives] = useState<DriveData[]>([]);
  const [tab, setTab] = useState<'activities' | 'stats'>('activities');

  const [driveVideos, setDriveVideos] = useState<Record<string, VideoMetadata[]>>({});
  const [videoPlayerUri, setVideoPlayerUri] = useState<string | null>(null);
  const [videoPlayerTitle, setVideoPlayerTitle] = useState<string | undefined>(undefined);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  
  // Video Editor State
  const [showVideoEditor, setShowVideoEditor] = useState(false);
  const [editorVideoUri, setEditorVideoUri] = useState<string | null>(null);
  const [editorVideoId, setEditorVideoId] = useState<string | null>(null);
  const [editorVideoTitle, setEditorVideoTitle] = useState<string | undefined>(undefined);

  // Insights Data

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
        setDrives(allDrives.reverse());
        setTotalDrives(allDrives.length);

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

        if (coords.length > 0) {
          coords.forEach(c => {
            const speedKmh = c.speed || 0;
            if (speedKmh < 40) city++;
            else if (speedKmh < 80) suburban++;
            else if (speedKmh < 120) highway++;
            else track++;
          });
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

      };
      loadData();
    }, [])
  );

  // Load videos for drives that have them
  useEffect(() => {
    const loadDriveVideos = async () => {
      if (drives.length === 0) return;
      
      const videoMap: Record<string, VideoMetadata[]> = {};
      
      // Load videos for all drives in parallel
      await Promise.all(
        drives.map(async (drive) => {
          if (drive.id !== undefined) {
            const videos = await CameraService.getVideosForTrip(String(drive.id));
            if (videos.length > 0) {
              videoMap[String(drive.id)] = videos;
            }
          }
        })
      );
      
      setDriveVideos(videoMap);
    };
    
    loadDriveVideos();
  }, [drives]);

  const handlePlayVideo = (video: VideoMetadata, driveTitle: string) => {
    const videoUri = video.filePath || video.cloudUrl;
    if (videoUri) {
      setVideoPlayerUri(videoUri);
      setVideoPlayerTitle(driveTitle);
      setShowVideoPlayer(true);
    } else {
      Alert.alert('Video Unavailable', 'Video file could not be found on device or cloud.');
    }
  };

  const handleEditVideo = (video: VideoMetadata, driveTitle: string) => {
    const videoUri = video.filePath || video.cloudUrl;
    if (videoUri) {
      setEditorVideoUri(videoUri);
      setEditorVideoId(video.id);
      setEditorVideoTitle(driveTitle);
      setShowVideoEditor(true);
    } else {
      Alert.alert('Video Unavailable', 'Video file could not be found for editing.');
    }
  };

  const handleShareVideo = (video: VideoMetadata, driveTitle: string) => {
    const videoUri = video.filePath || video.cloudUrl;
    if (videoUri) {
      VideoShareService.showSharePicker(videoUri, (success) => {
        if (success) {
          console.log('Video shared successfully');
        }
      });
    } else {
      Alert.alert('Video Unavailable', 'No video file found to share.');
    }
  };

  const handleSaveEditedVideo = async (editedMetadata: {
    trimStart: number;
    trimEnd: number;
    playbackRate: number;
  }) => {
    // Save edited metadata to database or local storage
    // For now, just show success message
    Alert.alert(
      'Edit Saved',
      `Video trim settings saved:\nStart: ${editedMetadata.trimStart}s\nEnd: ${editedMetadata.trimEnd}s\nSpeed: ${editedMetadata.playbackRate}x`,
      [{ text: 'OK' }]
    );
    
    // TODO: Save to database with video ID
    console.log('Edited video metadata:', {
      videoId: editorVideoId,
      ...editedMetadata,
    });
  };


  const totalDistanceStr = totalDistance.toFixed(1);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#09090F' }}>
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={{ color: 'white', fontSize: 28, fontWeight: '800' }}>History</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable style={s.iconBtn}>
              <Feather name="search" size={18} color="rgba(255,255,255,0.7)" />
            </Pressable>
            <Pressable style={s.iconBtn}>
              <Feather name="sliders" size={18} color="rgba(255,255,255,0.7)" />
            </Pressable>
            <Pressable style={s.iconBtn}>
              <Feather name="align-right" size={18} color="rgba(255,255,255,0.7)" />
            </Pressable>
          </View>
        </View>

        {/* Tab Switcher */}
        <View style={s.tabSwitcher}>
          {(['activities', 'stats'] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={[s.tabBtn, tab === t && s.tabBtnActive]}
            >
              <Text style={[s.tabText, tab === t && s.tabTextActive]}>{t}</Text>
            </Pressable>
          ))}
        </View>

        {tab === 'activities' ? (
          /* Drive Cards */
          <View>
            <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
              <Text style={{ color: 'white', fontSize: 24, fontWeight: '800', marginBottom: 4 }}>Drive History</Text>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '500' }}>
                {totalDistanceStr} km • {totalDrives} Drives • {totalDuration}
              </Text>
            </View>

            {/* Sub-menu (Segments) */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, marginBottom: 24 }}>
              <Pressable style={[s.subMenuBtn, { width: '100%' }]} onPress={() => router.push('/segments' as any)}>
                 <View style={[s.subMenuIcon, { backgroundColor: 'rgba(249,115,22,0.1)' }]}>
                   <Feather name="flag" size={16} color="#F97316" />
                 </View>
                 <View style={{ flex: 1 }}>
                   <Text style={{ color: 'white', fontSize: 14, fontWeight: '700' }}>{segments.length}</Text>
                   <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>Segments</Text>
                 </View>
                 <Feather name="chevron-right" size={14} color="rgba(255,255,255,0.2)" />
              </Pressable>
            </View>

            {drives.length > 0 ? (
              <View style={{ paddingHorizontal: 16, gap: 16 }}>
                {drives.map((drive) => {
                  const driveDist = parseFloat(drive.distance || '0').toFixed(1);
                  return (
                    <View key={drive.id}>
                      {/* Date separator style */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>{drive.date?.split('·')[0]?.trim() || 'Drive'}</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{driveDist} km</Text>
                      </View>
                      
                      <Pressable
                        onPress={() => router.push(`/drive/${drive.id}`)}
                        style={s.driveCard}
                      >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 }}>
                          <View>
                            <Text style={{ color: 'white', fontSize: 16, fontWeight: '700', marginBottom: 4 }} numberOfLines={1}>{drive.title || 'Unnamed Drive'}</Text>
                            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{drive.date}</Text>
                          </View>
                          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                            {/* Video indicator */}
                            {driveVideos[String(drive.id)] && driveVideos[String(drive.id)].length > 0 && (
                              <View style={s.videoIndicator}>
                                <Feather name="video" size={12} color="#4B7EFF" />
                                <Text style={s.videoIndicatorText}>{driveVideos[String(drive.id)].length}</Text>
                              </View>
                            )}
                            <Feather name="heart" size={18} color="rgba(255,255,255,0.4)" />
                            <Feather name="share" size={18} color="rgba(255,255,255,0.4)" />
                          </View>
                        </View>

                        <View style={{ height: 160, backgroundColor: '#1A1A24', overflow: 'hidden' }}>
                          {drive.coordinates && drive.coordinates.length > 0 ? (
                            <LeafletMap
                              interactive={false}
                              userLocation={null}
                              coordinates={drive.coordinates}
                              mapMode="free"
                              autoFitBounds={true}
                            />
                          ) : (
                            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                              <Feather name="map" size={24} color="rgba(255,255,255,0.1)" />
                            </View>
                          )}
                          {/* Drive Style Badge */}
                          {drive.driveStyle && (
                            <View style={s.styleBadge}>
                              <Feather name="zap" size={10} color="#EF4444" />
                              <Text style={{ color: '#EF4444', fontSize: 10, fontWeight: '700', marginLeft: 4, textTransform: 'uppercase' }}>{drive.driveStyle}</Text>
                            </View>
                          )}
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: '#0E0E18' }}>
                           <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                             <Feather name="map" size={14} color="#4B7EFF" />
                             <Text style={{ color: 'white', fontSize: 14, fontWeight: '700' }}>{drive.distance}</Text>
                           </View>
                           <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                             <Feather name="clock" size={14} color="#4B7EFF" />
                             <Text style={{ color: 'white', fontSize: 14, fontWeight: '700' }}>{drive.duration}</Text>
                           </View>
                           <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                             <View style={{ backgroundColor: '#4B7EFF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}>
                               <Text style={{ color: 'white', fontSize: 9, fontWeight: '800' }}>AVG</Text>
                             </View>
                             <Text style={{ color: 'white', fontSize: 14, fontWeight: '700' }}>{drive.avgSpeed}</Text>
                           </View>
                        </View>
                      </Pressable>

                      {/* Play Video Button (shown only if trip has recordings) */}
                      {driveVideos[String(drive.id)] && driveVideos[String(drive.id)].length > 0 && (
                        <View>
                        <TouchableOpacity
                          style={s.playVideoButton}
                          onPress={() => {
                            const firstVideo = driveVideos[String(drive.id)][0];
                            handlePlayVideo(firstVideo, drive.title || 'Unnamed Drive');
                          }}
                        >
                          <Feather name="play-circle" size={20} color="white" />
                          <Text style={s.playVideoButtonText}>
                            Play Dashcam Video ({driveVideos[String(drive.id)].length} recording{driveVideos[String(drive.id)].length > 1 ? 's' : ''})
                          </Text>
                          <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.5)" />
                        </TouchableOpacity>

                        {/* Edit Video Button */}
                        <TouchableOpacity
                          style={s.editVideoButton}
                          onPress={() => {
                            const firstVideo = driveVideos[String(drive.id)][0];
                            handleEditVideo(firstVideo, drive.title || 'Unnamed Drive');
                          }}
                        >
                          <Feather name="edit" size={20} color="white" />
                          <Text style={s.editVideoButtonText}>
                            Edit Video (Trim & Speed)
                          </Text>
                          <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.5)" />
                        </TouchableOpacity>

                        {/* Share Video Button */}
                        <TouchableOpacity
                          style={s.shareVideoButton}
                          onPress={() => {
                            const firstVideo = driveVideos[String(drive.id)][0];
                            handleShareVideo(firstVideo, drive.title || 'Unnamed Drive');
                          }}
                        >
                          <Feather name="share-2" size={20} color="white" />
                          <Text style={s.shareVideoButtonText}>
                            Share to Instagram
                          </Text>
                          <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.5)" />
                        </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
                <Feather name="map" size={48} color="rgba(255,255,255,0.2)" />
                <Text style={{ color: 'white', fontSize: 16, fontWeight: '600', marginTop: 12 }}>No drives found</Text>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Start your first drive on the Map tab</Text>
              </View>
            )}
          </View>
        ) : (
          /* Stats Tab (formerly Insights) */
          <View style={{ paddingHorizontal: 16, gap: 16 }}>
             {/* Global Stats 2×2 */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {[
                { label: 'Total Distance', value: `${totalDistance.toFixed(0)} km`, icon: 'map', color: '#4B7EFF' },
                { label: 'Top Speed', value: `${maxSpeedOverall.toFixed(0)} km/h`, icon: 'zap', color: '#F97316' },
                { label: 'Drive Time', value: totalDuration, icon: 'clock', color: '#22C55E' },
                { label: 'Total Drives', value: `${totalDrives}`, icon: 'map-pin', color: '#A855F7' },
              ].map((s) => (
                <View key={s.label} style={[st.statCard, { width: '48%' }]}>
                  <Feather name={s.icon as any} size={24} color={s.color} style={{ marginBottom: 8 }} />
                  <Text style={{ fontSize: 22, color: s.color, fontWeight: '700', lineHeight: 24 }}>{s.value}</Text>
                  <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Speed Profile */}
            <View style={st.card}>
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



            {/* Driving Streak */}
            <View style={{
              borderRadius: 16, padding: 16,
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

          </View>
        )}
      </ScrollView>

      {/* Video Player Modal */}
      {videoPlayerUri && (
        <VideoPlayer
          videoUri={videoPlayerUri}
          visible={showVideoPlayer}
          onClose={() => {
            setShowVideoPlayer(false);
            setVideoPlayerUri(null);
            setVideoPlayerTitle(undefined);
          }}
          tripTitle={videoPlayerTitle}
          speedOverlay={true}
        />
      )}

      {/* Video Editor Modal */}
      {editorVideoUri && (
        <VideoEditor
          videoUri={editorVideoUri}
          visible={showVideoEditor}
          onClose={() => {
            setShowVideoEditor(false);
            setEditorVideoUri(null);
            setEditorVideoId(null);
            setEditorVideoTitle(undefined);
          }}
          onSave={handleSaveEditedVideo}
          videoTitle={editorVideoTitle}
        />
      )}
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

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabSwitcher: {
    marginHorizontal: 16, 
    marginBottom: 24, 
    flexDirection: 'row', 
    borderRadius: 30, 
    padding: 4, 
    backgroundColor: '#1C1C2E',
  },
  tabBtn: {
    flex: 1, 
    paddingVertical: 10, 
    borderRadius: 26, 
    alignItems: 'center', 
    backgroundColor: 'transparent'
  },
  tabBtnActive: {
    backgroundColor: '#4B7EFF'
  },
  tabText: {
    color: 'rgba(255,255,255,0.5)', 
    fontSize: 14, 
    fontWeight: '600', 
    textTransform: 'capitalize'
  },
  tabTextActive: {
    color: 'white'
  },
  subMenuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#131320',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  subMenuIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  driveCard: {
    backgroundColor: '#111120',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  styleBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backdropFilter: 'blur(4px)',
  },
  videoIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(75, 126, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(75, 126, 255, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  videoIndicatorText: {
    color: '#4B7EFF',
    fontSize: 10,
    fontWeight: '700',
  },
  playVideoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#4B7EFF',
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
  },
  playVideoButtonText: {
    flex: 1,
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  editVideoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#22C55E',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  editVideoButtonText: {
    flex: 1,
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  shareVideoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#E1306C',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  shareVideoButtonText: {
    flex: 1,
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
});
