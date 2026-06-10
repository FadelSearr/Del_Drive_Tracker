import React, { useState } from 'react';
import { StyleSheet, Dimensions, SafeAreaView, TouchableOpacity } from 'react-native';
import { View, Text } from '@/components/Themed';
import { Stack, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Welcome to Del_Road",
      description: "Track your drives, compete with friends, and discover your driving habits.",
    },
    {
      title: "Drive & Track",
      description: "Automatically log your routes, top speeds, and g-forces in the background.",
    },
    {
      title: "Compete & Share",
      description: "Hit speed zones, unlock milestones, and share your beautiful drive cards.",
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.content} type="background">
        <View style={styles.heroSection} type="surface">
          {/* Placeholder for future 3D/Animation asset */}
          <Text style={styles.heroPlaceholder} type="muted">App Illustration {step + 1}</Text>
        </View>

        <View style={styles.textSection} type="background">
          <Text style={styles.title}>{steps[step].title}</Text>
          <Text style={styles.description} type="muted">
            {steps[step].description}
          </Text>
        </View>

        <View style={styles.footer} type="background">
          <View style={styles.pagination}>
            {steps.map((_, index) => (
              <View 
                key={index} 
                style={[styles.dot, step === index && styles.dotActive]} 
                type={(step === index ? "primary" : "border") as any} 
              />
            ))}
          </View>

          <TouchableOpacity onPress={handleNext} style={styles.buttonWrapper}>
            <LinearGradient
              colors={['#007AFF', '#0A84FF']}
              style={styles.button}
            >
              <Text style={styles.buttonText}>{step === steps.length - 1 ? "Get Started" : "Next"}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  heroSection: {
    flex: 0.5,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  heroPlaceholder: {
    fontSize: 16,
    fontWeight: '600',
  },
  textSection: {
    flex: 0.3,
    justifyContent: 'center',
    paddingTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 18,
    lineHeight: 26,
  },
  footer: {
    flex: 0.2,
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
  pagination: {
    flexDirection: 'row',
    marginBottom: 32,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  dotActive: {
    width: 24,
  },
  buttonWrapper: {
    width: '100%',
  },
  button: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
