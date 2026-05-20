import { apiClient } from '@/lib/api-client';

export interface TransactionStatusDto {
  transactionId: number;
  status: string;
  offerAccepted: boolean;
  inspectionCompleted: boolean;
  verdictSubmitted: boolean;
  hasOpenDisputes: boolean;
  canClose: boolean;
}

export interface TransactionDto {
  transactionId: number;
  listingId: number;
  offerId: number;
  agentId: number;
  ownerId: number;
  buyerId: number;
  status: string;
  closedAt: string | null;
  createdAt: string;
}

export const transactionService = {
  getTransactionStatus: (listingId: number) =>
    apiClient.get<TransactionStatusDto>(`/transactions/listing/${listingId}/status`),

  closeTransaction: (listingId: number) =>
    apiClient.post<TransactionDto>(`/transactions/listing/${listingId}/close`, {}),
};
