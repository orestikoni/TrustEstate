using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TrustEstate.Domain.Entities;

namespace TrustEstate.Infrastructure.Persistence.Configurations;

internal sealed class FavoriteListingConfiguration : IEntityTypeConfiguration<FavoriteListing>
{
    public void Configure(EntityTypeBuilder<FavoriteListing> builder)
    {
        builder.ToTable("FavoriteListings");
        builder.HasKey(f => f.FavoriteId);

        builder.Property(f => f.SavedAt).IsRequired();

        builder.HasIndex(f => new { f.UserId, f.ListingId }).IsUnique();

        builder.HasOne(f => f.User)
            .WithMany(u => u.FavoriteListings)
            .HasForeignKey(f => f.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(f => f.Listing)
            .WithMany(l => l.FavoritedBy)
            .HasForeignKey(f => f.ListingId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
