using Microsoft.EntityFrameworkCore;
using TrustEstate.Application.Interfaces.Transactions;
using TrustEstate.Domain.Entities;

namespace TrustEstate.Infrastructure.Persistence.Repositories;

public sealed class TransactionRepository : ITransactionRepository
{
    private readonly TrustEstateDbContext _db;

    public TransactionRepository(TrustEstateDbContext db) => _db = db;

    public Task<Transaction?> GetByListingIdAsync(int listingId, CancellationToken ct = default)
        => _db.Transactions
            .Include(t => t.Offer)
            .Include(t => t.Disputes)
            .FirstOrDefaultAsync(t => t.ListingId == listingId, ct);

    public Task<Transaction?> GetByIdAsync(int transactionId, CancellationToken ct = default)
        => _db.Transactions
            .Include(t => t.Offer)
            .Include(t => t.Disputes)
            .FirstOrDefaultAsync(t => t.TransactionId == transactionId, ct);

    public async Task AddAsync(Transaction transaction, CancellationToken ct = default)
        => await _db.Transactions.AddAsync(transaction, ct);

    public void Update(Transaction transaction)
        => _db.Transactions.Update(transaction);

    public Task SaveChangesAsync(CancellationToken ct = default)
        => _db.SaveChangesAsync(ct);
}
