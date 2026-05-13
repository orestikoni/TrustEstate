using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TrustEstate.Domain.Entities;

namespace TrustEstate.Infrastructure.Persistence.Configurations;

internal sealed class InspectionPhotoConfiguration : IEntityTypeConfiguration<InspectionPhoto>
{
    public void Configure(EntityTypeBuilder<InspectionPhoto> builder)
    {
        builder.ToTable("InspectionPhotos");
        builder.HasKey(p => p.InspectionPhotoId);

        builder.Property(p => p.PhotoUrl).IsRequired().HasMaxLength(500);
        builder.Property(p => p.UploadedAt).IsRequired();

        builder.HasOne(p => p.Category)
            .WithMany(c => c.Photos)
            .HasForeignKey(p => p.CategoryId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
