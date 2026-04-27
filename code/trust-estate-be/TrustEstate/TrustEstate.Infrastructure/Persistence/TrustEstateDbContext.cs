using Microsoft.EntityFrameworkCore;

namespace TrustEstate.Infrastructure.Persistence
{
    public class TrustEstateDbContext : DbContext
    {
        public TrustEstateDbContext(DbContextOptions<TrustEstateDbContext> options)
            : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.ApplyConfigurationsFromAssembly(typeof(TrustEstateDbContext).Assembly);
        }
    }
}