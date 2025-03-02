import { api, ApiError } from './api';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  id: string;
  name: string;
  email: string;
  token: string;
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
  current_password?: string;
  new_password?: string;
}

/**
 * Authentication service for user management
 */
export const authService = {
  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/api/v1/users/register', data);
      await api.setToken(response.token);
      return response;
    } catch (error) {
      // If it's an API error with validation details, pass along the message
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      // Otherwise handle as a generic error
      console.error('Registration failed:', error);
      throw new Error('Registration failed. Please try again.');
    }
  },

  /**
   * Login a user
   */
  async login(data: LoginData): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/api/v1/users/login', data);
      await api.setToken(response.token);
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          throw new Error('Invalid email or password.');
        }
        throw new Error(error.message);
      }
      console.error('Login failed:', error);
      throw new Error('Login failed. Please try again.');
    }
  },

  /**
   * Logout the current user
   */
  async logout(): Promise<void> {
    await api.removeToken();
  },

  /**
   * Get the current user profile
   */
  async getCurrentUser(): Promise<User> {
    try {
      return await api.get<User>('/api/v1/users/me');
    } catch (error) {
      console.error('Failed to get user profile:', error);
      throw error;
    }
  },

  /**
   * Update the current user profile
   */
  async updateProfile(data: UpdateProfileData): Promise<User> {
    try {
      return await api.put<User>('/api/v1/users/me', data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      console.error('Profile update failed:', error);
      throw new Error('Failed to update profile. Please try again.');
    }
  },

  /**
   * Check if the user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await api.getToken();
    return !!token;
  },
};