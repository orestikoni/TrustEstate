namespace TrustEstate.Domain.Enums;

public enum AuditLogAction
{
    Login,
    FailedLogin,
    PasswordReset,
    AccountVerification,
    ListingAction,
    OfferEvent,
    InspectionUpdate,
    DisputeSubmission,
    DisputeResolution,
    AccountStatusChange,
}
