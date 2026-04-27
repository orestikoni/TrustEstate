using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TrustEstate.Domain.Entities;

/// <summary>
/// Stores hashed refresh tokens so the frontend can silently renew access tokens
/// via POST /api/auth/refresh without re-login.
/// </summary>
public class RefreshToken
{
    public int RefreshTokenId { get; set; }
    public int UserId { get; set; }
    public string TokenHash { get; set; } = string.Empty;   // SHA-256 of the raw token sent to client
    public DateTime ExpiresAt { get; set; }
    public bool IsRevoked { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? RevokedAt { get; set; }
    public string? CreatedByIp { get; set; }

    // Navigation
    public User User { get; set; } = null!;
}