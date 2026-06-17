import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator, AppState, AppStateStatus } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { CameraService } from '@/services/CameraService';
import { LocationService } from '@/services/LocationService';

export default function DashcamScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [tripId, setTripId] = useState<string | null>(null);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isInBackground, setIsInBackground] = useState(false);
  const [backgroundDuration, setBackgroundDuration] = useState(0);
  const cameraRef = useRef<CameraView>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const backgroundEnteredAt = useRef<number | null>(null);

  const [now, setNow] = useState(() => Date.now());

  // Update speed from LocationService
  useEffect(() => {
    const interval = setInterval(() => {
      const speed = LocationService.getCurrentSpeed();
      setCurrentSpeed(speed);
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Request media library permissions on mount
  useEffect(() => {
    CameraService.requestPermissions();
  }, []);

  // AppState listener for background recording
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      const prevState = appStateRef.current;
      appStateRef.current = nextAppState;

      if (prevState === 'active' && nextAppState.match(/inactive|background/)) {
        // App going to background
        if (isRecording) {
          setIsInBackground(true);
          backgroundEnteredAt.current = Date.now();
          console.log('Dashcam recording continues in background');
        }
      } else if (prevState.match(/inactive|background/) && nextAppState === 'active') {
        // App coming back to foreground
        if (isRecording && backgroundEnteredAt.current) {
          const bgSeconds = Math.floor((Date.now() - backgroundEnteredAt.current) / 1000);
          setBackgroundDuration(prev => prev + bgSeconds);
          backgroundEnteredAt.current = null;
        }
        setIsInBackground(false);
        console.log('Dashcam returned to foreground');
      }
    });

    return () => subscription.remove();
  }, [isRecording]);

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4B7EFF" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Feather name="video-off" size={64} color="rgba(255,255,255,0.3)" style={{ marginBottom: 20 }} />
          <Text style={styles.permissionText}>Camera Access Required</Text>
          <Text style={styles.permissionSubtext}>
            Allow camera access to record dashcam videos during your drives
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const handleZoomChange = (direction: 'in' | 'out' | 'reset') => {
    if (direction === 'in') {
      setZoom(prev => Math.min(prev + 0.2, 2));
    } else if (direction === 'out') {
      setZoom(prev => Math.max(prev - 0.2, 0.6));
    } else {
      setZoom(1);
    }
  };

  const toggleRecording = async () => {
    if (!cameraRef.current) {
      Alert.alert('Error', 'Camera not ready');
      return;
    }

    try {
      if (isRecording) {
        // Stop recording
        setIsRecording(false);
        setIsSaving(true);
        
        cameraRef.current.stopRecording();
        
        // Recording will be saved in the onRecordingFinished callback
        // (see recordAsync onRecordingFinished parameter)
      } else {
        // Start recording
        const newTripId = tripId || `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setTripId(newTripId);
        setRecordingStartTime(Date.now());
        setIsRecording(true);
        setBackgroundDuration(0); // Reset background time for new recording

        // Start recording with promise
        cameraRef.current.recordAsync({
          maxDuration: 3600, // 1 hour max
        }).then(async (video) => {
          if (!video) return;
          console.log('Recording finished:', video.uri);
          
          try {
            // Save video using CameraService
            const metadata = await CameraService.saveRecording(
              video.uri,
              newTripId,
              facing
            );

            setIsSaving(false);

            if (metadata) {
              const durationMin = Math.floor(metadata.duration / 60);
              const durationSec = metadata.duration % 60;
              const sizeMB = (metadata.fileSize / (1024 * 1024)).toFixed(1);
              
              Alert.alert(
                'Video Saved',
                `Duration: ${durationMin}m ${durationSec}s\nSize: ${sizeMB} MB`,
                [{ text: 'OK' }]
              );
            } else {
              Alert.alert('Error', 'Failed to save video');
            }
          } catch (error) {
            console.error('Error saving video:', error);
            setIsSaving(false);
            Alert.alert('Error', 'Failed to save video');
          }
        }).catch((error) => {
          console.error('Recording error:', error);
          setIsRecording(false);
          setIsSaving(false);
          Alert.alert('Recording Error', 'Failed to record video');
        });

        Alert.alert('Recording Started', 'Dashcam is recording');
      }
    } catch (error) {
      console.error('Recording error:', error);
      Alert.alert('Error', 'Failed to start/stop recording');
      setIsRecording(false);
      setIsSaving(false);
    }
  };

  // Calculate recording duration (includes time spent in background)
  const foregroundSeconds = recordingStartTime
    ? Math.floor((now - recordingStartTime) / 1000)
    : 0;
  const recordingDuration = foregroundSeconds + backgroundDuration;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Camera View */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        zoom={zoom}
        mode="video"
      >
        {/* Speed Overlay - Bottom Left */}
        <View style={styles.speedOverlay}>
          <Text style={styles.speedValue}>{Math.round(currentSpeed)}</Text>
          <Text style={styles.speedUnit}>km/h</Text>
        </View>

        {/* Top Controls */}
        <View style={styles.topControls}>
          {/* Recording Indicator */}
          {isRecording && (
            <View style={[styles.recordingIndicator, isInBackground && styles.recordingIndicatorBg]}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>
                {isInBackground ? '🔒 BG ' : 'REC '}{formatDuration(recordingDuration)}
              </Text>
            </View>
          )}
          
          {/* Saving Indicator */}
          {isSaving && (
            <View style={styles.savingIndicator}>
              <ActivityIndicator size="small" color="white" />
              <Text style={styles.savingText}>Saving...</Text>
            </View>
          )}
          
          {/* Zoom Level */}
          <View style={styles.zoomIndicator}>
            <Text style={styles.zoomText}>{zoom.toFixed(1)}x</Text>
          </View>
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          {/* Zoom Controls - Left */}
          <View style={styles.zoomControls}>
            <TouchableOpacity
              style={[styles.zoomButton, zoom <= 0.6 && styles.zoomButtonActive]}
              onPress={() => handleZoomChange('out')}
            >
              <Text style={styles.zoomButtonText}>0.6x</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.zoomButton, zoom === 1 && styles.zoomButtonActive]}
              onPress={() => handleZoomChange('reset')}
            >
              <Text style={styles.zoomButtonText}>1x</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.zoomButton, zoom >= 2 && styles.zoomButtonActive]}
              onPress={() => handleZoomChange('in')}
            >
              <Text style={styles.zoomButtonText}>2x</Text>
            </TouchableOpacity>
          </View>

          {/* Record Button - Center */}
          <TouchableOpacity
            style={[
              styles.recordButton,
              isRecording && styles.recordButtonActive,
              isSaving && styles.recordButtonDisabled
            ]}
            onPress={toggleRecording}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="large" color="white" />
            ) : isRecording ? (
              <View style={styles.stopIcon} />
            ) : (
              <View style={styles.recordIcon} />
            )}
          </TouchableOpacity>

          {/* Flip Camera - Right */}
          <TouchableOpacity
            style={styles.flipButton}
            onPress={toggleCameraFacing}
            disabled={isRecording}
          >
            <Feather name="rotate-cw" size={28} color={isRecording ? 'rgba(255,255,255,0.3)' : 'white'} />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  permissionContainer: {
    alignItems: 'center',
    padding: 40,
  },
  permissionText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  permissionSubtext: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  permissionButton: {
    backgroundColor: '#4B7EFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Speed Overlay
  speedOverlay: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 15,
    minWidth: 100,
    alignItems: 'center',
  },
  speedValue: {
    color: 'white',
    fontSize: 48,
    fontWeight: 'bold',
  },
  speedUnit: {
    color: 'white',
    fontSize: 16,
    marginTop: -8,
  },

  // Top Controls
  topControls: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  recordingIndicatorBg: {
    backgroundColor: 'rgba(255, 140, 0, 0.9)', // Orange when in background
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
    marginRight: 6,
  },
  recordingText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  savingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(75, 126, 255, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  savingText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  zoomIndicator: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  zoomText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },

  // Bottom Controls
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  // Zoom Controls
  zoomControls: {
    flexDirection: 'row',
    gap: 8,
  },
  zoomButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  zoomButtonActive: {
    backgroundColor: 'rgba(75, 126, 255, 0.8)',
  },
  zoomButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },

  // Record Button
  recordButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  recordButtonActive: {
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
  },
  recordButtonDisabled: {
    opacity: 0.5,
  },
  recordIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF3B30',
  },
  stopIcon: {
    width: 30,
    height: 30,
    borderRadius: 4,
    backgroundColor: 'white',
  },

  // Flip Button
  flipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
