using Microsoft.EntityFrameworkCore;
using TrustEstate.Application.Interfaces.Listings;
using TrustEstate.Domain.Entities;

namespace TrustEstate.Infrastructure.Persistence.Repositories;

public sealed class FavoriteListingRepository : IFavoriteListingRepository
{
    private readonly TrustEstateDbContext _db;

    public FavoriteListingRepository(TrustEstateDbContext db) => _db = db;

    public async Task<IEnumerable<FavoriteListing>> GetByUserIdAsync(int userId, CancellationToken ct = default)
        => await _db.FavoriteListings
            .Include(f => f.Listing)
                .ThenInclude(l => l.Photos)
            .Where(f => f.UserId == userId)
            .OrderByDescending(f => f.SavedAt)
            .ToListAsync(ct);

    public Task<FavoriteListing?> GetAsync(int userId, int listingId, CancellationToken ct = default)
        => _db.FavoriteListings.FirstOrDefaultAsync(
            f => f.UserId == userId && f.ListingId == listingId, ct);

    public async Task AddAsync(FavoriteListing favorite, CancellationToken ct = default)
        => await _db.FavoriteListings.AddAsync(favorite, ct);

    public void Remove(FavoriteListing favorite)
        => _db.FavoriteListings.Remove(favorite);

    public Task SaveChangesAsync(CancellationToken ct = default)
        => _db.SaveChangesAsync(ct);
}
