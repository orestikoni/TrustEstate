using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TrustEstate.Application.DTOs.Transactions;
using TrustEstate.Application.Interfaces.Transactions;
using TrustEstate.Domain.Exceptions;

namespace TrustEstate.API.Controllers;

[ApiController]
[Route("api/transactions")]
[Produces("application/json")]
public sealed class TransactionController : ControllerBase
{
    private readonly ITransactionService _transactions;

    public TransactionController(ITransactionService transactions) => _transactions = transactions;

    // ── Agent ─────────────────────────────────────────────────────────────────

    [HttpGet("listing/{listingId:int}/status")]
    [Authorize(Roles = "Agent")]
    [ProducesResponseType(typeof(TransactionStatusDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetTransactionStatus(int listingId, CancellationToken ct)
    {
        var agentId = GetCurrentUserId();
        var status = await _transactions.GetTransactionStatusAsync(agentId, listingId, ct);
        return Ok(status);
    }

    [HttpPost("listing/{listingId:int}/close")]
    [Authorize(Roles = "Agent")]
    [ProducesResponseType(typeof(TransactionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CloseTransaction(int listingId, CancellationToken ct)
    {
        var agentId = GetCurrentUserId();
        var transaction = await _transactions.CloseTransactionAsync(agentId, listingId, ct);
        return Ok(transaction);
    }

    // ── Shared ────────────────────────────────────────────────────────────────

    [HttpGet("listing/{listingId:int}")]
    [Authorize]
    [ProducesResponseType(typeof(TransactionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetTransactionByListing(int listingId, CancellationToken ct)
    {
        var transaction = await _transactions.GetTransactionByListingAsync(listingId, ct);
        if (transaction is null)
            return NotFound(new { message = $"Transaction for listing {listingId} not found." });
        return Ok(transaction);
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
