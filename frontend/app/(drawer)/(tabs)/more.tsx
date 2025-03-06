import { router } from 'expo-router';
import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  View,
  Text,
  Alert,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { HeaderWithProfile } from '@/components/HeaderWithProfile';
import { useAuth } from '@/context/AuthContext';
import { Platform } from 'react-native';

export default function MoreScreen() {
  const { logout } = useAuth();
  const colorScheme = useColorScheme();
  const textColor = colorScheme === 'dark' ? '#fff' : '#000';
  const backgroundColor = colorScheme === 'dark' ? '#121212' : '#f8f8f8';
  const cardColor = colorScheme === 'dark' ? '#1e1e1e' : '#fff';
  
  const handleLogout = () => {
    if (Platform.OS === 'web') {
      // For web, use a direct confirmation instead of Alert
      if (window.confirm("Are you sure you want to log out?")) {
        logout();
      }
    } else {
      // Keep your current Alert for iOS
      Alert.alert(
        "Logout",
        "Are you sure you want to log out?",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Logout",
            style: "destructive",
            onPress: () => logout()
          }
        ]
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <HeaderWithProfile title="More" />

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Workout</Text>
          
          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: cardColor }]}
            onPress={() => router.push('/workout-history')}>
            <View style={styles.menuItemIcon}>
              <Ionicons name="time-outline" size={22} color="#2f95dc" />
            </View>
            <View style={styles.menuItemContent}>
              <Text style={[styles.menuItemTitle, { color: textColor }]}>Workout History</Text>
              <Text style={styles.menuItemDescription}>View your past workouts</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: cardColor }]}
            onPress={() => router.push('/exercises')}>
            <View style={styles.menuItemIcon}>
              <Ionicons name="barbell-outline" size={22} color="#2f95dc" />
            </View>
            <View style={styles.menuItemContent}>
              <Text style={[styles.menuItemTitle, { color: textColor }]}>Exercise Library</Text>
              <Text style={styles.menuItemDescription}>Browse all exercises</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Progress</Text>
          
          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: cardColor }]}
            onPress={() => router.push('/progress')}>
            <View style={styles.menuItemIcon}>
              <Ionicons name="stats-chart-outline" size={22} color="#2f95dc" />
            </View>
            <View style={styles.menuItemContent}>
              <Text style={[styles.menuItemTitle, { color: textColor }]}>Progress Stats</Text>
              <Text style={styles.menuItemDescription}>Track your fitness journey</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: cardColor }]}
            onPress={() => router.push('/personal-records')}>
            <View style={styles.menuItemIcon}>
              <Ionicons name="trophy-outline" size={22} color="#2f95dc" />
            </View>
            <View style={styles.menuItemContent}>
              <Text style={[styles.menuItemTitle, { color: textColor }]}>Personal Records</Text>
              <Text style={styles.menuItemDescription}>View your best performances</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Account</Text>
          
          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: cardColor }]}
            onPress={() => router.push('/settings')}>
            <View style={styles.menuItemIcon}>
              <Ionicons name="settings-outline" size={22} color="#2f95dc" />
            </View>
            <View style={styles.menuItemContent}>
              <Text style={[styles.menuItemTitle, { color: textColor }]}>Settings</Text>
              <Text style={styles.menuItemDescription}>App preferences and account settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: cardColor }]}
            onPress={() => router.push('/help')}>
            <View style={styles.menuItemIcon}>
              <Ionicons name="help-circle-outline" size={22} color="#2f95dc" />
            </View>
            <View style={styles.menuItemContent}>
              <Text style={[styles.menuItemTitle, { color: textColor }]}>Help & Support</Text>
              <Text style={styles.menuItemDescription}>FAQ and contact information</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: cardColor }]}
            onPress={() => router.push('/about')}>
            <View style={styles.menuItemIcon}>
              <Ionicons name="information-circle-outline" size={22} color="#2f95dc" />
            </View>
            <View style={styles.menuItemContent}>
              <Text style={[styles.menuItemTitle, { color: textColor }]}>About</Text>
              <Text style={styles.menuItemDescription}>App version and legal information</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  menuItemIcon: {
    width: 40,
    alignItems: 'center',
  },
  menuItemContent: {
    flex: 1,
    marginLeft: 8,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuItemDescription: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  logoutButton: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
    // Add this for better cross-platform support
    cursor: Platform.OS === 'web' ? 'pointer' : 'default',
  },
  logoutText: {
    color: '#FF3B30',
    fontWeight: 'bold',
    fontSize: 16,
  },
});