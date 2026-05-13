using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TrustEstate.Domain.Entities;

namespace TrustEstate.Infrastructure.Persistence.Configurations;

internal sealed class InspectionReportConfiguration : IEntityTypeConfiguration<InspectionReport>
{
    public void Configure(EntityTypeBuilder<InspectionReport> builder)
    {
        builder.ToTable("InspectionReports");
        builder.HasKey(r => r.ReportId);

        builder.Property(r => r.FinalVerdict).HasConversion<string>().HasMaxLength(25);
        builder.Property(r => r.IsLocked).IsRequired();
        builder.Property(r => r.SubmittedAt);
        builder.Property(r => r.VerdictSubmittedAt);

        builder.HasOne(r => r.Inspection)
            .WithOne(i => i.Report)
            .HasForeignKey<InspectionReport>(r => r.InspectionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
