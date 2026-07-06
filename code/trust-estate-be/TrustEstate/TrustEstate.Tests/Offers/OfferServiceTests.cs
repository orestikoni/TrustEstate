using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using Xunit;
using TrustEstate.Application.DTOs.Offers;
using TrustEstate.Application.Interfaces.Notifications;
using TrustEstate.Application.Interfaces.Offers;
using TrustEstate.Application.Interfaces.Transactions;
using TrustEstate.Domain.Entities;
using TrustEstate.Domain.Enums;
using TrustEstate.Domain.Exceptions;
using TrustEstate.Infrastructure.Persistence;
using TrustEstate.Infrastructure.Services;

namespace TrustEstate.Tests.Offers;

public class OfferServiceTests
{
    private readonly Mock<IOfferRepository> _offerRepo = new();
    private readonly Mock<ITransactionRepository> _txRepo = new();
    private readonly Mock<INotificationService> _notifications = new();

    private OfferService BuildSut(TrustEstateDbContext? db = null)
    {
        db ??= CreateInMemoryDb();
        return new OfferService(_offerRepo.Object, _txRepo.Object, _notifications.Object, db);
    }

    private static TrustEstateDbContext CreateInMemoryDb(string? name = null)
    {
        var options = new DbContextOptionsBuilder<TrustEstateDbContext>()
            .UseInMemoryDatabase(name ?? Guid.NewGuid().ToString())
            .Options;
        return new TrustEstateDbContext(options);
    }

    private void SetupNotificationsToComplete()
    {
        _notifications.Setup(n => n.CreateAsync(
            It.IsAny<int>(), It.IsAny<NotificationType>(), It.IsAny<string>(),
            It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<int?>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
    }

    private static Offer BuildOffer(OfferStatus status, int agentId = 5, int ownerId = 10, int buyerId = 20, int round = 0)
    {
        var listing = new Listing
        {
            ListingId = 1,
            Title = "Test Listing",
            AgentId = agentId,
            OwnerId = ownerId,
            Status = ListingStatus.Active,
        };

        return new Offer
        {
            OfferId = 1,
            ListingId = 1,
            BuyerId = buyerId,
            ProposedPrice = 100_000m,
            Status = status,
            NegotiationRound = round,
            Listing = listing,
            Buyer = new User { Id = buyerId, FirstName = "John", LastName = "Doe" },
            Negotiations = new List<Negotiation>(),
        };
    }

    // ── AcceptOfferAsync ─────────────────────────────────────────────────────

    [Fact]
    public async Task AcceptOffer_ValidPendingOffer_SetsStatusToAccepted()
    {
        var offer = BuildOffer(OfferStatus.Pending, agentId: 5);
        _offerRepo.Setup(r => r.GetByIdWithDetailsAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(offer);
        _offerRepo.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _txRepo.Setup(r => r.AddAsync(It.IsAny<Transaction>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        SetupNotificationsToComplete();

        var result = await BuildSut().AcceptOfferAsync(agentId: 5, offerId: 1);

        Assert.Equal("Accepted", result.Status);
        Assert.Equal(OfferStatus.Accepted, offer.Status);
        Assert.NotNull(offer.ResolvedAt);
    }

    [Fact]
    public async Task AcceptOffer_WrongAgent_ThrowsForbiddenException()
    {
        var offer = BuildOffer(OfferStatus.Pending, agentId: 5);
        _offerRepo.Setup(r => r.GetByIdWithDetailsAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(offer);

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            BuildSut().AcceptOfferAsync(agentId: 99, offerId: 1));
    }

    [Fact]
    public async Task AcceptOffer_AlreadyAcceptedOffer_ThrowsBusinessRuleException()
    {
        var offer = BuildOffer(OfferStatus.Accepted, agentId: 5);
        _offerRepo.Setup(r => r.GetByIdWithDetailsAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(offer);

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            BuildSut().AcceptOfferAsync(agentId: 5, offerId: 1));
    }

    // ── DeclineOfferAsync ────────────────────────────────────────────────────

    [Fact]
    public async Task DeclineOffer_ValidPendingOffer_SetsStatusToDeclined()
    {
        var offer = BuildOffer(OfferStatus.Pending, agentId: 5);
        _offerRepo.Setup(r => r.GetByIdWithDetailsAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(offer);
        _offerRepo.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        SetupNotificationsToComplete();

        var result = await BuildSut().DeclineOfferAsync(agentId: 5, offerId: 1);

        Assert.Equal("Declined", result.Status);
        Assert.Equal(OfferStatus.Declined, offer.Status);
    }

    [Fact]
    public async Task DeclineOffer_WrongAgent_ThrowsForbiddenException()
    {
        var offer = BuildOffer(OfferStatus.Pending, agentId: 5);
        _offerRepo.Setup(r => r.GetByIdWithDetailsAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(offer);

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            BuildSut().DeclineOfferAsync(agentId: 99, offerId: 1));
    }

    // ── CounterOfferAsync ────────────────────────────────────────────────────

    [Fact]
    public async Task CounterOffer_MaxNegotiationRoundsReached_SetsStatusToExpired()
    {
        var offer = BuildOffer(OfferStatus.Pending, agentId: 5, round: 3);
        _offerRepo.Setup(r => r.GetByIdWithDetailsAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(offer);
        _offerRepo.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        SetupNotificationsToComplete();

        var request = new CounterOfferRequest
        {
            RevisedPrice = 90_000m,
            ResponseDeadline = DateTime.UtcNow.AddDays(3),
        };

        var result = await BuildSut().CounterOfferAsync(agentId: 5, offerId: 1, request);

        Assert.Equal("Expired", result.Status);
        Assert.Equal(OfferStatus.Expired, offer.Status);
    }

    [Fact]
    public async Task CounterOffer_PastResponseDeadline_ThrowsBusinessRuleException()
    {
        var offer = BuildOffer(OfferStatus.Pending, agentId: 5, round: 0);
        _offerRepo.Setup(r => r.GetByIdWithDetailsAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(offer);

        var request = new CounterOfferRequest
        {
            RevisedPrice = 90_000m,
            ResponseDeadline = DateTime.UtcNow.AddHours(-1),
        };

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            BuildSut().CounterOfferAsync(agentId: 5, offerId: 1, request));
    }

    [Fact]
    public async Task CounterOffer_WrongAgent_ThrowsForbiddenException()
    {
        var offer = BuildOffer(OfferStatus.Pending, agentId: 5, round: 0);
        _offerRepo.Setup(r => r.GetByIdWithDetailsAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(offer);

        var request = new CounterOfferRequest
        {
            RevisedPrice = 90_000m,
            ResponseDeadline = DateTime.UtcNow.AddDays(3),
        };

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            BuildSut().CounterOfferAsync(agentId: 99, offerId: 1, request));
    }

    // ── WithdrawOfferAsync ───────────────────────────────────────────────────

    [Fact]
    public async Task WithdrawOffer_AcceptedOffer_ThrowsConflictException()
    {
        var offer = BuildOffer(OfferStatus.Accepted, agentId: 5, buyerId: 20);
        _offerRepo.Setup(r => r.GetByIdWithDetailsAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(offer);

        await Assert.ThrowsAsync<ConflictException>(() =>
            BuildSut().WithdrawOfferAsync(buyerId: 20, offerId: 1));
    }

    [Fact]
    public async Task WithdrawOffer_AlreadyWithdrawn_ThrowsBusinessRuleException()
    {
        var offer = BuildOffer(OfferStatus.Withdrawn, agentId: 5, buyerId: 20);
        _offerRepo.Setup(r => r.GetByIdWithDetailsAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(offer);

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            BuildSut().WithdrawOfferAsync(buyerId: 20, offerId: 1));
    }

    // ── AcceptCounterOfferAsync ──────────────────────────────────────────────

    [Fact]
    public async Task AcceptCounterOffer_OfferNotCountered_ThrowsBusinessRuleException()
    {
        var offer = BuildOffer(OfferStatus.Pending, agentId: 5, buyerId: 20);
        _offerRepo.Setup(r => r.GetByIdWithDetailsAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(offer);

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            BuildSut().AcceptCounterOfferAsync(buyerId: 20, offerId: 1));
    }

    [Fact]
    public async Task AcceptCounterOffer_ResponseDeadlineExpired_ThrowsBusinessRuleException()
    {
        var offer = BuildOffer(OfferStatus.Countered, agentId: 5, buyerId: 20);
        offer.ResponseDeadline = DateTime.UtcNow.AddHours(-1);

        _offerRepo.Setup(r => r.GetByIdWithDetailsAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(offer);
        _offerRepo.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            BuildSut().AcceptCounterOfferAsync(buyerId: 20, offerId: 1));
    }
}
