using TrustEstate.Domain.Entities;

namespace TrustEstate.Application.Interfaces.Listings;

public interface IFavoriteListingRepository
{
    Task<IEnumerable<FavoriteListing>> GetByUserIdAsync(int userId, CancellationToken ct = default);
    Task<FavoriteListing?> GetAsync(int userId, int listingId, CancellationToken ct = default);
    Task AddAsync(FavoriteListing favorite, CancellationToken ct = default);
    void Remove(FavoriteListing favorite);
    Task SaveChangesAsync(CancellationToken ct = default);
}
