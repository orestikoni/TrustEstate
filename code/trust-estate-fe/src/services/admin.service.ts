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

export interface AdminInspection {
  inspectionId: number;
  propertyTitle: string;
  inspectorName: string;
  agentName: string;
  status: string;
  scheduledDate: string;
  completedAt: string | null;
  finalVerdict: string | null;
  hasReport: boolean;
  reportLocked: boolean;
}

export interface AdminDispute {
  disputeId: number;
  transactionId: number;
  listingId: number;
  propertyTitle: string;
  listingAddress: string;
  askingPrice: number;
  submittedByFullName: string;
  buyerName: string;
  ownerName: string;
  agentName: string;
  acceptedOfferPrice: number;
  negotiationRounds: number;
  inspectionVerdict: string | null;
  description: string;
  status: string;
  resolutionOutcome: string | null;
  submittedAt: string;
  resolvedAt: string | null;
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

  suspendUser: (userId: number, reason?: string) =>
    apiClient.put<void>(`/admin/users/${userId}/suspend`, { reason: reason ?? null }),

  getInspections: () =>
    apiClient.get<AdminInspection[]>('/admin/inspections'),

  getDisputes: () =>
    apiClient.get<AdminDispute[]>('/admin/disputes'),

  resolveDispute: (disputeId: number, resolutionOutcome: string) =>
    apiClient.put<void>(`/admin/disputes/${disputeId}/resolve`, { resolutionOutcome }),
};
