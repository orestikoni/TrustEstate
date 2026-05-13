namespace TrustEstate.Domain.Entities;

public class FavoriteListing
{
    public int FavoriteId { get; set; }
    public int UserId { get; set; }
    public int ListingId { get; set; }
    public DateTime SavedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User User { get; set; } = null!;
    public Listing Listing { get; set; } = null!;
}
