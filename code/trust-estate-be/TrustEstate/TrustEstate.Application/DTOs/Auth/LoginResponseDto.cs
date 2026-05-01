namespace TrustEstate.Application.DTOs.Auth;

public class LoginResponseDto
{
    public UserDto User { get; set; } = null!;
    public AuthTokensDto Tokens { get; set; } = null!;
}
