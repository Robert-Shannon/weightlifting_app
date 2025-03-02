import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { config } from '../config';

// You may need to change this to match your API endpoint
// For iOS simulator/device, use your computer's IP address instead of localhost
// For example: const API_BASE_URL = 'http://192.168.1.100:8000';
// For Android emulator, you can use http://10.0.2.2:8000
// For web, you can use relative URLs
// Use the API base URL from config
const API_BASE_URL = config.API_BASE_URL;

// Log the API URL for debugging
console.log('API URL:', API_BASE_URL);

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

/**
 * Base API service for making authenticated requests to the backend
 */
export const api = {
  /**
   * Get the JWT token from AsyncStorage
   */
  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem('auth_token');
  },

  /**
   * Set the JWT token in AsyncStorage
   */
  async setToken(token: string): Promise<void> {
    await AsyncStorage.setItem('auth_token', token);
  },

  /**
   * Remove the JWT token from AsyncStorage
   */
  async removeToken(): Promise<void> {
    await AsyncStorage.removeItem('auth_token');
  },

  /**
   * Format validation errors from FastAPI for display
   */
  formatValidationErrors(details: any[]): string {
    if (!details || !Array.isArray(details)) {
      return 'Invalid request data';
    }
    
    return details.map(error => {
      // FastAPI validation errors have 'loc' as an array where the first item is 'body'
      // and the rest are the nested field names
      const field = error.loc.slice(1).join('.');
      return `${field}: ${error.msg}`;
    }).join('\n');
  },

  /**
   * Make a request to the API with authentication
   */
  async fetch<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getToken();
    
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const data = await response.json();

        // For validation errors (422), format the error details
        if (response.status === 422 && data.detail) {
          throw new ApiError(
            response.status,
            this.formatValidationErrors(data.detail),
            data
          );
        }

        throw new ApiError(
          response.status,
          data.error || 'An error occurred',
          data
        );
      }

      return await response.json() as T;
    } catch (error) {
      if (error instanceof ApiError) {
        // Handle authentication errors
        if (error.status === 401) {
          // Token expired or invalid
          await this.removeToken();
          // You could redirect to login here
        }
        throw error;
      }
      
      // Network or other errors
      console.error('API request failed:', error);
      throw new Error('Network request failed. Please check your connection.');
    }
  },

  /**
   * GET request
   */
  get<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.fetch<T>(endpoint, { ...options, method: 'GET' });
  },

  /**
   * POST request
   */
  post<T = any>(endpoint: string, data: any, options: RequestInit = {}): Promise<T> {
    return this.fetch<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * PUT request
   */
  put<T = any>(endpoint: string, data: any, options: RequestInit = {}): Promise<T> {
    return this.fetch<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * DELETE request
   */
  delete<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.fetch<T>(endpoint, { ...options, method: 'DELETE' });
  },
};