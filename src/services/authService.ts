import apiClient from './apiClient';
import { User } from '../types';

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

class AuthService {
  async login(email: string, password: string): Promise<User> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', {
        email,
        password,
      });

      const { user, token, refreshToken } = response.data;
      
      // Store tokens in localStorage
      localStorage.setItem('authToken', token);
      localStorage.setItem('refreshToken', refreshToken);
      
      return user;
    } catch (error) {
      throw new Error('Invalid email or password');
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const token = localStorage.getItem('authToken');
    if (!token) {
      return null;
    }

    try {
      const response = await apiClient.get<User>('/auth/me');
      return response.data;
    } catch (error) {
      // Token might be expired, clear it
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      return null;
    }
  }

  async refreshToken(): Promise<string | null> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      return null;
    }

    try {
      const response = await apiClient.post<{ token: string }>('/auth/refresh', {
        refreshToken,
      });

      const { token } = response.data;
      localStorage.setItem('authToken', token);
      return token;
    } catch (error) {
      // Refresh failed, clear tokens
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  }
}

export const authService = new AuthService();