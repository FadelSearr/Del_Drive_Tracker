import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Modal, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Feather } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

interface VideoPlayerProps {
  videoUri: string;
  visible: boolean;
  onClose: () => void;
  tripTitle?: string;
  speedOverlay?: boolean;
  currentSpeed?: number;
}

export default function VideoPlayer({ 
  videoUri, 
  visible, 
  onClose, 
  tripTitle,
  speedOverlay = true,
  currentSpeed = 0 
}: VideoPlayerProps) {
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [showControls, setShowControls] = useState(true);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);

  const { width, height } = Dimensions.get('window');

  useEffect(() => {
    if (visible) {
      setIsLoading(true);
      setIsPlaying(false);
      setPosition(0);
    }
  }, [visible]);

  useEffect(() => {
    // Auto-hide controls after 3 seconds
    if (showControls && isPlaying) {
      const timer = setTimeout(() => setShowControls(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showControls, isPlaying]);

  const handlePlayPause = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handlePlaybackRateChange = async (rate: number) => {
    if (videoRef.current) {
      await videoRef.current.setRateAsync(rate, true);
      setPlaybackRate(rate);
    }
  };

  const handleSeek = async (value: number) => {
    if (videoRef.current && duration > 0) {
      await videoRef.current.setPositionAsync(value * duration);
    }
  };

  const handlePlaybackStatusUpdate = (playbackStatus: AVPlaybackStatus) => {
    setStatus(playbackStatus);
    
    if (playbackStatus.isLoaded) {
      setIsLoading(false);
      setDuration(playbackStatus.durationMillis || 0);
      setPosition(playbackStatus.positionMillis || 0);
      setIsPlaying(playbackStatus.isPlaying);
      
      // Video ended
      if (playbackStatus.didJustFinish) {
        setIsPlaying(false);
        setShowControls(true);
      }
    }
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleScreenTap = () => {
    setShowControls(!showControls);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <TouchableOpacity 
          style={styles.videoContainer} 
          activeOpacity={1} 
          onPress={handleScreenTap}
        >
          <Video
            ref={videoRef}
            source={{ uri: videoUri }}
            style={styles.video}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={false}
            isLooping={false}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          />

          {/* Loading Indicator */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="white" />
              <Text style={styles.loadingText}>Loading video...</Text>
            </View>
          )}

          {/* Speed Overlay (if enabled) */}
          {speedOverlay && !isLoading && (
            <View style={styles.speedOverlay}>
              <Text style={styles.speedValue}>{Math.round(currentSpeed)}</Text>
              <Text style={styles.speedUnit}>km/h</Text>
            </View>
          )}

          {/* Controls Overlay */}
          {showControls && !isLoading && (
            <View style={styles.controlsOverlay}>
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <Feather name="x" size={28} color="white" />
                </TouchableOpacity>
                {tripTitle && (
                  <Text style={styles.tripTitle}>{tripTitle}</Text>
                )}
                <View style={{ width: 28 }} />
              </View>

              {/* Center Play/Pause */}
              <View style={styles.centerControls}>
                <TouchableOpacity 
                  style={styles.playButton} 
                  onPress={handlePlayPause}
                >
                  <Feather 
                    name={isPlaying ? 'pause' : 'play'} 
                    size={60} 
                    color="white" 
                  />
                </TouchableOpacity>
              </View>

              {/* Bottom Controls */}
              <View style={styles.bottomControls}>
                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                  <Text style={styles.timeText}>{formatTime(position)}</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={1}
                    value={duration > 0 ? position / duration : 0}
                    onSlidingComplete={handleSeek}
                    minimumTrackTintColor="#4B7EFF"
                    maximumTrackTintColor="rgba(255,255,255,0.3)"
                    thumbTintColor="#4B7EFF"
                  />
                  <Text style={styles.timeText}>{formatTime(duration)}</Text>
                </View>

                {/* Playback Rate Controls */}
                <View style={styles.rateControls}>
                  <Text style={styles.rateLabel}>Speed:</Text>
                  {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                    <TouchableOpacity
                      key={rate}
                      style={[
                        styles.rateButton,
                        playbackRate === rate && styles.rateButtonActive
                      ]}
                      onPress={() => handlePlaybackRateChange(rate)}
                    >
                      <Text style={[
                        styles.rateButtonText,
                        playbackRate === rate && styles.rateButtonTextActive
                      ]}>
                        {rate}x
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
  },
  speedOverlay: {
    position: 'absolute',
    bottom: 150,
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
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tripTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  centerControls: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  timeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    minWidth: 45,
  },
  slider: {
    flex: 1,
    marginHorizontal: 10,
  },
  rateControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  rateLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  rateButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  rateButtonActive: {
    backgroundColor: '#4B7EFF',
  },
  rateButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  rateButtonTextActive: {
    fontWeight: 'bold',
  },
});
