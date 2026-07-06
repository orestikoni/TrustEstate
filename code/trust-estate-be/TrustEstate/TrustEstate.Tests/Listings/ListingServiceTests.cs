using Moq;
using Xunit;
using TrustEstate.Application.DTOs.Listings;
using TrustEstate.Application.Interfaces.Listings;
using TrustEstate.Domain.Entities;
using TrustEstate.Domain.Enums;
using TrustEstate.Domain.Exceptions;
using TrustEstate.Infrastructure.Services;

namespace TrustEstate.Tests.Listings;

public class ListingServiceTests
{
    private readonly Mock<IListingRepository> _repo = new();
    private readonly ListingService _sut;

    public ListingServiceTests()
    {
        _sut = new ListingService(_repo.Object);
    }

    // ── CreateListingAsync ───────────────────────────────────────────────────

    [Fact]
    public async Task CreateListing_ValidRequest_CreatesListingWithPendingAgentReviewStatus()
    {
        var request = new CreateListingRequest
        {
            Title = "Luxury Apartment",
            Description = "A nice place",
            Address = "123 Main St",
            City = "Tirana",
            Country = "Albania",
            AskingPrice = 150_000m,
            ListingType = "Sale",
            PropertyType = "Apartment",
            AgentId = 7,
            PhotoUrls = new List<string>(),
        };

        var capturedListing = new Listing();

        _repo.Setup(r => r.AddAsync(It.IsAny<Listing>(), It.IsAny<CancellationToken>()))
             .Callback<Listing, CancellationToken>((l, _) => { capturedListing = l; l.ListingId = 1; })
             .Returns(Task.CompletedTask);

        _repo.Setup(r => r.AddAssignmentAsync(It.IsAny<ListingAssignment>(), It.IsAny<CancellationToken>()))
             .Returns(Task.CompletedTask);

        _repo.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()))
             .Returns(Task.CompletedTask);

        _repo.Setup(r => r.GetByIdWithPhotosAsync(1, It.IsAny<CancellationToken>()))
             .ReturnsAsync(() => new Listing
             {
                 ListingId = 1,
                 Title = request.Title,
                 Description = request.Description,
                 Address = request.Address,
                 City = request.City,
                 Country = request.Country,
                 AskingPrice = request.AskingPrice,
                 ListingType = ListingType.Sale,
                 PropertyType = PropertyType.Apartment,
                 Status = ListingStatus.PendingAgentReview,
                 OwnerId = 42,
                 Photos = new List<ListingPhoto>(),
             });

        var result = await _sut.CreateListingAsync(ownerId: 42, request);

        Assert.Equal("PendingAgentReview", result.Status);
        Assert.Equal(ListingStatus.PendingAgentReview, capturedListing.Status);
        Assert.Equal(42, capturedListing.OwnerId);
    }

    [Fact]
    public async Task CreateListing_InvalidListingType_ThrowsBusinessRuleException()
    {
        var request = new CreateListingRequest
        {
            Title = "Test",
            Description = "Desc",
            Address = "Addr",
            City = "City",
            Country = "Country",
            AskingPrice = 50_000m,
            ListingType = "InvalidType",
            PropertyType = "Apartment",
            AgentId = 1,
        };

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            _sut.CreateListingAsync(ownerId: 1, request));
    }

    [Fact]
    public async Task CreateListing_EmptyTitle_ThrowsBusinessRuleException()
    {
        var request = new CreateListingRequest
        {
            Title = "   ",
            Description = "Desc",
            Address = "Addr",
            City = "City",
            Country = "Country",
            AskingPrice = 50_000m,
            ListingType = "Sale",
            PropertyType = "Apartment",
            AgentId = 1,
        };

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            _sut.CreateListingAsync(ownerId: 1, request));
    }

    // ── ApproveListingAsync ──────────────────────────────────────────────────

    [Fact]
    public async Task ApproveListing_ValidPendingListing_SetsStatusToActive()
    {
        var listing = new Listing
        {
            ListingId = 1,
            AgentId = 5,
            OwnerId = 10,
            Status = ListingStatus.PendingAgentReview,
            Photos = new List<ListingPhoto>(),
        };

        _repo.Setup(r => r.GetByIdWithPhotosAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(listing);
        _repo.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var result = await _sut.ApproveListingAsync(agentId: 5, listingId: 1);

        Assert.Equal("Active", result.Status);
        Assert.Equal(ListingStatus.Active, listing.Status);
        Assert.NotNull(listing.PublishedAt);
    }

    [Fact]
    public async Task ApproveListing_WrongAgent_ThrowsForbiddenException()
    {
        var listing = new Listing { ListingId = 1, AgentId = 5, Status = ListingStatus.PendingAgentReview };
        _repo.Setup(r => r.GetByIdWithPhotosAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(listing);

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            _sut.ApproveListingAsync(agentId: 99, listingId: 1));
    }

    [Fact]
    public async Task ApproveListing_ListingAlreadyActive_ThrowsBusinessRuleException()
    {
        var listing = new Listing { ListingId = 1, AgentId = 5, Status = ListingStatus.Active };
        _repo.Setup(r => r.GetByIdWithPhotosAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(listing);

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            _sut.ApproveListingAsync(agentId: 5, listingId: 1));
    }

    // ── RequestCorrectionsAsync ──────────────────────────────────────────────

    [Fact]
    public async Task RequestCorrections_ValidNotes_SetsStatusToCorrectionsRequested()
    {
        var listing = new Listing
        {
            ListingId = 1,
            AgentId = 5,
            Status = ListingStatus.PendingAgentReview,
            Photos = new List<ListingPhoto>(),
        };

        _repo.Setup(r => r.GetByIdWithPhotosAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(listing);
        _repo.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var result = await _sut.RequestCorrectionsAsync(
            agentId: 5,
            listingId: 1,
            new RequestCorrectionsRequest { CorrectionNotes = "Please fix the photos." });

        Assert.Equal("CorrectionsRequested", result.Status);
        Assert.Equal("Please fix the photos.", result.CorrectionNotes);
        Assert.Equal(ListingStatus.CorrectionsRequested, listing.Status);
    }

    [Fact]
    public async Task RequestCorrections_EmptyNotes_ThrowsBusinessRuleException()
    {
        var listing = new Listing { ListingId = 1, AgentId = 5, Status = ListingStatus.PendingAgentReview };
        _repo.Setup(r => r.GetByIdWithPhotosAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(listing);

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            _sut.RequestCorrectionsAsync(agentId: 5, listingId: 1,
                new RequestCorrectionsRequest { CorrectionNotes = "   " }));
    }

    [Fact]
    public async Task RequestCorrections_WrongAgent_ThrowsForbiddenException()
    {
        var listing = new Listing { ListingId = 1, AgentId = 5, Status = ListingStatus.PendingAgentReview };
        _repo.Setup(r => r.GetByIdWithPhotosAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(listing);

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            _sut.RequestCorrectionsAsync(agentId: 99, listingId: 1,
                new RequestCorrectionsRequest { CorrectionNotes = "Some notes." }));
    }

    // ── DeleteListingAsync ───────────────────────────────────────────────────

    [Fact]
    public async Task DeleteListing_ListingUnderOffer_ThrowsBusinessRuleException()
    {
        var listing = new Listing { ListingId = 1, OwnerId = 1, Status = ListingStatus.UnderOffer };
        _repo.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(listing);

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            _sut.DeleteListingAsync(ownerId: 1, listingId: 1));
    }

    [Fact]
    public async Task DeleteListing_WrongOwner_ThrowsForbiddenException()
    {
        var listing = new Listing { ListingId = 1, OwnerId = 1, Status = ListingStatus.Active };
        _repo.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(listing);

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            _sut.DeleteListingAsync(ownerId: 99, listingId: 1));
    }

    // ── UpdateListingAsync ───────────────────────────────────────────────────

    [Fact]
    public async Task UpdateListing_ListingIsActive_ThrowsBusinessRuleException()
    {
        var listing = new Listing
        {
            ListingId = 1,
            OwnerId = 1,
            Status = ListingStatus.Active,
            Photos = new List<ListingPhoto>(),
        };

        _repo.Setup(r => r.GetByIdWithPhotosAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(listing);

        var request = new UpdateListingRequest
        {
            Title = "Updated",
            Description = "Desc",
            Address = "Addr",
            City = "City",
            Country = "Country",
            AskingPrice = 200_000m,
            ListingType = "Sale",
            PropertyType = "House",
        };

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            _sut.UpdateListingAsync(ownerId: 1, listingId: 1, request));
    }
}
