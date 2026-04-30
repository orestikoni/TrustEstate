using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TrustEstate.Application.DTOs.Auth;
using TrustEstate.Application.Interfaces.Auth;
using TrustEstate.Domain.Exceptions;

namespace TrustEstate.API.Controllers;

[ApiController]
[Route("api/auth")]
[Produces("application/json")]
public sealed class AuthController : ControllerBase
{
    private readonly IAuthService _auth;

    public AuthController(IAuthService auth) => _auth = auth;

    //  POST /api/auth/register 
    /// <summary>
    /// Registers a new user.
    /// Buyers/PropertyOwners ? Active immediately.
    /// Agents/Inspectors ? Pending, requires Admin approval.
    /// </summary>
    [HttpPost("register")]
    [ProducesResponseType(typeof(RegisterResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register(
        [FromBody] RegisterRequest request,
        CancellationToken ct)
    {
        var result = await _auth.RegisterAsync(request, ct);
        return StatusCode(StatusCodes.Status201Created, result);
    }

    //  POST /api/auth/login 
    /// <summary>
    /// Validates credentials and returns user + JWT access/refresh tokens.
    /// The frontend stores tokens in localStorage (api-client.ts ? tokenStorage).
    /// </summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login(
        [FromBody] LoginRequest request,
        CancellationToken ct)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var result = await _auth.LoginAsync(request, ip, ct);
        return Ok(result);
    }

    //  POST /api/auth/logout 
    /// <summary>
    /// Revokes the supplied refresh token server-side.
    /// Called by auth.context.ts ? logout().
    /// </summary>
    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Logout(
        [FromBody] RefreshTokenRequest request,
        CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        await _auth.LogoutAsync(userId, request.RefreshToken, ct);
        return NoContent();
    }

    //  POST /api/auth/refresh 
    /// <summary>
    /// Silently issues a new access + refresh token pair.
    /// Called automatically by api-client.ts when a 401 is received.
    /// </summary>
    [HttpPost("refresh")]
    [ProducesResponseType(typeof(AuthTokensDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Refresh(
        [FromBody] RefreshTokenRequest request,
        CancellationToken ct)
    {
        var result = await _auth.RefreshTokensAsync(request.RefreshToken, ct);
        return Ok(result);
    }

    //  GET /api/auth/me
    /// <summary>
    /// Returns the current authenticated user.
    /// Called by auth.context.ts on app boot to rehydrate user state.
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Me(CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var user = await _auth.GetCurrentUserAsync(userId, ct);
        return Ok(user);
    }

    private int GetCurrentUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")
            ?? throw new ForbiddenException("User identity not found in token.");
        return int.Parse(sub);
    }
}
public sealed record ApiErrorResponse(string Message, int StatusCode, Dictionary<string, string[]>? Errors = null);