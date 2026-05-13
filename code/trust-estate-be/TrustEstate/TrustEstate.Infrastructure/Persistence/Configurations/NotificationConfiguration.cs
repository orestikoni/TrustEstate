using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TrustEstate.Domain.Entities;

namespace TrustEstate.Infrastructure.Persistence.Configurations;

internal sealed class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("Notifications");
        builder.HasKey(n => n.NotificationId);

        builder.Property(n => n.Type).HasConversion<string>().HasMaxLength(30).IsRequired();
        builder.Property(n => n.Title).IsRequired().HasMaxLength(150);
        builder.Property(n => n.Body).IsRequired();
        builder.Property(n => n.IsRead).IsRequired();
        builder.Property(n => n.RelatedEntityType).HasMaxLength(50);
        builder.Property(n => n.RelatedEntityId);
        builder.Property(n => n.CreatedAt).IsRequired();
        builder.Property(n => n.ReadAt);

        builder.HasOne(n => n.User)
            .WithMany(u => u.Notifications)
            .HasForeignKey(n => n.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
