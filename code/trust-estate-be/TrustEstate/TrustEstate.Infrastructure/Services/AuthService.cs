using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using TrustEstate.Application.DTOs.Auth;
using TrustEstate.Application.Interfaces.Auth;
using TrustEstate.Application.Interfaces.Services;
using TrustEstate.Domain.Entities;
using TrustEstate.Domain.Enums;
using TrustEstate.Domain.Exceptions;
using TrustEstate.Infrastructure.Identity;
using AuthenticationException = TrustEstate.Domain.Exceptions.AuthenticationException;

namespace TrustEstate.Infrastructure.Services;

public sealed class AuthService : IAuthService
{
    private readonly IUserRepository _users;
    private readonly ITokenRepository _tokens;
    private readonly ILoginAttemptRepository _loginAttempts;
    private readonly IJwtService _jwt;
    private readonly IEmailService _email;
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
        _users = users;
        _tokens = tokens;
        _loginAttempts = loginAttempts;
        _jwt = jwt;
        _email = email;
        _settings = settings.Value;
    }

    // REGISTER  (FR_13, FR_15)
    public async Task<RegisterResponse> RegisterAsync(RegisterRequest request, CancellationToken ct = default)
    {
        if (await _users.EmailExistsAsync(request.Email, ct))
            throw new ConflictException("An account with this email address already exists.");

        if (!Enum.TryParse<UserRole>(request.Role, out var role) || role == UserRole.Admin)
            throw new BusinessRuleException("Invalid role specified.");

        // Buyers and PropertyOwners are Active immediately; Agents and Inspectors are Pending
        var status = role is UserRole.Agent or UserRole.PropertyInspector
            ? AccountStatus.Pending
            : AccountStatus.Active;

        var user = new User
        {
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            EmailAddress = request.Email.Trim().ToLowerInvariant(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = role,
            AccountStatus = status,
            PhoneNumber = string.IsNullOrWhiteSpace(request.PhoneNumber) ? null : request.PhoneNumber.Trim(),
            CreatedAt = DateTime.UtcNow,
        };

        // Attach role-specific profile
        if (role == UserRole.Agent)
        {
            if (!Enum.TryParse<AgencyType>(request.AgencyType, out var agencyType))
                throw new BusinessRuleException("Invalid agency type specified.");

            user.AgentProfile = new AgentProfile
            {
                AgencyType = agencyType,
                AgencyName = agencyType == AgencyType.Agency
                    ? request.AgencyName?.Trim()
                    : null,
                IsVerified = false,
            };
        }
        else if (role == UserRole.PropertyInspector)
        {
            user.InspectorProfile = new InspectorProfile
            {
                ProfessionalQualifications = request.ProfessionalQualifications?.Trim(),
                IsVerified = false,
            };
        }

        await _users.AddAsync(user, ct);
        await _users.SaveChangesAsync(ct);

        var message = status == AccountStatus.Pending
            ? "Your account has been created and is pending Admin verification. You will be notified within 72 hours."
            : "Account created successfully. You can now log in.";

        return new RegisterResponse
        {
            User = MapToDto(user),
            Message = message,
        };
    }

    // LOGIN  (FR_03, FR_04)
    public async Task<LoginResponse> LoginAsync(LoginRequest request, string? ipAddress, CancellationToken ct = default)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await _users.GetByEmailAsync(email, ct);

        // Count recent failures regardless of whether user exists (prevents timing attacks)
        var recentFailures = await _loginAttempts.CountRecentFailedAttemptsAsync(email, FailedAttemptWindow, ct);
        if (recentFailures >= MaxFailedAttempts)
        {
            await RecordAttemptAsync(user?.UserId, email, false, ipAddress, ct);
            throw new AuthenticationException("Account temporarily locked due to too many failed attempts. Please try again later or reset your password.");
        }

        // Validate credentials
        bool credentialsValid = user is not null && BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);

        if (!credentialsValid)
        {
            await RecordAttemptAsync(user?.UserId, email, false, ipAddress, ct);
            throw new AuthenticationException("Invalid email or password.");
        }

        // Account status checks
        switch (user!.AccountStatus)
        {
            case AccountStatus.Pending:
                await RecordAttemptAsync(user.UserId, email, false, ipAddress, ct);
                throw new AuthenticationException("Your account is pending verification by an Admin. You will be notified within 72 hours.");
            case AccountStatus.Suspended:
                await RecordAttemptAsync(user.UserId, email, false, ipAddress, ct);
                throw new AuthenticationException("Your account has been suspended. Please contact support.");
            case AccountStatus.Deactivated:
                await RecordAttemptAsync(user.UserId, email, false, ipAddress, ct);
                throw new AuthenticationException("Your account has been deactivated. Please contact support.");
            case AccountStatus.Rejected:
                await RecordAttemptAsync(user.UserId, email, false, ipAddress, ct);
                throw new AuthenticationException("Your account registration was rejected. Please contact support.");
        }

        // Success — issue tokens
        var accessToken = _jwt.GenerateAccessToken(user);
        var rawRefreshToken = _jwt.GenerateRefreshToken();

        var refreshTokenEntity = new RefreshToken
        {
            UserId = user.UserId,
            TokenHash = HashToken(rawRefreshToken),
            ExpiresAt = DateTime.UtcNow.AddDays(_settings.RefreshTokenExpiryDays),
            CreatedByIp = ipAddress,
        };
        await _tokens.AddRefreshTokenAsync(refreshTokenEntity, ct);

        // Update last login
        user.LastLoginAt = DateTime.UtcNow;
        _users.Update(user);

        await RecordAttemptAsync(user.UserId, email, true, ipAddress, ct);
        await _users.SaveChangesAsync(ct);
        await _tokens.SaveChangesAsync(ct);

        return new LoginResponse
        {
            User = MapToDto(user),
            Tokens = new AuthTokensDto
            {
                AccessToken = accessToken,
                RefreshToken = rawRefreshToken,
                ExpiresIn = _jwt.AccessTokenExpiresInSeconds,
            },
        };
    }

    // LOGOUT
    public async Task LogoutAsync(int userId, string refreshToken, CancellationToken ct = default)
    {
        var hash = HashToken(refreshToken);
        var token = await _tokens.GetRefreshTokenByHashAsync(hash, ct);
        if (token is not null)
            await _tokens.RevokeRefreshTokenAsync(token, ct);
        await _tokens.SaveChangesAsync(ct);
    }

    // REFRESH TOKENS  — called by frontend api-client.ts on 401
    public async Task<AuthTokensDto> RefreshTokensAsync(string refreshToken, CancellationToken ct = default)
    {
        var hash = HashToken(refreshToken);
        var storedToken = await _tokens.GetRefreshTokenByHashAsync(hash, ct);

        if (storedToken is null || storedToken.IsRevoked || storedToken.ExpiresAt <= DateTime.UtcNow)
            throw new AuthenticationException("Refresh token is invalid or has expired. Please log in again.");

        var user = await _users.GetByIdAsync(storedToken.UserId, ct)
            ?? throw new AuthenticationException("User not found.");

        if (user.AccountStatus != AccountStatus.Active)
            throw new AuthenticationException("Account is no longer active.");

        // Rotate: revoke old, issue new
        await _tokens.RevokeRefreshTokenAsync(storedToken, ct);

        var newAccessToken = _jwt.GenerateAccessToken(user);
        var newRawRefresh = _jwt.GenerateRefreshToken();

        await _tokens.AddRefreshTokenAsync(new RefreshToken
        {
            UserId = user.UserId,
            TokenHash = HashToken(newRawRefresh),
            ExpiresAt = DateTime.UtcNow.AddDays(_settings.RefreshTokenExpiryDays),
        }, ct);

        await _tokens.SaveChangesAsync(ct);

        return new AuthTokensDto
        {
            AccessToken = newAccessToken,
            RefreshToken = newRawRefresh,
            ExpiresIn = _jwt.AccessTokenExpiresInSeconds,
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

    // helpers
    private static string HashToken(string rawToken)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(rawToken));
        return Convert.ToBase64String(bytes);
    }

    private async Task RecordAttemptAsync(int? userId, string email, bool success, string? ip, CancellationToken ct)
    {
        await _loginAttempts.AddAsync(new LoginAttempt
        {
            UserId = userId,
            EmailAttempted = email,
            Success = success,
            AttemptedAt = DateTime.UtcNow,
            IpAddress = ip,
        }, ct);
        await _loginAttempts.SaveChangesAsync(ct);
    }

    private static UserDto MapToDto(User user) => new()
    {
        UserId = user.UserId,
        FirstName = user.FirstName,
        LastName = user.LastName,
        EmailAddress = user.EmailAddress,
        Role = user.Role.ToString(),
        AccountStatus = user.AccountStatus.ToString(),
        PhoneNumber = user.PhoneNumber,
        ProfilePhotoUrl = user.ProfilePhotoUrl,
        CreatedAt = user.CreatedAt,
        LastLoginAt = user.LastLoginAt,
    };
}