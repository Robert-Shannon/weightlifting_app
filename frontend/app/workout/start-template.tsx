import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useWorkout } from '@/context/WorkoutContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Template, templateService } from '@/services/template.service';

export default function StartWorkoutFromTemplateScreen() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [workoutName, setWorkoutName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { startWorkout } = useWorkout();
  const colorScheme = useColorScheme() ?? 'light';

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setIsLoading(true);
        const data = await templateService.getTemplates();
        setTemplates(data);
        
        // Auto-generate a workout name based on current date
        const today = new Date();
        setWorkoutName(`Workout - ${today.toLocaleDateString()}`);
      } catch (error) {
        console.error('Failed to fetch templates:', error);
        Alert.alert('Error', 'Failed to load workout templates');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const handleSelectTemplate = (id: string) => {
    if (selectedTemplates.includes(id)) {
      setSelectedTemplates(selectedTemplates.filter((templateId) => templateId !== id));
    } else {
      setSelectedTemplates([...selectedTemplates, id]);
    }
  };

  const handleStartWorkout = async () => {
    if (selectedTemplates.length === 0) {
      Alert.alert('Select Template', 'Please select at least one template to start a workout');
      return;
    }

    try {
      await startWorkout({
        name: workoutName,
        template_ids: selectedTemplates,
      });
      // Navigation is handled in the workout context
    } catch (error) {
      console.error('Failed to start workout:', error);
      Alert.alert('Error', 'Failed to start workout. Please try again.');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <IconSymbol name="arrow.left" size={24} color={Colors[colorScheme].text} />
        </TouchableOpacity>
        <ThemedText type="title">Start from Template</ThemedText>
      </ThemedView>

      <ThemedView style={styles.nameContainer}>
        <ThemedText style={styles.label}>Workout Name</ThemedText>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colorScheme === 'dark' ? '#333' : '#f5f5f5',
              color: colorScheme === 'dark' ? '#fff' : '#000',
            },
          ]}
          value={workoutName}
          onChangeText={setWorkoutName}
          placeholder="Enter workout name"
          placeholderTextColor={colorScheme === 'dark' ? '#aaa' : '#777'}
        />
      </ThemedView>

      <ThemedView style={styles.templatesSection}>
        <ThemedText type="subtitle">Select Templates</ThemedText>
        <ThemedText style={styles.subheading}>
          Choose one or more templates to include in your workout
        </ThemedText>

        {isLoading ? (
          <ActivityIndicator size="large" color={Colors[colorScheme].tint} style={styles.loader} />
        ) : templates.length > 0 ? (
          <FlatList
            data={templates}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TemplateItem
                template={item}
                isSelected={selectedTemplates.includes(item.id)}
                onSelect={() => handleSelectTemplate(item.id)}
              />
            )}
            style={styles.templatesList}
            contentContainerStyle={styles.templatesListContent}
          />
        ) : (
          <ThemedView style={styles.emptyState}>
            <ThemedText style={styles.emptyStateText}>
              No templates available. Create templates to quickly start workouts.
            </ThemedText>
            <TouchableOpacity
              style={styles.createTemplateButton}
              onPress={() => router.push('/templates/create')}>
              <ThemedText style={styles.createTemplateButtonText}>
                Create Template
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        )}
      </ThemedView>

      <TouchableOpacity
        style={[
          styles.startButton,
          {
            opacity: selectedTemplates.length === 0 ? 0.6 : 1,
          },
        ]}
        onPress={handleStartWorkout}
        disabled={selectedTemplates.length === 0}>
        <ThemedText style={styles.startButtonText}>
          Start Workout
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

interface TemplateItemProps {
  template: Template;
  isSelected: boolean;
  onSelect: () => void;
}

function TemplateItem({ template, isSelected, onSelect }: TemplateItemProps) {
  const colorScheme = useColorScheme() ?? 'light';

  return (
    <TouchableOpacity
      style={[
        styles.templateItem,
        isSelected && {
          borderColor: Colors[colorScheme].tint,
          borderWidth: 2,
        },
      ]}
      onPress={onSelect}>
      <ThemedView style={styles.templateContent}>
        <ThemedText style={styles.templateName}>{template.name}</ThemedText>
        {template.description ? (
          <ThemedText style={styles.templateDescription} numberOfLines={1}>
            {template.description}
          </ThemedText>
        ) : null}
        <ThemedText style={styles.exerciseCount}>
          {template.exercise_count || 0} exercises
        </ThemedText>
      </ThemedView>

      <ThemedView
        style={[
          styles.checkboxContainer,
          isSelected && {
            backgroundColor: Colors[colorScheme].tint,
          },
        ]}>
        {isSelected && (
          <IconSymbol name="checkmark.circle.fill" size={20} color="white" />
        )}
      </ThemedView>
    </TouchableOpacity>
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
  nameContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  templatesSection: {
    flex: 1,
  },
  subheading: {
    marginBottom: 16,
    opacity: 0.7,
  },
  templatesList: {
    flex: 1,
  },
  templatesListContent: {
    paddingBottom: 20,
  },
  templateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  templateContent: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  templateDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  exerciseCount: {
    fontSize: 12,
    marginTop: 8,
    opacity: 0.7,
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    marginTop: 50,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 16,
  },
  createTemplateButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createTemplateButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  startButton: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  startButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});