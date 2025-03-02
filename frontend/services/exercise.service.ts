import { api } from './api';

export interface Exercise {
  id: string;
  name: string;
  target_muscle_group: string;
  primary_equipment: string;
  difficulty_level: string;
  youtube_demonstration?: string;
  in_depth_youtube_explanation?: string;
  secondary_muscle?: string;
  tertiary_muscle?: string;
  primary_items_count?: number;
  secondary_equipment?: string;
  secondary_items_count?: number;
  posture?: string;
  [key: string]: any;
}

export interface ExerciseFilterParams {
  target_muscle_group?: string;
  difficulty_level?: string;
  equipment?: string;
  [key: string]: any;
}

/**
 * Exercise service for fetching exercise data
 */
export const exerciseService = {
  /**
   * Get all exercises with optional filtering
   */
  async getExercises(filters?: ExerciseFilterParams): Promise<Exercise[]> {
    let endpoint = '/api/v1/exercises';
    
    // Add query parameters if filters exist
    if (filters && Object.keys(filters).length > 0) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(filters)) {
        if (value) {
          params.append(key, value);
        }
      }
      endpoint += `?${params.toString()}`;
    }
    
    return await api.get<Exercise[]>(endpoint);
  },

  /**
   * Get a specific exercise by ID
   */
  async getExercise(id: string): Promise<Exercise> {
    return await api.get<Exercise>(`/api/v1/exercises/${id}`);
  },
};