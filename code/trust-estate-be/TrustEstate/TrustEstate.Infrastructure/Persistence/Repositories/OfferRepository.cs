using Microsoft.EntityFrameworkCore;
using TrustEstate.Application.Interfaces.Offers;
using TrustEstate.Domain.Entities;
using TrustEstate.Domain.Enums;

namespace TrustEstate.Infrastructure.Persistence.Repositories;

public sealed class OfferRepository : IOfferRepository
{
    private readonly TrustEstateDbContext _db;

    public OfferRepository(TrustEstateDbContext db) => _db = db;

    public Task<Offer?> GetByIdAsync(int offerId, CancellationToken ct = default)
        => _db.Offers.Include(o => o.Buyer).FirstOrDefaultAsync(o => o.OfferId == offerId, ct);

    public Task<Offer?> GetByIdWithDetailsAsync(int offerId, CancellationToken ct = default)
        => _db.Offers
            .Include(o => o.Buyer)
            .Include(o => o.Listing)
            .Include(o => o.Negotiations.OrderBy(n => n.CreatedAt))
            .FirstOrDefaultAsync(o => o.OfferId == offerId, ct);

    public async Task<IEnumerable<Offer>> GetByListingIdAsync(int listingId, CancellationToken ct = default)
        => await _db.Offers
            .Include(o => o.Buyer)
            .Include(o => o.Negotiations.OrderBy(n => n.CreatedAt))
            .Where(o => o.ListingId == listingId)
            .OrderByDescending(o => o.SubmittedAt)
            .ToListAsync(ct);

    public async Task<IEnumerable<Offer>> GetByBuyerIdAsync(int buyerId, CancellationToken ct = default)
        => await _db.Offers
            .Include(o => o.Buyer)
            .Include(o => o.Listing)
            .Include(o => o.Negotiations.OrderBy(n => n.CreatedAt))
            .Where(o => o.BuyerId == buyerId)
            .OrderByDescending(o => o.SubmittedAt)
            .ToListAsync(ct);

    public Task<bool> HasActiveOfferAsync(int listingId, int buyerId, CancellationToken ct = default)
        => _db.Offers.AnyAsync(o =>
            o.ListingId == listingId &&
            o.BuyerId == buyerId &&
            o.Status != OfferStatus.Withdrawn &&
            o.Status != OfferStatus.Declined &&
            o.Status != OfferStatus.Expired, ct);

    public Task<Offer?> GetAcceptedOfferForListingAsync(int listingId, CancellationToken ct = default)
        => _db.Offers
            .Include(o => o.Buyer)
            .FirstOrDefaultAsync(o => o.ListingId == listingId && o.Status == OfferStatus.Accepted, ct);

    public async Task AddAsync(Offer offer, CancellationToken ct = default)
        => await _db.Offers.AddAsync(offer, ct);

    public void Update(Offer offer)
        => _db.Offers.Update(offer);

    public async Task AddNegotiationAsync(Negotiation negotiation, CancellationToken ct = default)
        => await _db.Negotiations.AddAsync(negotiation, ct);

    public Task SaveChangesAsync(CancellationToken ct = default)
        => _db.SaveChangesAsync(ct);
}
