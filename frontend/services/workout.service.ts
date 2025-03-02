import { api } from './api';
import { Exercise } from './template.service';

export interface WorkoutSession {
  id: string;
  name: string;
  started_at: string;
  completed_at?: string;
  duration?: number;
  exercises?: WorkoutExercise[];
}

export interface WorkoutExercise {
    id: string;
    exercise_id: string;
    exercise?: Exercise; // Add the exercise relationship
    order: number;
    started_at?: string;
    completed_at?: string;
    duration?: number;
    sets?: WorkoutSet[];
  }

export interface WorkoutSet {
  id: string;
  set_number: number;
  reps_completed: number;
  weight: number;
  is_warmup: boolean;
  rpe?: number;
  notes?: string;
  started_at?: string;
  completed_at?: string;
  rest_start_time?: string;
  rest_end_time?: string;
  actual_rest_time?: number;
}

export interface WorkoutSessionCreateData {
  name: string;
  template_ids?: string[];
}

export interface WorkoutSessionUpdateData {
  name?: string;
  notes?: string;
}

export interface WorkoutExerciseCreateData {
  exercise_id: string;
  order: number;
}

export interface WorkoutSetCreateData {
  set_number: number;
  reps_completed: number;
  weight: number;
  is_warmup: boolean;
  rpe?: number;
  notes?: string;
}

export interface WorkoutSetUpdateData {
  reps_completed?: number;
  weight?: number;
  is_warmup?: boolean;
  rpe?: number;
  notes?: string;
}

/**
 * Workout service for managing workout sessions
 */
export const workoutService = {
  /**
   * Get all workout sessions with optional filtering
   */
  async getWorkoutSessions(params?: {
    start_date?: string;
    end_date?: string;
    template_id?: string;
  }): Promise<WorkoutSession[]> {
    // Build query string from params
    const queryParams = new URLSearchParams();
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    if (params?.template_id) queryParams.append('template_id', params.template_id);
    
    const queryString = queryParams.toString();
    const endpoint = queryString 
      ? `/api/v1/sessions?${queryString}`
      : '/api/v1/sessions';
      
    return await api.get<WorkoutSession[]>(endpoint);
  },

  /**
   * Get a workout session by ID
   */
  async getWorkoutSession(id: string): Promise<WorkoutSession> {
    return await api.get<WorkoutSession>(`/api/v1/sessions/${id}`);
  },

  /**
   * Start a new workout session
   */
  async startWorkout(data: WorkoutSessionCreateData): Promise<WorkoutSession> {
    return await api.post<WorkoutSession>('/api/v1/sessions', data);
  },

  /**
   * Update a workout session
   */
  async updateWorkout(id: string, data: WorkoutSessionUpdateData): Promise<WorkoutSession> {
    return await api.put<WorkoutSession>(`/api/v1/sessions/${id}`, data);
  },

  /**
   * Complete a workout session
   */
  async completeWorkout(id: string, completed_at?: string): Promise<WorkoutSession> {
    return await api.post<WorkoutSession>(`/api/v1/sessions/${id}/complete`, { completed_at });
  },

  /**
   * Add an exercise to an active workout session
   */
  async addExercise(sessionId: string, data: WorkoutExerciseCreateData): Promise<any> {
    return await api.post<any>(`/api/v1/sessions/${sessionId}/exercises`, data);
  },

  /**
   * Start an exercise in a workout session
   */
  async startExercise(sessionId: string, exerciseId: string): Promise<any> {
    return await api.post<any>(`/api/v1/sessions/${sessionId}/exercises/${exerciseId}/start`, {});
  },

  /**
   * Complete an exercise in a workout session
   */
  async completeExercise(sessionId: string, exerciseId: string): Promise<any> {
    return await api.post<any>(
      `/api/v1/sessions/${sessionId}/exercises/${exerciseId}/complete`,
      {}
    );
  },

  /**
   * Log a completed set for an exercise
   */
  async logSet(
    sessionId: string,
    exerciseId: string,
    data: WorkoutSetCreateData
  ): Promise<WorkoutSet> {
    return await api.post<WorkoutSet>(
      `/api/v1/sessions/${sessionId}/exercises/${exerciseId}/sets`,
      data
    );
  },

  /**
   * Update a logged set
   */
  async updateSet(
    sessionId: string,
    exerciseId: string,
    setId: string,
    data: WorkoutSetUpdateData
  ): Promise<WorkoutSet> {
    return await api.put<WorkoutSet>(
      `/api/v1/sessions/${sessionId}/exercises/${exerciseId}/sets/${setId}`,
      data
    );
  },

  /**
   * Start rest timer after a set
   */
  async startRestTimer(
    sessionId: string,
    exerciseId: string,
    setId: string
  ): Promise<any> {
    return await api.post<any>(
      `/api/v1/sessions/${sessionId}/exercises/${exerciseId}/sets/${setId}/rest`,
      {}
    );
  },

  /**
   * End rest timer
   */
  async endRestTimer(
    sessionId: string,
    exerciseId: string,
    setId: string
  ): Promise<any> {
    return await api.put<any>(
      `/api/v1/sessions/${sessionId}/exercises/${exerciseId}/sets/${setId}/rest`,
      {}
    );
  },

  /**
   * Create a superset in an active workout session
   */
  async createSuperset(
    sessionId: string,
    data: { exercise_ids: string[]; orders: number[] }
  ): Promise<any> {
    return await api.post<any>(`/api/v1/sessions/${sessionId}/supersets`, data);
  },
};