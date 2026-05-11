using TrustEstate.Domain.Entities;

namespace TrustEstate.Application.Interfaces.Inspections;

public interface IInspectionRepository
{
    Task<Inspection?> GetByIdAsync(int inspectionId, CancellationToken ct = default);
    Task<Inspection?> GetByIdWithReportAsync(int inspectionId, CancellationToken ct = default);
    Task<Inspection?> GetByListingIdAsync(int listingId, CancellationToken ct = default);
    Task<Inspection?> GetByOfferIdAsync(int offerId, CancellationToken ct = default);
    Task<IEnumerable<User>> GetVerifiedInspectorsAsync(CancellationToken ct = default);
    Task AddAsync(Inspection inspection, CancellationToken ct = default);
    void Update(Inspection inspection);
    Task AddReportAsync(InspectionReport report, CancellationToken ct = default);
    Task AddCategoryAsync(InspectionCategory category, CancellationToken ct = default);
    Task AddPhotoAsync(InspectionPhoto photo, CancellationToken ct = default);
    void UpdateReport(InspectionReport report);
    Task SaveChangesAsync(CancellationToken ct = default);
}
