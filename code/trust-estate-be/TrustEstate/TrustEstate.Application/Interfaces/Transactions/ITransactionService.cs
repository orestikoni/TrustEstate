using TrustEstate.Application.DTOs.Transactions;

namespace TrustEstate.Application.Interfaces.Transactions;

public interface ITransactionService
{
    Task<TransactionStatusDto> GetTransactionStatusAsync(int agentId, int listingId, CancellationToken ct = default);
    Task<TransactionDto> CloseTransactionAsync(int agentId, int listingId, CancellationToken ct = default);
    Task<TransactionDto?> GetTransactionByListingAsync(int listingId, CancellationToken ct = default);
}
