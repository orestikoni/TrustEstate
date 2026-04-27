using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using TrustEstate.Application.DTOs.Auth;

namespace TrustEstate.Application.Interfaces.Auth;

/// <summary>
/// Authentication service contract. Defined in Application, implemented in Infrastructure.
/// Covers every endpoint called by the frontend:
///   POST /api/auth/register
///   POST /api/auth/login
///   POST /api/auth/logout
///   POST /api/auth/refresh
///   POST /api/auth/forgot-password
///   POST /api/auth/reset-password
///   GET  /api/auth/me
/// </summary>
public interface IAuthService
{
    /// <summary>
    /// Registers a new user. Returns immediately with Pending status for Agent/Inspector,
    /// or Active status for Buyer/PropertyOwner.
    /// Throws ConflictException if email already exists.
    /// </summary>
    Task<RegisterResponse> RegisterAsync(RegisterRequest request, CancellationToken ct = default);

    /// <summary>
    /// Validates credentials. Records the login attempt.
    /// Throws AuthenticationException for invalid credentials, locked accounts, or pending verification.
    /// </summary>
    Task<LoginResponse> LoginAsync(LoginRequest request, string? ipAddress, CancellationToken ct = default);

    /// <summary>
    /// Revokes the refresh token associated with the current user session.
    /// Silent — never throws if token not found.
    /// </summary>
    Task LogoutAsync(int userId, string refreshToken, CancellationToken ct = default);

    /// <summary>
    /// Issues a new access + refresh token pair from a valid, non-expired refresh token.
    /// Throws AuthenticationException if the token is invalid/expired/revoked.
    /// </summary>
    Task<AuthTokensDto> RefreshTokensAsync(string refreshToken, CancellationToken ct = default);

    /// <summary>
    /// Sends a password reset email if the address belongs to an active account.
    /// Always returns success to prevent email enumeration.
    /// </summary>
    Task ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken ct = default);

    /// <summary>
    /// Validates the reset token and updates the password.
    /// Throws AuthenticationException if the token is invalid, expired, or already used.
    /// </summary>
    Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken ct = default);

    /// <summary>
    /// Returns the UserDto for the currently authenticated user.
    /// Throws NotFoundException if userId no longer exists.
    /// </summary>
    Task<UserDto> GetCurrentUserAsync(int userId, CancellationToken ct = default);
}