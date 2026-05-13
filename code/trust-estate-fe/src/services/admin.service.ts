import { apiClient } from '@/lib/api-client';

export interface PendingVerification {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  role: 'Agent' | 'PropertyInspector';
  agencyType: string | null;
  agencyName: string | null;
  professionalQualifications: string | null;
  registeredAt: string;
}

export const adminService = {
  getPendingVerifications: () =>
    apiClient.get<PendingVerification[]>('/admin/verifications'),

  approveVerification: (userId: number) =>
    apiClient.put<void>(`/admin/verifications/${userId}/approve`, {}),

  rejectVerification: (userId: number, notes?: string) =>
    apiClient.put<void>(`/admin/verifications/${userId}/reject`, { notes: notes ?? null }),
};
