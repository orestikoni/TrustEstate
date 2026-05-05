using Microsoft.EntityFrameworkCore;
using TrustEstate.Application.Interfaces.Listings;
using TrustEstate.Domain.Entities;
using TrustEstate.Domain.Enums;

namespace TrustEstate.Infrastructure.Persistence.Repositories;

public sealed class ListingRepository : IListingRepository
{
    private readonly TrustEstateDbContext _db;

    public ListingRepository(TrustEstateDbContext db) => _db = db;

    // ── Listings ──────────────────────────────────────────────────────────────

    public Task<Listing?> GetByIdAsync(int listingId, CancellationToken ct = default)
        => _db.Listings
            .Include(l => l.Owner)
            .Include(l => l.Agent)
            .FirstOrDefaultAsync(l => l.ListingId == listingId, ct);

    public Task<Listing?> GetByIdWithPhotosAsync(int listingId, CancellationToken ct = default)
        => _db.Listings
            .Include(l => l.Owner)
            .Include(l => l.Agent)
            .Include(l => l.Photos.OrderBy(p => p.DisplayOrder))
            .FirstOrDefaultAsync(l => l.ListingId == listingId, ct);

    public async Task<(IEnumerable<Listing> Items, int TotalCount)> GetActivePagedAsync(
        string? city, string? country, decimal? minPrice, decimal? maxPrice,
        PropertyType? propertyType, ListingType? listingType,
        int page, int pageSize, CancellationToken ct = default)
    {
        var query = _db.Listings
            .Include(l => l.Photos.OrderBy(p => p.DisplayOrder))
            .Where(l => l.Status == ListingStatus.Active);

        if (!string.IsNullOrWhiteSpace(city))
            query = query.Where(l => l.City.ToLower().Contains(city.ToLower()));

        if (!string.IsNullOrWhiteSpace(country))
            query = query.Where(l => l.Country.ToLower().Contains(country.ToLower()));

        if (minPrice.HasValue)
            query = query.Where(l => l.AskingPrice >= minPrice.Value);

        if (maxPrice.HasValue)
            query = query.Where(l => l.AskingPrice <= maxPrice.Value);

        if (propertyType.HasValue)
            query = query.Where(l => l.PropertyType == propertyType.Value);

        if (listingType.HasValue)
            query = query.Where(l => l.ListingType == listingType.Value);

        var totalCount = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(l => l.PublishedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return (items, totalCount);
    }

    public async Task<IEnumerable<Listing>> GetByOwnerIdAsync(int ownerId, CancellationToken ct = default)
        => await _db.Listings
            .Include(l => l.Agent)
            .Include(l => l.Photos.OrderBy(p => p.DisplayOrder))
            .Where(l => l.OwnerId == ownerId)
            .OrderByDescending(l => l.CreatedAt)
            .ToListAsync(ct);

    public async Task<IEnumerable<Listing>> GetByAgentIdAsync(int agentId, CancellationToken ct = default)
        => await _db.Listings
            .Include(l => l.Owner)
            .Include(l => l.Photos.OrderBy(p => p.DisplayOrder))
            .Where(l => l.AgentId == agentId)
            .OrderByDescending(l => l.CreatedAt)
            .ToListAsync(ct);

    public async Task AddAsync(Listing listing, CancellationToken ct = default)
        => await _db.Listings.AddAsync(listing, ct);

    public void Update(Listing listing)
        => _db.Listings.Update(listing);

    public void Delete(Listing listing)
        => _db.Listings.Remove(listing);

    // ── Photos ────────────────────────────────────────────────────────────────

    public async Task AddPhotoAsync(ListingPhoto photo, CancellationToken ct = default)
        => await _db.ListingPhotos.AddAsync(photo, ct);

    public void DeletePhoto(ListingPhoto photo)
        => _db.ListingPhotos.Remove(photo);

    public Task<ListingPhoto?> GetPhotoAsync(int photoId, CancellationToken ct = default)
        => _db.ListingPhotos.FirstOrDefaultAsync(p => p.PhotoId == photoId, ct);

    // ── Assignments ───────────────────────────────────────────────────────────

    public async Task AddAssignmentAsync(ListingAssignment assignment, CancellationToken ct = default)
        => await _db.ListingAssignments.AddAsync(assignment, ct);

    public Task<ListingAssignment?> GetPendingAssignmentAsync(int listingId, int agentId, CancellationToken ct = default)
        => _db.ListingAssignments
            .FirstOrDefaultAsync(a =>
                a.ListingId == listingId &&
                a.AgentId == agentId &&
                a.AssignmentStatus == AssignmentStatus.Pending, ct);

    // ── Agents ────────────────────────────────────────────────────────────────

    public async Task<IEnumerable<User>> GetVerifiedAgentsAsync(CancellationToken ct = default)
        => await _db.Users
            .Include(u => u.AgentProfile)
            .Where(u => u.Role == UserRole.Agent
                        && u.AccountStatus == AccountStatus.Active
                        && u.AgentProfile != null
                        && u.AgentProfile.IsVerified)
            .ToListAsync(ct);

    // ── Shared ────────────────────────────────────────────────────────────────

    public Task SaveChangesAsync(CancellationToken ct = default)
        => _db.SaveChangesAsync(ct);
}