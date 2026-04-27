using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TrustEstate.Domain.Exceptions;

/// <summary>Base for all domain-level errors.</summary>
public abstract class DomainException : Exception
{
    protected DomainException(string message) : base(message) { }
}

/// <summary>Thrown when a requested resource does not exist.</summary>
public sealed class NotFoundException : DomainException
{
    public NotFoundException(string resource, object key)
        : base($"{resource} with key '{key}' was not found.") { }
}

/// <summary>Thrown when business rules are violated.</summary>
public sealed class BusinessRuleException : DomainException
{
    public BusinessRuleException(string message) : base(message) { }
}

/// <summary>Thrown when login credentials are invalid or account is blocked.</summary>
public sealed class AuthenticationException : DomainException
{
    public AuthenticationException(string message) : base(message) { }
}

/// <summary>Thrown when a user tries to access something they are not allowed to.</summary>
public sealed class ForbiddenException : DomainException
{
    public ForbiddenException(string message = "You do not have permission to perform this action.")
        : base(message) { }
}

/// <summary>Thrown when a duplicate unique value is detected (e.g. email already registered).</summary>
public sealed class ConflictException : DomainException
{
    public ConflictException(string message) : base(message) { }
}