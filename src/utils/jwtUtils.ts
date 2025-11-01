/**
 * JWT Utilities for decoding and parsing JWT tokens
 */

export interface JWTPayload {
  sub?: string;
  unique_name?: string;
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'?: string;
  role?: string;
  exp?: number;
  iss?: string;
  aud?: string;
  [key: string]: unknown;
}

export interface DecodedToken {
  payload: JWTPayload;
  expiresAt: Date;
  isExpired: boolean;
  role: 'customer' | 'staff' | 'admin' | null;
}

/**
 * Decode JWT token (without verification - for client-side use only)
 * WARNING: This does NOT verify the signature. For security-critical operations,
 * always verify the token on the backend.
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid JWT format');
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];
    
    // Add padding if necessary
    const padded = payload.padEnd(
      payload.length + (4 - (payload.length % 4)) % 4,
      '='
    );

    // Decode base64url to base64
    const decoded = atob(padded);
    
    // Parse JSON
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

/**
 * Parse JWT and extract useful information
 */
export function parseJWT(token: string): DecodedToken | null {
  const payload = decodeJWT(token);
  
  if (!payload) {
    return null;
  }

  // Extract role from JWT
  // Backend stores it in 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
  const roleFromClaim = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
  const roleValue = roleFromClaim || payload.role;
  
  const role = parseRole(roleValue as string);
  
  // Calculate expiration date
  const expiresAt = payload.exp ? new Date(payload.exp * 1000) : new Date();
  const isExpired = new Date() > expiresAt;

  return {
    payload,
    expiresAt,
    isExpired,
    role,
  };
}

/**
 * Parse and validate role string
 */
export function parseRole(roleString: string | null | undefined): 'customer' | 'staff' | 'admin' | null {
  if (!roleString) return null;

  const lowerRole = roleString.toLowerCase().trim();
  
  if (lowerRole === 'customer') return 'customer';
  if (lowerRole === 'staff') return 'staff';
  if (lowerRole === 'admin') return 'admin';
  
  console.warn(`Unknown role: ${roleString}`);
  return null;
}

/**
 * Check if token is valid and not expired
 */
export function isTokenValid(token: string | null): boolean {
  if (!token) return false;

  try {
    const parsed = parseJWT(token);
    return parsed ? !parsed.isExpired : false;
  } catch {
    return false;
  }
}

/**
 * Extract user ID from JWT token
 */
export function extractUserIdFromToken(token: string): string | null {
  try {
    const payload = decodeJWT(token);
    return payload?.sub || null;
  } catch {
    return null;
  }
}

/**
 * Get time until token expires (in milliseconds)
 */
export function getTokenTimeToExpire(token: string): number {
  try {
    const parsed = parseJWT(token);
    if (!parsed) return 0;

    const now = new Date().getTime();
    const expiresAt = parsed.expiresAt.getTime();
    
    return Math.max(0, expiresAt - now);
  } catch {
    return 0;
  }
}

/**
 * Check if token will expire soon (within threshold in milliseconds)
 * Default: 5 minutes
 */
export function isTokenExpiringSoon(token: string, thresholdMs = 5 * 60 * 1000): boolean {
  return getTokenTimeToExpire(token) <= thresholdMs;
}
