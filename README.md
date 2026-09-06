# TrustEstate

TrustEstate is a full-stack real estate management platform for coordinating property listings, offers, transactions, inspections, messages, notifications, and disputes. Role-based access supports the workflows of property owners, buyers, agents, inspectors, and administrators while keeping inspection and transaction information organized in one place.

## Project Overview

The repository contains two applications:

- **Frontend:** Next.js, React, TypeScript, and Tailwind CSS
- **Backend:** ASP.NET Core Web API on .NET 8, Entity Framework Core, PostgreSQL, and JWT authentication
- **Testing:** xUnit, Moq, and EF Core InMemory

The backend exposes the REST API consumed by the frontend. In development, Swagger provides an interactive API reference.

## Prerequisites

Install the following before starting:

- [Node.js](https://nodejs.org/) and npm
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [PostgreSQL](https://www.postgresql.org/download/)
- Git

## Repository Structure

```text
code/
├── trust-estate-be/TrustEstate/
│   ├── TrustEstate.API/            # HTTP API and Swagger
│   ├── TrustEstate.Application/    # Application contracts and DTOs
│   ├── TrustEstate.Domain/         # Domain entities, enums, and exceptions
│   ├── TrustEstate.Infrastructure/ # Persistence and services
│   └── TrustEstate.Tests/          # xUnit test suites
└── trust-estate-fe/                # Next.js web application
```

## Run Locally

### 1. Configure PostgreSQL and the API

Create a PostgreSQL database named `trustestate`, or use another database and update the connection string accordingly.

From the API project directory, set a development JWT key and database connection string. The API reads these values from `appsettings.Development.json` or environment variables:

```powershell
cd code/trust-estate-be/TrustEstate/TrustEstate.API
$env:ConnectionStrings__DefaultConnection = "Host=localhost;Port=5432;Database=trustestate;Username=postgres;Password=your_password"
$env:JWT__KEY = "replace-with-a-long-development-only-key"
```

For a persistent local setup, put equivalent values in an untracked local configuration file. Do not commit database passwords, JWT keys, or administrator credentials.

Apply the Entity Framework migrations if the database has not been initialized:

```powershell
cd code/trust-estate-be/TrustEstate
dotnet ef database update --project TrustEstate.Infrastructure --startup-project TrustEstate.API
```

Start the API:

```powershell
dotnet run --project TrustEstate.API --launch-profile http
```

The API is available at `http://localhost:5000` and Swagger is available at `http://localhost:5000/swagger`.

### 2. Start the frontend

In a second terminal:

```powershell
cd code/trust-estate-fe
npm install
$env:NEXT_PUBLIC_API_URL = "http://localhost:5000/api"
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in a browser. If `NEXT_PUBLIC_API_URL` is not set, the frontend uses `http://localhost:5000/api` by default.

## Useful Commands

### Frontend

Run these commands from `code/trust-estate-fe`:

```powershell
npm run dev       # Start the development server
npm run build     # Create a production build
npm run start     # Serve the production build
npm run lint      # Run ESLint
```

### Backend

Run these commands from `code/trust-estate-be/TrustEstate`:

```powershell
dotnet build TrustEstate.sln
dotnet test TrustEstate.sln
```

To run only the test project:

```powershell
dotnet test TrustEstate.Tests/TrustEstate.Tests.csproj
```

## Configuration Reference

| Setting | Purpose | Development default |
| --- | --- | --- |
| `ConnectionStrings__DefaultConnection` | PostgreSQL connection string | `Host=localhost;Port=5432;Database=trustestate` |
| `JWT__KEY` | Signing key for access tokens | Set locally; never commit it |
| `NEXT_PUBLIC_API_URL` | Frontend API base URL | `http://localhost:5000/api` |
| `Frontend:BaseUrl` | Allowed frontend URL used by the API configuration | `http://localhost:3000` |

The API seeds development data when it starts. Configure any seed administrator credentials locally through the corresponding `AdminSeed` settings before relying on them.

## Testing

The backend test project contains suites for authentication, administration, disputes, favorites, inspections, listings, messages, notifications, offers, and transactions. Run the full suite with `dotnet test TrustEstate.sln` before submitting changes.

## Contributors

- Oresti Koni
- Kamila Mersinllari
- Lorenca Dardha
- Megi Mema
- Kristina Karaj
- Aldorisa Ruda
- Xhenifer Frroku
