using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using Xunit;
using TrustEstate.Application.DTOs.Auth;
using TrustEstate.Application.Interfaces.Auth;
using TrustEstate.Domain.Entities;
using TrustEstate.Domain.Enums;
using TrustEstate.Infrastructure.Persistence;
using TrustEstate.Infrastructure.Services;

namespace TrustEstate.Tests.Auth;

public class AuthServiceGapTests
{
    private readonly Mock<IJwtService> _jwt = new();
    private readonly IConfiguration _configuration;

    public AuthServiceGapTests()
    {
        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:RefreshTokenExpiryDays"] = "7",
                ["Jwt:AccessTokenExpiryMinutes"] = "60",
            })
            .Build();

        _jwt.Setup(j => j.GenerateRefreshToken()).Returns("new-refresh-token");
        _jwt.Setup(j => j.GenerateAccessToken(It.IsAny<User>())).Returns("new-access-token");
    }

    private TrustEstateDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<TrustEstateDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new TrustEstateDbContext(options);
    }

    private AuthService BuildSut(TrustEstateDbContext db) =>
        new AuthService(db, _jwt.Object, _configuration);

    // ── LoginAsync — deactivated account ────────────────────────────────────

    [Fact]
    public async Task Login_DeactivatedAccount_ThrowsInvalidOperationException()
    {
        using var db = CreateDb();
        db.Users.Add(new User
        {
            Id = 1,
            FirstName = "X",
            LastName = "Y",
            Email = "deact@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password1!"),
            Role = UserRole.Buyer,
            AccountStatus = AccountStatus.Deactivated,
        });
        await db.SaveChangesAsync();

        var request = new LoginRequestDto { Email = "deact@test.com", Password = "Password1!" };
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => BuildSut(db).LoginAsync(request));

        Assert.Contains("deactivated", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    // ── LogoutAsync ──────────────────────────────────────────────────────────

    [Fact]
    public async Task Logout_ValidToken_RevokesToken()
    {
        using var db = CreateDb();
        db.Users.Add(new User { Id = 1, FirstName = "A", LastName = "B", Email = "a@b.com", PasswordHash = "h", Role = UserRole.Buyer, AccountStatus = AccountStatus.Active });
        db.RefreshTokens.Add(new RefreshToken { Id = 1, Token = "valid-token", UserId = 1, ExpiresAt = DateTime.UtcNow.AddDays(7), RevokedAt = null });
        await db.SaveChangesAsync();

        await BuildSut(db).LogoutAsync("valid-token");

        var token = await db.RefreshTokens.FindAsync(1);
        Assert.NotNull(token!.RevokedAt);
    }

    [Fact]
    public async Task Logout_NonExistentToken_DoesNotThrow()
    {
        using var db = CreateDb();

        var exception = await Record.ExceptionAsync(() => BuildSut(db).LogoutAsync("ghost-token"));

        Assert.Null(exception);
    }

    // ── RefreshTokensAsync ───────────────────────────────────────────────────

    [Fact]
    public async Task RefreshTokens_ValidToken_ReturnsNewTokens()
    {
        using var db = CreateDb();
        var user = new User { Id = 1, FirstName = "A", LastName = "B", Email = "a@b.com", PasswordHash = "h", Role = UserRole.Buyer, AccountStatus = AccountStatus.Active };
        db.Users.Add(user);
        db.RefreshTokens.Add(new RefreshToken { Id = 1, Token = "old-refresh", UserId = 1, ExpiresAt = DateTime.UtcNow.AddDays(7), RevokedAt = null, User = user });
        await db.SaveChangesAsync();

        var result = await BuildSut(db).RefreshTokensAsync("old-refresh");

        Assert.Equal("new-access-token", result.AccessToken);
        Assert.Equal("new-refresh-token", result.RefreshToken);

        var oldToken = await db.RefreshTokens.FindAsync(1);
        Assert.NotNull(oldToken!.RevokedAt);
    }

    [Fact]
    public async Task RefreshTokens_RevokedToken_ThrowsUnauthorizedAccessException()
    {
        using var db = CreateDb();
        var user = new User { Id = 1, FirstName = "A", LastName = "B", Email = "a@b.com", PasswordHash = "h", Role = UserRole.Buyer, AccountStatus = AccountStatus.Active };
        db.Users.Add(user);
        db.RefreshTokens.Add(new RefreshToken { Id = 1, Token = "revoked-token", UserId = 1, ExpiresAt = DateTime.UtcNow.AddDays(7), RevokedAt = DateTime.UtcNow.AddHours(-1), User = user });
        await db.SaveChangesAsync();

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            BuildSut(db).RefreshTokensAsync("revoked-token"));
    }

    [Fact]
    public async Task RefreshTokens_ExpiredToken_ThrowsUnauthorizedAccessException()
    {
        using var db = CreateDb();
        var user = new User { Id = 1, FirstName = "A", LastName = "B", Email = "a@b.com", PasswordHash = "h", Role = UserRole.Buyer, AccountStatus = AccountStatus.Active };
        db.Users.Add(user);
        db.RefreshTokens.Add(new RefreshToken { Id = 1, Token = "expired-token", UserId = 1, ExpiresAt = DateTime.UtcNow.AddDays(-1), RevokedAt = null, User = user });
        await db.SaveChangesAsync();

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            BuildSut(db).RefreshTokensAsync("expired-token"));
    }
}
