using TrustEstate.Application.DTOs.Listings;
using TrustEstate.Application.Interfaces.Listings;
using TrustEstate.Domain.Entities;
using TrustEstate.Domain.Enums;
using TrustEstate.Domain.Exceptions;

namespace TrustEstate.Infrastructure.Services;

public sealed class ListingService : IListingService
{
    private readonly IListingRepository _repo;

    public ListingService(IListingRepository repo) => _repo = repo;

    // ── Property Owner: Create listing ───────────────────────────────────────

    public async Task<ListingDto> CreateListingAsync(int ownerId, CreateListingRequest request, CancellationToken ct = default)
    {
        if (!Enum.TryParse<ListingType>(request.ListingType, true, out var listingType))
            throw new BusinessRuleException("Invalid listing type. Must be 'Sale' or 'Rent'.");

        if (!Enum.TryParse<PropertyType>(request.PropertyType, true, out var propertyType))
            throw new BusinessRuleException("Invalid property type. Must be 'Apartment', 'House', 'Commercial', 'Land', or 'Other'.");

        ValidateListingFields(request.Title, request.Description, request.Address, request.City, request.Country);

        var listing = new Listing
        {
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            Address = request.Address.Trim(),
            City = request.City.Trim(),
            Country = request.Country.Trim(),
            AskingPrice = request.AskingPrice,
            ListingType = listingType,
            PropertyType = propertyType,
            Status = ListingStatus.PendingAgentReview,
            OwnerId = ownerId,
            AgentId = null,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        await _repo.AddAsync(listing, ct);
        await _repo.SaveChangesAsync(ct);

        await AddPhotosToListing(listing.ListingId, request.PhotoUrls, ct);

        var assignment = new ListingAssignment
        {
            ListingId = listing.ListingId,
            AgentId = request.AgentId,
            AssignmentStatus = AssignmentStatus.Pending,
            RequestedAt = DateTime.UtcNow,
        };
        await _repo.AddAssignmentAsync(assignment, ct);
        await _repo.SaveChangesAsync(ct);

        return await GetListingDtoAsync(listing.ListingId, ct);
    }

    // ── Property Owner: Edit listing ─────────────────────────────────────────

    public async Task<ListingDto> UpdateListingAsync(int ownerId, int listingId, UpdateListingRequest request, CancellationToken ct = default)
    {
        var listing = await _repo.GetByIdWithPhotosAsync(listingId, ct)
            ?? throw new NotFoundException(nameof(Listing), listingId);

        if (listing.OwnerId != ownerId)
            throw new ForbiddenException("You do not have permission to edit this listing.");

        if (listing.Status != ListingStatus.PendingAgentReview && listing.Status != ListingStatus.CorrectionsRequested)
            throw new BusinessRuleException(
                "Active listings cannot be edited directly. Contact your assigned Agent to request changes.");

        if (!Enum.TryParse<ListingType>(request.ListingType, true, out var listingType))
            throw new BusinessRuleException("Invalid listing type. Must be 'Sale' or 'Rent'.");

        if (!Enum.TryParse<PropertyType>(request.PropertyType, true, out var propertyType))
            throw new BusinessRuleException("Invalid property type.");

        ValidateListingFields(request.Title, request.Description, request.Address, request.City, request.Country);

        listing.Title = request.Title.Trim();
        listing.Description = request.Description.Trim();
        listing.Address = request.Address.Trim();
        listing.City = request.City.Trim();
        listing.Country = request.Country.Trim();
        listing.AskingPrice = request.AskingPrice;
        listing.ListingType = listingType;
        listing.PropertyType = propertyType;
        listing.Status = ListingStatus.PendingAgentReview;
        listing.CorrectionNotes = null;
        listing.UpdatedAt = DateTime.UtcNow;

        foreach (var photo in listing.Photos.ToList())
            _repo.DeletePhoto(photo);

        _repo.Update(listing);
        await _repo.SaveChangesAsync(ct);

        await AddPhotosToListing(listingId, request.PhotoUrls, ct);

        return await GetListingDtoAsync(listingId, ct);
    }

    // ── Property Owner: Remove listing ───────────────────────────────────────

    public async Task DeleteListingAsync(int ownerId, int listingId, CancellationToken ct = default)
    {
        var listing = await _repo.GetByIdAsync(listingId, ct)
            ?? throw new NotFoundException(nameof(Listing), listingId);

        if (listing.OwnerId != ownerId)
            throw new ForbiddenException("You do not have permission to remove this listing.");

        if (listing.Status == ListingStatus.UnderOffer)
            throw new BusinessRuleException("Cannot remove a listing that has an active transaction in progress.");

        listing.Status = ListingStatus.Removed;
        listing.UpdatedAt = DateTime.UtcNow;

        _repo.Update(listing);
        await _repo.SaveChangesAsync(ct);
    }

    // ── Property Owner: View own listings ────────────────────────────────────

    public async Task<IEnumerable<ListingDto>> GetOwnerListingsAsync(int ownerId, CancellationToken ct = default)
    {
        var listings = await _repo.GetByOwnerIdAsync(ownerId, ct);
        return listings.Select(MapToDto);
    }

    // ── Agent: Respond to assignment ─────────────────────────────────────────

    public async Task<ListingAssignmentDto> RespondToAssignmentAsync(int agentId, int listingId, RespondToAssignmentRequest request, CancellationToken ct = default)
    {
        var assignment = await _repo.GetPendingAssignmentAsync(listingId, agentId, ct)
            ?? throw new NotFoundException("Assignment", $"listing {listingId} for agent {agentId}");

        var listing = await _repo.GetByIdAsync(listingId, ct)
            ?? throw new NotFoundException(nameof(Listing), listingId);

        assignment.RespondedAt = DateTime.UtcNow;

        if (request.Accept)
        {
            assignment.AssignmentStatus = AssignmentStatus.Accepted;
            listing.AgentId = agentId;
            listing.Status = ListingStatus.PendingAgentReview;
            listing.UpdatedAt = DateTime.UtcNow;
            _repo.Update(listing);
        }
        else
        {
            assignment.AssignmentStatus = AssignmentStatus.Declined;
        }

        await _repo.SaveChangesAsync(ct);

        return new ListingAssignmentDto
        {
            AssignmentId = assignment.AssignmentId,
            ListingId = assignment.ListingId,
            AgentId = assignment.AgentId,
            AssignmentStatus = assignment.AssignmentStatus.ToString(),
            RequestedAt = assignment.RequestedAt,
            RespondedAt = assignment.RespondedAt,
        };
    }

    // ── Agent: Approve listing ───────────────────────────────────────────────

    public async Task<ListingDto> ApproveListingAsync(int agentId, int listingId, CancellationToken ct = default)
    {
        var listing = await _repo.GetByIdWithPhotosAsync(listingId, ct)
            ?? throw new NotFoundException(nameof(Listing), listingId);

        if (listing.AgentId != agentId)
            throw new ForbiddenException("You are not assigned to this listing.");

        if (listing.Status != ListingStatus.PendingAgentReview)
            throw new BusinessRuleException("Only listings in Pending Agent Review status can be approved.");

        listing.Status = ListingStatus.Active;
        listing.CorrectionNotes = null;
        listing.PublishedAt = DateTime.UtcNow;
        listing.UpdatedAt = DateTime.UtcNow;

        _repo.Update(listing);
        await _repo.SaveChangesAsync(ct);

        return MapToDto(listing);
    }

    // ── Agent: Request corrections ───────────────────────────────────────────

    public async Task<ListingDto> RequestCorrectionsAsync(int agentId, int listingId, RequestCorrectionsRequest request, CancellationToken ct = default)
    {
        var listing = await _repo.GetByIdWithPhotosAsync(listingId, ct)
            ?? throw new NotFoundException(nameof(Listing), listingId);

        if (listing.AgentId != agentId)
            throw new ForbiddenException("You are not assigned to this listing.");

        if (listing.Status != ListingStatus.PendingAgentReview)
            throw new BusinessRuleException("Corrections can only be requested on listings in Pending Agent Review status.");

        var notes = request.CorrectionNotes.Trim();
        if (string.IsNullOrEmpty(notes))
            throw new BusinessRuleException("Correction notes cannot be empty.");

        listing.Status = ListingStatus.CorrectionsRequested;
        listing.CorrectionNotes = notes;
        listing.UpdatedAt = DateTime.UtcNow;

        _repo.Update(listing);
        await _repo.SaveChangesAsync(ct);

        return MapToDto(listing);
    }

    // ── Agent: Edit active listing on Owner's request (US_43) ────────────────

    public async Task<ListingDto> AgentUpdateListingAsync(int agentId, int listingId, AgentUpdateListingRequest request, CancellationToken ct = default)
    {
        var listing = await _repo.GetByIdWithPhotosAsync(listingId, ct)
            ?? throw new NotFoundException(nameof(Listing), listingId);

        if (listing.AgentId != agentId)
            throw new ForbiddenException("You are not assigned to this listing.");

        if (listing.Status != ListingStatus.Active)
            throw new BusinessRuleException("This endpoint is only for editing Active listings.");

        if (!Enum.TryParse<ListingType>(request.ListingType, true, out var listingType))
            throw new BusinessRuleException("Invalid listing type. Must be 'Sale' or 'Rent'.");

        if (!Enum.TryParse<PropertyType>(request.PropertyType, true, out var propertyType))
            throw new BusinessRuleException("Invalid property type.");

        ValidateListingFields(request.Title, request.Description, request.Address, request.City, request.Country);

        listing.Title = request.Title.Trim();
        listing.Description = request.Description.Trim();
        listing.Address = request.Address.Trim();
        listing.City = request.City.Trim();
        listing.Country = request.Country.Trim();
        listing.AskingPrice = request.AskingPrice;
        listing.ListingType = listingType;
        listing.PropertyType = propertyType;
        listing.UpdatedAt = DateTime.UtcNow;

        foreach (var photo in listing.Photos.ToList())
            _repo.DeletePhoto(photo);

        _repo.Update(listing);
        await _repo.SaveChangesAsync(ct);

        await AddPhotosToListing(listingId, request.PhotoUrls, ct);

        return await GetListingDtoAsync(listingId, ct);
    }

    // ── Agent: View assigned listings ────────────────────────────────────────

    public async Task<IEnumerable<ListingDto>> GetAgentListingsAsync(int agentId, CancellationToken ct = default)
    {
        var listings = await _repo.GetByAgentIdAsync(agentId, ct);
        return listings.Select(MapToDto);
    }

    // ── Public: Available agents ─────────────────────────────────────────────

    public async Task<IEnumerable<AvailableAgentDto>> GetAvailableAgentsAsync(CancellationToken ct = default)
    {
        var agents = await _repo.GetVerifiedAgentsAsync(ct);
        return agents.Select(u => new AvailableAgentDto
        {
            UserId = u.Id,
            FirstName = u.FirstName,
            LastName = u.LastName,
            AgencyName = u.AgentProfile?.AgencyName,
            AgencyType = u.AgentProfile?.AgencyType.ToString() ?? string.Empty,
        });
    }

    // ── Public: Browse with filters ──────────────────────────────────────────

    public async Task<PagedResult<ListingDto>> GetActiveListingsAsync(ListingFilterRequest filter, CancellationToken ct = default)
    {
        var page = Math.Max(1, filter.Page);
        var pageSize = Math.Clamp(filter.PageSize, 1, 100);

        PropertyType? propertyType = null;
        if (!string.IsNullOrWhiteSpace(filter.PropertyType))
        {
            if (!Enum.TryParse<PropertyType>(filter.PropertyType, true, out var pt))
                throw new BusinessRuleException("Invalid property type filter.");
            propertyType = pt;
        }

        ListingType? listingType = null;
        if (!string.IsNullOrWhiteSpace(filter.ListingType))
        {
            if (!Enum.TryParse<ListingType>(filter.ListingType, true, out var lt))
                throw new BusinessRuleException("Invalid listing type filter.");
            listingType = lt;
        }

        var (listings, totalCount) = await _repo.GetActivePagedAsync(
            filter.City, filter.Country,
            filter.MinPrice, filter.MaxPrice,
            propertyType, listingType,
            page, pageSize, ct);

        return new PagedResult<ListingDto>
        {
            Items = listings.Select(MapToDto),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
        };
    }

    // ── Public: Get single listing ───────────────────────────────────────────

    public async Task<ListingDto> GetListingByIdAsync(int listingId, CancellationToken ct = default)
    {
        var listing = await _repo.GetByIdWithPhotosAsync(listingId, ct)
            ?? throw new NotFoundException(nameof(Listing), listingId);
        return MapToDto(listing);
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private async Task AddPhotosToListing(int listingId, List<string> photoUrls, CancellationToken ct)
    {
        for (var i = 0; i < photoUrls.Count; i++)
        {
            var url = photoUrls[i].Trim();
            if (string.IsNullOrEmpty(url)) continue;
            await _repo.AddPhotoAsync(new ListingPhoto
            {
                ListingId = listingId,
                PhotoUrl = url,
                DisplayOrder = i,
                UploadedAt = DateTime.UtcNow,
            }, ct);
        }
        await _repo.SaveChangesAsync(ct);
    }

    private async Task<ListingDto> GetListingDtoAsync(int listingId, CancellationToken ct)
    {
        var listing = await _repo.GetByIdWithPhotosAsync(listingId, ct)
            ?? throw new NotFoundException(nameof(Listing), listingId);
        return MapToDto(listing);
    }

    private static void ValidateListingFields(string title, string description, string address, string city, string country)
    {
        if (string.IsNullOrWhiteSpace(title)) throw new BusinessRuleException("Title cannot be empty.");
        if (string.IsNullOrWhiteSpace(description)) throw new BusinessRuleException("Description cannot be empty.");
        if (string.IsNullOrWhiteSpace(address)) throw new BusinessRuleException("Address cannot be empty.");
        if (string.IsNullOrWhiteSpace(city)) throw new BusinessRuleException("City cannot be empty.");
        if (string.IsNullOrWhiteSpace(country)) throw new BusinessRuleException("Country cannot be empty.");
    }

    private static ListingDto MapToDto(Listing l) => new()
    {
        ListingId = l.ListingId,
        Title = l.Title,
        Description = l.Description,
        Address = l.Address,
        City = l.City,
        Country = l.Country,
        AskingPrice = l.AskingPrice,
        ListingType = l.ListingType.ToString(),
        PropertyType = l.PropertyType.ToString(),
        Status = l.Status.ToString(),
        OwnerId = l.OwnerId,
        AgentId = l.AgentId,
        CorrectionNotes = l.CorrectionNotes,
        ModerationNotes = l.ModerationNotes,
        Photos = l.Photos.OrderBy(p => p.DisplayOrder).Select(p => new ListingPhotoDto
        {
            PhotoId = p.PhotoId,
            PhotoUrl = p.PhotoUrl,
            DisplayOrder = p.DisplayOrder,
        }).ToList(),
        CreatedAt = l.CreatedAt,
        UpdatedAt = l.UpdatedAt,
        PublishedAt = l.PublishedAt,
        ArchivedAt = l.ArchivedAt,
    };
}