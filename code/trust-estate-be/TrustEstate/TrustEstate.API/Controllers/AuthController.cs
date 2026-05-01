using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TrustEstate.Application.DTOs.Auth;
using TrustEstate.Application.Interfaces.Auth;
using TrustEstate.Domain.Exceptions;
using LoginRequest = TrustEstate.Application.DTOs.Auth.LoginRequest;
using RegisterRequest = TrustEstate.Application.DTOs.Auth.RegisterRequest;
using ForgotPasswordRequest = TrustEstate.Application.DTOs.Auth.ForgotPasswordRequest;
using ResetPasswordRequest = TrustEstate.Application.DTOs.Auth.ResetPasswordRequest;

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
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
    {
        var result = await _authService.LoginAsync(request);
        return Ok(result);
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequestDto request)
    {
        var result = await _authService.RegisterAsync(request);
        return StatusCode(201, result);
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] RefreshTokenRequestDto request)
    {
        await _authService.LogoutAsync(request.RefreshToken);
        return NoContent();
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequestDto request)
    {
        var result = await _authService.RefreshTokensAsync(request.RefreshToken);
        return Ok(result);
    }

    //  POST /api/auth/forgot-password 
    /// <summary>
    /// Sends a password reset email if the address exists.
    /// Always returns 200 to prevent email enumeration.
    /// </summary>
    [HttpPost("forgot-password")]
    [ProducesResponseType(typeof(MessageResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> ForgotPassword(
        [FromBody] ForgotPasswordRequest request,
        CancellationToken ct)
    {
        await _auth.ForgotPasswordAsync(request, ct);
        return Ok(new MessageResponse("If an account exists for that email, a reset link has been sent."));
    }

    // POST /api/auth/reset-password 
    /// <summary>
    /// Validates the token from the reset link URL and updates the password.
    /// FE maps 400 ? "This reset link is invalid or has expired."
    /// </summary>
    [HttpPost("reset-password")]
    [ProducesResponseType(typeof(MessageResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResetPassword(
        [FromBody] ResetPasswordRequest request,
        CancellationToken ct)
    {
        await _auth.ResetPasswordAsync(request, ct);
        return Ok(new MessageResponse("Password has been reset successfully."));
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
}
