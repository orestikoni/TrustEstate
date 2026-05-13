using TrustEstate.Application.DTOs.Listings;

namespace TrustEstate.Application.Interfaces.Listings;

public interface IFavoriteListingService
{
    Task<IEnumerable<ListingDto>> GetFavoritesAsync(int userId, CancellationToken ct = default);
    Task SaveListingAsync(int userId, int listingId, CancellationToken ct = default);
    Task UnsaveListingAsync(int userId, int listingId, CancellationToken ct = default);
}
