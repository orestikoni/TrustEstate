using Microsoft.EntityFrameworkCore;
using TrustEstate.Domain.Entities;

namespace TrustEstate.Infrastructure.Persistence;

public class TrustEstateDbContext : DbContext
{
    public TrustEstateDbContext(DbContextOptions<TrustEstateDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(TrustEstateDbContext).Assembly);
    }
}