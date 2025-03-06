import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  View,
  Text,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Template, templateService } from '@/services/template.service';

export default function EditTemplateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const colorScheme = useColorScheme() ?? 'light';
  const textColor = colorScheme === 'dark' ? '#fff' : '#000';
  const backgroundColor = colorScheme === 'dark' ? '#121212' : '#f8f8f8';
  const cardColor = colorScheme === 'dark' ? '#1e1e1e' : '#fff';
  const inputBgColor = colorScheme === 'dark' ? '#333' : '#f5f5f5';
  const placeholderColor = colorScheme === 'dark' ? '#aaa' : '#777';
  
  useEffect(() => {
    fetchTemplate();
  }, [id]);
  
  const fetchTemplate = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      const data = await templateService.getTemplate(id);
      setTemplate(data);
      setName(data.name);
      setDescription(data.description || '');
    } catch (error) {
      console.error('Failed to fetch template:', error);
      Alert.alert('Error', 'Failed to load template details');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSave = async () => {
    if (!template) return;
    
    if (!name.trim()) {
      Alert.alert('Error', 'Template name cannot be empty');
      return;
    }
    
    try {
      setIsSaving(true);
      await templateService.updateTemplate(template.id, {
        name: name.trim(),
        description: description.trim(),
      });
      
      Alert.alert(
        'Success',
        'Template updated successfully',
        [
          {
            text: 'OK',
            onPress: () => router.replace(`/templates/${template.id}`),
          },
        ]
      );
    } catch (error) {
      console.error('Failed to update template:', error);
      Alert.alert('Error', 'Failed to update template');
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: textColor }]}>Edit Template</Text>
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
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: textColor }]}>Edit Template</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: textColor }]}>Template Name *</Text>
          <TextInput
            style={[styles.input, { color: textColor, backgroundColor: inputBgColor }]}
            value={name}
            onChangeText={setName}
            placeholder="Enter template name"
            placeholderTextColor={placeholderColor}
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: textColor }]}>Description (Optional)</Text>
          <TextInput
            style={[styles.textArea, { color: textColor, backgroundColor: inputBgColor }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your workout template"
            placeholderTextColor={placeholderColor}
            multiline
            textAlignVertical="top"
          />
        </View>
        
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle-outline" size={20} color="#2f95dc" />
          <Text style={styles.infoText}>
            To manage exercises and sets, go back to the template details screen after saving.
          </Text>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.cancelButton, { borderColor: '#2f95dc' }]}
          onPress={() => router.back()}>
          <Text style={{ color: '#2f95dc', fontWeight: 'bold' }}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.saveButton, isSaving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={isSaving}>
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  textArea: {
    height: 120,
    borderRadius: 8,
    padding: 16,
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(47, 149, 220, 0.1)',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    color: '#2f95dc',
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  cancelButton: {
    flex: 1,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  saveButton: {
    flex: 2,
    height: 50,
    backgroundColor: '#2f95dc',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
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
});