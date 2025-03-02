import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput,
  Modal,
  Animated,
  Easing,
  ActivityIndicator,
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useWorkout } from '@/context/WorkoutContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Exercise, exerciseService } from '@/services/exercise.service';
import { workoutService, WorkoutExercise, WorkoutSet } from '@/services/workout.service';

export default function ActiveWorkoutScreen() {
  const {
    activeWorkout,
    currentExerciseIndex,
    isRestTimerActive,
    restTimeRemaining,
    isLoading,
    navigateToExercise,
    startExercise,
    completeExercise,
    logSet,
    startRestTimer,
    skipRestTimer,
    completeWorkout,
    refreshWorkout,
  } = useWorkout();
  const colorScheme = useColorScheme() ?? 'light';
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoadingExercises, setIsLoadingExercises] = useState(false);
  const [confirmEndWorkout, setConfirmEndWorkout] = useState(false);
  const [newSetWeight, setNewSetWeight] = useState('0');
  const [newSetReps, setNewSetReps] = useState('0');
  const [newSetRPE, setNewSetRPE] = useState('');
  const [notes, setNotes] = useState('');
  const [exitAnimatedValue] = useState(new Animated.Value(0));

  useEffect(() => {
    // Redirect to home if no active workout
    if (!activeWorkout) {
      router.replace('/');
      return;
    }
  
    // Refresh workout data
    refreshWorkout();
  }, [activeWorkout, refreshWorkout]);

  useEffect(() => {
    // Reset form fields when changing exercises
    if (activeWorkout?.exercises?.[currentExerciseIndex]) {
      // Get previous weights if there are logged sets
      const currentExercise = activeWorkout.exercises[currentExerciseIndex];
      if (currentExercise.sets && currentExercise.sets.length > 0) {
        const lastSet = currentExercise.sets[currentExercise.sets.length - 1];
        setNewSetWeight(lastSet.weight.toString());
        setNewSetReps('0');
      } else {
        setNewSetWeight('0');
        setNewSetReps('0');
      }
      setNewSetRPE('');
      setNotes('');
    }
  }, [currentExerciseIndex, activeWorkout]);

  const handleAddExercise = () => {
    setShowExerciseSelector(true);
    fetchExercises();
  };

  const fetchExercises = async () => {
    try {
      setIsLoadingExercises(true);
      const data = await exerciseService.getExercises();
      setExercises(data);
    } catch (error) {
      console.error('Failed to fetch exercises:', error);
      Alert.alert('Error', 'Failed to load exercises');
    } finally {
      setIsLoadingExercises(false);
    }
  };

  const handleSelectExercise = async (exercise: Exercise) => {
    if (!activeWorkout) return;

    try {
      // Add exercise to the workout
      const nextOrder = activeWorkout.exercises
        ? Math.max(...activeWorkout.exercises.map((e) => e.order)) + 1
        : 1;

      await workoutService.addExercise(activeWorkout.id, {
        exercise_id: exercise.id,
        order: nextOrder,
      });

      // Refresh workout data
      await refreshWorkout();
      setShowExerciseSelector(false);

      // Navigate to the new exercise
      if (activeWorkout.exercises) {
        navigateToExercise(activeWorkout.exercises.length - 1);
      }
    } catch (error) {
      console.error('Failed to add exercise:', error);
      Alert.alert('Error', 'Failed to add exercise to workout');
    }
  };

  const handleLogSet = async () => {
    if (!activeWorkout || !activeWorkout.exercises) return;

    const currentExercise = activeWorkout.exercises[currentExerciseIndex];
    
    try {
      const weight = parseFloat(newSetWeight) || 0;
      const reps = parseInt(newSetReps) || 0;
      const rpe = newSetRPE ? parseInt(newSetRPE) : undefined;
      
      const nextSetNumber = (currentExercise.sets?.length || 0) + 1;
      
      await logSet(currentExercise.id, {
        set_number: nextSetNumber,
        reps_completed: reps,
        weight: weight,
        is_warmup: false,
        rpe: rpe,
        notes: notes || undefined,
      });
      
      // Start rest timer (default 90 seconds)
      await startRestTimer(currentExercise.id, currentExercise.id, 90);
      
      // Reset input fields
      setNewSetReps('0');
      setNewSetRPE('');
      setNotes('');
    } catch (error) {
      console.error('Failed to log set:', error);
      Alert.alert('Error', 'Failed to log set');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Animation for rest timer
  useEffect(() => {
    if (isRestTimerActive) {
      Animated.timing(exitAnimatedValue, {
        toValue: 100,
        duration: restTimeRemaining * 1000,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();
    } else {
      exitAnimatedValue.setValue(0);
    }
  }, [isRestTimerActive, restTimeRemaining, exitAnimatedValue]);

  const progressWidth = exitAnimatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  // If no workout is active, show a message
  if (!activeWorkout) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ThemedText>No active workout</ThemedText>
        <TouchableOpacity
          style={styles.startWorkoutButton}
          onPress={() => router.push('/start-workout')}>
          <ThemedText style={styles.startWorkoutButtonText}>Start Workout</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  // If no exercises in the workout, show option to add
  if (!activeWorkout.exercises || activeWorkout.exercises.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">{activeWorkout.name}</ThemedText>
        </ThemedView>
        
        <ThemedView style={[styles.centered, { flex: 1 }]}>
          <ThemedText style={styles.emptyText}>No exercises added yet</ThemedText>
          <TouchableOpacity
            style={styles.addExerciseButton}
            onPress={handleAddExercise}>
            <IconSymbol name="plus.circle.fill" size={20} color="white" />
            <ThemedText style={styles.addExerciseButtonText}>Add Exercise</ThemedText>
          </TouchableOpacity>
        </ThemedView>
        
        <TouchableOpacity
          style={styles.endWorkoutButton}
          onPress={() => setConfirmEndWorkout(true)}>
          <ThemedText style={styles.endWorkoutButtonText}>End Workout</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  const currentExercise = activeWorkout.exercises[currentExerciseIndex];

  // Render the exercise selector modal
  if (showExerciseSelector) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setShowExerciseSelector(false)}>
            <IconSymbol name="arrow.left" size={24} color={textColor} />
          </TouchableOpacity>
          <ThemedText type="title">Select Exercise</ThemedText>
        </ThemedView>

        {isLoadingExercises ? (
          <ThemedView style={styles.centered}>
            <ThemedText>Loading exercises...</ThemedText>
          </ThemedView>
        ) : (
          <FlatList
            data={exercises}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.exerciseListItem}
                onPress={() => handleSelectExercise(item)}>
                <ThemedView>
                  <ThemedText style={styles.exerciseName}>{item.name}</ThemedText>
                  <ThemedText style={styles.exerciseDetail}>
                    {item.target_muscle_group} • {item.primary_equipment}
                  </ThemedText>
                </ThemedView>
                <IconSymbol name="plus.circle.fill" size={20} color={tintColor} />
              </TouchableOpacity>
            )}
          />
        )}
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Workout header */}
      <ThemedView style={styles.header}>
        <ThemedText type="title">{activeWorkout.name}</ThemedText>
        <TouchableOpacity
          style={styles.addExerciseIcon}
          onPress={handleAddExercise}>
          <IconSymbol name="plus.circle.fill" size={28} color={tintColor} />
        </TouchableOpacity>
      </ThemedView>

      {/* Exercise navigation tabs */}
      <FlatList
        data={activeWorkout.exercises}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[
              styles.exerciseTab,
              currentExerciseIndex === index && { backgroundColor: tintColor },
            ]}
            onPress={() => navigateToExercise(index)}>
            <ThemedText
              style={[
                styles.exerciseTabText,
                currentExerciseIndex === index && { color: 'white', fontWeight: 'bold' },
              ]}>
              {item.exercise?.name || `Exercise ${index + 1}`}
            </ThemedText>
          </TouchableOpacity>
        )}
        style={styles.exerciseTabs}
      />

      {/* Current exercise details */}
      <ThemedView style={styles.exerciseContainer}>
        <ThemedView style={styles.exerciseHeader}>
          <ThemedView>
            <ThemedText style={styles.exerciseTitle}>
              {currentExercise.exercise?.name || 'Exercise'}
            </ThemedText>
            {currentExercise.exercise?.target_muscle_group && (
              <ThemedText style={styles.exerciseSubtitle}>
                {currentExercise.exercise.target_muscle_group} • {currentExercise.exercise.primary_equipment}
              </ThemedText>
            )}
          </ThemedView>

          {!currentExercise.started_at ? (
            <TouchableOpacity
              style={styles.startExerciseButton}
              onPress={() => startExercise(currentExercise.id)}>
              <ThemedText style={styles.startExerciseButtonText}>Start</ThemedText>
            </TouchableOpacity>
          ) : !currentExercise.completed_at ? (
            <TouchableOpacity
              style={styles.completeExerciseButton}
              onPress={() => completeExercise(currentExercise.id)}>
              <ThemedText style={styles.completeExerciseButtonText}>Complete</ThemedText>
            </TouchableOpacity>
          ) : (
            <ThemedView style={styles.completedBadge}>
              <IconSymbol name="checkmark.circle.fill" size={16} color="green" />
              <ThemedText style={styles.completedText}>Completed</ThemedText>
            </ThemedView>
          )}
        </ThemedView>

        {/* Sets history */}
        <ThemedView style={styles.setsContainer}>
          <ThemedText style={styles.sectionTitle}>Sets</ThemedText>
          
          {currentExercise.sets && currentExercise.sets.length > 0 ? (
            <ThemedView style={styles.setsTable}>
              <ThemedView style={styles.setsHeader}>
                <ThemedText style={[styles.setHeaderText, { flex: 0.5 }]}>Set</ThemedText>
                <ThemedText style={[styles.setHeaderText, { flex: 1 }]}>Weight</ThemedText>
                <ThemedText style={[styles.setHeaderText, { flex: 1 }]}>Reps</ThemedText>
                <ThemedText style={[styles.setHeaderText, { flex: 1 }]}>RPE</ThemedText>
              </ThemedView>
              
              <FlatList
                data={currentExercise.sets}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <SetHistoryItem set={item} />
                )}
                style={styles.setsList}
              />
            </ThemedView>
          ) : (
            <ThemedText style={styles.noSetsText}>No sets logged yet</ThemedText>
          )}
        </ThemedView>

        {/* Log Set Form */}
        <ThemedView style={styles.logSetContainer}>
          <ThemedText style={styles.sectionTitle}>Log Set</ThemedText>
          
          <ThemedView style={styles.logSetForm}>
            <ThemedView style={styles.inputRow}>
              <ThemedView style={[styles.inputContainer, { flex: 1 }]}>
                <ThemedText style={styles.inputLabel}>Weight</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colorScheme === 'dark' ? '#333' : '#f5f5f5',
                      color: colorScheme === 'dark' ? '#fff' : '#000',
                    },
                  ]}
                  value={newSetWeight}
                  onChangeText={setNewSetWeight}
                  keyboardType="decimal-pad"
                />
              </ThemedView>
              
              <ThemedView style={[styles.inputContainer, { flex: 1 }]}>
                <ThemedText style={styles.inputLabel}>Reps</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colorScheme === 'dark' ? '#333' : '#f5f5f5',
                      color: colorScheme === 'dark' ? '#fff' : '#000',
                    },
                  ]}
                  value={newSetReps}
                  onChangeText={setNewSetReps}
                  keyboardType="number-pad"
                />
              </ThemedView>
              
              <ThemedView style={[styles.inputContainer, { flex: 1 }]}>
                <ThemedText style={styles.inputLabel}>RPE (1-10)</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colorScheme === 'dark' ? '#333' : '#f5f5f5',
                      color: colorScheme === 'dark' ? '#fff' : '#000',
                    },
                  ]}
                  value={newSetRPE}
                  onChangeText={setNewSetRPE}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="Optional"
                  placeholderTextColor={colorScheme === 'dark' ? '#aaa' : '#777'}
                />
              </ThemedView>
            </ThemedView>
            
            <ThemedView style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Notes (optional)</ThemedText>
              <TextInput
                style={[
                  styles.notesInput,
                  {
                    backgroundColor: colorScheme === 'dark' ? '#333' : '#f5f5f5',
                    color: colorScheme === 'dark' ? '#fff' : '#000',
                  },
                ]}
                value={notes}
                onChangeText={setNotes}
                multiline
                placeholder="Add notes about this set..."
                placeholderTextColor={colorScheme === 'dark' ? '#aaa' : '#777'}
              />
            </ThemedView>
            
            <TouchableOpacity
              style={styles.logSetButton}
              onPress={handleLogSet}
              disabled={isLoading}>
              <ThemedText style={styles.logSetButtonText}>
                {isLoading ? 'Logging...' : 'Log Set'}
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </ThemedView>

      {/* Rest Timer Modal */}
      <Modal
        visible={isRestTimerActive}
        transparent
        animationType="fade">
        <ThemedView style={styles.restTimerContainer}>
          <ThemedView style={styles.restTimerContent}>
          <IconSymbol name="timer" size={40} color={tintColor} />
            <ThemedText style={styles.restTimerTitle}>Rest Time</ThemedText>
            <ThemedText style={styles.restTimerTime}>{formatTime(restTimeRemaining)}</ThemedText>
            
            <ThemedView style={styles.restTimerProgressContainer}>
              <Animated.View 
                style={[
                  styles.restTimerProgress, 
                  { width: progressWidth, backgroundColor: tintColor }
                ]} 
              />
            </ThemedView>
            
            <TouchableOpacity
              style={styles.skipButton}
              onPress={skipRestTimer}>
              <ThemedText style={styles.skipButtonText}>Skip</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </Modal>

      {/* End Workout Button */}
      <TouchableOpacity
        style={styles.endWorkoutButton}
        onPress={() => setConfirmEndWorkout(true)}>
        <ThemedText style={styles.endWorkoutButtonText}>End Workout</ThemedText>
      </TouchableOpacity>

      {/* Confirm End Workout Modal */}
      <Modal
        visible={confirmEndWorkout}
        transparent
        animationType="fade">
        <ThemedView style={styles.confirmModalContainer}>
          <ThemedView style={styles.confirmModalContent}>
            <ThemedText style={styles.confirmModalTitle}>End Workout?</ThemedText>
            <ThemedText style={styles.confirmModalText}>
              Are you sure you want to end this workout? This action cannot be undone.
            </ThemedText>
            
            <ThemedView style={styles.confirmModalButtons}>
              <TouchableOpacity
                style={[styles.confirmModalButton, styles.cancelButton]}
                onPress={() => setConfirmEndWorkout(false)}>
                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.confirmModalButton, styles.confirmButton]}
                onPress={() => {
                  setConfirmEndWorkout(false);
                  completeWorkout();
                }}>
                <ThemedText style={styles.confirmButtonText}>End Workout</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

interface SetHistoryItemProps {
  set: WorkoutSet;
}

function SetHistoryItem({ set }: SetHistoryItemProps) {
  return (
    <ThemedView style={styles.setItem}>
      <ThemedText style={[styles.setText, { flex: 0.5 }]}>{set.set_number}</ThemedText>
      <ThemedText style={[styles.setText, { flex: 1 }]}>{set.weight}</ThemedText>
      <ThemedText style={[styles.setText, { flex: 1 }]}>{set.reps_completed}</ThemedText>
      <ThemedText style={[styles.setText, { flex: 1 }]}>{set.rpe || '-'}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addExerciseIcon: {
    padding: 8,
  },
  exerciseTabs: {
    maxHeight: 50,
    marginBottom: 16,
  },
  exerciseTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  exerciseTabText: {
    fontWeight: '500',
  },
  exerciseContainer: {
    flex: 1,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  exerciseTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  exerciseSubtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  startExerciseButton: {
    backgroundColor: '#0a7ea4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  startExerciseButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  completeExerciseButton: {
    backgroundColor: '#4CD964',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  completeExerciseButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 217, 100, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  completedText: {
    color: 'green',
    marginLeft: 4,
    fontWeight: '500',
  },
  setsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  setsTable: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  setsHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  setHeaderText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  setsList: {
    maxHeight: 200,
  },
  setItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  setText: {
    fontSize: 14,
  },
  noSetsText: {
    opacity: 0.7,
    textAlign: 'center',
    paddingVertical: 20,
  },
  logSetContainer: {
    flex: 1,
  },
  logSetForm: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 8,
    padding: 16,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 6,
    opacity: 0.8,
  },
  input: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  notesInput: {
    height: 80,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  logSetButton: {
    backgroundColor: '#0a7ea4',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logSetButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  endWorkoutButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  endWorkoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  restTimerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  restTimerContent: {
    width: '80%',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  restTimerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
  },
  restTimerTime: {
    fontSize: 48,
    fontWeight: 'bold',
    marginVertical: 24,
  },
  restTimerProgressContainer: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 24,
  },
  restTimerProgress: {
    height: '100%',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  skipButtonText: {
    fontWeight: 'bold',
  },
  confirmModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  confirmModalContent: {
    width: '80%',
    borderRadius: 16,
    padding: 24,
  },
  confirmModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  confirmModalText: {
    marginBottom: 24,
  },
  confirmModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confirmModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  cancelButtonText: {
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#FF3B30',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  backButton: {
    marginRight: 16,
  },
  exerciseListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  exerciseDetail: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 24,
    textAlign: 'center',
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a7ea4',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addExerciseButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  startWorkoutButton: {
    backgroundColor: '#0a7ea4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  startWorkoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

