using Microsoft.EntityFrameworkCore;
using TrustEstate.Application.DTOs.Transactions;
using TrustEstate.Application.Interfaces.Notifications;
using TrustEstate.Application.Interfaces.Transactions;
using TrustEstate.Domain.Entities;
using TrustEstate.Domain.Enums;
using TrustEstate.Domain.Exceptions;
using TrustEstate.Infrastructure.Persistence;

namespace TrustEstate.Infrastructure.Services;

public sealed class TransactionService : ITransactionService
{
    private readonly ITransactionRepository _repo;
    private readonly INotificationService _notifications;
    private readonly TrustEstateDbContext _db;

    public TransactionService(ITransactionRepository repo, INotificationService notifications, TrustEstateDbContext db)
    {
        _repo = repo;
        _notifications = notifications;
        _db = db;
    }

    public async Task<TransactionStatusDto> GetTransactionStatusAsync(int agentId, int listingId, CancellationToken ct = default)
    {
        var listing = await _db.Listings.FindAsync(listingId)
            ?? throw new NotFoundException(nameof(Listing), listingId);

        if (listing.AgentId != agentId)
            throw new ForbiddenException("You are not the assigned agent for this listing.");

        var transaction = await _repo.GetByListingIdAsync(listingId, ct)
            ?? throw new NotFoundException("Transaction for listing", listingId);

        var offerAccepted = await _db.Offers
            .AnyAsync(o => o.OfferId == transaction.OfferId && o.Status == OfferStatus.Accepted, ct);

        var inspection = await _db.Inspections
            .Include(i => i.Report)
            .FirstOrDefaultAsync(i => i.ListingId == listingId, ct);

        var inspectionCompleted = inspection?.Status == InspectionStatus.Completed;
        var verdictSubmitted = inspection?.Report?.IsLocked == true;

        var hasOpenDisputes = await _db.Disputes
            .AnyAsync(d => d.TransactionId == transaction.TransactionId &&
                           (d.Status == DisputeStatus.Open || d.Status == DisputeStatus.UnderReview || d.Status == DisputeStatus.Escalated), ct);

        var canClose = offerAccepted && inspectionCompleted && verdictSubmitted && !hasOpenDisputes
                       && transaction.Status == TransactionStatus.Active;

        return new TransactionStatusDto
        {
            TransactionId = transaction.TransactionId,
            Status = transaction.Status.ToString(),
            OfferAccepted = offerAccepted,
            InspectionCompleted = inspectionCompleted,
            VerdictSubmitted = verdictSubmitted,
            HasOpenDisputes = hasOpenDisputes,
            CanClose = canClose,
        };
    }

    public async Task<TransactionDto> CloseTransactionAsync(int agentId, int listingId, CancellationToken ct = default)
    {
        var listing = await _db.Listings.FindAsync(listingId)
            ?? throw new NotFoundException(nameof(Listing), listingId);

        if (listing.AgentId != agentId)
            throw new ForbiddenException("You are not the assigned agent for this listing.");

        var transaction = await _repo.GetByListingIdAsync(listingId, ct)
            ?? throw new NotFoundException("Transaction for listing", listingId);

        if (transaction.Status == TransactionStatus.Closed)
            throw new BusinessRuleException("Transaction is already closed.");

        if (transaction.Status == TransactionStatus.Suspended)
            throw new BusinessRuleException("Transaction is suspended and cannot be closed.");

        var offerAccepted = await _db.Offers
            .AnyAsync(o => o.OfferId == transaction.OfferId && o.Status == OfferStatus.Accepted, ct);
        if (!offerAccepted)
            throw new BusinessRuleException("Cannot close transaction: the offer has not been accepted.");

        var inspection = await _db.Inspections
            .Include(i => i.Report)
            .FirstOrDefaultAsync(i => i.ListingId == listingId, ct);

        if (inspection?.Status != InspectionStatus.Completed)
            throw new BusinessRuleException("Cannot close transaction: inspection has not been completed.");

        if (inspection.Report?.IsLocked != true)
            throw new BusinessRuleException("Cannot close transaction: inspection verdict has not been submitted.");

        var hasOpenDisputes = await _db.Disputes
            .AnyAsync(d => d.TransactionId == transaction.TransactionId &&
                           (d.Status == DisputeStatus.Open || d.Status == DisputeStatus.UnderReview || d.Status == DisputeStatus.Escalated), ct);
        if (hasOpenDisputes)
            throw new BusinessRuleException("Cannot close transaction: there are unresolved disputes.");

        transaction.Status = TransactionStatus.Closed;
        transaction.ClosedAt = DateTime.UtcNow;
        _repo.Update(transaction);

        listing.Status = ListingStatus.Archived;
        await _repo.SaveChangesAsync(ct);

        await _notifications.CreateAsync(transaction.BuyerId, NotificationType.TransactionClosed,
            "Transaction Closed", "The transaction for your property purchase has been closed.",
            "Transaction", transaction.TransactionId, ct);

        await _notifications.CreateAsync(transaction.OwnerId, NotificationType.TransactionClosed,
            "Transaction Closed", "The transaction for your property listing has been closed.",
            "Transaction", transaction.TransactionId, ct);

        await _notifications.CreateAsync(transaction.AgentId, NotificationType.TransactionClosed,
            "Transaction Closed", "The transaction you managed has been successfully closed.",
            "Transaction", transaction.TransactionId, ct);

        return MapToDto(transaction);
    }

    public async Task<TransactionDto?> GetTransactionByListingAsync(int listingId, CancellationToken ct = default)
    {
        var transaction = await _repo.GetByListingIdAsync(listingId, ct);
        return transaction is null ? null : MapToDto(transaction);
    }

    private static TransactionDto MapToDto(Transaction t) => new()
    {
        TransactionId = t.TransactionId,
        ListingId = t.ListingId,
        OfferId = t.OfferId,
        AgentId = t.AgentId,
        OwnerId = t.OwnerId,
        BuyerId = t.BuyerId,
        Status = t.Status.ToString(),
        ClosedAt = t.ClosedAt,
        CreatedAt = t.CreatedAt,
    };
}
