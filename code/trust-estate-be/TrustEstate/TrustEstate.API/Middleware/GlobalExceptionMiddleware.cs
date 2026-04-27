using System.Text.Json;
using TrustEstate.API.Controllers;
using TrustEstate.Domain.Exceptions;
using AuthenticationException = TrustEstate.Domain.Exceptions.AuthenticationException;
namespace TrustEstate.API.Middleware;

/// <summary>
/// Catches all unhandled exceptions and returns a JSON body that matches
/// the ApiError interface in src/types/index.ts:
///   { message: string; statusCode: number; errors?: Record&lt;string, string[]&gt; }
///
/// This is what ApiRequestError in api-client.ts parses on non-2xx responses.
/// </summary>
public sealed class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;
    private readonly IHostEnvironment _env;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public GlobalExceptionMiddleware(
        RequestDelegate next,
        ILogger<GlobalExceptionMiddleware> logger,
        IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        _logger.LogError(exception, "Unhandled exception on {Method} {Path}",
            context.Request.Method, context.Request.Path);

        var (statusCode, message) = exception switch
        {
            AuthenticationException => (StatusCodes.Status401Unauthorized, exception.Message),
            ForbiddenException => (StatusCodes.Status403Forbidden, exception.Message),
            NotFoundException => (StatusCodes.Status404NotFound, exception.Message),
            ConflictException => (StatusCodes.Status409Conflict, exception.Message),
            BusinessRuleException => (StatusCodes.Status400BadRequest, exception.Message),

            // Don't leak internals in production
            _ => (StatusCodes.Status500InternalServerError,
                  _env.IsDevelopment() ? exception.Message : "An unexpected error occurred.")
        };

        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";

        var body = new ApiErrorResponse(message, statusCode);
        await context.Response.WriteAsync(JsonSerializer.Serialize(body, JsonOptions));
    }
}