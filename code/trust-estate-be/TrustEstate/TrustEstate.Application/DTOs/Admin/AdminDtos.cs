using System.ComponentModel.DataAnnotations;

namespace TrustEstate.Application.DTOs.Admin;

public sealed record PendingVerificationDto
{
    public int UserId { get; init; }
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string Role { get; init; } = string.Empty;
    public string? AgencyType { get; init; }
    public string? AgencyName { get; init; }
    public string? ProfessionalQualifications { get; init; }
    public DateTime RegisteredAt { get; init; }
}

public sealed record RejectVerificationRequest
{
    public string? Notes { get; init; }
}

public sealed record AdminListingDto
{
    public int ListingId { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Address { get; init; } = string.Empty;
    public string City { get; init; } = string.Empty;
    public string Country { get; init; } = string.Empty;
    public decimal AskingPrice { get; init; }
    public string ListingType { get; init; } = string.Empty;
    public string PropertyType { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public int OwnerId { get; init; }
    public string? OwnerName { get; init; }
    public int? AgentId { get; init; }
    public string? AgentName { get; init; }
    public string? PhotoUrl { get; init; }
    public string? ModerationNotes { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}

public sealed record AdminListingActionRequest
{
    public string? Reason { get; init; }
}

public sealed record AdminUserDto
{
    public int UserId { get; init; }
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string Role { get; init; } = string.Empty;
    public string AccountStatus { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
}

public sealed record SuspendUserRequest
{
    public string? Reason { get; init; }
}

public sealed record AdminInspectionDto
{
    public int InspectionId { get; init; }
    public string PropertyTitle { get; init; } = string.Empty;
    public string InspectorName { get; init; } = string.Empty;
    public string AgentName { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public DateTime ScheduledDate { get; init; }
    public DateTime? CompletedAt { get; init; }
    public string? FinalVerdict { get; init; }
    public bool HasReport { get; init; }
    public bool ReportLocked { get; init; }
}

public sealed record AdminDisputeDto
{
    public int DisputeId { get; init; }
    public int TransactionId { get; init; }
    public string SubmittedByFullName { get; init; } = string.Empty;
    public string PropertyTitle { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public string? ResolutionOutcome { get; init; }
    public DateTime SubmittedAt { get; init; }
    public DateTime? ResolvedAt { get; init; }
}

public sealed record ResolveDisputeRequest
{
    [Required]
    [MaxLength(5000)]
    public string ResolutionOutcome { get; init; } = string.Empty;
}
