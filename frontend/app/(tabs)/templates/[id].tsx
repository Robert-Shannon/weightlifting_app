import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Template, templateService } from '@/services/template.service';

export default function TemplatesScreen() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const colorScheme = useColorScheme() ?? 'light';

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const data = await templateService.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      Alert.alert('Error', 'Failed to load workout templates');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleCreateTemplate = () => {
    router.push('/templates/create');
  };

  const handleDeleteTemplate = async (id: string, name: string) => {
    Alert.alert(
      'Delete Template',
      `Are you sure you want to delete "${name}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await templateService.deleteTemplate(id);
              // Remove template from state
              setTemplates(templates.filter(t => t.id !== id));
            } catch (error) {
              console.error('Failed to delete template:', error);
              Alert.alert('Error', 'Failed to delete template');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Template }) => (
    <TouchableOpacity
      style={styles.templateCard}
      onPress={() => router.push(`/templates/${item.id}`)}>
      <ThemedView style={styles.templateContent}>
        <ThemedText style={styles.templateName}>{item.name}</ThemedText>
        <ThemedText style={styles.templateDescription} numberOfLines={2}>
          {item.description || 'No description'}
        </ThemedText>
        <ThemedView style={styles.templateFooter}>
          <ThemedView style={styles.exerciseCount}>
            <IconSymbol name="list.bullet" size={16} color={Colors[colorScheme].text} />
            <ThemedText style={styles.exerciseCountText}>
              {item.exercise_count || 0} exercises
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>
      
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteTemplate(item.id, item.name)}>
        <IconSymbol name="trash" size={20} color="#FF3B30" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Workout Templates</ThemedText>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateTemplate}>
          <IconSymbol name="plus.circle.fill" size={24} color={Colors[colorScheme].tint} />
        </TouchableOpacity>
      </ThemedView>

      {isLoading ? (
        <ActivityIndicator size="large" color={Colors[colorScheme].tint} style={styles.loader} />
      ) : templates.length > 0 ? (
        <FlatList
          data={templates}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <ThemedView style={styles.emptyState}>
          <ThemedText style={styles.emptyStateText}>
            No workout templates yet
          </ThemedText>
          <TouchableOpacity
            style={styles.createTemplateButton}
            onPress={handleCreateTemplate}>
            <ThemedText style={styles.createTemplateButtonText}>
              Create Your First Template
            </ThemedText>
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  createButton: {
    padding: 8,
  },
  listContent: {
    paddingBottom: 20,
  },
  templateCard: {
    flexDirection: 'row',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  templateContent: {
    flex: 1,
  },
  templateName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  templateDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 12,
  },
  templateFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  exerciseCountText: {
    fontSize: 12,
    marginLeft: 4,
  },
  deleteButton: {
    padding: 8,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 16,
    textAlign: 'center',
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
});