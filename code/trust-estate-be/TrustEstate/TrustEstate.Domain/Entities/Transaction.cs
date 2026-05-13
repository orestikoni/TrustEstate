using TrustEstate.Domain.Enums;

namespace TrustEstate.Domain.Entities;

public class Transaction
{
    public int TransactionId { get; set; }
    public int ListingId { get; set; }
    public int OfferId { get; set; }
    public int AgentId { get; set; }
    public int OwnerId { get; set; }
    public int BuyerId { get; set; }
    public TransactionStatus Status { get; set; } = TransactionStatus.Active;
    public DateTime? ClosedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Listing Listing { get; set; } = null!;
    public Offer Offer { get; set; } = null!;
    public User Agent { get; set; } = null!;
    public User Owner { get; set; } = null!;
    public User Buyer { get; set; } = null!;
    public ICollection<Dispute> Disputes { get; set; } = new List<Dispute>();
}
