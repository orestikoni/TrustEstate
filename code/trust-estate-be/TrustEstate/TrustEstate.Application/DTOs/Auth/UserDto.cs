namespace TrustEstate.Application.DTOs.Auth;

public class UserDto
{
    public int UserId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string EmailAddress { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string AccountStatus { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? ProfilePhotoUrl { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
    public string? LastLoginAt { get; set; }
}
