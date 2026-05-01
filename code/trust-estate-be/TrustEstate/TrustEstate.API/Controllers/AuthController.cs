using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TrustEstate.Application.DTOs.Auth;
using TrustEstate.Application.Interfaces.Auth;

namespace TrustEstate.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request, CancellationToken ct)
    {
        var result = await _authService.LoginAsync(request, ct);
        return Ok(result);
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequestDto request, CancellationToken ct)
    {
        var result = await _authService.RegisterAsync(request, ct);
        return StatusCode(201, result);
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] RefreshTokenRequestDto request, CancellationToken ct)
    {
        await _authService.LogoutAsync(request.RefreshToken, ct);
        return NoContent();
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequestDto request, CancellationToken ct)
    {
        var result = await _authService.RefreshTokensAsync(request.RefreshToken, ct);
        return Ok(result);
    }

    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Me(CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var user = await _authService.GetCurrentUserAsync(userId, ct);
        return Ok(user);
    }

    private int GetCurrentUserId()
    {
        var sub = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                  ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;

        if (sub == null || !int.TryParse(sub, out var userId))
            throw new UnauthorizedAccessException("Invalid token.");

        return userId;
    }
}
