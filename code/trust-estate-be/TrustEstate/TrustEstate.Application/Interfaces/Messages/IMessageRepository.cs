using TrustEstate.Domain.Entities;

namespace TrustEstate.Application.Interfaces.Messages;

public interface IMessageRepository
{
    Task<MessageThread?> GetThreadByIdAsync(int threadId, CancellationToken ct = default);
    Task<MessageThread?> GetThreadByParticipantsAsync(int participantOneId, int participantTwoId, int listingId, CancellationToken ct = default);
    Task<IEnumerable<MessageThread>> GetUserThreadsAsync(int userId, CancellationToken ct = default);
    Task<IEnumerable<Message>> GetThreadMessagesAsync(int threadId, CancellationToken ct = default);
    Task<bool> HasMessagingRelationshipAsync(int userId, int recipientId, CancellationToken ct = default);
    Task AddThreadAsync(MessageThread thread, CancellationToken ct = default);
    Task AddMessageAsync(Message message, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
