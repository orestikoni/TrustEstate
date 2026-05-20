using Microsoft.EntityFrameworkCore;
using TrustEstate.Application.DTOs.Admin;
using TrustEstate.Application.Interfaces.Admin;
using TrustEstate.Domain.Entities;
using TrustEstate.Domain.Enums;
using TrustEstate.Domain.Exceptions;
using TrustEstate.Infrastructure.Persistence;

namespace TrustEstate.Infrastructure.Services;

public class AdminService : IAdminService
{
    private readonly TrustEstateDbContext _db;

    public AdminService(TrustEstateDbContext db) => _db = db;

    public async Task<IEnumerable<PendingVerificationDto>> GetPendingVerificationsAsync(CancellationToken ct = default)
    {
        var pending = await _db.Users
            .Where(u =>
                u.AccountStatus == AccountStatus.Pending &&
                (u.Role == UserRole.Agent || u.Role == UserRole.PropertyInspector))
            .OrderBy(u => u.CreatedAt)
            .Select(u => new PendingVerificationDto
            {
                UserId = u.Id,
                FirstName = u.FirstName,
                LastName = u.LastName,
                Email = u.Email,
                Role = u.Role.ToString(),
                AgencyType = u.AgencyType,
                AgencyName = u.AgencyName,
                ProfessionalQualifications = u.ProfessionalQualifications,
                RegisteredAt = u.CreatedAt,
            })
            .ToListAsync(ct);

        return pending;
    }

    public async Task ApproveVerificationAsync(int userId, CancellationToken ct = default)
    {
        var user = await _db.Users
            .Include(u => u.AgentProfile)
            .Include(u => u.InspectorProfile)
            .FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new NotFoundException("User", userId);

        if (user.AccountStatus != AccountStatus.Pending)
            throw new InvalidOperationException("User is not pending verification.");

        user.AccountStatus = AccountStatus.Active;

        if (user.Role == UserRole.Agent && user.AgentProfile != null)
        {
            user.AgentProfile.IsVerified = true;
            user.AgentProfile.VerifiedAt = DateTime.UtcNow;
        }
        else if (user.Role == UserRole.PropertyInspector && user.InspectorProfile != null)
        {
            user.InspectorProfile.IsVerified = true;
            user.InspectorProfile.VerifiedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync(ct);
    }

    public async Task RejectVerificationAsync(int userId, string? notes, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new NotFoundException("User", userId);

        if (user.AccountStatus != AccountStatus.Pending)
            throw new InvalidOperationException("User is not pending verification.");

        user.AccountStatus = AccountStatus.Rejected;
        await _db.SaveChangesAsync(ct);
    }

    public async Task<IEnumerable<AdminListingDto>> GetAllListingsAsync(string? status, CancellationToken ct = default)
    {
        var query = _db.Listings
            .Include(l => l.Owner)
            .Include(l => l.Agent)
            .Include(l => l.Photos.OrderBy(p => p.DisplayOrder))
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<ListingStatus>(status, true, out var parsedStatus))
            query = query.Where(l => l.Status == parsedStatus);
        else
            query = query.Where(l => l.Status != ListingStatus.Removed);

        return await query
            .OrderByDescending(l => l.CreatedAt)
            .Select(l => new AdminListingDto
            {
                ListingId = l.ListingId,
                Title = l.Title,
                Address = l.Address,
                City = l.City,
                Country = l.Country,
                AskingPrice = l.AskingPrice,
                ListingType = l.ListingType.ToString(),
                PropertyType = l.PropertyType.ToString(),
                Status = l.Status.ToString(),
                OwnerId = l.OwnerId,
                OwnerName = l.Owner != null ? $"{l.Owner.FirstName} {l.Owner.LastName}".Trim() : null,
                AgentId = l.AgentId,
                AgentName = l.Agent != null ? $"{l.Agent.FirstName} {l.Agent.LastName}".Trim() : null,
                PhotoUrl = l.Photos.OrderBy(p => p.DisplayOrder).Select(p => p.PhotoUrl).FirstOrDefault(),
                ModerationNotes = l.ModerationNotes,
                CreatedAt = l.CreatedAt,
                UpdatedAt = l.UpdatedAt,
            })
            .ToListAsync(ct);
    }

    public async Task SuspendListingAsync(int listingId, string? reason, CancellationToken ct = default)
    {
        var listing = await _db.Listings.FindAsync(new object[] { listingId }, ct)
            ?? throw new NotFoundException(nameof(Listing), listingId);

        listing.Status = ListingStatus.Suspended;
        listing.ModerationNotes = reason;
        listing.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }

    public async Task RemoveListingAsync(int listingId, string? reason, CancellationToken ct = default)
    {
        var listing = await _db.Listings.FindAsync(new object[] { listingId }, ct)
            ?? throw new NotFoundException(nameof(Listing), listingId);

        listing.Status = ListingStatus.Removed;
        listing.ModerationNotes = reason;
        listing.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }

    public async Task<IEnumerable<AdminUserDto>> GetAllUsersAsync(CancellationToken ct = default)
    {
        return await _db.Users
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new AdminUserDto
            {
                UserId = u.Id,
                FirstName = u.FirstName,
                LastName = u.LastName,
                Email = u.Email,
                Role = u.Role.ToString(),
                AccountStatus = u.AccountStatus.ToString(),
                CreatedAt = u.CreatedAt,
            })
            .ToListAsync(ct);
    }
}
