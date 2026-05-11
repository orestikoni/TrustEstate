using TrustEstate.Domain.Enums;

namespace TrustEstate.Domain.Entities;

public class Dispute
{
    public int DisputeId { get; set; }
    public int TransactionId { get; set; }
    public int SubmittedById { get; set; }
    public string Description { get; set; } = string.Empty;
    public DisputeStatus Status { get; set; } = DisputeStatus.Open;
    public string? ResolutionOutcome { get; set; }
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ResolvedAt { get; set; }

    // Navigation properties
    public Transaction Transaction { get; set; } = null!;
    public User SubmittedBy { get; set; } = null!;
}
