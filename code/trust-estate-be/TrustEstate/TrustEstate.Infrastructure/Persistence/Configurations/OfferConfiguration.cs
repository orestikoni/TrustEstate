using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TrustEstate.Domain.Entities;

namespace TrustEstate.Infrastructure.Persistence.Configurations;

internal sealed class OfferConfiguration : IEntityTypeConfiguration<Offer>
{
    public void Configure(EntityTypeBuilder<Offer> builder)
    {
        builder.ToTable("Offers");
        builder.HasKey(o => o.OfferId);

        builder.Property(o => o.ProposedPrice).IsRequired().HasColumnType("numeric(15,2)");
        builder.Property(o => o.Message).HasMaxLength(1000);
        builder.Property(o => o.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(o => o.NegotiationRound).IsRequired();
        builder.Property(o => o.SubmittedAt).IsRequired();
        builder.Property(o => o.ResponseDeadline);
        builder.Property(o => o.ResolvedAt);

        builder.HasOne(o => o.Listing)
            .WithMany(l => l.Offers)
            .HasForeignKey(o => o.ListingId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(o => o.Buyer)
            .WithMany(u => u.OffersAsBuyer)
            .HasForeignKey(o => o.BuyerId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
