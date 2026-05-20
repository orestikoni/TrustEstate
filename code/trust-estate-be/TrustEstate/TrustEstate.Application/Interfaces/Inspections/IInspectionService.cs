using TrustEstate.Application.DTOs.Inspections;

namespace TrustEstate.Application.Interfaces.Inspections;

public interface IInspectionService
{
    Task<IEnumerable<InspectorDto>> GetAvailableInspectorsAsync(CancellationToken ct = default);
    Task<IEnumerable<MyInspectionDto>> GetMyInspectionsAsync(int inspectorId, CancellationToken ct = default);
    Task<InspectionDto> AssignInspectorAsync(int agentId, AssignInspectorRequest request, CancellationToken ct = default);
    Task<InspectionDto> ReassignInspectorAsync(int agentId, int inspectionId, ReassignInspectorRequest request, CancellationToken ct = default);
    Task<InspectionDto> UpdateInspectionStatusAsync(int inspectorId, int inspectionId, UpdateInspectionStatusRequest request, CancellationToken ct = default);
    Task<InspectionReportDto> SubmitInspectionReportAsync(int inspectorId, int inspectionId, SubmitInspectionReportRequest request, CancellationToken ct = default);
    Task<InspectionReportDto> SubmitFinalVerdictAsync(int inspectorId, int inspectionId, SubmitVerdictRequest request, CancellationToken ct = default);
    Task<InspectionReportDto> GetInspectionReportAsync(int userId, int listingId, CancellationToken ct = default);
    Task<InspectionDto> GetInspectionByListingAsync(int agentId, int listingId, CancellationToken ct = default);
}
