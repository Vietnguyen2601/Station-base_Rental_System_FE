/**
 * API Debugging utilities to help troubleshoot connection issues
 */

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  endpoint: string;
  responseTime: number;
}

/**
 * Test connection to backend API
 */
export async function testBackendConnection(
  endpoint = 'https://localhost:7250/api/Auth/register'
): Promise<ConnectionTestResult> {
  const startTime = performance.now();

  try {
    const response = await fetch(endpoint, {
      method: 'OPTIONS',
      headers: {
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type',
      },
    });

    const responseTime = performance.now() - startTime;

    if (response.ok || response.status === 204) {
      return {
        success: true,
        message: 'Backend server is reachable',
        endpoint,
        responseTime,
      };
    } else {
      return {
        success: false,
        message: `Server responded with status ${response.status}`,
        endpoint,
        responseTime,
      };
    }
  } catch (error) {
    const responseTime = performance.now() - startTime;
    const message = error instanceof Error ? error.message : 'Unknown error';

    return {
      success: false,
      message: `Failed to connect: ${message}. Make sure the backend server is running at https://localhost:7250`,
      endpoint,
      responseTime,
    };
  }
}

/**
 * Test local proxy connection
 */
export async function testProxyConnection(
  endpoint = '/api/Auth/register'
): Promise<ConnectionTestResult> {
  const startTime = performance.now();

  try {
    const response = await fetch(endpoint, {
      method: 'OPTIONS',
      headers: {
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type',
      },
    });

    const responseTime = performance.now() - startTime;

    if (response.ok || response.status === 204) {
      return {
        success: true,
        message: 'Vite proxy is working correctly',
        endpoint,
        responseTime,
      };
    } else {
      return {
        success: false,
        message: `Proxy responded with status ${response.status}`,
        endpoint,
        responseTime,
      };
    }
  } catch (error) {
    const responseTime = performance.now() - startTime;
    const message = error instanceof Error ? error.message : 'Unknown error';

    return {
      success: false,
      message: `Proxy error: ${message}`,
      endpoint,
      responseTime,
    };
  }
}

/**
 * Full diagnostic check
 */
export async function runFullDiagnostics(): Promise<void> {
  console.log('🔍 Starting API connection diagnostics...\n');

  // Test proxy
  console.log('Testing local proxy connection...');
  const proxyResult = await testProxyConnection();
  console.log(`✓ Proxy Test: ${proxyResult.message}`);
  console.log(`  Response time: ${proxyResult.responseTime.toFixed(2)}ms\n`);

  // Test backend directly
  console.log('Testing backend server connection...');
  const backendResult = await testBackendConnection();
  console.log(`✓ Backend Test: ${backendResult.message}`);
  console.log(`  Response time: ${backendResult.responseTime.toFixed(2)}ms\n`);

  // Summary
  if (proxyResult.success || backendResult.success) {
    console.log('✅ Connection is OK. You should be able to make API calls.');
  } else {
    console.log(
      '❌ Connection failed. Please check:'
    );
    console.log('   1. Backend server is running at https://localhost:7250');
    console.log('   2. CORS is properly configured on the backend');
    console.log('   3. Check the browser console for more details');
  }
}
