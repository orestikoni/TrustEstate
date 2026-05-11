namespace TrustEstate.Domain.Entities;

public class InspectionPhoto
{
    public int InspectionPhotoId { get; set; }
    public int CategoryId { get; set; }
    public string PhotoUrl { get; set; } = string.Empty;
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public InspectionCategory Category { get; set; } = null!;
}
