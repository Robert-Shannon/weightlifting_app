import { router, useLocalSearchParams } from 'expo-router';
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
import { useColorScheme } from '@/hooks/useColorScheme';
import { Exercise, exerciseService } from '@/services/exercise.service';
import {
  Template,
  TemplateExercise,
  templateService,
} from '@/services/template.service';
import { workoutService } from '@/services/workout.service';

export default function TemplateDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [showExerciseList, setShowExerciseList] = useState(false);
  const [isLoadingExercises, setIsLoadingExercises] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';

  const fetchTemplate = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      const data = await templateService.getTemplate(id);
      setTemplate(data);
      setEditedName(data.name);
      setEditedDescription(data.description || '');
    } catch (error) {
      console.error('Failed to fetch template:', error);
      Alert.alert('Error', 'Failed to load workout template');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExercises = async () => {
    try {
      setIsLoadingExercises(true);
      const data = await exerciseService.getExercises();
      setExercises(data);
    } catch (error) {
      console.error('Failed to fetch exercises:', error);
      Alert.alert('Error', 'Failed to load exercises');
    } finally {
      setIsLoadingExercises(false);
    }
  };

  useEffect(() => {
    fetchTemplate();
  }, [id]);

  const handleSaveChanges = async () => {
    if (!template) return;
    
    try {
      setIsLoading(true);
      await templateService.updateTemplate(template.id, {
        name: editedName,
        description: editedDescription,
      });
      
      // Update the local state
      setTemplate({
        ...template,
        name: editedName,
        description: editedDescription,
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update template:', error);
      Alert.alert('Error', 'Failed to update template');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddExercise = () => {
    setShowExerciseList(true);
    fetchExercises();
  };

  const handleSelectExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setShowExerciseList(false);
    
    // Determine the next order number
    const nextOrder = template?.exercises?.length ? 
      Math.max(...template.exercises.map(e => e.order)) + 1 : 
      1;
    
    // Add the exercise to the template
    addExerciseToTemplate(exercise.id, nextOrder);
  };

  const addExerciseToTemplate = async (exerciseId: string, order: number) => {
    if (!template) return;
    
    try {
      setIsLoading(true);
      await templateService.addExercise(template.id, {
        exercise_id: exerciseId,
        order,
        notes: '',
      });
      
      // Refresh the template to show the new exercise
      await fetchTemplate();
    } catch (error) {
      console.error('Failed to add exercise to template:', error);
      Alert.alert('Error', 'Failed to add exercise to template');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveExercise = async (exerciseId: string) => {
    if (!template) return;
    
    Alert.alert(
      'Remove Exercise',
      'Are you sure you want to remove this exercise from the template?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await templateService.removeExercise(template.id, exerciseId);
              
              // Refresh the template
              await fetchTemplate();
            } catch (error) {
              console.error('Failed to remove exercise:', error);
              Alert.alert('Error', 'Failed to remove exercise');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleStartWorkout = async () => {
    if (!template) return;
    
    try {
      await workoutService.startWorkout({
        name: template.name,
        template_ids: [template.id],
      });
      
      router.push('/workout/active');
    } catch (error) {
      console.error('Failed to start workout:', error);
      Alert.alert('Error', 'Failed to start workout');
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
      </ThemedView>
    );
  }

  if (!template) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ThemedText>Template not found</ThemedText>
      </ThemedView>
    );
  }

  // Render the exercise list for selection
  if (showExerciseList) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setShowExerciseList(false)}>
            <IconSymbol name="arrow.left" size={24} color={Colors[colorScheme].text} />
          </TouchableOpacity>
          <ThemedText type="title">Select Exercise</ThemedText>
        </ThemedView>

        {isLoadingExercises ? (
          <ActivityIndicator size="large" color={Colors[colorScheme].tint} style={styles.loader} />
        ) : (
          <FlatList
            data={exercises}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.exerciseListItem}
                onPress={() => handleSelectExercise(item)}>
                <ThemedView>
                  <ThemedText style={styles.exerciseName}>{item.name}</ThemedText>
                  <ThemedText style={styles.exerciseDetail}>
                    {item.target_muscle_group} • {item.primary_equipment}
                  </ThemedText>
                </ThemedView>
                <IconSymbol name="plus.circle.fill" size={20} color={Colors[colorScheme].tint} />
              </TouchableOpacity>
            )}
          />
        )}
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <IconSymbol name="arrow.left" size={24} color={Colors[colorScheme].text} />
        </TouchableOpacity>
        
        {isEditing ? (
          <TextInput
            style={[
              styles.editNameInput,
              {
                color: colorScheme === 'dark' ? '#fff' : '#000',
              },
            ]}
            value={editedName}
            onChangeText={setEditedName}
          />
        ) : (
          <ThemedText type="title">{template.name}</ThemedText>
        )}
        
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => {
            if (isEditing) {
              handleSaveChanges();
            } else {
              setIsEditing(true);
            }
          }}>
          <IconSymbol
            name={isEditing ? "checkmark.circle.fill" : "pencil"}
            size={24}
            color={Colors[colorScheme].tint}
          />
        </TouchableOpacity>
      </ThemedView>

      {isEditing ? (
        <TextInput
          style={[
            styles.editDescriptionInput,
            {
              backgroundColor: colorScheme === 'dark' ? '#333' : '#f5f5f5',
              color: colorScheme === 'dark' ? '#fff' : '#000',
            },
          ]}
          value={editedDescription}
          onChangeText={setEditedDescription}
          multiline
          placeholder="Add a description..."
          placeholderTextColor={colorScheme === 'dark' ? '#aaa' : '#777'}
        />
      ) : template.description ? (
        <ThemedText style={styles.description}>{template.description}</ThemedText>
      ) : null}

      <ThemedView style={styles.exercisesHeader}>
        <ThemedText type="subtitle">Exercises</ThemedText>
        <TouchableOpacity onPress={handleAddExercise}>
          <ThemedText style={styles.addExerciseText}>Add Exercise</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {template.exercises && template.exercises.length > 0 ? (
        <FlatList
          data={template.exercises.sort((a, b) => a.order - b.order)}
          keyExtractor={(item) => item.id || item.exercise_id}
          renderItem={({ item, index }) => (
            <TemplateExerciseItem
              exercise={item}
              index={index}
              onRemove={handleRemoveExercise}
              templateId={template.id}
              onTemplateUpdated={fetchTemplate}
            />
          )}
          style={styles.exercisesList}
        />
      ) : (
        <ThemedView style={styles.emptyExercises}>
          <ThemedText style={styles.emptyExercisesText}>
            No exercises added yet. Tap "Add Exercise" to get started.
          </ThemedText>
        </ThemedView>
      )}

      <TouchableOpacity
        style={styles.startWorkoutButton}
        onPress={handleStartWorkout}
        disabled={!template.exercises || template.exercises.length === 0}>
        <ThemedText style={styles.startWorkoutButtonText}>
          Start Workout
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

// Component for template exercise item with sets
function TemplateExerciseItem({
  exercise,
  index,
  onRemove,
  templateId,
  onTemplateUpdated,
}: {
  exercise: TemplateExercise;
  index: number;
  onRemove: (exerciseId: string) => void;
  templateId: string;
  onTemplateUpdated: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [newSetReps, setNewSetReps] = useState('8');
  const [newSetWeight, setNewSetWeight] = useState('0');
  const [newSetRest, setNewSetRest] = useState('60');
  const [isAddingSet, setIsAddingSet] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';

  const handleAddSet = async () => {
    try {
      await templateService.addSet(templateId, exercise.id || exercise.exercise_id, {
        set_number: (exercise.sets?.length || 0) + 1,
        target_reps: parseInt(newSetReps),
        target_weight: parseFloat(newSetWeight),
        is_warmup: false,
        target_rest_time: parseInt(newSetRest),
      });
      
      // Reset the form
      setIsAddingSet(false);
      setNewSetReps('8');
      setNewSetWeight('0');
      setNewSetRest('60');
      
      // Refresh the template
      onTemplateUpdated();
    } catch (error) {
      console.error('Failed to add set:', error);
      Alert.alert('Error', 'Failed to add set');
    }
  };

  const handleRemoveSet = async (setId: string) => {
    try {
      await templateService.removeSet(templateId, exercise.id || exercise.exercise_id, setId);
      onTemplateUpdated();
    } catch (error) {
      console.error('Failed to remove set:', error);
      Alert.alert('Error', 'Failed to remove set');
    }
  };

  return (
    <ThemedView style={styles.exerciseItem}>
      <TouchableOpacity
        style={styles.exerciseHeader}
        onPress={() => setExpanded(!expanded)}>
        <ThemedView style={styles.exerciseInfo}>
          <ThemedText style={styles.exerciseIndex}>{index + 1}</ThemedText>
          <ThemedView>
            <ThemedText style={styles.exerciseName}>
              {exercise.exercise?.name || 'Exercise'}
            </ThemedText>
            {exercise.exercise?.target_muscle_group && (
              <ThemedText style={styles.exerciseDetail}>
                {exercise.exercise.target_muscle_group}
              </ThemedText>
            )}
          </ThemedView>
        </ThemedView>
        
        <ThemedView style={styles.exerciseActions}>
          <TouchableOpacity
            style={styles.removeExerciseButton}
            onPress={() => onRemove(exercise.id || exercise.exercise_id)}>
            <IconSymbol name="trash" size={18} color="#FF3B30" />
          </TouchableOpacity>
          <IconSymbol
            name={expanded ? "chevron.right" : "chevron.right"}
            size={18}
            color={Colors[colorScheme].text}
            style={[
              styles.expandIcon,
              expanded && styles.expandIconRotated,
            ]}
          />
        </ThemedView>
      </TouchableOpacity>

      {expanded && (
        <ThemedView style={styles.exerciseDetails}>
          {/* Sets list */}
          {exercise.sets && exercise.sets.length > 0 ? (
            <ThemedView style={styles.setsList}>
              <ThemedView style={styles.setsHeader}>
                <ThemedText style={styles.setsHeaderText}>Set</ThemedText>
                <ThemedText style={styles.setsHeaderText}>Reps</ThemedText>
                <ThemedText style={styles.setsHeaderText}>Weight</ThemedText>
                <ThemedText style={styles.setsHeaderText}>Rest</ThemedText>
                <ThemedText style={styles.setsHeaderText}></ThemedText>
              </ThemedView>
              
              {exercise.sets.map((set) => (
                <ThemedView key={set.id} style={styles.setRow}>
                  <ThemedText style={styles.setText}>{set.set_number}</ThemedText>
                  <ThemedText style={styles.setText}>{set.target_reps}</ThemedText>
                  <ThemedText style={styles.setText}>{set.target_weight}</ThemedText>
                  <ThemedText style={styles.setText}>{set.target_rest_time}s</ThemedText>
                  <TouchableOpacity onPress={() => handleRemoveSet(set.id as string)}>
                    <IconSymbol name="trash" size={16} color="#FF3B30" />
                  </TouchableOpacity>
                </ThemedView>
              ))}
            </ThemedView>
          ) : (
            <ThemedText style={styles.noSetsText}>No sets defined</ThemedText>
          )}

          {/* Add Set Form */}
          {isAddingSet ? (
            <ThemedView style={styles.addSetForm}>
              <ThemedView style={styles.setInputRow}>
                <ThemedView style={styles.setInputGroup}>
                  <ThemedText style={styles.setInputLabel}>Reps</ThemedText>
                  <TextInput
                    style={[
                      styles.setInput,
                      {
                        backgroundColor: colorScheme === 'dark' ? '#333' : '#f5f5f5',
                        color: colorScheme === 'dark' ? '#fff' : '#000',
                      },
                    ]}
                    value={newSetReps}
                    onChangeText={setNewSetReps}
                    keyboardType="number-pad"
                  />
                </ThemedView>
                
                <ThemedView style={styles.setInputGroup}>
                  <ThemedText style={styles.setInputLabel}>Weight</ThemedText>
                  <TextInput
                    style={[
                      styles.setInput,
                      {
                        backgroundColor: colorScheme === 'dark' ? '#333' : '#f5f5f5',
                        color: colorScheme === 'dark' ? '#fff' : '#000',
                      },
                    ]}
                    value={newSetWeight}
                    onChangeText={setNewSetWeight}
                    keyboardType="decimal-pad"
                  />
                </ThemedView>
                
                <ThemedView style={styles.setInputGroup}>
                  <ThemedText style={styles.setInputLabel}>Rest (s)</ThemedText>
                  <TextInput
                    style={[
                      styles.setInput,
                      {
                        backgroundColor: colorScheme === 'dark' ? '#333' : '#f5f5f5',
                        color: colorScheme === 'dark' ? '#fff' : '#000',
                      },
                    ]}
                    value={newSetRest}
                    onChangeText={setNewSetRest}
                    keyboardType="number-pad"
                  />
                </ThemedView>
              </ThemedView>
              
              <ThemedView style={styles.setFormButtons}>
                <TouchableOpacity
                  style={[styles.setFormButton, styles.cancelButton]}
                  onPress={() => setIsAddingSet(false)}>
                  <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.setFormButton, styles.addButton]}
                  onPress={handleAddSet}>
                  <ThemedText style={styles.addButtonText}>Add Set</ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>
          ) : (
            <TouchableOpacity
              style={styles.addSetButton}
              onPress={() => setIsAddingSet(true)}>
              <IconSymbol name="plus.circle.fill" size={16} color={Colors[colorScheme].tint} />
              <ThemedText style={styles.addSetButtonText}>Add Set</ThemedText>
            </TouchableOpacity>
          )}
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    marginRight: 16,
  },
  editButton: {
    marginLeft: 'auto',
    padding: 8,
  },
  editNameInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: 'bold',
    padding: 4,
  },
  editDescriptionInput: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  description: {
    marginBottom: 24,
    opacity: 0.7,
  },
  exercisesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addExerciseText: {
    color: Colors.light.tint,
    fontWeight: 'bold',
  },
  exercisesList: {
    flex: 1,
  },
  exerciseItem: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  exerciseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  exerciseIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light.tint,
    color: 'white',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
    fontWeight: 'bold',
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  exerciseDetail: {
    fontSize: 14,
    opacity: 0.7,
  },
  exerciseActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  removeExerciseButton: {
    marginRight: 16,
  },
  expandIcon: {
    transform: [{ rotate: '0deg' }],
  },
  expandIconRotated: {
    transform: [{ rotate: '90deg' }],
  },
  exerciseDetails: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  noSetsText: {
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 12,
  },
  setsList: {
    marginBottom: 16,
  },
  setsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  setsHeaderText: {
    fontWeight: 'bold',
    fontSize: 14,
    flex: 1,
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  setText: {
    flex: 1,
    textAlign: 'center',
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  addSetButtonText: {
    color: Colors.light.tint,
    marginLeft: 8,
    fontWeight: 'bold',
  },
  addSetForm: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    padding: 12,
    borderRadius: 8,
  },
  setInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  setInputGroup: {
    flex: 1,
    marginHorizontal: 4,
  },
  setInputLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  setInput: {
    height: 40,
    borderRadius: 4,
    paddingHorizontal: 8,
  },
  setFormButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  setFormButton: {
    flex: 1,
    height: 40,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  cancelButtonText: {
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: Colors.light.tint,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  exerciseListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyExercises: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyExercisesText: {
    textAlign: 'center',
    opacity: 0.7,
  },
  startWorkoutButton: {
    backgroundColor: Colors.light.tint,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  startWorkoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});