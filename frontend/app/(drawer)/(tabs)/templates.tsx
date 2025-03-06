import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  View,
  Text,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { HeaderWithProfile } from '@/components/HeaderWithProfile';
import { Template, templateService } from '@/services/template.service';
import { useAuth } from '@/context/AuthContext';

export default function TemplatesScreen() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  
  const colorScheme = useColorScheme();
  const textColor = colorScheme === 'dark' ? '#fff' : '#000';
  const backgroundColor = colorScheme === 'dark' ? '#121212' : '#f8f8f8';
  const cardColor = colorScheme === 'dark' ? '#1e1e1e' : '#fff';
  
  // State for tab selection
  const [activeTab, setActiveTab] = useState<'my-templates' | 'sample-templates'>('my-templates');

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Fetching templates...');
      const data = await templateService.getTemplates();
      console.log('Templates fetched:', data);
      setTemplates(data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      setError('Failed to load workout templates. Please try again.');
      // Clear templates on error
      setTemplates([]);
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

  const handleUseTemplate = (id: string) => {
    if (activeTab === 'sample-templates') {
      // For sample templates, ask if they want to save or use directly
      Alert.alert(
        "Use Template",
        "Would you like to save this template to your collection or start a workout with it?",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Save to My Templates",
            onPress: () => {
              // Handle copying sample template to user templates
              Alert.alert("Feature coming soon");
            }
          },
          {
            text: "Start Workout",
            onPress: () => {
              router.push(`/workout/start-template?id=${id}`);
            }
          }
        ]
      );
    } else {
      // For user's own templates, open the template details
      router.push(`/templates/${id}`);
    }
  };

  // Sample templates data - in a real app, this would come from the API
  const sampleTemplates = [
    { id: 's1', name: '5x5 Strength', description: 'Classic strength building program', exercise_count: 5 },
    { id: 's2', name: 'PPL Routine', description: 'Push Pull Legs split for hypertrophy', exercise_count: 18 },
    { id: 's3', name: 'HIIT Circuit', description: 'High intensity interval training', exercise_count: 8 },
  ];

  // Choose which templates to display based on active tab
  const displayTemplates = activeTab === 'my-templates' ? templates : sampleTemplates;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <HeaderWithProfile title="Templates" />

      <View style={styles.tabContainer}>
        <View style={[styles.tabBar, { backgroundColor: 'rgba(0, 0, 0, 0.05)' }]}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'my-templates' && [styles.activeTab, { backgroundColor: '#2f95dc' }]
            ]}
            onPress={() => setActiveTab('my-templates')}>
            <Text
              style={[
                styles.tabText,
                { color: textColor },
                activeTab === 'my-templates' && styles.activeTabText
              ]}>
              My Templates
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'sample-templates' && [styles.activeTab, { backgroundColor: '#2f95dc' }]
            ]}
            onPress={() => setActiveTab('sample-templates')}>
            <Text
              style={[
                styles.tabText,
                { color: textColor },
                activeTab === 'sample-templates' && styles.activeTabText
              ]}>
              Sample Templates
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.contentContainer}>
        {activeTab === 'my-templates' && (
          <View style={styles.createButtonContainer}>
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateTemplate}>
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.createButtonText}>Create Template</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {isLoading ? (
          <ActivityIndicator size="large" color="#2f95dc" style={styles.loader} />
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchTemplates}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : displayTemplates.length > 0 ? (
          <FlatList
            data={displayTemplates}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={[styles.templateCard, { backgroundColor: cardColor }]}>
                <TouchableOpacity
                  style={styles.templateCardContent}
                  onPress={() => handleUseTemplate(item.id)}>
                  <Text style={[styles.templateName, { color: textColor }]}>{item.name}</Text>
                  <Text style={styles.templateDescription}>{item.description || 'No description'}</Text>
                  <View style={styles.templateMetadata}>
                    <View style={styles.exerciseCountBadge}>
                      <Ionicons name="barbell-outline" size={14} color="#2f95dc" />
                      <Text style={styles.exerciseCountText}>
                        {item.exercise_count || (item.exercises ? item.exercises.length : 0)} exercises
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
                
                <View style={styles.templateCardActions}>
                  {activeTab === 'my-templates' ? (
                    <>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => router.push(`/templates/edit/${item.id}`)}>
                        <Ionicons name="create-outline" size={20} color="#2f95dc" />
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleDeleteTemplate(item.id, item.name)}>
                        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity
                      style={styles.useTemplateButton}
                      onPress={() => handleUseTemplate(item.id)}>
                      <Text style={styles.useTemplateButtonText}>Use</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
            contentContainerStyle={styles.templatesList}
          />
        ) : (
          <View style={styles.emptyState}>
            {activeTab === 'my-templates' ? (
              <>
                <Text style={[styles.emptyStateText, { color: textColor }]}>
                  You haven't created any templates yet.
                </Text>
                <TouchableOpacity
                  style={styles.createTemplateButton}
                  onPress={handleCreateTemplate}>
                  <Text style={styles.createTemplateButtonText}>Create Your First Template</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={[styles.emptyStateText, { color: textColor }]}>
                No sample templates available at the moment.
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#2f95dc',
  },
  tabText: {
    fontWeight: '500',
  },
  activeTabText: {
    color: 'white',
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  createButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2f95dc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  templatesList: {
    paddingBottom: 16,
  },
  templateCard: {
    flexDirection: 'row',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  templateCardContent: {
    flex: 1,
    padding: 16,
  },
  templateName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  templateDescription: {
    color: '#888',
    fontSize: 14,
    marginBottom: 12,
  },
  templateMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(47, 149, 220, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  exerciseCountText: {
    fontSize: 12,
    color: '#2f95dc',
    marginLeft: 4,
  },
  templateCardActions: {
    padding: 12,
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(0, 0, 0, 0.05)',
  },
  actionButton: {
    padding: 8,
    marginVertical: 4,
  },
  useTemplateButton: {
    backgroundColor: '#2f95dc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  useTemplateButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyStateText: {
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 16,
  },
  createTemplateButton: {
    backgroundColor: '#2f95dc',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createTemplateButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loader: {
    marginTop: 60,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2f95dc',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});