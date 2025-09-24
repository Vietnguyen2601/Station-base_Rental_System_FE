/**
 * Application constants and enums
 */

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
  },
  STATIONS: {
    LIST: '/stations',
    DETAILS: '/stations/:id',
    VEHICLES: '/stations/:id/vehicles',
  },
  VEHICLES: {
    LIST: '/vehicles',
    DETAILS: '/vehicles/:id',
    RENT: '/vehicles/:id/rent',
    RETURN: '/vehicles/:id/return',
  },
  RENTALS: {
    LIST: '/rentals',
    DETAILS: '/rentals/:id',
    HISTORY: '/rentals/history',
  },
} as const;

// User Roles
export enum UserRole {
  RENTER = 'renter',
  STAFF = 'staff',
  ADMIN = 'admin',
}

// Vehicle Status
export enum VehicleStatus {
  AVAILABLE = 'available',
  RENTED = 'rented',
  CHARGING = 'charging',
  MAINTENANCE = 'maintenance',
}

// Station Status
export enum StationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
}

// Rental Status
export enum RentalStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_PREFERENCES: 'userPreferences',
  SEARCH_HISTORY: 'searchHistory',
} as const;

// Application Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  RENT: '/rent',
  RETURN: '/return',
  HISTORY: '/history',
  PROFILE: '/profile',
  STATIONS: '/stations',
  VEHICLES: '/vehicles',
  SUPPORT: '/support',
  ADMIN: {
    DASHBOARD: '/admin',
    USERS: '/admin/users',
    STATIONS: '/admin/stations',
    VEHICLES: '/admin/vehicles',
    ANALYTICS: '/admin/analytics',
  },
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL_CHARS: true,
  },
  EMAIL: {
    MAX_LENGTH: 254,
  },
  PHONE: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 15,
  },
} as const;

// UI Constants
export const UI_CONSTANTS = {
  DEBOUNCE_DELAY: 300,
  ANIMATION_DURATION: 200,
  TOAST_DURATION: 5000,
  PAGINATION_SIZE: 20,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
} as const;

// Battery Level Thresholds
export const BATTERY_THRESHOLDS = {
  LOW: 20,
  MEDIUM: 50,
  HIGH: 80,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'An unexpected error occurred. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Successfully logged in!',
  LOGOUT_SUCCESS: 'Successfully logged out!',
  RENTAL_SUCCESS: 'Vehicle rented successfully!',
  RETURN_SUCCESS: 'Vehicle returned successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
} as const;