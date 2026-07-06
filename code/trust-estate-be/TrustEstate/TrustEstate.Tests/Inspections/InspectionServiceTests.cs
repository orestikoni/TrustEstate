using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;
using TrustEstate.Application.DTOs.Inspections;
using TrustEstate.Application.Interfaces.Inspections;
using TrustEstate.Application.Interfaces.Notifications;
using TrustEstate.Domain.Entities;
using TrustEstate.Domain.Enums;
using TrustEstate.Domain.Exceptions;
using TrustEstate.Infrastructure.Persistence;
using TrustEstate.Infrastructure.Services;

namespace TrustEstate.Tests.Inspections;

public class InspectionServiceTests
{
    private readonly Mock<IInspectionRepository> _repo = new();
    private readonly Mock<INotificationService> _notifications = new();

    private static TrustEstateDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<TrustEstateDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new TrustEstateDbContext(options);
    }

    private InspectionService BuildSut(TrustEstateDbContext db) =>
        new InspectionService(_repo.Object, _notifications.Object, db);

    private void SetupNotificationsToComplete()
    {
        _notifications.Setup(n => n.CreateAsync(
            It.IsAny<int>(), It.IsAny<NotificationType>(), It.IsAny<string>(),
            It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<int?>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
    }

    private static Inspection BuildInspection(
        int inspectionId = 1, int listingId = 1, int offerId = 1,
        int inspectorId = 7, int agentId = 5,
        InspectionStatus status = InspectionStatus.Scheduled,
        InspectionReport? report = null) => new()
    {
        InspectionId = inspectionId,
        ListingId = listingId,
        OfferId = offerId,
        InspectorId = inspectorId,
        AgentId = agentId,
        Status = status,
        ScheduledDate = DateTime.UtcNow.AddDays(3),
        Report = report,
        Inspector = new User { Id = inspectorId, FirstName = "John", LastName = "Inspector" },
    };

    // ── AssignInspectorAsync ─────────────────────────────────────────────────

    [Fact]
    public async Task AssignInspector_WrongAgent_ThrowsForbiddenException()
    {
        using var db = CreateDb();
        db.Listings.Add(new Listing { ListingId = 1, AgentId = 5, OwnerId = 10, Status = ListingStatus.UnderOffer, Title = "T", Description = "D", Address = "A", City = "C", Country = "X" });
        await db.SaveChangesAsync();

        var request = new AssignInspectorRequest { ListingId = 1, OfferId = 1, InspectorId = 7, ScheduledDate = DateTime.UtcNow.AddDays(3) };

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            BuildSut(db).AssignInspectorAsync(agentId: 99, request));
    }

    [Fact]
    public async Task AssignInspector_ListingNotUnderOffer_ThrowsBusinessRuleException()
    {
        using var db = CreateDb();
        db.Listings.Add(new Listing { ListingId = 1, AgentId = 5, OwnerId = 10, Status = ListingStatus.Active, Title = "T", Description = "D", Address = "A", City = "C", Country = "X" });
        await db.SaveChangesAsync();

        var request = new AssignInspectorRequest { ListingId = 1, OfferId = 1, InspectorId = 7, ScheduledDate = DateTime.UtcNow.AddDays(3) };

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            BuildSut(db).AssignInspectorAsync(agentId: 5, request));
    }

    [Fact]
    public async Task AssignInspector_InspectionAlreadyExists_ThrowsConflictException()
    {
        using var db = CreateDb();
        db.Listings.Add(new Listing { ListingId = 1, AgentId = 5, OwnerId = 10, Status = ListingStatus.UnderOffer, Title = "T", Description = "D", Address = "A", City = "C", Country = "X" });
        await db.SaveChangesAsync();

        _repo.Setup(r => r.GetByListingIdAsync(1, It.IsAny<CancellationToken>()))
             .ReturnsAsync(BuildInspection());

        var request = new AssignInspectorRequest { ListingId = 1, OfferId = 1, InspectorId = 7, ScheduledDate = DateTime.UtcNow.AddDays(3) };

        await Assert.ThrowsAsync<ConflictException>(() =>
            BuildSut(db).AssignInspectorAsync(agentId: 5, request));
    }

    [Fact]
    public async Task AssignInspector_UserIsNotPropertyInspector_ThrowsBusinessRuleException()
    {
        using var db = CreateDb();
        db.Listings.Add(new Listing { ListingId = 1, AgentId = 5, OwnerId = 10, Status = ListingStatus.UnderOffer, Title = "T", Description = "D", Address = "A", City = "C", Country = "X" });
        db.Users.Add(new User { Id = 7, FirstName = "Not", LastName = "Inspector", Email = "x@x.com", PasswordHash = "h", Role = UserRole.Buyer, AccountStatus = AccountStatus.Active });
        db.Offers.Add(new Offer { OfferId = 1, ListingId = 1, BuyerId = 20, Status = OfferStatus.Accepted });
        await db.SaveChangesAsync();

        _repo.Setup(r => r.GetByListingIdAsync(1, It.IsAny<CancellationToken>()))
             .ReturnsAsync((Inspection?)null);

        var request = new AssignInspectorRequest { ListingId = 1, OfferId = 1, InspectorId = 7, ScheduledDate = DateTime.UtcNow.AddDays(3) };

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            BuildSut(db).AssignInspectorAsync(agentId: 5, request));
    }

    // ── UpdateInspectionStatusAsync ──────────────────────────────────────────

    [Fact]
    public async Task UpdateStatus_WrongInspector_ThrowsForbiddenException()
    {
        using var db = CreateDb();
        _repo.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
             .ReturnsAsync(BuildInspection(inspectorId: 7));

        var request = new UpdateInspectionStatusRequest { Status = "InProgress" };

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            BuildSut(db).UpdateInspectionStatusAsync(inspectorId: 99, inspectionId: 1, request));
    }

    [Fact]
    public async Task UpdateStatus_CannotRevertToScheduled_ThrowsBusinessRuleException()
    {
        using var db = CreateDb();
        _repo.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
             .ReturnsAsync(BuildInspection(inspectorId: 7, status: InspectionStatus.InProgress));

        var request = new UpdateInspectionStatusRequest { Status = "Scheduled" };

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            BuildSut(db).UpdateInspectionStatusAsync(inspectorId: 7, inspectionId: 1, request));
    }

    [Fact]
    public async Task UpdateStatus_InspectionAlreadyCompleted_ThrowsBusinessRuleException()
    {
        using var db = CreateDb();
        _repo.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
             .ReturnsAsync(BuildInspection(inspectorId: 7, status: InspectionStatus.Completed));

        var request = new UpdateInspectionStatusRequest { Status = "InProgress" };

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            BuildSut(db).UpdateInspectionStatusAsync(inspectorId: 7, inspectionId: 1, request));
    }

    [Fact]
    public async Task UpdateStatus_CompletedWithoutBeingInProgress_ThrowsBusinessRuleException()
    {
        using var db = CreateDb();
        _repo.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
             .ReturnsAsync(BuildInspection(inspectorId: 7, status: InspectionStatus.Scheduled));

        var request = new UpdateInspectionStatusRequest { Status = "Completed" };

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            BuildSut(db).UpdateInspectionStatusAsync(inspectorId: 7, inspectionId: 1, request));
    }

    // ── SubmitFinalVerdictAsync ──────────────────────────────────────────────

    [Fact]
    public async Task SubmitVerdict_WrongInspector_ThrowsForbiddenException()
    {
        using var db = CreateDb();
        _repo.Setup(r => r.GetByIdWithReportAsync(1, It.IsAny<CancellationToken>()))
             .ReturnsAsync(BuildInspection(inspectorId: 7));

        var request = new SubmitVerdictRequest { Verdict = "Passed" };

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            BuildSut(db).SubmitFinalVerdictAsync(inspectorId: 99, inspectionId: 1, request));
    }

    [Fact]
    public async Task SubmitVerdict_NoReportSubmittedYet_ThrowsBusinessRuleException()
    {
        using var db = CreateDb();
        _repo.Setup(r => r.GetByIdWithReportAsync(1, It.IsAny<CancellationToken>()))
             .ReturnsAsync(BuildInspection(inspectorId: 7, report: null));

        var request = new SubmitVerdictRequest { Verdict = "Passed" };

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            BuildSut(db).SubmitFinalVerdictAsync(inspectorId: 7, inspectionId: 1, request));
    }

    [Fact]
    public async Task SubmitVerdict_ReportAlreadyLocked_ThrowsBusinessRuleException()
    {
        using var db = CreateDb();
        var lockedReport = new InspectionReport { ReportId = 1, InspectionId = 1, IsLocked = true, Categories = new List<InspectionCategory>() };
        _repo.Setup(r => r.GetByIdWithReportAsync(1, It.IsAny<CancellationToken>()))
             .ReturnsAsync(BuildInspection(inspectorId: 7, report: lockedReport));

        var request = new SubmitVerdictRequest { Verdict = "Passed" };

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            BuildSut(db).SubmitFinalVerdictAsync(inspectorId: 7, inspectionId: 1, request));
    }

    [Fact]
    public async Task SubmitVerdict_FailedVerdict_SendsActionRequiredNotificationToBuyer()
    {
        using var db = CreateDb();
        db.Offers.Add(new Offer { OfferId = 1, ListingId = 1, BuyerId = 20, Status = OfferStatus.Accepted });
        db.Listings.Add(new Listing { ListingId = 1, AgentId = 5, OwnerId = 10, Title = "T", Description = "D", Address = "A", City = "C", Country = "X" });
        await db.SaveChangesAsync();

        var unlockedReport = new InspectionReport { ReportId = 1, InspectionId = 1, IsLocked = false, Categories = new List<InspectionCategory>() };
        var inspection = BuildInspection(offerId: 1, inspectorId: 7, report: unlockedReport);

        _repo.Setup(r => r.GetByIdWithReportAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(inspection);
        _repo.Setup(r => r.UpdateReport(It.IsAny<InspectionReport>()));
        _repo.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        SetupNotificationsToComplete();

        var request = new SubmitVerdictRequest { Verdict = "Failed" };
        await BuildSut(db).SubmitFinalVerdictAsync(inspectorId: 7, inspectionId: 1, request);

        _notifications.Verify(n => n.CreateAsync(
            20,
            NotificationType.InspectionUpdate,
            It.Is<string>(t => t.Contains("Action Required")),
            It.IsAny<string>(),
            It.IsAny<string?>(), It.IsAny<int?>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task SubmitVerdict_PassedVerdict_SendsPassedNotificationToBuyer()
    {
        using var db = CreateDb();
        db.Offers.Add(new Offer { OfferId = 1, ListingId = 1, BuyerId = 20, Status = OfferStatus.Accepted });
        db.Listings.Add(new Listing { ListingId = 1, AgentId = 5, OwnerId = 10, Title = "T", Description = "D", Address = "A", City = "C", Country = "X" });
        await db.SaveChangesAsync();

        var unlockedReport = new InspectionReport { ReportId = 1, InspectionId = 1, IsLocked = false, Categories = new List<InspectionCategory>() };
        var inspection = BuildInspection(offerId: 1, inspectorId: 7, report: unlockedReport);

        _repo.Setup(r => r.GetByIdWithReportAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(inspection);
        _repo.Setup(r => r.UpdateReport(It.IsAny<InspectionReport>()));
        _repo.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        SetupNotificationsToComplete();

        var request = new SubmitVerdictRequest { Verdict = "Passed" };
        await BuildSut(db).SubmitFinalVerdictAsync(inspectorId: 7, inspectionId: 1, request);

        _notifications.Verify(n => n.CreateAsync(
            20,
            NotificationType.InspectionUpdate,
            It.Is<string>(t => t.Contains("Passed")),
            It.IsAny<string>(),
            It.IsAny<string?>(), It.IsAny<int?>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    // ── SubmitInspectionReportAsync ──────────────────────────────────────────

    [Fact]
    public async Task SubmitReport_WrongInspector_ThrowsForbiddenException()
    {
        using var db = CreateDb();
        _repo.Setup(r => r.GetByIdWithReportAsync(1, It.IsAny<CancellationToken>()))
             .ReturnsAsync(BuildInspection(inspectorId: 7, status: InspectionStatus.Completed));

        var request = new SubmitInspectionReportRequest { Categories = Enumerable.Empty<CategoryInput>() };

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            BuildSut(db).SubmitInspectionReportAsync(inspectorId: 99, inspectionId: 1, request));
    }

    [Fact]
    public async Task SubmitReport_InspectionNotCompleted_ThrowsBusinessRuleException()
    {
        using var db = CreateDb();
        _repo.Setup(r => r.GetByIdWithReportAsync(1, It.IsAny<CancellationToken>()))
             .ReturnsAsync(BuildInspection(inspectorId: 7, status: InspectionStatus.InProgress));

        var request = new SubmitInspectionReportRequest { Categories = Enumerable.Empty<CategoryInput>() };

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            BuildSut(db).SubmitInspectionReportAsync(inspectorId: 7, inspectionId: 1, request));
    }

    [Fact]
    public async Task SubmitReport_ReportAlreadyExists_ThrowsConflictException()
    {
        using var db = CreateDb();
        var existingReport = new InspectionReport { ReportId = 1, InspectionId = 1, IsLocked = false, Categories = new List<InspectionCategory>() };
        _repo.Setup(r => r.GetByIdWithReportAsync(1, It.IsAny<CancellationToken>()))
             .ReturnsAsync(BuildInspection(inspectorId: 7, status: InspectionStatus.Completed, report: existingReport));

        var request = new SubmitInspectionReportRequest { Categories = Enumerable.Empty<CategoryInput>() };

        await Assert.ThrowsAsync<ConflictException>(() =>
            BuildSut(db).SubmitInspectionReportAsync(inspectorId: 7, inspectionId: 1, request));
    }

    [Fact]
    public async Task SubmitReport_MissingRequiredCategory_ThrowsBusinessRuleException()
    {
        using var db = CreateDb();
        _repo.Setup(r => r.GetByIdWithReportAsync(1, It.IsAny<CancellationToken>()))
             .ReturnsAsync(BuildInspection(inspectorId: 7, status: InspectionStatus.Completed, report: null));
        _repo.Setup(r => r.AddReportAsync(It.IsAny<InspectionReport>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _repo.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var request = new SubmitInspectionReportRequest
        {
            Categories = new[]
            {
                new CategoryInput { CategoryName = "StructuralIntegrity", Findings = "OK", PassFail = "Pass", Severity = "Minor" },
                new CategoryInput { CategoryName = "Plumbing", Findings = "OK", PassFail = "Pass", Severity = "Minor" },
                // Missing Electrical and Safety — only 2 of 4
            },
        };

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            BuildSut(db).SubmitInspectionReportAsync(inspectorId: 7, inspectionId: 1, request));
    }
}
