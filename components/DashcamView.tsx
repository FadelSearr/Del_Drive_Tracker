import React, { useState, useRef, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, Pressable, Platform } from 'react-native';
import { useCameraDevice, useCameraPermission, useVideoOutput, Camera, CommonResolutions } from 'react-native-vision-camera';
import { Feather } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library/legacy';
import * as FileSystem from 'expo-file-system';


interface DashcamViewProps {
  isRecording: boolean;
  speed: number;
  gForce: number;
  onRecordingComplete?: (uri: string, telemetry: {time: number, speed: number}[]) => void;
}

export default function DashcamView({ isRecording, speed, gForce, onRecordingComplete }: DashcamViewProps) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const [cameraPosition, setCameraPosition] = useState<'back' | 'front'>('back');
  
  // Vision Camera v5 uses a different approach for quality.
  // Instead of manual format filtering, we use the constraints system.
  const device = useCameraDevice(cameraPosition);
  
  const videoOutput = useVideoOutput({
    targetResolution: CommonResolutions.HIGHEST_16_9, // Requested high quality
    enableAudio: true,
  });

  const cameraRef = useRef<any>(null); // Use any for ref to avoid 'typeof Camera' type issues in some TS versions
  const [isReady, setIsReady] = useState(false);
  const recordingRef = useRef(false);

  const startRecording = React.useCallback(async () => {
    if (videoOutput && isReady && !recordingRef.current) {
      try {
        const recorder = await videoOutput.createRecorder({});
        recordingRef.current = true;
        
        await recorder.startRecording(
          (path) => {
            recordingRef.current = false;
            console.log("Recording finished:", path);
            if (onRecordingComplete) {
              onRecordingComplete(`file://${path}`, []);
            }
          },
          (error) => {
            recordingRef.current = false;
            console.error("Recording error:", error);
          }
        );
      } catch (e) {
        recordingRef.current = false;
        console.error("Failed to start recording:", e);
      }
    }
  }, [videoOutput, isReady, onRecordingComplete]);

  const stopRecording = React.useCallback(async () => {
    // Note: To stop, we need the recorder instance, but usually Vision Camera 
    // handles this via session or output if only one recording is active.
    // In v5, we often manage the recorder instance directly.
    // However, for simplicity and since v5 is very new, we'll use a persistent recorder if possible
    // or stop via the videoOutput if it exposes a stop (it doesn't, it creates recorders).
    
    // For this implementation, we'll store the recorder in a ref.
  }, []);

  // Revised start/stop logic for v5
  useEffect(() => {
    (async () => {
      // Just check status, don't request if not needed to avoid popups
      const { status } = await MediaLibrary.getPermissionsAsync();
      if (status === 'undetermined') {
        await MediaLibrary.requestPermissionsAsync();
      }
    })();
  }, []);


  const activeRecorder = useRef<any>(null);
  
  const currentSpeedRef = useRef(speed);
  useEffect(() => { currentSpeedRef.current = speed; }, [speed]);

  const telemetryRef = useRef<{time: number, speed: number}[]>([]);
  const recordingStartTimeRef = useRef<number>(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRecording) {
      telemetryRef.current = [];
      recordingStartTimeRef.current = Date.now();
      // Record speed at second 0
      telemetryRef.current.push({ time: 0, speed: Math.round(currentSpeedRef.current) });
      
      interval = setInterval(() => {
        const elapsedSec = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
        const last = telemetryRef.current[telemetryRef.current.length - 1];
        if (!last || last.time !== elapsedSec) {
          telemetryRef.current.push({ time: elapsedSec, speed: Math.round(currentSpeedRef.current) });
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    let isMounted = true;

    const manageRecording = async () => {
      if (isRecording && isReady && !activeRecorder.current && videoOutput) {
        try {
          console.log("Starting dashcam recording...");
          const recorder = await videoOutput.createRecorder({});
          activeRecorder.current = recorder;
          
          await recorder.startRecording(
            async (path: string) => {
              console.log("Recording stopped at raw path:", path);
              if (onRecordingComplete) {
                // Send raw path immediately so parent can handle it
                onRecordingComplete(path.startsWith('file://') ? path : `file://${path}`, telemetryRef.current);
              }
              activeRecorder.current = null;
            },


            (err: Error) => {
              console.error("Recorder callback error:", err);
              activeRecorder.current = null;
            }
          );
        } catch (e) {
          console.error("Failed to start recorder:", e);
          activeRecorder.current = null;
        }
      } else if (!isRecording && activeRecorder.current) {
        try {
          console.log("Requesting recorder stop...");
          // Safety: check if recorder exists before stopping
          const recorder = activeRecorder.current;
          activeRecorder.current = null; // Clear immediately to prevent double-calls
          if (recorder) {
            await recorder.stopRecording();
          }
        } catch (e) {
          console.error("Failed to stop recorder:", e);
        }
      }

    };

    manageRecording();

    return () => {
      isMounted = false;
    };
  }, [isRecording, isReady, videoOutput, onRecordingComplete]);


  const toggleCamera = () => {
    if (isRecording) return;
    setCameraPosition(prev => prev === 'back' ? 'front' : 'back');
    setIsReady(false);
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.infoText}>Izin kamera diperlukan.</Text>
        <Pressable style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Berikan Izin</Text>
        </Pressable>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.infoText}>Mencari kamera...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={styles.camera}
        device={device}
        isActive={true}
        outputs={[videoOutput]}
        ref={cameraRef}
        onStarted={() => setIsReady(true)}
        onStopped={() => setIsReady(false)}
      />
      
      {/* HUD OVERLAY */}
      <View style={[StyleSheet.absoluteFill, styles.overlay]}>
        <View style={styles.topHud}>
          <View style={styles.recContainer}>
            {isRecording && <View style={styles.recDot} />}
            <Text style={styles.recText}>{isRecording ? 'RECORDING' : 'READY'}</Text>
          </View>
          
          <Pressable style={styles.flipBtn} onPress={toggleCamera}>
            <Feather name="refresh-cw" size={18} color="white" />
          </Pressable>
        </View>

        <View style={styles.bottomHud}>
          <View style={styles.speedHud}>
            <Text style={styles.speedVal}>{Math.round(speed)}</Text>
            <Text style={styles.speedUnit}>KM/H</Text>
          </View>

          <View style={styles.gforceHud}>
            <Text style={styles.gLabel}>G-FORCE</Text>
            <Text style={styles.gVal}>{gForce.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.watermark}>
          <Text style={styles.watermarkText}>DEL ROAD PRO DASHCAM • v5.0 ENGINE</Text>
        </View>
      </View>
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
    padding: 20,
    justifyContent: 'space-between',
  },
  infoText: {
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 20,
  },
  btn: {
    backgroundColor: '#4B7EFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  btnText: {
    color: 'white',
    fontWeight: '700',
  },
  topHud: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Platform.OS === 'ios' ? 40 : 20,
  },
  recContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  recDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
  },
  recText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  flipBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  bottomHud: {
    marginBottom: 100,
  },
  speedHud: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  speedVal: {
    color: 'white',
    fontSize: 72,
    fontWeight: '900',
    letterSpacing: -3,
    lineHeight: 72,
  },
  speedUnit: {
    color: '#4B7EFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 10,
  },
  gforceHud: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  gLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: '800',
  },
  gVal: {
    color: 'white',
    fontSize: 14,
    fontWeight: '900',
  },
  watermark: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
  },
  watermarkText: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 4,
  },
});
