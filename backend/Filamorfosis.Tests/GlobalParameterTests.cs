// Feature: cost-management-and-pricing, Property 8: For any t in [0,1], after updating tax_rate to t, ComputePriceAsync(b, p) returns (b + p) * (1 + t)

using Filamorfosis.Domain.Entities;
using Filamorfosis.Infrastructure.Data;
using Filamorfosis.Infrastructure.Services;
using FsCheck;
using FsCheck.Fluent;
using Microsoft.EntityFrameworkCore;

namespace Filamorfosis.Tests;

/// <summary>
/// Property-based tests for GlobalParameter tax_rate propagation to PricingCalculatorService.
/// Covers Property 8 from the cost-management-and-pricing spec.
/// Validates: Requirements 7.8, 7.9
/// </summary>
public class GlobalParameterTests
{
    // ── Helpers ───────────────────────────────────────────────────────────────

    private static FilamorfosisDbContext CreateInMemoryDb(string dbName)
    {
        var options = new DbContextOptionsBuilder<FilamorfosisDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
        return new FilamorfosisDbContext(options);
    }

    private static PricingCalculatorService CreateService(FilamorfosisDbContext db)
        => new(db);

    // ── Generators ────────────────────────────────────────────────────────────

    // Non-negative decimal in [0, 100.00] — used for BaseCost / Profit
    private static Gen<decimal> NonNegativeCostGen =>
        Gen.Choose(0, 10000).Select(i => (decimal)i / 100m);

    // Tax rate in [0.00, 1.00] — generated as integer 0..100 then divided by 100
    private static Gen<decimal> TaxRateGen =>
        Gen.Choose(0, 100).Select(i => (decimal)i / 100m);

    // ── Property 8: TaxRate update propagates to price computation ────────────
    // Feature: cost-management-and-pricing, Property 8: For any t in [0,1], after updating tax_rate to t, ComputePriceAsync(b, p) returns (b + p) * (1 + t)
    // Validates: Requirements 7.8, 7.9
    [Fact]
    public void Property8_TaxRateUpdatePropagates_ToPriceComputation()
    {
        var gen =
            from b in NonNegativeCostGen
            from p in NonNegativeCostGen
            from t in TaxRateGen
            select (b, p, t);

        Prop.ForAll(Arb.From(gen), async tuple =>
        {
            var (b, p, t) = tuple;

            // Each iteration gets its own isolated in-memory DB
            var dbName = $"Property8_{Guid.NewGuid():N}";
            await using var db = CreateInMemoryDb(dbName);

            // Seed the tax_rate GlobalParameter with value t
            db.GlobalParameters.Add(new GlobalParameter
            {
                Id = Guid.NewGuid(),
                Key = "tax_rate",
                Label = "IVA (%)",
                Value = t.ToString(System.Globalization.CultureInfo.InvariantCulture),
                UpdatedAt = DateTime.UtcNow
            });
            await db.SaveChangesAsync();

            var svc = CreateService(db);

            var actual = await svc.ComputePriceAsync(b, p);
            var expected = (b + p) * (1 + t);

            return actual == expected;
        })
        .QuickCheckThrowOnFailure();
    }
}
