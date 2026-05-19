export type UserRole =
  | 'Admin'
  | 'Agent'
  | 'PropertyOwner'
  | 'PropertyInspector'
  | 'Buyer';

export type AccountStatus =
  | 'Active'
  | 'Pending'
  | 'Suspended'
  | 'Deactivated'
  | 'Rejected';

export type AgencyType = 'Independent' | 'Agency';

export interface User {
  userId: number;
  firstName: string;
  lastName: string;
  emailAddress: string;
  role: UserRole;
  accountStatus: AccountStatus;
  phoneNumber?: string;
  profilePhotoUrl?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  statusCode: number;
}

// ─── Offers ──────────────────────────────────────────────────────────────────

export type OfferStatus =
  | 'Pending'
  | 'Accepted'
  | 'Declined'
  | 'Countered'
  | 'Withdrawn'
  | 'Expired'
  | 'Closed';

export type NegotiationActorRole = 'Agent' | 'Buyer';
export type NegotiationAction = 'Counter' | 'Accept' | 'Decline' | 'Withdraw';

export interface NegotiationDto {
  negotiationId: number;
  offerId: number;
  roundNumber: number;
  actorRole: NegotiationActorRole;
  proposedPrice: number;
  message: string | null;
  action: NegotiationAction;
  responseDeadline: string | null;
  createdAt: string;
}

export interface OfferDto {
  offerId: number;
  listingId: number;
  buyerId: number;
  buyerFullName: string;
  proposedPrice: number;
  message: string | null;
  status: OfferStatus;
  negotiationRound: number;
  responseDeadline: string | null;
  submittedAt: string;
  resolvedAt: string | null;
  negotiations: NegotiationDto[];
}

export interface SubmitOfferRequest {
  listingId: number;
  proposedPrice: number;
  message?: string;
}

export interface CounterOfferRequest {
  revisedPrice: number;
  responseDeadline: string;
  message?: string;
}

export interface SubmitRevisedOfferRequest {
  revisedPrice: number;
  message?: string;
}

export interface PostInspectionOptionsDto {
  windowOpen: boolean;
  windowExpiresAt: string | null;
  verdictStatus: string;
  canWithdraw: boolean;
  canRevise: boolean;
}