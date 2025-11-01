interface ApiResponse<T> {
  message: string;
  data: T;
}

export interface AccountRecord {
  accountId: string;
  username: string;
  email: string;
  contactNumber: string | null;
  createdAt: string;
  updatedAt: string | null;
  isActive: boolean;
  roleName: string[];
}

class AccountService {
  private readonly baseURL = '/api/Account';

  private async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('accessToken');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  }

  async getAccounts(): Promise<AccountRecord[]> {
    const response = await this.request<ApiResponse<AccountRecord[]>>(this.baseURL, {
      method: 'GET',
    });

    return response.data ?? [];
  }
}

export const accountService = new AccountService();
