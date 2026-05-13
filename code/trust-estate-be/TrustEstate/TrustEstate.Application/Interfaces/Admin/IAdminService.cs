using TrustEstate.Application.DTOs.Admin;

namespace TrustEstate.Application.Interfaces.Admin;

public interface IAdminService
{
    Task<IEnumerable<PendingVerificationDto>> GetPendingVerificationsAsync(CancellationToken ct = default);
    Task ApproveVerificationAsync(int userId, CancellationToken ct = default);
    Task RejectVerificationAsync(int userId, string? notes, CancellationToken ct = default);
}
