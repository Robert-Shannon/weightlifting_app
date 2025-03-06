import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  SafeAreaView,
  View,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import {
  Template,
  TemplateExercise,
  TemplateSet,
  templateService,
  TemplateSetCreateData,
} from '@/services/template.service';
import { Exercise, exerciseService } from '@/services/exercise.service';

export default function TemplateDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  
  // Exercise selection modal state
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoadingExercises, setIsLoadingExercises] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Set form state
  const [showSetModal, setShowSetModal] = useState(false);
  const [currentExerciseId, setCurrentExerciseId] = useState<string>('');
  const [targetReps, setTargetReps] = useState('8');
  const [targetWeight, setTargetWeight] = useState('0');
  const [targetRestTime, setTargetRestTime] = useState('60');
  const [isWarmupSet, setIsWarmupSet] = useState(false);
  
  const colorScheme = useColorScheme() ?? 'light';
  const textColor = colorScheme === 'dark' ? '#fff' : '#000';
  const backgroundColor = colorScheme === 'dark' ? '#121212' : '#f8f8f8';
  const cardColor = colorScheme === 'dark' ? '#1e1e1e' : '#fff';
  const inputBgColor = colorScheme === 'dark' ? '#333' : '#f5f5f5';
  
  const fetchTemplate = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      console.log(`Fetching template: ${id}`);
      const data = await templateService.getTemplate(id);
      console.log('Template fetched:', data);
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
    
    if (!editedName.trim()) {
      Alert.alert('Error', 'Template name cannot be empty');
      return;
    }
    
    try {
      setIsLoading(true);
      await templateService.updateTemplate(template.id, {
        name: editedName.trim(),
        description: editedDescription.trim(),
      });
      
      // Update the local state
      setTemplate({
        ...template,
        name: editedName.trim(),
        description: editedDescription.trim(),
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
    setShowExerciseModal(true);
    fetchExercises();
  };

  const handleSelectExercise = (exercise: Exercise) => {
    if (!template) return;
    
    // Determine the next order number
    const nextOrder = template.exercises?.length ? 
      Math.max(...template.exercises.map(e => e.order)) + 1 : 
      1;
    
    // Add the exercise to the template
    addExerciseToTemplate(exercise.id, nextOrder);
    setShowExerciseModal(false);
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
  
  const handleShowAddSet = (exerciseId: string) => {
    setCurrentExerciseId(exerciseId);
    setTargetReps('8');
    setTargetWeight('0');
    setTargetRestTime('60');
    setIsWarmupSet(false);
    setShowSetModal(true);
  };
  
  const handleAddSet = async () => {
    if (!template || !currentExerciseId) return;
    
    try {
      const currentExercise = template.exercises?.find(e => 
        e.id === currentExerciseId || e.exercise_id === currentExerciseId
      );
      
      if (!currentExercise) {
        throw new Error('Exercise not found');
      }
      
      const reps = parseInt(targetReps);
      const weight = parseFloat(targetWeight);
      const restTime = parseInt(targetRestTime);
      
      if (isNaN(reps) || isNaN(weight) || isNaN(restTime)) {
        Alert.alert('Error', 'Please enter valid numbers for reps, weight, and rest time');
        return;
      }
      
      const setData: TemplateSetCreateData = {
        set_number: (currentExercise.sets?.length || 0) + 1,
        target_reps: reps,
        target_weight: weight,
        is_warmup: isWarmupSet,
        target_rest_time: restTime,
      };
      
      await templateService.addSet(
        template.id, 
        currentExerciseId, 
        setData
      );
      
      // Close modal and refresh template
      setShowSetModal(false);
      await fetchTemplate();
    } catch (error) {
      console.error('Failed to add set:', error);
      Alert.alert('Error', 'Failed to add set to exercise');
    }
  };
  
  const handleRemoveSet = async (exerciseId: string, setId: string) => {
    if (!template) return;
    
    try {
      await templateService.removeSet(template.id, exerciseId, setId);
      await fetchTemplate();
    } catch (error) {
      console.error('Failed to remove set:', error);
      Alert.alert('Error', 'Failed to remove set');
    }
  };
  
  const filteredExercises = searchQuery 
    ? exercises.filter(exercise => 
        exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exercise.target_muscle_group.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : exercises;
    
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: textColor }]}>Template Details</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2f95dc" />
          <Text style={{ marginTop: 16, color: textColor }}>Loading template...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!template) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: textColor }]}>Template Not Found</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={{ color: textColor }}>The template could not be found.</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.replace('/templates')}>
            <Text style={styles.buttonText}>Back to Templates</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  // Exercise card component for displaying exercises and sets
  const ExerciseCard = ({ 
    exercise, 
    index, 
    onRemove, 
    onAddSet,
    onRemoveSet
  }: { 
    exercise: TemplateExercise; 
    index: number; 
    onRemove: (id: string) => void;
    onAddSet: () => void;
    onRemoveSet: (setId: string) => void;
  }) => {
    const [expanded, setExpanded] = useState(false);
    const exerciseId = exercise.id || exercise.exercise_id;
    
    return (
      <View style={[styles.exerciseCard, { backgroundColor: cardColor }]}>
        <TouchableOpacity 
          style={styles.exerciseHeader}
          onPress={() => setExpanded(!expanded)}>
          <View style={styles.exerciseInfo}>
            <View style={styles.exerciseOrder}>
              <Text style={styles.exerciseOrderText}>{index + 1}</Text>
            </View>
            <View>
              <Text style={[styles.exerciseName, { color: textColor }]}>
                {exercise.exercise?.name || 'Exercise'}
              </Text>
              {exercise.exercise?.target_muscle_group && (
                <Text style={styles.exerciseDetail}>
                  {exercise.exercise.target_muscle_group}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.exerciseActions}>
            <TouchableOpacity onPress={() => onRemove(exerciseId)}>
              <Ionicons name="trash-outline" size={22} color="#FF3B30" />
            </TouchableOpacity>
            <Ionicons 
              name={expanded ? "chevron-up" : "chevron-down"} 
              size={22} 
              color="#888" 
              style={{ marginLeft: 16 }}
            />
          </View>
        </TouchableOpacity>
        
        {expanded && (
          <View style={styles.exerciseContent}>
            <View style={styles.setsContainer}>
              {exercise.sets && exercise.sets.length > 0 ? (
                <>
                  <View style={styles.setsHeader}>
                    <Text style={[styles.setHeaderCell, { flex: 0.5 }]}>Set</Text>
                    <Text style={styles.setHeaderCell}>Reps</Text>
                    <Text style={styles.setHeaderCell}>Weight</Text>
                    <Text style={styles.setHeaderCell}>Rest</Text>
                    <Text style={[styles.setHeaderCell, { flex: 0.5 }]}></Text>
                  </View>
                  {exercise.sets.map((set: TemplateSet) => (
                    <View key={set.id} style={styles.setRow}>
                      <Text style={[styles.setCell, { flex: 0.5 }]}>
                        {set.is_warmup ? 'W' : set.set_number}
                      </Text>
                      <Text style={styles.setCell}>{set.target_reps}</Text>
                      <Text style={styles.setCell}>{set.target_weight} kg</Text>
                      <Text style={styles.setCell}>{set.target_rest_time}s</Text>
                      <TouchableOpacity 
                        style={[styles.setCell, { flex: 0.5 }]} 
                        onPress={() => onRemoveSet(set.id as string)}>
                        <Ionicons name="close-circle" size={18} color="#FF3B30" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </>
              ) : (
                <Text style={styles.noSetsText}>No sets defined yet</Text>
              )}
            </View>
            
            <TouchableOpacity 
              style={styles.addSetButton}
              onPress={onAddSet}>
              <Ionicons name="add-circle" size={18} color="#2f95dc" />
              <Text style={styles.addSetText}>Add Set</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        
        {isEditing ? (
          <TextInput
            style={[
              styles.nameInput,
              { color: textColor, backgroundColor: inputBgColor }
            ]}
            value={editedName}
            onChangeText={setEditedName}
            placeholder="Template name"
            placeholderTextColor="#888"
          />
        ) : (
          <Text style={[styles.title, { color: textColor }]}>{template.name}</Text>
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
          <Ionicons 
            name={isEditing ? "checkmark" : "create-outline"} 
            size={24} 
            color="#2f95dc" 
          />
        </TouchableOpacity>
      </View>

      {isEditing ? (
        <TextInput
          style={[
            styles.descriptionInput,
            { color: textColor, backgroundColor: inputBgColor }
          ]}
          value={editedDescription}
          onChangeText={setEditedDescription}
          placeholder="Description (optional)"
          placeholderTextColor="#888"
          multiline
        />
      ) : template.description ? (
        <Text style={[styles.description, { color: textColor }]}>
          {template.description}
        </Text>
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Exercises</Text>
        <TouchableOpacity onPress={handleAddExercise} style={styles.addButton}>
          <Text style={styles.addButtonText}>Add Exercise</Text>
        </TouchableOpacity>
      </View>

      {template.exercises && template.exercises.length > 0 ? (
        <FlatList
          data={template.exercises.sort((a, b) => a.order - b.order)}
          keyExtractor={(item) => item.id || item.exercise_id}
          renderItem={({ item, index }) => (
            <ExerciseCard
              exercise={item}
              index={index}
              onRemove={handleRemoveExercise}
              onAddSet={() => handleShowAddSet(item.id || item.exercise_id)}
              onRemoveSet={(setId) => handleRemoveSet(item.id || item.exercise_id, setId)}
            />
          )}
          style={styles.list}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={{ color: textColor, textAlign: 'center' }}>
            No exercises added yet. Add exercises to build your template.
          </Text>
        </View>
      )}
      
      {/* Exercise Selection Modal */}
      <Modal
        visible={showExerciseModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowExerciseModal(false)}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowExerciseModal(false)}>
              <Ionicons name="close" size={24} color={textColor} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: textColor }]}>Select Exercise</Text>
          </View>
          
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: textColor, backgroundColor: inputBgColor }]}
              placeholder="Search exercises by name or muscle group"
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          {isLoadingExercises ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2f95dc" />
            </View>
          ) : (
            <FlatList
              data={filteredExercises}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.exerciseItem, { backgroundColor: cardColor }]}
                  onPress={() => handleSelectExercise(item)}>
                  <View>
                    <Text style={[styles.exerciseName, { color: textColor }]}>{item.name}</Text>
                    <Text style={styles.exerciseDetail}>
                      {item.target_muscle_group}
                      {item.primary_equipment ? ` • ${item.primary_equipment}` : ''}
                    </Text>
                  </View>
                  <Ionicons name="add-circle" size={24} color="#2f95dc" />
                </TouchableOpacity>
              )}
              ListEmptyComponent={() => (
                <View style={styles.emptyState}>
                  <Text style={{ color: textColor, textAlign: 'center' }}>
                    {searchQuery
                      ? `No exercises found matching "${searchQuery}"`
                      : 'No exercises available'}
                  </Text>
                </View>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
      
      {/* Add Set Modal */}
      <Modal
        visible={showSetModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSetModal(false)}>
        <View style={styles.centeredView}>
          <View style={[styles.modalView, { backgroundColor: cardColor }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>Add Set</Text>
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: textColor }]}>Target Reps</Text>
              <TextInput
                style={[styles.input, { color: textColor, backgroundColor: inputBgColor }]}
                value={targetReps}
                onChangeText={setTargetReps}
                keyboardType="number-pad"
                placeholder="8"
                placeholderTextColor="#888"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: textColor }]}>Target Weight (kg)</Text>
              <TextInput
                style={[styles.input, { color: textColor, backgroundColor: inputBgColor }]}
                value={targetWeight}
                onChangeText={setTargetWeight}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor="#888"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: textColor }]}>Rest Time (seconds)</Text>
              <TextInput
                style={[styles.input, { color: textColor, backgroundColor: inputBgColor }]}
                value={targetRestTime}
                onChangeText={setTargetRestTime}
                keyboardType="number-pad"
                placeholder="60"
                placeholderTextColor="#888"
              />
            </View>
            
            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => setIsWarmupSet(!isWarmupSet)}>
                <View style={[
                  styles.checkboxInner, 
                  isWarmupSet && { backgroundColor: '#2f95dc' }
                ]}>
                  {isWarmupSet && <Ionicons name="checkmark" size={16} color="white" />}
                </View>
              </TouchableOpacity>
              <Text style={[styles.checkboxLabel, { color: textColor }]}>
                This is a warm-up set
              </Text>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowSetModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.addButton]}
                onPress={handleAddSet}>
                <Text style={styles.addButtonText}>Add Set</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50, // Adjust for status bar
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
    marginLeft: 8,
  },
  editButton: {
    padding: 8,
  },
  nameInput: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginLeft: 8,
    marginRight: 8,
  },
  description: {
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  descriptionInput: {
    marginHorizontal: 16,
    marginBottom: 16,
    minHeight: 60,
    borderRadius: 8,
    padding: 12,
    textAlignVertical: 'top',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#2f95dc',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  list: {
    paddingHorizontal: 16,
  },
  exerciseCard: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  exerciseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  exerciseOrder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2f95dc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exerciseOrderText: {
    color: 'white',
    fontWeight: 'bold',
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '500',
  },
  exerciseDetail: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  exerciseActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseContent: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  setsContainer: {
    marginBottom: 16,
  },
  setsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  setHeaderCell: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  setCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
  },
  noSetsText: {
    textAlign: 'center',
    color: '#888',
    padding: 16,
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  addSetText: {
    color: '#2f95dc',
    fontWeight: '500',
    marginLeft: 8,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    backgroundColor: '#2f95dc',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    paddingTop: 50, // Adjust for status bar
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: 24,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    paddingLeft: 40,
    paddingRight: 16,
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '85%',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#2f95dc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxInner: {
    width: 20,
    height: 20,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxLabel: {
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    height: 40,
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
  addButton: {
    backgroundColor: '#2f95dc',
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});