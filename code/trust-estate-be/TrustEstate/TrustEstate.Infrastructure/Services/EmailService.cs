using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Options;
using TrustEstate.Application.Interfaces.Services;

namespace TrustEstate.Infrastructure.Services;

public sealed class EmailService : IEmailService
{
    private readonly EmailSettings _settings;

    public EmailService(IOptions<EmailSettings> settings)
    {
        _settings = settings.Value;
    }

    public async Task SendPasswordResetEmailAsync(
        string toEmail, string firstName, string resetLink, CancellationToken ct = default)
    {
        var subject = "Reset your TrustEstate password";
        var body = $"""
            <p>Hi {firstName},</p>
            <p>We received a request to reset your TrustEstate password.</p>
            <p>
              <a href="{resetLink}" style="background:#2563eb;color:#fff;padding:12px 24px;
                 border-radius:8px;text-decoration:none;font-weight:600;">
                Reset Password
              </a>
            </p>
            <p>This link will expire in <strong>1 hour</strong>.</p>
            <p>If you did not request a password reset, you can safely ignore this email.</p>
            <p>— The TrustEstate Team</p>
            """;

        await SendAsync(toEmail, subject, body, ct);
    }

    public async Task SendAccountApprovedEmailAsync(
        string toEmail, string firstName, CancellationToken ct = default)
    {
        var subject = "Your TrustEstate account has been approved";
        var body = $"""
            <p>Hi {firstName},</p>
            <p>Great news! Your TrustEstate account has been reviewed and <strong>approved</strong>.</p>
            <p>You can now log in and access the platform.</p>
            <p>— The TrustEstate Team</p>
            """;

        await SendAsync(toEmail, subject, body, ct);
    }

    public async Task SendAccountRejectedEmailAsync(
        string toEmail, string firstName, string reason, CancellationToken ct = default)
    {
        var subject = "Update on your TrustEstate account application";
        var body = $"""
            <p>Hi {firstName},</p>
            <p>Unfortunately, your TrustEstate account application could not be approved at this time.</p>
            <p><strong>Reason:</strong> {reason}</p>
            <p>If you believe this is an error, please contact our support team.</p>
            <p>— The TrustEstate Team</p>
            """;

        await SendAsync(toEmail, subject, body, ct);
    }

    private async Task SendAsync(string toEmail, string subject, string htmlBody, CancellationToken ct)
    {
        using var client = new SmtpClient(_settings.Host, _settings.Port)
        {
            Credentials = new NetworkCredential(_settings.Username, _settings.Password),
            EnableSsl = _settings.EnableSsl,
        };

        using var message = new MailMessage
        {
            From = new MailAddress(_settings.FromAddress, _settings.FromName),
            Subject = subject,
            Body = htmlBody,
            IsBodyHtml = true,
        };
        message.To.Add(toEmail);

        await client.SendMailAsync(message, ct);
    }
}

/// <summary>Bound from appsettings.json → "EmailSettings"</summary>
public sealed class EmailSettings
{
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public bool EnableSsl { get; set; } = true;
    public string FromAddress { get; set; } = string.Empty;
    public string FromName { get; set; } = "TrustEstate";
}