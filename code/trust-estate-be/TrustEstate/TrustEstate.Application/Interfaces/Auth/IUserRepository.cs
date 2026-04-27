using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using TrustEstate.Domain.Entities;

namespace TrustEstate.Application.Interfaces.Auth;

/// <summary>
/// Data access contract for User-related queries and persistence.
/// Defined in Application, implemented in Infrastructure.Persistence.Repositories.
/// </summary>
public interface IUserRepository
{
    Task<User?> GetByIdAsync(int userId, CancellationToken ct = default);
    Task<User?> GetByEmailAsync(string email, CancellationToken ct = default);

    /// <summary>Includes AgentProfile or InspectorProfile navigation for registration checks.</summary>
    Task<User?> GetByIdWithProfileAsync(int userId, CancellationToken ct = default);

    Task<bool> EmailExistsAsync(string email, CancellationToken ct = default);
    Task AddAsync(User user, CancellationToken ct = default);
    void Update(User user);
    Task SaveChangesAsync(CancellationToken ct = default);
}