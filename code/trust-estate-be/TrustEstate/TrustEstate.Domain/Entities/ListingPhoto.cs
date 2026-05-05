namespace TrustEstate.Domain.Entities;

public class ListingPhoto
{
    public int PhotoId { get; set; }
    public int ListingId { get; set; }
    public string PhotoUrl { get; set; } = string.Empty;
    public int? DisplayOrder { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    public Listing Listing { get; set; } = null!;
}