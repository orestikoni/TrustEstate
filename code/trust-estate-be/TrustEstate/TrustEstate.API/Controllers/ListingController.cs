using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TrustEstate.Application.DTOs.Listings;
using TrustEstate.Application.Interfaces.Listings;
using TrustEstate.Domain.Exceptions;

namespace TrustEstate.API.Controllers;

[ApiController]
[Route("api/listings")]
[Produces("application/json")]
public sealed class ListingController : ControllerBase
{
    private readonly IListingService _listings;

    public ListingController(IListingService listings) => _listings = listings;

    // ── Public ────────────────────────────────────────────────────────────────

    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<ListingDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetActiveListings(
        [FromQuery] string? city,
        [FromQuery] string? country,
        [FromQuery] decimal? minPrice,
        [FromQuery] decimal? maxPrice,
        [FromQuery] string? propertyType,
        [FromQuery] string? listingType,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var filter = new ListingFilterRequest
        {
            City = city,
            Country = country,
            MinPrice = minPrice,
            MaxPrice = maxPrice,
            PropertyType = propertyType,
            ListingType = listingType,
            Page = page,
            PageSize = pageSize,
        };
        var result = await _listings.GetActiveListingsAsync(filter, ct);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ListingDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetListing(int id, CancellationToken ct)
    {
        var listing = await _listings.GetListingByIdAsync(id, ct);
        return Ok(listing);
    }

    [HttpGet("agents")]
    [Authorize(Roles = "PropertyOwner")]
    [ProducesResponseType(typeof(IEnumerable<AvailableAgentDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAvailableAgents(CancellationToken ct)
    {
        var agents = await _listings.GetAvailableAgentsAsync(ct);
        return Ok(agents);
    }

    // ── Property Owner ────────────────────────────────────────────────────────

    [HttpGet("my")]
    [Authorize(Roles = "PropertyOwner")]
    [ProducesResponseType(typeof(IEnumerable<ListingDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyListings(CancellationToken ct)
    {
        var ownerId = GetCurrentUserId();
        var listings = await _listings.GetOwnerListingsAsync(ownerId, ct);
        return Ok(listings);
    }

    [HttpPost]
    [Authorize(Roles = "PropertyOwner")]
    [ProducesResponseType(typeof(ListingDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateListing([FromBody] CreateListingRequest request, CancellationToken ct)
    {
        var ownerId = GetCurrentUserId();
        var listing = await _listings.CreateListingAsync(ownerId, request, ct);
        return StatusCode(StatusCodes.Status201Created, listing);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "PropertyOwner")]
    [ProducesResponseType(typeof(ListingDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateListing(int id, [FromBody] UpdateListingRequest request, CancellationToken ct)
    {
        var ownerId = GetCurrentUserId();
        var listing = await _listings.UpdateListingAsync(ownerId, id, request, ct);
        return Ok(listing);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "PropertyOwner")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteListing(int id, CancellationToken ct)
    {
        var ownerId = GetCurrentUserId();
        await _listings.DeleteListingAsync(ownerId, id, ct);
        return NoContent();
    }

    // ── Agent ─────────────────────────────────────────────────────────────────

    [HttpGet("assigned")]
    [Authorize(Roles = "Agent")]
    [ProducesResponseType(typeof(IEnumerable<ListingDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAssignedListings(CancellationToken ct)
    {
        var agentId = GetCurrentUserId();
        var listings = await _listings.GetAgentListingsAsync(agentId, ct);
        return Ok(listings);
    }

    [HttpPut("{id:int}/assignment/respond")]
    [Authorize(Roles = "Agent")]
    [ProducesResponseType(typeof(ListingAssignmentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RespondToAssignment(int id, [FromBody] RespondToAssignmentRequest request, CancellationToken ct)
    {
        var agentId = GetCurrentUserId();
        var result = await _listings.RespondToAssignmentAsync(agentId, id, request, ct);
        return Ok(result);
    }

    [HttpPut("{id:int}/approve")]
    [Authorize(Roles = "Agent")]
    [ProducesResponseType(typeof(ListingDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ApproveListing(int id, CancellationToken ct)
    {
        var agentId = GetCurrentUserId();
        var listing = await _listings.ApproveListingAsync(agentId, id, ct);
        return Ok(listing);
    }

    [HttpPut("{id:int}/request-corrections")]
    [Authorize(Roles = "Agent")]
    [ProducesResponseType(typeof(ListingDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RequestCorrections(int id, [FromBody] RequestCorrectionsRequest request, CancellationToken ct)
    {
        var agentId = GetCurrentUserId();
        var listing = await _listings.RequestCorrectionsAsync(agentId, id, request, ct);
        return Ok(listing);
    }

    [HttpPut("{id:int}/agent-update")]
    [Authorize(Roles = "Agent")]
    [ProducesResponseType(typeof(ListingDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AgentUpdateListing(int id, [FromBody] AgentUpdateListingRequest request, CancellationToken ct)
    {
        var agentId = GetCurrentUserId();
        var listing = await _listings.AgentUpdateListingAsync(agentId, id, request, ct);
        return Ok(listing);
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