using TrustEstate.Domain.Entities;
using TrustEstate.Domain.Enums;

namespace TrustEstate.Application.Interfaces.Offers;

public interface IOfferRepository
{
    Task<Offer?> GetByIdAsync(int offerId, CancellationToken ct = default);
    Task<Offer?> GetByIdWithDetailsAsync(int offerId, CancellationToken ct = default);
    Task<IEnumerable<Offer>> GetByListingIdAsync(int listingId, CancellationToken ct = default);
    Task<IEnumerable<Offer>> GetByBuyerIdAsync(int buyerId, CancellationToken ct = default);
    Task<bool> HasActiveOfferAsync(int listingId, int buyerId, CancellationToken ct = default);
    Task<Offer?> GetAcceptedOfferForListingAsync(int listingId, CancellationToken ct = default);
    Task AddAsync(Offer offer, CancellationToken ct = default);
    void Update(Offer offer);
    Task AddNegotiationAsync(Negotiation negotiation, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
