using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TrustEstate.Application.DTOs.Admin;
using TrustEstate.Application.Interfaces.Admin;

namespace TrustEstate.API.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
[Produces("application/json")]
public sealed class AdminController : ControllerBase
{
    private readonly IAdminService _admin;

    public AdminController(IAdminService admin) => _admin = admin;

    [HttpGet("verifications")]
    [ProducesResponseType(typeof(IEnumerable<PendingVerificationDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPendingVerifications(CancellationToken ct)
    {
        var result = await _admin.GetPendingVerificationsAsync(ct);
        return Ok(result);
    }

    [HttpPut("verifications/{userId:int}/approve")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ApproveVerification(int userId, CancellationToken ct)
    {
        await _admin.ApproveVerificationAsync(userId, ct);
        return NoContent();
    }

    [HttpPut("verifications/{userId:int}/reject")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RejectVerification(
        int userId,
        [FromBody] RejectVerificationRequest request,
        CancellationToken ct)
    {
        await _admin.RejectVerificationAsync(userId, request.Notes, ct);
        return NoContent();
    }
}
