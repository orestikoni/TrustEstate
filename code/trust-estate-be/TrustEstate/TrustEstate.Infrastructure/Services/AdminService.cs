using Microsoft.EntityFrameworkCore;
using TrustEstate.Application.DTOs.Admin;
using TrustEstate.Application.Interfaces.Admin;
using TrustEstate.Domain.Enums;
using TrustEstate.Domain.Exceptions;
using TrustEstate.Infrastructure.Persistence;

namespace TrustEstate.Infrastructure.Services;

public class AdminService : IAdminService
{
    private readonly TrustEstateDbContext _db;

    public AdminService(TrustEstateDbContext db) => _db = db;

    public async Task<IEnumerable<PendingVerificationDto>> GetPendingVerificationsAsync(CancellationToken ct = default)
    {
        var pending = await _db.Users
            .Where(u =>
                u.AccountStatus == AccountStatus.Pending &&
                (u.Role == UserRole.Agent || u.Role == UserRole.PropertyInspector))
            .OrderBy(u => u.CreatedAt)
            .Select(u => new PendingVerificationDto
            {
                UserId = u.Id,
                FirstName = u.FirstName,
                LastName = u.LastName,
                Email = u.Email,
                Role = u.Role.ToString(),
                AgencyType = u.AgencyType,
                AgencyName = u.AgencyName,
                ProfessionalQualifications = u.ProfessionalQualifications,
                RegisteredAt = u.CreatedAt,
            })
            .ToListAsync(ct);

        return pending;
    }

    public async Task ApproveVerificationAsync(int userId, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new NotFoundException("User", userId);

        if (user.AccountStatus != AccountStatus.Pending)
            throw new InvalidOperationException("User is not pending verification.");

        user.AccountStatus = AccountStatus.Active;
        await _db.SaveChangesAsync(ct);
    }

    public async Task RejectVerificationAsync(int userId, string? notes, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new NotFoundException("User", userId);

        if (user.AccountStatus != AccountStatus.Pending)
            throw new InvalidOperationException("User is not pending verification.");

        user.AccountStatus = AccountStatus.Rejected;
        await _db.SaveChangesAsync(ct);
    }
}
