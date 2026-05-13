using TrustEstate.Application.DTOs.Messages;

namespace TrustEstate.Application.Interfaces.Messages;

public interface IMessageService
{
    Task<IEnumerable<MessageThreadDto>> GetMessageThreadsAsync(int userId, CancellationToken ct = default);
    Task<MessageDto> SendMessageAsync(int senderId, SendMessageRequest request, CancellationToken ct = default);
    Task<IEnumerable<MessageDto>> GetThreadMessagesAsync(int userId, int threadId, CancellationToken ct = default);
    Task<MessageThreadDto> GetOrCreateThreadAsync(int userId, int recipientId, int listingId, CancellationToken ct = default);
}
