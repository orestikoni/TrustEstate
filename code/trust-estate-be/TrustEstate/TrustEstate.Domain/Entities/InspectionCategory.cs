using TrustEstate.Domain.Enums;

namespace TrustEstate.Domain.Entities;

public class InspectionCategory
{
    public int CategoryId { get; set; }
    public int ReportId { get; set; }
    public InspectionCategoryName CategoryName { get; set; }
    public string Findings { get; set; } = string.Empty;
    public CategoryPassFail PassFail { get; set; }
    public CategorySeverity Severity { get; set; }

    // Navigation properties
    public InspectionReport Report { get; set; } = null!;
    public ICollection<InspectionPhoto> Photos { get; set; } = new List<InspectionPhoto>();
}
