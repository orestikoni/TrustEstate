import { apiClient } from '@/lib/api-client';
import type {
  OfferDto,
  SubmitOfferRequest,
  CounterOfferRequest,
  SubmitRevisedOfferRequest,
  PostInspectionOptionsDto,
} from '@/types';

export const offerService = {
  // ── Buyer ────────────────────────────────────────────────────────────────

  submitOffer: (data: SubmitOfferRequest) =>
    apiClient.post<OfferDto>('/offers', data),

  getMyOffers: () =>
    apiClient.get<OfferDto[]>('/offers/my'),

  acceptCounterOffer: (offerId: number) =>
    apiClient.post<OfferDto>(`/offers/${offerId}/accept-counter`, {}),

  declineCounterOffer: (offerId: number) =>
    apiClient.post<void>(`/offers/${offerId}/decline-counter`, {}),

  submitRevisedOffer: (offerId: number, data: SubmitRevisedOfferRequest) =>
    apiClient.post<OfferDto>(`/offers/${offerId}/revise`, data),

  withdrawOffer: (offerId: number) =>
    apiClient.post<void>(`/offers/${offerId}/withdraw`, {}),

  getPostInspectionOptions: (offerId: number) =>
    apiClient.get<PostInspectionOptionsDto>(`/offers/${offerId}/post-inspection-options`),

  withdrawAfterInspection: (offerId: number) =>
    apiClient.post<void>(`/offers/${offerId}/withdraw-after-inspection`, {}),

  reviseAfterInspection: (offerId: number, revisedPrice: number) =>
    apiClient.post<OfferDto>(`/offers/${offerId}/revise-after-inspection`, { revisedPrice }),

  // ── Agent ────────────────────────────────────────────────────────────────

  getOffersByListing: (listingId: number) =>
    apiClient.get<OfferDto[]>(`/offers/listing/${listingId}`),

  acceptOffer: (offerId: number) =>
    apiClient.post<OfferDto>(`/offers/${offerId}/accept`, {}),

  declineOffer: (offerId: number) =>
    apiClient.post<void>(`/offers/${offerId}/decline`, {}),

  counterOffer: (offerId: number, data: CounterOfferRequest) =>
    apiClient.post<OfferDto>(`/offers/${offerId}/counter`, data),

  // ── Owner ────────────────────────────────────────────────────────────────

  getOffersByListingOwner: (listingId: number) =>
    apiClient.get<OfferDto[]>(`/offers/listing/${listingId}/owner`),

  // ── Shared ───────────────────────────────────────────────────────────────

  getOfferById: (offerId: number) =>
    apiClient.get<OfferDto>(`/offers/${offerId}`),
};
