namespace TrustEstate.Domain.Entities;

public class MessageThread
{
    public int ThreadId { get; set; }
    public int ListingId { get; set; }
    public int ParticipantOneId { get; set; }
    public int ParticipantTwoId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Listing Listing { get; set; } = null!;
    public User ParticipantOne { get; set; } = null!;
    public User ParticipantTwo { get; set; } = null!;
    public ICollection<Message> Messages { get; set; } = new List<Message>();
}
