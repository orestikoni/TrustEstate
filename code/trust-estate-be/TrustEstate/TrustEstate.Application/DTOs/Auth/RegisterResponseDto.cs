namespace TrustEstate.Application.DTOs.Auth;

public class RegisterResponseDto
{
    public UserDto User { get; set; } = null!;
    public string Message { get; set; } = string.Empty;
}
