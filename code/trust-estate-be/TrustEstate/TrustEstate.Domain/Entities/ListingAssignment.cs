using TrustEstate.Domain.Enums;

namespace TrustEstate.Domain.Entities;

public class ListingAssignment
{
    public int AssignmentId { get; set; }
    public int ListingId { get; set; }
    public int AgentId { get; set; }
    public AssignmentStatus AssignmentStatus { get; set; } = AssignmentStatus.Pending;
    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
    public DateTime? RespondedAt { get; set; }

    public Listing Listing { get; set; } = null!;
    public User Agent { get; set; } = null!;
}