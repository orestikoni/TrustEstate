using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TrustEstate.Domain.Entities;

namespace TrustEstate.Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(u => u.Id);

        builder.Property(u => u.FirstName).IsRequired().HasMaxLength(50);
        builder.Property(u => u.LastName).IsRequired().HasMaxLength(50);
        builder.Property(u => u.Email).IsRequired().HasMaxLength(100);
        builder.HasIndex(u => u.Email).IsUnique();
        builder.Property(u => u.PasswordHash).IsRequired();
        builder.Property(u => u.Role).IsRequired().HasConversion<string>();
        builder.Property(u => u.AccountStatus).IsRequired().HasConversion<string>();
        builder.Property(u => u.PhoneNumber).HasMaxLength(20);
        builder.Property(u => u.AgencyType).HasMaxLength(20);
        builder.Property(u => u.AgencyName).HasMaxLength(100);
        builder.Property(u => u.ProfessionalQualifications).HasMaxLength(1000);

        builder.HasMany(u => u.RefreshTokens)
            .WithOne(r => r.User)
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
