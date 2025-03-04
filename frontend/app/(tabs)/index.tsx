import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
  View,
  Text,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { HeaderWithProfile } from '@/components/HeaderWithProfile';
import { useAuth } from '@/context/AuthContext';

export default function HomeScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const textColor = colorScheme === 'dark' ? '#fff' : '#000';
  const backgroundColor = colorScheme === 'dark' ? '#121212' : '#f8f8f8';
  const cardColor = colorScheme === 'dark' ? '#1e1e1e' : '#fff';
  
  // Dummy data for demonstration
  const recentWorkouts = [
    { id: '1', name: 'Morning Push Workout', date: '2023-09-15', duration: 65 },
    { id: '2', name: 'Leg Day', date: '2023-09-13', duration: 75 },
  ];
  
  const templates = [
    { id: '1', name: 'Push Workout', exercises: 8 },
    { id: '2', name: 'Pull Workout', exercises: 7 },
    { id: '3', name: 'Leg Workout', exercises: 6 },
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
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
      <HeaderWithProfile 
        title="Welcome" 
        subtitle={user?.name || 'Fitness Enthusiast'} 
      />

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Quick Start Section */}
        <View style={styles.quickStartSection}>
          <TouchableOpacity 
            style={[styles.quickStartButton, { backgroundColor: '#2f95dc' }]}
            onPress={() => router.push('/workout/start-empty')}>
            <View style={styles.quickStartContent}>
              <Text style={styles.quickStartText}>Quick Start Workout</Text>
              <Text style={styles.quickStartSubtext}>Start tracking right away</Text>
            </View>
            <Ionicons name="arrow-forward-circle" size={28} color="white" />
          </TouchableOpacity>
        </View>

        {/* Recent Workouts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Recent Workouts</Text>
            <TouchableOpacity onPress={() => router.push('/workout-history')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {recentWorkouts.map((workout) => (
            <TouchableOpacity
              key={workout.id}
              style={[styles.card, { backgroundColor: cardColor }]}
              onPress={() => router.push(`/workout/details/${workout.id}`)}>
              <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, { color: textColor }]}>{workout.name}</Text>
                <Text style={styles.cardSubtitle}>{formatDate(workout.date)}</Text>
              </View>
              
              <View style={styles.durationBadge}>
                <Ionicons name="time-outline" size={14} color={textColor} />
                <Text style={[styles.durationText, { color: textColor }]}>
                  {formatDuration(workout.duration)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Templates */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Your Templates</Text>
            <TouchableOpacity onPress={() => router.push('/templates')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {templates.map((template) => (
            <TouchableOpacity
              key={template.id}
              style={[styles.card, { backgroundColor: cardColor }]}
              onPress={() => router.push(`/templates/${template.id}`)}>
              <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, { color: textColor }]}>{template.name}</Text>
              </View>
              
              <View style={styles.exerciseCountBadge}>
                <Text style={styles.exerciseCountText}>
                  {template.exercises} exercises
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  quickStartSection: {
    marginBottom: 24,
    marginTop: 8,
  },
  quickStartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
  },
  quickStartContent: {
    flex: 1,
  },
  quickStartText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quickStartSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewAllText: {
    color: '#2f95dc',
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardSubtitle: {
    color: '#888',
    marginTop: 4,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  durationText: {
    fontSize: 12,
    marginLeft: 4,
  },
  exerciseCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(47, 149, 220, 0.1)',
  },
  exerciseCountText: {
    fontSize: 12,
    color: '#2f95dc',
  },
});