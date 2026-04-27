using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using TrustEstate.Domain.Enums;

namespace TrustEstate.Domain.Entities;

public class PasswordResetToken
{
    public int TokenId { get; set; }
    public int UserId { get; set; }
    public string TokenHash { get; set; } = string.Empty;   // SHA-256 hash of the raw token
    public PasswordResetTokenStatus TokenStatus { get; set; } = PasswordResetTokenStatus.Active;
    public DateTime ExpiresAt { get; set; }
    public DateTime? UsedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User User { get; set; } = null!;
}
