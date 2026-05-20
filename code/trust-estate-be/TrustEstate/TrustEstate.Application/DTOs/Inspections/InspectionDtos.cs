using System.ComponentModel.DataAnnotations;

namespace TrustEstate.Application.DTOs.Inspections;

public sealed record AssignInspectorRequest
{
    [Required]
    [Range(1, int.MaxValue)]
    public int ListingId { get; init; }

    [Required]
    [Range(1, int.MaxValue)]
    public int OfferId { get; init; }

    [Required]
    [Range(1, int.MaxValue)]
    public int InspectorId { get; init; }

    [Required]
    public DateTime ScheduledDate { get; init; }
}

public sealed record ReassignInspectorRequest
{
    [Required]
    [Range(1, int.MaxValue)]
    public int NewInspectorId { get; init; }
}

public sealed record UpdateInspectionStatusRequest
{
    [Required]
    public string Status { get; init; } = string.Empty;
}

public sealed record SubmitInspectionReportRequest
{
    [Required]
    public IEnumerable<CategoryInput> Categories { get; init; } = Enumerable.Empty<CategoryInput>();
}

public sealed record CategoryInput
{
    [Required]
    public string CategoryName { get; init; } = string.Empty;

    [Required]
    public string Findings { get; init; } = string.Empty;

    [Required]
    public string PassFail { get; init; } = string.Empty;

    [Required]
    public string Severity { get; init; } = string.Empty;

    public IEnumerable<string> PhotoUrls { get; init; } = Enumerable.Empty<string>();
}

public sealed record SubmitVerdictRequest
{
    [Required]
    public string Verdict { get; init; } = string.Empty;
}

public sealed record InspectionDto
{
    public int InspectionId { get; init; }
    public int ListingId { get; init; }
    public int OfferId { get; init; }
    public int InspectorId { get; init; }
    public string InspectorFullName { get; init; } = string.Empty;
    public int AgentId { get; init; }
    public string Status { get; init; } = string.Empty;
    public DateTime ScheduledDate { get; init; }
    public DateTime AssignedAt { get; init; }
    public DateTime? StartedAt { get; init; }
    public DateTime? CompletedAt { get; init; }
    public InspectionReportDto? Report { get; init; }
}

public sealed record InspectionReportDto
{
    public int ReportId { get; init; }
    public int InspectionId { get; init; }
    public string? FinalVerdict { get; init; }
    public bool IsLocked { get; init; }
    public DateTime? SubmittedAt { get; init; }
    public DateTime? VerdictSubmittedAt { get; init; }
    public IEnumerable<InspectionCategoryDto> Categories { get; init; } = Enumerable.Empty<InspectionCategoryDto>();
}

public sealed record InspectionCategoryDto
{
    public int CategoryId { get; init; }
    public string CategoryName { get; init; } = string.Empty;
    public string Findings { get; init; } = string.Empty;
    public string PassFail { get; init; } = string.Empty;
    public string Severity { get; init; } = string.Empty;
    public IEnumerable<InspectionPhotoDto> Photos { get; init; } = Enumerable.Empty<InspectionPhotoDto>();
}

public sealed record InspectionPhotoDto
{
    public int InspectionPhotoId { get; init; }
    public string PhotoUrl { get; init; } = string.Empty;
    public DateTime UploadedAt { get; init; }
}

public sealed record InspectorDto
{
    public int UserId { get; init; }
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string? ProfessionalQualifications { get; init; }
}

public sealed record MyInspectionDto
{
    public int InspectionId { get; init; }
    public int ListingId { get; init; }
    public string PropertyTitle { get; init; } = string.Empty;
    public string PropertyAddress { get; init; } = string.Empty;
    public string? PhotoUrl { get; init; }
    public string AgentName { get; init; } = string.Empty;
    public string AgentEmail { get; init; } = string.Empty;
    public string OwnerName { get; init; } = string.Empty;
    public DateTime ScheduledDate { get; init; }
    public DateTime AssignedAt { get; init; }
    public string Status { get; init; } = string.Empty;
    public InspectionReportDto? Report { get; init; }
}
