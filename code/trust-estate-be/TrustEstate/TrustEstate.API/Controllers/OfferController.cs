using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TrustEstate.Application.DTOs.Offers;
using TrustEstate.Application.Interfaces.Offers;
using TrustEstate.Domain.Exceptions;

namespace TrustEstate.API.Controllers;

[ApiController]
[Route("api/offers")]
[Produces("application/json")]
public sealed class OfferController : ControllerBase
{
    private readonly IOfferService _offers;

    public OfferController(IOfferService offers) => _offers = offers;

    // ── Buyer ─────────────────────────────────────────────────────────────────

    [HttpPost]
    [Authorize(Roles = "Buyer")]
    [ProducesResponseType(typeof(OfferDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> SubmitOffer([FromBody] SubmitOfferRequest request, CancellationToken ct)
    {
        var buyerId = GetCurrentUserId();
        var offer = await _offers.SubmitOfferAsync(buyerId, request, ct);
        return StatusCode(StatusCodes.Status201Created, offer);
    }

    [HttpGet("my")]
    [Authorize(Roles = "Buyer")]
    [ProducesResponseType(typeof(IEnumerable<OfferDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyOffers(CancellationToken ct)
    {
        var buyerId = GetCurrentUserId();
        var offers = await _offers.GetBuyerOffersAsync(buyerId, ct);
        return Ok(offers);
    }

    [HttpPost("{offerId:int}/accept-counter")]
    [Authorize(Roles = "Buyer")]
    [ProducesResponseType(typeof(OfferDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AcceptCounterOffer(int offerId, CancellationToken ct)
    {
        var buyerId = GetCurrentUserId();
        var offer = await _offers.AcceptCounterOfferAsync(buyerId, offerId, ct);
        return Ok(offer);
    }

    [HttpPost("{offerId:int}/decline-counter")]
    [Authorize(Roles = "Buyer")]
    [ProducesResponseType(typeof(OfferDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeclineCounterOffer(int offerId, CancellationToken ct)
    {
        var buyerId = GetCurrentUserId();
        var offer = await _offers.DeclineCounterOfferAsync(buyerId, offerId, ct);
        return Ok(offer);
    }

    [HttpPost("{offerId:int}/revise")]
    [Authorize(Roles = "Buyer")]
    [ProducesResponseType(typeof(OfferDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SubmitRevisedOffer(int offerId, [FromBody] SubmitRevisedOfferRequest request, CancellationToken ct)
    {
        var buyerId = GetCurrentUserId();
        var offer = await _offers.SubmitRevisedOfferAsync(buyerId, offerId, request, ct);
        return Ok(offer);
    }

    [HttpPost("{offerId:int}/withdraw")]
    [Authorize(Roles = "Buyer")]
    [ProducesResponseType(typeof(OfferDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> WithdrawOffer(int offerId, CancellationToken ct)
    {
        var buyerId = GetCurrentUserId();
        await _offers.WithdrawOfferAsync(buyerId, offerId, ct);
        return NoContent();
    }

    [HttpGet("{offerId:int}/post-inspection-options")]
    [Authorize(Roles = "Buyer")]
    [ProducesResponseType(typeof(PostInspectionOptionsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPostInspectionOptions(int offerId, CancellationToken ct)
    {
        var buyerId = GetCurrentUserId();
        var options = await _offers.GetPostInspectionOptionsAsync(buyerId, offerId, ct);
        return Ok(options);
    }

    [HttpPost("{offerId:int}/withdraw-after-inspection")]
    [Authorize(Roles = "Buyer")]
    [ProducesResponseType(typeof(OfferDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> WithdrawAfterInspection(int offerId, CancellationToken ct)
    {
        var buyerId = GetCurrentUserId();
        await _offers.WithdrawOfferAfterInspectionAsync(buyerId, offerId, ct);
        return NoContent();
    }

    [HttpPost("{offerId:int}/revise-after-inspection")]
    [Authorize(Roles = "Buyer")]
    [ProducesResponseType(typeof(OfferDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ReviseAfterInspection(int offerId, [FromBody] RevisedOfferAfterInspectionRequest request, CancellationToken ct)
    {
        var buyerId = GetCurrentUserId();
        var offer = await _offers.SubmitRevisedOfferAfterInspectionAsync(buyerId, offerId, request, ct);
        return Ok(offer);
    }

    // ── Agent ─────────────────────────────────────────────────────────────────

    [HttpGet("listing/{listingId:int}")]
    [Authorize(Roles = "Agent")]
    [ProducesResponseType(typeof(IEnumerable<OfferDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetOffersByListing(int listingId, CancellationToken ct)
    {
        var agentId = GetCurrentUserId();
        var offers = await _offers.GetOffersByListingAsync(agentId, listingId, ct);
        return Ok(offers);
    }

    [HttpPost("{offerId:int}/accept")]
    [Authorize(Roles = "Agent")]
    [ProducesResponseType(typeof(OfferDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AcceptOffer(int offerId, CancellationToken ct)
    {
        var agentId = GetCurrentUserId();
        var offer = await _offers.AcceptOfferAsync(agentId, offerId, ct);
        return Ok(offer);
    }

    [HttpPost("{offerId:int}/decline")]
    [Authorize(Roles = "Agent")]
    [ProducesResponseType(typeof(OfferDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeclineOffer(int offerId, CancellationToken ct)
    {
        var agentId = GetCurrentUserId();
        var offer = await _offers.DeclineOfferAsync(agentId, offerId, ct);
        return Ok(offer);
    }

    [HttpPost("{offerId:int}/counter")]
    [Authorize(Roles = "Agent")]
    [ProducesResponseType(typeof(OfferDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CounterOffer(int offerId, [FromBody] CounterOfferRequest request, CancellationToken ct)
    {
        var agentId = GetCurrentUserId();
        var offer = await _offers.CounterOfferAsync(agentId, offerId, request, ct);
        return Ok(offer);
    }

    // ── Property Owner ────────────────────────────────────────────────────────

    [HttpGet("listing/{listingId:int}/owner")]
    [Authorize(Roles = "PropertyOwner")]
    [ProducesResponseType(typeof(IEnumerable<OfferDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetOffersByListingForOwner(int listingId, CancellationToken ct)
    {
        var ownerId = GetCurrentUserId();
        var offers = await _offers.GetOffersByListingForOwnerAsync(ownerId, listingId, ct);
        return Ok(offers);
    }

    // ── Shared ────────────────────────────────────────────────────────────────

    [HttpGet("{offerId:int}")]
    [Authorize]
    [ProducesResponseType(typeof(OfferDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetOfferById(int offerId, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var offer = await _offers.GetOfferByIdAsync(offerId, userId, ct);
        return Ok(offer);
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
