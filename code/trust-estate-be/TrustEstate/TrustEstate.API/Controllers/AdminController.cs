using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TrustEstate.Application.DTOs.Admin;
using TrustEstate.Application.Interfaces.Admin;
using TrustEstate.Domain.Exceptions;

namespace TrustEstate.API.Controllers;

[ApiController]
[Route("api/admin")]
[Produces("application/json")]
[Authorize(Roles = "Admin")]
public sealed class AdminController : ControllerBase
{
    private readonly IAdminService _admin;

    public AdminController(IAdminService admin) => _admin = admin;

    // ── Analytics ─────────────────────────────────────────────────────────────

    [HttpGet("analytics")]
    [ProducesResponseType(typeof(AnalyticsDashboardDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAnalytics(CancellationToken ct)
    {
        var dashboard = await _admin.GetAnalyticsDashboardAsync(ct);
        return Ok(dashboard);
    }

    // ── User Management ───────────────────────────────────────────────────────

    [HttpGet("users/pending")]
    [ProducesResponseType(typeof(IEnumerable<PendingUserDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPendingVerifications(CancellationToken ct)
    {
        var pending = await _admin.GetPendingVerificationsAsync(ct);
        return Ok(pending);
    }

    [HttpGet("users")]
    [ProducesResponseType(typeof(IEnumerable<AdminUserDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllUsers(
        [FromQuery] string? role,
        [FromQuery] string? status,
        CancellationToken ct)
    {
        var users = await _admin.GetAllUsersAsync(role, status, ct);
        return Ok(users);
    }

    [HttpPost("users/{userId:int}/approve")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ApproveUser(int userId, CancellationToken ct)
    {
        var adminId = GetCurrentUserId();
        await _admin.ApproveUserAsync(adminId, userId, ct);
        return NoContent();
    }

    [HttpPost("users/{userId:int}/reject")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RejectUser(int userId, [FromBody] UserActionRequest request, CancellationToken ct)
    {
        var adminId = GetCurrentUserId();
        await _admin.RejectUserAsync(adminId, userId, request, ct);
        return NoContent();
    }

    [HttpPost("users/{userId:int}/deactivate")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeactivateUser(int userId, [FromBody] UserActionRequest request, CancellationToken ct)
    {
        var adminId = GetCurrentUserId();
        await _admin.DeactivateUserAsync(adminId, userId, request, ct);
        return NoContent();
    }

    [HttpPost("users/{userId:int}/suspend")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SuspendUser(int userId, [FromBody] UserActionRequest request, CancellationToken ct)
    {
        var adminId = GetCurrentUserId();
        await _admin.SuspendUserAsync(adminId, userId, request, ct);
        return NoContent();
    }

    [HttpPost("users/{userId:int}/reactivate")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ReactivateUser(int userId, CancellationToken ct)
    {
        var adminId = GetCurrentUserId();
        await _admin.ReactivateUserAsync(adminId, userId, ct);
        return NoContent();
    }

    // ── Listing Management ────────────────────────────────────────────────────

    [HttpGet("listings")]
    [ProducesResponseType(typeof(IEnumerable<AdminListingDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllListings([FromQuery] string? status, CancellationToken ct)
    {
        var listings = await _admin.GetAllListingsAsync(status, ct);
        return Ok(listings);
    }

    [HttpPost("listings/{listingId:int}/flag")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> FlagListing(int listingId, [FromBody] ListingActionRequest request, CancellationToken ct)
    {
        var adminId = GetCurrentUserId();
        await _admin.FlagListingAsync(adminId, listingId, request, ct);
        return NoContent();
    }

    [HttpPost("listings/{listingId:int}/suspend")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SuspendListing(int listingId, [FromBody] ListingActionRequest request, CancellationToken ct)
    {
        var adminId = GetCurrentUserId();
        await _admin.SuspendListingAsync(adminId, listingId, request, ct);
        return NoContent();
    }

    [HttpPost("listings/{listingId:int}/remove")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveListing(int listingId, [FromBody] ListingActionRequest request, CancellationToken ct)
    {
        var adminId = GetCurrentUserId();
        await _admin.RemoveListingAsync(adminId, listingId, request, ct);
        return NoContent();
    }

    // ── Inspection Report Monitoring ──────────────────────────────────────────

    [HttpGet("inspection-reports")]
    [ProducesResponseType(typeof(IEnumerable<AdminInspectionReportDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllInspectionReports(CancellationToken ct)
    {
        var reports = await _admin.GetAllInspectionReportsAsync(ct);
        return Ok(reports);
    }

    [HttpPost("inspection-reports/{reportId:int}/flag")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> FlagInspectionReport(int reportId, [FromBody] InspectionReportActionRequest request, CancellationToken ct)
    {
        var adminId = GetCurrentUserId();
        await _admin.FlagInspectionReportAsync(adminId, reportId, request, ct);
        return NoContent();
    }

    [HttpPost("inspection-reports/{reportId:int}/remove")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveInspectionReport(int reportId, [FromBody] InspectionReportActionRequest request, CancellationToken ct)
    {
        var adminId = GetCurrentUserId();
        await _admin.RemoveInspectionReportAsync(adminId, reportId, request, ct);
        return NoContent();
    }

    // ── Dispute Management ────────────────────────────────────────────────────

    [HttpGet("disputes")]
    [ProducesResponseType(typeof(IEnumerable<AdminDisputeDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllDisputes([FromQuery] string? status, CancellationToken ct)
    {
        var disputes = await _admin.GetAllDisputesAsync(status, ct);
        return Ok(disputes);
    }

    [HttpPost("disputes/{disputeId:int}/resolve")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ResolveDispute(int disputeId, [FromBody] ResolveDisputeRequest request, CancellationToken ct)
    {
        var adminId = GetCurrentUserId();
        await _admin.ResolveDisputeAsync(adminId, disputeId, request, ct);
        return NoContent();
    }

    [HttpPost("disputes/{disputeId:int}/suspend-transaction")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SuspendTransactionForDispute(int disputeId, [FromBody] SuspendTransactionRequest request, CancellationToken ct)
    {
        var adminId = GetCurrentUserId();
        await _admin.SuspendTransactionForDisputeAsync(adminId, disputeId, request, ct);
        return NoContent();
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private int GetCurrentUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")
            ?? throw new ForbiddenException("User identity not found in token.");
        if (!int.TryParse(sub, out var userId))
            throw new ForbiddenException("Invalid token format.");
        return userId;
    }
}
