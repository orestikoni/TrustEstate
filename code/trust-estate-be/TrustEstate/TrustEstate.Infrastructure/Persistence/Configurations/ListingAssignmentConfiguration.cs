using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TrustEstate.Domain.Entities;

namespace TrustEstate.Infrastructure.Persistence.Configurations;

internal sealed class ListingAssignmentConfiguration : IEntityTypeConfiguration<ListingAssignment>
{
    public void Configure(EntityTypeBuilder<ListingAssignment> builder)
    {
        builder.ToTable("ListingAssignments");
        builder.HasKey(a => a.AssignmentId);
        builder.Property(a => a.AssignmentStatus).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(a => a.RequestedAt).IsRequired();
        builder.Property(a => a.RespondedAt);

        builder.HasOne(a => a.Agent)
            .WithMany()
            .HasForeignKey(a => a.AgentId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}