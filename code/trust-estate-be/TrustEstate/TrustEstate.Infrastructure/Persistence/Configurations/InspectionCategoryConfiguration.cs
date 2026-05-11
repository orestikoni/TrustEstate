using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TrustEstate.Domain.Entities;

namespace TrustEstate.Infrastructure.Persistence.Configurations;

internal sealed class InspectionCategoryConfiguration : IEntityTypeConfiguration<InspectionCategory>
{
    public void Configure(EntityTypeBuilder<InspectionCategory> builder)
    {
        builder.ToTable("InspectionCategories");
        builder.HasKey(c => c.CategoryId);

        builder.Property(c => c.CategoryName).HasConversion<string>().HasMaxLength(30).IsRequired();
        builder.Property(c => c.Findings).IsRequired();
        builder.Property(c => c.PassFail).HasConversion<string>().HasMaxLength(10).IsRequired();
        builder.Property(c => c.Severity).HasConversion<string>().HasMaxLength(10).IsRequired();

        builder.HasOne(c => c.Report)
            .WithMany(r => r.Categories)
            .HasForeignKey(c => c.ReportId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
