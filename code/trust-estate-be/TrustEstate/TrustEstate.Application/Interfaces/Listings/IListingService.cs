using TrustEstate.Application.DTOs.Listings;

namespace TrustEstate.Application.Interfaces.Listings;

public interface IListingService
{
    Task<ListingDto> CreateListingAsync(int ownerId, CreateListingRequest request, CancellationToken ct = default);
    Task<ListingDto> UpdateListingAsync(int ownerId, int listingId, UpdateListingRequest request, CancellationToken ct = default);
    Task DeleteListingAsync(int ownerId, int listingId, CancellationToken ct = default);
    Task<IEnumerable<ListingDto>> GetOwnerListingsAsync(int ownerId, CancellationToken ct = default);
    Task<ListingAssignmentDto> RespondToAssignmentAsync(int agentId, int listingId, RespondToAssignmentRequest request, CancellationToken ct = default);
    Task<ListingDto> ApproveListingAsync(int agentId, int listingId, CancellationToken ct = default);
    Task<ListingDto> RequestCorrectionsAsync(int agentId, int listingId, RequestCorrectionsRequest request, CancellationToken ct = default);
    Task<ListingDto> AgentUpdateListingAsync(int agentId, int listingId, AgentUpdateListingRequest request, CancellationToken ct = default);
    Task<IEnumerable<ListingDto>> GetAgentListingsAsync(int agentId, CancellationToken ct = default);
    Task<IEnumerable<AvailableAgentDto>> GetAvailableAgentsAsync(CancellationToken ct = default);
    Task<PagedResult<ListingDto>> GetActiveListingsAsync(ListingFilterRequest filter, CancellationToken ct = default);
    Task<ListingDto> GetListingByIdAsync(int listingId, CancellationToken ct = default);
}

public sealed record AvailableAgentDto
{
    public int UserId { get; init; }
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string? AgencyName { get; init; }
    public string AgencyType { get; init; } = string.Empty;
}