using TrustEstate.Domain.Entities;

namespace TrustEstate.Application.Interfaces.Disputes;

public interface IDisputeRepository
{
    Task<Dispute?> GetByIdAsync(int disputeId, CancellationToken ct = default);
    Task<IEnumerable<Dispute>> GetByTransactionIdAsync(int transactionId, CancellationToken ct = default);
    Task<IEnumerable<Dispute>> GetByUserIdAsync(int userId, CancellationToken ct = default);
    Task<bool> HasOpenDisputeForTransactionAsync(int transactionId, CancellationToken ct = default);
    Task AddAsync(Dispute dispute, CancellationToken ct = default);
    void Update(Dispute dispute);
    Task SaveChangesAsync(CancellationToken ct = default);
}
