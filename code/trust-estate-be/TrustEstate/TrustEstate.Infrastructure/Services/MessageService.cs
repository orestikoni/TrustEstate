using Microsoft.EntityFrameworkCore;
using TrustEstate.Application.DTOs.Messages;
using TrustEstate.Application.Interfaces.Messages;
using TrustEstate.Application.Interfaces.Notifications;
using TrustEstate.Domain.Entities;
using TrustEstate.Domain.Enums;
using TrustEstate.Domain.Exceptions;
using TrustEstate.Infrastructure.Persistence;

namespace TrustEstate.Infrastructure.Services;

public sealed class MessageService : IMessageService
{
    private readonly IMessageRepository _repo;
    private readonly INotificationService _notifications;
    private readonly TrustEstateDbContext _db;

    public MessageService(IMessageRepository repo, INotificationService notifications, TrustEstateDbContext db)
    {
        _repo = repo;
        _notifications = notifications;
        _db = db;
    }

    public async Task<IEnumerable<MessageThreadDto>> GetMessageThreadsAsync(int userId, CancellationToken ct = default)
    {
        var threads = await _repo.GetUserThreadsAsync(userId, ct);

        return threads.Select(t =>
        {
            var lastMsg = t.Messages.MaxBy(m => m.SentAt);
            var unread = t.Messages.Count(m => m.ReceiverId == userId && !m.IsRead);

            return MapThreadToDto(t, lastMsg is null ? null : MapMessageToDto(lastMsg), unread);
        });
    }

    public async Task<MessageDto> SendMessageAsync(int senderId, SendMessageRequest request, CancellationToken ct = default)
    {
        var sender = await _db.Users.FindAsync(senderId)
            ?? throw new NotFoundException("User", senderId);

        var recipient = await _db.Users.FindAsync(request.RecipientId)
            ?? throw new NotFoundException("User", request.RecipientId);

        var listing = await _db.Listings.FindAsync(request.ListingId)
            ?? throw new NotFoundException(nameof(Listing), request.ListingId);

        var isRelated = await IsAllowedToMessageAsync(senderId, request.RecipientId, request.ListingId, ct);
        if (!isRelated)
            throw new ForbiddenException("You are not allowed to message this user for this listing.");

        var thread = await _repo.GetThreadByParticipantsAsync(senderId, request.RecipientId, request.ListingId, ct);
        if (thread is null)
        {
            thread = new MessageThread
            {
                ListingId = request.ListingId,
                ParticipantOneId = senderId,
                ParticipantTwoId = request.RecipientId,
                CreatedAt = DateTime.UtcNow,
            };
            await _repo.AddThreadAsync(thread, ct);
            await _repo.SaveChangesAsync(ct);
        }

        var message = new Message
        {
            ThreadId = thread.ThreadId,
            SenderId = senderId,
            ReceiverId = request.RecipientId,
            Content = request.Content,
            IsRead = false,
            SentAt = DateTime.UtcNow,
        };

        await _repo.AddMessageAsync(message, ct);
        await _repo.SaveChangesAsync(ct);

        await _notifications.CreateAsync(request.RecipientId, NotificationType.MessageReceived,
            $"New message from {sender.FirstName} {sender.LastName}",
            $"{sender.FirstName} sent you a message regarding '{listing.Title}'.",
            "Message", message.MessageId, ct);

        return MapMessageToDto(message, sender);
    }

    public async Task<IEnumerable<MessageDto>> GetThreadMessagesAsync(int userId, int threadId, CancellationToken ct = default)
    {
        var thread = await _repo.GetThreadByIdAsync(threadId, ct)
            ?? throw new NotFoundException("MessageThread", threadId);

        if (thread.ParticipantOneId != userId && thread.ParticipantTwoId != userId)
            throw new ForbiddenException("You are not a participant in this thread.");

        var messages = await _repo.GetThreadMessagesAsync(threadId, ct);

        var unreadByUser = messages
            .Where(m => m.ReceiverId == userId && !m.IsRead)
            .ToList();

        foreach (var msg in unreadByUser)
        {
            msg.IsRead = true;
        }

        if (unreadByUser.Count > 0)
            await _repo.SaveChangesAsync(ct);

        return messages.Select(m => MapMessageToDto(m));
    }

    public async Task<MessageThreadDto> GetOrCreateThreadAsync(int userId, int recipientId, int listingId, CancellationToken ct = default)
    {
        _ = await _db.Listings.FindAsync(listingId)
            ?? throw new NotFoundException(nameof(Listing), listingId);

        _ = await _db.Users.FindAsync(recipientId)
            ?? throw new NotFoundException("User", recipientId);

        var isRelated = await IsAllowedToMessageAsync(userId, recipientId, listingId, ct);
        if (!isRelated)
            throw new ForbiddenException("You are not allowed to message this user for this listing.");

        var thread = await _repo.GetThreadByParticipantsAsync(userId, recipientId, listingId, ct);
        if (thread is null)
        {
            thread = new MessageThread
            {
                ListingId = listingId,
                ParticipantOneId = userId,
                ParticipantTwoId = recipientId,
                CreatedAt = DateTime.UtcNow,
            };
            await _repo.AddThreadAsync(thread, ct);
            await _repo.SaveChangesAsync(ct);

            thread = await _repo.GetThreadByIdAsync(thread.ThreadId, ct)!;
        }

        return MapThreadToDto(thread!, null, 0);
    }

    private async Task<bool> IsAllowedToMessageAsync(int userId, int recipientId, int listingId, CancellationToken ct)
    {
        var listing = await _db.Listings.FindAsync(listingId);
        if (listing is null || !listing.AgentId.HasValue) return false;

        var agentId = listing.AgentId.Value;
        var ownerId = listing.OwnerId;

        // Rule: Owner ↔ Agent only
        bool ownerAgentPair =
            (userId == ownerId && recipientId == agentId) ||
            (userId == agentId && recipientId == ownerId);
        if (ownerAgentPair) return true;

        // Rule: Buyer ↔ Agent only (buyer must have submitted an offer on this listing)
        bool agentIsInvolved = userId == agentId || recipientId == agentId;
        if (!agentIsInvolved) return false;

        int buyerCandidateId = userId == agentId ? recipientId : userId;
        return await _db.Offers
            .AnyAsync(o => o.ListingId == listingId && o.BuyerId == buyerCandidateId, ct);
    }

    private static MessageDto MapMessageToDto(Message m, User? senderOverride = null) => new()
    {
        MessageId = m.MessageId,
        SenderId = m.SenderId,
        SenderFullName = senderOverride is not null
            ? $"{senderOverride.FirstName} {senderOverride.LastName}"
            : m.Sender is not null ? $"{m.Sender.FirstName} {m.Sender.LastName}" : string.Empty,
        ReceiverId = m.ReceiverId,
        ThreadId = m.ThreadId,
        Content = m.Content,
        IsRead = m.IsRead,
        SentAt = m.SentAt,
    };

    private static MessageThreadDto MapThreadToDto(MessageThread t, MessageDto? lastMessage, int unreadCount) => new()
    {
        ThreadId = t.ThreadId,
        ListingId = t.ListingId,
        ListingTitle = t.Listing?.Title ?? string.Empty,
        ParticipantOneId = t.ParticipantOneId,
        ParticipantOneFullName = $"{t.ParticipantOne?.FirstName} {t.ParticipantOne?.LastName}",
        ParticipantTwoId = t.ParticipantTwoId,
        ParticipantTwoFullName = $"{t.ParticipantTwo?.FirstName} {t.ParticipantTwo?.LastName}",
        CreatedAt = t.CreatedAt,
        LastMessage = lastMessage,
        UnreadCount = unreadCount,
    };
}
