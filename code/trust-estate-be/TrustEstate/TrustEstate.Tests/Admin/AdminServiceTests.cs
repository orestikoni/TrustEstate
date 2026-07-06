using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;
using TrustEstate.Application.Interfaces.Notifications;
using TrustEstate.Domain.Entities;
using TrustEstate.Domain.Enums;
using TrustEstate.Domain.Exceptions;
using TrustEstate.Infrastructure.Persistence;
using TrustEstate.Infrastructure.Services;

namespace TrustEstate.Tests.Admin;

public class AdminServiceTests
{
    private readonly Mock<INotificationService> _notifications = new();

    private static TrustEstateDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<TrustEstateDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new TrustEstateDbContext(options);
    }

    private AdminService BuildSut(TrustEstateDbContext db) =>
        new AdminService(db, _notifications.Object);

    private void SetupNotificationsToComplete()
    {
        _notifications.Setup(n => n.CreateAsync(
            It.IsAny<int>(), It.IsAny<NotificationType>(), It.IsAny<string>(),
            It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<int?>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
    }

    // ── ApproveVerificationAsync ─────────────────────────────────────────────

    [Fact]
    public async Task ApproveVerification_PendingAgent_SetsStatusToActiveAndVerifiesProfile()
    {
        using var db = CreateDb();
        var agent = new User { Id = 1, FirstName = "A", LastName = "B", Email = "a@b.com", PasswordHash = "h", Role = UserRole.Agent, AccountStatus = AccountStatus.Pending };
        var profile = new AgentProfile { UserId = 1, IsVerified = false };
        agent.AgentProfile = profile;
        db.Users.Add(agent);
        db.Set<AgentProfile>().Add(profile);
        await db.SaveChangesAsync();

        await BuildSut(db).ApproveVerificationAsync(userId: 1);

        var saved = await db.Users.Include(u => u.AgentProfile).FirstAsync(u => u.Id == 1);
        Assert.Equal(AccountStatus.Active, saved.AccountStatus);
        Assert.True(saved.AgentProfile!.IsVerified);
        Assert.NotNull(saved.AgentProfile.VerifiedAt);
    }

    [Fact]
    public async Task ApproveVerification_PendingInspector_SetsStatusToActiveAndVerifiesProfile()
    {
        using var db = CreateDb();
        var inspector = new User { Id = 2, FirstName = "C", LastName = "D", Email = "c@d.com", PasswordHash = "h", Role = UserRole.PropertyInspector, AccountStatus = AccountStatus.Pending };
        var profile = new InspectorProfile { UserId = 2, IsVerified = false };
        inspector.InspectorProfile = profile;
        db.Users.Add(inspector);
        db.Set<InspectorProfile>().Add(profile);
        await db.SaveChangesAsync();

        await BuildSut(db).ApproveVerificationAsync(userId: 2);

        var saved = await db.Users.Include(u => u.InspectorProfile).FirstAsync(u => u.Id == 2);
        Assert.Equal(AccountStatus.Active, saved.AccountStatus);
        Assert.True(saved.InspectorProfile!.IsVerified);
    }

    [Fact]
    public async Task ApproveVerification_AlreadyActiveUser_ThrowsInvalidOperationException()
    {
        using var db = CreateDb();
        db.Users.Add(new User { Id = 3, FirstName = "E", LastName = "F", Email = "e@f.com", PasswordHash = "h", Role = UserRole.Agent, AccountStatus = AccountStatus.Active });
        await db.SaveChangesAsync();

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            BuildSut(db).ApproveVerificationAsync(userId: 3));
    }

    // ── RejectVerificationAsync ──────────────────────────────────────────────

    [Fact]
    public async Task RejectVerification_PendingUser_SetsStatusToRejected()
    {
        using var db = CreateDb();
        db.Users.Add(new User { Id = 4, FirstName = "G", LastName = "H", Email = "g@h.com", PasswordHash = "h", Role = UserRole.Agent, AccountStatus = AccountStatus.Pending });
        await db.SaveChangesAsync();

        await BuildSut(db).RejectVerificationAsync(userId: 4, notes: "Incomplete docs");

        var saved = await db.Users.FindAsync(4);
        Assert.Equal(AccountStatus.Rejected, saved!.AccountStatus);
    }

    [Fact]
    public async Task RejectVerification_AlreadyActiveUser_ThrowsInvalidOperationException()
    {
        using var db = CreateDb();
        db.Users.Add(new User { Id = 5, FirstName = "I", LastName = "J", Email = "i@j.com", PasswordHash = "h", Role = UserRole.Agent, AccountStatus = AccountStatus.Active });
        await db.SaveChangesAsync();

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            BuildSut(db).RejectVerificationAsync(userId: 5, notes: null));
    }

    // ── SuspendUserAsync ─────────────────────────────────────────────────────

    [Fact]
    public async Task SuspendUser_ActiveUser_SetsStatusToSuspended()
    {
        using var db = CreateDb();
        db.Users.Add(new User { Id = 6, FirstName = "K", LastName = "L", Email = "k@l.com", PasswordHash = "h", Role = UserRole.Buyer, AccountStatus = AccountStatus.Active });
        await db.SaveChangesAsync();
        SetupNotificationsToComplete();

        await BuildSut(db).SuspendUserAsync(userId: 6, reason: "Policy violation");

        var saved = await db.Users.FindAsync(6);
        Assert.Equal(AccountStatus.Suspended, saved!.AccountStatus);
    }

    [Fact]
    public async Task SuspendUser_AlreadySuspended_ThrowsBusinessRuleException()
    {
        using var db = CreateDb();
        db.Users.Add(new User { Id = 7, FirstName = "M", LastName = "N", Email = "m@n.com", PasswordHash = "h", Role = UserRole.Buyer, AccountStatus = AccountStatus.Suspended });
        await db.SaveChangesAsync();

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            BuildSut(db).SuspendUserAsync(userId: 7, reason: null));
    }

    // ── SuspendListingAsync ──────────────────────────────────────────────────

    [Fact]
    public async Task SuspendListing_ExistingListing_SetsStatusToSuspended()
    {
        using var db = CreateDb();
        db.Listings.Add(new Listing { ListingId = 1, OwnerId = 1, AgentId = 2, Title = "T", Description = "D", Address = "A", City = "C", Country = "X", Status = ListingStatus.Active });
        await db.SaveChangesAsync();

        await BuildSut(db).SuspendListingAsync(listingId: 1, reason: "Fraudulent listing");

        var saved = await db.Listings.FindAsync(1);
        Assert.Equal(ListingStatus.Suspended, saved!.Status);
        Assert.Equal("Fraudulent listing", saved.ModerationNotes);
    }

    // ── RemoveListingAsync ───────────────────────────────────────────────────

    [Fact]
    public async Task RemoveListing_ExistingListing_SetsStatusToRemoved()
    {
        using var db = CreateDb();
        db.Listings.Add(new Listing { ListingId = 2, OwnerId = 1, AgentId = 2, Title = "T", Description = "D", Address = "A", City = "C", Country = "X", Status = ListingStatus.Active });
        await db.SaveChangesAsync();

        await BuildSut(db).RemoveListingAsync(listingId: 2, reason: "Duplicate listing");

        var saved = await db.Listings.FindAsync(2);
        Assert.Equal(ListingStatus.Removed, saved!.Status);
        Assert.Equal("Duplicate listing", saved.ModerationNotes);
    }

    // ── ResolveDisputeAsync ──────────────────────────────────────────────────

    [Fact]
    public async Task ResolveDispute_OpenDispute_SetsStatusToResolved()
    {
        using var db = CreateDb();
        var submitter = new User { Id = 20, FirstName = "Bob", LastName = "B", Email = "bob@x.com", PasswordHash = "h", Role = UserRole.Buyer, AccountStatus = AccountStatus.Active };
        var transaction = new Transaction { TransactionId = 1, ListingId = 1, OfferId = 1, AgentId = 5, OwnerId = 10, BuyerId = 20, Status = TransactionStatus.Disputed };
        db.Users.Add(submitter);
        db.Disputes.Add(new Dispute { DisputeId = 1, TransactionId = 1, SubmittedById = 20, SubmittedBy = submitter, Description = "Issue", Status = DisputeStatus.Open, Transaction = transaction });
        db.Listings.Add(new Listing { ListingId = 1, OwnerId = 10, Title = "My Home", Description = "D", Address = "A", City = "C", Country = "X" });
        await db.SaveChangesAsync();
        SetupNotificationsToComplete();

        await BuildSut(db).ResolveDisputeAsync(disputeId: 1, resolutionOutcome: "Refund issued");

        var saved = await db.Disputes.FindAsync(1);
        Assert.Equal(DisputeStatus.Resolved, saved!.Status);
        Assert.Equal("Refund issued", saved.ResolutionOutcome);
        Assert.NotNull(saved.ResolvedAt);
    }

    [Fact]
    public async Task ResolveDispute_DisputedTransaction_RestoresTransactionToActive()
    {
        using var db = CreateDb();
        var submitter = new User { Id = 20, FirstName = "Bob", LastName = "B", Email = "bob@x.com", PasswordHash = "h", Role = UserRole.Buyer, AccountStatus = AccountStatus.Active };
        var transaction = new Transaction { TransactionId = 2, ListingId = 2, OfferId = 1, AgentId = 5, OwnerId = 10, BuyerId = 20, Status = TransactionStatus.Disputed };
        db.Users.Add(submitter);
        db.Disputes.Add(new Dispute { DisputeId = 2, TransactionId = 2, SubmittedById = 20, SubmittedBy = submitter, Description = "Issue", Status = DisputeStatus.Open, Transaction = transaction });
        db.Listings.Add(new Listing { ListingId = 2, OwnerId = 10, Title = "Listing", Description = "D", Address = "A", City = "C", Country = "X" });
        await db.SaveChangesAsync();
        SetupNotificationsToComplete();

        await BuildSut(db).ResolveDisputeAsync(disputeId: 2, resolutionOutcome: "Dismissed");

        var savedTx = await db.Transactions.FindAsync(2);
        Assert.Equal(TransactionStatus.Active, savedTx!.Status);
    }

    [Fact]
    public async Task ResolveDispute_AlreadyResolved_ThrowsBusinessRuleException()
    {
        using var db = CreateDb();
        var submitter = new User { Id = 20, FirstName = "Bob", LastName = "B", Email = "bob@x.com", PasswordHash = "h", Role = UserRole.Buyer, AccountStatus = AccountStatus.Active };
        var transaction = new Transaction { TransactionId = 3, ListingId = 3, OfferId = 1, AgentId = 5, OwnerId = 10, BuyerId = 20, Status = TransactionStatus.Active };
        db.Users.Add(submitter);
        db.Disputes.Add(new Dispute { DisputeId = 3, TransactionId = 3, SubmittedById = 20, SubmittedBy = submitter, Description = "Issue", Status = DisputeStatus.Resolved, Transaction = transaction });
        await db.SaveChangesAsync();

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            BuildSut(db).ResolveDisputeAsync(disputeId: 3, resolutionOutcome: "Again"));
    }

    // ── VerifyUserAsync ──────────────────────────────────────────────────────

    [Fact]
    public async Task VerifyUser_BuyerRole_ThrowsBusinessRuleException()
    {
        using var db = CreateDb();
        db.Users.Add(new User { Id = 8, FirstName = "O", LastName = "P", Email = "o@p.com", PasswordHash = "h", Role = UserRole.Buyer, AccountStatus = AccountStatus.Active });
        await db.SaveChangesAsync();

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            BuildSut(db).VerifyUserAsync(userId: 8));
    }
}
