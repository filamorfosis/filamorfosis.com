// Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.7, 4.8
// Feature: cost-management-and-pricing

using FsCheck;
using FsCheck.Fluent;
using Filamorfosis.Application.Services.Requests;
using Filamorfosis.Infrastructure.Data;
using Filamorfosis.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace Filamorfosis.Tests;

public class PricingCalculatorServicePropertyTests
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

    // ── Generators ────────────────────────────────────────────────────────────

    // Non-negative decimal in [0, 100.00] — used for BaseCost / Profit (scaled from cents)
    private static Gen<decimal> NonNegativeCostGen =>
        Gen.Choose(0, 10000).Select(i => (decimal)i / 100m);

    // Tax rate in [0.00, 1.00] — generated as integer 0..100 then divided by 100
    private static Gen<decimal> TaxRateGen =>
        Gen.Choose(0, 100).Select(i => (decimal)i / 100m);

    // Manufacture time in minutes [0, 480] (0 to 8 hours)
    private static Gen<int> ManufactureTimeGen =>
        Gen.Choose(0, 480);

    // Negative decimal in [-100.00, -0.01]
    private static Gen<decimal> NegativeValueGen =>
        Gen.Choose(-10000, -1).Select(i => (decimal)i / 100m);

    // ── Property 1: Price formula correctness ─────────────────────────────────
    // Feature: cost-management-and-pricing, Property 1: For any non-negative b, p, t: ComputePrice(b, p, t) = (b + p) × (1 + t)
    // Validates: Requirements 4.2, 4.7
    [Fact]
    public void Property1_PriceFormulaCorrectness()
    {
        var db = CreateInMemoryDb(nameof(Property1_PriceFormulaCorrectness));
        var svc = CreateService(db);

        var gen =
            from b in NonNegativeCostGen
            from p in NonNegativeCostGen
            from t in TaxRateGen
            select (b, p, t);

        Prop.ForAll(Arb.From(gen), tuple =>
        {
            var (b, p, t) = tuple;
            var expected = (b + p) * (1 + t);
            var actual = svc.ComputePrice(b, p, t);
            return actual == expected;
        })
        .QuickCheckThrowOnFailure();
    }

    // ── Property 2: Zero-profit identity ─────────────────────────────────────
    // Feature: cost-management-and-pricing, Property 2: For any non-negative b, t: ComputePrice(b, 0, t) = b × (1 + t)
    // Validates: Requirements 4.8
    [Fact]
    public void Property2_ZeroProfitIdentity()
    {
        var db = CreateInMemoryDb(nameof(Property2_ZeroProfitIdentity));
        var svc = CreateService(db);

        var gen =
            from b in NonNegativeCostGen
            from t in TaxRateGen
            select (b, t);

        Prop.ForAll(Arb.From(gen), tuple =>
        {
            var (b, t) = tuple;
            var expected = b * (1 + t);
            var actual = svc.ComputePrice(b, 0m, t);
            return actual == expected;
        })
        .QuickCheckThrowOnFailure();
    }

    // ── Property 3: Negative inputs throw ────────────────────────────────────
    // Feature: cost-management-and-pricing, Property 3: For any negative value as BaseCost, Profit, or TaxRate, service throws ArgumentOutOfRangeException
    // Validates: Requirements 4.3, 4.4, 4.5
    [Fact]
    public void Property3_NegativeBaseCostThrows()
    {
        var db = CreateInMemoryDb(nameof(Property3_NegativeBaseCostThrows));
        var svc = CreateService(db);

        Prop.ForAll(Arb.From(NegativeValueGen), negativeBaseCost =>
        {
            try
            {
                svc.ComputePrice(negativeBaseCost, 0m, 0m);
                return false; // should have thrown
            }
            catch (ArgumentOutOfRangeException)
            {
                return true;
            }
        })
        .QuickCheckThrowOnFailure();
    }

    [Fact]
    public void Property3_NegativeProfitThrows()
    {
        var db = CreateInMemoryDb(nameof(Property3_NegativeProfitThrows));
        var svc = CreateService(db);

        Prop.ForAll(Arb.From(NegativeValueGen), negativeProfit =>
        {
            try
            {
                svc.ComputePrice(0m, negativeProfit, 0m);
                return false;
            }
            catch (ArgumentOutOfRangeException)
            {
                return true;
            }
        })
        .QuickCheckThrowOnFailure();
    }

    [Fact]
    public void Property3_NegativeTaxRateThrows()
    {
        var db = CreateInMemoryDb(nameof(Property3_NegativeTaxRateThrows));
        var svc = CreateService(db);

        Prop.ForAll(Arb.From(NegativeValueGen), negativeTaxRate =>
        {
            try
            {
                svc.ComputePrice(0m, 0m, negativeTaxRate);
                return false;
            }
            catch (ArgumentOutOfRangeException)
            {
                return true;
            }
        })
        .QuickCheckThrowOnFailure();
    }

    // ── Property 4: Generic BaseCost formula holds ────────────────────────────
    // Feature: cost-management-and-pricing, Property 4: Generic formula holds for all non-negative inputs
    // BaseCost = MaterialBaseCost + Σ(supplyKey.costParam × quantity) + (minutes/60 × electricRate)
    // Validates: Requirements 4.1
    [Fact]
    public void Property4_GenericBaseCostFormula()
    {
        var db = CreateInMemoryDb(nameof(Property4_GenericBaseCostFormula));
        var svc = CreateService(db);

        var gen =
            from materialBaseCost in NonNegativeCostGen
            from supplyQty in NonNegativeCostGen
            from supplyCostPerUnit in NonNegativeCostGen
            from manufactureTime in ManufactureTimeGen
            from electricCost in NonNegativeCostGen
            select (materialBaseCost, supplyQty, supplyCostPerUnit, manufactureTime, electricCost);

        Prop.ForAll(Arb.From(gen), async tuple =>
        {
            var (materialBaseCost, supplyQty, supplyCostPerUnit, manufactureTime, electricCost) = tuple;

            var request = new ComputeBaseCostRequest(
                MaterialBaseCost: materialBaseCost,
                ManufactureTimeMinutes: manufactureTime,
                SupplyUsages: new Dictionary<string, decimal> { ["supply_key"] = supplyQty },
                CostParams: Params(
                    ("supply_key", supplyCostPerUnit),
                    ("electric_cost_per_hour", electricCost)
                )
            );

            var actual = await svc.ComputeBaseCostAsync(request);

            var manufactureHours = (decimal)manufactureTime / 60m;
            var expected = materialBaseCost + (supplyQty * supplyCostPerUnit) + (manufactureHours * electricCost);

            return actual == expected;
        })
        .QuickCheckThrowOnFailure();
    }

    // ── Property 5: ComputeVariantBaseCost formula ────────────────────────────
    // Feature: cost-management-and-pricing, Property 5: Variant base cost = Σ(materialBaseCost × qty) + electric
    // Validates: Requirements 4.1
    [Fact]
    public void Property5_VariantBaseCostFormula()
    {
        var db = CreateInMemoryDb(nameof(Property5_VariantBaseCostFormula));
        var svc = CreateService(db);

        var gen =
            from mat1Cost in NonNegativeCostGen
            from mat1Qty in NonNegativeCostGen
            from mat2Cost in NonNegativeCostGen
            from mat2Qty in NonNegativeCostGen
            from manufactureTime in ManufactureTimeGen
            from electricCost in NonNegativeCostGen
            select (mat1Cost, mat1Qty, mat2Cost, mat2Qty, manufactureTime, electricCost);

        Prop.ForAll(Arb.From(gen), tuple =>
        {
            var (mat1Cost, mat1Qty, mat2Cost, mat2Qty, manufactureTime, electricCost) = tuple;

            var usages = new[] { (mat1Cost, mat1Qty), (mat2Cost, mat2Qty) };
            var actual = svc.ComputeVariantBaseCost(usages, manufactureTime, electricCost);

            var manufactureHours = (decimal)manufactureTime / 60m;
            var expected = (mat1Cost * mat1Qty) + (mat2Cost * mat2Qty) + (manufactureHours * electricCost);

            return actual == expected;
        })
        .QuickCheckThrowOnFailure();
    }

    // ── Property 6: ComputeMaterialBaseCost formula ───────────────────────────
    // Feature: cost-management-and-pricing, Property 6: Material base cost = Σ(unitCost × quantity)
    // Validates: Requirements 2.1
    [Fact]
    public void Property6_MaterialBaseCostFormula()
    {
        var db = CreateInMemoryDb(nameof(Property6_MaterialBaseCostFormula));
        var svc = CreateService(db);

        var gen =
            from unitCost1 in NonNegativeCostGen
            from qty1 in NonNegativeCostGen
            from unitCost2 in NonNegativeCostGen
            from qty2 in NonNegativeCostGen
            select (unitCost1, qty1, unitCost2, qty2);

        Prop.ForAll(Arb.From(gen), tuple =>
        {
            var (unitCost1, qty1, unitCost2, qty2) = tuple;

            var usages = new[] { (unitCost1, qty1), (unitCost2, qty2) };
            var actual = svc.ComputeMaterialBaseCost(usages);

            var expected = (unitCost1 * qty1) + (unitCost2 * qty2);

            return actual == expected;
        })
        .QuickCheckThrowOnFailure();
    }

    // ── Property 7: Empty material usages → 0 ────────────────────────────────
    // Feature: cost-management-and-pricing, Property 7: Empty usages always return 0
    // Validates: Requirements 2.4, 4.3
    [Fact]
    public void Property7_EmptyUsagesReturnZero()
    {
        var db = CreateInMemoryDb(nameof(Property7_EmptyUsagesReturnZero));
        var svc = CreateService(db);

        var materialResult = svc.ComputeMaterialBaseCost([]);
        Assert.Equal(0m, materialResult);

        var variantResult = svc.ComputeVariantBaseCost([], null, 0m);
        Assert.Equal(0m, variantResult);
    }
}
