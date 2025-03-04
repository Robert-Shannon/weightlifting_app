import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/context/AuthContext';

export default function SettingsScreen() {
  const { logout } = useAuth();
  const colorScheme = useColorScheme();
  const textColor = colorScheme === 'dark' ? '#fff' : '#000';
  const backgroundColor = colorScheme === 'dark' ? '#121212' : '#f8f8f8';
  const cardColor = colorScheme === 'dark' ? '#1e1e1e' : '#fff';
  
  // Settings state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [restTimerSound, setRestTimerSound] = useState(true);
  const [autoStartTimer, setAutoStartTimer] = useState(false);
  const [defaultRestTime, setDefaultRestTime] = useState(90); // seconds
  const [unitsSystem, setUnitsSystem] = useState('metric'); // 'metric' or 'imperial'

  const handleLogout = () => {
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
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor }]}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>App Preferences</Text>
        
        <View style={[styles.settingItem, { backgroundColor: cardColor }]}>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: textColor }]}>Push Notifications</Text>
            <Text style={styles.settingDescription}>
              Receive reminders and updates
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={notificationsEnabled ? '#2f95dc' : '#f4f3f4'}
          />
        </View>
        
        <View style={[styles.settingItem, { backgroundColor: cardColor }]}>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: textColor }]}>Rest Timer Sound</Text>
            <Text style={styles.settingDescription}>
              Play sound when timer completes
            </Text>
          </View>
          <Switch
            value={restTimerSound}
            onValueChange={setRestTimerSound}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={restTimerSound ? '#2f95dc' : '#f4f3f4'}
          />
        </View>
        
        <View style={[styles.settingItem, { backgroundColor: cardColor }]}>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: textColor }]}>Auto-start Rest Timer</Text>
            <Text style={styles.settingDescription}>
              Start rest timer after logging a set
            </Text>
          </View>
          <Switch
            value={autoStartTimer}
            onValueChange={setAutoStartTimer}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={autoStartTimer ? '#2f95dc' : '#f4f3f4'}
          />
        </View>

        <TouchableOpacity 
          style={[styles.settingButton, { backgroundColor: cardColor }]}
          onPress={() => {
            // Show a picker or modal to select default rest time
            Alert.alert("Feature coming soon", "This feature will be available in a future update.");
          }}>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: textColor }]}>Default Rest Time</Text>
            <Text style={styles.settingDescription}>
              {defaultRestTime} seconds
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#888" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.settingButton, { backgroundColor: cardColor }]}
          onPress={() => {
            // Toggle between metric and imperial
            setUnitsSystem(unitsSystem === 'metric' ? 'imperial' : 'metric');
          }}>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: textColor }]}>Units System</Text>
            <Text style={styles.settingDescription}>
              {unitsSystem === 'metric' ? 'Metric (kg)' : 'Imperial (lb)'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#888" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Data Management</Text>
        
        <TouchableOpacity 
          style={[styles.settingButton, { backgroundColor: cardColor }]}
          onPress={() => {
            Alert.alert("Feature coming soon", "This feature will be available in a future update.");
          }}>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: textColor }]}>Export Workout Data</Text>
            <Text style={styles.settingDescription}>
              Export your workout history as CSV
            </Text>
          </View>
          <Ionicons name="download-outline" size={20} color="#2f95dc" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.settingButton, { backgroundColor: cardColor }]}
          onPress={() => {
            Alert.alert(
              "Clear Workout History",
              "Are you sure you want to clear all workout history? This action cannot be undone.",
              [
                {
                  text: "Cancel",
                  style: "cancel"
                },
                {
                  text: "Clear All",
                  style: "destructive",
                  onPress: () => {
                    // Implement clear history functionality
                    Alert.alert("History Cleared", "Your workout history has been cleared.");
                  }
                }
              ]
            );
          }}>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: textColor }]}>Clear Workout History</Text>
            <Text style={styles.settingDescription}>
              Remove all workout data (cannot be undone)
            </Text>
          </View>
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Account</Text>
        
        <TouchableOpacity 
          style={[styles.settingButton, { backgroundColor: cardColor }]}
          onPress={() => {
            Alert.alert("Feature coming soon", "This feature will be available in a future update.");
          }}>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: textColor }]}>Change Password</Text>
            <Text style={styles.settingDescription}>
              Update your account password
            </Text>
          </View>
          <Ionicons name="key-outline" size={20} color="#2f95dc" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.settingButton, { backgroundColor: cardColor }]}
          onPress={handleLogout}>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: '#FF3B30' }]}>Logout</Text>
            <Text style={styles.settingDescription}>
              Sign out of your account
            </Text>
          </View>
          <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>About</Text>
        
        <View style={[styles.settingItem, { backgroundColor: cardColor }]}>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: textColor }]}>Version</Text>
            <Text style={styles.settingDescription}>
              1.0.0
            </Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={[styles.settingButton, { backgroundColor: cardColor }]}
          onPress={() => {
            Alert.alert("Feature coming soon", "This feature will be available in a future update.");
          }}>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: textColor }]}>Privacy Policy</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#888" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.settingButton, { backgroundColor: cardColor }]}
          onPress={() => {
            Alert.alert("Feature coming soon", "This feature will be available in a future update.");
          }}>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: textColor }]}>Terms of Service</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#888" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingItem: {
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
  settingButton: {
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
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#888',
  },
});