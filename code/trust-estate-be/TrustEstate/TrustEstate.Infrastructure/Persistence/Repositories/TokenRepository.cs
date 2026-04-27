using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Microsoft.EntityFrameworkCore;
using TrustEstate.Application.Interfaces.Auth;
using TrustEstate.Domain.Entities;
using TrustEstate.Domain.Enums;

namespace TrustEstate.Infrastructure.Persistence.Repositories;

public sealed class TokenRepository : ITokenRepository
{
    private readonly TrustEstateDbContext _db;

    public TokenRepository(TrustEstateDbContext db) => _db = db;

    // Refresh Tokens 

    public async Task AddRefreshTokenAsync(RefreshToken token, CancellationToken ct = default)
        => await _db.RefreshTokens.AddAsync(token, ct);

    public Task<RefreshToken?> GetRefreshTokenByHashAsync(string tokenHash, CancellationToken ct = default)
        => _db.RefreshTokens
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.TokenHash == tokenHash && !r.IsRevoked, ct);

    public Task RevokeRefreshTokenAsync(RefreshToken token, CancellationToken ct = default)
    {
        token.IsRevoked = true;
        token.RevokedAt = DateTime.UtcNow;
        _db.RefreshTokens.Update(token);
        return Task.CompletedTask;
    }

    public async Task RevokeAllUserRefreshTokensAsync(int userId, CancellationToken ct = default)
    {
        var tokens = await _db.RefreshTokens
            .Where(r => r.UserId == userId && !r.IsRevoked)
            .ToListAsync(ct);

        foreach (var t in tokens)
        {
            t.IsRevoked = true;
            t.RevokedAt = DateTime.UtcNow;
        }
        _db.RefreshTokens.UpdateRange(tokens);
    }

    // Password Reset Tokens 

    public async Task AddPasswordResetTokenAsync(PasswordResetToken token, CancellationToken ct = default)
        => await _db.PasswordResetTokens.AddAsync(token, ct);

    public Task<PasswordResetToken?> GetActivePasswordResetTokenByHashAsync(string tokenHash, CancellationToken ct = default)
        => _db.PasswordResetTokens
            .FirstOrDefaultAsync(t =>
                t.TokenHash == tokenHash &&
                t.TokenStatus == PasswordResetTokenStatus.Active, ct);

    public Task InvalidatePasswordResetTokenAsync(PasswordResetToken token, CancellationToken ct = default)
    {
        token.TokenStatus = PasswordResetTokenStatus.Used;
        token.UsedAt = DateTime.UtcNow;
        _db.PasswordResetTokens.Update(token);
        return Task.CompletedTask;
    }

    public Task SaveChangesAsync(CancellationToken ct = default)
        => _db.SaveChangesAsync(ct);
}