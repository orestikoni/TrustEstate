using Microsoft.Extensions.DependencyInjection;
using TrustEstate.Application.Interfaces.Admin;
using TrustEstate.Application.Interfaces.Auth;
using TrustEstate.Application.Interfaces.Disputes;
using TrustEstate.Application.Interfaces.Inspections;
using TrustEstate.Application.Interfaces.Listings;
using TrustEstate.Application.Interfaces.Messages;
using TrustEstate.Application.Interfaces.Notifications;
using TrustEstate.Application.Interfaces.Offers;
using TrustEstate.Application.Interfaces.Transactions;
using TrustEstate.Infrastructure.Persistence.Repositories;
using TrustEstate.Infrastructure.Services;

namespace TrustEstate.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services)
    {
        // Auth
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IJwtService, JwtService>();

        // Listings
        services.AddScoped<IListingRepository, ListingRepository>();
        services.AddScoped<IListingService, ListingService>();
        services.AddScoped<IFavoriteListingRepository, FavoriteListingRepository>();
        services.AddScoped<IFavoriteListingService, FavoriteListingService>();

        // Offers
        services.AddScoped<IOfferRepository, OfferRepository>();
        services.AddScoped<IOfferService, OfferService>();

        // Inspections
        services.AddScoped<IInspectionRepository, InspectionRepository>();
        services.AddScoped<IInspectionService, InspectionService>();

        // Transactions
        services.AddScoped<ITransactionRepository, TransactionRepository>();
        services.AddScoped<ITransactionService, TransactionService>();

        // Disputes
        services.AddScoped<IDisputeRepository, DisputeRepository>();
        services.AddScoped<IDisputeService, DisputeService>();

        // Notifications
        services.AddScoped<INotificationRepository, NotificationRepository>();
        services.AddScoped<INotificationService, NotificationService>();

        // Messages
        services.AddScoped<IMessageRepository, MessageRepository>();
        services.AddScoped<IMessageService, MessageService>();

        // Admin
        services.AddScoped<IAdminService, AdminService>();

        return services;
    }
}