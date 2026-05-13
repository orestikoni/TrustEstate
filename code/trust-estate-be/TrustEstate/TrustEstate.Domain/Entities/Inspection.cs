using TrustEstate.Domain.Enums;

namespace TrustEstate.Domain.Entities;

public class Inspection
{
    public int InspectionId { get; set; }
    public int ListingId { get; set; }
    public int OfferId { get; set; }
    public int InspectorId { get; set; }
    public int AgentId { get; set; }
    public InspectionStatus Status { get; set; } = InspectionStatus.Scheduled;
    public DateTime ScheduledDate { get; set; }
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    // Navigation properties
    public Listing Listing { get; set; } = null!;
    public Offer Offer { get; set; } = null!;
    public User Inspector { get; set; } = null!;
    public User Agent { get; set; } = null!;
    public InspectionReport? Report { get; set; }
    public PostInspectionWindow? PostInspectionWindow { get; set; }
}
