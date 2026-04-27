using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using TrustEstate.Domain.Entities;

namespace TrustEstate.Application.Interfaces.Auth;

/// <summary>
/// Data access contract for login attempt security tracking (FR_04, FR_54).
/// </summary>
public interface ILoginAttemptRepository
{
    Task AddAsync(LoginAttempt attempt, CancellationToken ct = default);

    /// <summary>
    /// Returns the count of consecutive failed attempts for an email
    /// within the given lookback window.
    /// </summary>
    Task<int> CountRecentFailedAttemptsAsync(string email, TimeSpan window, CancellationToken ct = default);

    Task SaveChangesAsync(CancellationToken ct = default);
}