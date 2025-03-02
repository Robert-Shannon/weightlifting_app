import { api } from './api';

export interface Exercise {
  id: string;
  name: string;
  target_muscle_group: string;
  primary_equipment: string;
  difficulty_level: string;
  [key: string]: any;
}

export interface TemplateSet {
  id?: string;
  set_number: number;
  target_reps: number;
  target_weight: number;
  is_warmup: boolean;
  target_rest_time: number;
  tempo?: string;
}

export interface TemplateExercise {
  id?: string;
  exercise_id: string;
  exercise?: Exercise;
  order: number;
  notes?: string;
  superset_group_id?: string;
  superset_order?: number;
  sets: TemplateSet[];
}

export interface Template {
  id: string;
  name: string;
  description: string;
  exercise_count?: number;
  exercises?: TemplateExercise[];
}

export interface TemplateCreateData {
  name: string;
  description: string;
}

export interface TemplateExerciseCreateData {
  exercise_id: string;
  order: number;
  notes?: string;
}

export interface TemplateExerciseUpdateData {
  order?: number;
  notes?: string;
  superset_group_id?: string;
  superset_order?: number;
}

export interface TemplateSetCreateData {
  set_number: number;
  target_reps: number;
  target_weight: number;
  is_warmup: boolean;
  target_rest_time: number;
  tempo?: string;
}

export interface SupersetCreateData {
  exercise_ids: string[];
  orders: number[];
}

/**
 * Template service for managing workout templates
 */
export const templateService = {
  /**
   * Get all templates
   */
  async getTemplates(): Promise<Template[]> {
    return await api.get<Template[]>('/api/v1/templates');
  },

  /**
   * Get a template by ID
   */
  async getTemplate(id: string): Promise<Template> {
    return await api.get<Template>(`/api/v1/templates/${id}`);
  },

  /**
   * Create a new template
   */
  async createTemplate(data: TemplateCreateData): Promise<Template> {
    return await api.post<Template>('/api/v1/templates', data);
  },

  /**
   * Update a template
   */
  async updateTemplate(id: string, data: TemplateCreateData): Promise<Template> {
    return await api.put<Template>(`/api/v1/templates/${id}`, data);
  },

  /**
   * Delete a template
   */
  async deleteTemplate(id: string): Promise<{ success: boolean }> {
    return await api.delete<{ success: boolean }>(`/api/v1/templates/${id}`);
  },

  /**
   * Add an exercise to a template
   */
  async addExercise(templateId: string, data: TemplateExerciseCreateData): Promise<any> {
    return await api.post<any>(`/api/v1/templates/${templateId}/exercises`, data);
  },

  /**
   * Update an exercise in a template
   */
  async updateExercise(
    templateId: string,
    exerciseId: string,
    data: TemplateExerciseUpdateData
  ): Promise<any> {
    return await api.put<any>(
      `/api/v1/templates/${templateId}/exercises/${exerciseId}`,
      data
    );
  },

  /**
   * Remove an exercise from a template
   */
  async removeExercise(
    templateId: string,
    exerciseId: string
  ): Promise<{ success: boolean }> {
    return await api.delete<{ success: boolean }>(
      `/api/v1/templates/${templateId}/exercises/${exerciseId}`
    );
  },

  /**
   * Add a set to an exercise in a template
   */
  async addSet(
    templateId: string,
    exerciseId: string,
    data: TemplateSetCreateData
  ): Promise<any> {
    return await api.post<any>(
      `/api/v1/templates/${templateId}/exercises/${exerciseId}/sets`,
      data
    );
  },

  /**
   * Update a set in a template exercise
   */
  async updateSet(
    templateId: string,
    exerciseId: string,
    setId: string,
    data: Partial<TemplateSetCreateData>
  ): Promise<any> {
    return await api.put<any>(
      `/api/v1/templates/${templateId}/exercises/${exerciseId}/sets/${setId}`,
      data
    );
  },

  /**
   * Remove a set from a template exercise
   */
  async removeSet(
    templateId: string,
    exerciseId: string,
    setId: string
  ): Promise<{ success: boolean }> {
    return await api.delete<{ success: boolean }>(
      `/api/v1/templates/${templateId}/exercises/${exerciseId}/sets/${setId}`
    );
  },

  /**
   * Create a superset in a template
   */
  async createSuperset(
    templateId: string,
    data: SupersetCreateData
  ): Promise<any> {
    return await api.post<any>(
      `/api/v1/templates/${templateId}/supersets`,
      data
    );
  },

  /**
   * Remove a superset from a template
   */
  async removeSuperset(
    templateId: string,
    supersetId: string
  ): Promise<{ success: boolean }> {
    return await api.delete<{ success: boolean }>(
      `/api/v1/templates/${templateId}/supersets/${supersetId}`
    );
  },
};