using TrustEstate.Application.DTOs.Notifications;
using TrustEstate.Application.Interfaces.Notifications;
using TrustEstate.Domain.Entities;
using TrustEstate.Domain.Enums;
using TrustEstate.Domain.Exceptions;

namespace TrustEstate.Infrastructure.Services;

public sealed class NotificationService : INotificationService
{
    private readonly INotificationRepository _repo;

    public NotificationService(INotificationRepository repo) => _repo = repo;

    public async Task CreateAsync(int userId, NotificationType type, string title, string body,
        string? relatedEntityType = null, int? relatedEntityId = null, CancellationToken ct = default)
    {
        var notification = new Notification
        {
            UserId = userId,
            Type = type,
            Title = title,
            Body = body,
            RelatedEntityType = relatedEntityType,
            RelatedEntityId = relatedEntityId,
            CreatedAt = DateTime.UtcNow,
        };
        await _repo.AddAsync(notification, ct);
        await _repo.SaveChangesAsync(ct);
    }

    public async Task<IEnumerable<NotificationDto>> GetUserNotificationsAsync(int userId, CancellationToken ct = default)
    {
        var notifications = await _repo.GetByUserIdAsync(userId, ct);
        return notifications.Select(MapToDto);
    }

    public async Task MarkAsReadAsync(int userId, int notificationId, CancellationToken ct = default)
    {
        var notification = await _repo.GetByIdAsync(notificationId, ct)
            ?? throw new NotFoundException(nameof(Notification), notificationId);

        if (notification.UserId != userId)
            throw new ForbiddenException("You cannot mark this notification as read.");

        if (!notification.IsRead)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
            _repo.Update(notification);
            await _repo.SaveChangesAsync(ct);
        }
    }

    public async Task MarkAllAsReadAsync(int userId, CancellationToken ct = default)
    {
        await _repo.MarkAllReadAsync(userId, ct);
        await _repo.SaveChangesAsync(ct);
    }

    public Task<int> GetUnreadCountAsync(int userId, CancellationToken ct = default)
        => _repo.GetUnreadCountAsync(userId, ct);

    private static NotificationDto MapToDto(Notification n) => new()
    {
        NotificationId = n.NotificationId,
        UserId = n.UserId,
        Type = n.Type.ToString(),
        Title = n.Title,
        Body = n.Body,
        IsRead = n.IsRead,
        RelatedEntityType = n.RelatedEntityType,
        RelatedEntityId = n.RelatedEntityId,
        CreatedAt = n.CreatedAt,
        ReadAt = n.ReadAt,
    };
}
