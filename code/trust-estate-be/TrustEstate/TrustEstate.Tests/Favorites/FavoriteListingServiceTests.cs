using Moq;
using Xunit;
using TrustEstate.Application.Interfaces.Listings;
using TrustEstate.Domain.Entities;
using TrustEstate.Domain.Enums;
using TrustEstate.Domain.Exceptions;
using TrustEstate.Infrastructure.Services;

namespace TrustEstate.Tests.Favorites;

public class FavoriteListingServiceTests
{
    private readonly Mock<IFavoriteListingRepository> _repo = new();
    private readonly Mock<IListingRepository> _listings = new();
    private readonly FavoriteListingService _sut;

    public FavoriteListingServiceTests()
    {
        _sut = new FavoriteListingService(_repo.Object, _listings.Object);
    }

    private static Listing ActiveListing(int id = 1) => new()
    {
        ListingId = id,
        OwnerId = 10,
        Status = ListingStatus.Active,
        Title = "Nice House",
        Description = "D",
        Address = "A",
        City = "C",
        Country = "X",
        Photos = new List<ListingPhoto>(),
    };

    // ── SaveListingAsync ─────────────────────────────────────────────────────

    [Fact]
    public async Task SaveListing_ValidActiveListing_AddsToFavorites()
    {
        _listings.Setup(r => r.GetByIdWithPhotosAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(ActiveListing());
        _repo.Setup(r => r.GetAsync(5, 1, It.IsAny<CancellationToken>())).ReturnsAsync((FavoriteListing?)null);
        _repo.Setup(r => r.AddAsync(It.IsAny<FavoriteListing>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _repo.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        await _sut.SaveListingAsync(userId: 5, listingId: 1);

        _repo.Verify(r => r.AddAsync(It.Is<FavoriteListing>(f => f.UserId == 5 && f.ListingId == 1), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task SaveListing_InactiveListing_ThrowsBusinessRuleException()
    {
        var inactive = ActiveListing();
        inactive.Status = ListingStatus.Removed;
        _listings.Setup(r => r.GetByIdWithPhotosAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(inactive);

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            _sut.SaveListingAsync(userId: 5, listingId: 1));
    }

    [Fact]
    public async Task SaveListing_AlreadySaved_ThrowsConflictException()
    {
        _listings.Setup(r => r.GetByIdWithPhotosAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(ActiveListing());
        _repo.Setup(r => r.GetAsync(5, 1, It.IsAny<CancellationToken>())).ReturnsAsync(new FavoriteListing { UserId = 5, ListingId = 1 });

        await Assert.ThrowsAsync<ConflictException>(() =>
            _sut.SaveListingAsync(userId: 5, listingId: 1));
    }

    [Fact]
    public async Task SaveListing_ListingNotFound_ThrowsNotFoundException()
    {
        _listings.Setup(r => r.GetByIdWithPhotosAsync(999, It.IsAny<CancellationToken>())).ReturnsAsync((Listing?)null);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            _sut.SaveListingAsync(userId: 5, listingId: 999));
    }

    // ── UnsaveListingAsync ───────────────────────────────────────────────────

    [Fact]
    public async Task UnsaveListing_ExistingFavorite_RemovesIt()
    {
        var favorite = new FavoriteListing { UserId = 5, ListingId = 1 };
        _repo.Setup(r => r.GetAsync(5, 1, It.IsAny<CancellationToken>())).ReturnsAsync(favorite);
        _repo.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        await _sut.UnsaveListingAsync(userId: 5, listingId: 1);

        _repo.Verify(r => r.Remove(favorite), Times.Once);
        _repo.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UnsaveListing_NotInFavorites_ThrowsNotFoundException()
    {
        _repo.Setup(r => r.GetAsync(5, 99, It.IsAny<CancellationToken>())).ReturnsAsync((FavoriteListing?)null);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            _sut.UnsaveListingAsync(userId: 5, listingId: 99));
    }
}
