import { Link, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useWorkout } from '@/context/WorkoutContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { workoutService, WorkoutSession } from '@/services/workout.service';

export default function HomeScreen() {
  const { user } = useAuth();
  const { startWorkout } = useWorkout();
  const colorScheme = useColorScheme() ?? 'light';
  
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutSession[]>([]);
  const [isLoadingWorkouts, setIsLoadingWorkouts] = useState(true);

  useEffect(() => {
    const fetchRecentWorkouts = async () => {
      try {
        setIsLoadingWorkouts(true);
        const workouts = await workoutService.getWorkoutSessions();
        // Only get the most recent 5 workouts
        setRecentWorkouts(workouts.slice(0, 5));
      } catch (error) {
        console.error('Failed to fetch recent workouts:', error);
      } finally {
        setIsLoadingWorkouts(false);
      }
    };

    fetchRecentWorkouts();
  }, []);

  const handleQuickStart = async () => {
    try {
      await startWorkout({ name: `Workout ${new Date().toLocaleDateString()}` });
    } catch (error) {
      console.error('Failed to start quick workout:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatDuration = (duration: number) => {
    if (!duration) return '0m';
    
    const minutes = Math.floor(duration / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedView>
          <ThemedText type="title">Welcome Back</ThemedText>
          <ThemedText style={styles.userName}>{user?.name}</ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: useThemeColor({}, 'tint') }]}
          onPress={handleQuickStart}>
          <IconSymbol name="play.fill" color="white" size={20} />
          <ThemedText style={styles.actionButtonText}>Quick Start</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#4A90E2' }]}
          onPress={() => router.push('/start-workout')}>
          <IconSymbol name="plus.circle.fill" color="white" size={20} />
          <ThemedText style={styles.actionButtonText}>New Workout</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#50C878' }]}
          onPress={() => router.push('/templates')}>
          <IconSymbol name="doc.text.fill" color="white" size={20} />
          <ThemedText style={styles.actionButtonText}>Templates</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Recent Workouts</ThemedText>
        
        {isLoadingWorkouts ? (
          <ActivityIndicator size="large" color={useThemeColor({}, 'tint')} style={styles.loader} />
        ) : recentWorkouts.length > 0 ? (
          <FlatList
            data={recentWorkouts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.workoutCard}
                onPress={() => router.push(`/history/${item.id}` as any)}>
                <ThemedView style={styles.workoutCardContent}>
                  <ThemedText style={styles.workoutName}>{item.name}</ThemedText>
                  <ThemedText style={styles.workoutDate}>{formatDate(item.started_at)}</ThemedText>
                </ThemedView>
                
                {item.duration && (
                  <ThemedView style={styles.durationBadge}>
                    <IconSymbol name="timer" size={14} color={useThemeColor({}, 'text')} />
                    <ThemedText style={styles.durationText}>
                      {formatDuration(item.duration)}
                    </ThemedText>
                  </ThemedView>
                )}
              </TouchableOpacity>
            )}
            style={styles.workoutsList}
          />
        ) : (
          <ThemedView style={styles.emptyState}>
            <ThemedText style={styles.emptyStateText}>No recent workouts</ThemedText>
            <TouchableOpacity 
              style={styles.startWorkoutButton}
              onPress={() => router.push('/start-workout')}>
              <ThemedText style={styles.startWorkoutButtonText}>Start Your First Workout</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        )}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60, // Account for status bar
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  userName: {
    fontSize: 16,
    opacity: 0.7,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 14,
  },
  section: {
    marginBottom: 20,
  },
  loader: {
    marginTop: 20,
  },
  workoutsList: {
    marginTop: 12,
  },
  workoutCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)', // Slight contrast in light mode
    // For dark mode, we'll rely on the ThemedView background
  },
  workoutCardContent: {
    flex: 1,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  workoutDate: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)', // Subtle background
  },
  durationText: {
    fontSize: 12,
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyStateText: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 16,
  },
  startWorkoutButton: {
    padding: 12,
    backgroundColor: useThemeColor({}, 'tint'),
    borderRadius: 8,
  },
  startWorkoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});