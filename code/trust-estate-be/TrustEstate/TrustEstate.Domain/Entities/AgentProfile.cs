using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using TrustEstate.Domain.Enums;

namespace TrustEstate.Domain.Entities;

public class AgentProfile
{
    public int AgentProfileId { get; set; }
    public int UserId { get; set; }
    public AgencyType AgencyType { get; set; }
    public string? AgencyName { get; set; }           // null if Independent
    public bool IsVerified { get; set; } = false;
    public DateTime? VerifiedAt { get; set; }
    public string? VerificationNotes { get; set; }    // Admin rejection reason

    // Navigation
    public User User { get; set; } = null!;
}