using TrustEstate.Application.DTOs.Admin;

namespace TrustEstate.Application.Interfaces.Admin;

public interface IAdminService
{
    Task<IEnumerable<PendingVerificationDto>> GetPendingVerificationsAsync(CancellationToken ct = default);
    Task ApproveVerificationAsync(int userId, CancellationToken ct = default);
    Task RejectVerificationAsync(int userId, string? notes, CancellationToken ct = default);

    Task<IEnumerable<AdminListingDto>> GetAllListingsAsync(string? status, CancellationToken ct = default);
    Task SuspendListingAsync(int listingId, string? reason, CancellationToken ct = default);
    Task RemoveListingAsync(int listingId, string? reason, CancellationToken ct = default);

    Task<IEnumerable<AdminUserDto>> GetAllUsersAsync(CancellationToken ct = default);
}
