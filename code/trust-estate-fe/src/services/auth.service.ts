import { apiClient, tokenStorage } from '@/lib/api-client';
import type {
  LoginFormData,
  RegisterFormData,
} from '@/lib/validations/auth';
import type { AuthTokens, User } from '@/types';

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export interface RegisterResponse {
  user: User;
  message: string;
}

export const authService = {
  login: (data: Omit<LoginFormData, 'rememberMe'>) =>
    apiClient.post<LoginResponse>('/auth/login', data),

  register: (data: Omit<RegisterFormData, 'confirmPassword' | 'acceptTerms'>) =>
    apiClient.post<RegisterResponse>('/auth/register', data),

  logout: () => apiClient.post<void>('/auth/logout', { refreshToken: tokenStorage.getRefresh() }),

  me: () => apiClient.get<User>('/auth/me'),
};