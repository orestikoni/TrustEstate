using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TrustEstate.Domain.Entities;

namespace TrustEstate.Infrastructure.Persistence.Configurations;

internal sealed class TransactionConfiguration : IEntityTypeConfiguration<Transaction>
{
    public void Configure(EntityTypeBuilder<Transaction> builder)
    {
        builder.ToTable("Transactions");
        builder.HasKey(t => t.TransactionId);

        builder.Property(t => t.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(t => t.ClosedAt);
        builder.Property(t => t.CreatedAt).IsRequired();

        builder.HasOne(t => t.Listing)
            .WithOne(l => l.Transaction)
            .HasForeignKey<Transaction>(t => t.ListingId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.Offer)
            .WithOne(o => o.Transaction)
            .HasForeignKey<Transaction>(t => t.OfferId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.Agent)
            .WithMany()
            .HasForeignKey(t => t.AgentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.Owner)
            .WithMany()
            .HasForeignKey(t => t.OwnerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.Buyer)
            .WithMany()
            .HasForeignKey(t => t.BuyerId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
