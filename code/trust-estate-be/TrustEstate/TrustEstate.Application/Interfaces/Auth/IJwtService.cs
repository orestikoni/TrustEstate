using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using TrustEstate.Domain.Entities;

namespace TrustEstate.Application.Interfaces.Services;

/// <summary>
/// Abstracts JWT access token generation and validation.
/// Implemented in Infrastructure.Identity.
/// </summary>
public interface IJwtService
{
    /// <summary>Generates a signed JWT access token for the given user.</summary>
    string GenerateAccessToken(User user);

    /// <summary>Generates a cryptographically random refresh token (raw value).</summary>
    string GenerateRefreshToken();

    /// <summary>
    /// Validates an access token and returns the userId claim.
    /// Returns null if the token is invalid or expired.
    /// </summary>
    int? GetUserIdFromToken(string token);

    /// <summary>Seconds until the access token expires (from JwtSettings).</summary>
    int AccessTokenExpiresInSeconds { get; }
}