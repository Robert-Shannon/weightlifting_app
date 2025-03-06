import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  View,
  Text,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { HeaderWithProfile } from '@/components/HeaderWithProfile';

export default function WorkoutScreen() {
  const colorScheme = useColorScheme();
  const textColor = colorScheme === 'dark' ? '#fff' : '#000';
  const backgroundColor = colorScheme === 'dark' ? '#121212' : '#f8f8f8';
  const cardColor = colorScheme === 'dark' ? '#1e1e1e' : '#fff';
  
  // Dummy active workout data (normally you'd have this in a context)
  const [activeWorkout, setActiveWorkout] = useState(null);

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <HeaderWithProfile title="Workout" />

      <ScrollView style={styles.scrollContainer}>
        {activeWorkout ? (
          // Active workout banner
          <TouchableOpacity
            style={styles.activeWorkoutBanner}
            onPress={() => router.push('/workout/active')}>
            <View style={styles.activeWorkoutContent}>
              <Text style={styles.activeWorkoutLabel}>ACTIVE WORKOUT</Text>
              <Text style={styles.activeWorkoutName}>{activeWorkout.name}</Text>
              <Text style={styles.activeWorkoutInfo}>
                {activeWorkout.exercises} exercises • Started 24m ago
              </Text>
            </View>
            <View style={styles.activeWorkoutAction}>
              <Text style={styles.activeWorkoutContinue}>Continue</Text>
              <Ionicons name="arrow-forward" size={16} color="white" />
            </View>
          </TouchableOpacity>
        ) : (
          // Start workout section
          <View style={styles.startWorkoutSection}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Start a Workout</Text>
            
            <TouchableOpacity
              style={[styles.startWorkoutButton, { backgroundColor: '#2f95dc' }]}
              onPress={() => router.push('/workout/start-template')}>
              <Ionicons name="document-text" size={24} color="white" />
              <Text style={styles.startWorkoutButtonText}>Start from Template</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.startWorkoutButton, { backgroundColor: '#32CD32' }]}
              onPress={() => router.push('/workout/start-empty')}>
              <Ionicons name="add-circle" size={24} color="white" />
              <Text style={styles.startWorkoutButtonText}>Quick Start Workout</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Recent templates section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Recent Templates</Text>
          
          <View style={[styles.card, { backgroundColor: cardColor }]}>
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, { color: textColor }]}>Push Workout</Text>
              <Text style={styles.cardSubtitle}>8 exercises</Text>
            </View>
            <TouchableOpacity
              style={styles.startTemplateButton}
              onPress={() => router.push('/workout/start-template?id=1')}>
              <Text style={styles.startTemplateButtonText}>Start</Text>
            </TouchableOpacity>
          </View>
          
          <View style={[styles.card, { backgroundColor: cardColor }]}>
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, { color: textColor }]}>Pull Workout</Text>
              <Text style={styles.cardSubtitle}>7 exercises</Text>
            </View>
            <TouchableOpacity
              style={styles.startTemplateButton}
              onPress={() => router.push('/workout/start-template?id=2')}>
              <Text style={styles.startTemplateButtonText}>Start</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={styles.viewAllTemplatesButton}
            onPress={() => router.push('/templates')}>
            <Text style={styles.viewAllTemplatesText}>View All Templates</Text>
          </TouchableOpacity>
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
    padding: 16,
  },
  activeWorkoutBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2f95dc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  activeWorkoutContent: {
    flex: 1,
  },
  activeWorkoutLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: 'bold',
  },
  activeWorkoutName: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
    marginBottom: 4,
  },
  activeWorkoutInfo: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  activeWorkoutAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeWorkoutContinue: {
    color: 'white',
    fontWeight: 'bold',
    marginRight: 4,
  },
  startWorkoutSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  startWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  startWorkoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  section: {
    marginBottom: 24,
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
  startTemplateButton: {
    backgroundColor: '#2f95dc',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  startTemplateButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  viewAllTemplatesButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  viewAllTemplatesText: {
    color: '#2f95dc',
    fontWeight: 'bold',
  },
});