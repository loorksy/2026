import { ApiResponse, AuthResponse, PaginatedResponse } from '../types';

const API_BASE_URL = '/api';

class ApiClient {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'حدث خطأ في الطلب');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse['data']>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  async register(data: {
    email: string;
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<ApiResponse> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getCurrentUser(): Promise<ApiResponse> {
    return this.request('/auth/me');
  }

  async getRoles(): Promise<ApiResponse> {
    return this.request('/roles');
  }

  async getRoleById(id: string): Promise<ApiResponse> {
    return this.request(`/roles/${id}`);
  }

  async createRole(data: {
    name: string;
    description?: string;
    permissionIds?: string[];
  }): Promise<ApiResponse> {
    return this.request('/roles', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateRole(
    id: string,
    data: {
      name?: string;
      description?: string;
      isActive?: boolean;
      permissionIds?: string[];
    }
  ): Promise<ApiResponse> {
    return this.request(`/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteRole(id: string): Promise<ApiResponse> {
    return this.request(`/roles/${id}`, {
      method: 'DELETE'
    });
  }

  async getPermissions(): Promise<ApiResponse> {
    return this.request('/permissions');
  }

  async getPermissionById(id: string): Promise<ApiResponse> {
    return this.request(`/permissions/${id}`);
  }

  async getUsers(): Promise<ApiResponse> {
    return this.request('/users');
  }

  async getUserById(id: string): Promise<ApiResponse> {
    return this.request(`/users/${id}`);
  }

  async createUser(data: {
    email: string;
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
    roleIds?: string[];
  }): Promise<ApiResponse> {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateUser(
    id: string,
    data: {
      email?: string;
      username?: string;
      firstName?: string;
      lastName?: string;
      isActive?: boolean;
    }
  ): Promise<ApiResponse> {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteUser(id: string): Promise<ApiResponse> {
    return this.request(`/users/${id}`, {
      method: 'DELETE'
    });
  }

  async assignRole(userId: string, roleId: string): Promise<ApiResponse> {
    return this.request('/users/assign-role', {
      method: 'POST',
      body: JSON.stringify({ userId, roleId })
    });
  }

  async revokeRole(userId: string, roleId: string): Promise<ApiResponse> {
    return this.request('/users/revoke-role', {
      method: 'POST',
      body: JSON.stringify({ userId, roleId })
    });
  }

  async getAuditLogs(params?: {
    page?: number;
    limit?: number;
    userId?: string;
    resource?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<any>> {
    const queryString = new URLSearchParams(
      params as Record<string, string>
    ).toString();
    return this.request(`/audit-logs${queryString ? `?${queryString}` : ''}`);
  }

  async getAuditLogById(id: string): Promise<ApiResponse> {
    return this.request(`/audit-logs/${id}`);
  }

  async getAuditLogStats(): Promise<ApiResponse> {
    return this.request('/audit-logs/stats');
  }
}

export const api = new ApiClient();
