import { api } from './api';

export interface ExerciseProgressStats {
  max_weight: number;
  max_reps: number;
  volume_over_time: ExerciseVolumePoint[];
  personal_records: ExerciseMaxPoint[];
}

export interface ExerciseVolumePoint {
  date: string;
  volume: number;
}

export interface ExerciseMaxPoint {
  date: string;
  weight: number;
  reps: number;
}

export interface MuscleGroupStats {
  muscle_groups: MuscleGroupActivity[];
}

export interface MuscleGroupActivity {
  name: string;
  volume: number;
  sets_count: number;
  activity_level: number; // 0-100 percentage
}

export interface WorkoutOverview {
  workout_count: number;
  total_duration: number;
  total_volume: number;
  most_trained_muscle: string;
  avg_workout_duration: number;
  avg_rest_time: number;
  personal_records_count: number;
}

export interface WorkoutTrends {
  data_points: TrendPoint[];
}

export interface TrendPoint {
  date: string;
  value: number;
}

export interface PersonalRecordsResponse {
  records: PersonalRecord[];
}

export interface PersonalRecord {
  exercise_id: string;
  exercise_name: string;
  weight: number;
  reps: number;
  date: string;
}

/**
 * Progress service for fetching statistics and progress data
 */
export const progressService = {
  /**
   * Get exercise progress stats
   */
  async getExerciseStats(
    exerciseId: string,
    params?: { start_date?: string; end_date?: string }
  ): Promise<ExerciseProgressStats> {
    const queryParams = new URLSearchParams();
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    
    const queryString = queryParams.toString();
    const endpoint = queryString 
      ? `/api/v1/stats/exercise/${exerciseId}?${queryString}`
      : `/api/v1/stats/exercise/${exerciseId}`;
      
    return await api.get<ExerciseProgressStats>(endpoint);
  },

  /**
   * Get muscle group activity data for heatmap
   */
  async getMuscleGroupStats(
    params?: { start_date?: string; end_date?: string }
  ): Promise<MuscleGroupStats> {
    const queryParams = new URLSearchParams();
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    
    const queryString = queryParams.toString();
    const endpoint = queryString 
      ? `/api/v1/stats/muscle-groups?${queryString}`
      : '/api/v1/stats/muscle-groups';
      
    return await api.get<MuscleGroupStats>(endpoint);
  },

  /**
   * Get personal records
   */
  async getPersonalRecords(): Promise<PersonalRecordsResponse> {
    return await api.get<PersonalRecordsResponse>('/api/v1/stats/personal-records');
  },

  /**
   * Get workout overview stats
   */
  async getWorkoutOverview(
    params?: { start_date?: string; end_date?: string }
  ): Promise<WorkoutOverview> {
    const queryParams = new URLSearchParams();
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    
    const queryString = queryParams.toString();
    const endpoint = queryString 
      ? `/api/v1/stats/overview?${queryString}`
      : '/api/v1/stats/overview';
      
    return await api.get<WorkoutOverview>(endpoint);
  },

  /**
   * Get workout trends over time
   */
  async getWorkoutTrends(
    params: {
      start_date?: string;
      end_date?: string;
      metric: 'volume' | 'duration' | 'frequency';
    }
  ): Promise<WorkoutTrends> {
    const queryParams = new URLSearchParams();
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    if (params?.metric) queryParams.append('metric', params.metric);
    
    const endpoint = `/api/v1/stats/trends?${queryParams.toString()}`;
    return await api.get<WorkoutTrends>(endpoint);
  },
};