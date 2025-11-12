import { API_BASE_URL } from '../config/api';

type ApiResponse<T> = {
  statusCode: number;
  message: string;
  data: T;
};

export interface FinalPriceSummary {
  orderId: string;
  finalPrice: number;
  currency: string;
}

export interface FinalizeReturnPayload {
  accountId: string;
  amount: number;
  finalPaymentMethod: 'WALLET' | 'CARD' | 'CASH' | string;
}

export interface FinalizeReturnResult {
  accountId: string;
  amountDeducted: number;
  paymentMethod: string;
  paymentStatus: string;
  completedAt: string;
  message?: string;
}

class PaymentService {
  private readonly baseURL = `${API_BASE_URL}/Payment`;

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('accessToken');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (!token) {
      throw new Error('Người dùng chưa đăng nhập hoặc phiên làm việc đã hết hạn.');
    }

    headers.Authorization = `Bearer ${token}`;

    const response = await fetch(path, {
      ...options,
      headers,
      credentials: 'include',
    });

    const bodyText = await response.text();

    if (!response.ok) {
      let message = `Yêu cầu thất bại (${response.status})`;

      if (bodyText) {
        try {
          const parsed = JSON.parse(bodyText) as Partial<ApiResponse<unknown>>;
          if (parsed.message) {
            message = parsed.message;
          }
        } catch {
          // keep default message
        }
      }

      throw new Error(message);
    }

    if (!bodyText) {
      return {} as T;
    }

    try {
      return JSON.parse(bodyText) as T;
    } catch {
      throw new Error('Dữ liệu phản hồi không đúng định dạng JSON.');
    }
  }

  async calculateFinalPrice(orderId: string): Promise<ApiResponse<FinalPriceSummary>> {
    return this.request<ApiResponse<FinalPriceSummary>>(
      `${this.baseURL}/calculate-final-price/${orderId}`,
      {
        method: 'GET',
      }
    );
  }

  async finalizeReturn(payload: FinalizeReturnPayload): Promise<ApiResponse<FinalizeReturnResult>> {
    return this.request<ApiResponse<FinalizeReturnResult>>(
      `${this.baseURL}/finalize-return`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  }
}

export const paymentService = new PaymentService();
export type { ApiResponse as PaymentApiResponse };
