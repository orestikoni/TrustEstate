using Microsoft.EntityFrameworkCore;
using TrustEstate.Application.Interfaces.Auth;
using TrustEstate.Domain.Entities;

namespace TrustEstate.Infrastructure.Persistence.Repositories;

public sealed class TokenRepository : ITokenRepository
{
    private readonly TrustEstateDbContext _db;

    public TokenRepository(TrustEstateDbContext db) => _db = db;

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

    public Task SaveChangesAsync(CancellationToken ct = default)
        => _db.SaveChangesAsync(ct);
}