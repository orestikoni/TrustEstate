namespace TrustEstate.Application.DTOs.Notifications;

public sealed record NotificationDto
{
    public int NotificationId { get; init; }
    public int UserId { get; init; }
    public string Type { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string Body { get; init; } = string.Empty;
    public bool IsRead { get; init; }
    public string? RelatedEntityType { get; init; }
    public int? RelatedEntityId { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? ReadAt { get; init; }
}

public sealed record UnreadCountDto
{
    public int Count { get; init; }
}
