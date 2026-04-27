using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TrustEstate.Domain.Enums;

public enum PasswordResetTokenStatus
{
    Active,
    Used,
    Expired
}