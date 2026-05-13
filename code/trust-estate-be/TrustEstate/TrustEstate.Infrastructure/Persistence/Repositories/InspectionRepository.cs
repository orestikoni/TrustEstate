using Microsoft.EntityFrameworkCore;
using TrustEstate.Application.Interfaces.Inspections;
using TrustEstate.Domain.Entities;
using TrustEstate.Domain.Enums;

namespace TrustEstate.Infrastructure.Persistence.Repositories;

public sealed class InspectionRepository : IInspectionRepository
{
    private readonly TrustEstateDbContext _db;

    public InspectionRepository(TrustEstateDbContext db) => _db = db;

    public Task<Inspection?> GetByIdAsync(int inspectionId, CancellationToken ct = default)
        => _db.Inspections
            .Include(i => i.Inspector)
            .Include(i => i.Agent)
            .FirstOrDefaultAsync(i => i.InspectionId == inspectionId, ct);

    public Task<Inspection?> GetByIdWithReportAsync(int inspectionId, CancellationToken ct = default)
        => _db.Inspections
            .Include(i => i.Inspector)
            .Include(i => i.Agent)
            .Include(i => i.Report)
                .ThenInclude(r => r!.Categories)
                    .ThenInclude(c => c.Photos)
            .FirstOrDefaultAsync(i => i.InspectionId == inspectionId, ct);

    public Task<Inspection?> GetByListingIdAsync(int listingId, CancellationToken ct = default)
        => _db.Inspections
            .Include(i => i.Inspector)
            .Include(i => i.Report)
                .ThenInclude(r => r!.Categories)
                    .ThenInclude(c => c.Photos)
            .FirstOrDefaultAsync(i => i.ListingId == listingId, ct);

    public Task<Inspection?> GetByOfferIdAsync(int offerId, CancellationToken ct = default)
        => _db.Inspections
            .Include(i => i.Report)
            .FirstOrDefaultAsync(i => i.OfferId == offerId, ct);

    public async Task<IEnumerable<User>> GetVerifiedInspectorsAsync(CancellationToken ct = default)
        => await _db.Users
            .Include(u => u.InspectorProfile)
            .Where(u => u.Role == UserRole.PropertyInspector
                        && u.AccountStatus == AccountStatus.Active
                        && u.InspectorProfile != null
                        && u.InspectorProfile.IsVerified)
            .ToListAsync(ct);

    public async Task AddAsync(Inspection inspection, CancellationToken ct = default)
        => await _db.Inspections.AddAsync(inspection, ct);

    public void Update(Inspection inspection)
        => _db.Inspections.Update(inspection);

    public async Task AddReportAsync(InspectionReport report, CancellationToken ct = default)
        => await _db.InspectionReports.AddAsync(report, ct);

    public async Task AddCategoryAsync(InspectionCategory category, CancellationToken ct = default)
        => await _db.InspectionCategories.AddAsync(category, ct);

    public async Task AddPhotoAsync(InspectionPhoto photo, CancellationToken ct = default)
        => await _db.InspectionPhotos.AddAsync(photo, ct);

    public void UpdateReport(InspectionReport report)
        => _db.InspectionReports.Update(report);

    public Task SaveChangesAsync(CancellationToken ct = default)
        => _db.SaveChangesAsync(ct);
}
