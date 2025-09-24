/**
 * Environment configuration
 * Centralizes all environment variables and provides type safety
 */

interface EnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  API_BASE_URL: string;
  APP_NAME: string;
  APP_VERSION: string;
  ENABLE_ANALYTICS: boolean;
  ENABLE_ERROR_REPORTING: boolean;
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
}

const getEnvironmentConfig = (): EnvironmentConfig => {
  return {
    NODE_ENV: (process.env.NODE_ENV as EnvironmentConfig['NODE_ENV']) || 'development',
    API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api',
    APP_NAME: process.env.REACT_APP_NAME || 'EV Rental System',
    APP_VERSION: process.env.REACT_APP_VERSION || '1.0.0',
    ENABLE_ANALYTICS: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
    ENABLE_ERROR_REPORTING: process.env.REACT_APP_ENABLE_ERROR_REPORTING === 'true',
    LOG_LEVEL: (process.env.REACT_APP_LOG_LEVEL as EnvironmentConfig['LOG_LEVEL']) || 'info',
    SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.REACT_APP_SUPABASE_ANON_KEY,
  };
};

export const env = getEnvironmentConfig();

// Validation function to ensure required environment variables are set
export const validateEnvironment = (): void => {
  const requiredVars: (keyof EnvironmentConfig)[] = [
    'API_BASE_URL',
    'APP_NAME',
  ];

  const missingVars = requiredVars.filter(
    (varName) => !env[varName]
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }
};

// Helper functions for environment checks
export const isDevelopment = (): boolean => env.NODE_ENV === 'development';
export const isProduction = (): boolean => env.NODE_ENV === 'production';
export const isTest = (): boolean => env.NODE_ENV === 'test';