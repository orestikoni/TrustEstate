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

export const listingService = {
  getMyListings: () => apiClient.get<ApiListing[]>('/listings/my'),
  getAgents: () => apiClient.get<AvailableAgent[]>('/listings/agents'),
  createListing: (data: CreateListingPayload) => apiClient.post<ApiListing>('/listings', data),
  updateListing: (id: number, data: UpdateListingPayload) => apiClient.put<ApiListing>(`/listings/${id}`, data),
  deleteListing: (id: number) => apiClient.delete<void>(`/listings/${id}`),
};
