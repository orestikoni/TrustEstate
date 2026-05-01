using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TrustEstate.Domain.Entities;

namespace TrustEstate.Infrastructure.Persistence.Configurations;

public class LoginAttemptConfiguration : IEntityTypeConfiguration<LoginAttempt>
{
    public void Configure(EntityTypeBuilder<LoginAttempt> builder)
    {
        builder.HasKey(l => l.AttemptId);
        builder.Property(l => l.EmailAttempted).IsRequired().HasMaxLength(100);
        builder.Property(l => l.IpAddress).HasMaxLength(45);
    }
}
