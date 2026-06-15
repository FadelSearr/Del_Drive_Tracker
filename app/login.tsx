import { supabase } from '@/services/Supabase';
import { Feather } from '@expo/vector-icons';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// TODO: Tambahkan Web Client ID dari Google Cloud Console
GoogleSignin.configure({
  webClientId: '82092902747-aio6q28dur8s64fufpj70hepajfopv0o.apps.googleusercontent.com',
  offlineAccess: true,
});

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      if (userInfo.data?.idToken) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: userInfo.data.idToken,
        });
        
        if (error) throw error;
        
        // Cek jika berhasil
        if (data.session) {
          router.replace('/(tabs)/map');
        }
      } else {
        throw new Error('no ID token present!');
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled the login flow
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // operation (e.g. sign in) is in progress already
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Error', 'Google Play Services is not available');
      } else {
        Alert.alert('Login Failed', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Feather name="navigation" size={40} color="#4B7EFF" />
        </View>
        <Text style={styles.title}>Del Road</Text>
        <Text style={styles.subtitle}>Track your drives, analyze your telemetry, and sync to cloud.</Text>
      </View>

      <View style={styles.bottom}>
        <Pressable 
          style={({ pressed }) => [styles.googleButton, pressed && { opacity: 0.8 }]} 
          onPress={signInWithGoogle}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Feather name="globe" size={20} color="white" />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </>
          )}
        </Pressable>
        
        <Text style={styles.disclaimer}>
          Dengan melanjutkan, Anda menyetujui untuk menyimpan data mengemudi ke cloud.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090F',
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(75,126,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(75,126,255,0.2)',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: 'white',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  bottom: {
    paddingBottom: 40,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4B7EFF',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 12,
    marginBottom: 16,
  },
  googleButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  disclaimer: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
  }
});
