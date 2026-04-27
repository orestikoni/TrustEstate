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