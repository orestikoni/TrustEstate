using Microsoft.EntityFrameworkCore;
using TrustEstate.Application.DTOs.Admin;
using TrustEstate.Application.Interfaces.Admin;
using TrustEstate.Domain.Entities;
using TrustEstate.Domain.Enums;
using TrustEstate.Domain.Exceptions;
using TrustEstate.Infrastructure.Persistence;
using TrustEstate.Application.Interfaces.Notifications;

namespace TrustEstate.Infrastructure.Services;

public class AdminService : IAdminService
{
    private readonly TrustEstateDbContext _db;
    private readonly INotificationService _notifications;

    public AdminService(TrustEstateDbContext db, INotificationService notifications)
    {
        _db = db;
        _notifications = notifications;
    }

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

    public async Task SuspendUserAsync(int userId, string? reason, CancellationToken ct = default)
    {
        var user = await _db.Users.FindAsync(new object[] { userId }, ct)
            ?? throw new NotFoundException("User", userId);

        if (user.AccountStatus == AccountStatus.Suspended)
            throw new BusinessRuleException("User is already suspended.");

        user.AccountStatus = AccountStatus.Suspended;
        await _db.SaveChangesAsync(ct);

        await _notifications.CreateAsync(userId, NotificationType.AccountDecision,
            "Account Suspended",
            reason is { Length: > 0 } r ? $"Your account has been suspended. Reason: {r}" : "Your account has been suspended by an administrator.",
            null, null, ct);
    }

    public async Task<IEnumerable<AdminInspectionDto>> GetAllInspectionsAsync(CancellationToken ct = default)
    {
        return await _db.Inspections
            .Include(i => i.Listing)
            .Include(i => i.Inspector)
            .Include(i => i.Agent)
            .Include(i => i.Report)
            .OrderByDescending(i => i.ScheduledDate)
            .Select(i => new AdminInspectionDto
            {
                InspectionId = i.InspectionId,
                PropertyTitle = i.Listing.Title,
                InspectorName = $"{i.Inspector.FirstName} {i.Inspector.LastName}".Trim(),
                AgentName = $"{i.Agent.FirstName} {i.Agent.LastName}".Trim(),
                Status = i.Status.ToString(),
                ScheduledDate = i.ScheduledDate,
                CompletedAt = i.CompletedAt,
                FinalVerdict = i.Report != null ? i.Report.FinalVerdict.ToString() : null,
                HasReport = i.Report != null,
                ReportLocked = i.Report != null && i.Report.IsLocked,
            })
            .ToListAsync(ct);
    }

    public async Task<IEnumerable<AdminDisputeDto>> GetAllDisputesAsync(CancellationToken ct = default)
    {
        var disputes = await _db.Disputes
            .Include(d => d.SubmittedBy)
            .Include(d => d.Transaction).ThenInclude(t => t.Listing)
            .Include(d => d.Transaction).ThenInclude(t => t.Buyer)
            .Include(d => d.Transaction).ThenInclude(t => t.Owner)
            .Include(d => d.Transaction).ThenInclude(t => t.Agent)
            .Include(d => d.Transaction).ThenInclude(t => t.Offer)
                .ThenInclude(o => o.Inspection).ThenInclude(i => i.Report)
            .OrderByDescending(d => d.SubmittedAt)
            .ToListAsync(ct);

        return disputes.Select(d => new AdminDisputeDto
        {
            DisputeId = d.DisputeId,
            TransactionId = d.TransactionId,
            ListingId = d.Transaction.ListingId,
            PropertyTitle = d.Transaction.Listing.Title,
            ListingAddress = $"{d.Transaction.Listing.Address}, {d.Transaction.Listing.City}",
            AskingPrice = d.Transaction.Listing.AskingPrice,
            SubmittedByFullName = $"{d.SubmittedBy.FirstName} {d.SubmittedBy.LastName}".Trim(),
            BuyerName = $"{d.Transaction.Buyer.FirstName} {d.Transaction.Buyer.LastName}".Trim(),
            OwnerName = $"{d.Transaction.Owner.FirstName} {d.Transaction.Owner.LastName}".Trim(),
            AgentName = $"{d.Transaction.Agent.FirstName} {d.Transaction.Agent.LastName}".Trim(),
            AcceptedOfferPrice = d.Transaction.Offer.ProposedPrice,
            NegotiationRounds = d.Transaction.Offer.NegotiationRound,
            InspectionVerdict = d.Transaction.Offer.Inspection?.Report?.FinalVerdict?.ToString(),
            Description = d.Description,
            Status = d.Status.ToString(),
            ResolutionOutcome = d.ResolutionOutcome,
            SubmittedAt = d.SubmittedAt,
            ResolvedAt = d.ResolvedAt,
        });
    }

    public async Task ResolveDisputeAsync(int disputeId, string resolutionOutcome, CancellationToken ct = default)
    {
        var dispute = await _db.Disputes
            .Include(d => d.Transaction)
            .Include(d => d.SubmittedBy)
            .FirstOrDefaultAsync(d => d.DisputeId == disputeId, ct)
            ?? throw new NotFoundException(nameof(Dispute), disputeId);

        if (dispute.Status == DisputeStatus.Resolved)
            throw new BusinessRuleException("Dispute is already resolved.");

        dispute.Status = DisputeStatus.Resolved;
        dispute.ResolutionOutcome = resolutionOutcome;
        dispute.ResolvedAt = DateTime.UtcNow;

        var transaction = dispute.Transaction;
        if (transaction.Status == TransactionStatus.Disputed)
            transaction.Status = TransactionStatus.Active;

        await _db.SaveChangesAsync(ct);

        var listing = await _db.Listings.FindAsync(new object[] { transaction.ListingId }, ct);
        var title = listing?.Title ?? $"Listing #{transaction.ListingId}";

        var participantIds = new[] { transaction.BuyerId, transaction.OwnerId, transaction.AgentId }
            .Distinct();

        foreach (var recipientId in participantIds)
        {
            await _notifications.CreateAsync(recipientId, NotificationType.DisputeUpdate,
                "Dispute Resolved",
                $"The dispute for '{title}' has been resolved. Outcome: {resolutionOutcome}",
                "Dispute", dispute.DisputeId, ct);
        }
    }
}
