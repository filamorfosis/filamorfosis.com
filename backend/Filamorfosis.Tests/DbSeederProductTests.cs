// Feature: product-catalog-migration
// Tasks 7.7 and 7.8 — Unit tests for DbSeeder.SeedProductsAsync
// Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5

using Filamorfosis.Domain.Entities;
using Filamorfosis.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Filamorfosis.Tests;

public class DbSeederProductTests
{
    // ── Helpers ──────────────────────────────────────────────────────────────

    private static FilamorfosisDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<FilamorfosisDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new FilamorfosisDbContext(options);
    }

    private static async Task SeedCategoriesAsync(FilamorfosisDbContext db)
    {
        db.Categories.AddRange(
            new Category { Id = Guid.NewGuid(), Slug = "uv-printing",   NameEs = "Impresión UV",  NameEn = "UV Printing" },
            new Category { Id = Guid.NewGuid(), Slug = "laser-cutting", NameEs = "Corte Láser",   NameEn = "Laser Cutting" }
        );
        await db.SaveChangesAsync();
    }

    // ── Task 7.7: Total product count ────────────────────────────────────────

    [Fact]
    public async Task SeedProductsAsync_SeedsAllProducts()
    {
        await using var db = CreateDb();
        await SeedCategoriesAsync(db);

        await DbSeeder.SeedProductsAsync(db);

        var count = await db.Products.CountAsync();
        // 28 UV + 6 engrave = 34
        Assert.Equal(34, count);
    }

    // ── Task 7.7: Variant count per product (2 × pricing rows) ──────────────

    [Fact]
    public async Task SeedProductsAsync_EachProductHasTwoVariantsPerPricingRow()
    {
        await using var db = CreateDb();
        await SeedCategoriesAsync(db);

        await DbSeeder.SeedProductsAsync(db);

        var defs = DbSeeder.BuildProductDefinitions();
        foreach (var def in defs)
        {
            var product = await db.Products
                .Include(p => p.Variants)
                .FirstOrDefaultAsync(p => p.Slug == def.Slug);

            Assert.NotNull(product);
            Assert.Equal(def.Rows.Length * 2, product.Variants.Count);
        }
    }

    // ── Task 7.7: IsAvailable = false and Price = 0 for Cotizar/N/A rows ────

    [Fact]
    public async Task SeedProductsAsync_CotizarAndNA_SetUnavailableAndZeroPrice()
    {
        await using var db = CreateDb();
        await SeedCategoriesAsync(db);

        await DbSeeder.SeedProductsAsync(db);

        var defs = DbSeeder.BuildProductDefinitions();
        foreach (var def in defs)
        {
            var product = await db.Products
                .Include(p => p.Variants)
                .FirstOrDefaultAsync(p => p.Slug == def.Slug);

            Assert.NotNull(product);

            for (int i = 0; i < def.Rows.Length; i++)
            {
                var row = def.Rows[i];

                var flatVariant = product.Variants
                    .FirstOrDefault(v => v.Sku == $"{def.Slug}-{i}-F");
                Assert.NotNull(flatVariant);

                var reliefVariant = product.Variants
                    .FirstOrDefault(v => v.Sku == $"{def.Slug}-{i}-R");
                Assert.NotNull(reliefVariant);

                bool flatIsUnavailable = row.Flat.Equals("Cotizar", StringComparison.OrdinalIgnoreCase)
                                      || row.Flat.Equals("N/A", StringComparison.OrdinalIgnoreCase);
                if (flatIsUnavailable)
                {
                    Assert.False(flatVariant.IsAvailable,
                        $"{def.Slug} row {i} flat should be unavailable");
                    Assert.Equal(0m, flatVariant.Price);
                }
                else
                {
                    Assert.True(flatVariant.IsAvailable,
                        $"{def.Slug} row {i} flat should be available");
                    Assert.True(flatVariant.Price > 0m);
                }

                bool reliefIsUnavailable = row.Relief.Equals("Cotizar", StringComparison.OrdinalIgnoreCase)
                                         || row.Relief.Equals("N/A", StringComparison.OrdinalIgnoreCase);
                if (reliefIsUnavailable)
                {
                    Assert.False(reliefVariant.IsAvailable,
                        $"{def.Slug} row {i} relief should be unavailable");
                    Assert.Equal(0m, reliefVariant.Price);
                }
                else
                {
                    Assert.True(reliefVariant.IsAvailable,
                        $"{def.Slug} row {i} relief should be available");
                    Assert.True(reliefVariant.Price > 0m);
                }
            }
        }
    }

    // ── Task 7.7: AcceptsDesignFile = true on all variants ──────────────────

    [Fact]
    public async Task SeedProductsAsync_AllVariantsAcceptDesignFile()
    {
        await using var db = CreateDb();
        await SeedCategoriesAsync(db);

        await DbSeeder.SeedProductsAsync(db);

        var allVariants = await db.ProductVariants.ToListAsync();
        Assert.All(allVariants, v => Assert.True(v.AcceptsDesignFile));
    }

    // ── Task 7.7: Category mapping ───────────────────────────────────────────

    [Fact]
    public async Task SeedProductsAsync_UvProductsLinkedToUvPrintingCategory()
    {
        await using var db = CreateDb();
        await SeedCategoriesAsync(db);

        await DbSeeder.SeedProductsAsync(db);

        var uvCatId = (await db.Categories.FirstAsync(c => c.Slug == "uv-printing")).Id;
        var uvProduct = await db.Products.FirstAsync(p => p.Slug == "uv-coaster");
        Assert.Equal(uvCatId, uvProduct.CategoryId);
    }

    [Fact]
    public async Task SeedProductsAsync_EngraveProductsLinkedToLaserCuttingCategory()
    {
        await using var db = CreateDb();
        await SeedCategoriesAsync(db);

        await DbSeeder.SeedProductsAsync(db);

        var laserCatId = (await db.Categories.FirstAsync(c => c.Slug == "laser-cutting")).Id;
        var engraveProduct = await db.Products.FirstAsync(p => p.Slug == "engrave-wood");
        Assert.Equal(laserCatId, engraveProduct.CategoryId);
    }

    // ── Task 7.7: Variant label convention ──────────────────────────────────

    [Fact]
    public async Task SeedProductsAsync_VariantLabelsFollowConvention()
    {
        await using var db = CreateDb();
        await SeedCategoriesAsync(db);

        await DbSeeder.SeedProductsAsync(db);

        var product = await db.Products
            .Include(p => p.Variants)
            .FirstAsync(p => p.Slug == "uv-coaster");

        var flatVariant = product.Variants.First(v => v.Sku == "uv-coaster-0-F");
        Assert.EndsWith("— Flat", flatVariant.LabelEs);

        var reliefVariant = product.Variants.First(v => v.Sku == "uv-coaster-0-R");
        Assert.EndsWith("— Relieve", reliefVariant.LabelEs);
    }

    // ── Task 7.8: Idempotence — calling SeedProductsAsync twice ─────────────

    [Fact]
    public async Task SeedProductsAsync_CalledTwice_NoDuplicateProducts()
    {
        await using var db = CreateDb();
        await SeedCategoriesAsync(db);

        await DbSeeder.SeedProductsAsync(db);
        await DbSeeder.SeedProductsAsync(db);

        var count = await db.Products.CountAsync();
        Assert.Equal(34, count);
    }

    [Fact]
    public async Task SeedProductsAsync_CalledTwice_NoDuplicateVariants()
    {
        await using var db = CreateDb();
        await SeedCategoriesAsync(db);

        await DbSeeder.SeedProductsAsync(db);
        await DbSeeder.SeedProductsAsync(db);

        var defs = DbSeeder.BuildProductDefinitions();
        int expectedVariants = defs.Sum(d => d.Rows.Length * 2);
        var actualVariants = await db.ProductVariants.CountAsync();
        Assert.Equal(expectedVariants, actualVariants);
    }
}
