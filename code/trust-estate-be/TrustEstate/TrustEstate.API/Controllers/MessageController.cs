using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TrustEstate.Application.DTOs.Messages;
using TrustEstate.Application.Interfaces.Messages;
using TrustEstate.Domain.Exceptions;

namespace TrustEstate.API.Controllers;

[ApiController]
[Route("api/messages")]
[Produces("application/json")]
[Authorize]
public sealed class MessageController : ControllerBase
{
    private readonly IMessageService _messages;

    public MessageController(IMessageService messages) => _messages = messages;

    [HttpGet("threads")]
    [ProducesResponseType(typeof(IEnumerable<MessageThreadDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetThreads(CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var threads = await _messages.GetMessageThreadsAsync(userId, ct);
        return Ok(threads);
    }

    [HttpPost]
    [ProducesResponseType(typeof(MessageDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SendMessage([FromBody] SendMessageRequest request, CancellationToken ct)
    {
        var senderId = GetCurrentUserId();
        var message = await _messages.SendMessageAsync(senderId, request, ct);
        return StatusCode(StatusCodes.Status201Created, message);
    }

    [HttpGet("threads/{threadId:int}")]
    [ProducesResponseType(typeof(IEnumerable<MessageDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetThreadMessages(int threadId, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var messages = await _messages.GetThreadMessagesAsync(userId, threadId, ct);
        return Ok(messages);
    }

    [HttpPost("threads/get-or-create")]
    [ProducesResponseType(typeof(MessageThreadDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetOrCreateThread(
        [FromQuery] int recipientId,
        [FromQuery] int listingId,
        CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var thread = await _messages.GetOrCreateThreadAsync(userId, recipientId, listingId, ct);
        return Ok(thread);
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
