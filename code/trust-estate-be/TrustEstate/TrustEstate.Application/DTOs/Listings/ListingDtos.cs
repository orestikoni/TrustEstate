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

public sealed record CreateListingRequest
{
    [Required]
    [MaxLength(150)]
    public string Title { get; init; } = string.Empty;

    [Required]
    public string Description { get; init; } = string.Empty;

    [Required]
    [MaxLength(255)]
    public string Address { get; init; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string City { get; init; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Country { get; init; } = string.Empty;

    [Range(0.01, double.MaxValue, ErrorMessage = "AskingPrice must be greater than zero.")]
    public decimal AskingPrice { get; init; }

    [Required]
    public string ListingType { get; init; } = string.Empty;

    [Required]
    public string PropertyType { get; init; } = string.Empty;

    [Range(1, int.MaxValue, ErrorMessage = "A valid AgentId is required.")]
    public int AgentId { get; init; }

    public List<string> PhotoUrls { get; init; } = new();
}

public sealed record UpdateListingRequest
{
    [Required]
    [MaxLength(150)]
    public string Title { get; init; } = string.Empty;

    [Required]
    public string Description { get; init; } = string.Empty;

    [Required]
    [MaxLength(255)]
    public string Address { get; init; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string City { get; init; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Country { get; init; } = string.Empty;

    [Range(0.01, double.MaxValue, ErrorMessage = "AskingPrice must be greater than zero.")]
    public decimal AskingPrice { get; init; }

    [Required]
    public string ListingType { get; init; } = string.Empty;

    [Required]
    public string PropertyType { get; init; } = string.Empty;

    public List<string> PhotoUrls { get; init; } = new();
}

public sealed record AgentUpdateListingRequest
{
    [Required]
    [MaxLength(150)]
    public string Title { get; init; } = string.Empty;

    [Required]
    public string Description { get; init; } = string.Empty;

    [Required]
    [MaxLength(255)]
    public string Address { get; init; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string City { get; init; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Country { get; init; } = string.Empty;

    [Range(0.01, double.MaxValue, ErrorMessage = "AskingPrice must be greater than zero.")]
    public decimal AskingPrice { get; init; }

    [Required]
    public string ListingType { get; init; } = string.Empty;

    [Required]
    public string PropertyType { get; init; } = string.Empty;

    public List<string> PhotoUrls { get; init; } = new();
}

public sealed record RequestCorrectionsRequest
{
    [Required]
    [MaxLength(1000)]
    public string CorrectionNotes { get; init; } = string.Empty;
}

public sealed record RespondToAssignmentRequest
{
    [Required]
    public bool Accept { get; init; }
}

public sealed record ListingFilterRequest
{
    public string? City { get; init; }
    public string? Country { get; init; }
    public decimal? MinPrice { get; init; }
    public decimal? MaxPrice { get; init; }
    public string? PropertyType { get; init; }
    public string? ListingType { get; init; }
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;
}

public sealed record ListingDto
{
    public int ListingId { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public string Address { get; init; } = string.Empty;
    public string City { get; init; } = string.Empty;
    public string Country { get; init; } = string.Empty;
    public decimal AskingPrice { get; init; }
    public string ListingType { get; init; } = string.Empty;
    public string PropertyType { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public int OwnerId { get; init; }
    public int? AgentId { get; init; }
    public string? CorrectionNotes { get; init; }
    public string? ModerationNotes { get; init; }
    public List<ListingPhotoDto> Photos { get; init; } = new();
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
    public DateTime? PublishedAt { get; init; }
    public DateTime? ArchivedAt { get; init; }
}

public sealed record ListingPhotoDto
{
    public int PhotoId { get; init; }
    public string PhotoUrl { get; init; } = string.Empty;
    public int? DisplayOrder { get; init; }
}

public sealed record ListingAssignmentDto
{
    public int AssignmentId { get; init; }
    public int ListingId { get; init; }
    public int AgentId { get; init; }
    public string AssignmentStatus { get; init; } = string.Empty;
    public DateTime RequestedAt { get; init; }
    public DateTime? RespondedAt { get; init; }
}