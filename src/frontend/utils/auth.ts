import { User, Permission } from '../types';

export const setToken = (token: string): void => {
  localStorage.setItem('token', token);
};

export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

export const removeToken = (): void => {
  localStorage.removeItem('token');
};

export const setRefreshToken = (token: string): void => {
  localStorage.setItem('refreshToken', token);
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem('refreshToken');
};

export const removeRefreshToken = (): void => {
  localStorage.removeItem('refreshToken');
};

export const setUser = (user: User): void => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const getUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const removeUser = (): void => {
  localStorage.removeItem('user');
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};

export const hasPermission = (resource: string, action: string): boolean => {
  const user = getUser();
  if (!user || !user.permissions) return true; // Allow by default if no permissions found

  return user.permissions.some(
    (p: Permission) => p.resource === resource && p.action === action
  );
};

export const hasRole = (roleName: string): boolean => {
  const user = getUser();
  if (!user || !user.roles) return false;

  return user.roles.some((r: any) => r.name === roleName);
};

export const hasAnyRole = (roleNames: string[]): boolean => {
  const user = getUser();
  if (!user || !user.roles) return false;

  return user.roles.some((r: any) => roleNames.includes(r.name));
};

export const logout = (): void => {
  removeToken();
  removeRefreshToken();
  removeUser();
};
