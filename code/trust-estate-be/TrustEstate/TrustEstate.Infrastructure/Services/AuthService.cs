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
    private readonly AuthSettings _settings;

    // How many consecutive failures lock the account (FR_04)
    private const int MaxFailedAttempts = 5;
    private static readonly TimeSpan FailedAttemptWindow = TimeSpan.FromMinutes(15);

    public AuthService(
        IUserRepository users,
        ITokenRepository tokens,
        ILoginAttemptRepository loginAttempts,
        IJwtService jwt,
        IEmailService email,
        IOptions<AuthSettings> settings)
    {
        _db = db;
        _jwt = jwt;
        _email = email;
        _settings = settings.Value;
    }

    public async Task<LoginResponseDto> LoginAsync(LoginRequestDto request)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email.ToLower());

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
        await _db.SaveChangesAsync();

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

    public async Task<RegisterResponseDto> RegisterAsync(RegisterRequestDto request)
    {
        var emailLower = request.Email.ToLower();

        if (await _db.Users.AnyAsync(u => u.Email == emailLower))
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
        await _db.SaveChangesAsync();

        return new RegisterResponseDto
        {
            User = MapToUserDto(user),
            Message = "Registration successful. Welcome to TrustEstate!",
        };
    }

    public async Task LogoutAsync(string refreshToken)
    {
        var token = await _db.RefreshTokens.FirstOrDefaultAsync(r => r.Token == refreshToken);
        if (token != null && token.RevokedAt == null)
        {
            token.RevokedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }
    }

    public async Task<AuthTokensDto> RefreshTokensAsync(string refreshToken)
    {
        var token = await _db.RefreshTokens
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Token == refreshToken);

        if (token == null || !token.IsActive)
            throw new UnauthorizedAccessException("Invalid or expired refresh token.");

        token.RevokedAt = DateTime.UtcNow;

        var newRefreshToken = new RefreshToken
        {
            Token = _jwt.GenerateRefreshToken(),
            UserId = token.UserId,
            ExpiresAt = DateTime.UtcNow.AddDays(int.Parse(_configuration["Jwt:RefreshTokenExpiryDays"]!)),
        };
    }
    // FORGOT PASSWORD  (FR_05)
    public async Task ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken ct = default)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await _users.GetByEmailAsync(email, ct);

        // Always return — never reveal whether email exists
        if (user is null || user.AccountStatus != AccountStatus.Active)
            return;

        var rawToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64))
            .Replace("+", "-").Replace("/", "_").Replace("=", "");

        var tokenEntity = new PasswordResetToken
        {
            UserId = user.UserId,
            TokenHash = HashToken(rawToken),
            ExpiresAt = DateTime.UtcNow.AddHours(1),   // 1-hour expiry shown in FE success screen
            CreatedAt = DateTime.UtcNow,
        };

        await _tokens.AddPasswordResetTokenAsync(tokenEntity, ct);
        await _tokens.SaveChangesAsync(ct);

        var resetLink = $"{_settings.FrontendBaseUrl}/reset-password/{rawToken}";
        await _email.SendPasswordResetEmailAsync(user.EmailAddress, user.FirstName, resetLink, ct);
    }

    // RESET PASSWORD  (FR_05)
    public async Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken ct = default)
    {
        var hash = HashToken(request.Token);
        var tokenEntity = await _tokens.GetActivePasswordResetTokenByHashAsync(hash, ct);

        // FE maps 400 → "This reset link is invalid or has expired."
        if (tokenEntity is null || tokenEntity.ExpiresAt <= DateTime.UtcNow)
            throw new AuthenticationException("Reset link is invalid or has expired.");

        var user = await _users.GetByIdAsync(tokenEntity.UserId, ct)
            ?? throw new AuthenticationException("User not found.");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        _users.Update(user);

        // Invalidate token and revoke all refresh tokens (security best practice)
        await _tokens.InvalidatePasswordResetTokenAsync(tokenEntity, ct);
        await _tokens.RevokeAllUserRefreshTokensAsync(user.UserId, ct);

        await _users.SaveChangesAsync(ct);
        await _tokens.SaveChangesAsync(ct);
    }

    // GET CURRENT USER  — called by FE on app boot (authService.me())
    public async Task<UserDto> GetCurrentUserAsync(int userId, CancellationToken ct = default)
    {
        var user = await _users.GetByIdAsync(userId, ct)
            ?? throw new NotFoundException(nameof(User), userId);
        return MapToDto(user);
    }

    public async Task<UserDto> GetCurrentUserAsync(int userId)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);
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
