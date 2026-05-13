using TrustEstate.Domain.Enums;

namespace TrustEstate.Domain.Entities;

public class Negotiation
{
    public int NegotiationId { get; set; }
    public int OfferId { get; set; }
    public int RoundNumber { get; set; }
    public NegotiationActorRole ActorRole { get; set; }
    public decimal ProposedPrice { get; set; }
    public string? Message { get; set; }
    public NegotiationAction Action { get; set; }
    public DateTime? ResponseDeadline { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Offer Offer { get; set; } = null!;
}
