using Moq;
using Xunit;
using TrustEstate.Application.DTOs.Listings;
using TrustEstate.Application.Interfaces.Listings;
using TrustEstate.Domain.Entities;
using TrustEstate.Domain.Enums;
using TrustEstate.Domain.Exceptions;
using TrustEstate.Infrastructure.Services;

namespace TrustEstate.Tests.Listings;

public class ListingServiceGapTests
{
    private readonly Mock<IListingRepository> _repo = new();
    private readonly ListingService _sut;

    public ListingServiceGapTests()
    {
        _sut = new ListingService(_repo.Object);
    }

    // ── RespondToAssignmentAsync ─────────────────────────────────────────────

    [Fact]
    public async Task RespondToAssignment_AgentAccepts_SetsAssignmentToAcceptedAndUpdatesListing()
    {
        var assignment = new ListingAssignment { AssignmentId = 1, ListingId = 1, AgentId = 5, AssignmentStatus = AssignmentStatus.Pending, RequestedAt = DateTime.UtcNow };
        var listing = new Listing { ListingId = 1, AgentId = null, OwnerId = 10, Status = ListingStatus.PendingAgentReview, Title = "T", Description = "D", Address = "A", City = "C", Country = "X" };

        _repo.Setup(r => r.GetPendingAssignmentAsync(1, 5, It.IsAny<CancellationToken>())).ReturnsAsync(assignment);
        _repo.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(listing);
        _repo.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var result = await _sut.RespondToAssignmentAsync(agentId: 5, listingId: 1, new RespondToAssignmentRequest { Accept = true });

        Assert.Equal("Accepted", result.AssignmentStatus);
        Assert.Equal(AssignmentStatus.Accepted, assignment.AssignmentStatus);
        Assert.Equal(5, listing.AgentId);
    }

    [Fact]
    public async Task RespondToAssignment_AgentDeclines_SetsAssignmentToDeclined()
    {
        var assignment = new ListingAssignment { AssignmentId = 1, ListingId = 1, AgentId = 5, AssignmentStatus = AssignmentStatus.Pending, RequestedAt = DateTime.UtcNow };
        var listing = new Listing { ListingId = 1, AgentId = null, OwnerId = 10, Status = ListingStatus.PendingAgentReview, Title = "T", Description = "D", Address = "A", City = "C", Country = "X" };

        _repo.Setup(r => r.GetPendingAssignmentAsync(1, 5, It.IsAny<CancellationToken>())).ReturnsAsync(assignment);
        _repo.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(listing);
        _repo.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var result = await _sut.RespondToAssignmentAsync(agentId: 5, listingId: 1, new RespondToAssignmentRequest { Accept = false });

        Assert.Equal("Declined", result.AssignmentStatus);
        Assert.Equal(AssignmentStatus.Declined, assignment.AssignmentStatus);
        Assert.Null(listing.AgentId);
    }

    [Fact]
    public async Task RespondToAssignment_NoPendingAssignment_ThrowsBusinessRuleException()
    {
        _repo.Setup(r => r.GetPendingAssignmentAsync(1, 5, It.IsAny<CancellationToken>())).ReturnsAsync((ListingAssignment?)null);

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            _sut.RespondToAssignmentAsync(agentId: 5, listingId: 1, new RespondToAssignmentRequest { Accept = true }));
    }

    // ── GetListingByIdAsync — not found ──────────────────────────────────────

    [Fact]
    public async Task GetListingById_NonExistentListing_ThrowsNotFoundException()
    {
        _repo.Setup(r => r.GetByIdWithPhotosAsync(999, It.IsAny<CancellationToken>())).ReturnsAsync((Listing?)null);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            _sut.GetListingByIdAsync(listingId: 999));
    }

    // ── DeleteListingAsync — not found ───────────────────────────────────────

    [Fact]
    public async Task DeleteListing_NonExistentListing_ThrowsNotFoundException()
    {
        _repo.Setup(r => r.GetByIdAsync(999, It.IsAny<CancellationToken>())).ReturnsAsync((Listing?)null);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            _sut.DeleteListingAsync(ownerId: 1, listingId: 999));
    }
}
