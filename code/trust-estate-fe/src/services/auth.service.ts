import { apiClient } from '@/lib/api-client';
import type {
  LoginFormData,
  RegisterFormData,
  ForgotPasswordFormData,
  ResetPasswordFormData,
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

  forgotPassword: (data: ForgotPasswordFormData) =>
    apiClient.post<{ message: string }>('/auth/forgot-password', data),

  resetPassword: (token: string, data: Omit<ResetPasswordFormData, 'confirmPassword'>) =>
    apiClient.post<{ message: string }>('/auth/reset-password', { token, ...data }),

  logout: () => apiClient.post<void>('/auth/logout', {}),

  me: () => apiClient.get<User>('/auth/me'),
};