import { router, useNavigation } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { useColorScheme } from 'react-native';
import { DrawerActions } from '@react-navigation/native';

import { useAuth } from '@/context/AuthContext';

export function ProfileButton() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  
  const getInitials = (name: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handlePress = () => {
    if (navigation.dispatch) {
      // Open the drawer using the navigation dispatch
      navigation.dispatch(DrawerActions.openDrawer());
    } else {
      // If that fails for some reason, navigate to profile directly
      router.push('/profile');
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}>
      <View style={[
        styles.avatar, 
        { backgroundColor: '#2f95dc' }
      ]}>
        <Text style={styles.initials}>
          {user ? getInitials(user.name) : '?'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 4,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});