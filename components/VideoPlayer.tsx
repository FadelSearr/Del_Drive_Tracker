import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Modal, ActivityIndicator } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEventListener } from 'expo';
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [showControls, setShowControls] = useState(true);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);


  const player = useVideoPlayer(videoUri, player => {
    player.loop = false;
  });

  useEventListener(player, 'playingChange', ({ isPlaying }) => {
    setIsPlaying(isPlaying);
    if (!isPlaying && player.currentTime >= player.duration) {
      setShowControls(true);
    }
  });

  useEventListener(player, 'statusChange', ({ status }) => {
    if (status === 'loading') {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  });

  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    setPosition(currentTime);
  });

  useEventListener(player, 'sourceLoad', ({ duration }) => {
    setDuration(duration);
    setIsLoading(false);
  });

  useEffect(() => {
    if (visible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoading(true);
      setIsPlaying(false);
      setPosition(0);
      player.play();
    } else {
      player.pause();
    }
  }, [visible, player]);

  useEffect(() => {
    // Auto-hide controls after 3 seconds
    if (showControls && isPlaying) {
      const timer = setTimeout(() => setShowControls(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showControls, isPlaying]);

  const handlePlayPause = () => {
    if (player.playing) {
      player.pause();
    } else {
      if (player.currentTime >= player.duration) {
        // eslint-disable-next-line react-hooks/immutability
        player.currentTime = 0;
      }
      player.play();
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    // eslint-disable-next-line react-hooks/immutability
    player.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const handleSeek = (value: number) => {
    if (duration > 0) {
      // eslint-disable-next-line react-hooks/immutability
      player.currentTime = value * duration;
    }
  };

  const formatTime = (seconds: number) => {
    const totalSeconds = Math.floor(seconds);
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
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
          <VideoView
            player={player}
            style={styles.video}
            contentFit="contain"
            nativeControls={false}
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
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
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
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
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

