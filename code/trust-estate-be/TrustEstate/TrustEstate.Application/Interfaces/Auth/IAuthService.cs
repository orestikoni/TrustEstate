using TrustEstate.Application.DTOs.Auth;

namespace TrustEstate.Application.Interfaces.Auth;

public interface IAuthService
{
    Task<RegisterResponseDto> RegisterAsync(RegisterRequestDto request, CancellationToken ct = default);
    Task<LoginResponseDto> LoginAsync(LoginRequestDto request, CancellationToken ct = default);
    Task LogoutAsync(string refreshToken, CancellationToken ct = default);
    Task<AuthTokensDto> RefreshTokensAsync(string refreshToken, CancellationToken ct = default);
    Task<UserDto> GetCurrentUserAsync(int userId, CancellationToken ct = default);
}
