using TrustEstate.Application.DTOs.Notifications;
using TrustEstate.Domain.Enums;

namespace TrustEstate.Application.Interfaces.Notifications;

public interface INotificationService
{
    Task CreateAsync(int userId, NotificationType type, string title, string body, string? relatedEntityType = null, int? relatedEntityId = null, CancellationToken ct = default);
    Task<IEnumerable<NotificationDto>> GetUserNotificationsAsync(int userId, CancellationToken ct = default);
    Task MarkAsReadAsync(int userId, int notificationId, CancellationToken ct = default);
    Task MarkAllAsReadAsync(int userId, CancellationToken ct = default);
    Task<int> GetUnreadCountAsync(int userId, CancellationToken ct = default);
}
