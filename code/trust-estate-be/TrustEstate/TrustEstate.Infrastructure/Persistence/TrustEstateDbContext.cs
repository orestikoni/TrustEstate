using Microsoft.EntityFrameworkCore;
using TrustEstate.Domain.Entities;

namespace TrustEstate.Infrastructure.Persistence;

public class TrustEstateDbContext : DbContext
{
    public TrustEstateDbContext(DbContextOptions<TrustEstateDbContext> options)
        : base(options) { }

    // Auth tables
    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<LoginAttempt> LoginAttempts => Set<LoginAttempt>();

    // Adding future DbSets here (Listings, Offers, Inspections, etc.)

    // Listing tables
    public DbSet<Listing> Listings => Set<Listing>();
    public DbSet<ListingPhoto> ListingPhotos => Set<ListingPhoto>();
    public DbSet<ListingAssignment> ListingAssignments => Set<ListingAssignment>();

    // Adding future DbSets here (Offers, Inspections, etc.)

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(TrustEstateDbContext).Assembly);
    }
}