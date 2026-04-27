using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using TrustEstate.Domain.Enums;

namespace TrustEstate.Domain.Entities;

using TrustEstate.Domain.Enums;

public class User
{
    public int UserId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string EmailAddress { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public AccountStatus AccountStatus { get; set; } = AccountStatus.Active;
    public string? PhoneNumber { get; set; }
    public string? ProfilePhotoUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }

    // Navigation properties
    public AgentProfile? AgentProfile { get; set; }
    public InspectorProfile? InspectorProfile { get; set; }
    public ICollection<PasswordResetToken> PasswordResetTokens { get; set; } = new List<PasswordResetToken>();
    public ICollection<LoginAttempt> LoginAttempts { get; set; } = new List<LoginAttempt>();
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}