using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Filamorfosis.Infrastructure.Data;

/// <summary>
/// Used by EF Core CLI tools (dotnet ef migrations) at design time.
/// </summary>
public class FilamorfosisDbContextFactory : IDesignTimeDbContextFactory<FilamorfosisDbContext>
{
    public FilamorfosisDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<FilamorfosisDbContext>();
        optionsBuilder.UseSqlite("Data Source=filamorfosis_design.db")
            .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
        return new FilamorfosisDbContext(optionsBuilder.Options);
    }
}
