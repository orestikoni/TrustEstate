using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Microsoft.EntityFrameworkCore;
using TrustEstate.Application.Interfaces.Auth;
using TrustEstate.Domain.Entities;

namespace TrustEstate.Infrastructure.Persistence.Repositories;

public sealed class LoginAttemptRepository : ILoginAttemptRepository
{
    private readonly TrustEstateDbContext _db;

    public LoginAttemptRepository(TrustEstateDbContext db) => _db = db;

    public async Task AddAsync(LoginAttempt attempt, CancellationToken ct = default)
        => await _db.LoginAttempts.AddAsync(attempt, ct);

    public Task<int> CountRecentFailedAttemptsAsync(string email, TimeSpan window, CancellationToken ct = default)
    {
        var since = DateTime.UtcNow - window;
        return _db.LoginAttempts
            .CountAsync(a =>
                a.EmailAttempted == email.ToLowerInvariant() &&
                !a.Success &&
                a.AttemptedAt >= since, ct);
    }

    public Task SaveChangesAsync(CancellationToken ct = default)
        => _db.SaveChangesAsync(ct);
}