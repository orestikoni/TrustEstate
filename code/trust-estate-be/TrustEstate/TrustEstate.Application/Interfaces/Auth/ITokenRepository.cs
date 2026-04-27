using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using TrustEstate.Domain.Entities;

namespace TrustEstate.Application.Interfaces.Auth;

/// <summary>
/// Data access contract for RefreshToken and PasswordResetToken persistence.
/// </summary>
public interface ITokenRepository
{
    // Refresh Tokens
    Task AddRefreshTokenAsync(RefreshToken token, CancellationToken ct = default);
    Task<RefreshToken?> GetRefreshTokenByHashAsync(string tokenHash, CancellationToken ct = default);
    Task RevokeRefreshTokenAsync(RefreshToken token, CancellationToken ct = default);

    /// <summary>Revokes all active refresh tokens for a user (used on logout).</summary>
    Task RevokeAllUserRefreshTokensAsync(int userId, CancellationToken ct = default);

    // Password Reset Tokens
    Task AddPasswordResetTokenAsync(PasswordResetToken token, CancellationToken ct = default);
    Task<PasswordResetToken?> GetActivePasswordResetTokenByHashAsync(string tokenHash, CancellationToken ct = default);
    Task InvalidatePasswordResetTokenAsync(PasswordResetToken token, CancellationToken ct = default);

    Task SaveChangesAsync(CancellationToken ct = default);
}