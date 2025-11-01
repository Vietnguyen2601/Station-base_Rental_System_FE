/**
 * Station Service
 * Handles CRUD operations and related lookups for stations
 */

import { API_BASE_URL } from '../config/api';

interface ApiResponse<T> {
  message: string;
  data: T;
}

export interface StationByModelRecord {
  stationId: string;
  name: string;
  address: string;
  capacity: number;
  lat: number;
  long: number;
  availableVehicleCount: number;
}

export interface StationRecord {
  stationId: string;
  name: string;
  address: string;
  lat: number;
  long: number;
  capacity: number;
  imageUrl?: string;
  isactive: boolean;
  createdAt: string;
  updatedAt: string | null;
  vehicles?: StationVehicleRecord[];
}

export interface CreateStationPayload {
  name: string;
  address: string;
  lat: number;
  long: number;
  capacity: number;
}

export interface UpdateStationPayload extends CreateStationPayload {
  imageUrl?: string;
  isactive: boolean;
}

export interface StationVehicleRecord {
  vehicleId: string;
  serialNumber: string;
  typeName: string;
  modelName: string;
  manufacturer: string;
  pricePerHour: number;
  batteryLevel: number | null;
  batteryCapacity: number | null;
  range: number | null;
  color: string;
  img: string;
  stationName: string;
  status: string;
  lastMaintenance: string;
  specs: string | null;
}

class StationService {
  private readonly baseURL = `${API_BASE_URL}/Station`;

  private unwrapArrayResponse<T>(payload: unknown): T[] {
    if (Array.isArray(payload)) {
      return payload as T[];
    }

    if (payload && typeof payload === 'object') {
      const candidate = payload as { data?: unknown; result?: unknown; items?: unknown };

      if (Array.isArray(candidate.data)) {
        return candidate.data as T[];
      }

      if (Array.isArray(candidate.result)) {
        return candidate.result as T[];
      }

      if (Array.isArray(candidate.items)) {
        return candidate.items as T[];
      }
    }

    return [];
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

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const rawBody = await response.text();

    if (!rawBody) {
      // Backend may return 204 or empty body when there is no data
      return {} as T;
    }

    try {
      return JSON.parse(rawBody) as T;
    } catch {
      throw new Error('Dữ liệu phản hồi không đúng định dạng JSON.');
    }
  }

  async getStations(): Promise<StationRecord[]> {
    const response = await this.request<unknown>(this.baseURL, {
      method: 'GET',
    });
    return this.unwrapArrayResponse<StationRecord>(response);
  }

  async getStationsByModel(modelId: string): Promise<StationByModelRecord[]> {
    console.log('Fetching stations for model ID:', modelId);
    const url = `${this.baseURL}/by-model/${encodeURIComponent(modelId)}`;
    const response = await this.request<unknown>(url, { method: 'GET' });
    return this.unwrapArrayResponse<StationByModelRecord>(response);
  }

  async createStation(payload: CreateStationPayload): Promise<StationRecord> {
    const response = await this.request<ApiResponse<StationRecord>>(this.baseURL, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response.data;
  }

  async getStationVehicles(stationId: string): Promise<StationVehicleRecord[]> {
    const response = await this.request<unknown>(
      `${this.baseURL}/${stationId}/vehicles`,
      {
        method: 'GET',
      }
    );
    return this.unwrapArrayResponse<StationVehicleRecord>(response);
  }

  async updateStation(stationId: string, payload: UpdateStationPayload): Promise<StationRecord> {
    const response = await this.request<ApiResponse<StationRecord>>(
      `${this.baseURL}/${stationId}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      }
    );
    return response.data;
  }

  async addVehiclesToStation(stationId: string, vehicleIds: string[]): Promise<void> {
    await this.request<ApiResponse<unknown>>(`${this.baseURL}/${stationId}/vehicles`, {
      method: 'POST',
      body: JSON.stringify(vehicleIds),
    });
  }
}

export const stationService = new StationService();
