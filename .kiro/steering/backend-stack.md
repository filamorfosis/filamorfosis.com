# Filamorfosis — Backend Stack & Infrastructure

## Backend Technology

- **Language**: C# (.NET 8)
- **Framework**: ASP.NET Core 8 Web API (minimal API or controller-based)
- **Architecture**: RESTful API, clean architecture (Domain / Application / Infrastructure / API layers)
- **ORM**: Entity Framework Core 8
- **Database**: PostgreSQL (preferred) or SQL Server on AWS RDS
- **Authentication**: ASP.NET Core Identity + JWT Bearer tokens
- **Validation**: FluentValidation
- **Mapping**: AutoMapper or manual mapping (no magic)

## Payment Gateway

- **Provider**: MercadoPago (Mexico)
- **SDK**: MercadoPago .NET SDK (`mercadopago-sdk-dotnet`)
- **Integration pattern**: Preference-based checkout (server creates preference, client redirects to MP checkout)
- **Webhook**: MP sends payment notifications to `/api/payments/webhook`
- **Currencies**: MXN (Mexican Peso)
- **Supported methods**: Credit/debit cards, OXXO, bank transfer, digital wallets (via MP)

## AWS Hosting

- **Compute**: AWS Elastic Beanstalk or ECS Fargate (containerized .NET 8)
- **Database**: AWS RDS (PostgreSQL)
- **File Storage**: AWS S3 (product images, user-uploaded design files)
- **CDN**: AWS CloudFront (static assets + S3 images)
- **Secrets**: AWS Secrets Manager (connection strings, MP credentials, JWT secret)
- **Email**: AWS SES (order confirmations, password reset)
- **Region**: mx-central-1 or us-east-1 (closest to Mexico)

## API Design Conventions

- Base path: `/api/v1/`
- JSON responses: camelCase
- Error responses: RFC 7807 Problem Details format
- Pagination: cursor-based or offset with `page` + `pageSize` query params
- Auth header: `Authorization: Bearer <token>`
- CORS: allow frontend origin only

## Code Standards

- Follow Microsoft C# coding conventions
- Use `async/await` throughout — no blocking calls
- Repository pattern for data access
- Unit tests with xUnit + Moq
- Integration tests with WebApplicationFactory
- All secrets via environment variables / AWS Secrets Manager — never hardcoded
- Use `ILogger<T>` for structured logging (Serilog recommended)

## Frontend ↔ Backend Integration

- Frontend (vanilla JS) calls the .NET API via `fetch()`
- API base URL stored in a JS config constant (swappable per environment)
- JWT stored in `localStorage` (or `httpOnly` cookie — prefer cookie for security)
- Cart state: persisted server-side for authenticated users, `localStorage` for guests
- Guest cart merges into user cart on login
