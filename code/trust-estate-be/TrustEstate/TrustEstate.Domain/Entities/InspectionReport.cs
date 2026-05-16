using TrustEstate.Domain.Enums;

namespace TrustEstate.Domain.Entities;

public class InspectionReport
{
    public int ReportId { get; set; }
    public int InspectionId { get; set; }
    public InspectionVerdict? FinalVerdict { get; set; }
    public bool IsLocked { get; set; } = false;
    public bool IsFlagged { get; set; } = false;
    public string? FlagReason { get; set; }
    public DateTime? FlaggedAt { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public DateTime? VerdictSubmittedAt { get; set; }

    // Navigation properties
    public Inspection Inspection { get; set; } = null!;
    public ICollection<InspectionCategory> Categories { get; set; } = new List<InspectionCategory>();
}
