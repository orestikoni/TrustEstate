using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TrustEstate.Infrastructure.Identity;

/// <summary>
/// Bound from appsettings.json → "JwtSettings"
/// </summary>
public sealed class JwtSettings
{
    public string SecretKey { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public int AccessTokenExpiryMinutes { get; set; } = 15;
}

/// <summary>
/// Bound from appsettings.json → "AuthSettings"
/// </summary>
public sealed class AuthSettings
{
    public int RefreshTokenExpiryDays { get; set; } = 7;

    /// <summary>
    /// Base URL of the Next.js frontend — used to build reset-password links.
    /// e.g. "http://localhost:3000" in dev, "https://trustestate.com" in prod.
    /// </summary>
    public string FrontendBaseUrl { get; set; } = string.Empty;
}