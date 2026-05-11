using TrustEstate.Application.DTOs.Listings;
using TrustEstate.Application.Interfaces.Listings;
using TrustEstate.Domain.Entities;
using TrustEstate.Domain.Enums;
using TrustEstate.Domain.Exceptions;

namespace TrustEstate.Infrastructure.Services;

public sealed class FavoriteListingService : IFavoriteListingService
{
    private readonly IFavoriteListingRepository _repo;
    private readonly IListingRepository _listings;

    public FavoriteListingService(IFavoriteListingRepository repo, IListingRepository listings)
    {
        _repo = repo;
        _listings = listings;
    }

    public async Task<IEnumerable<ListingDto>> GetFavoritesAsync(int userId, CancellationToken ct = default)
    {
        var favorites = await _repo.GetByUserIdAsync(userId, ct);
        return favorites.Select(f => MapToDto(f.Listing));
    }

    public async Task SaveListingAsync(int userId, int listingId, CancellationToken ct = default)
    {
        var listing = await _listings.GetByIdWithPhotosAsync(listingId, ct)
            ?? throw new NotFoundException(nameof(Listing), listingId);

        if (listing.Status != ListingStatus.Active)
            throw new BusinessRuleException("Only active listings can be saved.");

        var existing = await _repo.GetAsync(userId, listingId, ct);
        if (existing != null)
            throw new ConflictException("You have already saved this listing.");

        await _repo.AddAsync(new FavoriteListing
        {
            UserId = userId,
            ListingId = listingId,
            SavedAt = DateTime.UtcNow,
        }, ct);

        await _repo.SaveChangesAsync(ct);
    }

    public async Task UnsaveListingAsync(int userId, int listingId, CancellationToken ct = default)
    {
        var favorite = await _repo.GetAsync(userId, listingId, ct)
            ?? throw new NotFoundException("Saved listing", listingId);

        _repo.Remove(favorite);
        await _repo.SaveChangesAsync(ct);
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
