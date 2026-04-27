using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TrustEstate.Application.Interfaces.Services;

/// <summary>
/// Abstracts email delivery. Implemented in Infrastructure.Services.
/// Keeps Application layer free of SMTP/SendGrid specifics.
/// </summary>
public interface IEmailService
{
    /// <summary>
    /// Sends the password reset link email.
    /// The raw token is embedded in the link; only a hash is stored in the DB.
    /// </summary>
    Task SendPasswordResetEmailAsync(string toEmail, string firstName, string resetLink, CancellationToken ct = default);

    /// <summary>
    /// Notifies a newly approved Agent or Inspector that their account is now active.
    /// </summary>
    Task SendAccountApprovedEmailAsync(string toEmail, string firstName, CancellationToken ct = default);

    /// <summary>
    /// Notifies a rejected Agent or Inspector with the documented reason.
    /// </summary>
    Task SendAccountRejectedEmailAsync(string toEmail, string firstName, string reason, CancellationToken ct = default);
}