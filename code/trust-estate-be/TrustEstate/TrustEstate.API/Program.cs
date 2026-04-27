using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using TrustEstate.API.Middleware;
using TrustEstate.Application.Interfaces.Auth;
using TrustEstate.Application.Interfaces.Services;
using TrustEstate.Infrastructure.Identity;
using TrustEstate.Infrastructure.Persistence;
using TrustEstate.Infrastructure.Persistence.Repositories;
using TrustEstate.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

// Configuration
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var authSettings = builder.Configuration.GetSection("AuthSettings");
var emailSettings = builder.Configuration.GetSection("EmailSettings");

builder.Services.Configure<JwtSettings>(jwtSettings);
builder.Services.Configure<AuthSettings>(authSettings);
builder.Services.Configure<EmailSettings>(emailSettings);

// Database (PostgreSQL — already configured)
builder.Services.AddDbContext<TrustEstateDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// JWT Authentication
builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSettings["SecretKey"]!)),
            ValidateIssuer = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidateAudience = true,
            ValidAudience = jwtSettings["Audience"],
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero,   // No grace period — access tokens expire exactly on time
        };

        // Return 401 JSON (not HTML redirect) so api-client.ts can detect it
        options.Events = new JwtBearerEvents
        {
            OnChallenge = async context =>
            {
                context.HandleResponse();
                context.Response.StatusCode = 401;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync(
                    """{"message":"Authentication required.","statusCode":401}""");
            },
        };
    });

builder.Services.AddAuthorization();

// CORS — allow the Next.js frontend 
builder.Services.AddCors(options =>
{
    options.AddPolicy("TrustEstateFrontend", policy =>
    {
        var allowedOrigins = builder.Configuration
            .GetSection("AllowedOrigins")
            .Get<string[]>() ?? ["http://localhost:3000"];

        policy
            .WithOrigins(allowedOrigins)
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

// Application Services (DI registrations)
//
// Repositories
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<ITokenRepository, TokenRepository>();
builder.Services.AddScoped<ILoginAttemptRepository, LoginAttemptRepository>();

// Identity / JWT
builder.Services.AddScoped<IJwtService, JwtService>();

// Business logic
builder.Services.AddScoped<IAuthService, AuthService>();

// Email
builder.Services.AddScoped<IEmailService, EmailService>();

// Controllers + Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "TrustEstate API", Version = "v1" });

    // Add JWT bearer input to Swagger UI
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter your JWT access token.",
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// Build
var app = builder.Build();

// Pipeline 

// Must be first — catches all exceptions and returns ApiError JSON
app.UseMiddleware<GlobalExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("TrustEstateFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Auto-migrate on startup
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<TrustEstateDbContext>();
    await db.Database.MigrateAsync();
}

app.Run();