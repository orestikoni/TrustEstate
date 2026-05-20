using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TrustEstate.Application.DTOs.Inspections;
using TrustEstate.Application.Interfaces.Inspections;
using TrustEstate.Domain.Exceptions;

namespace TrustEstate.API.Controllers;

[ApiController]
[Route("api/inspections")]
[Produces("application/json")]
public sealed class InspectionController : ControllerBase
{
    private readonly IInspectionService _inspections;

    public InspectionController(IInspectionService inspections) => _inspections = inspections;

    // ── Agent ─────────────────────────────────────────────────────────────────

    [HttpGet("inspectors")]
    [Authorize(Roles = "Agent")]
    [ProducesResponseType(typeof(IEnumerable<InspectorDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAvailableInspectors(CancellationToken ct)
    {
        var inspectors = await _inspections.GetAvailableInspectorsAsync(ct);
        return Ok(inspectors);
    }

    [HttpPost("assign")]
    [Authorize(Roles = "Agent")]
    [ProducesResponseType(typeof(InspectionDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> AssignInspector([FromBody] AssignInspectorRequest request, CancellationToken ct)
    {
        var agentId = GetCurrentUserId();
        var inspection = await _inspections.AssignInspectorAsync(agentId, request, ct);
        return StatusCode(StatusCodes.Status201Created, inspection);
    }

    [HttpPut("{inspectionId:int}/reassign")]
    [Authorize(Roles = "Agent")]
    [ProducesResponseType(typeof(InspectionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ReassignInspector(int inspectionId, [FromBody] ReassignInspectorRequest request, CancellationToken ct)
    {
        var agentId = GetCurrentUserId();
        var inspection = await _inspections.ReassignInspectorAsync(agentId, inspectionId, request, ct);
        return Ok(inspection);
    }

    [HttpGet("listing/{listingId:int}")]
    [Authorize(Roles = "Agent")]
    [ProducesResponseType(typeof(InspectionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetInspectionByListing(int listingId, CancellationToken ct)
    {
        var agentId = GetCurrentUserId();
        var inspection = await _inspections.GetInspectionByListingAsync(agentId, listingId, ct);
        return Ok(inspection);
    }

    // ── Property Inspector ────────────────────────────────────────────────────

    [HttpGet("my")]
    [Authorize(Roles = "PropertyInspector")]
    [ProducesResponseType(typeof(IEnumerable<MyInspectionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyInspections(CancellationToken ct)
    {
        var inspectorId = GetCurrentUserId();
        var result = await _inspections.GetMyInspectionsAsync(inspectorId, ct);
        return Ok(result);
    }

    [HttpPut("{inspectionId:int}/status")]
    [Authorize(Roles = "PropertyInspector")]
    [ProducesResponseType(typeof(InspectionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateInspectionStatus(int inspectionId, [FromBody] UpdateInspectionStatusRequest request, CancellationToken ct)
    {
        var inspectorId = GetCurrentUserId();
        var inspection = await _inspections.UpdateInspectionStatusAsync(inspectorId, inspectionId, request, ct);
        return Ok(inspection);
    }

    [HttpPost("{inspectionId:int}/report")]
    [Authorize(Roles = "PropertyInspector")]
    [ProducesResponseType(typeof(InspectionReportDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> SubmitReport(int inspectionId, [FromBody] SubmitInspectionReportRequest request, CancellationToken ct)
    {
        var inspectorId = GetCurrentUserId();
        var report = await _inspections.SubmitInspectionReportAsync(inspectorId, inspectionId, request, ct);
        return StatusCode(StatusCodes.Status201Created, report);
    }

    [HttpPost("{inspectionId:int}/verdict")]
    [Authorize(Roles = "PropertyInspector")]
    [ProducesResponseType(typeof(InspectionReportDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SubmitFinalVerdict(int inspectionId, [FromBody] SubmitVerdictRequest request, CancellationToken ct)
    {
        var inspectorId = GetCurrentUserId();
        var report = await _inspections.SubmitFinalVerdictAsync(inspectorId, inspectionId, request, ct);
        return Ok(report);
    }

    // ── Buyer ─────────────────────────────────────────────────────────────────

    [HttpGet("listing/{listingId:int}/report")]
    [Authorize(Roles = "Buyer")]
    [ProducesResponseType(typeof(InspectionReportDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetInspectionReport(int listingId, CancellationToken ct)
    {
        var buyerId = GetCurrentUserId();
        var report = await _inspections.GetInspectionReportAsync(buyerId, listingId, ct);
        return Ok(report);
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
