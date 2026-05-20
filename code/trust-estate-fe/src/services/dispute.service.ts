import { apiClient } from '@/lib/api-client';

export interface DisputeFormDto {
  listingId: number;
  listingTitle: string;
  transactionId: number;
  transactionStatus: string;
}

export interface DisputeDto {
  disputeId: number;
  transactionId: number;
  submittedById: number;
  submittedByFullName: string;
  description: string;
  status: string;
  resolutionOutcome: string | null;
  submittedAt: string;
  resolvedAt: string | null;
}

export const disputeService = {
  getDisputeForm: (listingId: number) =>
    apiClient.get<DisputeFormDto>(`/disputes/form?listingId=${listingId}`),

  submitDispute: (request: { listingId: number; description: string }) =>
    apiClient.post<DisputeDto>('/disputes', request),

  getMyDisputes: () =>
    apiClient.get<DisputeDto[]>('/disputes/my'),

  getDisputeById: (disputeId: number) =>
    apiClient.get<DisputeDto>(`/disputes/${disputeId}`),
};
