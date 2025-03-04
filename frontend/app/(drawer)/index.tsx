import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function ProfileScreen() {
  const { user, logout, updateProfile, isLoading } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  };

  const handleSaveProfile = async () => {
    // Validate inputs
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Error', 'Email cannot be empty');
      return;
    }

    if (newPassword && newPassword !== confirmNewPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (newPassword && !currentPassword) {
      Alert.alert('Error', 'Current password is required to set a new password');
      return;
    }

    // Prepare data for update
    const updateData = {
      name,
      email,
      ...(newPassword && { current_password: currentPassword, new_password: newPassword }),
    };

    try {
      await updateProfile(updateData);
      setIsEditing(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
      console.error('Profile update failed:', error);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol name="arrow.left" size={24} color={Colors[colorScheme].text} />
        </TouchableOpacity>
        <ThemedText type="title">Profile</ThemedText>
        {!isEditing && (
          <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
            <IconSymbol name="pencil" size={24} color={Colors[colorScheme].tint} />
          </TouchableOpacity>
        )}
      </ThemedView>

      <ScrollView style={styles.content}>
        {isLoading ? (
          <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
        ) : (
          <>
            <ThemedView style={styles.profileHeader}>
              <ThemedView style={styles.avatarContainer}>
                <ThemedView style={[styles.avatar, { backgroundColor: Colors[colorScheme].tint }]}>
                  <ThemedText style={styles.avatarText}>
                    {user?.name
                      .split(' ')
                      .map(part => part[0])
                      .join('')
                      .toUpperCase()
                      .substring(0, 2)}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
              
              {!isEditing ? (
                <ThemedView style={styles.userInfo}>
                  <ThemedText style={styles.userName}>{user?.name}</ThemedText>
                  <ThemedText style={styles.userEmail}>{user?.email}</ThemedText>
                </ThemedView>
              ) : (
                <ThemedView style={styles.editForm}>
                  <ThemedText style={styles.inputLabel}>Name</ThemedText>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colorScheme === 'dark' ? '#333' : '#f5f5f5',
                        color: colorScheme === 'dark' ? '#fff' : '#000',
                      },
                    ]}
                    value={name}
                    onChangeText={setName}
                  />
                  
                  <ThemedText style={styles.inputLabel}>Email</ThemedText>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colorScheme === 'dark' ? '#333' : '#f5f5f5',
                        color: colorScheme === 'dark' ? '#fff' : '#000',
                      },
                    ]}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  
                  <ThemedText style={styles.passwordSectionTitle}>Change Password (Optional)</ThemedText>
                  
                  <ThemedText style={styles.inputLabel}>Current Password</ThemedText>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colorScheme === 'dark' ? '#333' : '#f5f5f5',
                        color: colorScheme === 'dark' ? '#fff' : '#000',
                      },
                    ]}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry
                  />
                  
                  <ThemedText style={styles.inputLabel}>New Password</ThemedText>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colorScheme === 'dark' ? '#333' : '#f5f5f5',
                        color: colorScheme === 'dark' ? '#fff' : '#000',
                      },
                    ]}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                  />
                  
                  <ThemedText style={styles.inputLabel}>Confirm New Password</ThemedText>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colorScheme === 'dark' ? '#333' : '#f5f5f5',
                        color: colorScheme === 'dark' ? '#fff' : '#000',
                      },
                    ]}
                    value={confirmNewPassword}
                    onChangeText={setConfirmNewPassword}
                    secureTextEntry
                  />
                  
                  <ThemedView style={styles.buttonsContainer}>
                    <TouchableOpacity
                      style={[styles.button, styles.cancelButton]}
                      onPress={() => {
                        setIsEditing(false);
                        setName(user?.name || '');
                        setEmail(user?.email || '');
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmNewPassword('');
                      }}>
                      <ThemedText style={styles.buttonText}>Cancel</ThemedText>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.button, styles.saveButton]}
                      onPress={handleSaveProfile}>
                      <ThemedText style={styles.saveButtonText}>Save Changes</ThemedText>
                    </TouchableOpacity>
                  </ThemedView>
                </ThemedView>
              )}
            </ThemedView>

            {!isEditing && (
              <>
                <ThemedView style={styles.section}>
                  <ThemedText style={styles.sectionTitle}>Progress Stats</ThemedText>
                  <TouchableOpacity 
                    style={styles.menuItem}
                    onPress={() => router.push('/progress')}>
                    <ThemedText>View Progress</ThemedText>
                    <IconSymbol name="chevron.right" size={20} color={Colors[colorScheme].text} />
                  </TouchableOpacity>
                </ThemedView>
                
                <ThemedView style={styles.section}>
                  <ThemedText style={styles.sectionTitle}>Account</ThemedText>
                  <TouchableOpacity 
                    style={styles.menuItem}
                    onPress={handleLogout}>
                    <ThemedText style={styles.logoutText}>Log Out</ThemedText>
                    <IconSymbol name="arrow.right" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                </ThemedView>
              </>
            )}
          </>
        )}
      </ScrollView>
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
    marginBottom: 24,
  },
  backButton: {
    marginRight: 16,
  },
  editButton: {
    marginLeft: 'auto',
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    opacity: 0.7,
  },
  editForm: {
    width: '100%',
    paddingHorizontal: 16,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  passwordSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 8,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  saveButton: {
    backgroundColor: Colors.light.tint,
  },
  buttonText: {
    fontWeight: 'bold',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    marginBottom: 8,
  },
  logoutText: {
    color: '#FF3B30',
  },
});