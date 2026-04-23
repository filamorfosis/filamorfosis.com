using Filamorfosis.Infrastructure.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Filamorfosis.Tests.Infrastructure;

/// <summary>
/// WebApplicationFactory base that replaces the real DbContext with a
/// fresh in-memory database for each test instance.
/// </summary>
public class FilamorfosisWebFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName = Guid.NewGuid().ToString();

    // Set ASPNETCORE_ENVIRONMENT before the host is built so that Program.cs
    // sees "Testing" during WebApplication.CreateBuilder and skips Serilog setup.
    // This prevents "The logger is already frozen" when multiple factory instances
    // are created in the same test process.
    static FilamorfosisWebFactory()
    {
        Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Testing");
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureServices(services =>
        {
            // Remove any existing DbContext registration
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<FilamorfosisDbContext>));
            if (descriptor is not null)
                services.Remove(descriptor);

            // Register a fresh in-memory database per factory instance
            services.AddDbContext<FilamorfosisDbContext>(options =>
                options.UseInMemoryDatabase(_dbName));
        });

        builder.ConfigureLogging(logging =>
        {
            logging.ClearProviders();
            logging.AddConsole();
        });
    }

    /// <summary>
    /// Seeds data into the test database using a scoped service scope.
    /// The caller is responsible for calling <c>db.SaveChangesAsync()</c> inside
    /// the seed delegate; this method does NOT call it a second time.
    /// </summary>
    public async Task SeedAsync(Func<FilamorfosisDbContext, Task> seed)
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<FilamorfosisDbContext>();
        await seed(db);
        // Note: callers must call db.SaveChangesAsync() inside the delegate.
        // We do NOT call it here to avoid double-save errors.
    }
}
