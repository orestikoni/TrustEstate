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

public class AuthServiceTests
{
    private readonly Mock<IJwtService> _jwt = new();
    private readonly IConfiguration _configuration;

    public AuthServiceTests()
    {
        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:RefreshTokenExpiryDays"] = "7",
                ["Jwt:AccessTokenExpiryMinutes"] = "60",
            })
            .Build();

        _jwt.Setup(j => j.GenerateRefreshToken()).Returns("test-refresh-token");
        _jwt.Setup(j => j.GenerateAccessToken(It.IsAny<User>())).Returns("test-access-token");
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

    // ── RegisterAsync ────────────────────────────────────────────────────────

    [Fact]
    public async Task Register_BuyerRole_AccountStatusIsActive()
    {
        using var db = CreateDb();
        var request = new RegisterRequestDto
        {
            FirstName = "Alice",
            LastName = "Smith",
            Email = "alice@example.com",
            Password = "SecurePass1!",
            Role = "Buyer",
        };

        var result = await BuildSut(db).RegisterAsync(request);

        Assert.Equal("Active", result.User.AccountStatus);
        Assert.Equal("Buyer", result.User.Role);

        var savedUser = await db.Users.FirstAsync(u => u.Email == "alice@example.com");
        Assert.Equal(AccountStatus.Active, savedUser.AccountStatus);
    }

    [Fact]
    public async Task Register_PropertyOwnerRole_AccountStatusIsActive()
    {
        using var db = CreateDb();
        var request = new RegisterRequestDto
        {
            FirstName = "Bob",
            LastName = "Jones",
            Email = "bob@example.com",
            Password = "SecurePass1!",
            Role = "PropertyOwner",
        };

        var result = await BuildSut(db).RegisterAsync(request);

        Assert.Equal("Active", result.User.AccountStatus);

        var savedUser = await db.Users.FirstAsync(u => u.Email == "bob@example.com");
        Assert.Equal(AccountStatus.Active, savedUser.AccountStatus);
    }

    [Fact]
    public async Task Register_AgentRole_AccountStatusIsPending()
    {
        using var db = CreateDb();
        var request = new RegisterRequestDto
        {
            FirstName = "Carol",
            LastName = "White",
            Email = "carol@example.com",
            Password = "SecurePass1!",
            Role = "Agent",
            AgencyType = "Individual",
            AgencyName = "Carol Realty",
        };

        var result = await BuildSut(db).RegisterAsync(request);

        Assert.Equal("Pending", result.User.AccountStatus);

        var savedUser = await db.Users.FirstAsync(u => u.Email == "carol@example.com");
        Assert.Equal(AccountStatus.Pending, savedUser.AccountStatus);
        Assert.NotNull(savedUser.AgentProfile);
    }

    [Fact]
    public async Task Register_PropertyInspectorRole_AccountStatusIsPending()
    {
        using var db = CreateDb();
        var request = new RegisterRequestDto
        {
            FirstName = "Dave",
            LastName = "Brown",
            Email = "dave@example.com",
            Password = "SecurePass1!",
            Role = "PropertyInspector",
            ProfessionalQualifications = "Certified Inspector",
        };

        var result = await BuildSut(db).RegisterAsync(request);

        Assert.Equal("Pending", result.User.AccountStatus);

        var savedUser = await db.Users.FirstAsync(u => u.Email == "dave@example.com");
        Assert.Equal(AccountStatus.Pending, savedUser.AccountStatus);
        Assert.NotNull(savedUser.InspectorProfile);
    }

    [Fact]
    public async Task Register_DuplicateEmail_ThrowsInvalidOperationException()
    {
        using var db = CreateDb();
        db.Users.Add(new User
        {
            FirstName = "Existing",
            LastName = "User",
            Email = "taken@example.com",
            PasswordHash = "hash",
            Role = UserRole.Buyer,
            AccountStatus = AccountStatus.Active,
        });
        await db.SaveChangesAsync();

        var request = new RegisterRequestDto
        {
            FirstName = "New",
            LastName = "User",
            Email = "taken@example.com",
            Password = "SecurePass1!",
            Role = "Buyer",
        };

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            BuildSut(db).RegisterAsync(request));
    }

    [Fact]
    public async Task Register_InvalidRole_ThrowsArgumentException()
    {
        using var db = CreateDb();
        var request = new RegisterRequestDto
        {
            FirstName = "Eve",
            LastName = "Test",
            Email = "eve@example.com",
            Password = "SecurePass1!",
            Role = "NotARealRole",
        };

        await Assert.ThrowsAsync<ArgumentException>(() =>
            BuildSut(db).RegisterAsync(request));
    }

    // ── LoginAsync ───────────────────────────────────────────────────────────

    [Fact]
    public async Task Login_InvalidPassword_ThrowsUnauthorizedAccessException()
    {
        using var db = CreateDb();
        db.Users.Add(new User
        {
            FirstName = "Frank",
            LastName = "Miller",
            Email = "frank@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("CorrectPassword"),
            Role = UserRole.Buyer,
            AccountStatus = AccountStatus.Active,
        });
        await db.SaveChangesAsync();

        var request = new LoginRequestDto { Email = "frank@example.com", Password = "WrongPassword" };

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            BuildSut(db).LoginAsync(request));
    }

    [Fact]
    public async Task Login_PendingAccount_ThrowsInvalidOperationException()
    {
        using var db = CreateDb();
        db.Users.Add(new User
        {
            FirstName = "Grace",
            LastName = "Lee",
            Email = "grace@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!"),
            Role = UserRole.Agent,
            AccountStatus = AccountStatus.Pending,
        });
        await db.SaveChangesAsync();

        var request = new LoginRequestDto { Email = "grace@example.com", Password = "Password123!" };

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            BuildSut(db).LoginAsync(request));

        Assert.Contains("pending", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Login_SuspendedAccount_ThrowsInvalidOperationException()
    {
        using var db = CreateDb();
        db.Users.Add(new User
        {
            FirstName = "Hank",
            LastName = "Ford",
            Email = "hank@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!"),
            Role = UserRole.Buyer,
            AccountStatus = AccountStatus.Suspended,
        });
        await db.SaveChangesAsync();

        var request = new LoginRequestDto { Email = "hank@example.com", Password = "Password123!" };

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            BuildSut(db).LoginAsync(request));

        Assert.Contains("suspended", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Login_ActiveBuyer_ReturnsTokensAndUserInfo()
    {
        using var db = CreateDb();
        const string password = "Password123!";
        db.Users.Add(new User
        {
            FirstName = "Ivy",
            LastName = "Clark",
            Email = "ivy@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Role = UserRole.Buyer,
            AccountStatus = AccountStatus.Active,
        });
        await db.SaveChangesAsync();

        var request = new LoginRequestDto { Email = "ivy@example.com", Password = password };

        var result = await BuildSut(db).LoginAsync(request);

        Assert.Equal("test-access-token", result.Tokens.AccessToken);
        Assert.Equal("test-refresh-token", result.Tokens.RefreshToken);
        Assert.Equal("Buyer", result.User.Role);
        Assert.Equal("ivy@example.com", result.User.EmailAddress);
    }
}
