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

export type AdminListingStatus =
  | 'PendingAgentReview'
  | 'CorrectionsRequested'
  | 'Active'
  | 'UnderOffer'
  | 'Suspended'
  | 'Archived'
  | 'Removed';

export interface AdminListing {
  listingId: number;
  title: string;
  address: string;
  city: string;
  country: string;
  askingPrice: number;
  listingType: string;
  propertyType: string;
  status: AdminListingStatus;
  ownerId: number;
  ownerName: string | null;
  agentId: number | null;
  agentName: string | null;
  photoUrl: string | null;
  moderationNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  accountStatus: string;
  createdAt: string;
}

export const adminService = {
  getPendingVerifications: () =>
    apiClient.get<PendingVerification[]>('/admin/verifications'),

  approveVerification: (userId: number) =>
    apiClient.put<void>(`/admin/verifications/${userId}/approve`, {}),

  rejectVerification: (userId: number, notes?: string) =>
    apiClient.put<void>(`/admin/verifications/${userId}/reject`, { notes: notes ?? null }),

  getAllListings: (status?: string) =>
    apiClient.get<AdminListing[]>(`/admin/listings${status ? `?status=${status}` : ''}`),

  suspendListing: (id: number, reason: string) =>
    apiClient.put<void>(`/admin/listings/${id}/suspend`, { reason }),

  removeListing: (id: number, reason: string) =>
    apiClient.put<void>(`/admin/listings/${id}/remove`, { reason }),

  getUsers: () =>
    apiClient.get<AdminUser[]>('/admin/users'),
};
