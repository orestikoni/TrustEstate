using Microsoft.EntityFrameworkCore;
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

public class OfferServiceGapTests
{
    private readonly Mock<IOfferRepository> _offerRepo = new();
    private readonly Mock<ITransactionRepository> _txRepo = new();
    private readonly Mock<INotificationService> _notifications = new();

    private static TrustEstateDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<TrustEstateDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new TrustEstateDbContext(options);
    }

    private OfferService BuildSut(TrustEstateDbContext db) =>
        new OfferService(_offerRepo.Object, _txRepo.Object, _notifications.Object, db);

    private void SetupNotificationsToComplete()
    {
        _notifications.Setup(n => n.CreateAsync(
            It.IsAny<int>(), It.IsAny<NotificationType>(), It.IsAny<string>(),
            It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<int?>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
    }

    // ── SubmitOfferAsync ─────────────────────────────────────────────────────

    [Fact]
    public async Task SubmitOffer_ListingNotActive_ThrowsConflictException()
    {
        using var db = CreateDb();
        db.Listings.Add(new Listing { ListingId = 1, OwnerId = 10, AgentId = 5, Status = ListingStatus.UnderOffer, Title = "T", Description = "D", Address = "A", City = "C", Country = "X" });
        await db.SaveChangesAsync();

        var request = new SubmitOfferRequest { ListingId = 1, ProposedPrice = 100_000m };

        await Assert.ThrowsAsync<ConflictException>(() =>
            BuildSut(db).SubmitOfferAsync(buyerId: 20, request));
    }

    [Fact]
    public async Task SubmitOffer_BuyerAlreadyHasActiveOffer_ThrowsConflictException()
    {
        using var db = CreateDb();
        db.Listings.Add(new Listing { ListingId = 1, OwnerId = 10, AgentId = 5, Status = ListingStatus.Active, Title = "T", Description = "D", Address = "A", City = "C", Country = "X" });
        await db.SaveChangesAsync();

        _offerRepo.Setup(r => r.HasActiveOfferAsync(1, 20, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var request = new SubmitOfferRequest { ListingId = 1, ProposedPrice = 100_000m };

        await Assert.ThrowsAsync<ConflictException>(() =>
            BuildSut(db).SubmitOfferAsync(buyerId: 20, request));
    }

    [Fact]
    public async Task SubmitOffer_NegativePrice_ThrowsBusinessRuleException()
    {
        using var db = CreateDb();
        db.Listings.Add(new Listing { ListingId = 1, OwnerId = 10, AgentId = 5, Status = ListingStatus.Active, Title = "T", Description = "D", Address = "A", City = "C", Country = "X" });
        await db.SaveChangesAsync();

        _offerRepo.Setup(r => r.HasActiveOfferAsync(1, 20, It.IsAny<CancellationToken>())).ReturnsAsync(false);

        var request = new SubmitOfferRequest { ListingId = 1, ProposedPrice = -500m };

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            BuildSut(db).SubmitOfferAsync(buyerId: 20, request));
    }

    // ── WithdrawOfferAfterInspectionAsync ────────────────────────────────────

    [Fact]
    public async Task WithdrawAfterInspection_NoPostInspectionWindow_ThrowsBusinessRuleException()
    {
        using var db = CreateDb();
        var listing = new Listing { ListingId = 1, AgentId = 5, OwnerId = 10, Status = ListingStatus.UnderOffer, Title = "T", Description = "D", Address = "A", City = "C", Country = "X" };
        var offer = new Offer { OfferId = 1, ListingId = 1, BuyerId = 20, Status = OfferStatus.Accepted, Listing = listing, Buyer = new User { Id = 20, FirstName = "J", LastName = "D" }, Negotiations = new List<Negotiation>() };

        _offerRepo.Setup(r => r.GetByIdWithDetailsAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(offer);

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            BuildSut(db).WithdrawOfferAfterInspectionAsync(buyerId: 20, offerId: 1));
    }

    [Fact]
    public async Task WithdrawAfterInspection_WindowExpired_ThrowsBusinessRuleException()
    {
        using var db = CreateDb();
        db.PostInspectionWindows.Add(new PostInspectionWindow
        {
            OfferId = 1,
            InspectionId = 1,
            ActionTaken = PostInspectionAction.NoAction,
            VerdictNotifiedAt = DateTime.UtcNow.AddHours(-80),
            WindowExpiresAt = DateTime.UtcNow.AddHours(-8),
        });
        await db.SaveChangesAsync();

        var listing = new Listing { ListingId = 1, AgentId = 5, OwnerId = 10, Status = ListingStatus.UnderOffer, Title = "T", Description = "D", Address = "A", City = "C", Country = "X" };
        var offer = new Offer { OfferId = 1, ListingId = 1, BuyerId = 20, Status = OfferStatus.Accepted, Listing = listing, Buyer = new User { Id = 20, FirstName = "J", LastName = "D" }, Negotiations = new List<Negotiation>() };
        _offerRepo.Setup(r => r.GetByIdWithDetailsAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(offer);

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            BuildSut(db).WithdrawOfferAfterInspectionAsync(buyerId: 20, offerId: 1));
    }

    [Fact]
    public async Task WithdrawAfterInspection_ActionAlreadyTaken_ThrowsBusinessRuleException()
    {
        using var db = CreateDb();
        db.PostInspectionWindows.Add(new PostInspectionWindow
        {
            OfferId = 1,
            InspectionId = 1,
            ActionTaken = PostInspectionAction.Withdrawn,
            VerdictNotifiedAt = DateTime.UtcNow.AddHours(-1),
            WindowExpiresAt = DateTime.UtcNow.AddHours(71),
        });
        await db.SaveChangesAsync();

        var listing = new Listing { ListingId = 1, AgentId = 5, OwnerId = 10, Status = ListingStatus.UnderOffer, Title = "T", Description = "D", Address = "A", City = "C", Country = "X" };
        var offer = new Offer { OfferId = 1, ListingId = 1, BuyerId = 20, Status = OfferStatus.Accepted, Listing = listing, Buyer = new User { Id = 20, FirstName = "J", LastName = "D" }, Negotiations = new List<Negotiation>() };
        _offerRepo.Setup(r => r.GetByIdWithDetailsAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(offer);

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            BuildSut(db).WithdrawOfferAfterInspectionAsync(buyerId: 20, offerId: 1));
    }

    // ── SubmitRevisedOfferAfterInspectionAsync ───────────────────────────────

    [Fact]
    public async Task RevisedOfferAfterInspection_NoWindow_ThrowsBusinessRuleException()
    {
        using var db = CreateDb();
        var listing = new Listing { ListingId = 1, AgentId = 5, OwnerId = 10, Status = ListingStatus.UnderOffer, Title = "T", Description = "D", Address = "A", City = "C", Country = "X" };
        var offer = new Offer { OfferId = 1, ListingId = 1, BuyerId = 20, Status = OfferStatus.Accepted, Listing = listing, Buyer = new User { Id = 20, FirstName = "J", LastName = "D" }, Negotiations = new List<Negotiation>() };
        _offerRepo.Setup(r => r.GetByIdWithDetailsAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(offer);

        var request = new RevisedOfferAfterInspectionRequest { RevisedPrice = 85_000m };

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            BuildSut(db).SubmitRevisedOfferAfterInspectionAsync(buyerId: 20, offerId: 1, request));
    }

    [Fact]
    public async Task RevisedOfferAfterInspection_WindowExpired_ThrowsBusinessRuleException()
    {
        using var db = CreateDb();
        db.PostInspectionWindows.Add(new PostInspectionWindow
        {
            OfferId = 1,
            InspectionId = 1,
            ActionTaken = PostInspectionAction.NoAction,
            VerdictNotifiedAt = DateTime.UtcNow.AddHours(-80),
            WindowExpiresAt = DateTime.UtcNow.AddHours(-8),
        });
        await db.SaveChangesAsync();

        var listing = new Listing { ListingId = 1, AgentId = 5, OwnerId = 10, Status = ListingStatus.UnderOffer, Title = "T", Description = "D", Address = "A", City = "C", Country = "X" };
        var offer = new Offer { OfferId = 1, ListingId = 1, BuyerId = 20, Status = OfferStatus.Accepted, Listing = listing, Buyer = new User { Id = 20, FirstName = "J", LastName = "D" }, Negotiations = new List<Negotiation>() };
        _offerRepo.Setup(r => r.GetByIdWithDetailsAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(offer);

        var request = new RevisedOfferAfterInspectionRequest { RevisedPrice = 85_000m };

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            BuildSut(db).SubmitRevisedOfferAfterInspectionAsync(buyerId: 20, offerId: 1, request));
    }
}
