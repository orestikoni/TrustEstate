import { apiClient } from '@/lib/api-client';

export type ApiListingStatus =
  | 'PendingAgentReview'
  | 'CorrectionsRequested'
  | 'Active'
  | 'UnderOffer'
  | 'Suspended'
  | 'Archived'
  | 'Removed';

export type ListingType = 'Sale' | 'Rent';
export type PropertyType = 'Apartment' | 'House' | 'Commercial' | 'Land' | 'Other';

export interface ListingPhoto {
  photoId: number;
  photoUrl: string;
  displayOrder: number | null;
}

export interface ApiListing {
  listingId: number;
  title: string;
  description: string;
  address: string;
  city: string;
  country: string;
  askingPrice: number;
  listingType: ListingType;
  propertyType: PropertyType;
  status: ApiListingStatus;
  ownerId: number;
  agentId: number | null;
  correctionNotes: string | null;
  moderationNotes: string | null;
  photos: ListingPhoto[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  archivedAt: string | null;
}

export interface AvailableAgent {
  userId: number;
  firstName: string;
  lastName: string;
  agencyName: string | null;
  agencyType: string;
}

export interface CreateListingPayload {
  title: string;
  description: string;
  address: string;
  city: string;
  country: string;
  askingPrice: number;
  listingType: ListingType;
  propertyType: PropertyType;
  agentId: number;
  photoUrls: string[];
}

export interface UpdateListingPayload {
  title: string;
  description: string;
  address: string;
  city: string;
  country: string;
  askingPrice: number;
  listingType: ListingType;
  propertyType: PropertyType;
  photoUrls: string[];
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ListingFilterParams {
  city?: string;
  country?: string;
  minPrice?: number;
  maxPrice?: number;
  propertyType?: string;
  listingType?: string;
  page?: number;
  pageSize?: number;
}

function buildQuery(params: ListingFilterParams): string {
  const q = new URLSearchParams();
  if (params.city)         q.set('city', params.city);
  if (params.country)      q.set('country', params.country);
  if (params.minPrice)     q.set('minPrice', String(params.minPrice));
  if (params.maxPrice)     q.set('maxPrice', String(params.maxPrice));
  if (params.propertyType) q.set('propertyType', params.propertyType);
  if (params.listingType)  q.set('listingType', params.listingType);
  if (params.page)         q.set('page', String(params.page));
  if (params.pageSize)     q.set('pageSize', String(params.pageSize));
  const str = q.toString();
  return str ? `?${str}` : '';
}

export const listingService = {
  // Owner
  getMyListings: () => apiClient.get<ApiListing[]>('/listings/my'),
  getAgents: () => apiClient.get<AvailableAgent[]>('/listings/agents'),
  createListing: (data: CreateListingPayload) => apiClient.post<ApiListing>('/listings', data),
  updateListing: (id: number, data: UpdateListingPayload) => apiClient.put<ApiListing>(`/listings/${id}`, data),
  deleteListing: (id: number) => apiClient.delete<void>(`/listings/${id}`),

  // Public
  getActiveListings: (params: ListingFilterParams = {}) =>
    apiClient.get<PagedResult<ApiListing>>(`/listings${buildQuery(params)}`),
  getListing: (id: number) => apiClient.get<ApiListing>(`/listings/${id}`),

  // Agent
  getAssignedListings: () => apiClient.get<ApiListing[]>('/listings/assigned'),

  // Buyer
  getFavorites: () => apiClient.get<ApiListing[]>('/listings/favorites'),
  saveFavorite: (id: number) => apiClient.post<void>(`/listings/${id}/favorites`, {}),
  removeFavorite: (id: number) => apiClient.delete<void>(`/listings/${id}/favorites`),
};
