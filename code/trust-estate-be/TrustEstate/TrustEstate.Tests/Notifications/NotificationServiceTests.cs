using Moq;
using Xunit;
using TrustEstate.Application.Interfaces.Notifications;
using TrustEstate.Domain.Entities;
using TrustEstate.Domain.Enums;
using TrustEstate.Domain.Exceptions;
using TrustEstate.Infrastructure.Services;

namespace TrustEstate.Tests.Notifications;

public class NotificationServiceTests
{
    private readonly Mock<INotificationRepository> _repo = new();
    private readonly NotificationService _sut;

    public NotificationServiceTests()
    {
        _sut = new NotificationService(_repo.Object);
    }

    // ── CreateAsync ──────────────────────────────────────────────────────────

    [Fact]
    public async Task Create_ValidInput_AddsAndSavesNotification()
    {
        Notification? captured = null;
        _repo.Setup(r => r.AddAsync(It.IsAny<Notification>(), It.IsAny<CancellationToken>()))
             .Callback<Notification, CancellationToken>((n, _) => captured = n)
             .Returns(Task.CompletedTask);
        _repo.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        await _sut.CreateAsync(userId: 1, NotificationType.OfferResponse, "Title", "Body", "Offer", 42);

        Assert.NotNull(captured);
        Assert.Equal(1, captured!.UserId);
        Assert.Equal("Title", captured.Title);
        Assert.Equal("Body", captured.Body);
        Assert.Equal("Offer", captured.RelatedEntityType);
        Assert.Equal(42, captured.RelatedEntityId);
    }

    // ── MarkAsReadAsync ──────────────────────────────────────────────────────

    [Fact]
    public async Task MarkAsRead_OwnNotification_SetsIsReadTrue()
    {
        var notification = new Notification { NotificationId = 1, UserId = 5, IsRead = false, Title = "T", Body = "B", Type = NotificationType.OfferResponse };
        _repo.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(notification);
        _repo.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        await _sut.MarkAsReadAsync(userId: 5, notificationId: 1);

        Assert.True(notification.IsRead);
        Assert.NotNull(notification.ReadAt);
    }

    [Fact]
    public async Task MarkAsRead_OtherUsersNotification_ThrowsForbiddenException()
    {
        var notification = new Notification { NotificationId = 1, UserId = 5, IsRead = false, Title = "T", Body = "B", Type = NotificationType.OfferResponse };
        _repo.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(notification);

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            _sut.MarkAsReadAsync(userId: 99, notificationId: 1));
    }

    [Fact]
    public async Task MarkAsRead_AlreadyRead_DoesNotCallSaveChanges()
    {
        var notification = new Notification { NotificationId = 1, UserId = 5, IsRead = true, Title = "T", Body = "B", Type = NotificationType.OfferResponse };
        _repo.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(notification);

        await _sut.MarkAsReadAsync(userId: 5, notificationId: 1);

        _repo.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    // ── GetUnreadCountAsync ──────────────────────────────────────────────────

    [Fact]
    public async Task GetUnreadCount_DelegatesToRepository()
    {
        _repo.Setup(r => r.GetUnreadCountAsync(7, It.IsAny<CancellationToken>())).ReturnsAsync(3);

        var count = await _sut.GetUnreadCountAsync(userId: 7);

        Assert.Equal(3, count);
    }

    // ── MarkAllAsReadAsync ───────────────────────────────────────────────────

    [Fact]
    public async Task MarkAllAsRead_CallsRepositoryMarkAllAndSave()
    {
        _repo.Setup(r => r.MarkAllReadAsync(5, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _repo.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        await _sut.MarkAllAsReadAsync(userId: 5);

        _repo.Verify(r => r.MarkAllReadAsync(5, It.IsAny<CancellationToken>()), Times.Once);
        _repo.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
