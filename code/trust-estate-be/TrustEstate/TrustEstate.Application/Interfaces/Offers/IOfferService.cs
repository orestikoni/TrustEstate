using TrustEstate.Application.DTOs.Offers;

namespace TrustEstate.Application.Interfaces.Offers;

public interface IOfferService
{
    Task<OfferDto> SubmitOfferAsync(int buyerId, SubmitOfferRequest request, CancellationToken ct = default);
    Task<OfferDto> AcceptOfferAsync(int agentId, int offerId, CancellationToken ct = default);
    Task<OfferDto> DeclineOfferAsync(int agentId, int offerId, CancellationToken ct = default);
    Task<OfferDto> CounterOfferAsync(int agentId, int offerId, CounterOfferRequest request, CancellationToken ct = default);
    Task<OfferDto> AcceptCounterOfferAsync(int buyerId, int offerId, CancellationToken ct = default);
    Task<OfferDto> DeclineCounterOfferAsync(int buyerId, int offerId, CancellationToken ct = default);
    Task<OfferDto> SubmitRevisedOfferAsync(int buyerId, int offerId, SubmitRevisedOfferRequest request, CancellationToken ct = default);
    Task WithdrawOfferAsync(int buyerId, int offerId, CancellationToken ct = default);
    Task<IEnumerable<OfferDto>> GetOffersByListingAsync(int agentId, int listingId, CancellationToken ct = default);
    Task<IEnumerable<OfferDto>> GetOffersByListingForOwnerAsync(int ownerId, int listingId, CancellationToken ct = default);
    Task<IEnumerable<OfferDto>> GetBuyerOffersAsync(int buyerId, CancellationToken ct = default);
    Task<OfferDto> GetOfferByIdAsync(int offerId, int userId, CancellationToken ct = default);
    Task<PostInspectionOptionsDto> GetPostInspectionOptionsAsync(int buyerId, int offerId, CancellationToken ct = default);
    Task WithdrawOfferAfterInspectionAsync(int buyerId, int offerId, CancellationToken ct = default);
    Task<OfferDto> SubmitRevisedOfferAfterInspectionAsync(int buyerId, int offerId, RevisedOfferAfterInspectionRequest request, CancellationToken ct = default);
}
