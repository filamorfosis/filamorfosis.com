// Feature: material-supply-cost-model, Property 1: Material base cost equals sum of supply usage products
// Feature: material-supply-cost-model, Property 2: Material base cost response is consistent with returned supply usages
// Feature: material-supply-cost-model, Property 3: Full price formula holds for any valid variant inputs
// Feature: material-supply-cost-model, Property 4: Replace-all semantics for usage persistence
// Feature: material-supply-cost-model, Property 5: Non-positive quantities are always rejected
// Feature: material-supply-cost-model, Property 6: Unknown reference IDs are always rejected
// Feature: material-supply-cost-model, Property 7: Cascade delete removes all child usage rows
// Feature: material-supply-cost-model, Property 8: Variant stock is in-stock iff all material stock quantities are positive
// Feature: material-supply-cost-model, Property 9: ProcessCost update propagates to all referencing materials
// Feature: material-supply-cost-model, Property 10: Deleting a material referenced by a variant is always rejected

using System.Net;
using System.Net.Http.Json;
using Filamorfosis.Application.DTOs;
using Filamorfosis.Application.Services;
using Filamorfosis.Domain.Entities;
using Filamorfosis.Infrastructure.Data;
using Filamorfosis.Infrastructure.Services;
using Filamorfosis.Tests.Infrastructure;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Filamorfosis.Tests;

public class MaterialSupplyCostModelPropertyTests
{
    private static Gen<decimal> NonNegCostGen =>
        Gen.Choose(0, 10000).Select(i => (decimal)i / 100m);

    private static Gen<decimal> PosCostGen =>
        Gen.Choose(1, 10000).Select(i => (decimal)i / 100m);

    private static Gen<decimal> TaxRateGen =>
        Gen.Choose(0, 100).Select(i => (decimal)i / 100m);

    private static Gen<int> ManufactureTimeGen =>
        Gen.Choose(0, 480);

    private static Gen<decimal> ElectricRateGen =>
        Gen.Choose(0, 1000).Select(i => (decimal)i / 100m);

    private static FilamorfosisDbContext CreateInMemoryDb(string dbName)
    {
        var options = new DbContextOptionsBuilder<FilamorfosisDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
        return new FilamorfosisDbContext(options);
    }

    private static PricingCalculatorService CreatePricingService(FilamorfosisDbContext db)
        => new(db);

    // Feature: material-supply-cost-model, Property 1: Material base cost equals sum of supply usage products
    // Validates: Requirements 2.1, 2.4
    [Fact]
    public void Property1_MaterialBaseCostEqualsSumOfSupplyUsageProducts()
    {
        var db = CreateInMemoryDb(nameof(Property1_MaterialBaseCostEqualsSumOfSupplyUsageProducts));
        var svc = CreatePricingService(db);

        var pairGen =
            from unitCost in NonNegCostGen
            from qty in NonNegCostGen
            select (unitCost, qty);

        var listGen = Gen.Choose(0, 5).SelectMany(n => pairGen.ListOf(n));

        Prop.ForAll(Arb.From(listGen), usages =>
        {
            var expected = usages.Sum(u => u.unitCost * u.qty);
            var actual = svc.ComputeMaterialBaseCost(usages.Select(u => (u.unitCost, u.qty)));
            return actual == expected;
        })
        .QuickCheckThrowOnFailure();

        Assert.Equal(0m, svc.ComputeMaterialBaseCost([]));
    }

    // Feature: material-supply-cost-model, Property 2: Material base cost response is consistent with returned supply usages
    // Validates: Requirements 2.3, 2.5
    [Property(MaxTest = 20)]
    public Property Property2_MaterialBaseCostResponseConsistentWithSupplyUsages()
    {
        var pairGen =
            from unitCost in PosCostGen
            from qty in PosCostGen
            select (unitCost, qty);

        var listGen = Gen.Choose(1, 3).SelectMany(n => pairGen.ListOf(n));

        return Prop.ForAll(
            Arb.From(listGen),
            usages => RunProperty2Async(usages).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunProperty2Async(List<(decimal unitCost, decimal qty)> usages)
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        Guid catId = Guid.Empty;
        var supplyUsagesMap = new Dictionary<string, decimal>();

        await factory.SeedAsync(async db =>
        {
            catId = Guid.NewGuid();
            db.Processes.Add(new Process {
                Id = catId,
                Slug = $"p2-cat-{catId:N}",
                NameEs = "Cat P2"});

            foreach (var (unitCost, qty) in usages)
            {
                var cpId = Guid.NewGuid();
                db.ProcessesCosts.Add(new ProcessCost
                {
                    Id = cpId,
                    ProcessId = catId,
                    Key = $"param-{cpId:N}",
                    Label = "Test Param",
                    Unit = "unit",
                    Value = unitCost,
                    UpdatedAt = DateTime.UtcNow
                });
                supplyUsagesMap[cpId.ToString()] = qty;
            }
            await db.SaveChangesAsync();
        });

        var req = new CreateMaterialRequest(
            Name: $"Mat-P2-{Guid.NewGuid():N}",
            ProcessId: catId,
            SizeLabel: null,
            WidthCm: null,
            HeightCm: null,
            DepthCm: null,
            WeightGrams: null,
            StockQuantity: 0,
            BaseCost: 0,
            SupplyUsages: supplyUsagesMap
        );

        var resp = await client.PostAsJsonAsync("/api/v1/admin/materials", req);
        if (!resp.IsSuccessStatusCode) return false;

        var dto = await resp.Content.ReadFromJsonAsync<MaterialDto>();
        if (dto is null) return false;

        var expectedBaseCost = dto.SupplyUsages.Sum(u => u.UnitCost * u.Quantity);
        return dto.BaseCost == expectedBaseCost;
    }

    // Feature: material-supply-cost-model, Property 3: Full price formula holds for any valid variant inputs
    // Validates: Requirements 4.1, 4.2, 4.3, 4.4
    [Fact]
    public void Property3_FullPriceFormulaHoldsForAnyValidVariantInputs()
    {
        var db = CreateInMemoryDb(nameof(Property3_FullPriceFormulaHoldsForAnyValidVariantInputs));
        var svc = CreatePricingService(db);

        var pairGen =
            from baseCost in NonNegCostGen
            from qty in NonNegCostGen
            select (baseCost, qty);

        var gen =
            from usages in Gen.Choose(0, 3).SelectMany(n => pairGen.ListOf(n))
            from minutes in ManufactureTimeGen
            from electricRate in ElectricRateGen
            from profit in NonNegCostGen
            from taxRate in TaxRateGen
            select (usages, minutes, electricRate, profit, taxRate);

        Prop.ForAll(Arb.From(gen), tuple =>
        {
            var (usages, minutes, electricRate, profit, taxRate) = tuple;

            var variantBaseCost = svc.ComputeVariantBaseCost(
                usages.Select(u => (u.baseCost, u.qty)),
                minutes,
                electricRate);

            var price = svc.ComputePrice(variantBaseCost, profit, taxRate);

            var expectedBaseCost = usages.Sum(u => u.baseCost * u.qty)
                + (decimal)minutes / 60m * electricRate;
            var expectedPrice = (expectedBaseCost + profit) * (1 + taxRate);

            return variantBaseCost == expectedBaseCost && price == expectedPrice;
        })
        .QuickCheckThrowOnFailure();

        // Empty usages + no manufacture time = 0
        Assert.Equal(0m, svc.ComputeVariantBaseCost([], null, 0m));
    }

    // Feature: material-supply-cost-model, Property 4: Replace-all semantics for usage persistence
    // Validates: Requirements 1.2, 3.2
    [Property(MaxTest = 10)]
    public Property Property4_ReplaceAllSemanticsForUsagePersistence()
    {
        var countGen = Gen.Choose(1, 3);
        return Prop.ForAll(
            Arb.From(countGen),
            Arb.From(countGen),
            (countA, countB) => RunProperty4Async(countA, countB).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunProperty4Async(int countA, int countB)
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        Guid catId = Guid.Empty;
        Guid materialId = Guid.Empty;
        var cpIdsA = new List<Guid>();
        var cpIdsB = new List<Guid>();

        await factory.SeedAsync(async db =>
        {
            catId = Guid.NewGuid();
            db.Processes.Add(new Process { Id = catId, Slug = $"p4-cat-{catId:N}", NameEs = "C"});

            for (int i = 0; i < countA + countB; i++)
            {
                var cpId = Guid.NewGuid();
                db.ProcessesCosts.Add(new ProcessCost
                {
                    Id = cpId, ProcessId = catId,
                    Key = $"p4-param-{cpId:N}", Label = "P", Unit = "u",
                    Value = 1.0m, UpdatedAt = DateTime.UtcNow
                });
                if (i < countA) cpIdsA.Add(cpId);
                else cpIdsB.Add(cpId);
            }

            materialId = Guid.NewGuid();
            db.Materials.Add(new Material
            {
                Id = materialId, Name = $"Mat-P4-{materialId:N}",
                ProcessId = catId, BaseCost = 0m, CreatedAt = DateTime.UtcNow
            });
            await db.SaveChangesAsync();
        });

        // PUT with map A
        var mapA = cpIdsA.ToDictionary(id => id.ToString(), _ => 1.0m);
        var putA = await client.PutAsJsonAsync($"/api/v1/admin/materials/{materialId}",
            new UpdateMaterialRequest(null, null, null, null, null, null, null, null, null, mapA));
        if (!putA.IsSuccessStatusCode) return false;

        // PUT with map B (replaces A)
        var mapB = cpIdsB.ToDictionary(id => id.ToString(), _ => 2.0m);
        var putB = await client.PutAsJsonAsync($"/api/v1/admin/materials/{materialId}",
            new UpdateMaterialRequest(null, null, null, null, null, null, null, null, null, mapB));
        if (!putB.IsSuccessStatusCode) return false;

        // Verify DB has exactly map B rows
        bool dbOk = false;
        await factory.SeedAsync(async db =>
        {
            var usages = await db.MaterialSupplyUsages
                .Where(u => u.MaterialId == materialId)
                .ToListAsync();

            var actualIds = usages.Select(u => u.ProcessCostId).OrderBy(x => x).ToList();
            var expectedIds = cpIdsB.OrderBy(x => x).ToList();
            dbOk = actualIds.SequenceEqual(expectedIds)
                && usages.All(u => u.Quantity == 2.0m);
            await Task.CompletedTask;
        });

        if (!dbOk) return false;

        // ---- Variant side ----
        Guid prodId = Guid.Empty;
        Guid variantId = Guid.Empty;
        var matIdsA = new List<Guid>();
        var matIdsB = new List<Guid>();

        await factory.SeedAsync(async db =>
        {
            prodId = Guid.NewGuid();
            db.Products.Add(new Product
            {
                Id = prodId, ProcessId = catId, Slug = $"p4-prod-{prodId:N}",
                TitleEs = "P", DescriptionEs = "D",
                Tags = [], IsActive = true, CreatedAt = DateTime.UtcNow
            });

            for (int i = 0; i < countA + countB; i++)
            {
                var mId = Guid.NewGuid();
                db.Materials.Add(new Material
                {
                    Id = mId, Name = $"Mat-P4v-{mId:N}",
                    ProcessId = catId, BaseCost = 1.0m, CreatedAt = DateTime.UtcNow
                });
                if (i < countA) matIdsA.Add(mId);
                else matIdsB.Add(mId);
            }
            await db.SaveChangesAsync();
        });

        var createVariant = await client.PostAsJsonAsync($"/api/v1/admin/products/{prodId}/variants",
            new CreateVariantRequest
            {
                LabelEs = "V", Sku = $"SKU-P4-{Guid.NewGuid():N}",
                Price = 0m, IsAvailable = true,
                MaterialUsages = matIdsA.ToDictionary(id => id.ToString(), _ => 1.0m)
            });
        if (createVariant.StatusCode != System.Net.HttpStatusCode.Created) return false;
        var createdVariant = await createVariant.Content.ReadFromJsonAsync<ProductVariantDto>();
        if (createdVariant is null) return false;
        variantId = createdVariant.Id;

        // PUT variant with map B
        var putVariantB = await client.PutAsJsonAsync($"/api/v1/admin/products/{prodId}/variants/{variantId}",
            new UpdateVariantRequest
            {
                MaterialUsages = matIdsB.ToDictionary(id => id.ToString(), _ => 3.0m)
            });
        if (!putVariantB.IsSuccessStatusCode) return false;

        // Verify DB has exactly map B rows (no A rows remain)
        bool variantDbOk = false;
        await factory.SeedAsync(async db =>
        {
            var usages = await db.VariantMaterialUsages
                .Where(u => u.VariantId == variantId)
                .ToListAsync();

            var actualMatIds = usages.Select(u => u.MaterialId).OrderBy(x => x).ToList();
            var expectedMatIds = matIdsB.OrderBy(x => x).ToList();
            variantDbOk = actualMatIds.SequenceEqual(expectedMatIds)
                && usages.All(u => u.Quantity == 3.0m);
            await Task.CompletedTask;
        });

        return variantDbOk;
    }

    // Feature: material-supply-cost-model, Property 5: Non-positive quantities are always rejected
    // Validates: Requirements 1.4, 3.4
    [Property(MaxTest = 20)]
    public Property Property5_NonPositiveQuantitiesAreAlwaysRejected()
    {
        var nonPosGen = Gen.Choose(-10000, 0).Select(i => (decimal)i / 100m);
        return Prop.ForAll(
            Arb.From(nonPosGen),
            qty => RunProperty5Async(qty).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunProperty5Async(decimal qty)
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        Guid catId = Guid.Empty;
        Guid cpId = Guid.Empty;
        Guid matId = Guid.Empty;
        Guid prodId = Guid.Empty;

        await factory.SeedAsync(async db =>
        {
            catId = Guid.NewGuid();
            db.Processes.Add(new Process { Id = catId, Slug = $"p5-cat-{catId:N}", NameEs = "C"});
            cpId = Guid.NewGuid();
            db.ProcessesCosts.Add(new ProcessCost
            {
                Id = cpId, ProcessId = catId, Key = $"p5-{cpId:N}",
                Label = "P", Unit = "u", Value = 1.0m, UpdatedAt = DateTime.UtcNow
            });
            matId = Guid.NewGuid();
            db.Materials.Add(new Material
            {
                Id = matId, Name = $"Mat-P5-{matId:N}",
                ProcessId = catId, BaseCost = 1.0m, CreatedAt = DateTime.UtcNow
            });
            prodId = Guid.NewGuid();
            db.Products.Add(new Product
            {
                Id = prodId, ProcessId = catId, Slug = $"p5-prod-{prodId:N}",
                TitleEs = "P", DescriptionEs = "D",
                Tags = [], IsActive = true, CreatedAt = DateTime.UtcNow
            });
            await db.SaveChangesAsync();
        });

        // POST material with non-positive quantity -> expect 400
        var matResp = await client.PostAsJsonAsync("/api/v1/admin/materials",
            new CreateMaterialRequest(
                Name: $"Mat-P5-bad-{Guid.NewGuid():N}",
                ProcessId: catId,
                SizeLabel: null, WidthCm: null, HeightCm: null, DepthCm: null, WeightGrams: null,
                StockQuantity: 0,
                BaseCost: 0,
                SupplyUsages: new Dictionary<string, decimal> { [cpId.ToString()] = qty }
            ));
        if (matResp.StatusCode != System.Net.HttpStatusCode.BadRequest) return false;

        // POST variant with non-positive quantity -> expect 400
        var varResp = await client.PostAsJsonAsync($"/api/v1/admin/products/{prodId}/variants",
            new CreateVariantRequest
            {
                LabelEs = "V", Sku = $"SKU-P5-{Guid.NewGuid():N}",
                Price = 0m, IsAvailable = true,
                MaterialUsages = new Dictionary<string, decimal> { [matId.ToString()] = qty }
            });
        return varResp.StatusCode == System.Net.HttpStatusCode.BadRequest;
    }

    // Feature: material-supply-cost-model, Property 6: Unknown reference IDs are always rejected
    // Validates: Requirements 1.3, 3.3
    [Property(MaxTest = 20)]
    public Property Property6_UnknownReferenceIDsAreAlwaysRejected()
    {
        return Prop.ForAll(
            Arb.From(Gen.Constant(true)),
            _ => RunProperty6Async().GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunProperty6Async()
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        Guid catId = Guid.Empty;
        Guid prodId = Guid.Empty;

        await factory.SeedAsync(async db =>
        {
            catId = Guid.NewGuid();
            db.Processes.Add(new Process { Id = catId, Slug = $"p6-cat-{catId:N}", NameEs = "C"});
            prodId = Guid.NewGuid();
            db.Products.Add(new Product
            {
                Id = prodId, ProcessId = catId, Slug = $"p6-prod-{prodId:N}",
                TitleEs = "P", DescriptionEs = "D",
                Tags = [], IsActive = true, CreatedAt = DateTime.UtcNow
            });
            await db.SaveChangesAsync();
        });

        var unknownCpId = Guid.NewGuid();
        var matResp = await client.PostAsJsonAsync("/api/v1/admin/materials",
            new CreateMaterialRequest(
                Name: $"Mat-P6-{Guid.NewGuid():N}",
                ProcessId: catId,
                SizeLabel: null, WidthCm: null, HeightCm: null, DepthCm: null, WeightGrams: null,
                StockQuantity: 0,
                BaseCost: 0,
                SupplyUsages: new Dictionary<string, decimal> { [unknownCpId.ToString()] = 1.0m }
            ));
        if (matResp.StatusCode != System.Net.HttpStatusCode.BadRequest) return false;

        var unknownMatId = Guid.NewGuid();
        var varResp = await client.PostAsJsonAsync($"/api/v1/admin/products/{prodId}/variants",
            new CreateVariantRequest
            {
                LabelEs = "V", Sku = $"SKU-P6-{Guid.NewGuid():N}",
                Price = 0m, IsAvailable = true,
                MaterialUsages = new Dictionary<string, decimal> { [unknownMatId.ToString()] = 1.0m }
            });
        return varResp.StatusCode == System.Net.HttpStatusCode.BadRequest;
    }

    // Feature: material-supply-cost-model, Property 7: Cascade delete removes all child usage rows
    // Validates: Requirements 1.5, 3.5
    [Property(MaxTest = 20)]
    public Property Property7_CascadeDeleteRemovesAllChildUsageRows()
    {
        var nGen = Gen.Choose(1, 5);
        return Prop.ForAll(
            Arb.From(nGen),
            n => RunProperty7Async(n).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunProperty7Async(int n)
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        Guid catId = Guid.Empty;
        Guid materialId = Guid.Empty;

        await factory.SeedAsync(async db =>
        {
            catId = Guid.NewGuid();
            db.Processes.Add(new Process { Id = catId, Slug = $"p7-cat-{catId:N}", NameEs = "C"});

            materialId = Guid.NewGuid();
            db.Materials.Add(new Material
            {
                Id = materialId, Name = $"Mat-P7-{materialId:N}",
                ProcessId = catId, BaseCost = 0m, CreatedAt = DateTime.UtcNow
            });

            for (int i = 0; i < n; i++)
            {
                var cpId = Guid.NewGuid();
                db.ProcessesCosts.Add(new ProcessCost
                {
                    Id = cpId, ProcessId = catId, Key = $"p7-cp-{cpId:N}",
                    Label = "P", Unit = "u", Value = 1.0m, UpdatedAt = DateTime.UtcNow
                });
                db.MaterialSupplyUsages.Add(new MaterialSupplyUsage
                {
                    Id = Guid.NewGuid(), MaterialId = materialId,
                    ProcessCostId = cpId, Quantity = 1.0m
                });
            }
            await db.SaveChangesAsync();
        });

        // DELETE material
        var delResp = await client.DeleteAsync($"/api/v1/admin/materials/{materialId}");
        if (!delResp.IsSuccessStatusCode) return false;

        // Verify MaterialSupplyUsages count == 0 for that materialId
        int usageCount = -1;
        await factory.SeedAsync(async db =>
        {
            usageCount = await db.MaterialSupplyUsages
                .CountAsync(u => u.MaterialId == materialId);
            await Task.CompletedTask;
        });
        if (usageCount != 0) return false;

        // ---- Variant side ----
        Guid prodId = Guid.Empty;
        Guid variantId = Guid.Empty;
        Guid matForVariant = Guid.Empty;

        await factory.SeedAsync(async db =>
        {
            matForVariant = Guid.NewGuid();
            db.Materials.Add(new Material
            {
                Id = matForVariant, Name = $"Mat-P7v-{matForVariant:N}",
                ProcessId = catId, BaseCost = 1.0m, CreatedAt = DateTime.UtcNow
            });
            prodId = Guid.NewGuid();
            db.Products.Add(new Product
            {
                Id = prodId, ProcessId = catId, Slug = $"p7-prod-{prodId:N}",
                TitleEs = "P", DescriptionEs = "D",
                Tags = [], IsActive = true, CreatedAt = DateTime.UtcNow
            });
            variantId = Guid.NewGuid();
            db.ProductVariants.Add(new ProductVariant
            {
                Id = variantId, ProductId = prodId, Sku = $"SKU-P7-{variantId:N}",
                LabelEs = "V", Price = 0m, IsAvailable = true
            });
            for (int i = 0; i < n; i++)
            {
                db.VariantMaterialUsages.Add(new VariantMaterialUsage
                {
                    Id = Guid.NewGuid(), VariantId = variantId,
                    MaterialId = matForVariant, Quantity = 1.0m
                });
            }
            await db.SaveChangesAsync();
        });

        // DELETE variant
        var delVariantResp = await client.DeleteAsync($"/api/v1/admin/products/{prodId}/variants/{variantId}");
        if (!delVariantResp.IsSuccessStatusCode) return false;

        // Verify VariantMaterialUsages count == 0 for that variantId
        int varUsageCount = -1;
        await factory.SeedAsync(async db =>
        {
            varUsageCount = await db.VariantMaterialUsages
                .CountAsync(u => u.VariantId == variantId);
            await Task.CompletedTask;
        });
        return varUsageCount == 0;
    }

    // Feature: material-supply-cost-model, Property 8: Variant stock is in-stock iff all material stock quantities are positive
    // Validates: Requirements 11.2, 11.3, 11.4, 11.5
    [Fact]
    public void Property8_VariantStockIsInStockIffAllMaterialStockQuantitiesMeetRequired()
    {
        var stockService = new StockService();

        // Property: inStock iff every (stock, required) pair has stock >= required
        var gen = Gen.Choose(0, 5).SelectMany(n =>
            Gen.Two(Gen.Choose(0, 10).Select(x => (decimal)x))
               .Select(t => (stock: t.Item1, required: t.Item2))
               .ListOf(n));

        Prop.ForAll(Arb.From(gen), usages =>
        {
            var expected = usages.Count == 0 || usages.All(u => u.stock >= u.required);
            var actual = stockService.IsVariantInStock(usages.Select(u => (u.stock, u.required)));
            return actual == expected;
        })
        .QuickCheckThrowOnFailure();

        // Edge cases
        Assert.True(stockService.IsVariantInStock([]));
        Assert.True(stockService.IsVariantInStock([(10m, 2m), (5m, 5m)]));   // exact match is in stock
        Assert.False(stockService.IsVariantInStock([(1m, 2m)]));              // 1 < 2 = out of stock
        Assert.False(stockService.IsVariantInStock([(0m, 1m)]));              // 0 < 1 = out of stock
        Assert.True(stockService.IsVariantInStock([(5m, 0m)]));               // required=0 = in stock
    }

    // Feature: material-supply-cost-model, Property 9: ProcessCost update propagates to all referencing materials
    // Validates: Requirement 2.2
    [Property(MaxTest = 20)]
    public Property Property9_CostParameterUpdatePropagatestoAllReferencingMaterials()
    {
        var nGen = Gen.Choose(1, 5);
        var valueGen = PosCostGen;
        return Prop.ForAll(
            Arb.From(nGen),
            Arb.From(valueGen),
            (n, newValue) => RunProperty9Async(n, newValue).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunProperty9Async(int n, decimal newValue)
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        Guid catId = Guid.Empty;
        Guid cpId = Guid.Empty;
        var materialIds = new List<Guid>();
        const string cpKey = "p9-param";

        await factory.SeedAsync(async db =>
        {
            catId = Guid.NewGuid();
            db.Processes.Add(new Process { Id = catId, Slug = $"p9-cat-{catId:N}", NameEs = "C"});

            cpId = Guid.NewGuid();
            db.ProcessesCosts.Add(new ProcessCost
            {
                Id = cpId, ProcessId = catId, Key = cpKey,
                Label = "P9 Param", Unit = "u", Value = 1.0m, UpdatedAt = DateTime.UtcNow
            });

            for (int i = 0; i < n; i++)
            {
                var matId = Guid.NewGuid();
                materialIds.Add(matId);
                db.Materials.Add(new Material
                {
                    Id = matId, Name = $"Mat-P9-{matId:N}",
                    ProcessId = catId, BaseCost = 0m, CreatedAt = DateTime.UtcNow
                });
                db.MaterialSupplyUsages.Add(new MaterialSupplyUsage
                {
                    Id = Guid.NewGuid(), MaterialId = matId,
                    ProcessCostId = cpId, Quantity = 1.0m
                });
            }
            await db.SaveChangesAsync();
        });

        // PUT new value for the ProcessCost
        var putResp = await client.PutAsJsonAsync($"/api/v1/admin/process-costs/{catId}/{cpKey}",
            new UpsertProcessCostRequest("P9 Param", "u", newValue));
        if (!putResp.IsSuccessStatusCode) return false;

        // Verify each material BaseCost == newValue (quantity=1.0 * newValue)
        foreach (var matId in materialIds)
        {
            var getResp = await client.GetAsync($"/api/v1/admin/materials/{matId}");
            if (!getResp.IsSuccessStatusCode) return false;
            var dto = await getResp.Content.ReadFromJsonAsync<MaterialDto>();
            if (dto is null || dto.BaseCost != newValue) return false;
        }
        return true;
    }

    // Feature: material-supply-cost-model, Property 10: Deleting a material referenced by a variant is always rejected
    // Validates: Requirements 1.6, 10.5
    [Property(MaxTest = 20)]
    public Property Property10_DeletingMaterialReferencedByVariantIsAlwaysRejected()
    {
        var nGen = Gen.Choose(1, 5);
        return Prop.ForAll(
            Arb.From(nGen),
            n => RunProperty10Async(n).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunProperty10Async(int n)
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        Guid catId = Guid.Empty;
        Guid materialId = Guid.Empty;

        await factory.SeedAsync(async db =>
        {
            catId = Guid.NewGuid();
            db.Processes.Add(new Process { Id = catId, Slug = $"p10-cat-{catId:N}", NameEs = "C"});

            materialId = Guid.NewGuid();
            db.Materials.Add(new Material
            {
                Id = materialId, Name = $"Mat-P10-{materialId:N}",
                ProcessId = catId, BaseCost = 1.0m, CreatedAt = DateTime.UtcNow
            });

            var prodId = Guid.NewGuid();
            db.Products.Add(new Product
            {
                Id = prodId, ProcessId = catId, Slug = $"p10-prod-{prodId:N}",
                TitleEs = "P", DescriptionEs = "D",
                Tags = [], IsActive = true, CreatedAt = DateTime.UtcNow
            });

            for (int i = 0; i < n; i++)
            {
                var variantId = Guid.NewGuid();
                db.ProductVariants.Add(new ProductVariant
                {
                    Id = variantId, ProductId = prodId, Sku = $"SKU-P10-{variantId:N}",
                    LabelEs = "V", Price = 0m, IsAvailable = true
                });
                db.VariantMaterialUsages.Add(new VariantMaterialUsage
                {
                    Id = Guid.NewGuid(), VariantId = variantId,
                    MaterialId = materialId, Quantity = 1.0m
                });
            }
            await db.SaveChangesAsync();
        });

        // DELETE material -> expect 409
        var delResp = await client.DeleteAsync($"/api/v1/admin/materials/{materialId}");
        return delResp.StatusCode == System.Net.HttpStatusCode.Conflict;
    }
}
