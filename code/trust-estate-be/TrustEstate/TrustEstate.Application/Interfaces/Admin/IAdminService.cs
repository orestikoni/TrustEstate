using TrustEstate.Application.DTOs.Admin;

namespace TrustEstate.Application.Interfaces.Admin;

public interface IAdminService
{
    // Analytics
    Task<AnalyticsDashboardDto> GetAnalyticsDashboardAsync(CancellationToken ct = default);

    // User management
    Task<IEnumerable<PendingUserDto>> GetPendingVerificationsAsync(CancellationToken ct = default);
    Task<IEnumerable<AdminUserDto>> GetAllUsersAsync(string? role, string? status, CancellationToken ct = default);
    Task ApproveUserAsync(int adminId, int userId, CancellationToken ct = default);
    Task RejectUserAsync(int adminId, int userId, UserActionRequest request, CancellationToken ct = default);
    Task DeactivateUserAsync(int adminId, int userId, UserActionRequest request, CancellationToken ct = default);
    Task SuspendUserAsync(int adminId, int userId, UserActionRequest request, CancellationToken ct = default);
    Task ReactivateUserAsync(int adminId, int userId, CancellationToken ct = default);

    // Listing management
    Task<IEnumerable<AdminListingDto>> GetAllListingsAsync(string? status, CancellationToken ct = default);
    Task FlagListingAsync(int adminId, int listingId, ListingActionRequest request, CancellationToken ct = default);
    Task SuspendListingAsync(int adminId, int listingId, ListingActionRequest request, CancellationToken ct = default);
    Task RemoveListingAsync(int adminId, int listingId, ListingActionRequest request, CancellationToken ct = default);

    // Inspection report monitoring
    Task<IEnumerable<AdminInspectionReportDto>> GetAllInspectionReportsAsync(CancellationToken ct = default);
    Task FlagInspectionReportAsync(int adminId, int reportId, InspectionReportActionRequest request, CancellationToken ct = default);
    Task RemoveInspectionReportAsync(int adminId, int reportId, InspectionReportActionRequest request, CancellationToken ct = default);

    // Dispute management
    Task<IEnumerable<AdminDisputeDto>> GetAllDisputesAsync(string? status, CancellationToken ct = default);
    Task ResolveDisputeAsync(int adminId, int disputeId, ResolveDisputeRequest request, CancellationToken ct = default);
    Task SuspendTransactionForDisputeAsync(int adminId, int disputeId, SuspendTransactionRequest request, CancellationToken ct = default);
}
