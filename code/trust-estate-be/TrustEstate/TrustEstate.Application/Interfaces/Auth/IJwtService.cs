using TrustEstate.Domain.Entities;

namespace TrustEstate.Application.Interfaces.Auth;

public interface IJwtService
{
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
    int? GetUserIdFromToken(string token);
}
