using System.Text;
using Amazon.Extensions.NETCore.Setup;
using Amazon.SimpleSystemsManagement;
using Filamorfosis.Domain.Entities;
using Filamorfosis.Infrastructure.Data;
using Filamorfosis.API.Services;
using Filamorfosis.Application.Services;
using Filamorfosis.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// ── AWS Secrets Manager configuration provider ────────────────────────────────
// In Production (and Staging), load secrets from AWS Secrets Manager so that
// no real credentials ever appear in source code or committed config files.
// The path prefix (e.g. "/filamorfosis/prod/") is read from the environment
// variable AWS_SECRETS_PATH; if absent (local dev / CI) this block is skipped.
// Secrets Manager secret names must match the ASP.NET Core config key hierarchy,
// e.g. "/filamorfosis/prod/Jwt__Key" maps to configuration key "Jwt:Key".
// Requirements: 14.5
var secretsPath = Environment.GetEnvironmentVariable("AWS_SECRETS_PATH");
if (!string.IsNullOrEmpty(secretsPath))
{
    builder.Configuration.AddSystemsManager(secretsPath, TimeSpan.FromMinutes(5));
}
// ─────────────────────────────────────────────────────────────────────────────

// Configure Serilog only outside of the Testing environment to avoid
// "The logger is already frozen" when multiple WebApplicationFactory instances
// are created in the same test process.
// NOTE: We check the ASPNETCORE_ENVIRONMENT env var directly here because
// WebApplicationFactory's ConfigureWebHost (which calls UseEnvironment("Testing"))
// runs AFTER Program.cs's builder phase, so builder.Environment.IsEnvironment()
// would return false on the first check.
var aspnetEnv = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? builder.Environment.EnvironmentName;
if (!string.Equals(aspnetEnv, "Testing", StringComparison.OrdinalIgnoreCase))
{
    builder.Host.UseSerilog((ctx, lc) => lc
        .ReadFrom.Configuration(ctx.Configuration)
        .WriteTo.Console());
}

builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.PropertyNamingPolicy =
        System.Text.Json.JsonNamingPolicy.CamelCase);

// Database
var sqlitePath = Environment.GetEnvironmentVariable("SQLITE_DB_PATH");
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

if (string.IsNullOrEmpty(sqlitePath) && (string.IsNullOrEmpty(connectionString) || connectionString == "InMemory"))
{
    builder.Services.AddDbContext<FilamorfosisDbContext>(o =>
        o.UseInMemoryDatabase("FilamorfosisDb")
         .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning)));
}
else
{
    var dbPath = sqlitePath ?? connectionString ?? "filamorfosis.db";
    builder.Services.AddDbContext<FilamorfosisDbContext>(o =>
        o.UseSqlite($"Data Source={dbPath}")
         .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning)));
}

// Identity (registers UserManager, SignInManager, RoleManager, etc.)
builder.Services.AddIdentity<User, IdentityRole<Guid>>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequireUppercase = true;
    options.Password.RequiredLength = 8;
    options.Password.RequireNonAlphanumeric = false;
})
.AddEntityFrameworkStores<FilamorfosisDbContext>()
.AddDefaultTokenProviders();

// JWT Authentication — override the default scheme set by AddIdentity so that
// API endpoints use JWT Bearer rather than Identity's cookie scheme.
var jwtKey = builder.Configuration["Jwt:Key"] ?? "PLACEHOLDER_CHANGE_ME_32_CHARS_MIN";
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = ctx =>
        {
            if (ctx.Request.Cookies.TryGetValue("access_token", out var token))
                ctx.Token = token;
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// CORS
var frontendOrigin = builder.Configuration["FrontendOrigin"] ?? "https://filamorfosis.com";
var allowedOrigins = new[] { frontendOrigin, "http://localhost:8000", "http://127.0.0.1:8000", "http://localhost:5500", "http://127.0.0.1:5500" };
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowCredentials()
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());
});

// Rate limiting
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("login", o =>
    {
        o.PermitLimit = 10;
        o.Window = TimeSpan.FromMinutes(1);
        o.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        o.QueueLimit = 0;
    });
    options.AddFixedWindowLimiter("mfa-verify", o =>
    {
        o.PermitLimit = 5;
        o.Window = TimeSpan.FromMinutes(1);
        o.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        o.QueueLimit = 0;
    });
    options.RejectionStatusCode = 429;
});

// HSTS — 1 year max-age, include subdomains
builder.Services.AddHsts(options =>
{
    options.MaxAge = TimeSpan.FromSeconds(31536000); // 1 year
    options.IncludeSubDomains = true;
});

// Cookie policy — relax Secure requirement in Testing so integration tests work over HTTP
builder.Services.Configure<Microsoft.AspNetCore.Builder.CookiePolicyOptions>(options =>
{
    options.HttpOnly = Microsoft.AspNetCore.CookiePolicy.HttpOnlyPolicy.Always;
    options.Secure = builder.Environment.IsEnvironment("Testing")
        ? Microsoft.AspNetCore.Http.CookieSecurePolicy.None
        : Microsoft.AspNetCore.Http.CookieSecurePolicy.Always;
    options.MinimumSameSitePolicy = builder.Environment.IsEnvironment("Testing")
        ? Microsoft.AspNetCore.Http.SameSiteMode.None
        : Microsoft.AspNetCore.Http.SameSiteMode.Strict;
});

// Application services
builder.Services.AddScoped<JwtService>();
builder.Services.AddScoped<IPricingCalculatorService, PricingCalculatorService>();
builder.Services.AddScoped<IStockService, StockService>();
builder.Services.AddScoped<IEmailService, NoOpEmailService>();
builder.Services.AddScoped<IS3Service, NoOpS3Service>();
builder.Services.AddScoped<IMercadoPagoService, NoOpMercadoPagoService>();
builder.Services.AddScoped<ITotpService, OtpNetTotpService>();
builder.Services.AddScoped<ISlugGenerationService, SlugGenerationService>();
builder.Services.AddScoped<CategorySeedService>();

builder.Services.AddProblemDetails();
builder.Services.AddOpenApi();

var app = builder.Build();

if (!string.Equals(aspnetEnv, "Testing", StringComparison.OrdinalIgnoreCase))
    app.UseSerilogRequestLogging();

if (app.Environment.IsDevelopment() || app.Environment.IsEnvironment("Testing"))
{
    app.MapOpenApi();
}

app.UseExceptionHandler();
app.UseStatusCodePages();

// HSTS — skipped in Development and Testing (ASP.NET Core default behaviour)
if (!app.Environment.IsDevelopment() && !app.Environment.IsEnvironment("Testing"))
    app.UseHsts();

// Skip HTTPS redirect in Testing to avoid 307 responses in integration tests
if (!app.Environment.IsEnvironment("Testing"))
    app.UseHttpsRedirection();
app.UseCors("FrontendPolicy");
app.UseCookiePolicy();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

// Guest cart session middleware
app.UseMiddleware<Filamorfosis.API.Middleware.GuestCartMiddleware>();

// CSRF middleware: validate X-Requested-With header on state-changing requests
app.Use(async (context, next) =>
{
    var method = context.Request.Method;
    if ((method == HttpMethods.Post || method == HttpMethods.Put || method == HttpMethods.Delete)
        && !context.Request.Path.StartsWithSegments("/api/v1/payments/webhook"))
    {
        if (!context.Request.Headers.TryGetValue("X-Requested-With", out var xrw)
            || xrw != "XMLHttpRequest")
        {
            context.Response.StatusCode = 400;
            await context.Response.WriteAsJsonAsync(new
            {
                type = "https://filamorfosis.com/errors/csrf-validation-failed",
                title = "CSRF Validation Failed",
                status = 400,
                detail = "State-changing requests must include X-Requested-With: XMLHttpRequest header."
            });
            return;
        }
    }
    await next();
});

app.MapControllers();

// Seed database on startup (dev/testing only)
if (app.Environment.IsDevelopment() || app.Environment.IsEnvironment("Testing"))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<FilamorfosisDbContext>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
    await DbSeeder.SeedAsync(db, userManager, roleManager);
    
    // Seed product categories
    var categorySeedService = scope.ServiceProvider.GetRequiredService<CategorySeedService>();
    await categorySeedService.SeedCategoriesAsync();
}

app.Run();

public partial class Program { }
