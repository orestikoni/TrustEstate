using TrustEstate.Domain.Enums;

namespace TrustEstate.Domain.Entities;

public class User
{
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public AccountStatus AccountStatus { get; set; } = AccountStatus.Pending;
    public string? PhoneNumber { get; set; }
    public string? ProfilePhotoUrl { get; set; }
    public string? AgencyType { get; set; }
    public string? AgencyName { get; set; }
    public string? ProfessionalQualifications { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }

    // Navigation properties
    public AgentProfile? AgentProfile { get; set; }
    public InspectorProfile? InspectorProfile { get; set; }
    public ICollection<LoginAttempt> LoginAttempts { get; set; } = new List<LoginAttempt>();
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public ICollection<Offer> OffersAsBuyer { get; set; } = new List<Offer>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    public ICollection<Message> SentMessages { get; set; } = new List<Message>();
    public ICollection<Message> ReceivedMessages { get; set; } = new List<Message>();
    public ICollection<FavoriteListing> FavoriteListings { get; set; } = new List<FavoriteListing>();
    public ICollection<Dispute> SubmittedDisputes { get; set; } = new List<Dispute>();
}
