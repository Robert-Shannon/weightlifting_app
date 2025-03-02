import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function WorkoutHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <IconSymbol name="arrow.left" size={24} color={useThemeColor({}, 'text')} />
        </TouchableOpacity>
        <ThemedText type="title">Workout Details</ThemedText>
      </ThemedView>

      <ThemedView style={styles.content}>
        <ThemedText>Viewing workout with ID: {id}</ThemedText>
        <ThemedText style={styles.placeholder}>Detailed workout view to be implemented</ThemedText>
      </ThemedView>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholder: {
    marginTop: 12,
    opacity: 0.7,
  },
});