# CORS Solution Implementation

## Problem

The frontend (http://localhost:3000) was unable to make requests to the backend (https://localhost:7250) due to CORS (Cross-Origin Resource Sharing) policy restrictions.

Error:

```
Access to fetch at 'https://localhost:7250/api/Auth/register' from origin 'http://localhost:3000'
has been blocked by CORS policy: Response to preflight request doesn't pass access control check:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Solutions Implemented

### 1. Vite Proxy Configuration (vite.config.ts)

Added a development proxy that:

- Routes `/api` requests through Vite dev server
- Proxies to `https://localhost:7250`
- Bypasses CORS by making requests server-to-server (not browser-to-server)
- `changeOrigin: true` modifies the Origin header
- `secure: false` allows self-signed certificates

```typescript
proxy: {
  '/api': {
    target: 'https://localhost:7250',
    changeOrigin: true,
    secure: false,
    rewrite: (path) => path.replace(/^\/api/, '/api'),
  },
}
```

### 2. API Configuration Update (config/api.ts)

- Uses local proxy `/api` in development
- Uses direct URL in production (when backend is properly configured with CORS)

```typescript
const isDevelopment = process.env.NODE_ENV === "development";
const backendBaseURL = isDevelopment ? "/api" : "https://localhost:7250/api";
```

### 3. Enhanced Error Handling (authService.ts)

- Better error messages when connection fails
- Provides helpful debugging information

### 4. Diagnostic Utilities (utils/apiDebug.ts)

Helper functions to test API connectivity:

- `testProxyConnection()` - Tests local proxy
- `testBackendConnection()` - Tests backend directly
- `runFullDiagnostics()` - Runs all tests

## How to Use

### In Development

The proxy is automatically used. Just ensure:

1. Vite dev server is running (`npm run dev`)
2. Backend server is running at `https://localhost:7250`

### Manual Testing (in browser console)

```javascript
import { runFullDiagnostics } from "@/utils/apiDebug";
runFullDiagnostics();
```

### Production Setup

For production, the backend MUST have CORS configured:

**Backend (C# .NET):**

```csharp
services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", builder =>
    {
        builder
            .WithOrigins("https://yourdomain.com") // Your frontend URL
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

app.UseCors("AllowFrontend");
```

## Files Modified

1. **vite.config.ts** - Added proxy configuration
2. **src/config/api.ts** - Updated API base URL logic
3. **src/services/authService.ts** - Enhanced error handling
4. **src/services/apiClient.ts** - Added credentials and fixed TypeScript errors
5. **src/components/forms/RegisterForm.tsx** - Better error messages

## Files Created

1. **src/utils/apiDebug.ts** - Diagnostic utilities
2. **CORS_SOLUTION.md** - This documentation

## Testing Steps

1. Start Vite dev server:

   ```bash
   npm run dev
   ```

2. Start backend server at `https://localhost:7250`

3. Try registering a new account

4. Check browser console for diagnostics if needed

## Troubleshooting

### Still getting CORS error?

1. Ensure backend is running: `https://localhost:7250`
2. Check if proxy is working in browser DevTools Network tab
3. Run `runFullDiagnostics()` in console
4. Check vite server console for proxy errors

### Backend connection refused?

1. Ensure backend service is started
2. Check backend is listening on port 7250
3. Verify HTTPS certificate is valid (or use `https: false` in Vite config)

### Requests timing out?

1. Check network connectivity
2. Increase proxy timeout if needed
3. Verify backend is responding to requests
