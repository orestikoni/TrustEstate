using TrustEstate.Application.DTOs.Listings;

namespace TrustEstate.Application.Interfaces.Listings;

public interface IListingService
{
    /// <summary>Property Owner creates a new listing — starts as PendingAgentReview</summary>
    Task<ListingDto> CreateListingAsync(int ownerId, CreateListingRequest request, CancellationToken ct = default);

    /// <summary>Anyone can browse all active listings — paginated</summary>
    Task<PagedResult<ListingDto>> GetActiveListingsAsync(int page = 1, int pageSize = 20, CancellationToken ct = default);

    /// <summary>Get a single listing by id</summary>
    Task<ListingDto> GetListingByIdAsync(int listingId, CancellationToken ct = default);

    /// <summary>Property Owner views all their own listings</summary>
    Task<IEnumerable<ListingDto>> GetOwnerListingsAsync(int ownerId, CancellationToken ct = default);

    /// <summary>Agent views all listings assigned to them</summary>
    Task<IEnumerable<ListingDto>> GetAgentListingsAsync(int agentId, CancellationToken ct = default);

    /// <summary>Property Owner edits a listing — only allowed in PendingAgentReview status</summary>
    Task<ListingDto> UpdateListingAsync(int ownerId, int listingId, UpdateListingRequest request, CancellationToken ct = default);

    /// <summary>Property Owner removes a listing — only if no active transaction</summary>
    Task DeleteListingAsync(int ownerId, int listingId, CancellationToken ct = default);

    /// <summary>Agent approves listing — sets status to Active</summary>
    Task<ListingDto> ApproveListingAsync(int agentId, int listingId, CancellationToken ct = default);

    /// <summary>Agent requests corrections — returns listing to PendingAgentReview</summary>
    Task<ListingDto> RequestCorrectionsAsync(int agentId, int listingId, RequestCorrectionsRequest request, CancellationToken ct = default);
}