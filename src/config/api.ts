/**
 * API Configuration for the application
 */

// API Base URLs
// Use /api proxy in development, full URL in production
const isProduction = import.meta.env.PROD;
const backendBaseURL = isProduction ? 'https://localhost:7250/api' : '/api';

export const API_BASE_URL = backendBaseURL;
export const AUTH_API = `${API_BASE_URL}/Auth`;

// API Endpoints
export const AUTH_ENDPOINTS = {
  LOGIN: `${AUTH_API}/login`,
  REGISTER: `${AUTH_API}/register`,
  REFRESH: `${AUTH_API}/refresh`,
  LOGOUT: `${AUTH_API}/logout`,
};

// Request Configuration
export const REQUEST_CONFIG = {
  method: 'POST' as const,
  headers: {
    'Content-Type': 'application/json',
  },
  // Enable credentials for CORS
  credentials: 'include' as const,
};

// Fetch Request Options for CORS
export const getCORSOptions = (method: string = 'POST'): RequestInit => ({
  method,
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.',
  CORS_ERROR: 'Lỗi CORS: Máy chủ không cho phép request từ ứng dụng này.',
  TIMEOUT: 'Yêu cầu đã hết thời gian chờ. Vui lòng thử lại.',
  INVALID_RESPONSE: 'Phản hồi từ máy chủ không hợp lệ.',
  UNAUTHORIZED: 'Tài khoản hoặc mật khẩu không chính xác.',
  FORBIDDEN: 'Bạn không có quyền thực hiện hành động này.',
  NOT_FOUND: 'Không tìm thấy tài nguyên được yêu cầu.',
  SERVER_ERROR: 'Lỗi máy chủ. Vui lòng thử lại sau.',
  REGISTRATION_FAILED: 'Đăng ký thất bại. Vui lòng kiểm tra thông tin của bạn.',
  LOGIN_FAILED: 'Đăng nhập thất bại. Vui lòng thử lại.',
};
