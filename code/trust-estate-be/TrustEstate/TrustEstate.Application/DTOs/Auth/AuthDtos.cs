using TrustEstate.Domain.Enums;

namespace TrustEstate.Application.DTOs.Auth;

/// <summary>POST /api/auth/register</summary>
public sealed record RegisterRequest
{
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string Password { get; init; } = string.Empty;
    public string? PhoneNumber { get; init; }
    public string Role { get; init; } = string.Empty;          // "Buyer" | "PropertyOwner" | "Agent" | "PropertyInspector"

    // Agent-only
    public string? AgencyType { get; init; }                   // "Independent" | "Agency"
    public string? AgencyName { get; init; }

    // Inspector-only
    public string? ProfessionalQualifications { get; init; }
}

/// <summary>POST /api/auth/login</summary>
public sealed record LoginRequest
{
    public string Email { get; init; } = string.Empty;
    public string Password { get; init; } = string.Empty;
}

/// <summary>POST /api/auth/refresh</summary>
public sealed record RefreshTokenRequest
{
    public string RefreshToken { get; init; } = string.Empty;
}

/// <summary>
/// Matches the User interface in src/types/index.ts exactly.
/// All property names are camelCase after JSON serialisation.
/// </summary>
public sealed record UserDto
{
    public int UserId { get; init; }
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string EmailAddress { get; init; } = string.Empty;
    public string Role { get; init; } = string.Empty;           // string so FE enum matches directly
    public string AccountStatus { get; init; } = string.Empty;
    public string? PhoneNumber { get; init; }
    public string? ProfilePhotoUrl { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? LastLoginAt { get; init; }
}

/// <summary>
/// Matches the AuthTokens interface in src/types/index.ts.
/// </summary>
public sealed record AuthTokensDto
{
    public string AccessToken { get; init; } = string.Empty;
    public string RefreshToken { get; init; } = string.Empty;
    public int ExpiresIn { get; init; }                         // seconds until access token expires
}

/// <summary>
/// Matches LoginResponse in src/services/auth.service.ts:
/// { user: User; tokens: AuthTokens }
/// </summary>
public sealed record LoginResponse
{
    public UserDto User { get; init; } = null!;
    public AuthTokensDto Tokens { get; init; } = null!;
}

/// <summary>
/// Matches RegisterResponse in src/services/auth.service.ts:
/// { user: User; message: string }
/// </summary>
public sealed record RegisterResponse
{
    public UserDto User { get; init; } = null!;
    public string Message { get; init; } = string.Empty;
}

