using Microsoft.Extensions.DependencyInjection;
using TrustEstate.Application.Interfaces.Auth;
using TrustEstate.Application.Interfaces.Listings;
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

        return services;
    }
}