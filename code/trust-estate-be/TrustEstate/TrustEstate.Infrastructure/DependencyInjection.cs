using Microsoft.Extensions.DependencyInjection;
using TrustEstate.Application.Interfaces.Auth;
using TrustEstate.Infrastructure.Services;

namespace TrustEstate.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IJwtService, JwtService>();
        return services;
    }
}
