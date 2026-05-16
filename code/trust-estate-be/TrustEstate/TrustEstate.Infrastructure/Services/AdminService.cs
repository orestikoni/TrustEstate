using Microsoft.EntityFrameworkCore;
using TrustEstate.Application.DTOs.Admin;
using TrustEstate.Application.Interfaces.Admin;
using TrustEstate.Application.Interfaces.Notifications;
using TrustEstate.Domain.Entities;
using TrustEstate.Domain.Enums;
using TrustEstate.Domain.Exceptions;
using TrustEstate.Infrastructure.Persistence;

namespace TrustEstate.Infrastructure.Services;

public sealed class AdminService : IAdminService
{
    private readonly TrustEstateDbContext _db;
    private readonly INotificationService _notifications;

    public AdminService(TrustEstateDbContext db, INotificationService notifications)
    {
        _db = db;
        _notifications = notifications;
    }

    // ── Analytics ─────────────────────────────────────────────────────────────

    public async Task<AnalyticsDashboardDto> GetAnalyticsDashboardAsync(CancellationToken ct = default)
    {
        var activeListings   = await _db.Listings.CountAsync(l => l.Status == ListingStatus.Active, ct);
        var flaggedListings  = await _db.Listings.CountAsync(l => l.Status == ListingStatus.Flagged, ct);
        var suspendedListings = await _db.Listings.CountAsync(l => l.Status == ListingStatus.Suspended, ct);
        var pendingVerifications = await _db.Users.CountAsync(u => u.AccountStatus == AccountStatus.Pending, ct);
        var ongoingTransactions = await _db.Transactions.CountAsync(
            t => t.Status == TransactionStatus.Active || t.Status == TransactionStatus.Disputed, ct);
        var openDisputes = await _db.Disputes.CountAsync(d => d.Status == DisputeStatus.Open, ct);

        var usersByRole = await _db.Users
            .GroupBy(u => u.Role)
            .Select(g => new { Role = g.Key.ToString(), Count = g.Count() })
            .ToListAsync(ct);

        var roleDict = usersByRole.ToDictionary(x => x.Role, x => x.Count);

        return new AnalyticsDashboardDto(
            activeListings,
            flaggedListings,
            suspendedListings,
            pendingVerifications,
            ongoingTransactions,
            openDisputes,
            roleDict
        );
    }

    // ── User Management ───────────────────────────────────────────────────────

    public async Task<IEnumerable<PendingUserDto>> GetPendingVerificationsAsync(CancellationToken ct = default)
    {
        var users = await _db.Users
            .Where(u => u.AccountStatus == AccountStatus.Pending
                     && (u.Role == UserRole.Agent || u.Role == UserRole.PropertyInspector))
            .OrderBy(u => u.CreatedAt)
            .ToListAsync(ct);

        return users.Select(u => new PendingUserDto(
            u.Id, u.FirstName, u.LastName, u.Email,
            u.Role.ToString(), u.PhoneNumber,
            u.AgencyType, u.AgencyName, u.ProfessionalQualifications,
            u.CreatedAt));
    }

    public async Task<IEnumerable<AdminUserDto>> GetAllUsersAsync(string? role, string? status, CancellationToken ct = default)
    {
        var query = _db.Users.AsQueryable();

        if (!string.IsNullOrWhiteSpace(role) && Enum.TryParse<UserRole>(role, true, out var parsedRole))
            query = query.Where(u => u.Role == parsedRole);

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<AccountStatus>(status, true, out var parsedStatus))
            query = query.Where(u => u.AccountStatus == parsedStatus);

        var users = await query.OrderBy(u => u.LastName).ThenBy(u => u.FirstName).ToListAsync(ct);

        return users.Select(u => new AdminUserDto(
            u.Id, u.FirstName, u.LastName, u.Email,
            u.Role.ToString(), u.AccountStatus.ToString(),
            u.PhoneNumber, u.AgencyType, u.AgencyName,
            u.CreatedAt, u.LastLoginAt));
    }

    public async Task ApproveUserAsync(int adminId, int userId, CancellationToken ct = default)
    {
        var user = await _db.Users.FindAsync(userId)
            ?? throw new NotFoundException(nameof(User), userId);

        if (user.AccountStatus != AccountStatus.Pending)
            throw new BusinessRuleException("Only accounts with Pending status can be approved.");

        if (user.Role != UserRole.Agent && user.Role != UserRole.PropertyInspector)
            throw new BusinessRuleException("Only Agent and Property Inspector accounts require approval.");

        user.AccountStatus = AccountStatus.Active;

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = adminId,
            ActionType = AuditLogAction.AccountVerification,
            EntityType = nameof(User),
            EntityId = userId,
            Description = $"Admin approved account for user '{user.Email}'.",
            PerformedAt = DateTime.UtcNow,
        });

        await _db.SaveChangesAsync(ct);

        await _notifications.CreateAsync(userId, NotificationType.AccountDecision,
            "Account Approved",
            "Your account has been approved. You now have full access to the platform.",
            nameof(User), userId, ct);
    }

    public async Task RejectUserAsync(int adminId, int userId, UserActionRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Reason))
            throw new BusinessRuleException("A documented reason is required when rejecting an account.");

        var user = await _db.Users.FindAsync(userId)
            ?? throw new NotFoundException(nameof(User), userId);

        if (user.AccountStatus != AccountStatus.Pending)
            throw new BusinessRuleException("Only accounts with Pending status can be rejected.");

        user.AccountStatus = AccountStatus.Rejected;

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = adminId,
            ActionType = AuditLogAction.AccountVerification,
            EntityType = nameof(User),
            EntityId = userId,
            Description = $"Admin rejected account for user '{user.Email}'. Reason: {request.Reason}",
            PerformedAt = DateTime.UtcNow,
        });

        await _db.SaveChangesAsync(ct);

        await _notifications.CreateAsync(userId, NotificationType.AccountDecision,
            "Account Rejected",
            $"Your account application has been rejected. Reason: {request.Reason}",
            nameof(User), userId, ct);
    }

    public async Task DeactivateUserAsync(int adminId, int userId, UserActionRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Reason))
            throw new BusinessRuleException("A documented reason is required when deactivating an account.");

        var user = await _db.Users.FindAsync(userId)
            ?? throw new NotFoundException(nameof(User), userId);

        if (user.Role == UserRole.Admin)
            throw new ForbiddenException("Admin accounts cannot be deactivated through this endpoint.");

        if (user.AccountStatus == AccountStatus.Deactivated)
            throw new BusinessRuleException("Account is already deactivated.");

        user.AccountStatus = AccountStatus.Deactivated;

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = adminId,
            ActionType = AuditLogAction.AccountStatusChange,
            EntityType = nameof(User),
            EntityId = userId,
            Description = $"Admin deactivated account for user '{user.Email}'. Reason: {request.Reason}",
            PerformedAt = DateTime.UtcNow,
        });

        await _db.SaveChangesAsync(ct);

        await _notifications.CreateAsync(userId, NotificationType.AccountDecision,
            "Account Deactivated",
            $"Your account has been deactivated. Reason: {request.Reason} Please contact support.",
            nameof(User), userId, ct);
    }

    public async Task SuspendUserAsync(int adminId, int userId, UserActionRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Reason))
            throw new BusinessRuleException("A documented reason is required when suspending an account.");

        var user = await _db.Users.FindAsync(userId)
            ?? throw new NotFoundException(nameof(User), userId);

        if (user.Role == UserRole.Admin)
            throw new ForbiddenException("Admin accounts cannot be suspended.");

        if (user.AccountStatus == AccountStatus.Suspended)
            throw new BusinessRuleException("Account is already suspended.");

        user.AccountStatus = AccountStatus.Suspended;

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = adminId,
            ActionType = AuditLogAction.AccountStatusChange,
            EntityType = nameof(User),
            EntityId = userId,
            Description = $"Admin suspended account for user '{user.Email}'. Reason: {request.Reason}",
            PerformedAt = DateTime.UtcNow,
        });

        await _db.SaveChangesAsync(ct);

        await _notifications.CreateAsync(userId, NotificationType.AccountDecision,
            "Account Suspended",
            $"Your account has been suspended. Reason: {request.Reason} Please contact support.",
            nameof(User), userId, ct);
    }

    public async Task ReactivateUserAsync(int adminId, int userId, CancellationToken ct = default)
    {
        var user = await _db.Users.FindAsync(userId)
            ?? throw new NotFoundException(nameof(User), userId);

        if (user.AccountStatus != AccountStatus.Suspended && user.AccountStatus != AccountStatus.Deactivated)
            throw new BusinessRuleException("Only suspended or deactivated accounts can be reactivated.");

        user.AccountStatus = AccountStatus.Active;

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = adminId,
            ActionType = AuditLogAction.AccountStatusChange,
            EntityType = nameof(User),
            EntityId = userId,
            Description = $"Admin reactivated account for user '{user.Email}'.",
            PerformedAt = DateTime.UtcNow,
        });

        await _db.SaveChangesAsync(ct);

        await _notifications.CreateAsync(userId, NotificationType.AccountDecision,
            "Account Reactivated",
            "Your account has been reactivated. You now have full access to the platform again.",
            nameof(User), userId, ct);
    }

    // ── Listing Management ────────────────────────────────────────────────────

    public async Task<IEnumerable<AdminListingDto>> GetAllListingsAsync(string? status, CancellationToken ct = default)
    {
        var query = _db.Listings
            .Include(l => l.Owner)
            .Include(l => l.Agent)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<ListingStatus>(status, true, out var parsedStatus))
            query = query.Where(l => l.Status == parsedStatus);

        var listings = await query.OrderByDescending(l => l.UpdatedAt).ToListAsync(ct);

        return listings.Select(MapListingToDto);
    }

    public async Task FlagListingAsync(int adminId, int listingId, ListingActionRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Reason))
            throw new BusinessRuleException("A documented reason is required when flagging a listing.");

        var listing = await _db.Listings
            .Include(l => l.Owner)
            .Include(l => l.Agent)
            .FirstOrDefaultAsync(l => l.ListingId == listingId, ct)
            ?? throw new NotFoundException(nameof(Listing), listingId);

        if (listing.Status == ListingStatus.Removed || listing.Status == ListingStatus.Archived)
            throw new BusinessRuleException("Cannot flag a listing that has been removed or archived.");

        listing.Status = ListingStatus.Flagged;
        listing.ModerationNotes = request.Reason;
        listing.UpdatedAt = DateTime.UtcNow;

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = adminId,
            ActionType = AuditLogAction.ListingAction,
            EntityType = nameof(Listing),
            EntityId = listingId,
            Description = $"Admin flagged listing '{listing.Title}'. Reason: {request.Reason}",
            PerformedAt = DateTime.UtcNow,
        });

        await _db.SaveChangesAsync(ct);

        await NotifyListingPartiesAsync(listing, NotificationType.ListingStatus,
            "Listing Flagged",
            $"Your listing '{listing.Title}' has been flagged by the platform. Reason: {request.Reason}", ct);
    }

    public async Task SuspendListingAsync(int adminId, int listingId, ListingActionRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Reason))
            throw new BusinessRuleException("A documented reason is required when suspending a listing.");

        var listing = await _db.Listings
            .Include(l => l.Owner)
            .Include(l => l.Agent)
            .FirstOrDefaultAsync(l => l.ListingId == listingId, ct)
            ?? throw new NotFoundException(nameof(Listing), listingId);

        if (listing.Status == ListingStatus.Removed || listing.Status == ListingStatus.Archived)
            throw new BusinessRuleException("Cannot suspend a listing that has been removed or archived.");

        if (listing.Status == ListingStatus.Suspended)
            throw new BusinessRuleException("Listing is already suspended.");

        listing.Status = ListingStatus.Suspended;
        listing.ModerationNotes = request.Reason;
        listing.UpdatedAt = DateTime.UtcNow;

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = adminId,
            ActionType = AuditLogAction.ListingAction,
            EntityType = nameof(Listing),
            EntityId = listingId,
            Description = $"Admin suspended listing '{listing.Title}'. Reason: {request.Reason}",
            PerformedAt = DateTime.UtcNow,
        });

        await _db.SaveChangesAsync(ct);

        await NotifyListingPartiesAsync(listing, NotificationType.ListingStatus,
            "Listing Suspended",
            $"Your listing '{listing.Title}' has been suspended by the platform. Reason: {request.Reason}", ct);
    }

    public async Task RemoveListingAsync(int adminId, int listingId, ListingActionRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Reason))
            throw new BusinessRuleException("A documented reason is required when removing a listing.");

        var listing = await _db.Listings
            .Include(l => l.Owner)
            .Include(l => l.Agent)
            .FirstOrDefaultAsync(l => l.ListingId == listingId, ct)
            ?? throw new NotFoundException(nameof(Listing), listingId);

        if (listing.Status == ListingStatus.Removed)
            throw new BusinessRuleException("Listing has already been removed.");

        listing.Status = ListingStatus.Removed;
        listing.ModerationNotes = request.Reason;
        listing.UpdatedAt = DateTime.UtcNow;

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = adminId,
            ActionType = AuditLogAction.ListingAction,
            EntityType = nameof(Listing),
            EntityId = listingId,
            Description = $"Admin removed listing '{listing.Title}'. Reason: {request.Reason}",
            PerformedAt = DateTime.UtcNow,
        });

        await _db.SaveChangesAsync(ct);

        await NotifyListingPartiesAsync(listing, NotificationType.ListingStatus,
            "Listing Removed",
            $"Your listing '{listing.Title}' has been removed from the platform. Reason: {request.Reason}", ct);
    }

    // ── Inspection Report Monitoring ──────────────────────────────────────────

    public async Task<IEnumerable<AdminInspectionReportDto>> GetAllInspectionReportsAsync(CancellationToken ct = default)
    {
        var reports = await _db.InspectionReports
            .Include(r => r.Inspection)
                .ThenInclude(i => i.Listing)
            .Include(r => r.Inspection)
                .ThenInclude(i => i.Inspector)
            .OrderByDescending(r => r.SubmittedAt)
            .ToListAsync(ct);

        return reports.Select(r => new AdminInspectionReportDto(
            r.ReportId,
            r.InspectionId,
            r.Inspection.ListingId,
            r.Inspection.Listing.Title,
            $"{r.Inspection.Inspector.FirstName} {r.Inspection.Inspector.LastName}",
            r.FinalVerdict?.ToString(),
            r.IsLocked,
            r.IsFlagged,
            r.FlagReason,
            r.SubmittedAt,
            r.FlaggedAt));
    }

    public async Task FlagInspectionReportAsync(int adminId, int reportId, InspectionReportActionRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Reason))
            throw new BusinessRuleException("A documented reason is required when flagging an inspection report.");

        var report = await _db.InspectionReports
            .Include(r => r.Inspection)
                .ThenInclude(i => i.Listing)
            .Include(r => r.Inspection)
                .ThenInclude(i => i.Inspector)
            .FirstOrDefaultAsync(r => r.ReportId == reportId, ct)
            ?? throw new NotFoundException(nameof(InspectionReport), reportId);

        if (report.IsFlagged)
            throw new BusinessRuleException("Report is already flagged.");

        report.IsFlagged = true;
        report.FlagReason = request.Reason;
        report.FlaggedAt = DateTime.UtcNow;

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = adminId,
            ActionType = AuditLogAction.InspectionUpdate,
            EntityType = nameof(InspectionReport),
            EntityId = reportId,
            Description = $"Admin flagged inspection report #{reportId} for listing '{report.Inspection.Listing.Title}'. Reason: {request.Reason}",
            PerformedAt = DateTime.UtcNow,
        });

        await _db.SaveChangesAsync(ct);

        await _notifications.CreateAsync(report.Inspection.InspectorId, NotificationType.InspectionUpdate,
            "Inspection Report Flagged",
            $"Your inspection report for '{report.Inspection.Listing.Title}' has been flagged. Reason: {request.Reason}",
            nameof(InspectionReport), reportId, ct);

        await _notifications.CreateAsync(report.Inspection.AgentId, NotificationType.InspectionUpdate,
            "Inspection Report Flagged",
            $"An inspection report for listing '{report.Inspection.Listing.Title}' has been flagged by the platform. Reason: {request.Reason}",
            nameof(InspectionReport), reportId, ct);
    }

    public async Task RemoveInspectionReportAsync(int adminId, int reportId, InspectionReportActionRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Reason))
            throw new BusinessRuleException("A documented reason is required when removing an inspection report.");

        var report = await _db.InspectionReports
            .Include(r => r.Inspection)
                .ThenInclude(i => i.Listing)
            .Include(r => r.Inspection)
                .ThenInclude(i => i.Inspector)
            .FirstOrDefaultAsync(r => r.ReportId == reportId, ct)
            ?? throw new NotFoundException(nameof(InspectionReport), reportId);

        report.IsFlagged = true;
        report.FlagReason = $"[REMOVED] {request.Reason}";
        report.FlaggedAt = DateTime.UtcNow;

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = adminId,
            ActionType = AuditLogAction.InspectionUpdate,
            EntityType = nameof(InspectionReport),
            EntityId = reportId,
            Description = $"Admin removed inspection report #{reportId} for listing '{report.Inspection.Listing.Title}'. Reason: {request.Reason}",
            PerformedAt = DateTime.UtcNow,
        });

        await _db.SaveChangesAsync(ct);

        await _notifications.CreateAsync(report.Inspection.InspectorId, NotificationType.InspectionUpdate,
            "Inspection Report Removed",
            $"Your inspection report for '{report.Inspection.Listing.Title}' has been removed by the platform. Reason: {request.Reason}",
            nameof(InspectionReport), reportId, ct);

        await _notifications.CreateAsync(report.Inspection.AgentId, NotificationType.InspectionUpdate,
            "Inspection Report Removed",
            $"An inspection report for listing '{report.Inspection.Listing.Title}' has been removed. Reason: {request.Reason}",
            nameof(InspectionReport), reportId, ct);
    }

    // ── Dispute Management ────────────────────────────────────────────────────

    public async Task<IEnumerable<AdminDisputeDto>> GetAllDisputesAsync(string? status, CancellationToken ct = default)
    {
        var query = _db.Disputes
            .Include(d => d.Transaction)
                .ThenInclude(t => t.Listing)
            .Include(d => d.SubmittedBy)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<DisputeStatus>(status, true, out var parsedStatus))
            query = query.Where(d => d.Status == parsedStatus);

        var disputes = await query.OrderByDescending(d => d.SubmittedAt).ToListAsync(ct);

        return disputes.Select(d => new AdminDisputeDto(
            d.DisputeId,
            d.TransactionId,
            d.Transaction.ListingId,
            d.Transaction.Listing.Title,
            $"{d.SubmittedBy.FirstName} {d.SubmittedBy.LastName}",
            d.Description,
            d.Status.ToString(),
            d.ResolutionOutcome,
            d.SubmittedAt,
            d.ResolvedAt));
    }

    public async Task ResolveDisputeAsync(int adminId, int disputeId, ResolveDisputeRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Outcome))
            throw new BusinessRuleException("A documented outcome is required when resolving a dispute.");

        var dispute = await _db.Disputes
            .Include(d => d.Transaction)
                .ThenInclude(t => t.Listing)
            .Include(d => d.SubmittedBy)
            .FirstOrDefaultAsync(d => d.DisputeId == disputeId, ct)
            ?? throw new NotFoundException(nameof(Dispute), disputeId);

        if (dispute.Status == DisputeStatus.Resolved)
            throw new BusinessRuleException("Dispute is already resolved.");

        dispute.Status = DisputeStatus.Resolved;
        dispute.ResolutionOutcome = request.Outcome;
        dispute.ResolvedAt = DateTime.UtcNow;

        if (dispute.Transaction.Status == TransactionStatus.Disputed
            || dispute.Transaction.Status == TransactionStatus.Suspended)
        {
            dispute.Transaction.Status = TransactionStatus.Active;
        }

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = adminId,
            ActionType = AuditLogAction.DisputeResolution,
            EntityType = nameof(Dispute),
            EntityId = disputeId,
            Description = $"Admin resolved dispute #{disputeId}. Outcome: {request.Outcome}",
            PerformedAt = DateTime.UtcNow,
        });

        await _db.SaveChangesAsync(ct);

        var transaction = dispute.Transaction;
        var partyIds = new[] { transaction.BuyerId, transaction.OwnerId, transaction.AgentId }.Distinct();

        foreach (var partyId in partyIds)
        {
            await _notifications.CreateAsync(partyId, NotificationType.DisputeUpdate,
                "Dispute Resolved",
                $"The dispute for listing '{transaction.Listing.Title}' has been resolved. Outcome: {request.Outcome}",
                nameof(Dispute), disputeId, ct);
        }
    }

    public async Task SuspendTransactionForDisputeAsync(int adminId, int disputeId, SuspendTransactionRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Reason))
            throw new BusinessRuleException("A documented reason is required when suspending a transaction.");

        var dispute = await _db.Disputes
            .Include(d => d.Transaction)
                .ThenInclude(t => t.Listing)
            .FirstOrDefaultAsync(d => d.DisputeId == disputeId, ct)
            ?? throw new NotFoundException(nameof(Dispute), disputeId);

        if (dispute.Status == DisputeStatus.Resolved)
            throw new BusinessRuleException("Cannot suspend a transaction for an already resolved dispute.");

        if (dispute.Transaction.Status == TransactionStatus.Suspended)
            throw new BusinessRuleException("Transaction is already suspended.");

        dispute.Transaction.Status = TransactionStatus.Suspended;
        dispute.Status = DisputeStatus.UnderReview;

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = adminId,
            ActionType = AuditLogAction.DisputeResolution,
            EntityType = nameof(Dispute),
            EntityId = disputeId,
            Description = $"Admin suspended transaction #{dispute.TransactionId} due to unresponsive party. Reason: {request.Reason}",
            PerformedAt = DateTime.UtcNow,
        });

        await _db.SaveChangesAsync(ct);

        var transaction = dispute.Transaction;
        var partyIds = new[] { transaction.BuyerId, transaction.OwnerId, transaction.AgentId }.Distinct();

        foreach (var partyId in partyIds)
        {
            await _notifications.CreateAsync(partyId, NotificationType.DisputeUpdate,
                "Transaction Suspended",
                $"The transaction for listing '{transaction.Listing.Title}' has been temporarily suspended pending dispute resolution. Reason: {request.Reason}",
                nameof(Dispute), disputeId, ct);
        }
    }

    // ── Private Helpers ───────────────────────────────────────────────────────

    private async Task NotifyListingPartiesAsync(
        Listing listing, NotificationType type, string title, string message, CancellationToken ct)
    {
        await _notifications.CreateAsync(listing.OwnerId, type, title, message,
            nameof(Listing), listing.ListingId, ct);

        if (listing.AgentId.HasValue)
        {
            await _notifications.CreateAsync(listing.AgentId.Value, type, title, message,
                nameof(Listing), listing.ListingId, ct);
        }
    }

    private static AdminListingDto MapListingToDto(Listing l) => new(
        l.ListingId,
        l.Title,
        l.Status.ToString(),
        $"{l.Owner.FirstName} {l.Owner.LastName}",
        l.Agent is null ? null : $"{l.Agent.FirstName} {l.Agent.LastName}",
        l.AskingPrice,
        l.City,
        l.Country,
        l.ModerationNotes,
        l.CreatedAt,
        l.UpdatedAt);
}
