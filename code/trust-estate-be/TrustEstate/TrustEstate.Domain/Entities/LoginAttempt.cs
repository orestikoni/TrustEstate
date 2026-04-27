using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TrustEstate.Domain.Entities;

public class LoginAttempt
{
    public int AttemptId { get; set; }
    public int? UserId { get; set; }                  // null if email not found
    public string EmailAttempted { get; set; } = string.Empty;
    public bool Success { get; set; }
    public DateTime AttemptedAt { get; set; } = DateTime.UtcNow;
    public string? IpAddress { get; set; }

    // Navigation
    public User? User { get; set; }
}