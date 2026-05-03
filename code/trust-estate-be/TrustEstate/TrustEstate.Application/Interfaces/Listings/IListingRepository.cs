using TrustEstate.Domain.Entities;
using TrustEstate.Domain.Enums;

namespace TrustEstate.Application.Interfaces.Listings;

public interface IListingRepository
{
    Task<Listing?> GetByIdAsync(int listingId, CancellationToken ct = default);
    Task<(IEnumerable<Listing> Items, int TotalCount)> GetAllActivePagedAsync(int page, int pageSize, CancellationToken ct = default);
    Task<IEnumerable<Listing>> GetByOwnerIdAsync(int ownerId, CancellationToken ct = default);
    Task<IEnumerable<Listing>> GetByAgentIdAsync(int agentId, CancellationToken ct = default);
    Task AddAsync(Listing listing, CancellationToken ct = default);
    void Update(Listing listing);
    void Delete(Listing listing);
    Task SaveChangesAsync(CancellationToken ct = default);
}