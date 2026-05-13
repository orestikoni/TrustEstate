using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TrustEstate.Domain.Entities;
using TrustEstate.Domain.Enums;
using TrustEstate.Infrastructure.Persistence;

namespace TrustEstate.Infrastructure.Services;

public class DataSeeder
{
    private readonly TrustEstateDbContext _db;
    private readonly IConfiguration _configuration;

    public DataSeeder(TrustEstateDbContext db, IConfiguration configuration)
    {
        _db = db;
        _configuration = configuration;
    }

    public async Task SeedAsync(CancellationToken ct = default)
    {
        await SeedAdminAsync(ct);
    }

    private async Task SeedAdminAsync(CancellationToken ct)
    {
        if (await _db.Users.AnyAsync(u => u.Role == UserRole.Admin, ct))
            return;

        var email = _configuration["AdminSeed:Email"];
        var password = _configuration["AdminSeed:Password"];

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
            return;

        _db.Users.Add(new User
        {
            FirstName = "Platform",
            LastName = "Admin",
            Email = email.ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Role = UserRole.Admin,
            AccountStatus = AccountStatus.Active,
        });

        await _db.SaveChangesAsync(ct);
    }
}
