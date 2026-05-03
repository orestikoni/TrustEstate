using System.ComponentModel.DataAnnotations;

namespace TrustEstate.Application.DTOs.Listings;

public sealed record PagedResult<T>
{
    public IEnumerable<T> Items { get; init; } = Enumerable.Empty<T>();
    public int TotalCount { get; init; }
    public int Page { get; init; }
    public int PageSize { get; init; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}


/// <summary>POST /api/listings — Property Owner creates a listing</summary>
public sealed record CreateListingRequest
{
    [Required]
    [MaxLength(200)]
    public string Title { get; init; } = string.Empty;

    [Required]
    [MaxLength(2000)]
    public string Description { get; init; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string Location { get; init; } = string.Empty;

    [Range(0.01, double.MaxValue, ErrorMessage = "AskingPrice must be greater than zero.")]
    public decimal AskingPrice { get; init; }

    [Required]
    public string ListingType { get; init; } = string.Empty; // "Sale" | "Rent"

    [Range(1, int.MaxValue, ErrorMessage = "A valid AgentId is required.")]
    public int AgentId { get; init; }
}

/// <summary>PUT /api/listings/{id} — Owner edits a listing</summary>
public sealed record UpdateListingRequest
{
    [Required]
    [MaxLength(200)]
    public string Title { get; init; } = string.Empty;

    [Required]
    [MaxLength(2000)]
    public string Description { get; init; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string Location { get; init; } = string.Empty;

    [Range(0.01, double.MaxValue, ErrorMessage = "AskingPrice must be greater than zero.")]
    public decimal AskingPrice { get; init; }

    [Required]
    public string ListingType { get; init; } = string.Empty;
}

/// <summary>PUT /api/listings/{id}/request-corrections — Agent requests corrections</summary>
public sealed record RequestCorrectionsRequest
{
    [Required]
    [MaxLength(1000)]
    public string CorrectionNotes { get; init; } = string.Empty;
}

/// <summary>Returned for any listing response</summary>
public sealed record ListingDto
{
    public int ListingId { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public string Location { get; init; } = string.Empty;
    public decimal AskingPrice { get; init; }
    public string ListingType { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public int OwnerId { get; init; }
    public int? AgentId { get; init; }
    public string? CorrectionNotes { get; init; }
    public string? ModerationNotes { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}
