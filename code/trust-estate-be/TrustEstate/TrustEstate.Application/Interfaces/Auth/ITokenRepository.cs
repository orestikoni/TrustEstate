using TrustEstate.Domain.Entities;

namespace TrustEstate.Application.Interfaces.Auth;

public interface ITokenRepository
{
    Task AddRefreshTokenAsync(RefreshToken token, CancellationToken ct = default);
    Task<RefreshToken?> GetRefreshTokenByHashAsync(string tokenHash, CancellationToken ct = default);
    Task RevokeRefreshTokenAsync(RefreshToken token, CancellationToken ct = default);
    Task RevokeAllUserRefreshTokensAsync(int userId, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}