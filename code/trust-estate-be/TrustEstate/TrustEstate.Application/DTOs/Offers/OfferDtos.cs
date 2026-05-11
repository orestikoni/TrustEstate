using System.ComponentModel.DataAnnotations;

namespace TrustEstate.Application.DTOs.Offers;

public sealed record SubmitOfferRequest
{
    [Required]
    [Range(1, int.MaxValue)]
    public int ListingId { get; init; }

    [Range(0.01, double.MaxValue, ErrorMessage = "ProposedPrice must be greater than zero.")]
    public decimal ProposedPrice { get; init; }

    [MaxLength(1000)]
    public string? Message { get; init; }
}

public sealed record CounterOfferRequest
{
    [Range(0.01, double.MaxValue, ErrorMessage = "RevisedPrice must be greater than zero.")]
    public decimal RevisedPrice { get; init; }

    [Required]
    public DateTime ResponseDeadline { get; init; }

    [MaxLength(1000)]
    public string? Message { get; init; }
}

public sealed record SubmitRevisedOfferRequest
{
    [Range(0.01, double.MaxValue, ErrorMessage = "RevisedPrice must be greater than zero.")]
    public decimal RevisedPrice { get; init; }

    [MaxLength(1000)]
    public string? Message { get; init; }
}

public sealed record RevisedOfferAfterInspectionRequest
{
    [Range(0.01, double.MaxValue, ErrorMessage = "RevisedPrice must be greater than zero.")]
    public decimal RevisedPrice { get; init; }
}

public sealed record OfferDto
{
    public int OfferId { get; init; }
    public int ListingId { get; init; }
    public int BuyerId { get; init; }
    public string BuyerFullName { get; init; } = string.Empty;
    public decimal ProposedPrice { get; init; }
    public string? Message { get; init; }
    public string Status { get; init; } = string.Empty;
    public int NegotiationRound { get; init; }
    public DateTime? ResponseDeadline { get; init; }
    public DateTime SubmittedAt { get; init; }
    public DateTime? ResolvedAt { get; init; }
    public IEnumerable<NegotiationDto> Negotiations { get; init; } = Enumerable.Empty<NegotiationDto>();
}

public sealed record NegotiationDto
{
    public int NegotiationId { get; init; }
    public int OfferId { get; init; }
    public int RoundNumber { get; init; }
    public string ActorRole { get; init; } = string.Empty;
    public decimal ProposedPrice { get; init; }
    public string? Message { get; init; }
    public string Action { get; init; } = string.Empty;
    public DateTime? ResponseDeadline { get; init; }
    public DateTime CreatedAt { get; init; }
}

public sealed record PostInspectionOptionsDto
{
    public bool WindowOpen { get; init; }
    public DateTime? WindowExpiresAt { get; init; }
    public string VerdictStatus { get; init; } = string.Empty;
    public bool CanWithdraw { get; init; }
    public bool CanRevise { get; init; }
}
