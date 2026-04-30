namespace TrustEstate.Application.Interfaces.Services;

public interface IEmailService
{
    Task SendAccountApprovedEmailAsync(string toEmail, string firstName, CancellationToken ct = default);
    Task SendAccountRejectedEmailAsync(string toEmail, string firstName, string reason, CancellationToken ct = default);
}