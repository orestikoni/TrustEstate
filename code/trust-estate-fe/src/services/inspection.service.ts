import { apiClient } from '@/lib/api-client';

export interface InspectionPhotoDto {
  inspectionPhotoId: number;
  photoUrl: string;
  uploadedAt: string;
}

export interface InspectionCategoryDto {
  categoryId: number;
  categoryName: string;
  findings: string;
  passFail: string;
  severity: string;
  photos: InspectionPhotoDto[];
}

export interface InspectionReportDto {
  reportId: number;
  inspectionId: number;
  finalVerdict: string | null;
  isLocked: boolean;
  submittedAt: string | null;
  verdictSubmittedAt: string | null;
  categories: InspectionCategoryDto[];
}

export interface MyInspectionDto {
  inspectionId: number;
  listingId: number;
  propertyTitle: string;
  propertyAddress: string;
  photoUrl: string | null;
  agentName: string;
  agentEmail: string;
  ownerName: string;
  scheduledDate: string;
  assignedAt: string;
  status: string;
  report: InspectionReportDto | null;
}

export interface CategoryInput {
  categoryName: string;
  findings: string;
  passFail: string;
  severity: string;
  photoUrls: string[];
}

export interface InspectorDto {
  userId: number;
  firstName: string;
  lastName: string;
  professionalQualifications: string | null;
}

export interface InspectionDto {
  inspectionId: number;
  listingId: number;
  offerId: number;
  inspectorId: number;
  inspectorFullName: string;
  agentId: number;
  status: string;
  scheduledDate: string;
  assignedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  report: InspectionReportDto | null;
}

export const inspectionService = {
  // Inspector
  getMyInspections: () =>
    apiClient.get<MyInspectionDto[]>('/inspections/my'),

  updateStatus: (inspectionId: number, status: string) =>
    apiClient.put<void>(`/inspections/${inspectionId}/status`, { status }),

  submitReport: (inspectionId: number, categories: CategoryInput[]) =>
    apiClient.post<InspectionReportDto>(`/inspections/${inspectionId}/report`, { categories }),

  submitVerdict: (inspectionId: number, verdict: string) =>
    apiClient.post<InspectionReportDto>(`/inspections/${inspectionId}/verdict`, { verdict }),

  // Agent
  getAvailableInspectors: () =>
    apiClient.get<InspectorDto[]>('/inspections/inspectors'),

  assignInspector: (request: { listingId: number; offerId: number; inspectorId: number; scheduledDate: string }) =>
    apiClient.post<InspectionDto>('/inspections/assign', request),

  getInspectionByListing: (listingId: number) =>
    apiClient.get<InspectionDto>(`/inspections/listing/${listingId}`),

  // Buyer
  getInspectionReport: (listingId: number) =>
    apiClient.get<InspectionReportDto>(`/inspections/listing/${listingId}/report`),

  // Owner
  getOwnerInspectionReport: (listingId: number) =>
    apiClient.get<InspectionReportDto>(`/inspections/listing/${listingId}/report/owner`),
};
