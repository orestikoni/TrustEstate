using Microsoft.EntityFrameworkCore;
using TrustEstate.Application.DTOs.Inspections;
using TrustEstate.Application.Interfaces.Inspections;
using TrustEstate.Application.Interfaces.Notifications;
using TrustEstate.Domain.Entities;
using TrustEstate.Domain.Enums;
using TrustEstate.Domain.Exceptions;
using TrustEstate.Infrastructure.Persistence;

namespace TrustEstate.Infrastructure.Services;

public sealed class InspectionService : IInspectionService
{
    private readonly IInspectionRepository _repo;
    private readonly INotificationService _notifications;
    private readonly TrustEstateDbContext _db;

    public InspectionService(IInspectionRepository repo, INotificationService notifications, TrustEstateDbContext db)
    {
        _repo = repo;
        _notifications = notifications;
        _db = db;
    }

    // ── Inspector: Get own assigned inspections ───────────────────────────────

    public async Task<IEnumerable<MyInspectionDto>> GetMyInspectionsAsync(int inspectorId, CancellationToken ct = default)
    {
        var inspections = await _db.Inspections
            .Include(i => i.Listing)
                .ThenInclude(l => l.Owner)
            .Include(i => i.Listing)
                .ThenInclude(l => l.Photos.OrderBy(p => p.DisplayOrder))
            .Include(i => i.Agent)
            .Include(i => i.Report)
                .ThenInclude(r => r!.Categories)
                    .ThenInclude(c => c.Photos)
            .Where(i => i.InspectorId == inspectorId)
            .OrderByDescending(i => i.ScheduledDate)
            .ToListAsync(ct);

        return inspections.Select(i => new MyInspectionDto
        {
            InspectionId = i.InspectionId,
            ListingId = i.ListingId,
            PropertyTitle = i.Listing.Title,
            PropertyAddress = $"{i.Listing.Address}, {i.Listing.City}, {i.Listing.Country}",
            PhotoUrl = i.Listing.Photos.OrderBy(p => p.DisplayOrder).Select(p => p.PhotoUrl).FirstOrDefault(),
            AgentName = $"{i.Agent.FirstName} {i.Agent.LastName}".Trim(),
            AgentEmail = i.Agent.Email,
            OwnerName = $"{i.Listing.Owner.FirstName} {i.Listing.Owner.LastName}".Trim(),
            ScheduledDate = i.ScheduledDate,
            AssignedAt = i.AssignedAt,
            Status = i.Status.ToString(),
            Report = i.Report != null ? MapReportToDto(i.Report) : null,
        });
    }

    // ── Agent: Get available inspectors ──────────────────────────────────────

    public async Task<IEnumerable<InspectorDto>> GetAvailableInspectorsAsync(CancellationToken ct = default)
    {
        var inspectors = await _repo.GetVerifiedInspectorsAsync(ct);
        return inspectors.Select(u => new InspectorDto
        {
            UserId = u.Id,
            FirstName = u.FirstName,
            LastName = u.LastName,
            ProfessionalQualifications = u.InspectorProfile?.ProfessionalQualifications,
        });
    }

    // ── Agent: Assign inspector ───────────────────────────────────────────────

    public async Task<InspectionDto> AssignInspectorAsync(int agentId, AssignInspectorRequest request, CancellationToken ct = default)
    {
        var listing = await _db.Listings.FindAsync(request.ListingId)
            ?? throw new NotFoundException(nameof(Listing), request.ListingId);

        if (listing.AgentId != agentId)
            throw new ForbiddenException("You are not the assigned agent for this listing.");

        if (listing.Status != ListingStatus.UnderOffer)
            throw new BusinessRuleException("Inspector can only be assigned when listing is Under Offer.");

        var existingInspection = await _repo.GetByListingIdAsync(request.ListingId, ct);
        if (existingInspection != null)
            throw new ConflictException("An inspector has already been assigned for this listing.");

        var inspector = await _db.Users.FindAsync(request.InspectorId)
            ?? throw new NotFoundException("Inspector", request.InspectorId);

        if (inspector.Role != UserRole.PropertyInspector)
            throw new BusinessRuleException("The selected user is not a Property Inspector.");

        var acceptedOffer = await _db.Offers
            .FirstOrDefaultAsync(o => o.OfferId == request.OfferId && o.ListingId == request.ListingId && o.Status == OfferStatus.Accepted, ct)
            ?? throw new NotFoundException("Accepted offer for listing", request.ListingId);

        var inspection = new Inspection
        {
            ListingId = request.ListingId,
            OfferId = request.OfferId,
            InspectorId = request.InspectorId,
            AgentId = agentId,
            Status = InspectionStatus.Scheduled,
            ScheduledDate = request.ScheduledDate,
            AssignedAt = DateTime.UtcNow,
        };

        await _repo.AddAsync(inspection, ct);
        await _repo.SaveChangesAsync(ct);

        await _notifications.CreateAsync(request.InspectorId, NotificationType.InspectionUpdate,
            "New Inspection Assignment", $"You have been assigned to inspect a property scheduled for {request.ScheduledDate:d}.",
            "Inspection", inspection.InspectionId, ct);

        await _notifications.CreateAsync(acceptedOffer.BuyerId, NotificationType.InspectionUpdate,
            "Inspection Scheduled", $"An inspection has been scheduled for {request.ScheduledDate:d}.",
            "Inspection", inspection.InspectionId, ct);

        await _notifications.CreateAsync(listing.OwnerId, NotificationType.InspectionUpdate,
            "Inspection Scheduled", $"A property inspection has been scheduled for {request.ScheduledDate:d}.",
            "Inspection", inspection.InspectionId, ct);

        return await GetInspectionDtoAsync(inspection.InspectionId, ct);
    }

    // ── Agent: Reassign inspector ─────────────────────────────────────────────

    public async Task<InspectionDto> ReassignInspectorAsync(int agentId, int inspectionId, ReassignInspectorRequest request, CancellationToken ct = default)
    {
        var inspection = await _repo.GetByIdAsync(inspectionId, ct)
            ?? throw new NotFoundException(nameof(Inspection), inspectionId);

        if (inspection.AgentId != agentId)
            throw new ForbiddenException("You are not the agent for this inspection.");

        if (inspection.Status == InspectionStatus.Completed)
            throw new BusinessRuleException("Cannot reassign a completed inspection.");

        var newInspector = await _db.Users.FindAsync(request.NewInspectorId)
            ?? throw new NotFoundException("Inspector", request.NewInspectorId);

        if (newInspector.Role != UserRole.PropertyInspector)
            throw new BusinessRuleException("The selected user is not a Property Inspector.");

        inspection.InspectorId = request.NewInspectorId;
        _repo.Update(inspection);
        await _repo.SaveChangesAsync(ct);

        await _notifications.CreateAsync(request.NewInspectorId, NotificationType.InspectionUpdate,
            "Inspection Assignment", $"You have been assigned to an inspection scheduled for {inspection.ScheduledDate:d}.",
            "Inspection", inspectionId, ct);

        return await GetInspectionDtoAsync(inspectionId, ct);
    }

    // ── Inspector: Update inspection status ───────────────────────────────────

    public async Task<InspectionDto> UpdateInspectionStatusAsync(int inspectorId, int inspectionId, UpdateInspectionStatusRequest request, CancellationToken ct = default)
    {
        var inspection = await _repo.GetByIdAsync(inspectionId, ct)
            ?? throw new NotFoundException(nameof(Inspection), inspectionId);

        if (inspection.InspectorId != inspectorId)
            throw new ForbiddenException("This inspection is not assigned to you.");

        if (!Enum.TryParse<InspectionStatus>(request.Status, true, out var newStatus))
            throw new BusinessRuleException("Invalid inspection status. Must be 'Scheduled', 'InProgress', or 'Completed'.");

        if (newStatus == InspectionStatus.Scheduled)
            throw new BusinessRuleException("Cannot revert inspection to Scheduled status.");

        if (inspection.Status == InspectionStatus.Completed)
            throw new BusinessRuleException("Completed inspections cannot be updated.");

        if (newStatus == InspectionStatus.Completed && inspection.Status != InspectionStatus.InProgress)
            throw new BusinessRuleException("Inspection must be InProgress before it can be marked as Completed.");

        inspection.Status = newStatus;

        if (newStatus == InspectionStatus.InProgress)
            inspection.StartedAt = DateTime.UtcNow;
        else if (newStatus == InspectionStatus.Completed)
            inspection.CompletedAt = DateTime.UtcNow;

        _repo.Update(inspection);
        await _repo.SaveChangesAsync(ct);

        var listing = await _db.Listings.FindAsync(inspection.ListingId);
        if (listing != null)
        {
            await _notifications.CreateAsync(listing.AgentId ?? 0, NotificationType.InspectionUpdate,
                "Inspection Status Updated", $"Inspection status changed to {newStatus}.",
                "Inspection", inspectionId, ct);
        }

        return await GetInspectionDtoAsync(inspectionId, ct);
    }

    // ── Inspector: Submit report ──────────────────────────────────────────────

    public async Task<InspectionReportDto> SubmitInspectionReportAsync(int inspectorId, int inspectionId, SubmitInspectionReportRequest request, CancellationToken ct = default)
    {
        var inspection = await _repo.GetByIdWithReportAsync(inspectionId, ct)
            ?? throw new NotFoundException(nameof(Inspection), inspectionId);

        if (inspection.InspectorId != inspectorId)
            throw new ForbiddenException("This inspection is not assigned to you.");

        if (inspection.Status != InspectionStatus.Completed)
            throw new BusinessRuleException("Report can only be submitted for a completed inspection.");

        if (inspection.Report != null)
            throw new ConflictException("A report has already been submitted for this inspection.");

        var categoryInputs = request.Categories.ToList();
        var validCategories = new[] { "StructuralIntegrity", "Plumbing", "Electrical", "Safety" };
        var submittedCategories = categoryInputs.Select(c => c.CategoryName).ToList();

        if (submittedCategories.Distinct().Count() != 4 ||
            !validCategories.All(v => submittedCategories.Contains(v, StringComparer.OrdinalIgnoreCase)))
            throw new BusinessRuleException("Report must include exactly 4 categories: StructuralIntegrity, Plumbing, Electrical, Safety.");

        var report = new InspectionReport
        {
            InspectionId = inspectionId,
            IsLocked = false,
            SubmittedAt = DateTime.UtcNow,
        };

        await _repo.AddReportAsync(report, ct);
        await _repo.SaveChangesAsync(ct);

        foreach (var input in categoryInputs)
        {
            if (!Enum.TryParse<InspectionCategoryName>(input.CategoryName, true, out var catName))
                throw new BusinessRuleException($"Invalid category name: {input.CategoryName}.");

            if (!Enum.TryParse<CategoryPassFail>(input.PassFail, true, out var passFail))
                throw new BusinessRuleException($"Invalid pass/fail value: {input.PassFail}. Must be 'Pass' or 'Fail'.");

            if (!Enum.TryParse<CategorySeverity>(input.Severity, true, out var severity))
                throw new BusinessRuleException($"Invalid severity: {input.Severity}. Must be 'Minor', 'Moderate', or 'Critical'.");

            var category = new InspectionCategory
            {
                ReportId = report.ReportId,
                CategoryName = catName,
                Findings = input.Findings,
                PassFail = passFail,
                Severity = severity,
            };

            await _repo.AddCategoryAsync(category, ct);
            await _repo.SaveChangesAsync(ct);

            foreach (var photoUrl in input.PhotoUrls)
            {
                if (!string.IsNullOrWhiteSpace(photoUrl))
                    await _repo.AddPhotoAsync(new InspectionPhoto { CategoryId = category.CategoryId, PhotoUrl = photoUrl, UploadedAt = DateTime.UtcNow }, ct);
            }
        }

        await _repo.SaveChangesAsync(ct);

        return await GetReportDtoAsync(inspectionId, ct);
    }

    // ── Inspector: Submit final verdict ──────────────────────────────────────

    public async Task<InspectionReportDto> SubmitFinalVerdictAsync(int inspectorId, int inspectionId, SubmitVerdictRequest request, CancellationToken ct = default)
    {
        var inspection = await _repo.GetByIdWithReportAsync(inspectionId, ct)
            ?? throw new NotFoundException(nameof(Inspection), inspectionId);

        if (inspection.InspectorId != inspectorId)
            throw new ForbiddenException("This inspection is not assigned to you.");

        if (inspection.Report == null)
            throw new BusinessRuleException("A report must be submitted before the final verdict.");

        if (inspection.Report.IsLocked)
            throw new BusinessRuleException("The report has already been locked with a final verdict.");

        if (!Enum.TryParse<InspectionVerdict>(request.Verdict, true, out var verdict))
            throw new BusinessRuleException("Invalid verdict. Must be 'Passed', 'PassedWithConditions', or 'Failed'.");

        inspection.Report.FinalVerdict = verdict;
        inspection.Report.IsLocked = true;
        inspection.Report.VerdictSubmittedAt = DateTime.UtcNow;
        _repo.UpdateReport(inspection.Report);
        await _repo.SaveChangesAsync(ct);

        var offer = await _db.Offers.FirstOrDefaultAsync(o => o.OfferId == inspection.OfferId, ct);

        if (offer != null && verdict != InspectionVerdict.Passed)
        {
            var window = new PostInspectionWindow
            {
                OfferId = offer.OfferId,
                InspectionId = inspectionId,
                VerdictNotifiedAt = DateTime.UtcNow,
                WindowExpiresAt = DateTime.UtcNow.AddHours(72),
                ActionTaken = PostInspectionAction.NoAction,
            };
            await _db.PostInspectionWindows.AddAsync(window, ct);
            await _repo.SaveChangesAsync(ct);

            await _notifications.CreateAsync(offer.BuyerId, NotificationType.InspectionUpdate,
                "Inspection Verdict: Action Required", $"Inspection verdict: {verdict}. You have 72 hours to withdraw or revise your offer.",
                "Inspection", inspectionId, ct);
        }
        else if (offer != null)
        {
            await _notifications.CreateAsync(offer.BuyerId, NotificationType.InspectionUpdate,
                "Inspection Verdict: Passed", "The property passed the inspection. The transaction proceeds as normal.",
                "Inspection", inspectionId, ct);
        }

        var listing = await _db.Listings.FindAsync(inspection.ListingId);
        if (listing != null && listing.AgentId.HasValue)
            await _notifications.CreateAsync(listing.AgentId.Value, NotificationType.InspectionUpdate,
                "Inspection Verdict Submitted", $"The inspector submitted verdict: {verdict}.",
                "Inspection", inspectionId, ct);

        return await GetReportDtoAsync(inspectionId, ct);
    }

    // ── Buyer: View inspection report ─────────────────────────────────────────

    public async Task<InspectionReportDto> GetInspectionReportAsync(int userId, int listingId, CancellationToken ct = default)
    {
        var hasAcceptedOffer = await _db.Offers.AnyAsync(o =>
            o.ListingId == listingId && o.BuyerId == userId && o.Status == OfferStatus.Accepted, ct);

        if (!hasAcceptedOffer)
            throw new ForbiddenException("You must have an accepted offer on this listing to view the inspection report.");

        var inspection = await _repo.GetByListingIdAsync(listingId, ct)
            ?? throw new NotFoundException("Inspection for listing", listingId);

        if (inspection.Report == null || !inspection.Report.IsLocked)
            throw new NotFoundException("Inspection report", listingId);

        return MapReportToDto(inspection.Report);
    }

    // ── Agent: Get inspection by listing ─────────────────────────────────────

    public async Task<InspectionDto> GetInspectionByListingAsync(int agentId, int listingId, CancellationToken ct = default)
    {
        var listing = await _db.Listings.FindAsync(listingId)
            ?? throw new NotFoundException(nameof(Listing), listingId);

        if (listing.AgentId != agentId)
            throw new ForbiddenException("You are not the assigned agent for this listing.");

        var inspection = await _repo.GetByListingIdAsync(listingId, ct)
            ?? throw new NotFoundException("Inspection for listing", listingId);

        return MapToDto(inspection);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private async Task<InspectionDto> GetInspectionDtoAsync(int inspectionId, CancellationToken ct)
    {
        var inspection = await _repo.GetByIdWithReportAsync(inspectionId, ct)
            ?? throw new NotFoundException(nameof(Inspection), inspectionId);
        return MapToDto(inspection);
    }

    private async Task<InspectionReportDto> GetReportDtoAsync(int inspectionId, CancellationToken ct)
    {
        var inspection = await _repo.GetByIdWithReportAsync(inspectionId, ct)
            ?? throw new NotFoundException(nameof(Inspection), inspectionId);
        return MapReportToDto(inspection.Report!);
    }

    private static InspectionDto MapToDto(Inspection i) => new()
    {
        InspectionId = i.InspectionId,
        ListingId = i.ListingId,
        OfferId = i.OfferId,
        InspectorId = i.InspectorId,
        InspectorFullName = $"{i.Inspector.FirstName} {i.Inspector.LastName}",
        AgentId = i.AgentId,
        Status = i.Status.ToString(),
        ScheduledDate = i.ScheduledDate,
        AssignedAt = i.AssignedAt,
        StartedAt = i.StartedAt,
        CompletedAt = i.CompletedAt,
        Report = i.Report != null ? MapReportToDto(i.Report) : null,
    };

    private static InspectionReportDto MapReportToDto(InspectionReport r) => new()
    {
        ReportId = r.ReportId,
        InspectionId = r.InspectionId,
        FinalVerdict = r.FinalVerdict?.ToString(),
        IsLocked = r.IsLocked,
        SubmittedAt = r.SubmittedAt,
        VerdictSubmittedAt = r.VerdictSubmittedAt,
        Categories = r.Categories.Select(c => new InspectionCategoryDto
        {
            CategoryId = c.CategoryId,
            CategoryName = c.CategoryName.ToString(),
            Findings = c.Findings,
            PassFail = c.PassFail.ToString(),
            Severity = c.Severity.ToString(),
            Photos = c.Photos.Select(p => new InspectionPhotoDto
            {
                InspectionPhotoId = p.InspectionPhotoId,
                PhotoUrl = p.PhotoUrl,
                UploadedAt = p.UploadedAt,
            }),
        }),
    };
}
