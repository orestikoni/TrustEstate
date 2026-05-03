using System.ComponentModel.DataAnnotations;

namespace TrustEstate.Application.DTOs.Auth;

public class RegisterRequestDto
{
    [Required]
    [MaxLength(50)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string LastName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(100)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(8)]
    [MaxLength(100)]
    public string Password { get; set; } = string.Empty;

    [Phone]
    [MaxLength(20)]
    public string? PhoneNumber { get; set; }

    [Required]
    public string Role { get; set; } = string.Empty;

    [MaxLength(30)]
    public string? AgencyType { get; set; }

    [MaxLength(100)]
    public string? AgencyName { get; set; }

    [MaxLength(500)]
    public string? ProfessionalQualifications { get; set; }
}
