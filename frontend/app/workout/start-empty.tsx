import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useWorkout } from '@/context/WorkoutContext';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function StartEmptyWorkoutScreen() {
  const [workoutName, setWorkoutName] = useState(`Workout - ${new Date().toLocaleDateString()}`);
  const { startWorkout, isLoading } = useWorkout();
  const colorScheme = useColorScheme() ?? 'light';

  const handleStartWorkout = async () => {
    if (!workoutName.trim()) {
      Alert.alert('Error', 'Please enter a workout name');
      return;
    }

    try {
      await startWorkout({
        name: workoutName,
      });
      // Navigation is handled in the workout context
    } catch (error) {
      console.error('Failed to start empty workout:', error);
      Alert.alert('Error', 'Failed to start workout. Please try again.');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <IconSymbol name="arrow.left" size={24} color={Colors[colorScheme].text} />
        </TouchableOpacity>
        <ThemedText type="title">Start Empty Workout</ThemedText>
      </ThemedView>

      <ThemedView style={styles.content}>
        <ThemedText style={styles.description}>
          You're starting an empty workout. You can add exercises during your session.
        </ThemedText>

        <ThemedView style={styles.formGroup}>
          <ThemedText style={styles.label}>Workout Name</ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colorScheme === 'dark' ? '#333' : '#f5f5f5',
                color: colorScheme === 'dark' ? '#fff' : '#000',
              },
            ]}
            value={workoutName}
            onChangeText={setWorkoutName}
            placeholder="Enter workout name"
            placeholderTextColor={colorScheme === 'dark' ? '#aaa' : '#777'}
          />
        </ThemedView>

        <ThemedView style={styles.notesContainer}>
          <IconSymbol name="list.bullet" size={24} color={Colors[colorScheme].text} />
          <ThemedText style={styles.notesText}>
            You'll be able to add exercises when your workout begins.
          </ThemedText>
        </ThemedView>

        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartWorkout}
          disabled={isLoading}>
          <ThemedText style={styles.startButtonText}>
            {isLoading ? 'Starting...' : 'Start Empty Workout'}
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  description: {
    fontSize: 16,
    marginBottom: 32,
    opacity: 0.8,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 32,
  },
  notesText: {
    flex: 1,
    marginLeft: 16,
  },
  startButton: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});