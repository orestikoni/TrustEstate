using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;
using TrustEstate.Application.DTOs.Disputes;
using TrustEstate.Application.Interfaces.Disputes;
using TrustEstate.Application.Interfaces.Notifications;
using TrustEstate.Domain.Entities;
using TrustEstate.Domain.Enums;
using TrustEstate.Domain.Exceptions;
using TrustEstate.Infrastructure.Persistence;
using TrustEstate.Infrastructure.Services;

namespace TrustEstate.Tests.Disputes;

public class DisputeServiceTests
{
    private readonly Mock<IDisputeRepository> _repo = new();
    private readonly Mock<INotificationService> _notifications = new();

    private static TrustEstateDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<TrustEstateDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new TrustEstateDbContext(options);
    }

    private DisputeService BuildSut(TrustEstateDbContext db) =>
        new DisputeService(_repo.Object, _notifications.Object, db);

    private void SetupRepoToComplete()
    {
        _repo.Setup(r => r.AddAsync(It.IsAny<Dispute>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _repo.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
    }

    private void SetupNotificationsToComplete()
    {
        _notifications.Setup(n => n.CreateAsync(
            It.IsAny<int>(), It.IsAny<NotificationType>(), It.IsAny<string>(),
            It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<int?>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
    }

    // ── SubmitDisputeAsync ───────────────────────────────────────────────────

    [Fact]
    public async Task SubmitDispute_ValidParticipantBuyer_CreatesDisputeAndSetsTransactionToDisputed()
    {
        using var db = CreateDb();
        db.Listings.Add(new Listing { ListingId = 1, OwnerId = 10, AgentId = 5, Title = "Home", Description = "D", Address = "A", City = "C", Country = "X" });
        var transaction = new Transaction { TransactionId = 1, ListingId = 1, OfferId = 1, AgentId = 5, OwnerId = 10, BuyerId = 20, Status = TransactionStatus.Active };
        db.Transactions.Add(transaction);
        db.Users.Add(new User { Id = 20, FirstName = "Bob", LastName = "Buyer", Email = "bob@x.com", PasswordHash = "h", Role = UserRole.Buyer, AccountStatus = AccountStatus.Active });
        await db.SaveChangesAsync();

        SetupRepoToComplete();
        SetupNotificationsToComplete();

        var request = new SubmitDisputeRequest { ListingId = 1, Description = "Price dispute" };

        // SubmitDisputeAsync calls MapToDtoAsync which queries _db.Disputes — seed it via callback
        _repo.Setup(r => r.AddAsync(It.IsAny<Dispute>(), It.IsAny<CancellationToken>()))
             .Callback<Dispute, CancellationToken>((d, _) =>
             {
                 d.DisputeId = 99;
                 d.SubmittedBy = db.Users.Find(20)!;
                 db.Disputes.Add(d);
                 db.SaveChanges();
             })
             .Returns(Task.CompletedTask);

        var result = await BuildSut(db).SubmitDisputeAsync(userId: 20, request);

        Assert.Equal("Open", result.Status);
        Assert.Equal(20, result.SubmittedById);

        var savedTx = await db.Transactions.FindAsync(1);
        Assert.Equal(TransactionStatus.Disputed, savedTx!.Status);
    }

    [Fact]
    public async Task SubmitDispute_NonParticipant_ThrowsForbiddenException()
    {
        using var db = CreateDb();
        db.Listings.Add(new Listing { ListingId = 1, OwnerId = 10, AgentId = 5, Title = "Home", Description = "D", Address = "A", City = "C", Country = "X" });
        db.Transactions.Add(new Transaction { TransactionId = 1, ListingId = 1, OfferId = 1, AgentId = 5, OwnerId = 10, BuyerId = 20, Status = TransactionStatus.Active });
        await db.SaveChangesAsync();

        var request = new SubmitDisputeRequest { ListingId = 1, Description = "Issue" };

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            BuildSut(db).SubmitDisputeAsync(userId: 99, request));
    }

    [Fact]
    public async Task SubmitDispute_ClosedTransaction_ThrowsBusinessRuleException()
    {
        using var db = CreateDb();
        db.Listings.Add(new Listing { ListingId = 1, OwnerId = 10, AgentId = 5, Title = "Home", Description = "D", Address = "A", City = "C", Country = "X" });
        db.Transactions.Add(new Transaction { TransactionId = 1, ListingId = 1, OfferId = 1, AgentId = 5, OwnerId = 10, BuyerId = 20, Status = TransactionStatus.Closed });
        await db.SaveChangesAsync();

        var request = new SubmitDisputeRequest { ListingId = 1, Description = "Issue" };

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            BuildSut(db).SubmitDisputeAsync(userId: 20, request));
    }

    // ── GetDisputeFormAsync ──────────────────────────────────────────────────

    [Fact]
    public async Task GetDisputeForm_ValidParticipant_ReturnsFormDto()
    {
        using var db = CreateDb();
        db.Listings.Add(new Listing { ListingId = 1, OwnerId = 10, AgentId = 5, Title = "Nice House", Description = "D", Address = "A", City = "C", Country = "X" });
        db.Transactions.Add(new Transaction { TransactionId = 1, ListingId = 1, OfferId = 1, AgentId = 5, OwnerId = 10, BuyerId = 20, Status = TransactionStatus.Active });
        await db.SaveChangesAsync();

        var result = await BuildSut(db).GetDisputeFormAsync(userId: 20, listingId: 1);

        Assert.Equal(1, result.ListingId);
        Assert.Equal("Nice House", result.ListingTitle);
        Assert.Equal("Active", result.TransactionStatus);
    }

    [Fact]
    public async Task GetDisputeForm_ClosedTransaction_ThrowsBusinessRuleException()
    {
        using var db = CreateDb();
        db.Listings.Add(new Listing { ListingId = 1, OwnerId = 10, AgentId = 5, Title = "Home", Description = "D", Address = "A", City = "C", Country = "X" });
        db.Transactions.Add(new Transaction { TransactionId = 1, ListingId = 1, OfferId = 1, AgentId = 5, OwnerId = 10, BuyerId = 20, Status = TransactionStatus.Closed });
        await db.SaveChangesAsync();

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            BuildSut(db).GetDisputeFormAsync(userId: 20, listingId: 1));
    }

    [Fact]
    public async Task GetDisputeForm_NonParticipant_ThrowsForbiddenException()
    {
        using var db = CreateDb();
        db.Listings.Add(new Listing { ListingId = 1, OwnerId = 10, AgentId = 5, Title = "Home", Description = "D", Address = "A", City = "C", Country = "X" });
        db.Transactions.Add(new Transaction { TransactionId = 1, ListingId = 1, OfferId = 1, AgentId = 5, OwnerId = 10, BuyerId = 20, Status = TransactionStatus.Active });
        await db.SaveChangesAsync();

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            BuildSut(db).GetDisputeFormAsync(userId: 999, listingId: 1));
    }

    // ── GetDisputeByIdAsync ──────────────────────────────────────────────────

    [Fact]
    public async Task GetDisputeById_NonParticipant_ThrowsForbiddenException()
    {
        using var db = CreateDb();
        var submitter = new User { Id = 20, FirstName = "Bob", LastName = "B", Email = "b@b.com", PasswordHash = "h", Role = UserRole.Buyer, AccountStatus = AccountStatus.Active };
        var transaction = new Transaction { TransactionId = 1, ListingId = 1, OfferId = 1, AgentId = 5, OwnerId = 10, BuyerId = 20, Status = TransactionStatus.Active };
        db.Users.Add(submitter);
        db.Disputes.Add(new Dispute { DisputeId = 1, TransactionId = 1, SubmittedById = 20, Description = "D", Status = DisputeStatus.Open, SubmittedBy = submitter, Transaction = transaction });
        await db.SaveChangesAsync();

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            BuildSut(db).GetDisputeByIdAsync(userId: 999, disputeId: 1));
    }
}
