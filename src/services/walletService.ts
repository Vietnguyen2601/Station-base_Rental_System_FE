import axios, { AxiosError } from 'axios';
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

interface CreateVNPayUrlPayload {
  walletId: string;
  amount: number;
}

interface CreateVNPayUrlResponse {
  transactionId: string;
  amount: number;
  paymentMethod: string;
  status: string;
  paymentUrl: string;
  message: string;
}

class WalletServiceError extends Error {
  statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'WalletServiceError';
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

class WalletService {
  private readonly baseURL = `${API_BASE_URL}/Wallet`;

  private getAuthHeaders() {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      throw new Error('Người dùng chưa đăng nhập hoặc phiên làm việc đã hết hạn.');
    }

    return {
      Authorization: `Bearer ${token}`,
    } as const;
  }

  private handleAxiosError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiResponse<unknown>>;
      const status = axiosError.response?.status;
      const messageFromServer = axiosError.response?.data?.message;
      const fallback = status ? `Yêu cầu thất bại (${status})` : 'Yêu cầu thất bại';
      throw new WalletServiceError(messageFromServer ?? axiosError.message ?? fallback, status);
    }

    if (error instanceof Error) {
      throw new WalletServiceError(error.message);
    }

    throw new WalletServiceError('Đã xảy ra lỗi không xác định.');
  }

  private isWalletMissingError(error: unknown): boolean {
    if (error instanceof WalletServiceError) {
      if (error.statusCode === 404) {
        return true;
      }

      const message = error.message.toLowerCase();
      return message.includes('không tìm thấy') || message.includes('not found') || message.includes('404');
    }

    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return message.includes('không tìm thấy') || message.includes('not found') || message.includes('404');
    }

    return false;
  }

  async ensureWallet(): Promise<WalletRecord | null> {
    try {
      const response = await this.getWalletBalance();
      return response.data ?? null;
    } catch (error) {
      if (this.isWalletMissingError(error)) {
        return null;
      }

      throw error;
    }
  }

  async getWalletBalance(): Promise<ApiResponse<WalletRecord>> {
    try {
      const response = await axios.get<ApiResponse<WalletRecord>>(`${this.baseURL}/balance`, {
        headers: {
          ...this.getAuthHeaders(),
        },
        withCredentials: true,
      });

      return response.data;
    } catch (error) {
      throw this.handleAxiosError(error);
    }
  }

  async createVNPayUrl(walletId: string, amount: number): Promise<string> {
    const payload: CreateVNPayUrlPayload = {
      walletId,
      amount,
    };

    console.info('[walletService] Creating VNPay URL with payload:', payload);

    try {
      const response = await axios.post<ApiResponse<CreateVNPayUrlResponse>>(
        `${this.baseURL}/create-vnpay-url`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            ...this.getAuthHeaders(),
          },
          withCredentials: true,
        }
      );

      console.info('[walletService] VNPay URL response:', response.data);

      const paymentUrl = response.data?.data?.paymentUrl;

      console.info('[walletService] Extracted payment URL:', paymentUrl);

      if (!paymentUrl) {
        throw new Error('Không nhận được liên kết thanh toán VNPay.');
      }

      return paymentUrl;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const responseData = error.response?.data as ApiResponse<CreateVNPayUrlResponse> | undefined;

        if (responseData) {
          console.warn('[walletService] VNPay URL error response:', responseData);

          const fallbackUrl = responseData.data?.paymentUrl;
          if (fallbackUrl) {
            console.warn(
              '[walletService] Proceeding with payment URL despite error status.',
              {
                status: error.response?.status,
                message: responseData.message,
              }
            );

            return fallbackUrl;
          }
        }
      }

      throw this.handleAxiosError(error);
    }
  }

  async sendVNPayCallback(params: Record<string, string>): Promise<void> {
    try {
      await axios.post<ApiResponse<unknown>>(`${this.baseURL}/vnpay-callback`, params, {
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
        withCredentials: true,
      });
    } catch (error) {
      throw this.handleAxiosError(error);
    }
  }
}

export const walletService = new WalletService();

export default walletService;
