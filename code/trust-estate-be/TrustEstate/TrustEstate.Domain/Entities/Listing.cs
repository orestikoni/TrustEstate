using TrustEstate.Domain.Enums;

namespace TrustEstate.Domain.Entities;

public class Listing
{
    public int ListingId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public decimal AskingPrice { get; set; }
    public ListingType ListingType { get; set; }
    public ListingStatus Status { get; set; } = ListingStatus.PendingAgentReview;

    // Owner who created the listing
    public int OwnerId { get; set; }

    // Agent assigned to manage the listing
    public int? AgentId { get; set; }

    // Correction reason from Agent
    public string? CorrectionNotes { get; set; }

    // Flag/suspension reason from Admin
    public string? ModerationNotes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User Owner { get; set; } = null!;
    public User? Agent { get; set; }
}
