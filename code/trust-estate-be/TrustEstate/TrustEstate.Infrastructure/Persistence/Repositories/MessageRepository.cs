using Microsoft.EntityFrameworkCore;
using TrustEstate.Application.Interfaces.Messages;
using TrustEstate.Domain.Entities;
using TrustEstate.Domain.Enums;

namespace TrustEstate.Infrastructure.Persistence.Repositories;

public sealed class MessageRepository : IMessageRepository
{
    private readonly TrustEstateDbContext _db;

    public MessageRepository(TrustEstateDbContext db) => _db = db;

    public Task<MessageThread?> GetThreadByIdAsync(int threadId, CancellationToken ct = default)
        => _db.MessageThreads
            .Include(t => t.Listing)
            .Include(t => t.ParticipantOne)
            .Include(t => t.ParticipantTwo)
            .FirstOrDefaultAsync(t => t.ThreadId == threadId, ct);

    public Task<MessageThread?> GetThreadByParticipantsAsync(int participantOneId, int participantTwoId, int listingId, CancellationToken ct = default)
        => _db.MessageThreads
            .Include(t => t.Listing)
            .Include(t => t.ParticipantOne)
            .Include(t => t.ParticipantTwo)
            .FirstOrDefaultAsync(t =>
                t.ListingId == listingId &&
                ((t.ParticipantOneId == participantOneId && t.ParticipantTwoId == participantTwoId) ||
                 (t.ParticipantOneId == participantTwoId && t.ParticipantTwoId == participantOneId)), ct);

    public async Task<IEnumerable<MessageThread>> GetUserThreadsAsync(int userId, CancellationToken ct = default)
        => await _db.MessageThreads
            .Include(t => t.Listing)
            .Include(t => t.ParticipantOne)
            .Include(t => t.ParticipantTwo)
            .Include(t => t.Messages.OrderByDescending(m => m.SentAt).Take(1))
            .Where(t => t.ParticipantOneId == userId || t.ParticipantTwoId == userId)
            .OrderByDescending(t => t.Messages.Max(m => (DateTime?)m.SentAt) ?? t.CreatedAt)
            .ToListAsync(ct);

    public async Task<IEnumerable<Message>> GetThreadMessagesAsync(int threadId, CancellationToken ct = default)
        => await _db.Messages
            .Include(m => m.Sender)
            .Where(m => m.ThreadId == threadId)
            .OrderBy(m => m.SentAt)
            .ToListAsync(ct);

    public Task<bool> HasMessagingRelationshipAsync(int userId, int recipientId, CancellationToken ct = default)
        => _db.Offers.AnyAsync(o =>
            (o.BuyerId == userId && o.Listing.AgentId != null) ||
            (o.BuyerId == recipientId && o.Listing.AgentId != null) ||
            (o.Listing.OwnerId == userId) ||
            (o.Listing.OwnerId == recipientId), ct);

    public async Task AddThreadAsync(MessageThread thread, CancellationToken ct = default)
        => await _db.MessageThreads.AddAsync(thread, ct);

    public async Task AddMessageAsync(Message message, CancellationToken ct = default)
        => await _db.Messages.AddAsync(message, ct);

    public Task SaveChangesAsync(CancellationToken ct = default)
        => _db.SaveChangesAsync(ct);
}
