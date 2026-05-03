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

    // GET /api/listings — anyone can browse active listings
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<ListingDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetActiveListings(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await _listings.GetActiveListingsAsync(page, pageSize, ct);
        return Ok(result);
    }

    // GET /api/listings/{id} — anyone can view a listing detail
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ListingDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetListing(int id, CancellationToken ct)
    {
        var listing = await _listings.GetListingByIdAsync(id, ct);
        return Ok(listing);
    }

    // GET /api/listings/my — Property Owner views their own listings
    [HttpGet("my")]
    [Authorize(Roles = "PropertyOwner")]
    [ProducesResponseType(typeof(IEnumerable<ListingDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyListings(CancellationToken ct)
    {
        var ownerId = GetCurrentUserId();
        var listings = await _listings.GetOwnerListingsAsync(ownerId, ct);
        return Ok(listings);
    }

    // GET /api/listings/assigned — Agent views listings assigned to them
    [HttpGet("assigned")]
    [Authorize(Roles = "Agent")]
    [ProducesResponseType(typeof(IEnumerable<ListingDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAssignedListings(CancellationToken ct)
    {
        var agentId = GetCurrentUserId();
        var listings = await _listings.GetAgentListingsAsync(agentId, ct);
        return Ok(listings);
    }

    // POST /api/listings — Property Owner creates a listing
    [HttpPost]
    [Authorize(Roles = "PropertyOwner")]
    [ProducesResponseType(typeof(ListingDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateListing(
        [FromBody] CreateListingRequest request,
        CancellationToken ct)
    {
        var ownerId = GetCurrentUserId();
        var listing = await _listings.CreateListingAsync(ownerId, request, ct);
        return StatusCode(StatusCodes.Status201Created, listing);
    }

    // PUT /api/listings/{id} — Property Owner edits a listing
    [HttpPut("{id:int}")]
    [Authorize(Roles = "PropertyOwner")]
    [ProducesResponseType(typeof(ListingDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateListing(
        int id,
        [FromBody] UpdateListingRequest request,
        CancellationToken ct)
    {
        var ownerId = GetCurrentUserId();
        var listing = await _listings.UpdateListingAsync(ownerId, id, request, ct);
        return Ok(listing);
    }

    // DELETE /api/listings/{id} — Property Owner removes a listing
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

    // PUT /api/listings/{id}/approve — Agent approves a listing
    [HttpPut("{id:int}/approve")]
    [Authorize(Roles = "Agent")]
    [ProducesResponseType(typeof(ListingDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ApproveListing(int id, CancellationToken ct)
    {
        var agentId = GetCurrentUserId();
        var listing = await _listings.ApproveListingAsync(agentId, id, ct);
        return Ok(listing);
    }

    // PUT /api/listings/{id}/request-corrections — Agent requests corrections
    [HttpPut("{id:int}/request-corrections")]
    [Authorize(Roles = "Agent")]
    [ProducesResponseType(typeof(ListingDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RequestCorrections(
        int id,
        [FromBody] RequestCorrectionsRequest request,
        CancellationToken ct)
    {
        var agentId = GetCurrentUserId();
        var listing = await _listings.RequestCorrectionsAsync(agentId, id, request, ct);
        return Ok(listing);
    }

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