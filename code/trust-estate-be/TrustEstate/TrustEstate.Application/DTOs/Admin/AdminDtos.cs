namespace TrustEstate.Application.DTOs.Admin;

// ── Analytics ────────────────────────────────────────────────────────────────

public sealed record AnalyticsDashboardDto(
    int ActiveListings,
    int FlaggedListings,
    int SuspendedListings,
    int PendingVerifications,
    int OngoingTransactions,
    int OpenDisputes,
    IReadOnlyDictionary<string, int> RegisteredUsersByRole
);

// ── User Management ───────────────────────────────────────────────────────────

public sealed record PendingUserDto(
    int UserId,
    string FirstName,
    string LastName,
    string Email,
    string Role,
    string? PhoneNumber,
    string? AgencyType,
    string? AgencyName,
    string? ProfessionalQualifications,
    DateTime CreatedAt
);

public sealed record AdminUserDto(
    int UserId,
    string FirstName,
    string LastName,
    string Email,
    string Role,
    string AccountStatus,
    string? PhoneNumber,
    string? AgencyType,
    string? AgencyName,
    DateTime CreatedAt,
    DateTime? LastLoginAt
);

public sealed record UserActionRequest(string Reason);

// ── Listing Management ────────────────────────────────────────────────────────

public sealed record AdminListingDto(
    int ListingId,
    string Title,
    string Status,
    string OwnerFullName,
    string? AgentFullName,
    decimal AskingPrice,
    string City,
    string Country,
    string? ModerationNotes,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public sealed record ListingActionRequest(string Reason);

// ── Inspection Report Monitoring ──────────────────────────────────────────────

public sealed record AdminInspectionReportDto(
    int ReportId,
    int InspectionId,
    int ListingId,
    string ListingTitle,
    string InspectorFullName,
    string? FinalVerdict,
    bool IsLocked,
    bool IsFlagged,
    string? FlagReason,
    DateTime? SubmittedAt,
    DateTime? FlaggedAt
);

public sealed record InspectionReportActionRequest(string Reason);

// ── Dispute Management ────────────────────────────────────────────────────────

public sealed record AdminDisputeDto(
    int DisputeId,
    int TransactionId,
    int ListingId,
    string ListingTitle,
    string SubmittedByFullName,
    string Description,
    string Status,
    string? ResolutionOutcome,
    DateTime SubmittedAt,
    DateTime? ResolvedAt
);

public sealed record ResolveDisputeRequest(string Outcome);

public sealed record SuspendTransactionRequest(string Reason);
