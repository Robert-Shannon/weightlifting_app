import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  SafeAreaView,
  View,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TemplateCreateData, templateService } from '@/services/template.service';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function CreateTemplateScreen() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';

  const textColor = colorScheme === 'dark' ? '#fff' : '#000';
  const backgroundColor = colorScheme === 'dark' ? '#121212' : '#f8f8f8';
  const cardColor = colorScheme === 'dark' ? '#1e1e1e' : '#fff';
  const inputBgColor = colorScheme === 'dark' ? '#333' : '#f5f5f5';
  const inputColor = colorScheme === 'dark' ? '#fff' : '#000';
  const placeholderColor = colorScheme === 'dark' ? '#aaa' : '#777';
  
  const handleCreate = async () => {
    // Validate form
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a template name');
      return;
    }
    
    const templateData: TemplateCreateData = {
      name: name.trim(),
      description: description.trim(),
    };
    
    try {
      setIsSubmitting(true);
      console.log('Creating template:', templateData);
      
      const createdTemplate = await templateService.createTemplate(templateData);
      console.log('Template created:', createdTemplate);
      
      Alert.alert(
        'Success',
        'Template created successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to the template detail screen
              router.replace(`/templates/${createdTemplate.id}`);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Failed to create template:', error);
      Alert.alert(
        'Error',
        'Failed to create template. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={textColor} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: textColor }]}>Create Template</Text>
          </View>
          
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: textColor }]}>Template Name *</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: inputBgColor, color: inputColor }
                ]}
                placeholder="Enter template name"
                placeholderTextColor={placeholderColor}
                value={name}
                onChangeText={setName}
                maxLength={50}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: textColor }]}>Description (Optional)</Text>
              <TextInput
                style={[
                  styles.textArea,
                  { backgroundColor: inputBgColor, color: inputColor }
                ]}
                placeholder="Describe your workout template"
                placeholderTextColor={placeholderColor}
                value={description}
                onChangeText={setDescription}
                multiline
                textAlignVertical="top"
                maxLength={200}
              />
            </View>
            
            <View style={styles.instructionsContainer}>
              <Ionicons name="information-circle-outline" size={20} color="#2f95dc" />
              <Text style={styles.instructionsText}>
                After creating the template, you'll be able to add exercises and organize them.
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={[
              styles.createButton,
              isSubmitting && styles.disabledButton
            ]}
            onPress={handleCreate}
            disabled={isSubmitting}>
            <Text style={styles.createButtonText}>
              {isSubmitting ? 'Creating...' : 'Create Template'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    paddingTop: 50, // Adjust based on your status bar
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  formContainer: {
    flex: 1,
    marginBottom: 24,
  },
  inputGroup: {
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(47, 149, 220, 0.1)',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  instructionsText: {
    flex: 1,
    marginLeft: 12,
    color: '#2f95dc',
    fontSize: 14,
    lineHeight: 20,
  },
  createButton: {
    backgroundColor: '#2f95dc',
    height: 56,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
  },
  disabledButton: {
    opacity: 0.7,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});