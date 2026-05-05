using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TrustEstate.Domain.Entities;

namespace TrustEstate.Infrastructure.Persistence.Configurations;

internal sealed class ListingPhotoConfiguration : IEntityTypeConfiguration<ListingPhoto>
{
    public void Configure(EntityTypeBuilder<ListingPhoto> builder)
    {
        builder.ToTable("ListingPhotos");
        builder.HasKey(p => p.PhotoId);
        builder.Property(p => p.PhotoUrl).IsRequired().HasMaxLength(500);
        builder.Property(p => p.DisplayOrder);
        builder.Property(p => p.UploadedAt).IsRequired();
    }
}