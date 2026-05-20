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

export const inspectionService = {
  getMyInspections: () =>
    apiClient.get<MyInspectionDto[]>('/inspections/my'),

  updateStatus: (inspectionId: number, status: string) =>
    apiClient.put<void>(`/inspections/${inspectionId}/status`, { status }),

  submitReport: (inspectionId: number, categories: CategoryInput[]) =>
    apiClient.post<InspectionReportDto>(`/inspections/${inspectionId}/report`, { categories }),

  submitVerdict: (inspectionId: number, verdict: string) =>
    apiClient.post<InspectionReportDto>(`/inspections/${inspectionId}/verdict`, { verdict }),
};
