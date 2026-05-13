using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TrustEstate.Application.DTOs.Disputes;
using TrustEstate.Application.Interfaces.Disputes;
using TrustEstate.Domain.Exceptions;

namespace TrustEstate.API.Controllers;

[ApiController]
[Route("api/disputes")]
[Produces("application/json")]
public sealed class DisputeController : ControllerBase
{
    private readonly IDisputeService _disputes;

    public DisputeController(IDisputeService disputes) => _disputes = disputes;

    [HttpGet("form")]
    [Authorize]
    [ProducesResponseType(typeof(DisputeFormDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDisputeForm([FromQuery] int listingId, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var form = await _disputes.GetDisputeFormAsync(userId, listingId, ct);
        return Ok(form);
    }

    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(DisputeDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SubmitDispute([FromBody] SubmitDisputeRequest request, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var dispute = await _disputes.SubmitDisputeAsync(userId, request, ct);
        return StatusCode(StatusCodes.Status201Created, dispute);
    }

    [HttpGet("my")]
    [Authorize]
    [ProducesResponseType(typeof(IEnumerable<DisputeDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyDisputes(CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var disputes = await _disputes.GetUserDisputesAsync(userId, ct);
        return Ok(disputes);
    }

    [HttpGet("{disputeId:int}")]
    [Authorize]
    [ProducesResponseType(typeof(DisputeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDisputeById(int disputeId, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var dispute = await _disputes.GetDisputeByIdAsync(userId, disputeId, ct);
        return Ok(dispute);
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
