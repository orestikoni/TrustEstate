using TrustEstate.Domain.Entities;
using TrustEstate.Domain.Enums;

namespace TrustEstate.Application.Interfaces.Listings;

public interface IListingRepository
{
    Task<Listing?> GetByIdAsync(int listingId, CancellationToken ct = default);
    Task<Listing?> GetByIdWithPhotosAsync(int listingId, CancellationToken ct = default);
    Task<(IEnumerable<Listing> Items, int TotalCount)> GetActivePagedAsync(
        string? city, string? country, decimal? minPrice, decimal? maxPrice,
        PropertyType? propertyType, ListingType? listingType,
        int page, int pageSize, CancellationToken ct = default);
    Task<IEnumerable<Listing>> GetByOwnerIdAsync(int ownerId, CancellationToken ct = default);
    Task<IEnumerable<Listing>> GetByAgentIdAsync(int agentId, CancellationToken ct = default);
    Task AddAsync(Listing listing, CancellationToken ct = default);
    void Update(Listing listing);
    void Delete(Listing listing);
    Task AddPhotoAsync(ListingPhoto photo, CancellationToken ct = default);
    void DeletePhoto(ListingPhoto photo);
    Task<ListingPhoto?> GetPhotoAsync(int photoId, CancellationToken ct = default);
    Task AddAssignmentAsync(ListingAssignment assignment, CancellationToken ct = default);
    Task<ListingAssignment?> GetPendingAssignmentAsync(int listingId, int agentId, CancellationToken ct = default);
    Task<IEnumerable<User>> GetVerifiedAgentsAsync(CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}