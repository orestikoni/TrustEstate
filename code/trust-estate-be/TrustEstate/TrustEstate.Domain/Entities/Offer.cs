using TrustEstate.Domain.Enums;

namespace TrustEstate.Domain.Entities;

public class Offer
{
    public int OfferId { get; set; }
    public int ListingId { get; set; }
    public int BuyerId { get; set; }
    public decimal ProposedPrice { get; set; }
    public string? Message { get; set; }
    public OfferStatus Status { get; set; } = OfferStatus.Pending;
    public int NegotiationRound { get; set; } = 0;
    public DateTime? ResponseDeadline { get; set; }
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ResolvedAt { get; set; }

    // Navigation properties
    public Listing Listing { get; set; } = null!;
    public User Buyer { get; set; } = null!;
    public ICollection<Negotiation> Negotiations { get; set; } = new List<Negotiation>();
    public Transaction? Transaction { get; set; }
    public PostInspectionWindow? PostInspectionWindow { get; set; }
    public Inspection? Inspection { get; set; }
}
