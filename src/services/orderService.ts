// Payload cho API create-with-wallet
export interface CreateOrderWithWalletPayload {
  vehicleId: string;
  startTime: string;
  endTime: string;
  paymentMethod: 'WALLET';
  promotionCode?: string;
}

// Response cho API create-with-wallet
export interface CreateOrderWithWalletResponse {
  orderId: string;
  orderCode: string;
  orderDate: string;
  startTime: string;
  endTime: string;
  basePrice: number;
  totalPrice: number;
  depositAmount: number;
  status: string;
  paymentMethod: string;
  paymentUrl: string | null;
  vehicle: {
    vehicleId: string;
    licensePlate: string;
    modelName: string;
  };
  contract: {
    contractId: string;
    contractDate: string;
    fileUrl: string | null;
  };
}
/**
 * Order Service
 * Handles booking orders for rentals
 */
import { API_BASE_URL } from '../config/api';

interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

export interface BookOrderPayload {
  vehicleId: string;
  startTime: string;
  endTime: string;
  paymentMethod: 'deposit' | 'full';
  promotionCode?: string;
  customer?: {
    name: string;
    email: string;
    phone: string;
  };
}

export interface BookOrderData {
  orderId: string;
  orderCode?: string;
  customerId: string;
  vehicleId: string;
  orderDate: string;
  startTime: string;
  endTime: string;
  returnTime?: string | null;
  totalPrice: number;
  originalPrice: number;
  discountAmount: number | null;
  promotionCode: string | null;
  status: string;
  vehicleModelName: string;
  pricePerHour: number;
}

export interface OrderRecord {
  orderId: string;
  orderCode?: string;
  customerId: string;
  vehicleId: string;
  orderDate: string;
  startTime: string;
  endTime: string;
  returnTime?: string | null;
  basePrice: number;
  totalPrice: number;
  promotionId: string | null;
  status: string;
  createdAt: string;
  updatedAt: string | null;
  isactive: boolean;
  vehicleModelName?: string;
  pricePerHour?: number;
  discountAmount?: number | null;
  originalPrice?: number;
}

export interface VerifyOrderCodeResponse {
  orderId: string;
  orderCode: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  vehicleId: string;
  vehicleLicensePlate: string;
  vehicleModel: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  depositPaid: number;
  orderStatus: string;
  isDepositPaid: boolean;
  contractId: string;
  contractFileUrl: string;
}

export interface UpdateReturnTimeResponse {
  orderId: string;
  orderCode: string;
  returnTime: string;
  orderStatus: string;
  vehicleStatus: string;
  message?: string;
}

class OrderService {
  private readonly baseURL = `${API_BASE_URL}/Order`;
  /**
   * Đặt xe và trừ tiền cọc trong ví (thanh toán bằng ví)
   */
  async createOrderWithWallet(payload: CreateOrderWithWalletPayload): Promise<ApiResponse<CreateOrderWithWalletResponse>> {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('Người dùng chưa đăng nhập hoặc phiên làm việc đã hết hạn.');
    }

    const response = await fetch(`${this.baseURL}/create-with-wallet`, {
      method: 'POST',
      body: JSON.stringify(payload),
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const rawBody = await response.text();

    if (!rawBody) {
      throw new Error('Máy chủ không trả về dữ liệu.');
    }

    try {
      const parsed = JSON.parse(rawBody) as ApiResponse<CreateOrderWithWalletResponse>;
      return parsed;
    } catch (error) {
      console.error('Không thể phân tích phản hồi create-with-wallet:', error);
      throw new Error('Dữ liệu phản hồi không đúng định dạng JSON.');
    }
  }

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

  async bookOrder(payload: BookOrderPayload): Promise<ApiResponse<BookOrderData>> {
    const response = await this.request<ApiResponse<BookOrderData>>(
      `${this.baseURL}/book`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );

    return response;
  }

  async getMyOrders(): Promise<ApiResponse<BookOrderData[]>> {
    const response = await this.request<ApiResponse<BookOrderData[]>>(
      `${this.baseURL}/my-orders`,
      {
        method: 'GET',
      }
    );

    return response;
  }

  async getAllOrders(): Promise<ApiResponse<OrderRecord[]>> {
    const response = await this.request<ApiResponse<OrderRecord[]>>(
      `${this.baseURL}`,
      {
        method: 'GET',
      }
    );

    return response;
  }

  async startOrder(orderId: string): Promise<ApiResponse<OrderRecord>> {
    const response = await this.request<ApiResponse<OrderRecord>>(
      `${this.baseURL}/${orderId}/start`,
      {
        method: 'PUT',
      }
    );

    return response;
  }

  async verifyOrderCode(orderCode: string): Promise<ApiResponse<VerifyOrderCodeResponse>> {
    const response = await this.request<ApiResponse<VerifyOrderCodeResponse>>(
      `${this.baseURL}/verify-code`,
      {
        method: 'POST',
        body: JSON.stringify({ orderCode }),
      }
    );

    return response;
  }

  async updateReturnTime(orderId: string): Promise<ApiResponse<UpdateReturnTimeResponse>> {
    const response = await this.request<ApiResponse<UpdateReturnTimeResponse>>(
      `${this.baseURL}/${orderId}/update-return-time`,
      {
        method: 'PUT',
      }
    );

    return response;
  }
}

export const orderService = new OrderService();
