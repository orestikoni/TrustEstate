using TrustEstate.Domain.Enums;

namespace TrustEstate.Domain.Entities;

public class PostInspectionWindow
{
    public int WindowId { get; set; }
    public int OfferId { get; set; }
    public int InspectionId { get; set; }
    public DateTime VerdictNotifiedAt { get; set; }
    public DateTime WindowExpiresAt { get; set; }
    public PostInspectionAction ActionTaken { get; set; } = PostInspectionAction.NoAction;
    public DateTime? ActionTakenAt { get; set; }

    // Navigation properties
    public Offer Offer { get; set; } = null!;
    public Inspection Inspection { get; set; } = null!;
}
