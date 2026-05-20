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

    [HttpGet("listings")]
    [ProducesResponseType(typeof(IEnumerable<AdminListingDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllListings([FromQuery] string? status, CancellationToken ct)
    {
        var result = await _admin.GetAllListingsAsync(status, ct);
        return Ok(result);
    }

    [HttpPut("listings/{id:int}/suspend")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SuspendListing(int id, [FromBody] AdminListingActionRequest request, CancellationToken ct)
    {
        await _admin.SuspendListingAsync(id, request.Reason, ct);
        return NoContent();
    }

    [HttpPut("listings/{id:int}/remove")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveListing(int id, [FromBody] AdminListingActionRequest request, CancellationToken ct)
    {
        await _admin.RemoveListingAsync(id, request.Reason, ct);
        return NoContent();
    }

    [HttpGet("users")]
    [ProducesResponseType(typeof(IEnumerable<AdminUserDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllUsers(CancellationToken ct)
    {
        var result = await _admin.GetAllUsersAsync(ct);
        return Ok(result);
    }

    [HttpPut("users/{userId:int}/suspend")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SuspendUser(int userId, [FromBody] SuspendUserRequest request, CancellationToken ct)
    {
        await _admin.SuspendUserAsync(userId, request.Reason, ct);
        return NoContent();
    }

    [HttpGet("inspections")]
    [ProducesResponseType(typeof(IEnumerable<AdminInspectionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllInspections(CancellationToken ct)
    {
        var result = await _admin.GetAllInspectionsAsync(ct);
        return Ok(result);
    }

    [HttpGet("disputes")]
    [ProducesResponseType(typeof(IEnumerable<AdminDisputeDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllDisputes(CancellationToken ct)
    {
        var result = await _admin.GetAllDisputesAsync(ct);
        return Ok(result);
    }

    [HttpPut("disputes/{disputeId:int}/resolve")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ResolveDispute(int disputeId, [FromBody] ResolveDisputeRequest request, CancellationToken ct)
    {
        await _admin.ResolveDisputeAsync(disputeId, request.ResolutionOutcome, ct);
        return NoContent();
    }
}
