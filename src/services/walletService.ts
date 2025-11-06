import { API_BASE_URL } from '../config/api';

interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

export interface WalletRecord {
  walletId: string;
  accountId: string;
  balance: number;
  createdAt: string;
  updatedAt: string | null;
}

class WalletService {
  private readonly baseURL = `${API_BASE_URL}/Wallet`;

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
          // keep default message
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

  private isWalletExistsError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('đã tồn tại') ||
        message.includes('already') ||
        message.includes('409')
      );
    }
    return false;
  }

  async createWallet(): Promise<ApiResponse<WalletRecord>> {
    return this.request<ApiResponse<WalletRecord>>(`${this.baseURL}/create`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async ensureWallet(): Promise<void> {
    try {
      await this.createWallet();
    } catch (error) {
      if (!this.isWalletExistsError(error)) {
        throw error;
      }
    }
  }

  async getWalletBalance(): Promise<ApiResponse<WalletRecord>> {
    return this.request<ApiResponse<WalletRecord>>(`${this.baseURL}/balance`, {
      method: 'GET',
    });
  }
}

export const walletService = new WalletService();

export default walletService;
