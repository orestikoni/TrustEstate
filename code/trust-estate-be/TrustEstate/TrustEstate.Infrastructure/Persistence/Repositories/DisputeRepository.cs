using Microsoft.EntityFrameworkCore;
using TrustEstate.Application.Interfaces.Disputes;
using TrustEstate.Domain.Entities;
using TrustEstate.Domain.Enums;

namespace TrustEstate.Infrastructure.Persistence.Repositories;

public sealed class DisputeRepository : IDisputeRepository
{
    private readonly TrustEstateDbContext _db;

    public DisputeRepository(TrustEstateDbContext db) => _db = db;

    public Task<Dispute?> GetByIdAsync(int disputeId, CancellationToken ct = default)
        => _db.Disputes
            .Include(d => d.SubmittedBy)
            .Include(d => d.Transaction)
            .FirstOrDefaultAsync(d => d.DisputeId == disputeId, ct);

    public async Task<IEnumerable<Dispute>> GetByTransactionIdAsync(int transactionId, CancellationToken ct = default)
        => await _db.Disputes
            .Include(d => d.SubmittedBy)
            .Where(d => d.TransactionId == transactionId)
            .OrderByDescending(d => d.SubmittedAt)
            .ToListAsync(ct);

    public async Task<IEnumerable<Dispute>> GetByUserIdAsync(int userId, CancellationToken ct = default)
        => await _db.Disputes
            .Include(d => d.Transaction)
            .Where(d => d.SubmittedById == userId)
            .OrderByDescending(d => d.SubmittedAt)
            .ToListAsync(ct);

    public Task<bool> HasOpenDisputeForTransactionAsync(int transactionId, CancellationToken ct = default)
        => _db.Disputes.AnyAsync(d =>
            d.TransactionId == transactionId &&
            (d.Status == DisputeStatus.Open || d.Status == DisputeStatus.UnderReview), ct);

    public async Task AddAsync(Dispute dispute, CancellationToken ct = default)
        => await _db.Disputes.AddAsync(dispute, ct);

    public void Update(Dispute dispute)
        => _db.Disputes.Update(dispute);

    public Task SaveChangesAsync(CancellationToken ct = default)
        => _db.SaveChangesAsync(ct);
}
