using TrustEstate.Domain.Enums;

namespace TrustEstate.Domain.Entities;

public class AuditLog
{
    public int LogId { get; set; }
    public int? UserId { get; set; }
    public AuditLogAction ActionType { get; set; }
    public string? EntityType { get; set; }
    public int? EntityId { get; set; }
    public string? Description { get; set; }
    public DateTime PerformedAt { get; set; } = DateTime.UtcNow;
    public string? IpAddress { get; set; }

    // Navigation properties
    public User? User { get; set; }
}
