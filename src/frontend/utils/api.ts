import { ApiResponse, AuthResponse, PaginatedResponse, User } from '../types';

const API_BASE_URL = '/api';

class ApiClient {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retries: number = 1
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

      // Handle token refresh for 401 errors
      if (response.status === 401 && retries > 0 && this.getRefreshToken()) {
        try {
          await this.refreshAuthToken();
          return this.request(endpoint, options, retries - 1);
        } catch (refreshError) {
          this.clearAuth();
          throw new Error('Session expired, please login again');
        }
      }

      if (!response.ok) {
        throw new Error(data.message || 'حدث خطأ في الطلب');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  private async refreshAuthToken(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token');
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ refreshToken })
    });

    const data = await response.json();

    if (response.ok && data.success && data.data) {
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.data.user));
    } else {
      throw new Error(data.message || 'Failed to refresh token');
    }
  }

  private clearAuth(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  // Auth methods
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
    userType?: string;
  }): Promise<ApiResponse> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async logout(): Promise<ApiResponse> {
    return this.request('/auth/logout', {
      method: 'POST'
    });
  }

  async logoutAll(): Promise<ApiResponse> {
    return this.request('/auth/logout-all', {
      method: 'POST'
    });
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    return this.request<AuthResponse['data']>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken })
    });
  }

  async forgotPassword(email: string): Promise<ApiResponse> {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  async resetPassword(token: string, password: string, confirmPassword: string): Promise<ApiResponse> {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password, confirmPassword })
    });
  }

  async verifyEmail(): Promise<ApiResponse> {
    return this.request('/auth/verify-email', {
      method: 'POST'
    });
  }

  async resendVerification(): Promise<ApiResponse> {
    return this.request('/auth/resend-verification', {
      method: 'POST'
    });
  }

  async getCurrentUser(): Promise<ApiResponse> {
    return this.request('/auth/me');
  }

  async updateProfile(data: {
    firstName?: string;
    lastName?: string;
  }): Promise<ApiResponse<User>> {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<ApiResponse> {
    return this.request('/auth/password', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async getMySessions(): Promise<ApiResponse> {
    return this.request('/auth/sessions');
  }

  async revokeSession(sessionId: string): Promise<ApiResponse> {
    return this.request(`/auth/sessions/${sessionId}`, {
      method: 'DELETE'
    });
  }

  // Role methods
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

  // Permission methods
  async getPermissions(): Promise<ApiResponse> {
    return this.request('/permissions');
  }

  async getPermissionById(id: string): Promise<ApiResponse> {
    return this.request(`/permissions/${id}`);
  }

  // User methods
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

  // Audit log methods
  async getAuditLogs(params?: {
    page?: number;
    limit?: number;
    userId?: string;
    resource?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<any>> {
    const queryString = params ? new URLSearchParams(
      params as Record<string, string>
    ).toString() : '';
    const response = await this.request<{ logs: any[]; pagination: any }>(`/audit-logs${queryString ? `?${queryString}` : ''}`);
    return response as unknown as PaginatedResponse<any>;
  }

  async getAuditLogById(id: string): Promise<ApiResponse> {
    return this.request(`/audit-logs/${id}`);
  }

  async getAuditLogStats(): Promise<ApiResponse> {
    return this.request('/audit-logs/stats');
  }

  // Trusted person methods
  async getTrustedPersons(params?: { isActive?: boolean }): Promise<ApiResponse> {
    const queryString = params ? new URLSearchParams(params as any).toString() : '';
    return this.request(`/trusted-persons${queryString ? `?${queryString}` : ''}`);
  }

  async getTrustedPersonById(id: string): Promise<ApiResponse> {
    return this.request(`/trusted-persons/${id}`);
  }

  async createTrustedPerson(data: {
    fullName: string;
    address: string;
    whatsappNumber: string;
    idDocuments?: any;
    salaryType: string;
    baseSalary: number;
    salaryPeriod?: string;
    bankAccount?: string;
  }): Promise<ApiResponse> {
    return this.request('/trusted-persons', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateTrustedPerson(id: string, data: any): Promise<ApiResponse> {
    return this.request(`/trusted-persons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async toggleTrustedPersonStatus(id: string): Promise<ApiResponse> {
    return this.request(`/trusted-persons/${id}/toggle-status`, {
      method: 'PATCH'
    });
  }

  async deleteTrustedPerson(id: string): Promise<ApiResponse> {
    return this.request(`/trusted-persons/${id}`, {
      method: 'DELETE'
    });
  }

  // Manual transfer methods
  async getManualTransfers(params?: {
    status?: string;
    trustedPersonId?: string;
    period?: string;
  }): Promise<ApiResponse> {
    const queryString = params ? new URLSearchParams(params as any).toString() : '';
    return this.request(`/manual-transfers${queryString ? `?${queryString}` : ''}`);
  }

  async getManualTransferById(id: string): Promise<ApiResponse> {
    return this.request(`/manual-transfers/${id}`);
  }

  async getTransfersByPeriod(period: string): Promise<ApiResponse> {
    return this.request(`/manual-transfers/period/${period}`);
  }

  async createManualTransfer(data: {
    trustedPersonId: string;
    period: string;
    amount: number;
    currency?: string;
    transferDate: string;
    transferMethod: string;
    recipientInfo?: string;
    notes?: string;
  }): Promise<ApiResponse> {
    return this.request('/manual-transfers', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateManualTransfer(id: string, data: any): Promise<ApiResponse> {
    return this.request(`/manual-transfers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async updateTransferStatus(id: string, status: string): Promise<ApiResponse> {
    return this.request(`/manual-transfers/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  async deleteManualTransfer(id: string): Promise<ApiResponse> {
    return this.request(`/manual-transfers/${id}`, {
      method: 'DELETE'
    });
  }

  // Transfer record methods
  async getTransferRecordsByTransfer(transferId: string): Promise<ApiResponse> {
    return this.request(`/transfer-records/transfer/${transferId}`);
  }

  async createTransferRecord(data: {
    manualTransferId: string;
    userId?: string;
    employeeName: string;
    amount: number;
    salaryType: string;
    description?: string;
  }): Promise<ApiResponse> {
    return this.request('/transfer-records', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async bulkCreateTransferRecords(data: {
    manualTransferId: string;
    records: Array<{
      userId?: string;
      employeeName: string;
      amount: number;
      salaryType: string;
      description?: string;
    }>;
  }): Promise<ApiResponse> {
    return this.request('/transfer-records/bulk', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateTransferRecord(id: string, data: any): Promise<ApiResponse> {
    return this.request(`/transfer-records/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async confirmTransferRecord(id: string): Promise<ApiResponse> {
    return this.request(`/transfer-records/${id}/confirm`, {
      method: 'PATCH'
    });
  }

  async deleteTransferRecord(id: string): Promise<ApiResponse> {
    return this.request(`/transfer-records/${id}`, {
      method: 'DELETE'
    });
  }

  // Report methods
  async getPayrollReport(params?: any): Promise<ApiResponse> {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    return this.request(`/reports/payroll${queryString ? `?${queryString}` : ''}`);
  }

  async getShippingReport(params?: any): Promise<ApiResponse> {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    return this.request(`/reports/shipping${queryString ? `?${queryString}` : ''}`);
  }

  async getProfitsReport(params?: any): Promise<ApiResponse> {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    return this.request(`/reports/profits${queryString ? `?${queryString}` : ''}`);
  }

  async getCreditsReport(): Promise<ApiResponse> {
    return this.request('/reports/credits');
  }

  async getCompaniesReport(): Promise<ApiResponse> {
    return this.request('/reports/companies');
  }

  async getExchangeDiffsReport(): Promise<ApiResponse> {
    return this.request('/reports/exchange-diffs');
  }

  async getDashboardReportStats(): Promise<ApiResponse> {
    return this.request('/reports/dashboard-stats');
  }

  // ============ Hosts ============
  async getHosts(params?: { isActive?: boolean; search?: string }): Promise<ApiResponse> {
    const queryString = params ? new URLSearchParams(params as any).toString() : '';
    return this.request(`/hosts${queryString ? `?${queryString}` : ''}`);
  }

  async getHostById(id: string): Promise<ApiResponse> {
    return this.request(`/hosts/${id}`);
  }

  async createHost(data: {
    fullName: string;
    agencyName: string;
    address: string;
    whatsappNumber: string;
    notes?: string;
  }): Promise<ApiResponse> {
    return this.request('/hosts', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateHost(id: string, data: any): Promise<ApiResponse> {
    return this.request(`/hosts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async toggleHostStatus(id: string): Promise<ApiResponse> {
    return this.request(`/hosts/${id}/toggle-status`, {
      method: 'PATCH'
    });
  }

  async deleteHost(id: string): Promise<ApiResponse> {
    return this.request(`/hosts/${id}`, {
      method: 'DELETE'
    });
  }

  // ============ Sub-Agents ============
  async getSubAgents(params?: { isActive?: boolean; search?: string }): Promise<ApiResponse> {
    const queryString = params ? new URLSearchParams(params as any).toString() : '';
    return this.request(`/sub-agents${queryString ? `?${queryString}` : ''}`);
  }

  async getSubAgentById(id: string): Promise<ApiResponse> {
    return this.request(`/sub-agents/${id}`);
  }

  async createSubAgent(data: {
    roomId: string;
    activationCode: string;
    whatsappNumber: string;
    commissionRate: number;
    agencyName: string;
    notes?: string;
    numberOfUsers?: number;
  }): Promise<ApiResponse> {
    return this.request('/sub-agents', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateSubAgent(id: string, data: any): Promise<ApiResponse> {
    return this.request(`/sub-agents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async toggleSubAgentStatus(id: string): Promise<ApiResponse> {
    return this.request(`/sub-agents/${id}/toggle-status`, {
      method: 'PATCH'
    });
  }

  async regenerateSubAgentCode(id: string): Promise<ApiResponse> {
    return this.request(`/sub-agents/${id}/regenerate-code`, {
      method: 'POST'
    });
  }

  async deleteSubAgent(id: string): Promise<ApiResponse> {
    return this.request(`/sub-agents/${id}`, {
      method: 'DELETE'
    });
  }

  // ============ Approved ============
  async getApproved(params?: { isActive?: boolean; search?: string; country?: string }): Promise<ApiResponse> {
    const queryString = params ? new URLSearchParams(params as any).toString() : '';
    return this.request(`/approved${queryString ? `?${queryString}` : ''}`);
  }

  async getApprovedById(id: string): Promise<ApiResponse> {
    return this.request(`/approved/${id}`);
  }

  async getApprovedCountries(): Promise<ApiResponse> {
    return this.request('/approved/countries');
  }

  async createApproved(data: {
    approvedName: string;
    whatsappNumber: string;
    amount: number;
    approvalDate?: string;
    numberOfUsers?: number;
    countries?: string[];
    address?: string;
    notes?: string;
  }): Promise<ApiResponse> {
    return this.request('/approved', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateApproved(id: string, data: any): Promise<ApiResponse> {
    return this.request(`/approved/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async toggleApprovedStatus(id: string): Promise<ApiResponse> {
    return this.request(`/approved/${id}/toggle-status`, {
      method: 'PATCH'
    });
  }

  async deleteApproved(id: string): Promise<ApiResponse> {
    return this.request(`/approved/${id}`, {
      method: 'DELETE'
    });
  }

  // ============ Supervisors ============
  async getSupervisors(params?: { isActive?: boolean; search?: string; supervisorType?: string }): Promise<ApiResponse> {
    const queryString = params ? new URLSearchParams(params as any).toString() : '';
    return this.request(`/supervisors${queryString ? `?${queryString}` : ''}`);
  }

  async getSupervisorById(id: string): Promise<ApiResponse> {
    return this.request(`/supervisors/${id}`);
  }

  async getSupervisorStats(): Promise<ApiResponse> {
    return this.request('/supervisors/stats');
  }

  async createSupervisor(data: {
    supervisorType: string;
    salary: number;
    salaryPeriod: string;
    fullName: string;
    whatsappNumber: string;
  }): Promise<ApiResponse> {
    return this.request('/supervisors', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateSupervisor(id: string, data: any): Promise<ApiResponse> {
    return this.request(`/supervisors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async toggleSupervisorStatus(id: string): Promise<ApiResponse> {
    return this.request(`/supervisors/${id}/toggle-status`, {
      method: 'PATCH'
    });
  }

  async deleteSupervisor(id: string): Promise<ApiResponse> {
    return this.request(`/supervisors/${id}`, {
      method: 'DELETE'
    });
  }

  // ============ Marketers ============
  async getMarketers(params?: { isActive?: boolean; search?: string; marketingMethod?: string }): Promise<ApiResponse> {
    const queryString = params ? new URLSearchParams(params as any).toString() : '';
    return this.request(`/marketers${queryString ? `?${queryString}` : ''}`);
  }

  async getMarketerById(id: string): Promise<ApiResponse> {
    return this.request(`/marketers/${id}`);
  }

  async getMarketerStats(): Promise<ApiResponse> {
    return this.request('/marketers/stats');
  }

  async getMarketingMethods(): Promise<ApiResponse> {
    return this.request('/marketers/methods');
  }

  async createMarketer(data: {
    fullName: string;
    numberOfPeople?: number;
    marketingMethods?: string[];
    marketingSalary?: number;
    profitPerCustomer?: number;
  }): Promise<ApiResponse> {
    return this.request('/marketers', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateMarketer(id: string, data: any): Promise<ApiResponse> {
    return this.request(`/marketers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async toggleMarketerStatus(id: string): Promise<ApiResponse> {
    return this.request(`/marketers/${id}/toggle-status`, {
      method: 'PATCH'
    });
  }

  async deleteMarketer(id: string): Promise<ApiResponse> {
    return this.request(`/marketers/${id}`, {
      method: 'DELETE'
    });
  }
}

export const api = new ApiClient();
