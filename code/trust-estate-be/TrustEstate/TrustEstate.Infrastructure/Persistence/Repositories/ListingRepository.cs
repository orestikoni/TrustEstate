using Microsoft.EntityFrameworkCore;
using TrustEstate.Application.Interfaces.Listings;
using TrustEstate.Domain.Entities;
using TrustEstate.Domain.Enums;

namespace TrustEstate.Infrastructure.Persistence.Repositories;

public sealed class ListingRepository : IListingRepository
{
    private readonly TrustEstateDbContext _db;

    public ListingRepository(TrustEstateDbContext db) => _db = db;

    public Task<Listing?> GetByIdAsync(int listingId, CancellationToken ct = default)
        => _db.Listings
            .Include(l => l.Owner)
            .Include(l => l.Agent)
            .FirstOrDefaultAsync(l => l.ListingId == listingId, ct);

    public async Task<IEnumerable<Listing>> GetAllActiveAsync(CancellationToken ct = default)
        => await _db.Listings
            .Include(l => l.Owner)
            .Include(l => l.Agent)
            .Where(l => l.Status == ListingStatus.Active)
            .ToListAsync(ct);

    public async Task<IEnumerable<Listing>> GetByOwnerIdAsync(int ownerId, CancellationToken ct = default)
        => await _db.Listings
            .Include(l => l.Agent)
            .Where(l => l.OwnerId == ownerId)
            .ToListAsync(ct);

    public async Task<IEnumerable<Listing>> GetByAgentIdAsync(int agentId, CancellationToken ct = default)
        => await _db.Listings
            .Include(l => l.Owner)
            .Where(l => l.AgentId == agentId)
            .ToListAsync(ct);

    public async Task AddAsync(Listing listing, CancellationToken ct = default)
        => await _db.Listings.AddAsync(listing, ct);

    public void Update(Listing listing)
        => _db.Listings.Update(listing);

    public void Delete(Listing listing)
        => _db.Listings.Remove(listing);

    public Task SaveChangesAsync(CancellationToken ct = default)
        => _db.SaveChangesAsync(ct);
}