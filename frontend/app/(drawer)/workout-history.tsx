import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  View,
  Text,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface WorkoutSession {
  id: string;
  name: string;
  started_at: string;
  completed_at: string;
  duration: number;
  total_volume: number;
  exercise_count: number;
}

export default function WorkoutHistoryScreen() {
  const colorScheme = useColorScheme();
  const textColor = colorScheme === 'dark' ? '#fff' : '#000';
  const backgroundColor = colorScheme === 'dark' ? '#121212' : '#f8f8f8';
  const cardColor = colorScheme === 'dark' ? '#1e1e1e' : '#fff';
  
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'all'>('month');

  // Fetch workout history from API (simulated)
  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        setIsLoading(true);
        
        // Simulated API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Sample data
        const sampleWorkouts: WorkoutSession[] = [
          {
            id: '1',
            name: 'Push Workout',
            started_at: '2023-09-10T08:30:00Z',
            completed_at: '2023-09-10T09:45:00Z',
            duration: 75,
            total_volume: 5240,
            exercise_count: 6,
          },
          {
            id: '2',
            name: 'Pull Day',
            started_at: '2023-09-08T17:15:00Z',
            completed_at: '2023-09-08T18:30:00Z',
            duration: 75,
            total_volume: 4820,
            exercise_count: 7,
          },
          {
            id: '3',
            name: 'Leg Workout',
            started_at: '2023-09-06T07:00:00Z',
            completed_at: '2023-09-06T08:10:00Z',
            duration: 70,
            total_volume: 8450,
            exercise_count: 5,
          },
          {
            id: '4',
            name: 'Full Body',
            started_at: '2023-09-03T16:00:00Z',
            completed_at: '2023-09-03T17:15:00Z',
            duration: 75,
            total_volume: 6320,
            exercise_count: 8,
          },
          {
            id: '5',
            name: 'Upper Body Focus',
            started_at: '2023-09-01T08:30:00Z',
            completed_at: '2023-09-01T09:40:00Z',
            duration: 70,
            total_volume: 4930,
            exercise_count: 7,
          },
          {
            id: '6',
            name: 'Lower Body + Core',
            started_at: '2023-08-29T17:00:00Z',
            completed_at: '2023-08-29T18:10:00Z',
            duration: 70,
            total_volume: 7420,
            exercise_count: 6,
          },
        ];
        
        // Filter workouts based on time selection
        const now = new Date();
        let filteredWorkouts = sampleWorkouts;
        
        if (timeFilter === 'week') {
          const oneWeekAgo = new Date(now);
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          filteredWorkouts = sampleWorkouts.filter(
            workout => new Date(workout.started_at) >= oneWeekAgo
          );
        } else if (timeFilter === 'month') {
          const oneMonthAgo = new Date(now);
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
          filteredWorkouts = sampleWorkouts.filter(
            workout => new Date(workout.started_at) >= oneMonthAgo
          );
        }
        
        setWorkouts(filteredWorkouts);
      } catch (error) {
        console.error('Failed to fetch workout history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkouts();
  }, [timeFilter]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.filterContainer}>
        <View style={[styles.filterButtons, { backgroundColor: 'rgba(0, 0, 0, 0.05)' }]}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              timeFilter === 'week' && [styles.activeFilterButton, { backgroundColor: '#2f95dc' }]
            ]}
            onPress={() => setTimeFilter('week')}>
            <Text
              style={[
                styles.filterButtonText,
                timeFilter === 'week' && styles.activeFilterText
              ]}>
              Week
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              timeFilter === 'month' && [styles.activeFilterButton, { backgroundColor: '#2f95dc' }]
            ]}
            onPress={() => setTimeFilter('month')}>
            <Text
              style={[
                styles.filterButtonText,
                timeFilter === 'month' && styles.activeFilterText
              ]}>
              Month
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              timeFilter === 'all' && [styles.activeFilterButton, { backgroundColor: '#2f95dc' }]
            ]}
            onPress={() => setTimeFilter('all')}>
            <Text
              style={[
                styles.filterButtonText,
                timeFilter === 'all' && styles.activeFilterText
              ]}>
              All Time
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2f95dc" />
        </View>
      ) : workouts.length > 0 ? (
        <FlatList
          data={workouts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.workoutCard, { backgroundColor: cardColor }]}
              onPress={() => router.push(`/workout-details/${item.id}`)}>
              <View style={styles.workoutHeader}>
                <Text style={[styles.workoutName, { color: textColor }]}>{item.name}</Text>
                <View style={styles.workoutDate}>
                  <Ionicons name="calendar-outline" size={14} color="#888" />
                  <Text style={styles.workoutDateText}>{formatDate(item.started_at)}</Text>
                </View>
              </View>
              
              <View style={styles.workoutDetails}>
                <View style={styles.workoutDetail}>
                  <Ionicons name="time-outline" size={16} color="#2f95dc" />
                  <Text style={styles.workoutDetailText}>{formatDuration(item.duration)}</Text>
                </View>
                
                <View style={styles.workoutDetail}>
                  <Ionicons name="barbell-outline" size={16} color="#2f95dc" />
                  <Text style={styles.workoutDetailText}>
                    {item.exercise_count} exercises
                  </Text>
                </View>
                
                <View style={styles.workoutDetail}>
                  <Ionicons name="stats-chart-outline" size={16} color="#2f95dc" />
                  <Text style={styles.workoutDetailText}>
                    {item.total_volume.toLocaleString()} kg
                  </Text>
                </View>
              </View>
              
              <View style={styles.workoutTimeInfo}>
                <Text style={styles.workoutTimeText}>
                  {formatTime(item.started_at)} - {formatTime(item.completed_at)}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.workoutList}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="fitness-outline" size={64} color="#ccc" />
          <Text style={[styles.emptyStateText, { color: textColor }]}>
            No workout history found for this time period
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 4,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeFilterButton: {
    backgroundColor: '#2f95dc',
  },
  filterButtonText: {
    fontWeight: '500',
  },
  activeFilterText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  workoutList: {
    padding: 16,
  },
  workoutCard: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  workoutHeader: {
    marginBottom: 12,
  },
  workoutName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  workoutDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutDateText: {
    color: '#888',
    marginLeft: 4,
    fontSize: 14,
  },
  workoutDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    paddingTop: 12,
    marginBottom: 12,
  },
  workoutDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutDetailText: {
    marginLeft: 4,
    fontSize: 14,
  },
  workoutTimeInfo: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    paddingTop: 12,
  },
  workoutTimeText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyStateText: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 16,
  },
});