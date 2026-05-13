using System.ComponentModel.DataAnnotations;

namespace TrustEstate.Application.DTOs.Messages;

public sealed record SendMessageRequest
{
    [Required]
    [Range(1, int.MaxValue)]
    public int RecipientId { get; init; }

    [Required]
    [Range(1, int.MaxValue)]
    public int ListingId { get; init; }

    [Required]
    [MaxLength(5000)]
    public string Content { get; init; } = string.Empty;
}

public sealed record MessageDto
{
    public int MessageId { get; init; }
    public int SenderId { get; init; }
    public string SenderFullName { get; init; } = string.Empty;
    public int ReceiverId { get; init; }
    public int ThreadId { get; init; }
    public string Content { get; init; } = string.Empty;
    public bool IsRead { get; init; }
    public DateTime SentAt { get; init; }
}

public sealed record MessageThreadDto
{
    public int ThreadId { get; init; }
    public int ListingId { get; init; }
    public string ListingTitle { get; init; } = string.Empty;
    public int ParticipantOneId { get; init; }
    public string ParticipantOneFullName { get; init; } = string.Empty;
    public int ParticipantTwoId { get; init; }
    public string ParticipantTwoFullName { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
    public MessageDto? LastMessage { get; init; }
    public int UnreadCount { get; init; }
}
