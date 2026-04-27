using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Microsoft.EntityFrameworkCore;
using TrustEstate.Application.Interfaces.Auth;
using TrustEstate.Domain.Entities;

namespace TrustEstate.Infrastructure.Persistence.Repositories;

public sealed class UserRepository : IUserRepository
{
    private readonly TrustEstateDbContext _db;

    public UserRepository(TrustEstateDbContext db) => _db = db;

    public Task<User?> GetByIdAsync(int userId, CancellationToken ct = default)
        => _db.Users.FirstOrDefaultAsync(u => u.UserId == userId, ct);

    public Task<User?> GetByEmailAsync(string email, CancellationToken ct = default)
        => _db.Users.FirstOrDefaultAsync(u => u.EmailAddress == email.ToLowerInvariant(), ct);

    public Task<User?> GetByIdWithProfileAsync(int userId, CancellationToken ct = default)
        => _db.Users
            .Include(u => u.AgentProfile)
            .Include(u => u.InspectorProfile)
            .FirstOrDefaultAsync(u => u.UserId == userId, ct);

    public Task<bool> EmailExistsAsync(string email, CancellationToken ct = default)
        => _db.Users.AnyAsync(u => u.EmailAddress == email.ToLowerInvariant(), ct);

    public async Task AddAsync(User user, CancellationToken ct = default)
        => await _db.Users.AddAsync(user, ct);

    public void Update(User user)
        => _db.Users.Update(user);

    public Task SaveChangesAsync(CancellationToken ct = default)
        => _db.SaveChangesAsync(ct);
}