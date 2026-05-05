using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TrustEstate.Domain.Entities;

namespace TrustEstate.Infrastructure.Persistence.Configurations;

internal sealed class ListingConfiguration : IEntityTypeConfiguration<Listing>
{
    public void Configure(EntityTypeBuilder<Listing> builder)
    {
        builder.ToTable("Listings");
        builder.HasKey(l => l.ListingId);

        builder.Property(l => l.Title).IsRequired().HasMaxLength(150);
        builder.Property(l => l.Description).IsRequired();
        builder.Property(l => l.Address).IsRequired().HasMaxLength(255);
        builder.Property(l => l.City).IsRequired().HasMaxLength(100);
        builder.Property(l => l.Country).IsRequired().HasMaxLength(100);
        builder.Property(l => l.AskingPrice).IsRequired().HasColumnType("numeric(15,2)");
        builder.Property(l => l.ListingType).HasConversion<string>().HasMaxLength(20);
        builder.Property(l => l.PropertyType).HasConversion<string>().HasMaxLength(20);
        builder.Property(l => l.Status).HasConversion<string>().HasMaxLength(30);
        builder.Property(l => l.CorrectionNotes).HasMaxLength(1000);
        builder.Property(l => l.ModerationNotes).HasMaxLength(1000);
        builder.Property(l => l.CreatedAt).IsRequired();
        builder.Property(l => l.UpdatedAt).IsRequired();
        builder.Property(l => l.PublishedAt);
        builder.Property(l => l.ArchivedAt);

        builder.HasOne(l => l.Owner)
            .WithMany()
            .HasForeignKey(l => l.OwnerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(l => l.Agent)
            .WithMany()
            .HasForeignKey(l => l.AgentId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(l => l.Photos)
            .WithOne(p => p.Listing)
            .HasForeignKey(p => p.ListingId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(l => l.Assignments)
            .WithOne(a => a.Listing)
            .HasForeignKey(a => a.ListingId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}