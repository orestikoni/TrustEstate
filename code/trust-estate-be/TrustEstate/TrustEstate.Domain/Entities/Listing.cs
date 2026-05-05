using TrustEstate.Domain.Enums;

namespace TrustEstate.Domain.Entities;

public class Listing
{
    public int ListingId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;

    public decimal AskingPrice { get; set; }
    public ListingType ListingType { get; set; }
    public PropertyType PropertyType { get; set; }
    public ListingStatus Status { get; set; } = ListingStatus.PendingAgentReview;

    public int OwnerId { get; set; }
    public int? AgentId { get; set; }

    public string? CorrectionNotes { get; set; }
    public string? ModerationNotes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? PublishedAt { get; set; }
    public DateTime? ArchivedAt { get; set; }

    // Navigation properties
    public User Owner { get; set; } = null!;
    public User? Agent { get; set; }
    public ICollection<ListingPhoto> Photos { get; set; } = new List<ListingPhoto>();
    public ICollection<ListingAssignment> Assignments { get; set; } = new List<ListingAssignment>();
}