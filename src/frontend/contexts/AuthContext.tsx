import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, Permission, Role } from '../types';
import { api } from '../utils/api';
import { ApiResponse } from '../types';

interface Session {
  id: string;
  deviceInfo: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  expiresAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<ApiResponse>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<ApiResponse<User>>;
  changePassword: (data: ChangePasswordData) => Promise<ApiResponse>;
  forgotPassword: (email: string) => Promise<ApiResponse>;
  resetPassword: (token: string, password: string, confirmPassword: string) => Promise<ApiResponse>;
  verifyEmail: () => Promise<ApiResponse>;
  resendVerification: () => Promise<ApiResponse>;
  getSessions: () => Promise<Session[]>;
  revokeSession: (sessionId: string) => Promise<ApiResponse>;
  clearError: () => void;
}

interface RegisterData {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  userType?: string;
}

interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.getCurrentUser();
      if (response.success && response.data) {
        setUser(response.data as User);
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } catch (err: any) {
      console.error('Failed to fetch user:', err);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    setError(null);
    setLoading(true);

    try {
      const response = await api.login(email, password);
      
      if (response.success && response.data) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user);
      } else {
        throw new Error(response.message || 'فشل تسجيل الدخول');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تسجيل الدخول');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setError(null);
    setLoading(true);

    try {
      const response = await api.register(data);
      
      if (response.success) {
        return response;
      } else {
        throw new Error(response.message || 'فشل إنشاء الحساب');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء إنشاء الحساب');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  const logoutAll = async () => {
    try {
      await api.logoutAll();
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الخروج من جميع الأجهزة');
      throw err;
    }
  };

  const refreshToken = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token');
    }

    try {
      const response = await api.refreshToken(refreshToken);
      
      if (response.success && response.data) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user);
      } else {
        throw new Error(response.message || 'فشل تحديث الرمز');
      }
    } catch (err: any) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
      throw err;
    }
  };

  const updateProfile = async (data: UpdateProfileData) => {
    setError(null);

    try {
      const response = await api.updateProfile(data);
      
      if (response.success && response.data) {
        const updatedUser = { ...user, ...response.data } as User;
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        return response;
      } else {
        throw new Error(response.message || 'فشل تحديث الملف الشخصي');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تحديث الملف الشخصي');
      throw err;
    }
  };

  const changePassword = async (data: ChangePasswordData) => {
    setError(null);

    try {
      const response = await api.changePassword(data);
      
      if (response.success) {
        return response;
      } else {
        throw new Error(response.message || 'فشل تغيير كلمة المرور');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تغيير كلمة المرور');
      throw err;
    }
  };

  const forgotPassword = async (email: string) => {
    setError(null);

    try {
      const response = await api.forgotPassword(email);
      
      if (response.success) {
        return response;
      } else {
        throw new Error(response.message || 'فشل إرسال رابط إعادة التعيين');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء إرسال رابط إعادة التعيين');
      throw err;
    }
  };

  const resetPassword = async (token: string, password: string, confirmPassword: string) => {
    setError(null);

    try {
      const response = await api.resetPassword(token, password, confirmPassword);
      
      if (response.success) {
        return response;
      } else {
        throw new Error(response.message || 'فشل إعادة تعيين كلمة المرور');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء إعادة تعيين كلمة المرور');
      throw err;
    }
  };

  const verifyEmail = async () => {
    setError(null);

    try {
      const response = await api.verifyEmail();
      
      if (response.success) {
        // Refresh user data
        await fetchUser();
        return response;
      } else {
        throw new Error(response.message || 'فشل التحقق من البريد الإلكتروني');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء التحقق من البريد الإلكتروني');
      throw err;
    }
  };

  const resendVerification = async () => {
    setError(null);

    try {
      const response = await api.resendVerification();
      
      if (response.success) {
        return response;
      } else {
        throw new Error(response.message || 'فشل إعادة إرسال رابط التحقق');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء إعادة إرسال رابط التحقق');
      throw err;
    }
  };

  const getSessions = async (): Promise<Session[]> => {
    try {
      const response = await api.getMySessions();
      
      if (response.success && response.data) {
        return response.data as Session[];
      } else {
        throw new Error(response.message || 'فشل جلب الجلسات');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء جلب الجلسات');
      throw err;
    }
  };

  const revokeSession = async (sessionId: string) => {
    setError(null);

    try {
      const response = await api.revokeSession(sessionId);
      
      if (response.success) {
        return response;
      } else {
        throw new Error(response.message || 'فشل إنهاء الجلسة');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء إنهاء الجلسة');
      throw err;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    logoutAll,
    refreshToken,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerification,
    getSessions,
    revokeSession,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
