using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TrustEstate.Domain.Entities;

namespace TrustEstate.Infrastructure.Persistence.Configurations;

internal sealed class InspectionConfiguration : IEntityTypeConfiguration<Inspection>
{
    public void Configure(EntityTypeBuilder<Inspection> builder)
    {
        builder.ToTable("Inspections");
        builder.HasKey(i => i.InspectionId);

        builder.Property(i => i.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(i => i.ScheduledDate).IsRequired();
        builder.Property(i => i.AssignedAt).IsRequired();
        builder.Property(i => i.StartedAt);
        builder.Property(i => i.CompletedAt);

        builder.HasOne(i => i.Listing)
            .WithMany(l => l.Inspections)
            .HasForeignKey(i => i.ListingId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(i => i.Offer)
            .WithOne(o => o.Inspection)
            .HasForeignKey<Inspection>(i => i.OfferId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(i => i.Inspector)
            .WithMany()
            .HasForeignKey(i => i.InspectorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(i => i.Agent)
            .WithMany()
            .HasForeignKey(i => i.AgentId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
