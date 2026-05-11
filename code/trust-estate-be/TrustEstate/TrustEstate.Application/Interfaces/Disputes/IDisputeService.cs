using TrustEstate.Application.DTOs.Disputes;

namespace TrustEstate.Application.Interfaces.Disputes;

public interface IDisputeService
{
    Task<DisputeFormDto> GetDisputeFormAsync(int userId, int listingId, CancellationToken ct = default);
    Task<DisputeDto> SubmitDisputeAsync(int userId, SubmitDisputeRequest request, CancellationToken ct = default);
    Task<IEnumerable<DisputeDto>> GetUserDisputesAsync(int userId, CancellationToken ct = default);
    Task<DisputeDto> GetDisputeByIdAsync(int userId, int disputeId, CancellationToken ct = default);
}
