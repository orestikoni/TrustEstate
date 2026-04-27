using TrustEstate.Application.DTOs.Auth;

namespace TrustEstate.Application.Interfaces.Auth;

public interface IAuthService
{
    Task<LoginResponseDto> LoginAsync(LoginRequestDto request);
    Task<RegisterResponseDto> RegisterAsync(RegisterRequestDto request);
    Task LogoutAsync(string refreshToken);
    Task<AuthTokensDto> RefreshTokensAsync(string refreshToken);
    Task<UserDto> GetCurrentUserAsync(int userId);
}
