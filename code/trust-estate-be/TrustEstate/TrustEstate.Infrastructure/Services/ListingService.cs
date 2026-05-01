using TrustEstate.Application.DTOs.Listings;
using TrustEstate.Application.Interfaces.Listings;
using TrustEstate.Domain.Entities;
using TrustEstate.Domain.Enums;
using TrustEstate.Domain.Exceptions;

namespace TrustEstate.Infrastructure.Services;

public sealed class ListingService : IListingService
{
    private readonly IListingRepository _listings;

    public ListingService(IListingRepository listings)
    {
        _listings = listings;
    }

    // Property Owner creates a new listing
    public async Task<ListingDto> CreateListingAsync(int ownerId, CreateListingRequest request, CancellationToken ct = default)
    {
        if (!Enum.TryParse<ListingType>(request.ListingType, out var listingType))
            throw new BusinessRuleException("Invalid listing type. Must be 'Sale' or 'Rent'.");

        var listing = new Listing
        {
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            Location = request.Location.Trim(),
            AskingPrice = request.AskingPrice,
            ListingType = listingType,
            Status = ListingStatus.PendingAgentReview,
            OwnerId = ownerId,
            AgentId = request.AgentId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        await _listings.AddAsync(listing, ct);
        await _listings.SaveChangesAsync(ct);

        return MapToDto(listing);
    }

    // Anyone can browse active listings
    public async Task<IEnumerable<ListingDto>> GetActiveListingsAsync(CancellationToken ct = default)
    {
        var listings = await _listings.GetAllActiveAsync(ct);
        return listings.Select(MapToDto);
    }

    // Get single listing by id
    public async Task<ListingDto> GetListingByIdAsync(int listingId, CancellationToken ct = default)
    {
        var listing = await _listings.GetByIdAsync(listingId, ct)
            ?? throw new NotFoundException(nameof(Listing), listingId);
        return MapToDto(listing);
    }

    // Property Owner views their own listings
    public async Task<IEnumerable<ListingDto>> GetOwnerListingsAsync(int ownerId, CancellationToken ct = default)
    {
        var listings = await _listings.GetByOwnerIdAsync(ownerId, ct);
        return listings.Select(MapToDto);
    }

    // Agent views listings assigned to them
    public async Task<IEnumerable<ListingDto>> GetAgentListingsAsync(int agentId, CancellationToken ct = default)
    {
        var listings = await _listings.GetByAgentIdAsync(agentId, ct);
        return listings.Select(MapToDto);
    }

    // Property Owner edits a listing
    public async Task<ListingDto> UpdateListingAsync(int ownerId, int listingId, UpdateListingRequest request, CancellationToken ct = default)
    {
        var listing = await _listings.GetByIdAsync(listingId, ct)
            ?? throw new NotFoundException(nameof(Listing), listingId);

        if (listing.OwnerId != ownerId)
            throw new ForbiddenException("You do not have permission to edit this listing.");

        if (listing.Status != ListingStatus.PendingAgentReview)
            throw new BusinessRuleException("Listing can only be edited while in Pending Agent Review status.");

        if (!Enum.TryParse<ListingType>(request.ListingType, out var listingType))
            throw new BusinessRuleException("Invalid listing type. Must be 'Sale' or 'Rent'.");

        listing.Title = request.Title.Trim();
        listing.Description = request.Description.Trim();
        listing.Location = request.Location.Trim();
        listing.AskingPrice = request.AskingPrice;
        listing.ListingType = listingType;
        listing.UpdatedAt = DateTime.UtcNow;

        _listings.Update(listing);
        await _listings.SaveChangesAsync(ct);

        return MapToDto(listing);
    }

    // Property Owner deletes a listing
    public async Task DeleteListingAsync(int ownerId, int listingId, CancellationToken ct = default)
    {
        var listing = await _listings.GetByIdAsync(listingId, ct)
            ?? throw new NotFoundException(nameof(Listing), listingId);

        if (listing.OwnerId != ownerId)
            throw new ForbiddenException("You do not have permission to remove this listing.");

        if (listing.Status == ListingStatus.UnderOffer)
            throw new BusinessRuleException("Cannot remove a listing that has an active transaction in progress.");

        _listings.Delete(listing);
        await _listings.SaveChangesAsync(ct);
    }

    // Agent approves listing
    public async Task<ListingDto> ApproveListingAsync(int agentId, int listingId, CancellationToken ct = default)
    {
        var listing = await _listings.GetByIdAsync(listingId, ct)
            ?? throw new NotFoundException(nameof(Listing), listingId);

        if (listing.AgentId != agentId)
            throw new ForbiddenException("You are not assigned to this listing.");

        if (listing.Status != ListingStatus.PendingAgentReview)
            throw new BusinessRuleException("Only listings in Pending Agent Review can be approved.");

        listing.Status = ListingStatus.Active;
        listing.CorrectionNotes = null;
        listing.UpdatedAt = DateTime.UtcNow;

        _listings.Update(listing);
        await _listings.SaveChangesAsync(ct);

        return MapToDto(listing);
    }

    // Agent requests corrections
    public async Task<ListingDto> RequestCorrectionsAsync(int agentId, int listingId, RequestCorrectionsRequest request, CancellationToken ct = default)
    {
        var listing = await _listings.GetByIdAsync(listingId, ct)
            ?? throw new NotFoundException(nameof(Listing), listingId);

        if (listing.AgentId != agentId)
            throw new ForbiddenException("You are not assigned to this listing.");

        if (listing.Status != ListingStatus.PendingAgentReview)
            throw new BusinessRuleException("Corrections can only be requested on listings in Pending Agent Review.");

        listing.CorrectionNotes = request.CorrectionNotes.Trim();
        listing.UpdatedAt = DateTime.UtcNow;

        _listings.Update(listing);
        await _listings.SaveChangesAsync(ct);

        return MapToDto(listing);
    }

    // Map entity to DTO
    private static ListingDto MapToDto(Listing listing) => new()
    {
        ListingId = listing.ListingId,
        Title = listing.Title,
        Description = listing.Description,
        Location = listing.Location,
        AskingPrice = listing.AskingPrice,
        ListingType = listing.ListingType.ToString(),
        Status = listing.Status.ToString(),
        OwnerId = listing.OwnerId,
        AgentId = listing.AgentId,
        CorrectionNotes = listing.CorrectionNotes,
        ModerationNotes = listing.ModerationNotes,
        CreatedAt = listing.CreatedAt,
        UpdatedAt = listing.UpdatedAt,
    };
}