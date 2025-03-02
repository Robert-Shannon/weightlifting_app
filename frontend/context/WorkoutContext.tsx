import { router } from 'expo-router';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';

import {
  workoutService,
  WorkoutSession,
  WorkoutExercise,
  WorkoutSet,
  WorkoutSessionCreateData,
  WorkoutExerciseCreateData,
  WorkoutSetCreateData,
  WorkoutSetUpdateData,
} from '@/services/workout.service';

interface WorkoutContextType {
  activeWorkout: WorkoutSession | null;
  currentExerciseIndex: number;
  isLoading: boolean;
  isRestTimerActive: boolean;
  restTimeRemaining: number;
  startWorkout: (data: WorkoutSessionCreateData) => Promise<void>;
  completeWorkout: () => Promise<void>;
  addExercise: (data: WorkoutExerciseCreateData) => Promise<void>;
  startExercise: (exerciseId: string) => Promise<void>;
  completeExercise: (exerciseId: string) => Promise<void>;
  navigateToExercise: (index: number) => void;
  logSet: (exerciseId: string, data: WorkoutSetCreateData) => Promise<void>;
  updateSet: (exerciseId: string, setId: string, data: WorkoutSetUpdateData) => Promise<void>;
  startRestTimer: (exerciseId: string, setId: string, duration: number) => Promise<void>;
  skipRestTimer: () => void;
  refreshWorkout: () => Promise<void>;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export function WorkoutProvider({ children }: { children: ReactNode }) {
  const [activeWorkout, setActiveWorkout] = useState<WorkoutSession | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRestTimerActive, setIsRestTimerActive] = useState<boolean>(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState<number>(0);
  const [restTimerId, setRestTimerId] = useState<NodeJS.Timeout | null>(null);

  // Clean up timer when component unmounts
  useEffect(() => {
    return () => {
      if (restTimerId) {
        clearInterval(restTimerId);
      }
    };
  }, [restTimerId]);

  const startWorkout = async (data: WorkoutSessionCreateData) => {
    try {
      setIsLoading(true);
      const workout = await workoutService.startWorkout(data);
      setActiveWorkout(workout);
      setCurrentExerciseIndex(0);
      router.replace('/active-workout');
    } catch (error) {
      console.error('Failed to start workout:', error);
      Alert.alert('Error', 'Failed to start workout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshWorkout = async () => {
    if (!activeWorkout) return;
    
    try {
      setIsLoading(true);
      const workout = await workoutService.getWorkoutSession(activeWorkout.id);
      setActiveWorkout(workout);
    } catch (error) {
      console.error('Failed to refresh workout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const completeWorkout = async () => {
    if (!activeWorkout) return;
    
    try {
      setIsLoading(true);
      await workoutService.completeWorkout(activeWorkout.id);
      setActiveWorkout(null);
      setCurrentExerciseIndex(0);
      
      // Stop any active rest timer
      if (restTimerId) {
        clearInterval(restTimerId);
        setRestTimerId(null);
        setIsRestTimerActive(false);
      }
      
      router.replace('/');
      Alert.alert('Workout Completed', 'Great job! Your workout has been saved.');
    } catch (error) {
      console.error('Failed to complete workout:', error);
      Alert.alert('Error', 'Failed to complete workout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const addExercise = async (data: WorkoutExerciseCreateData) => {
    if (!activeWorkout) return;
    
    try {
      setIsLoading(true);
      await workoutService.addExercise(activeWorkout.id, data);
      await refreshWorkout();
    } catch (error) {
      console.error('Failed to add exercise:', error);
      Alert.alert('Error', 'Failed to add exercise. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const startExercise = async (exerciseId: string) => {
    if (!activeWorkout) return;
    
    try {
      setIsLoading(true);
      await workoutService.startExercise(activeWorkout.id, exerciseId);
      await refreshWorkout();
    } catch (error) {
      console.error('Failed to start exercise:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const completeExercise = async (exerciseId: string) => {
    if (!activeWorkout) return;
    
    try {
      setIsLoading(true);
      await workoutService.completeExercise(activeWorkout.id, exerciseId);
      await refreshWorkout();
      
      // Move to next exercise if available
      if (activeWorkout.exercises && currentExerciseIndex < activeWorkout.exercises.length - 1) {
        setCurrentExerciseIndex(currentExerciseIndex + 1);
      }
    } catch (error) {
      console.error('Failed to complete exercise:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToExercise = (index: number) => {
    if (!activeWorkout || !activeWorkout.exercises) return;
    
    if (index >= 0 && index < activeWorkout.exercises.length) {
      setCurrentExerciseIndex(index);
    }
  };

  const logSet = async (exerciseId: string, data: WorkoutSetCreateData) => {
    if (!activeWorkout) return;
    
    try {
      setIsLoading(true);
      await workoutService.logSet(activeWorkout.id, exerciseId, data);
      await refreshWorkout();
    } catch (error) {
      console.error('Failed to log set:', error);
      Alert.alert('Error', 'Failed to log set. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSet = async (exerciseId: string, setId: string, data: WorkoutSetUpdateData) => {
    if (!activeWorkout) return;
    
    try {
      setIsLoading(true);
      await workoutService.updateSet(activeWorkout.id, exerciseId, setId, data);
      await refreshWorkout();
    } catch (error) {
      console.error('Failed to update set:', error);
      Alert.alert('Error', 'Failed to update set. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const startRestTimer = async (exerciseId: string, setId: string, duration: number) => {
    if (!activeWorkout) return;
    
    try {
      // Start rest timer in the backend
      await workoutService.startRestTimer(activeWorkout.id, exerciseId, setId);
      
      // Start local countdown timer
      setRestTimeRemaining(duration);
      setIsRestTimerActive(true);
      
      // Clear any existing timer
      if (restTimerId) {
        clearInterval(restTimerId);
      }
      
      // Set up the interval for counting down
      const timerId = setInterval(() => {
        setRestTimeRemaining((prevTime) => {
          if (prevTime <= 1) {
            // Time's up, clear the interval and mark rest as completed
            clearInterval(timerId);
            setIsRestTimerActive(false);
            setRestTimerId(null);
            workoutService.endRestTimer(activeWorkout.id, exerciseId, setId)
              .catch(error => console.error('Failed to end rest timer:', error));
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
      
      setRestTimerId(timerId);
      
    } catch (error) {
      console.error('Failed to start rest timer:', error);
    }
  };

  const skipRestTimer = () => {
    if (restTimerId) {
      clearInterval(restTimerId);
      setRestTimerId(null);
      setIsRestTimerActive(false);
      setRestTimeRemaining(0);
      
      // If we have an active workout, find the current exercise and its current set to end the rest timer
      if (activeWorkout && activeWorkout.exercises && activeWorkout.exercises[currentExerciseIndex]) {
        const exercise = activeWorkout.exercises[currentExerciseIndex];
        if (exercise.sets && exercise.sets.length > 0) {
          // Find the latest set with an active rest timer
          const setWithRestTimer = [...exercise.sets]
            .reverse()
            .find(set => set.rest_start_time && !set.rest_end_time);
            
          if (setWithRestTimer) {
            workoutService.endRestTimer(activeWorkout.id, exercise.id, setWithRestTimer.id)
              .catch(error => console.error('Failed to end rest timer after skip:', error));
          }
        }
      }
    }
  };

  return (
    <WorkoutContext.Provider
      value={{
        activeWorkout,
        currentExerciseIndex,
        isLoading,
        isRestTimerActive,
        restTimeRemaining,
        startWorkout,
        completeWorkout,
        addExercise,
        startExercise,
        completeExercise,
        navigateToExercise,
        logSet,
        updateSet,
        startRestTimer,
        skipRestTimer,
        refreshWorkout,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (context === undefined) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
}