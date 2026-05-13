using Microsoft.EntityFrameworkCore;
using TrustEstate.Application.Interfaces.Notifications;
using TrustEstate.Domain.Entities;

namespace TrustEstate.Infrastructure.Persistence.Repositories;

public sealed class NotificationRepository : INotificationRepository
{
    private readonly TrustEstateDbContext _db;

    public NotificationRepository(TrustEstateDbContext db) => _db = db;

    public async Task<IEnumerable<Notification>> GetByUserIdAsync(int userId, CancellationToken ct = default)
        => await _db.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync(ct);

    public Task<Notification?> GetByIdAsync(int notificationId, CancellationToken ct = default)
        => _db.Notifications.FirstOrDefaultAsync(n => n.NotificationId == notificationId, ct);

    public Task<int> GetUnreadCountAsync(int userId, CancellationToken ct = default)
        => _db.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead, ct);

    public async Task AddAsync(Notification notification, CancellationToken ct = default)
        => await _db.Notifications.AddAsync(notification, ct);

    public void Update(Notification notification)
        => _db.Notifications.Update(notification);

    public async Task MarkAllReadAsync(int userId, CancellationToken ct = default)
    {
        var unread = await _db.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync(ct);

        foreach (var n in unread)
        {
            n.IsRead = true;
            n.ReadAt = DateTime.UtcNow;
        }
    }

    public Task SaveChangesAsync(CancellationToken ct = default)
        => _db.SaveChangesAsync(ct);
}
