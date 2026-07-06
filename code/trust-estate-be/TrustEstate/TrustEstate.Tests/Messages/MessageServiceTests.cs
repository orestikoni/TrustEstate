using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;
using TrustEstate.Application.DTOs.Messages;
using TrustEstate.Application.Interfaces.Messages;
using TrustEstate.Application.Interfaces.Notifications;
using TrustEstate.Domain.Entities;
using TrustEstate.Domain.Enums;
using TrustEstate.Domain.Exceptions;
using TrustEstate.Infrastructure.Persistence;
using TrustEstate.Infrastructure.Services;

namespace TrustEstate.Tests.Messages;

public class MessageServiceTests
{
    private readonly Mock<IMessageRepository> _repo = new();
    private readonly Mock<INotificationService> _notifications = new();

    private static TrustEstateDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<TrustEstateDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new TrustEstateDbContext(options);
    }

    private MessageService BuildSut(TrustEstateDbContext db) =>
        new MessageService(_repo.Object, _notifications.Object, db);

    private void SetupNotificationsToComplete()
    {
        _notifications.Setup(n => n.CreateAsync(
            It.IsAny<int>(), It.IsAny<NotificationType>(), It.IsAny<string>(),
            It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<int?>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
    }

    // ── SendMessageAsync ─────────────────────────────────────────────────────

    [Fact]
    public async Task SendMessage_OwnerToAgent_SendsMessageSuccessfully()
    {
        using var db = CreateDb();
        var owner = new User { Id = 10, FirstName = "Owner", LastName = "O", Email = "o@x.com", PasswordHash = "h", Role = UserRole.PropertyOwner, AccountStatus = AccountStatus.Active };
        var agent = new User { Id = 5, FirstName = "Agent", LastName = "A", Email = "a@x.com", PasswordHash = "h", Role = UserRole.Agent, AccountStatus = AccountStatus.Active };
        db.Users.AddRange(owner, agent);
        db.Listings.Add(new Listing { ListingId = 1, OwnerId = 10, AgentId = 5, Status = ListingStatus.Active, Title = "Home", Description = "D", Address = "A", City = "C", Country = "X" });
        await db.SaveChangesAsync();

        var thread = new MessageThread { ThreadId = 1, ListingId = 1, ParticipantOneId = 10, ParticipantTwoId = 5, CreatedAt = DateTime.UtcNow };
        _repo.Setup(r => r.GetThreadByParticipantsAsync(10, 5, 1, It.IsAny<CancellationToken>())).ReturnsAsync(thread);

        Message? capturedMessage = null;
        _repo.Setup(r => r.AddMessageAsync(It.IsAny<Message>(), It.IsAny<CancellationToken>()))
             .Callback<Message, CancellationToken>((m, _) => capturedMessage = m)
             .Returns(Task.CompletedTask);
        _repo.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        SetupNotificationsToComplete();

        var request = new SendMessageRequest { RecipientId = 5, ListingId = 1, Content = "Hello Agent" };
        var result = await BuildSut(db).SendMessageAsync(senderId: 10, request);

        Assert.Equal("Hello Agent", result.Content);
        Assert.Equal(10, result.SenderId);
        Assert.Equal(5, result.ReceiverId);
        Assert.NotNull(capturedMessage);
    }

    [Fact]
    public async Task SendMessage_BuyerWithoutOffer_ThrowsForbiddenException()
    {
        using var db = CreateDb();
        var buyer = new User { Id = 30, FirstName = "Buyer", LastName = "B", Email = "b@x.com", PasswordHash = "h", Role = UserRole.Buyer, AccountStatus = AccountStatus.Active };
        var agent = new User { Id = 5, FirstName = "Agent", LastName = "A", Email = "a@x.com", PasswordHash = "h", Role = UserRole.Agent, AccountStatus = AccountStatus.Active };
        db.Users.AddRange(buyer, agent);
        db.Listings.Add(new Listing { ListingId = 1, OwnerId = 10, AgentId = 5, Status = ListingStatus.Active, Title = "Home", Description = "D", Address = "A", City = "C", Country = "X" });
        await db.SaveChangesAsync();

        var request = new SendMessageRequest { RecipientId = 5, ListingId = 1, Content = "Hi" };

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            BuildSut(db).SendMessageAsync(senderId: 30, request));
    }

    [Fact]
    public async Task SendMessage_BuyerWithOffer_SendsMessageSuccessfully()
    {
        using var db = CreateDb();
        var buyer = new User { Id = 30, FirstName = "Buyer", LastName = "B", Email = "b@x.com", PasswordHash = "h", Role = UserRole.Buyer, AccountStatus = AccountStatus.Active };
        var agent = new User { Id = 5, FirstName = "Agent", LastName = "A", Email = "a@x.com", PasswordHash = "h", Role = UserRole.Agent, AccountStatus = AccountStatus.Active };
        db.Users.AddRange(buyer, agent);
        db.Listings.Add(new Listing { ListingId = 1, OwnerId = 10, AgentId = 5, Status = ListingStatus.Active, Title = "Home", Description = "D", Address = "A", City = "C", Country = "X" });
        db.Offers.Add(new Offer { OfferId = 1, ListingId = 1, BuyerId = 30, Status = OfferStatus.Pending, ProposedPrice = 100_000m });
        await db.SaveChangesAsync();

        var thread = new MessageThread { ThreadId = 1, ListingId = 1, ParticipantOneId = 30, ParticipantTwoId = 5, CreatedAt = DateTime.UtcNow };
        _repo.Setup(r => r.GetThreadByParticipantsAsync(30, 5, 1, It.IsAny<CancellationToken>())).ReturnsAsync(thread);
        _repo.Setup(r => r.AddMessageAsync(It.IsAny<Message>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _repo.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        SetupNotificationsToComplete();

        var request = new SendMessageRequest { RecipientId = 5, ListingId = 1, Content = "Interested!" };
        var result = await BuildSut(db).SendMessageAsync(senderId: 30, request);

        Assert.Equal(30, result.SenderId);
        Assert.Equal(5, result.ReceiverId);
    }

    // ── GetThreadMessagesAsync ───────────────────────────────────────────────

    [Fact]
    public async Task GetThreadMessages_NonParticipant_ThrowsForbiddenException()
    {
        using var db = CreateDb();
        var thread = new MessageThread { ThreadId = 1, ListingId = 1, ParticipantOneId = 10, ParticipantTwoId = 5, CreatedAt = DateTime.UtcNow };
        _repo.Setup(r => r.GetThreadByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(thread);

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            BuildSut(db).GetThreadMessagesAsync(userId: 99, threadId: 1));
    }

    [Fact]
    public async Task GetThreadMessages_ThreadNotFound_ThrowsNotFoundException()
    {
        using var db = CreateDb();
        _repo.Setup(r => r.GetThreadByIdAsync(999, It.IsAny<CancellationToken>())).ReturnsAsync((MessageThread?)null);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            BuildSut(db).GetThreadMessagesAsync(userId: 10, threadId: 999));
    }
}
