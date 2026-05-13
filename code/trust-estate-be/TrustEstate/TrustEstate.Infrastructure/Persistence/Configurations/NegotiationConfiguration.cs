using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TrustEstate.Domain.Entities;

namespace TrustEstate.Infrastructure.Persistence.Configurations;

internal sealed class NegotiationConfiguration : IEntityTypeConfiguration<Negotiation>
{
    public void Configure(EntityTypeBuilder<Negotiation> builder)
    {
        builder.ToTable("Negotiations");
        builder.HasKey(n => n.NegotiationId);

        builder.Property(n => n.RoundNumber).IsRequired();
        builder.Property(n => n.ActorRole).HasConversion<string>().HasMaxLength(10).IsRequired();
        builder.Property(n => n.ProposedPrice).IsRequired().HasColumnType("numeric(15,2)");
        builder.Property(n => n.Message).HasMaxLength(1000);
        builder.Property(n => n.Action).HasConversion<string>().HasMaxLength(15).IsRequired();
        builder.Property(n => n.ResponseDeadline);
        builder.Property(n => n.CreatedAt).IsRequired();

        builder.HasOne(n => n.Offer)
            .WithMany(o => o.Negotiations)
            .HasForeignKey(n => n.OfferId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
