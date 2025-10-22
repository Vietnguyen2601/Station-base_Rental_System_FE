// Authentication Service
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

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
    contactNumber?: string;
  };
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

class AuthService {
  private baseURL = 'https://localhost:7250/api/Auth';
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

  // Handle API errors
  private async handleApiError(response: Response): Promise<ApiError> {
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
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseURL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw await this.handleApiError(response);
      }

      const data: AuthResponse = await response.json();
      this.saveTokensToStorage(data.accessToken, data.refreshToken);
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Login failed. Please try again.');
    }
  }

  // Register
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseURL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw await this.handleApiError(response);
      }

      const data: AuthResponse = await response.json();
      this.saveTokensToStorage(data.accessToken, data.refreshToken);
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Registration failed. Please try again.');
    }
  }

  // Refresh access token
  async refreshAccessToken(): Promise<AuthResponse> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${this.baseURL}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!response.ok) {
        throw await this.handleApiError(response);
      }

      const data: AuthResponse = await response.json();
      this.saveTokensToStorage(data.accessToken, data.refreshToken);
      return data;
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
  getCurrentUser(): any {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('currentUser');
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  }

  // Save current user info
  saveCurrentUser(user: any): void {
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
}

// Create singleton instance
export const authService = new AuthService();
export default authService;
