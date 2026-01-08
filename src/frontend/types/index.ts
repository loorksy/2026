export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  userType?: UserType;
  role?: RoleType;
  status?: UserStatus;
  isActive?: boolean;
  lastLogin?: string | null;
  twoFactorEnabled?: boolean;
  emailVerified?: boolean;
  roles?: Role[];
  permissions?: Permission[];
  createdAt?: string;
  updatedAt?: string;
}

export enum UserType {
  Host = 'Host',
  SubAgent = 'SubAgent',
  Approved = 'Approved',
  TrustedPerson = 'TrustedPerson',
  Supervisor = 'Supervisor',
  Marketer = 'Marketer'
}

export enum RoleType {
  Admin = 'Admin',
  Accountant = 'Accountant',
  Manager = 'Manager',
  Viewer = 'Viewer'
}

export enum UserStatus {
  active = 'active',
  inactive = 'inactive',
  suspended = 'suspended'
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  isSystem: boolean;
  permissions?: Permission[];
  userCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: Action;
  description?: string;
  roleCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export enum Action {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE'
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  assignedAt: string;
  assignedBy?: string;
  assignedByUser?: User;
}

export interface AuditLog {
  id: string;
  userId?: string;
  user?: User;
  action: string;
  resource: string;
  resourceId?: string;
  oldValues?: any;
  newValues?: any;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface Session {
  id: string;
  deviceInfo?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  expiresAt: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    token: string;
    refreshToken: string;
    user: User;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    logs: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

// ============ New User Types ============

export interface Host {
  id: string;
  userId: string;
  fullName: string;
  agencyName: string;
  address: string;
  whatsappNumber: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user?: Pick<User, 'id' | 'email' | 'username'>;
}

export interface SubAgent {
  id: string;
  userId: string;
  roomId: string;
  activationCode: string;
  numberOfUsers: number;
  whatsappNumber: string;
  commissionRate: number;
  totalAgencyAmount: number;
  agencyName: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user?: Pick<User, 'id' | 'email' | 'username'>;
}

export interface Approved {
  id: string;
  userId: string;
  approvedName: string;
  whatsappNumber: string;
  amount: number;
  approvalDate?: string;
  numberOfUsers: number;
  countries: string[];
  address?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user?: Pick<User, 'id' | 'email' | 'username'>;
}

export interface TrustedPerson {
  id: string;
  userId?: string;
  fullName: string;
  address: string;
  whatsappNumber: string;
  idDocuments?: string[];
  salaryType: 'MONTHLY' | 'BIWEEKLY';
  baseSalary: number;
  salaryPeriod?: string;
  bankAccount?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user?: Pick<User, 'id' | 'email' | 'username'>;
}

export interface Supervisor {
  id: string;
  userId: string;
  supervisorType: 'AGENCY' | 'WHATSAPP';
  salary: number;
  salaryPeriod: 'MONTHLY' | 'BIWEEKLY';
  fullName: string;
  whatsappNumber: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user?: Pick<User, 'id' | 'email' | 'username'>;
}

export interface Marketer {
  id: string;
  userId: string;
  fullName: string;
  numberOfPeople: number;
  marketingMethods: string[];
  marketingSalary: number;
  profitPerCustomer: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user?: Pick<User, 'id' | 'email' | 'username'>;
}

// ============ Statistics Types ============

export interface SupervisorStats {
  agencyCount: number;
  whatsappCount: number;
  totalSalary: number;
}

export interface MarketerStats {
  totalMarketers: number;
  totalPeople: number;
  totalMarketingSalary: number;
  totalProfit: number;
}
