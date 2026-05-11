using Microsoft.EntityFrameworkCore;
using TrustEstate.Application.DTOs.Disputes;
using TrustEstate.Application.Interfaces.Disputes;
using TrustEstate.Application.Interfaces.Notifications;
using TrustEstate.Domain.Entities;
using TrustEstate.Domain.Enums;
using TrustEstate.Domain.Exceptions;
using TrustEstate.Infrastructure.Persistence;

namespace TrustEstate.Infrastructure.Services;

public sealed class DisputeService : IDisputeService
{
    private readonly IDisputeRepository _repo;
    private readonly INotificationService _notifications;
    private readonly TrustEstateDbContext _db;

    public DisputeService(IDisputeRepository repo, INotificationService notifications, TrustEstateDbContext db)
    {
        _repo = repo;
        _notifications = notifications;
        _db = db;
    }

    public async Task<DisputeFormDto> GetDisputeFormAsync(int userId, int listingId, CancellationToken ct = default)
    {
        var listing = await _db.Listings.FindAsync(listingId)
            ?? throw new NotFoundException(nameof(Listing), listingId);

        var transaction = await _db.Transactions
            .FirstOrDefaultAsync(t => t.ListingId == listingId, ct)
            ?? throw new NotFoundException("Transaction for listing", listingId);

        var isParticipant = transaction.BuyerId == userId
            || transaction.OwnerId == userId
            || transaction.AgentId == userId;

        if (!isParticipant)
            throw new ForbiddenException("You are not a participant in this transaction.");

        if (transaction.Status == TransactionStatus.Closed)
            throw new BusinessRuleException("Cannot submit a dispute for a closed transaction.");

        return new DisputeFormDto
        {
            ListingId = listingId,
            ListingTitle = listing.Title,
            TransactionId = transaction.TransactionId,
            TransactionStatus = transaction.Status.ToString(),
        };
    }

    public async Task<DisputeDto> SubmitDisputeAsync(int userId, SubmitDisputeRequest request, CancellationToken ct = default)
    {
        var listing = await _db.Listings.FindAsync(request.ListingId)
            ?? throw new NotFoundException(nameof(Listing), request.ListingId);

        var transaction = await _db.Transactions
            .FirstOrDefaultAsync(t => t.ListingId == request.ListingId, ct)
            ?? throw new NotFoundException("Transaction for listing", request.ListingId);

        var isParticipant = transaction.BuyerId == userId
            || transaction.OwnerId == userId
            || transaction.AgentId == userId;

        if (!isParticipant)
            throw new ForbiddenException("You are not a participant in this transaction.");

        if (transaction.Status == TransactionStatus.Closed)
            throw new BusinessRuleException("Cannot submit a dispute for a closed transaction.");

        var dispute = new Dispute
        {
            TransactionId = transaction.TransactionId,
            SubmittedById = userId,
            Description = request.Description,
            Status = DisputeStatus.Open,
            SubmittedAt = DateTime.UtcNow,
        };

        await _repo.AddAsync(dispute, ct);

        transaction.Status = TransactionStatus.Disputed;
        await _repo.SaveChangesAsync(ct);

        var submitter = await _db.Users.FindAsync(userId);
        var submitterName = submitter is null ? "A participant" : $"{submitter.FirstName} {submitter.LastName}";

        var recipientIds = new[] { transaction.BuyerId, transaction.OwnerId, transaction.AgentId }
            .Where(id => id != userId)
            .Distinct();

        foreach (var recipientId in recipientIds)
        {
            await _notifications.CreateAsync(recipientId, NotificationType.DisputeUpdate,
                "Dispute Submitted", $"{submitterName} has submitted a dispute for listing '{listing.Title}'.",
                "Dispute", dispute.DisputeId, ct);
        }

        return await MapToDtoAsync(dispute.DisputeId, ct);
    }

    public async Task<IEnumerable<DisputeDto>> GetUserDisputesAsync(int userId, CancellationToken ct = default)
    {
        var disputes = await _repo.GetByUserIdAsync(userId, ct);
        var dtos = new List<DisputeDto>();
        foreach (var d in disputes)
            dtos.Add(MapToDto(d));
        return dtos;
    }

    public async Task<DisputeDto> GetDisputeByIdAsync(int userId, int disputeId, CancellationToken ct = default)
    {
        var dispute = await _db.Disputes
            .Include(d => d.Transaction)
            .Include(d => d.SubmittedBy)
            .FirstOrDefaultAsync(d => d.DisputeId == disputeId, ct)
            ?? throw new NotFoundException(nameof(Dispute), disputeId);

        var transaction = dispute.Transaction;
        var isParticipant = transaction.BuyerId == userId
            || transaction.OwnerId == userId
            || transaction.AgentId == userId;

        if (!isParticipant)
            throw new ForbiddenException("You are not a participant in this dispute's transaction.");

        return MapToDto(dispute);
    }

    private async Task<DisputeDto> MapToDtoAsync(int disputeId, CancellationToken ct)
    {
        var dispute = await _db.Disputes
            .Include(d => d.SubmittedBy)
            .FirstOrDefaultAsync(d => d.DisputeId == disputeId, ct)
            ?? throw new NotFoundException(nameof(Dispute), disputeId);

        return MapToDto(dispute);
    }

    private static DisputeDto MapToDto(Dispute d) => new()
    {
        DisputeId = d.DisputeId,
        TransactionId = d.TransactionId,
        SubmittedById = d.SubmittedById,
        SubmittedByFullName = $"{d.SubmittedBy.FirstName} {d.SubmittedBy.LastName}",
        Description = d.Description,
        Status = d.Status.ToString(),
        ResolutionOutcome = d.ResolutionOutcome,
        SubmittedAt = d.SubmittedAt,
        ResolvedAt = d.ResolvedAt,
    };
}
