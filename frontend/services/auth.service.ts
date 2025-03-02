import { api } from './api';

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
    const response = await api.post<AuthResponse>('/api/v1/auth/register', data);
    await api.setToken(response.token);
    return response;
  },

  /**
   * Login a user
   */
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/v1/auth/login', data);
    await api.setToken(response.token);
    return response;
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
    return await api.get<User>('/api/v1/auth/me');
  },

  /**
   * Update the current user profile
   */
  async updateProfile(data: UpdateProfileData): Promise<User> {
    return await api.put<User>('/api/v1/auth/me', data);
  },

  /**
   * Check if the user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await api.getToken();
    return !!token;
  },
};