using TrustEstate.Domain.Entities;

namespace TrustEstate.Application.Interfaces.Transactions;

public interface ITransactionRepository
{
    Task<Transaction?> GetByListingIdAsync(int listingId, CancellationToken ct = default);
    Task<Transaction?> GetByIdAsync(int transactionId, CancellationToken ct = default);
    Task AddAsync(Transaction transaction, CancellationToken ct = default);
    void Update(Transaction transaction);
    Task SaveChangesAsync(CancellationToken ct = default);
}
