using Microsoft.EntityFrameworkCore;
using TrustEstate.Application.DTOs.Offers;
using TrustEstate.Application.Interfaces.Notifications;
using TrustEstate.Application.Interfaces.Offers;
using TrustEstate.Application.Interfaces.Transactions;
using TrustEstate.Domain.Entities;
using TrustEstate.Domain.Enums;
using TrustEstate.Domain.Exceptions;
using TrustEstate.Infrastructure.Persistence;

namespace TrustEstate.Infrastructure.Services;

public sealed class OfferService : IOfferService
{
    private readonly IOfferRepository _offerRepo;
    private readonly ITransactionRepository _txRepo;
    private readonly INotificationService _notifications;
    private readonly TrustEstateDbContext _db;

    public OfferService(
        IOfferRepository offerRepo,
        ITransactionRepository txRepo,
        INotificationService notifications,
        TrustEstateDbContext db)
    {
        _offerRepo = offerRepo;
        _txRepo = txRepo;
        _notifications = notifications;
        _db = db;
    }

    // ── Buyer: Submit offer ───────────────────────────────────────────────────

    public async Task<OfferDto> SubmitOfferAsync(int buyerId, SubmitOfferRequest request, CancellationToken ct = default)
    {
        var listing = await _db.Listings.FirstOrDefaultAsync(l => l.ListingId == request.ListingId, ct)
            ?? throw new NotFoundException(nameof(Listing), request.ListingId);

        if (listing.Status != ListingStatus.Active)
            throw new ConflictException("Listing is not active. Offers can only be submitted on active listings.");

        if (await _offerRepo.HasActiveOfferAsync(request.ListingId, buyerId, ct))
            throw new ConflictException("You already have an active offer on this listing.");

        if (request.ProposedPrice <= 0)
            throw new BusinessRuleException("Proposed price must be greater than zero.");

        var offer = new Offer
        {
            ListingId = request.ListingId,
            BuyerId = buyerId,
            ProposedPrice = request.ProposedPrice,
            Message = request.Message,
            Status = OfferStatus.Pending,
            NegotiationRound = 0,
            SubmittedAt = DateTime.UtcNow,
        };

        await _offerRepo.AddAsync(offer, ct);
        await _offerRepo.SaveChangesAsync(ct);

        if (listing.AgentId.HasValue)
            await _notifications.CreateAsync(listing.AgentId.Value, NotificationType.OfferResponse,
                "New Offer Received", $"A new offer of {request.ProposedPrice:C} has been submitted on listing '{listing.Title}'.",
                "Offer", offer.OfferId, ct);

        await _notifications.CreateAsync(listing.OwnerId, NotificationType.OfferResponse,
            "New Offer on Your Listing", $"A buyer submitted an offer of {request.ProposedPrice:C} on '{listing.Title}'.",
            "Offer", offer.OfferId, ct);

        return await GetOfferDtoAsync(offer.OfferId, ct);
    }

    // ── Agent: Accept offer ───────────────────────────────────────────────────

    public async Task<OfferDto> AcceptOfferAsync(int agentId, int offerId, CancellationToken ct = default)
    {
        var offer = await _offerRepo.GetByIdWithDetailsAsync(offerId, ct)
            ?? throw new NotFoundException(nameof(Offer), offerId);

        if (offer.Listing.AgentId != agentId)
            throw new ForbiddenException("You are not the assigned agent for this listing.");

        if (offer.Status != OfferStatus.Pending && offer.Status != OfferStatus.Countered)
            throw new BusinessRuleException("Only pending or countered offers can be accepted.");

        offer.Status = OfferStatus.Accepted;
        offer.ResolvedAt = DateTime.UtcNow;
        _offerRepo.Update(offer);

        offer.Listing.Status = ListingStatus.UnderOffer;
        offer.Listing.UpdatedAt = DateTime.UtcNow;

        var transaction = new Transaction
        {
            ListingId = offer.ListingId,
            OfferId = offer.OfferId,
            AgentId = agentId,
            OwnerId = offer.Listing.OwnerId,
            BuyerId = offer.BuyerId,
            Status = TransactionStatus.Active,
            CreatedAt = DateTime.UtcNow,
        };
        await _txRepo.AddAsync(transaction, ct);
        await _offerRepo.SaveChangesAsync(ct);

        await _notifications.CreateAsync(offer.BuyerId, NotificationType.OfferResponse,
            "Offer Accepted!", $"Your offer of {offer.ProposedPrice:C} has been accepted. The listing is now under offer.",
            "Offer", offerId, ct);

        return await GetOfferDtoAsync(offerId, ct);
    }

    // ── Agent: Decline offer ──────────────────────────────────────────────────

    public async Task<OfferDto> DeclineOfferAsync(int agentId, int offerId, CancellationToken ct = default)
    {
        var offer = await _offerRepo.GetByIdWithDetailsAsync(offerId, ct)
            ?? throw new NotFoundException(nameof(Offer), offerId);

        if (offer.Listing.AgentId != agentId)
            throw new ForbiddenException("You are not the assigned agent for this listing.");

        if (offer.Status != OfferStatus.Pending && offer.Status != OfferStatus.Countered)
            throw new BusinessRuleException("Only pending or countered offers can be declined.");

        offer.Status = OfferStatus.Declined;
        offer.ResolvedAt = DateTime.UtcNow;
        _offerRepo.Update(offer);
        await _offerRepo.SaveChangesAsync(ct);

        await _notifications.CreateAsync(offer.BuyerId, NotificationType.OfferResponse,
            "Offer Declined", $"Your offer of {offer.ProposedPrice:C} has been declined.",
            "Offer", offerId, ct);

        return await GetOfferDtoAsync(offerId, ct);
    }

    // ── Agent: Counter offer ──────────────────────────────────────────────────

    public async Task<OfferDto> CounterOfferAsync(int agentId, int offerId, CounterOfferRequest request, CancellationToken ct = default)
    {
        var offer = await _offerRepo.GetByIdWithDetailsAsync(offerId, ct)
            ?? throw new NotFoundException(nameof(Offer), offerId);

        if (offer.Listing.AgentId != agentId)
            throw new ForbiddenException("You are not the assigned agent for this listing.");

        if (offer.Status != OfferStatus.Pending)
            throw new BusinessRuleException("Only pending offers can be countered.");

        const int maxRounds = 3;
        if (offer.NegotiationRound >= maxRounds)
        {
            offer.Status = OfferStatus.Expired;
            offer.ResolvedAt = DateTime.UtcNow;
            _offerRepo.Update(offer);
            await _offerRepo.SaveChangesAsync(ct);

            await _notifications.CreateAsync(offer.BuyerId, NotificationType.OfferResponse,
                "Offer Expired", "Maximum negotiation rounds reached. The offer has expired.",
                "Offer", offerId, ct);

            return await GetOfferDtoAsync(offerId, ct);
        }

        if (request.ResponseDeadline <= DateTime.UtcNow)
            throw new BusinessRuleException("Response deadline must be in the future.");

        offer.NegotiationRound++;
        offer.Status = OfferStatus.Countered;
        offer.ResponseDeadline = request.ResponseDeadline;
        _offerRepo.Update(offer);

        var negotiation = new Negotiation
        {
            OfferId = offerId,
            RoundNumber = offer.NegotiationRound,
            ActorRole = NegotiationActorRole.Agent,
            ProposedPrice = request.RevisedPrice,
            Message = request.Message,
            Action = NegotiationAction.Counter,
            ResponseDeadline = request.ResponseDeadline,
            CreatedAt = DateTime.UtcNow,
        };
        await _offerRepo.AddNegotiationAsync(negotiation, ct);
        await _offerRepo.SaveChangesAsync(ct);

        await _notifications.CreateAsync(offer.BuyerId, NotificationType.OfferResponse,
            "Counter Offer Received", $"The agent countered with {request.RevisedPrice:C}. Respond by {request.ResponseDeadline:f}.",
            "Offer", offerId, ct);

        return await GetOfferDtoAsync(offerId, ct);
    }

    // ── Buyer: Accept counter offer ───────────────────────────────────────────

    public async Task<OfferDto> AcceptCounterOfferAsync(int buyerId, int offerId, CancellationToken ct = default)
    {
        var offer = await _offerRepo.GetByIdWithDetailsAsync(offerId, ct)
            ?? throw new NotFoundException(nameof(Offer), offerId);

        if (offer.BuyerId != buyerId)
            throw new ForbiddenException("This offer does not belong to you.");

        if (offer.Status != OfferStatus.Countered)
            throw new BusinessRuleException("Only countered offers can be accepted.");

        if (offer.ResponseDeadline.HasValue && offer.ResponseDeadline.Value < DateTime.UtcNow)
        {
            offer.Status = OfferStatus.Expired;
            offer.ResolvedAt = DateTime.UtcNow;
            _offerRepo.Update(offer);
            await _offerRepo.SaveChangesAsync(ct);
            throw new BusinessRuleException("The response deadline for this counter offer has expired.");
        }

        if (offer.Listing.AgentId == null)
            throw new BusinessRuleException("This listing does not have an assigned agent.");

        offer.Status = OfferStatus.Accepted;
        offer.ResolvedAt = DateTime.UtcNow;
        _offerRepo.Update(offer);

        offer.Listing.Status = ListingStatus.UnderOffer;
        offer.Listing.UpdatedAt = DateTime.UtcNow;

        var transaction = new Transaction
        {
            ListingId = offer.ListingId,
            OfferId = offer.OfferId,
            AgentId = offer.Listing.AgentId.Value,
            OwnerId = offer.Listing.OwnerId,
            BuyerId = buyerId,
            Status = TransactionStatus.Active,
            CreatedAt = DateTime.UtcNow,
        };
        await _txRepo.AddAsync(transaction, ct);

        var negotiation = new Negotiation
        {
            OfferId = offerId,
            RoundNumber = offer.NegotiationRound,
            ActorRole = NegotiationActorRole.Buyer,
            ProposedPrice = offer.ProposedPrice,
            Action = NegotiationAction.Accept,
            CreatedAt = DateTime.UtcNow,
        };
        await _offerRepo.AddNegotiationAsync(negotiation, ct);
        await _offerRepo.SaveChangesAsync(ct);

        await _notifications.CreateAsync(offer.Listing.AgentId.Value, NotificationType.OfferResponse,
            "Counter Offer Accepted", "The buyer accepted your counter offer. The listing is now under offer.",
            "Offer", offerId, ct);

        return await GetOfferDtoAsync(offerId, ct);
    }

    // ── Buyer: Decline counter offer ──────────────────────────────────────────

    public async Task<OfferDto> DeclineCounterOfferAsync(int buyerId, int offerId, CancellationToken ct = default)
    {
        var offer = await _offerRepo.GetByIdWithDetailsAsync(offerId, ct)
            ?? throw new NotFoundException(nameof(Offer), offerId);

        if (offer.BuyerId != buyerId)
            throw new ForbiddenException("This offer does not belong to you.");

        if (offer.Status != OfferStatus.Countered)
            throw new BusinessRuleException("Only countered offers can be declined.");

        offer.Status = OfferStatus.Declined;
        offer.ResolvedAt = DateTime.UtcNow;
        _offerRepo.Update(offer);

        var negotiation = new Negotiation
        {
            OfferId = offerId,
            RoundNumber = offer.NegotiationRound,
            ActorRole = NegotiationActorRole.Buyer,
            ProposedPrice = offer.ProposedPrice,
            Action = NegotiationAction.Decline,
            CreatedAt = DateTime.UtcNow,
        };
        await _offerRepo.AddNegotiationAsync(negotiation, ct);
        await _offerRepo.SaveChangesAsync(ct);

        if (offer.Listing.AgentId.HasValue)
            await _notifications.CreateAsync(offer.Listing.AgentId.Value, NotificationType.OfferResponse,
                "Counter Offer Declined", "The buyer declined your counter offer.",
                "Offer", offerId, ct);

        return await GetOfferDtoAsync(offerId, ct);
    }

    // ── Buyer: Submit revised offer (after counter) ───────────────────────────

    public async Task<OfferDto> SubmitRevisedOfferAsync(int buyerId, int offerId, SubmitRevisedOfferRequest request, CancellationToken ct = default)
    {
        var offer = await _offerRepo.GetByIdWithDetailsAsync(offerId, ct)
            ?? throw new NotFoundException(nameof(Offer), offerId);

        if (offer.BuyerId != buyerId)
            throw new ForbiddenException("This offer does not belong to you.");

        if (offer.Status != OfferStatus.Countered)
            throw new BusinessRuleException("Revised offers can only be submitted in response to a counter offer.");

        const int maxRounds = 3;
        if (offer.NegotiationRound >= maxRounds)
        {
            offer.Status = OfferStatus.Expired;
            offer.ResolvedAt = DateTime.UtcNow;
            _offerRepo.Update(offer);
            await _offerRepo.SaveChangesAsync(ct);

            if (offer.Listing.AgentId.HasValue)
                await _notifications.CreateAsync(offer.Listing.AgentId.Value, NotificationType.OfferResponse,
                    "Offer Expired", "Maximum negotiation rounds reached. The offer has expired.",
                    "Offer", offerId, ct);

            return await GetOfferDtoAsync(offerId, ct);
        }

        offer.ProposedPrice = request.RevisedPrice;
        offer.NegotiationRound++;
        offer.Status = OfferStatus.Pending;
        offer.ResponseDeadline = null;
        _offerRepo.Update(offer);

        var negotiation = new Negotiation
        {
            OfferId = offerId,
            RoundNumber = offer.NegotiationRound,
            ActorRole = NegotiationActorRole.Buyer,
            ProposedPrice = request.RevisedPrice,
            Message = request.Message,
            Action = NegotiationAction.Counter,
            CreatedAt = DateTime.UtcNow,
        };
        await _offerRepo.AddNegotiationAsync(negotiation, ct);
        await _offerRepo.SaveChangesAsync(ct);

        if (offer.Listing.AgentId.HasValue)
            await _notifications.CreateAsync(offer.Listing.AgentId.Value, NotificationType.OfferResponse,
                "Revised Offer Submitted", $"The buyer submitted a revised offer of {request.RevisedPrice:C}.",
                "Offer", offerId, ct);

        return await GetOfferDtoAsync(offerId, ct);
    }

    // ── Buyer: Withdraw offer ─────────────────────────────────────────────────

    public async Task WithdrawOfferAsync(int buyerId, int offerId, CancellationToken ct = default)
    {
        var offer = await _offerRepo.GetByIdWithDetailsAsync(offerId, ct)
            ?? throw new NotFoundException(nameof(Offer), offerId);

        if (offer.BuyerId != buyerId)
            throw new ForbiddenException("This offer does not belong to you.");

        if (offer.Status == OfferStatus.Accepted)
            throw new ConflictException("An accepted offer cannot be withdrawn through this action.");

        if (offer.Status is OfferStatus.Withdrawn or OfferStatus.Declined or OfferStatus.Expired or OfferStatus.Closed)
            throw new BusinessRuleException("This offer is no longer active.");

        offer.Status = OfferStatus.Withdrawn;
        offer.ResolvedAt = DateTime.UtcNow;
        _offerRepo.Update(offer);
        await _offerRepo.SaveChangesAsync(ct);

        if (offer.Listing.AgentId.HasValue)
            await _notifications.CreateAsync(offer.Listing.AgentId.Value, NotificationType.OfferResponse,
                "Offer Withdrawn", $"A buyer withdrew their offer of {offer.ProposedPrice:C} on '{offer.Listing.Title}'.",
                "Offer", offerId, ct);
    }

    // ── Buyer: Post-inspection options ────────────────────────────────────────

    public async Task<PostInspectionOptionsDto> GetPostInspectionOptionsAsync(int buyerId, int offerId, CancellationToken ct = default)
    {
        var offer = await _offerRepo.GetByIdWithDetailsAsync(offerId, ct)
            ?? throw new NotFoundException(nameof(Offer), offerId);

        if (offer.BuyerId != buyerId)
            throw new ForbiddenException("This offer does not belong to you.");

        if (offer.Status != OfferStatus.Accepted)
            throw new BusinessRuleException("Post-inspection options are only available for accepted offers.");

        var window = await _db.PostInspectionWindows.FirstOrDefaultAsync(w => w.OfferId == offerId, ct);
        if (window == null)
            return new PostInspectionOptionsDto { WindowOpen = false, VerdictStatus = "NotSubmitted", CanWithdraw = false, CanRevise = false };

        var inspection = await _db.Inspections
            .Include(i => i.Report)
            .FirstOrDefaultAsync(i => i.OfferId == offerId, ct);

        var verdict = inspection?.Report?.FinalVerdict;

        if (verdict == InspectionVerdict.Passed)
            return new PostInspectionOptionsDto { WindowOpen = false, VerdictStatus = "Passed", CanWithdraw = false, CanRevise = false };

        var windowOpen = DateTime.UtcNow <= window.WindowExpiresAt && window.ActionTaken == PostInspectionAction.NoAction;

        return new PostInspectionOptionsDto
        {
            WindowOpen = windowOpen,
            WindowExpiresAt = window.WindowExpiresAt,
            VerdictStatus = verdict?.ToString() ?? "Pending",
            CanWithdraw = windowOpen,
            CanRevise = windowOpen,
        };
    }

    // ── Buyer: Withdraw after inspection ─────────────────────────────────────

    public async Task WithdrawOfferAfterInspectionAsync(int buyerId, int offerId, CancellationToken ct = default)
    {
        var offer = await _offerRepo.GetByIdWithDetailsAsync(offerId, ct)
            ?? throw new NotFoundException(nameof(Offer), offerId);

        if (offer.BuyerId != buyerId)
            throw new ForbiddenException("This offer does not belong to you.");

        if (offer.Status != OfferStatus.Accepted)
            throw new BusinessRuleException("Only accepted offers can be withdrawn after inspection.");

        var window = await _db.PostInspectionWindows.FirstOrDefaultAsync(w => w.OfferId == offerId, ct)
            ?? throw new BusinessRuleException("No post-inspection window exists for this offer.");

        if (window.ActionTaken != PostInspectionAction.NoAction)
            throw new BusinessRuleException("An action has already been taken within the post-inspection window.");

        if (DateTime.UtcNow > window.WindowExpiresAt)
            throw new BusinessRuleException("The 72-hour post-inspection response window has closed. The original offer remains in force.");

        offer.Status = OfferStatus.Withdrawn;
        offer.ResolvedAt = DateTime.UtcNow;
        _offerRepo.Update(offer);

        offer.Listing.Status = ListingStatus.Active;
        offer.Listing.UpdatedAt = DateTime.UtcNow;

        window.ActionTaken = PostInspectionAction.Withdrawn;
        window.ActionTakenAt = DateTime.UtcNow;
        _db.PostInspectionWindows.Update(window);

        await _offerRepo.SaveChangesAsync(ct);

        if (offer.Listing.AgentId.HasValue)
            await _notifications.CreateAsync(offer.Listing.AgentId.Value, NotificationType.OfferResponse,
                "Offer Withdrawn After Inspection", "The buyer withdrew their offer following the inspection verdict. Listing is back to Active.",
                "Offer", offerId, ct);

        await _notifications.CreateAsync(offer.Listing.OwnerId, NotificationType.OfferResponse,
            "Offer Withdrawn After Inspection", "The buyer withdrew after inspection. Your listing is back to Active.",
            "Offer", offerId, ct);
    }

    // ── Buyer: Submit revised offer after inspection ──────────────────────────

    public async Task<OfferDto> SubmitRevisedOfferAfterInspectionAsync(int buyerId, int offerId, RevisedOfferAfterInspectionRequest request, CancellationToken ct = default)
    {
        var offer = await _offerRepo.GetByIdWithDetailsAsync(offerId, ct)
            ?? throw new NotFoundException(nameof(Offer), offerId);

        if (offer.BuyerId != buyerId)
            throw new ForbiddenException("This offer does not belong to you.");

        if (offer.Status != OfferStatus.Accepted)
            throw new BusinessRuleException("Only accepted offers can be revised after inspection.");

        var window = await _db.PostInspectionWindows.FirstOrDefaultAsync(w => w.OfferId == offerId, ct)
            ?? throw new BusinessRuleException("No post-inspection window exists for this offer.");

        if (window.ActionTaken != PostInspectionAction.NoAction)
            throw new BusinessRuleException("An action has already been taken within the post-inspection window.");

        if (DateTime.UtcNow > window.WindowExpiresAt)
            throw new BusinessRuleException("The 72-hour post-inspection response window has closed. The original offer remains in force.");

        offer.ProposedPrice = request.RevisedPrice;
        offer.NegotiationRound = 1;
        offer.Status = OfferStatus.Pending;
        offer.ResponseDeadline = null;
        _offerRepo.Update(offer);

        window.ActionTaken = PostInspectionAction.RevisedOffer;
        window.ActionTakenAt = DateTime.UtcNow;
        _db.PostInspectionWindows.Update(window);

        await _offerRepo.SaveChangesAsync(ct);

        if (offer.Listing.AgentId.HasValue)
            await _notifications.CreateAsync(offer.Listing.AgentId.Value, NotificationType.OfferResponse,
                "Revised Offer After Inspection", $"The buyer submitted a revised offer of {request.RevisedPrice:C} after the inspection verdict.",
                "Offer", offerId, ct);

        return await GetOfferDtoAsync(offerId, ct);
    }

    // ── Query methods ─────────────────────────────────────────────────────────

    public async Task<IEnumerable<OfferDto>> GetOffersByListingAsync(int agentId, int listingId, CancellationToken ct = default)
    {
        var listing = await _db.Listings.FirstOrDefaultAsync(l => l.ListingId == listingId, ct)
            ?? throw new NotFoundException(nameof(Listing), listingId);

        if (listing.AgentId != agentId)
            throw new ForbiddenException("You are not the assigned agent for this listing.");

        var offers = await _offerRepo.GetByListingIdAsync(listingId, ct);
        return offers.Select(MapToDto);
    }

    public async Task<IEnumerable<OfferDto>> GetOffersByListingForOwnerAsync(int ownerId, int listingId, CancellationToken ct = default)
    {
        var listing = await _db.Listings.FirstOrDefaultAsync(l => l.ListingId == listingId, ct)
            ?? throw new NotFoundException(nameof(Listing), listingId);

        if (listing.OwnerId != ownerId)
            throw new ForbiddenException("You do not own this listing.");

        var offers = await _offerRepo.GetByListingIdAsync(listingId, ct);
        return offers.Select(MapToDto);
    }

    public async Task<IEnumerable<OfferDto>> GetBuyerOffersAsync(int buyerId, CancellationToken ct = default)
    {
        var offers = await _offerRepo.GetByBuyerIdAsync(buyerId, ct);
        return offers.Select(MapToDto);
    }

    public async Task<OfferDto> GetOfferByIdAsync(int offerId, int userId, CancellationToken ct = default)
    {
        var offer = await _offerRepo.GetByIdWithDetailsAsync(offerId, ct)
            ?? throw new NotFoundException(nameof(Offer), offerId);

        var isParty = offer.BuyerId == userId ||
                      offer.Listing.AgentId == userId ||
                      offer.Listing.OwnerId == userId;

        if (!isParty)
            throw new ForbiddenException("You do not have access to this offer.");

        return MapToDto(offer);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private async Task<OfferDto> GetOfferDtoAsync(int offerId, CancellationToken ct)
    {
        var offer = await _offerRepo.GetByIdWithDetailsAsync(offerId, ct)
            ?? throw new NotFoundException(nameof(Offer), offerId);
        return MapToDto(offer);
    }

    private static OfferDto MapToDto(Offer o) => new()
    {
        OfferId = o.OfferId,
        ListingId = o.ListingId,
        BuyerId = o.BuyerId,
        BuyerFullName = $"{o.Buyer.FirstName} {o.Buyer.LastName}",
        ProposedPrice = o.ProposedPrice,
        Message = o.Message,
        Status = o.Status.ToString(),
        NegotiationRound = o.NegotiationRound,
        ResponseDeadline = o.ResponseDeadline,
        SubmittedAt = o.SubmittedAt,
        ResolvedAt = o.ResolvedAt,
        Negotiations = o.Negotiations.Select(n => new NegotiationDto
        {
            NegotiationId = n.NegotiationId,
            OfferId = n.OfferId,
            RoundNumber = n.RoundNumber,
            ActorRole = n.ActorRole.ToString(),
            ProposedPrice = n.ProposedPrice,
            Message = n.Message,
            Action = n.Action.ToString(),
            ResponseDeadline = n.ResponseDeadline,
            CreatedAt = n.CreatedAt,
        }),
    };
}
