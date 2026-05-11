using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TrustEstate.Domain.Entities;

namespace TrustEstate.Infrastructure.Persistence.Configurations;

internal sealed class DisputeConfiguration : IEntityTypeConfiguration<Dispute>
{
    public void Configure(EntityTypeBuilder<Dispute> builder)
    {
        builder.ToTable("Disputes");
        builder.HasKey(d => d.DisputeId);

        builder.Property(d => d.Description).IsRequired();
        builder.Property(d => d.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(d => d.ResolutionOutcome);
        builder.Property(d => d.SubmittedAt).IsRequired();
        builder.Property(d => d.ResolvedAt);

        builder.HasOne(d => d.Transaction)
            .WithMany(t => t.Disputes)
            .HasForeignKey(d => d.TransactionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(d => d.SubmittedBy)
            .WithMany(u => u.SubmittedDisputes)
            .HasForeignKey(d => d.SubmittedById)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
