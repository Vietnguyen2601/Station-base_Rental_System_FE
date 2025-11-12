import { API_BASE_URL } from '../config/api';

interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

export interface StationOrderMetrics {
  stationId: string;
  stationName: string;
  address: string;
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  ongoingOrders: number;
  completedOrders: number;
  canceledOrders: number;
}

export interface StationRevenueMetrics {
  stationId: string;
  stationName: string;
  address: string;
  totalRevenue: number;
  totalOrders: number;
  completedOrders: number;
  usageRate: number;
  totalVehicles: number;
  rentedVehicles: number;
}

export interface StationUsageMetrics {
  stationId: string;
  stationName: string;
  address: string;
  totalVehicles: number;
  availableVehicles: number;
  rentedVehicles: number;
  maintenanceVehicles: number;
  chargingVehicles: number;
  usageRate: number;
  availabilityRate: number;
}

export interface StationOrdersSummary {
  filterType: string;
  filterDescription: string;
  startDate: string;
  endDate: string;
  stations: StationOrderMetrics[];
}

export interface StationRevenueSummary {
  filterType: string;
  filterDescription: string;
  startDate: string;
  endDate: string;
  totalRevenue: number;
  totalOrders: number;
  stationRevenues: StationRevenueMetrics[];
}

export interface StationUsageSummary {
  filterType: string;
  filterDescription: string;
  timestamp?: string;
  stations: StationUsageMetrics[];
}

export interface StationOrdersFilters {
  month?: number;
  year?: number;
  quarter?: number;
  startDate?: string;
  endDate?: string;
}

class DashboardService {
  private readonly baseURL = `${API_BASE_URL}/Dashboard`;

  private buildQueryString(filters: StationOrdersFilters): string {
    const params = new URLSearchParams();

    if (typeof filters.month === 'number') {
      params.append('Month', filters.month.toString());
    }

    if (typeof filters.year === 'number') {
      params.append('Year', filters.year.toString());
    }

    if (typeof filters.quarter === 'number') {
      params.append('Quarter', filters.quarter.toString());
    }

    if (filters.startDate) {
      params.append('StartDate', filters.startDate);
    }

    if (filters.endDate) {
      params.append('EndDate', filters.endDate);
    }

    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      throw new Error('Người dùng chưa đăng nhập hoặc phiên làm việc đã hết hạn.');
    }

    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  private async fetchDashboardData<T>(endpoint: string, filters: StationOrdersFilters = {}): Promise<T> {
    const queryString = this.buildQueryString(filters);

    const response = await fetch(`${this.baseURL}/${endpoint}${queryString}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
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
          // Ignore parse errors and use default message
        }
      }

      throw new Error(errorMessage);
    }

    if (!rawBody) {
      throw new Error('Máy chủ không trả về dữ liệu.');
    }

    try {
      const parsed = JSON.parse(rawBody) as ApiResponse<T>;
      return parsed.data;
    } catch (error) {
      console.error(`[dashboardService] Không thể phân tích dữ liệu ${endpoint}:`, error);
      throw new Error('Dữ liệu phản hồi không đúng định dạng JSON.');
    }
  }

  async getStationOrders(filters: StationOrdersFilters = {}): Promise<StationOrdersSummary> {
    return this.fetchDashboardData<StationOrdersSummary>('station-orders', filters);
  }

  async getStationRevenue(filters: StationOrdersFilters = {}): Promise<StationRevenueSummary> {
    return this.fetchDashboardData<StationRevenueSummary>('station-revenue', filters);
  }

  async getStationUsage(filters: StationOrdersFilters = {}): Promise<StationUsageSummary> {
    return this.fetchDashboardData<StationUsageSummary>('station-usage', filters);
  }
}

const dashboardService = new DashboardService();

export default dashboardService;
