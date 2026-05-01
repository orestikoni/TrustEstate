using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TrustEstate.Application.DTOs.Auth;
using TrustEstate.Application.Interfaces.Auth;
using TrustEstate.Domain.Entities;
using TrustEstate.Domain.Enums;
using TrustEstate.Infrastructure.Persistence;

namespace TrustEstate.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly TrustEstateDbContext _db;
    private readonly IJwtService _jwt;
    private readonly IConfiguration _configuration;

    public AuthService(TrustEstateDbContext db, IJwtService jwt, IConfiguration configuration)
    {
        _db = db;
        _jwt = jwt;
        _configuration = configuration;
    }

    public async Task<LoginResponseDto> LoginAsync(LoginRequestDto request, CancellationToken ct = default)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email.ToLower(), ct);

        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid email or password.");

        if (user.AccountStatus == AccountStatus.Suspended)
            throw new InvalidOperationException("Your account has been suspended.");

        if (user.AccountStatus == AccountStatus.Deactivated)
            throw new InvalidOperationException("Your account has been deactivated.");

        user.LastLoginAt = DateTime.UtcNow;

        var refreshToken = new RefreshToken
        {
            Token = _jwt.GenerateRefreshToken(),
            UserId = user.Id,
            ExpiresAt = DateTime.UtcNow.AddDays(int.Parse(_configuration["Jwt:RefreshTokenExpiryDays"]!)),
        };

        _db.RefreshTokens.Add(refreshToken);
        await _db.SaveChangesAsync(ct);

        var expiryMinutes = int.Parse(_configuration["Jwt:AccessTokenExpiryMinutes"]!);

        return new LoginResponseDto
        {
            User = MapToUserDto(user),
            Tokens = new AuthTokensDto
            {
                AccessToken = _jwt.GenerateAccessToken(user),
                RefreshToken = refreshToken.Token,
                ExpiresIn = expiryMinutes * 60,
            },
        };
    }

    public async Task<RegisterResponseDto> RegisterAsync(RegisterRequestDto request, CancellationToken ct = default)
    {
        var emailLower = request.Email.ToLower();

        if (await _db.Users.AnyAsync(u => u.Email == emailLower, ct))
            throw new InvalidOperationException("An account with this email already exists.");

        if (!Enum.TryParse<UserRole>(request.Role, out var role))
            throw new ArgumentException("Invalid role specified.");

        var user = new User
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = emailLower,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = role,
            AccountStatus = role == UserRole.Admin ? AccountStatus.Pending : AccountStatus.Active,
            PhoneNumber = string.IsNullOrWhiteSpace(request.PhoneNumber) ? null : request.PhoneNumber,
            AgencyType = request.AgencyType,
            AgencyName = request.AgencyName,
            ProfessionalQualifications = request.ProfessionalQualifications,
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);

        return new RegisterResponseDto
        {
            User = MapToUserDto(user),
            Message = "Registration successful. Welcome to TrustEstate!",
        };
    }

    public async Task LogoutAsync(string refreshToken, CancellationToken ct = default)
    {
        var token = await _db.RefreshTokens.FirstOrDefaultAsync(r => r.Token == refreshToken, ct);
        if (token != null && token.RevokedAt == null)
        {
            token.RevokedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
        }
    }

    public async Task<AuthTokensDto> RefreshTokensAsync(string refreshToken, CancellationToken ct = default)
    {
        var token = await _db.RefreshTokens
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Token == refreshToken, ct);

        if (token == null || !token.IsActive)
            throw new UnauthorizedAccessException("Invalid or expired refresh token.");

        token.RevokedAt = DateTime.UtcNow;

        var newRefreshToken = new RefreshToken
        {
            Token = _jwt.GenerateRefreshToken(),
            UserId = token.UserId,
            ExpiresAt = DateTime.UtcNow.AddDays(int.Parse(_configuration["Jwt:RefreshTokenExpiryDays"]!)),
        };

        _db.RefreshTokens.Add(newRefreshToken);
        await _db.SaveChangesAsync(ct);

        var expiryMinutes = int.Parse(_configuration["Jwt:AccessTokenExpiryMinutes"]!);

        return new AuthTokensDto
        {
            AccessToken = _jwt.GenerateAccessToken(token.User),
            RefreshToken = newRefreshToken.Token,
            ExpiresIn = expiryMinutes * 60,
        };
    }

    public async Task<UserDto> GetCurrentUserAsync(int userId, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user == null)
            throw new UnauthorizedAccessException("User not found.");

        return MapToUserDto(user);
    }

    private static UserDto MapToUserDto(User user) => new()
    {
        UserId = user.Id,
        FirstName = user.FirstName,
        LastName = user.LastName,
        EmailAddress = user.Email,
        Role = user.Role.ToString(),
        AccountStatus = user.AccountStatus.ToString(),
        PhoneNumber = user.PhoneNumber,
        ProfilePhotoUrl = user.ProfilePhotoUrl,
        CreatedAt = user.CreatedAt.ToString("O"),
        LastLoginAt = user.LastLoginAt?.ToString("O"),
    };
}
