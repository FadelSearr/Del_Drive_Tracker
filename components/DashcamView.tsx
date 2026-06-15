import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Feather } from '@expo/vector-icons';
import { SvgXml } from 'react-native-svg';

interface DashcamViewProps {
  isRecording: boolean;
  speed: number;
  gForce: number;
  onRecordingComplete?: (uri: string) => void;
}

export default function DashcamView({ isRecording, speed, gForce, onRecordingComplete }: DashcamViewProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (isRecording && isReady) {
      startRecording();
    } else if (!isRecording && isReady) {
      stopRecording();
    }
  }, [isRecording, isReady]);

  const startRecording = async () => {
    if (cameraRef.current) {
      try {
        const video = await cameraRef.current.recordAsync();
        if (video && onRecordingComplete) {
          onRecordingComplete(video.uri);
        }
      } catch (e) {
        console.error("Recording error:", e);
      }
    }
  };

  const stopRecording = async () => {
    if (cameraRef.current) {
      cameraRef.current.stopRecording();
    }
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ color: 'white', textAlign: 'center', marginBottom: 20 }}>
          We need your permission to show the camera
        </Text>
        <Pressable style={styles.btn} onPress={requestPermission}>
          <Text style={{ color: 'white', fontWeight: '700' }}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        mode="video"
        ref={cameraRef}
        onCameraReady={() => setIsReady(true)}
      >
        {/* HUD OVERLAY */}
        <View style={styles.overlay}>
          {/* Top Info */}
          <View style={styles.topHud}>
            <View style={styles.recContainer}>
              {isRecording && <View style={styles.recDot} />}
              <Text style={styles.recText}>{isRecording ? 'REC' : 'STANDBY'}</Text>
            </View>
            <View style={styles.telemetryBox}>
              <Text style={styles.telemetryLabel}>RESOLUTION</Text>
              <Text style={styles.telemetryVal}>1080P</Text>
            </View>
          </View>

          {/* Center Focus (Optional visual) */}
          <View style={styles.focusFrame} />

          {/* Bottom Telemetry */}
          <View style={styles.bottomHud}>
            {/* Speedometer HUD */}
            <View style={styles.speedHud}>
              <Text style={styles.speedVal}>{Math.round(speed)}</Text>
              <Text style={styles.speedUnit}>KM/H</Text>
            </View>

            {/* G-Force HUD */}
            <View style={styles.gforceHud}>
              <Text style={styles.gLabel}>G-FORCE</Text>
              <Text style={styles.gVal}>{gForce.toFixed(2)}</Text>
              <View style={styles.gCircle}>
                 <View style={[styles.gDot, { 
                   transform: [
                     { translateX: (Math.random() - 0.5) * 20 }, 
                     { translateY: (Math.random() - 0.5) * 20 }
                   ] 
                 }]} />
              </View>
            </View>
          </View>

          {/* Corner Watermark */}
          <View style={styles.watermark}>
            <Text style={styles.watermarkText}>DEL ROAD DASHCAM • V1.0</Text>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    padding: 24,
    justifyContent: 'space-between',
  },
  btn: {
    backgroundColor: '#4B7EFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  topHud: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
  },
  recContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  recDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  recText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  telemetryBox: {
    alignItems: 'flex-end',
  },
  telemetryLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  telemetryVal: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  focusFrame: {
    width: 60,
    height: 60,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    borderRadius: 30,
  },
  bottomHud: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 60,
  },
  speedHud: {
    alignItems: 'flex-start',
  },
  speedVal: {
    color: 'white',
    fontSize: 64,
    fontWeight: '900',
    letterSpacing: -2,
  },
  speedUnit: {
    color: '#00E5FF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: -8,
  },
  gforceHud: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  gLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 8,
    fontWeight: '800',
    marginBottom: 4,
  },
  gVal: {
    color: 'white',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 8,
  },
  gCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F97316',
  },
  watermark: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
  },
  watermarkText: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 3,
  },
});
