using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TrustEstate.Domain.Entities;

namespace TrustEstate.Infrastructure.Persistence.Configurations;

internal sealed class PostInspectionWindowConfiguration : IEntityTypeConfiguration<PostInspectionWindow>
{
    public void Configure(EntityTypeBuilder<PostInspectionWindow> builder)
    {
        builder.ToTable("PostInspectionWindows");
        builder.HasKey(w => w.WindowId);

        builder.Property(w => w.VerdictNotifiedAt).IsRequired();
        builder.Property(w => w.WindowExpiresAt).IsRequired();
        builder.Property(w => w.ActionTaken).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(w => w.ActionTakenAt);

        builder.HasOne(w => w.Offer)
            .WithOne(o => o.PostInspectionWindow)
            .HasForeignKey<PostInspectionWindow>(w => w.OfferId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(w => w.Inspection)
            .WithOne(i => i.PostInspectionWindow)
            .HasForeignKey<PostInspectionWindow>(w => w.InspectionId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
