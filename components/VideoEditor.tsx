import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Modal,
  Dimensions,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Feather } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

interface VideoEditorProps {
  videoUri: string;
  visible: boolean;
  onClose: () => void;
  onSave: (editedMetadata: {
    trimStart: number;
    trimEnd: number;
    playbackRate: number;
  }) => void;
  videoTitle?: string;
}

export default function VideoEditor({
  videoUri,
  visible,
  onClose,
  onSave,
  videoTitle,
}: VideoEditorProps) {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  
  // Trim points (in milliseconds)
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  
  // Playback rate
  const [playbackRate, setPlaybackRate] = useState(1.0);
  
  // Preview mode
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const { width } = Dimensions.get('window');

  useEffect(() => {
    if (visible) {
      setIsLoading(true);
      setIsPlaying(false);
      setPosition(0);
      setTrimStart(0);
      setTrimEnd(0);
      setPlaybackRate(1.0);
      setIsPreviewMode(false);
    }
  }, [visible]);

  const handlePlaybackStatusUpdate = (playbackStatus: AVPlaybackStatus) => {
    if (playbackStatus.isLoaded) {
      setIsLoading(false);
      const durationMs = playbackStatus.durationMillis || 0;
      setDuration(durationMs);
      setPosition(playbackStatus.positionMillis || 0);
      setIsPlaying(playbackStatus.isPlaying);

      // Initialize trim end to full duration on first load
      if (trimEnd === 0 && durationMs > 0) {
        setTrimEnd(durationMs);
      }

      // Auto-stop at trim end in preview mode
      if (isPreviewMode && playbackStatus.positionMillis >= trimEnd) {
        videoRef.current?.pauseAsync();
        videoRef.current?.setPositionAsync(trimStart);
        setIsPreviewMode(false);
      }
    }
  };

  const handlePlayPause = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        // Start from trim start if at beginning
        if (position < trimStart || position >= trimEnd) {
          await videoRef.current.setPositionAsync(trimStart);
        }
        await videoRef.current.playAsync();
      }
    }
  };

  const handlePreview = async () => {
    if (videoRef.current) {
      setIsPreviewMode(true);
      await videoRef.current.setPositionAsync(trimStart);
      await videoRef.current.setRateAsync(playbackRate, true);
      await videoRef.current.playAsync();
    }
  };

  const handleSeek = async (value: number) => {
    if (videoRef.current && duration > 0) {
      const seekPosition = value * duration;
      await videoRef.current.setPositionAsync(seekPosition);
    }
  };

  const handleTrimStartChange = (value: number) => {
    const newStart = value * duration;
    if (newStart < trimEnd) {
      setTrimStart(newStart);
    }
  };

  const handleTrimEndChange = (value: number) => {
    const newEnd = value * duration;
    if (newEnd > trimStart) {
      setTrimEnd(newEnd);
    }
  };

  const handleSave = () => {
    const trimDuration = (trimEnd - trimStart) / 1000; // Convert to seconds
    
    if (trimDuration < 1) {
      Alert.alert('Invalid Trim', 'Trimmed video must be at least 1 second long');
      return;
    }

    Alert.alert(
      'Save Trim Settings',
      `Trim: ${formatTime(trimStart)} - ${formatTime(trimEnd)}\nSpeed: ${playbackRate}x\nFinal Duration: ${formatTime(trimEnd - trimStart)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: () => {
            onSave({
              trimStart: trimStart / 1000, // Convert to seconds
              trimEnd: trimEnd / 1000,
              playbackRate,
            });
            onClose();
          },
        },
      ]
    );
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const trimmedDuration = trimEnd - trimStart;
  const finalDuration = trimmedDuration / playbackRate; // Adjusted for speed

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Feather name="x" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Video</Text>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Video Preview */}
        <View style={styles.videoContainer}>
          <Video
            ref={videoRef}
            source={{ uri: videoUri }}
            style={styles.video}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={false}
            isLooping={false}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          />

          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="white" />
            </View>
          )}

          {/* Trim Indicator Overlay */}
          <View style={styles.trimOverlay}>
            <Text style={styles.trimText}>
              {formatTime(trimStart)} - {formatTime(trimEnd)}
            </Text>
          </View>
        </View>

        {/* Controls */}
        <ScrollView style={styles.controlsContainer}>
          {/* Playback Controls */}
          <View style={styles.playbackControls}>
            <TouchableOpacity style={styles.controlButton} onPress={handlePlayPause}>
              <Feather name={isPlaying ? 'pause' : 'play'} size={32} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.previewButton} onPress={handlePreview}>
              <Feather name="eye" size={20} color="white" />
              <Text style={styles.previewButtonText}>Preview Trim</Text>
            </TouchableOpacity>
          </View>

          {/* Seek Bar */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Position</Text>
            <View style={styles.seekContainer}>
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
          </View>

          {/* Trim Start */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trim Start: {formatTime(trimStart)}</Text>
            <Slider
              style={styles.fullSlider}
              minimumValue={0}
              maximumValue={1}
              value={duration > 0 ? trimStart / duration : 0}
              onValueChange={handleTrimStartChange}
              minimumTrackTintColor="#22C55E"
              maximumTrackTintColor="rgba(255,255,255,0.3)"
              thumbTintColor="#22C55E"
            />
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => setTrimStart(0)}
            >
              <Text style={styles.resetButtonText}>Reset to Start</Text>
            </TouchableOpacity>
          </View>

          {/* Trim End */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trim End: {formatTime(trimEnd)}</Text>
            <Slider
              style={styles.fullSlider}
              minimumValue={0}
              maximumValue={1}
              value={duration > 0 ? trimEnd / duration : 0}
              onValueChange={handleTrimEndChange}
              minimumTrackTintColor="#EF4444"
              maximumTrackTintColor="rgba(255,255,255,0.3)"
              thumbTintColor="#EF4444"
            />
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => setTrimEnd(duration)}
            >
              <Text style={styles.resetButtonText}>Reset to End</Text>
            </TouchableOpacity>
          </View>

          {/* Speed Adjustment */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Playback Speed: {playbackRate}x</Text>
            <View style={styles.speedControls}>
              {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                <TouchableOpacity
                  key={rate}
                  style={[
                    styles.speedButton,
                    playbackRate === rate && styles.speedButtonActive,
                  ]}
                  onPress={() => setPlaybackRate(rate)}
                >
                  <Text
                    style={[
                      styles.speedButtonText,
                      playbackRate === rate && styles.speedButtonTextActive,
                    ]}
                  >
                    {rate}x
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Summary */}
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Original Duration:</Text>
              <Text style={styles.summaryValue}>{formatTime(duration)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Trimmed Duration:</Text>
              <Text style={styles.summaryValue}>{formatTime(trimmedDuration)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Speed Adjusted:</Text>
              <Text style={styles.summaryValue}>{formatTime(finalDuration)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Playback Speed:</Text>
              <Text style={styles.summaryValue}>{playbackRate}x</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090F',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#4B7EFF',
    borderRadius: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  videoContainer: {
    width: '100%',
    height: 250,
    backgroundColor: 'black',
    position: 'relative',
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
  trimOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  trimText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  controlsContainer: {
    flex: 1,
    padding: 20,
  },
  playbackControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 20,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4B7EFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#22C55E',
    borderRadius: 8,
  },
  previewButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  seekContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
    minWidth: 45,
  },
  slider: {
    flex: 1,
    marginHorizontal: 10,
  },
  fullSlider: {
    width: '100%',
    marginBottom: 8,
  },
  resetButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 6,
  },
  resetButtonText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
  speedControls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  speedButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  speedButtonActive: {
    backgroundColor: '#4B7EFF',
  },
  speedButtonText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '600',
  },
  speedButtonTextActive: {
    color: 'white',
    fontWeight: '700',
  },
  summaryContainer: {
    backgroundColor: '#111120',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 20,
  },
  summaryTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  summaryValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
});
