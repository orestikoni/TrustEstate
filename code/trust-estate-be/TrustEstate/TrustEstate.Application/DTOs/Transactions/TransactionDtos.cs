namespace TrustEstate.Application.DTOs.Transactions;

public sealed record TransactionDto
{
    public int TransactionId { get; init; }
    public int ListingId { get; init; }
    public int OfferId { get; init; }
    public int AgentId { get; init; }
    public int OwnerId { get; init; }
    public int BuyerId { get; init; }
    public string Status { get; init; } = string.Empty;
    public DateTime? ClosedAt { get; init; }
    public DateTime CreatedAt { get; init; }
}

public sealed record TransactionStatusDto
{
    public int TransactionId { get; init; }
    public string Status { get; init; } = string.Empty;
    public bool OfferAccepted { get; init; }
    public bool InspectionCompleted { get; init; }
    public bool VerdictSubmitted { get; init; }
    public bool HasOpenDisputes { get; init; }
    public bool CanClose { get; init; }
}
