// Requirements: 4.1, 4.2, 4.3, 4.4, 4.5

using Filamorfosis.Application.Services.Requests;
using Filamorfosis.Infrastructure.Data;
using Filamorfosis.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace Filamorfosis.Tests;

public class PricingCalculatorServiceTests
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

    private static IReadOnlyDictionary<string, decimal> Params(params (string key, decimal value)[] entries)
        => entries.ToDictionary(e => e.key, e => e.value);

    // ── ComputeBaseCostAsync tests ────────────────────────────────────────────

    // Test 1: MaterialBaseCost + supply usages + electric cost
    // BaseCost = 10 + (50 × 0.5) + (60/60 × 2) = 10 + 25 + 2 = 37
    [Fact]
    public async Task ComputeBaseCostAsync_WithSupplyUsagesAndElectric_ReturnsCorrectValue()
    {
        var db = CreateInMemoryDb(nameof(ComputeBaseCostAsync_WithSupplyUsagesAndElectric_ReturnsCorrectValue));
        var svc = CreateService(db);

        var request = new ComputeBaseCostRequest(
            MaterialBaseCost: 10m,
            ManufactureTimeMinutes: 60,
            SupplyUsages: new Dictionary<string, decimal> { ["ink_cost_per_cm2"] = 50m },
            CostParams: Params(
                ("ink_cost_per_cm2", 0.5m),
                ("electric_cost_per_hour", 2m)
            )
        );

        var result = await svc.ComputeBaseCostAsync(request);

        Assert.Equal(37m, result);
    }

    // Test 2: No supply usages, only electric cost
    // BaseCost = 8 + (30/60 × 4) = 8 + 2 = 10
    [Fact]
    public async Task ComputeBaseCostAsync_NoSupplyUsages_OnlyElectric_ReturnsCorrectValue()
    {
        var db = CreateInMemoryDb(nameof(ComputeBaseCostAsync_NoSupplyUsages_OnlyElectric_ReturnsCorrectValue));
        var svc = CreateService(db);

        var request = new ComputeBaseCostRequest(
            MaterialBaseCost: 8m,
            ManufactureTimeMinutes: 30,
            SupplyUsages: new Dictionary<string, decimal>(),
            CostParams: Params(("electric_cost_per_hour", 4m))
        );

        var result = await svc.ComputeBaseCostAsync(request);

        Assert.Equal(10m, result);
    }

    // Test 3: Multiple supply usages
    // BaseCost = 5 + (100 × 0.3) + (10 × 0.05) + (120/60 × 2) = 5 + 30 + 0.5 + 4 = 39.5
    [Fact]
    public async Task ComputeBaseCostAsync_MultipleSupplyUsages_ReturnsCorrectValue()
    {
        var db = CreateInMemoryDb(nameof(ComputeBaseCostAsync_MultipleSupplyUsages_ReturnsCorrectValue));
        var svc = CreateService(db);

        var request = new ComputeBaseCostRequest(
            MaterialBaseCost: 5m,
            ManufactureTimeMinutes: 120,
            SupplyUsages: new Dictionary<string, decimal>
            {
                ["filament_cost_per_gram"] = 100m,
                ["ink_cost_per_cm2"] = 10m
            },
            CostParams: Params(
                ("filament_cost_per_gram", 0.3m),
                ("ink_cost_per_cm2", 0.05m),
                ("electric_cost_per_hour", 2m)
            )
        );

        var result = await svc.ComputeBaseCostAsync(request);

        Assert.Equal(39.5m, result);
    }

    // Test 4: Zero manufacture time → no electric cost
    [Fact]
    public async Task ComputeBaseCostAsync_ZeroManufactureTime_NoElectricCostAdded()
    {
        var db = CreateInMemoryDb(nameof(ComputeBaseCostAsync_ZeroManufactureTime_NoElectricCostAdded));
        var svc = CreateService(db);

        var request = new ComputeBaseCostRequest(
            MaterialBaseCost: 8m,
            ManufactureTimeMinutes: 0,
            SupplyUsages: new Dictionary<string, decimal>(),
            CostParams: Params(("electric_cost_per_hour", 10m))
        );

        var result = await svc.ComputeBaseCostAsync(request);

        Assert.Equal(8m, result); // no electric cost added
    }

    // Test 5: Zero supply quantity → no supply cost
    [Fact]
    public async Task ComputeBaseCostAsync_ZeroSupplyQuantity_NoSupplyCostAdded()
    {
        var db = CreateInMemoryDb(nameof(ComputeBaseCostAsync_ZeroSupplyQuantity_NoSupplyCostAdded));
        var svc = CreateService(db);

        var request = new ComputeBaseCostRequest(
            MaterialBaseCost: 5m,
            ManufactureTimeMinutes: 0,
            SupplyUsages: new Dictionary<string, decimal> { ["ink_cost_per_cm2"] = 0m },
            CostParams: Params(
                ("ink_cost_per_cm2", 0.3m),
                ("electric_cost_per_hour", 2m)
            )
        );

        var result = await svc.ComputeBaseCostAsync(request);

        Assert.Equal(5m, result); // only MaterialBaseCost
    }

    // ── ComputeVariantBaseCost tests ──────────────────────────────────────────

    // Test 6: Variant base cost = Σ(materialBaseCost × quantity) + electric
    [Fact]
    public void ComputeVariantBaseCost_WithMaterialsAndElectric_ReturnsCorrectValue()
    {
        var db = CreateInMemoryDb(nameof(ComputeVariantBaseCost_WithMaterialsAndElectric_ReturnsCorrectValue));
        var svc = CreateService(db);

        var usages = new[] { (materialBaseCost: 10m, quantity: 2m), (materialBaseCost: 5m, quantity: 3m) };
        var result = svc.ComputeVariantBaseCost(usages, 60, 4m);

        // 10×2 + 5×3 + (60/60 × 4) = 20 + 15 + 4 = 39
        Assert.Equal(39m, result);
    }

    // Test 7: Empty material usages, no manufacture time → 0
    [Fact]
    public void ComputeVariantBaseCost_EmptyUsagesNoTime_ReturnsZero()
    {
        var db = CreateInMemoryDb(nameof(ComputeVariantBaseCost_EmptyUsagesNoTime_ReturnsZero));
        var svc = CreateService(db);

        var result = svc.ComputeVariantBaseCost([], null, 0m);

        Assert.Equal(0m, result);
    }

    // ── ComputeMaterialBaseCost tests ─────────────────────────────────────────

    // Test 8: Material base cost = Σ(unitCost × quantity)
    [Fact]
    public void ComputeMaterialBaseCost_WithUsages_ReturnsCorrectValue()
    {
        var db = CreateInMemoryDb(nameof(ComputeMaterialBaseCost_WithUsages_ReturnsCorrectValue));
        var svc = CreateService(db);

        var usages = new[] { (unitCost: 0.5m, quantity: 78.5m), (unitCost: 2m, quantity: 1m) };
        var result = svc.ComputeMaterialBaseCost(usages);

        // 0.5×78.5 + 2×1 = 39.25 + 2 = 41.25
        Assert.Equal(41.25m, result);
    }

    // Test 9: Empty usages → 0
    [Fact]
    public void ComputeMaterialBaseCost_EmptyUsages_ReturnsZero()
    {
        var db = CreateInMemoryDb(nameof(ComputeMaterialBaseCost_EmptyUsages_ReturnsZero));
        var svc = CreateService(db);

        var result = svc.ComputeMaterialBaseCost([]);

        Assert.Equal(0m, result);
    }

    // ── ComputePrice (sync) tests ─────────────────────────────────────────────

    // Test 10: (100 + 50) × 1.16 = 174
    [Fact]
    public void ComputePrice_StandardInputs_ReturnsCorrectValue()
    {
        var db = CreateInMemoryDb(nameof(ComputePrice_StandardInputs_ReturnsCorrectValue));
        var svc = CreateService(db);

        var result = svc.ComputePrice(100m, 50m, 0.16m);

        Assert.Equal(174m, result);
    }

    // Test 11: zero profit — (100 + 0) × 1.16 = 116
    [Fact]
    public void ComputePrice_ZeroProfit_ReturnsBaseCostWithTax()
    {
        var db = CreateInMemoryDb(nameof(ComputePrice_ZeroProfit_ReturnsBaseCostWithTax));
        var svc = CreateService(db);

        var result = svc.ComputePrice(100m, 0m, 0.16m);

        Assert.Equal(116m, result);
    }

    // Test 12: zero tax — (100 + 50) × 1.0 = 150
    [Fact]
    public void ComputePrice_ZeroTax_ReturnsSumOfBaseCostAndProfit()
    {
        var db = CreateInMemoryDb(nameof(ComputePrice_ZeroTax_ReturnsSumOfBaseCostAndProfit));
        var svc = CreateService(db);

        var result = svc.ComputePrice(100m, 50m, 0m);

        Assert.Equal(150m, result);
    }

    // Test 13: Profit = 0 → Price = BaseCost × (1 + TaxRate)
    [Fact]
    public void ComputePrice_ZeroProfitIdentity_PriceEqualsBaseCostTimesTaxFactor()
    {
        var db = CreateInMemoryDb(nameof(ComputePrice_ZeroProfitIdentity_PriceEqualsBaseCostTimesTaxFactor));
        var svc = CreateService(db);

        var baseCost = 200m;
        var taxRate = 0.16m;

        var result = svc.ComputePrice(baseCost, 0m, taxRate);

        Assert.Equal(baseCost * (1 + taxRate), result);
    }

    // Test 14: TaxRate = 0 → Price = BaseCost + Profit
    [Fact]
    public void ComputePrice_ZeroTaxRate_PriceEqualsBaseCostPlusProfit()
    {
        var db = CreateInMemoryDb(nameof(ComputePrice_ZeroTaxRate_PriceEqualsBaseCostPlusProfit));
        var svc = CreateService(db);

        var result = svc.ComputePrice(100m, 50m, 0m);

        Assert.Equal(150m, result);
    }

    // ── Error cases ───────────────────────────────────────────────────────────

    // Test 15: Negative BaseCost → ArgumentOutOfRangeException
    [Fact]
    public void ComputePrice_NegativeBaseCost_ThrowsArgumentOutOfRangeException()
    {
        var db = CreateInMemoryDb(nameof(ComputePrice_NegativeBaseCost_ThrowsArgumentOutOfRangeException));
        var svc = CreateService(db);

        Assert.Throws<ArgumentOutOfRangeException>(() => svc.ComputePrice(-1m, 50m, 0.16m));
    }

    // Test 16: Negative Profit → ArgumentOutOfRangeException
    [Fact]
    public void ComputePrice_NegativeProfit_ThrowsArgumentOutOfRangeException()
    {
        var db = CreateInMemoryDb(nameof(ComputePrice_NegativeProfit_ThrowsArgumentOutOfRangeException));
        var svc = CreateService(db);

        Assert.Throws<ArgumentOutOfRangeException>(() => svc.ComputePrice(100m, -1m, 0.16m));
    }

    // Test 17: Negative TaxRate → ArgumentOutOfRangeException
    [Fact]
    public void ComputePrice_NegativeTaxRate_ThrowsArgumentOutOfRangeException()
    {
        var db = CreateInMemoryDb(nameof(ComputePrice_NegativeTaxRate_ThrowsArgumentOutOfRangeException));
        var svc = CreateService(db);

        Assert.Throws<ArgumentOutOfRangeException>(() => svc.ComputePrice(100m, 50m, -0.01m));
    }
}
