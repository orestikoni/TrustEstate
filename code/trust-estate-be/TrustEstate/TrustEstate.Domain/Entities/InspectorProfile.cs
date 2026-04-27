using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TrustEstate.Domain.Entities;

public class InspectorProfile
{
    public int InspectorProfileId { get; set; }
    public int UserId { get; set; }
    public string? ProfessionalQualifications { get; set; }
    public bool IsVerified { get; set; } = false;
    public DateTime? VerifiedAt { get; set; }
    public string? VerificationNotes { get; set; }    // Admin rejection reason

    // Navigation
    public User User { get; set; } = null!;
}