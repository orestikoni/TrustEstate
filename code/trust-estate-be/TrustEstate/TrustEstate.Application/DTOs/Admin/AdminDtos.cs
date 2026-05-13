namespace TrustEstate.Application.DTOs.Admin;

public sealed record PendingVerificationDto
{
    public int UserId { get; init; }
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string Role { get; init; } = string.Empty;
    public string? AgencyType { get; init; }
    public string? AgencyName { get; init; }
    public string? ProfessionalQualifications { get; init; }
    public DateTime RegisteredAt { get; init; }
}

public sealed record RejectVerificationRequest
{
    public string? Notes { get; init; }
}
