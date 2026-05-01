using TrustEstate.Application.DTOs.Auth;

namespace TrustEstate.Application.Interfaces.Auth;

public interface IAuthService
{
    Task<RegisterResponse> RegisterAsync(RegisterRequest request, CancellationToken ct = default);
    Task<LoginResponse> LoginAsync(LoginRequest request, string? ipAddress, CancellationToken ct = default);
    Task LogoutAsync(int userId, string refreshToken, CancellationToken ct = default);
    Task<AuthTokensDto> RefreshTokensAsync(string refreshToken, CancellationToken ct = default);
    Task<UserDto> GetCurrentUserAsync(int userId, CancellationToken ct = default);
}