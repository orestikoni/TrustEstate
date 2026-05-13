using TrustEstate.Domain.Entities;

namespace TrustEstate.Application.Interfaces.Notifications;

public interface INotificationRepository
{
    Task<IEnumerable<Notification>> GetByUserIdAsync(int userId, CancellationToken ct = default);
    Task<Notification?> GetByIdAsync(int notificationId, CancellationToken ct = default);
    Task<int> GetUnreadCountAsync(int userId, CancellationToken ct = default);
    Task AddAsync(Notification notification, CancellationToken ct = default);
    void Update(Notification notification);
    Task MarkAllReadAsync(int userId, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
