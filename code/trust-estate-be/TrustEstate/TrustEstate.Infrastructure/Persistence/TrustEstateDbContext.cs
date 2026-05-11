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

    // Offer tables
    public DbSet<Offer> Offers => Set<Offer>();
    public DbSet<Negotiation> Negotiations => Set<Negotiation>();
    public DbSet<PostInspectionWindow> PostInspectionWindows => Set<PostInspectionWindow>();

    // Inspection tables
    public DbSet<Inspection> Inspections => Set<Inspection>();
    public DbSet<InspectionReport> InspectionReports => Set<InspectionReport>();
    public DbSet<InspectionCategory> InspectionCategories => Set<InspectionCategory>();
    public DbSet<InspectionPhoto> InspectionPhotos => Set<InspectionPhoto>();

    // Transaction & dispute tables
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<Dispute> Disputes => Set<Dispute>();

    // Communication tables
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<MessageThread> MessageThreads => Set<MessageThread>();
    public DbSet<Message> Messages => Set<Message>();

    // Misc tables
    public DbSet<FavoriteListing> FavoriteListings => Set<FavoriteListing>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(TrustEstateDbContext).Assembly);
    }
}