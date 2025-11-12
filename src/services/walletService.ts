import axios, { AxiosError } from 'axios';
import { API_BASE_URL } from '../config/api';
import {
  buildVNPayReturnUrl,
  PendingWalletVNPayTransaction,
  WALLET_VNPAY_PENDING_TRANSACTION_KEY,
} from '../constants/wallet';

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
  returnUrl: string;
}

interface CreateVNPayUrlResponse {
  transactionId: string;
  amount: number;
  paymentMethod: string;
  status: string;
  paymentUrl: string;
  message: string;
  returnUrl?: string;
}

interface VNPayCallbackResult {
  walletId?: string;
  transactionId?: string;
  amount?: number;
  paymentStatus?: string;
  status?: string;
  transactionStatus?: string;
  responseCode?: string;
  walletBalance?: number;
  isSuccess?: boolean;
  message?: string;
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

  private readPendingVNPayTransaction(): PendingWalletVNPayTransaction | null {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const rawValue = window.localStorage.getItem(WALLET_VNPAY_PENDING_TRANSACTION_KEY);
      if (!rawValue) {
        return null;
      }

      const parsed = JSON.parse(rawValue) as PendingWalletVNPayTransaction | null;

      if (!parsed || typeof parsed !== 'object') {
        window.localStorage.removeItem(WALLET_VNPAY_PENDING_TRANSACTION_KEY);
        return null;
      }

      if (!parsed.walletId || typeof parsed.walletId !== 'string') {
        window.localStorage.removeItem(WALLET_VNPAY_PENDING_TRANSACTION_KEY);
        return null;
      }

      return parsed;
    } catch (error) {
      console.warn('[walletService] Unable to parse VNPay pending transaction.', error);
      return null;
    }
  }

  private writePendingVNPayTransaction(transaction: PendingWalletVNPayTransaction): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(
        WALLET_VNPAY_PENDING_TRANSACTION_KEY,
        JSON.stringify(transaction)
      );
    } catch (error) {
      console.warn('[walletService] Unable to persist VNPay pending transaction.', error);
    }
  }

  private removePendingVNPayTransaction(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.removeItem(WALLET_VNPAY_PENDING_TRANSACTION_KEY);
  }

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

  async createVNPayUrl(walletId: string, amount: number): Promise<CreateVNPayUrlResponse> {
    const payload: CreateVNPayUrlPayload = {
      walletId,
      amount,
      returnUrl: buildVNPayReturnUrl(),
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

      const responsePayload = response.data?.data;

      console.info('[walletService] VNPay response payload:', responsePayload);

      if (!responsePayload?.paymentUrl) {
        throw new Error('Không nhận được liên kết thanh toán VNPay.');
      }

      this.writePendingVNPayTransaction({
        walletId,
        amount: responsePayload.amount ?? amount,
        transactionId: responsePayload.transactionId,
        createdAt: Date.now(),
      });

      return responsePayload;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const responseData = error.response?.data as ApiResponse<CreateVNPayUrlResponse> | undefined;

        if (responseData) {
          console.warn('[walletService] VNPay URL error response:', responseData);

          const fallbackPayload = responseData.data;
          if (fallbackPayload?.paymentUrl) {
            console.warn(
              '[walletService] Proceeding with payment URL despite error status.',
              {
                status: error.response?.status,
                message: responseData.message,
              }
            );

            this.writePendingVNPayTransaction({
              walletId,
              amount: fallbackPayload.amount ?? amount,
              transactionId: fallbackPayload.transactionId,
              createdAt: Date.now(),
            });

            return fallbackPayload;
          }
        }
      }

      throw this.handleAxiosError(error);
    }
  }

  async sendVNPayCallback(params: Record<string, string>): Promise<ApiResponse<VNPayCallbackResult>> {
    try {
      const response = await axios.post<ApiResponse<VNPayCallbackResult>>(
        `${this.baseURL}/vnpay-callback`,
        params,
        {
          headers: {
            'Content-Type': 'application/json',
            ...this.getAuthHeaders(),
          },
          withCredentials: true,
        }
      );

      return response.data;
    } catch (error) {
      throw this.handleAxiosError(error);
    }
  }

  getPendingVNPayTransaction(): PendingWalletVNPayTransaction | null {
    return this.readPendingVNPayTransaction();
  }

  clearPendingVNPayTransaction(): void {
    this.removePendingVNPayTransaction();
  }
}

export const walletService = new WalletService();

export default walletService;
