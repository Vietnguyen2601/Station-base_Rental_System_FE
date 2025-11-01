# JWT Token & Role-Based Authentication

## Overview

Hệ thống sử dụng JWT (JSON Web Token) Bearer authentication với 3 roles: **Customer**, **Staff**, **Admin**.

## Token Structure

### Backend Response Format

```json
{
  "statusCode": 200,
  "message": "Login success",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eredD/CNnUGZ2CMxper3kQ==",
    "expiresAtUtc": "2025-10-23T16:11:17Z"
  }
}
```

### JWT Token Payload (Decoded)

```json
{
  "sub": "bdb0d109-d313-47b4-90e7-05550a48720ee",
  "unique_name": "cus000",
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role": "Customer",
  "exp": 1761235877,
  "iss": "EVStationRental",
  "aud": "EVStationRental.Client"
}
```

## Authentication Flow

### 1. Login

```typescript
// User submits credentials
const userInfo = await authService.login({
  username: "cus000",
  password: "password",
});

// Returns UserInfo with role:
// {
//   id: "bdb0d109-d313-47b4-90e7-05550a48720ee",
//   username: "cus000",
//   role: "customer"
// }
```

### 2. Token Storage

- **Access Token**: Stored in localStorage as `accessToken`
- **Refresh Token**: Stored in localStorage as `refreshToken`
- **User Info**: Stored in localStorage as `currentUser`

### 3. Request Authorization

All authenticated requests include Bearer token in Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Role-Based Access Control

### Check Current User Role

```typescript
import authService from "@/services/authService";

// Get current user
const user = authService.getCurrentUser();

// Check current role
const role = authService.getCurrentUserRole();

// Check specific roles
if (authService.isAdmin()) {
  // User is admin
}

if (authService.isStaff()) {
  // User is staff
}

if (authService.isCustomer()) {
  // User is customer
}

// Generic role check
if (authService.hasRole("admin")) {
  // User is admin
}
```

### Example: Protected Component

```typescript
import authService from "@/services/authService";

const AdminPanel: React.FC = () => {
  if (!authService.isAdmin()) {
    return <div>You don't have permission to access this page</div>;
  }

  return <div>Admin Dashboard</div>;
};
```

## JWT Utilities

### Using JWT Utils

```typescript
import {
  decodeJWT,
  parseJWT,
  isTokenValid,
  isTokenExpiringSoon,
  extractUserIdFromToken,
} from "@/utils/jwtUtils";

// Decode and parse JWT
const parsed = parseJWT(token);
console.log(parsed.role); // 'customer' | 'staff' | 'admin'
console.log(parsed.isExpired); // boolean
console.log(parsed.expiresAt); // Date

// Check if token is valid
if (isTokenValid(token)) {
  // Token is valid and not expired
}

// Check if token will expire soon (within 5 minutes)
if (isTokenExpiringSoon(token)) {
  // Refresh token soon
}

// Extract user ID
const userId = extractUserIdFromToken(token);
```

## Token Refresh

### Automatic Refresh

When access token expires and a 401 response is received, the system automatically:

1. Uses refresh token to get new access token
2. Retries the original request with new token

```typescript
// This happens automatically in authService
try {
  await authService.refreshAccessToken();
} catch (error) {
  // Refresh failed - redirect to login
  authService.logout();
}
```

## Security Considerations

### ⚠️ Important: JWT Decode is NOT Verification

The `decodeJWT` function decodes tokens but does NOT verify the signature.

**For security-critical operations:**

- Always verify tokens on the backend
- Don't trust role information for authorization on client-side alone
- Always validate permissions on the server

### Best Practices

1. **Store Tokens Safely**

   - Access token: localStorage (short-lived)
   - Refresh token: localStorage or httpOnly cookie (long-lived)

2. **Send Tokens Securely**

   - Always use HTTPS in production
   - Include token in Authorization header: `Bearer <token>`

3. **Handle Token Expiration**

   - Implement automatic refresh before expiry
   - Show login screen when refresh fails

4. **Validate on Backend**
   - Never trust client-side role checks alone
   - Always verify JWT signature on backend
   - Implement rate limiting for refresh endpoint

## File Structure

- **authService.ts**: Main authentication service

  - `login(credentials)`: Login user
  - `register(userData)`: Register new user
  - `getCurrentUser()`: Get stored user info
  - `getCurrentUserRole()`: Get current role
  - `hasRole(role)`: Check specific role
  - `isAdmin()`, `isStaff()`, `isCustomer()`: Role checks
  - `logout()`: Logout and clear tokens

- **jwtUtils.ts**: JWT decoding and parsing utilities
  - `decodeJWT(token)`: Decode token (no verification)
  - `parseJWT(token)`: Parse and extract user info
  - `isTokenValid(token)`: Check if token is valid
  - `isTokenExpiringSoon(token)`: Check if token expires soon

## Example: Complete Authentication Flow

```typescript
// 1. Register
const user = await authService.register({
  username: "john",
  password: "password123",
  confirmPassword: "password123",
  email: "john@example.com",
  contactNumber: "0123456789",
});

// 2. Check if registered as customer
if (user.role === "customer") {
  console.log("Registered as customer");
}

// 3. Login
const loginUser = await authService.login({
  username: "john",
  password: "password123",
});

// 4. Access protected resource
if (authService.isAuthenticated()) {
  // Make authenticated API call
  const response = await fetch("/api/protected", {
    headers: {
      Authorization: `Bearer ${authService.getAccessToken()}`,
    },
  });
}

// 5. Check current user info
const currentUser = authService.getCurrentUser();
console.log(currentUser.role); // 'customer'

// 6. Logout
authService.logout();
```

## Backend Requirements

Backend API must:

1. Return JWT tokens in the format specified above
2. Include role in JWT claims: `http://schemas.microsoft.com/ws/2008/06/identity/claims/role`
3. Support token refresh endpoint
4. Validate JWT signatures (frontend will not)
5. Implement CORS headers for cross-origin requests

Example C# configuration:

```csharp
var tokenHandler = new JwtSecurityTokenHandler();
var key = Encoding.ASCII.GetBytes("your-secret-key");

var tokenDescriptor = new SecurityTokenDescriptor
{
    Subject = new ClaimsIdentity(new[] {
        new Claim(ClaimTypes.NameIdentifier, user.Id),
        new Claim(ClaimTypes.Name, user.Username),
        new Claim(ClaimTypes.Role, user.Role) // Role claim
    }),
    Expires = DateTime.UtcNow.AddHours(1),
    SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
};

var token = tokenHandler.CreateToken(tokenDescriptor);
return tokenHandler.WriteToken(token);
```
