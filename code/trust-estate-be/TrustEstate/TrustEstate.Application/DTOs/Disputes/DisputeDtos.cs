using System.ComponentModel.DataAnnotations;

namespace TrustEstate.Application.DTOs.Disputes;

public sealed record SubmitDisputeRequest
{
    [Required]
    [Range(1, int.MaxValue)]
    public int ListingId { get; init; }

    [Required]
    [MaxLength(5000)]
    public string Description { get; init; } = string.Empty;
}

public sealed record DisputeDto
{
    public int DisputeId { get; init; }
    public int TransactionId { get; init; }
    public int SubmittedById { get; init; }
    public string SubmittedByFullName { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public string? ResolutionOutcome { get; init; }
    public DateTime SubmittedAt { get; init; }
    public DateTime? ResolvedAt { get; init; }
}

public sealed record DisputeFormDto
{
    public int ListingId { get; init; }
    public string ListingTitle { get; init; } = string.Empty;
    public int TransactionId { get; init; }
    public string TransactionStatus { get; init; } = string.Empty;
}
