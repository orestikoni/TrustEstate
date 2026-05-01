namespace TrustEstate.Application.DTOs.Listings;

/// <summary>POST /api/listings — Property Owner creates a listing</summary>
public sealed record CreateListingRequest
{
    public string Title { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public string Location { get; init; } = string.Empty;
    public decimal AskingPrice { get; init; }
    public string ListingType { get; init; } = string.Empty; // "Sale" | "Rent"
    public int AgentId { get; init; }
}

/// <summary>PUT /api/listings/{id} — Owner edits a listing</summary>
public sealed record UpdateListingRequest
{
    public string Title { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public string Location { get; init; } = string.Empty;
    public decimal AskingPrice { get; init; }
    public string ListingType { get; init; } = string.Empty;
}

/// <summary>PUT /api/listings/{id}/request-corrections — Agent requests corrections</summary>
public sealed record RequestCorrectionsRequest
{
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