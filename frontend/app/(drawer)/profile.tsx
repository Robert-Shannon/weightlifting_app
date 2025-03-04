import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  useColorScheme,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

import { useAuth } from '@/context/AuthContext';

export default function ProfileScreen() {
  const { user, updateProfile, logout } = useAuth();
  const colorScheme = useColorScheme();
  const textColor = colorScheme === 'dark' ? '#fff' : '#000';
  const backgroundColor = colorScheme === 'dark' ? '#121212' : '#f8f8f8';
  const cardColor = colorScheme === 'dark' ? '#1e1e1e' : '#fff';
  
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  const handleSaveProfile = async () => {
    try {
      // Simulated API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Here you would actually call your API to update the profile
      Alert.alert('Success', 'Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor }]}>
      <View style={styles.profileHeader}>
        <View style={[styles.avatarContainer, { backgroundColor: '#2f95dc' }]}>
          <Text style={styles.avatarText}>
            {user ? getInitials(user.name) : '?'}
          </Text>
        </View>
        
        {!isEditing ? (
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: textColor }]}>{user?.name}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsEditing(true)}>
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.editForm}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: textColor }]}>Name</Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: colorScheme === 'dark' ? '#333' : '#f5f5f5',
                    color: textColor
                  }
                ]}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor="#888"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: textColor }]}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: colorScheme === 'dark' ? '#333' : '#f5f5f5',
                    color: textColor
                  }
                ]}
                value={email}
                onChangeText={setEmail}
                placeholder="Your email"
                placeholderTextColor="#888"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setName(user?.name || '');
                  setEmail(user?.email || '');
                  setIsEditing(false);
                }}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSaveProfile}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <View style={styles.statsSection}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Workout Stats</Text>
        
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: cardColor }]}>
            <Text style={styles.statValue}>24</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: cardColor }]}>
            <Text style={styles.statValue}>96</Text>
            <Text style={styles.statLabel}>Hours</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: cardColor }]}>
            <Text style={styles.statValue}>142k</Text>
            <Text style={styles.statLabel}>Volume (kg)</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: cardColor }]}>
            <Text style={styles.statValue}>8</Text>
            <Text style={styles.statLabel}>Records</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  profileHeader: {
    alignItems: 'center',
    marginVertical: 24,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: '#888',
    marginBottom: 16,
  },
  editButton: {
    backgroundColor: '#2f95dc',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  editButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  editForm: {
    width: '100%',
    paddingHorizontal: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  cancelButtonText: {
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#2f95dc',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  statsSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2f95dc',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#888',
  },
});