import { Link } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { register, isLoading } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      alert('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      await register({ name, email, password });
    } catch (error) {
      // Error is handled in the auth context
      console.error('Register error:', error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.logoContainer}>
          <ThemedText type="title">Create Account</ThemedText>
          <ThemedText style={styles.subtitle}>Join Lift Tracker today</ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.formContainer}>
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: colorScheme === 'dark' ? '#333' : '#f5f5f5',
                color: colorScheme === 'dark' ? '#fff' : '#000'
              }
            ]}
            placeholder="Full Name"
            placeholderTextColor={colorScheme === 'dark' ? '#aaa' : '#777'}
            value={name}
            onChangeText={setName}
          />
          
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: colorScheme === 'dark' ? '#333' : '#f5f5f5',
                color: colorScheme === 'dark' ? '#fff' : '#000'
              }
            ]}
            placeholder="Email"
            placeholderTextColor={colorScheme === 'dark' ? '#aaa' : '#777'}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: colorScheme === 'dark' ? '#333' : '#f5f5f5',
                color: colorScheme === 'dark' ? '#fff' : '#000'
              }
            ]}
            placeholder="Password"
            placeholderTextColor={colorScheme === 'dark' ? '#aaa' : '#777'}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: colorScheme === 'dark' ? '#333' : '#f5f5f5',
                color: colorScheme === 'dark' ? '#fff' : '#000'
              }
            ]}
            placeholder="Confirm Password"
            placeholderTextColor={colorScheme === 'dark' ? '#aaa' : '#777'}
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          
          <TouchableOpacity
            style={[styles.button, { opacity: isLoading ? 0.7 : 1 }]}
            onPress={handleRegister}
            disabled={isLoading}>
            <ThemedText style={styles.buttonText}>
              {isLoading ? 'Creating Account...' : 'Register'}
            </ThemedText>
          </TouchableOpacity>
          
          <ThemedView style={styles.loginContainer}>
            <ThemedText>Already have an account? </ThemedText>
            <Link href="/login" asChild>
              <TouchableOpacity>
                <ThemedText style={styles.loginText}>Login</ThemedText>
              </TouchableOpacity>
            </Link>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
  },
  formContainer: {
    width: '100%',
  },
  input: {
    width: '100%',
    height: 50,
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  button: {
    backgroundColor: Colors.light.tint,
    height: 50,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: Colors.light.tint,
    fontWeight: 'bold',
  },
});