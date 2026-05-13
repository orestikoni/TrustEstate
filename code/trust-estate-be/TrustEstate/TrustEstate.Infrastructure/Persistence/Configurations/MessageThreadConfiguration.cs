using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TrustEstate.Domain.Entities;

namespace TrustEstate.Infrastructure.Persistence.Configurations;

internal sealed class MessageThreadConfiguration : IEntityTypeConfiguration<MessageThread>
{
    public void Configure(EntityTypeBuilder<MessageThread> builder)
    {
        builder.ToTable("MessageThreads");
        builder.HasKey(t => t.ThreadId);

        builder.Property(t => t.CreatedAt).IsRequired();

        builder.HasOne(t => t.Listing)
            .WithMany(l => l.MessageThreads)
            .HasForeignKey(t => t.ListingId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.ParticipantOne)
            .WithMany()
            .HasForeignKey(t => t.ParticipantOneId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.ParticipantTwo)
            .WithMany()
            .HasForeignKey(t => t.ParticipantTwoId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
