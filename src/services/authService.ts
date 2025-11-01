// Authentication Service
import { AUTH_API } from '../config/api';
// import { parseJWT, isTokenValid, parseRole } from '../utils/jwtUtils';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  confirmPassword: string;
  email: string;
  contactNumber: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// Updated to match actual backend response format
export interface AuthResponse {
  statusCode: number;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    expiresAtUtc: string;
  };
}

// User info extracted from JWT token
export interface UserInfo {
  id: string;
  username: string;
  role: 'customer' | 'staff' | 'admin' | null;
  email?: string;
  contactNumber?: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

class AuthService {
  private baseURL = AUTH_API;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    // Load tokens from localStorage on initialization
    this.loadTokensFromStorage();
  }

  // Load tokens from localStorage
  private loadTokensFromStorage(): void {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('accessToken');
      this.refreshToken = localStorage.getItem('refreshToken');
    }
  }

  // Save tokens to localStorage
  private saveTokensToStorage(accessToken: string, refreshToken: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    }
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  // Clear tokens from localStorage
  private clearTokensFromStorage(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
    this.accessToken = null;
    this.refreshToken = null;
  }

  // Get authorization header
  private getAuthHeader(): Record<string, string> {
    return this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {};
  }

  // Extract user info from JWT token
  private extractUserInfoFromToken(token: string): UserInfo | null {
    try {
      // Decode JWT token
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = parts[1];
      const padded = payload.padEnd(
        payload.length + (4 - (payload.length % 4)) % 4,
        '='
      );
      const decoded = atob(padded);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const jwtPayload: any = JSON.parse(decoded);

      // Extract role from JWT claim
      const roleFromClaim = jwtPayload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      const roleValue = roleFromClaim || jwtPayload.role;
      const role = this.parseRole(roleValue);

      return {
        id: jwtPayload.sub || jwtPayload.unique_name || '',
        username: jwtPayload.unique_name || '',
        role,
      };
    } catch (error) {
      console.error('Error extracting user info from token:', error);
      return null;
    }
  }

  // Parse and validate role
  private parseRole(roleString: string | null | undefined): 'customer' | 'staff' | 'admin' | null {
    if (!roleString) return null;

    const lowerRole = roleString.toLowerCase().trim();

    if (lowerRole === 'customer') return 'customer';
    if (lowerRole === 'staff') return 'staff';
    if (lowerRole === 'admin') return 'admin';

    console.warn(`Unknown role: ${roleString}`);
    return null;
  }

  // Handle API errors
  private async handleApiError(response: Response): Promise<ApiError> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let errorData: any;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: 'An unexpected error occurred' };
    }

    return {
      message: errorData.message || errorData.title || 'An error occurred',
      statusCode: response.status,
      errors: errorData.errors
    };
  }

  // Make authenticated request with automatic token refresh
  private async makeAuthenticatedRequest<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeader(),
      ...options.headers,
    };

    let response = await fetch(url, {
      ...options,
      headers,
    });

    // If token expired, try to refresh
    if (response.status === 401 && this.refreshToken) {
      try {
        await this.refreshAccessToken();
        // Retry the original request with new token
        response = await fetch(url, {
          ...options,
          headers: {
            ...headers,
            ...this.getAuthHeader(),
          },
        });
      } catch (refreshError) {
        // Refresh failed, redirect to login
        this.logout();
        throw new Error('Session expired. Please login again.');
      }
    }

    if (!response.ok) {
      throw await this.handleApiError(response);
    }

    return response.json();
  }

  // Login
  async login(credentials: LoginRequest): Promise<UserInfo> {
    try {
      const response = await fetch(`${this.baseURL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw await this.handleApiError(response);
      }

      const data: AuthResponse = await response.json();
      
      // Extract tokens from response
      const { accessToken, refreshToken } = data.data;
      this.saveTokensToStorage(accessToken, refreshToken);
      
      // Extract user info from JWT token
      const userInfo = this.extractUserInfoFromToken(accessToken);
      if (userInfo) {
        this.saveCurrentUser(userInfo);
      }
      
      return userInfo || { id: '', username: '', role: null };
    } catch (error) {
      if (error instanceof Error) {
        // Better error message for network issues
        if (error.message.includes('Failed to fetch')) {
          throw new Error('Unable to reach the server. Please check your connection and ensure the backend server is running at https://localhost:7250');
        }
        throw error;
      }
      throw new Error('Login failed. Please try again.');
    }
  }

  // Register
  async register(userData: RegisterRequest): Promise<UserInfo> {
    try {
      const response = await fetch(`${this.baseURL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw await this.handleApiError(response);
      }

      const data: AuthResponse = await response.json();
      
      // Extract tokens from response
      const { accessToken, refreshToken } = data.data;
      this.saveTokensToStorage(accessToken, refreshToken);
      
      // Extract user info from JWT token
      const userInfo = this.extractUserInfoFromToken(accessToken);
      if (userInfo) {
        this.saveCurrentUser(userInfo);
      }
      
      return userInfo || { id: '', username: '', role: null };
    } catch (error) {
      if (error instanceof Error) {
        // Better error message for network issues
        if (error.message.includes('Failed to fetch')) {
          throw new Error('Unable to reach the server. Please check your connection and ensure the backend server is running at https://localhost:7250');
        }
        throw error;
      }
      throw new Error('Registration failed. Please try again.');
    }
  }

  // Refresh access token
  async refreshAccessToken(): Promise<UserInfo> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${this.baseURL}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!response.ok) {
        throw await this.handleApiError(response);
      }

      const data: AuthResponse = await response.json();
      const { accessToken, refreshToken } = data.data;
      this.saveTokensToStorage(accessToken, refreshToken);
      
      // Extract user info from new token
      const userInfo = this.extractUserInfoFromToken(accessToken);
      return userInfo || { id: '', username: '', role: null };
    } catch (error) {
      this.clearTokensFromStorage();
      throw error;
    }
  }

  // Logout
  logout(): void {
    this.clearTokensFromStorage();
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  // Get current access token
  getAccessToken(): string | null {
    return this.accessToken;
  }

  // Get current refresh token
  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  // Get current user info (if stored)
  getCurrentUser(): UserInfo | null {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('currentUser');
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  }

  // Save current user info
  saveCurrentUser(user: UserInfo): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
  }

  // Clear current user info
  clearCurrentUser(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentUser');
    }
  }

  // Get current user role
  getCurrentUserRole(): 'customer' | 'staff' | 'admin' | null {
    const user = this.getCurrentUser();
    return user?.role || null;
  }

  // Check if user has specific role
  hasRole(role: 'customer' | 'staff' | 'admin'): boolean {
    return this.getCurrentUserRole() === role;
  }

  // Check if user is admin
  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  // Check if user is staff
  isStaff(): boolean {
    return this.hasRole('staff');
  }

  // Check if user is customer
  isCustomer(): boolean {
    return this.hasRole('customer');
  }
}

// Create singleton instance
export const authService = new AuthService();
export default authService;
