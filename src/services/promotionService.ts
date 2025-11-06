/**
 * Promotion Service
 * Handles CRUD operations for promotions
 */
import { API_BASE_URL } from '../config/api';

interface ApiResponse<T> {
  statusCode?: number;
  message: string;
  data: T;
}

export interface Promotion {
  promoCode: string;
  discountPercentage: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface CreatePromotionPayload {
  promoCode: string;
  discountPercentage: number;
  startDate: string;
  endDate: string;
}

class PromotionService {
  private readonly baseURL = `${API_BASE_URL}/Promotion`;

  private async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('accessToken');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (!token) {
      throw new Error('Người dùng chưa đăng nhập hoặc phiên làm việc đã hết hạn.');
    }

    headers.Authorization = `Bearer ${token}`;

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    const rawBody = await response.text();

    if (!response.ok) {
      let errorMessage = `Yêu cầu thất bại (${response.status})`;

      if (rawBody) {
        try {
          const parsed = JSON.parse(rawBody) as Partial<ApiResponse<unknown>>;
          if (parsed.message) {
            errorMessage = parsed.message;
          }
        } catch {
          // Ignore JSON parse errors and keep the default message
        }
      }

      throw new Error(errorMessage);
    }

    if (!rawBody) {
      return {} as T;
    }

    try {
      return JSON.parse(rawBody) as T;
    } catch {
      throw new Error('Dữ liệu phản hồi không đúng định dạng JSON.');
    }
  }

  async getPromotions(): Promise<ApiResponse<Promotion[]>> {
    return this.request<ApiResponse<Promotion[]>>(this.baseURL, {
      method: 'GET',
    });
  }

  async createPromotion(payload: CreatePromotionPayload): Promise<ApiResponse<Promotion>> {
    return this.request<ApiResponse<Promotion>>(this.baseURL, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

export const promotionService = new PromotionService();
