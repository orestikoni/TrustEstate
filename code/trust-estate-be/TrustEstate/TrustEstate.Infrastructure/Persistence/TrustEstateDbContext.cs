using Microsoft.EntityFrameworkCore;
using TrustEstate.Domain.Entities;

namespace TrustEstate.Infrastructure.Persistence;

public class TrustEstateDbContext : DbContext
{
    public TrustEstateDbContext(DbContextOptions<TrustEstateDbContext> options)
        : base(options) { }

    // Auth tables
    public DbSet<User> Users => Set<User>();
    public DbSet<AgentProfile> AgentProfiles => Set<AgentProfile>();
    public DbSet<InspectorProfile> InspectorProfiles => Set<InspectorProfile>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<LoginAttempt> LoginAttempts => Set<LoginAttempt>();

    // Adding future DbSets here (Listings, Offers, Inspections, etc.)

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Auto-applies all IEntityTypeConfiguration<T> in this assembly
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(TrustEstateDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}