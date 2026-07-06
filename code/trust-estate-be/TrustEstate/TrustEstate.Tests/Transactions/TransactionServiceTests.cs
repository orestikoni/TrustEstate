using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;
using TrustEstate.Application.Interfaces.Notifications;
using TrustEstate.Application.Interfaces.Transactions;
using TrustEstate.Domain.Entities;
using TrustEstate.Domain.Enums;
using TrustEstate.Domain.Exceptions;
using TrustEstate.Infrastructure.Persistence;
using TrustEstate.Infrastructure.Services;

namespace TrustEstate.Tests.Transactions;

public class TransactionServiceTests
{
    private readonly Mock<ITransactionRepository> _repo = new();
    private readonly Mock<INotificationService> _notifications = new();

    private static TrustEstateDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<TrustEstateDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new TrustEstateDbContext(options);
    }

    private TransactionService BuildSut(TrustEstateDbContext db) =>
        new TransactionService(_repo.Object, _notifications.Object, db);

    private void SetupNotificationsToComplete()
    {
        _notifications.Setup(n => n.CreateAsync(
            It.IsAny<int>(), It.IsAny<NotificationType>(), It.IsAny<string>(),
            It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<int?>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
    }

    private static Transaction BuildActiveTransaction(int listingId = 1, int offerId = 1,
        int agentId = 5, int ownerId = 10, int buyerId = 20,
        TransactionStatus status = TransactionStatus.Active) => new()
    {
        TransactionId = 100,
        ListingId = listingId,
        OfferId = offerId,
        AgentId = agentId,
        OwnerId = ownerId,
        BuyerId = buyerId,
        Status = status,
    };

    // ── CloseTransactionAsync — happy path ───────────────────────────────────

    [Fact]
    public async Task CloseTransaction_AllConditionsMet_SetsStatusToClosed()
    {
        using var db = CreateDb();

        db.Listings.Add(new Listing { ListingId = 1, AgentId = 5, OwnerId = 10, Status = ListingStatus.UnderOffer, Title = "T", Description = "D", Address = "A", City = "C", Country = "X" });
        db.Offers.Add(new Offer { OfferId = 1, ListingId = 1, BuyerId = 20, Status = OfferStatus.Accepted });
        var report = new InspectionReport { ReportId = 1, InspectionId = 1, IsLocked = true };
        db.Inspections.Add(new Inspection { InspectionId = 1, ListingId = 1, OfferId = 1, InspectorId = 7, AgentId = 5, Status = InspectionStatus.Completed, ScheduledDate = DateTime.UtcNow, Report = report });
        await db.SaveChangesAsync();

        var transaction = BuildActiveTransaction();
        _repo.Setup(r => r.GetByListingIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(transaction);
        _repo.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        SetupNotificationsToComplete();

        var result = await BuildSut(db).CloseTransactionAsync(agentId: 5, listingId: 1);

        Assert.Equal("Closed", result.Status);
        Assert.Equal(TransactionStatus.Closed, transaction.Status);
        Assert.NotNull(transaction.ClosedAt);
    }

    // ── CloseTransactionAsync — guard checks ─────────────────────────────────

    [Fact]
    public async Task CloseTransaction_WrongAgent_ThrowsForbiddenException()
    {
        using var db = CreateDb();
        db.Listings.Add(new Listing { ListingId = 1, AgentId = 5, OwnerId = 10, Title = "T", Description = "D", Address = "A", City = "C", Country = "X" });
        await db.SaveChangesAsync();

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            BuildSut(db).CloseTransactionAsync(agentId: 99, listingId: 1));
    }

    [Fact]
    public async Task CloseTransaction_AlreadyClosed_ThrowsBusinessRuleException()
    {
        using var db = CreateDb();
        db.Listings.Add(new Listing { ListingId = 1, AgentId = 5, OwnerId = 10, Title = "T", Description = "D", Address = "A", City = "C", Country = "X" });
        await db.SaveChangesAsync();

        _repo.Setup(r => r.GetByListingIdAsync(1, It.IsAny<CancellationToken>()))
             .ReturnsAsync(BuildActiveTransaction(status: TransactionStatus.Closed));

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            BuildSut(db).CloseTransactionAsync(agentId: 5, listingId: 1));
    }

    [Fact]
    public async Task CloseTransaction_SuspendedTransaction_ThrowsBusinessRuleException()
    {
        using var db = CreateDb();
        db.Listings.Add(new Listing { ListingId = 1, AgentId = 5, OwnerId = 10, Title = "T", Description = "D", Address = "A", City = "C", Country = "X" });
        await db.SaveChangesAsync();

        _repo.Setup(r => r.GetByListingIdAsync(1, It.IsAny<CancellationToken>()))
             .ReturnsAsync(BuildActiveTransaction(status: TransactionStatus.Suspended));

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            BuildSut(db).CloseTransactionAsync(agentId: 5, listingId: 1));
    }

    [Fact]
    public async Task CloseTransaction_OfferNotAccepted_ThrowsBusinessRuleException()
    {
        using var db = CreateDb();
        db.Listings.Add(new Listing { ListingId = 1, AgentId = 5, OwnerId = 10, Title = "T", Description = "D", Address = "A", City = "C", Country = "X" });
        db.Offers.Add(new Offer { OfferId = 1, ListingId = 1, BuyerId = 20, Status = OfferStatus.Pending });
        await db.SaveChangesAsync();

        _repo.Setup(r => r.GetByListingIdAsync(1, It.IsAny<CancellationToken>()))
             .ReturnsAsync(BuildActiveTransaction());

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            BuildSut(db).CloseTransactionAsync(agentId: 5, listingId: 1));
    }

    [Fact]
    public async Task CloseTransaction_InspectionNotCompleted_ThrowsBusinessRuleException()
    {
        using var db = CreateDb();
        db.Listings.Add(new Listing { ListingId = 1, AgentId = 5, OwnerId = 10, Title = "T", Description = "D", Address = "A", City = "C", Country = "X" });
        db.Offers.Add(new Offer { OfferId = 1, ListingId = 1, BuyerId = 20, Status = OfferStatus.Accepted });
        db.Inspections.Add(new Inspection { InspectionId = 1, ListingId = 1, OfferId = 1, InspectorId = 7, AgentId = 5, Status = InspectionStatus.InProgress, ScheduledDate = DateTime.UtcNow });
        await db.SaveChangesAsync();

        _repo.Setup(r => r.GetByListingIdAsync(1, It.IsAny<CancellationToken>()))
             .ReturnsAsync(BuildActiveTransaction());

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            BuildSut(db).CloseTransactionAsync(agentId: 5, listingId: 1));
    }

    [Fact]
    public async Task CloseTransaction_VerdictNotSubmitted_ThrowsBusinessRuleException()
    {
        using var db = CreateDb();
        db.Listings.Add(new Listing { ListingId = 1, AgentId = 5, OwnerId = 10, Title = "T", Description = "D", Address = "A", City = "C", Country = "X" });
        db.Offers.Add(new Offer { OfferId = 1, ListingId = 1, BuyerId = 20, Status = OfferStatus.Accepted });
        var unlockedReport = new InspectionReport { ReportId = 1, InspectionId = 1, IsLocked = false };
        db.Inspections.Add(new Inspection { InspectionId = 1, ListingId = 1, OfferId = 1, InspectorId = 7, AgentId = 5, Status = InspectionStatus.Completed, ScheduledDate = DateTime.UtcNow, Report = unlockedReport });
        await db.SaveChangesAsync();

        _repo.Setup(r => r.GetByListingIdAsync(1, It.IsAny<CancellationToken>()))
             .ReturnsAsync(BuildActiveTransaction());

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            BuildSut(db).CloseTransactionAsync(agentId: 5, listingId: 1));
    }

    [Fact]
    public async Task CloseTransaction_HasOpenDisputes_ThrowsBusinessRuleException()
    {
        using var db = CreateDb();
        db.Listings.Add(new Listing { ListingId = 1, AgentId = 5, OwnerId = 10, Title = "T", Description = "D", Address = "A", City = "C", Country = "X" });
        db.Offers.Add(new Offer { OfferId = 1, ListingId = 1, BuyerId = 20, Status = OfferStatus.Accepted });
        var lockedReport = new InspectionReport { ReportId = 1, InspectionId = 1, IsLocked = true };
        db.Inspections.Add(new Inspection { InspectionId = 1, ListingId = 1, OfferId = 1, InspectorId = 7, AgentId = 5, Status = InspectionStatus.Completed, ScheduledDate = DateTime.UtcNow, Report = lockedReport });
        db.Disputes.Add(new Dispute { DisputeId = 1, TransactionId = 100, SubmittedById = 20, Description = "Issue", Status = DisputeStatus.Open });
        await db.SaveChangesAsync();

        _repo.Setup(r => r.GetByListingIdAsync(1, It.IsAny<CancellationToken>()))
             .ReturnsAsync(BuildActiveTransaction());

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            BuildSut(db).CloseTransactionAsync(agentId: 5, listingId: 1));
    }
}
