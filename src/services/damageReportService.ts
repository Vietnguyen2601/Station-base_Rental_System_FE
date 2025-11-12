import { API_BASE_URL } from '../config/api';

export type DamageLevel = 'MINOR' | 'MODERATE' | 'SEVERE';

export interface DamageReportPayload {
  orderId: string;
  vehicleId: string;
  description: string;
  damageLevel: DamageLevel;
  estimatedCost: number;
  img?: string;
}

export interface DamageReportRecord {
  damageId: string;
  orderId: string;
  vehicleId: string;
  description: string;
  estimatedCost: number;
  damageLevel: DamageLevel;
  img: string;
  createdAt: string;
  updatedAt: string | null;
  isactive: boolean;
}

interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

class DamageReportService {
  private readonly baseURL = `${API_BASE_URL}/DamageReport`;

  private buildAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('accessToken');

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  async createDamageReport(payload: DamageReportPayload): Promise<{ message: string; record: DamageReportRecord }> {
    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: this.buildAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    const rawText = await response.text();

    if (!response.ok) {
      let message = `Không thể lưu biên bản hư hại (mã ${response.status}).`;

      if (rawText) {
        try {
          const errorResponse = JSON.parse(rawText) as Partial<ApiResponse<unknown>>;
          if (errorResponse.message) {
            message = errorResponse.message;
          }
        } catch {
          // ignore parse errors
        }
      }

      throw new Error(message);
    }

    if (!rawText) {
      throw new Error('Máy chủ không trả về dữ liệu khi lưu biên bản hư hại.');
    }

    try {
      const parsed = JSON.parse(rawText) as ApiResponse<DamageReportRecord>;
      return {
        message: parsed.message ?? 'Lưu biên bản hư hại thành công.',
        record: parsed.data,
      };
    } catch (error) {
      console.error('[damageReportService] Không thể phân tích phản hồi:', error);
      throw new Error('Phản hồi biên bản hư hại không hợp lệ.');
    }
  }
}

const damageReportService = new DamageReportService();

export default damageReportService;
