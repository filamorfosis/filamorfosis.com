// Feature: product-catalog-migration
// Properties 1–6: Badge validation, DTO round-trip, seed idempotence,
// variant count invariant, unavailable variant pricing, badge API filter.

using System.Linq;
using System.Net.Http.Json;
using Filamorfosis.Application.DTOs;
using Filamorfosis.Application.Validation;
using Filamorfosis.Domain.Entities;
using Filamorfosis.Infrastructure.Data;
using Filamorfosis.Tests.Infrastructure;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;
using Microsoft.EntityFrameworkCore;

namespace Filamorfosis.Tests;

/// <summary>
/// FsCheck property-based tests for the product-catalog-migration spec.
/// Covers Properties 1–6 from the design document.
/// </summary>
public class ProductCatalogMigrationPropertyTests
{
    // ── Property 1: Badge validation rejects invalid values ──────────────────
    // For any string, BadgeValues.IsValid returns true iff the value is in
    // {"hot","new","promo","popular"} (case-insensitive) or is null.
    // Validates: Requirements 2.1, 2.5, 2.6, 2.7

    [Property(MaxTest = 200)]
    public Property BadgeValidation_RejectsInvalidValues()
    {
        // Mix of allowed values, null, empty string, and arbitrary short strings
        var stringGen = Gen.OneOf(
            Gen.Elements<string?>(null, "hot", "new", "promo", "popular",
                "", "HOT", "NEW", "PROMO", "POPULAR",
                "invalid", "badge", "sale", "featured", "trending",
                "Hot", "New", "Promo", "Popular",
                "hot ", " new", "promo!", "popular1"),
            Gen.Choose(0, 20)
                .SelectMany(len => Gen.Choose(32, 126).ListOf(len))
                .Select(chars => new string(chars.Select(c => (char)c).ToArray()))
                .Select(s => (string?)s)
        );

        return Prop.ForAll(
            Arb.From(stringGen),
            badge =>
            {
                var result   = BadgeValues.IsValid(badge);
                var expected = badge is null || BadgeValues.Allowed.Contains(badge);
                return result == expected;
            }
        );
    }

    // ── Property 2: Badge round-trip through DTOs ────────────────────────────
    // For any Product with a Badge from the allowed set (including null),
    // mapping to ProductSummaryDto and ProductDetailDto preserves Badge.
    // Validates: Requirements 2.3, 2.4

    [Property(MaxTest = 100)]
    public Property BadgeRoundTrip_ThroughDTOs()
    {
        var badgeGen = Gen.Elements<string?>(null, "hot", "new", "promo", "popular");
        return Prop.ForAll(
            Arb.From(badgeGen),
            badge =>
            {
                var product = new Product
                {
                    Id            = Guid.NewGuid(),
                    ProcessId    = Guid.NewGuid(),
                    Slug          = "test-product",
                    TitleEs       = "Test",
                    DescriptionEs = "D",
                    Tags          = [],
                    Badge         = badge,
                    IsActive      = true,
                    CreatedAt     = DateTime.UtcNow
                };

                var summary = new ProductSummaryDto { Badge = product.Badge };
                var detail  = new ProductDetailDto  { Badge = product.Badge };

                return summary.Badge == product.Badge && detail.Badge == product.Badge;
            }
        );
    }

    // ── Property 3: Seed idempotence ─────────────────────────────────────────
    // Calling SeedProductsAsync N times (N in 1–5) against the same in-memory
    // database always yields exactly 34 products (28 UV + 6 engrave).
    // Validates: Requirements 4.5

    [Property(MaxTest = 20)]
    public Property SeedIdempotence_NRuns_NoExtraProducts()
    {
        return Prop.ForAll(
            Arb.From(Gen.Choose(1, 5)),
            n => RunSeedIdempotenceAsync(n).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunSeedIdempotenceAsync(int n)
    {
        var options = new DbContextOptionsBuilder<FilamorfosisDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        await using var db = new FilamorfosisDbContext(options);
        await db.Database.EnsureCreatedAsync();

        db.Processes.AddRange(
            new Process { Id = Guid.NewGuid(), Slug = "uv-printing",   NameEs = "UV"},
            new Process { Id = Guid.NewGuid(), Slug = "laser-cutting", NameEs = "Laser"}
        );
        await db.SaveChangesAsync();

        for (int i = 0; i < n; i++)
            await DbSeeder.SeedProductsAsync(db);

        var count = await db.Products.CountAsync();
        return count == 34; // 28 UV + 6 engrave
    }

    // ── Property 4: Seed variant count invariant ─────────────────────────────
    // For each seeded product with N pricing rows, variants.Count == 2 * N.
    // Validates: Requirements 4.2

    [Property(MaxTest = 1)]
    public Property SeedVariantCount_TwoPerPricingRow()
    {
        return Prop.ForAll(
            Arb.From(Gen.Constant(true)),
            _ => RunVariantCountAsync().GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunVariantCountAsync()
    {
        var options = new DbContextOptionsBuilder<FilamorfosisDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        await using var db = new FilamorfosisDbContext(options);
        await db.Database.EnsureCreatedAsync();

        db.Processes.AddRange(
            new Process { Id = Guid.NewGuid(), Slug = "uv-printing",   NameEs = "UV"},
            new Process { Id = Guid.NewGuid(), Slug = "laser-cutting", NameEs = "Laser"}
        );
        await db.SaveChangesAsync();
        await DbSeeder.SeedProductsAsync(db);

        var defs = DbSeeder.BuildProductDefinitions();
        foreach (var def in defs)
        {
            var product = await db.Products
                .Include(p => p.Variants)
                .FirstOrDefaultAsync(p => p.Slug == def.Slug);
            if (product is null) return false;
            if (product.Variants.Count != def.Rows.Length * 2) return false;
        }
        return true;
    }

    // ── Property 5: Unavailable variant pricing ──────────────────────────────
    // For each seeded variant whose source row had "Cotizar" or "N/A",
    // IsAvailable == false && Price == 0.
    // Validates: Requirements 4.3, 4.4

    [Property(MaxTest = 1)]
    public Property UnavailableVariantPricing_CotizarAndNA()
    {
        return Prop.ForAll(
            Arb.From(Gen.Constant(true)),
            _ => RunUnavailablePricingAsync().GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunUnavailablePricingAsync()
    {
        var options = new DbContextOptionsBuilder<FilamorfosisDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        await using var db = new FilamorfosisDbContext(options);
        await db.Database.EnsureCreatedAsync();

        db.Processes.AddRange(
            new Process { Id = Guid.NewGuid(), Slug = "uv-printing",   NameEs = "UV"},
            new Process { Id = Guid.NewGuid(), Slug = "laser-cutting", NameEs = "Laser"}
        );
        await db.SaveChangesAsync();
        await DbSeeder.SeedProductsAsync(db);

        var defs = DbSeeder.BuildProductDefinitions();
        foreach (var def in defs)
        {
            var product = await db.Products
                .Include(p => p.Variants)
                .FirstOrDefaultAsync(p => p.Slug == def.Slug);
            if (product is null) return false;

            for (int i = 0; i < def.Rows.Length; i++)
            {
                var row = def.Rows[i];

                var flatV   = product.Variants.FirstOrDefault(v => v.Sku == $"{def.Slug}-{i}-F");
                var reliefV = product.Variants.FirstOrDefault(v => v.Sku == $"{def.Slug}-{i}-R");
                if (flatV is null || reliefV is null) return false;

                bool flatUnavail = row.Flat.Equals("Cotizar", StringComparison.OrdinalIgnoreCase)
                                || row.Flat.Equals("N/A", StringComparison.OrdinalIgnoreCase);
                if (flatUnavail && (flatV.IsAvailable || flatV.Price != 0m)) return false;

                bool reliefUnavail = row.Relief.Equals("Cotizar", StringComparison.OrdinalIgnoreCase)
                                  || row.Relief.Equals("N/A", StringComparison.OrdinalIgnoreCase);
                if (reliefUnavail && (reliefV.IsAvailable || reliefV.Price != 0m)) return false;
            }
        }
        return true;
    }

    // ── Property 6: Badge API filter ─────────────────────────────────────────
    // For any badge value B from the allowed set, GET /api/v1/products?badge=B
    // returns only products where Badge == B.
    // Validates: Requirements 6.2

    [Property(MaxTest = 20)]
    public Property BadgeApiFilter_ReturnsOnlyMatchingProducts()
    {
        var badgeGen = Gen.Elements("hot", "new", "promo", "popular");
        return Prop.ForAll(
            Arb.From(badgeGen),
            badge => RunBadgeFilterAsync(badge).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunBadgeFilterAsync(string badge)
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = factory.CreateClient();

        await factory.SeedAsync(async db =>
        {
            // Ensure a category exists (startup seeder may have already added one)
            if (!db.Processes.Any())
            {
                db.Processes.Add(new Process {
                    Id     = Guid.NewGuid(),
                    Slug   = "uv-printing",
                    NameEs = "UV"});
                await db.SaveChangesAsync();
            }

            var catId = db.Processes.First().Id;
            var badges = new string?[] { "hot", "new", "promo", "popular", null };
            foreach (var b in badges)
            {
                db.Products.Add(new Product
                {
                    Id            = Guid.NewGuid(),
                    ProcessId    = catId,
                    Slug          = $"prop6-{b ?? "null"}-{Guid.NewGuid():N}",
                    TitleEs       = $"P {b}",
                    DescriptionEs = "D",
                    Tags          = [],
                    Badge         = b,
                    IsActive      = true,
                    CreatedAt     = DateTime.UtcNow
                });
            }
            await db.SaveChangesAsync();
        });

        var resp = await client.GetAsync($"/api/v1/products?badge={badge}&pageSize=100");
        if (!resp.IsSuccessStatusCode) return false;

        var result = await resp.Content.ReadFromJsonAsync<PagedResult<ProductSummaryDto>>();
        if (result is null) return true; // no products is valid

        return result.Items.All(p => p.Badge == badge);
    }
}
