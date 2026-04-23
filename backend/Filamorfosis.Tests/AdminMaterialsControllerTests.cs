// Feature: cost-management-and-pricing, Property 11: GET /admin/materials returns records ordered by Name ascending; ?category=X returns only matching records still ordered by Name

using System.Net;
using System.Net.Http.Json;
using Filamorfosis.Application.DTOs;
using Filamorfosis.Domain.Entities;
using Filamorfosis.Tests.Infrastructure;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;

namespace Filamorfosis.Tests;

/// <summary>
/// Property-based tests for AdminMaterialsController.
/// Covers Property 11 from the cost-management-and-pricing spec.
/// Validates: Requirements 2.1, 2.11
/// </summary>
public class AdminMaterialsControllerTests
{
    // ── Generators ────────────────────────────────────────────────────────────

    private static readonly string[] PrintingCategories =
        ["UV Printing", "3D Printing", "Laser Engraving", "Laser Cutting", "Photo Printing"];

    /// <summary>Generates a non-empty material name using letters a-z, 3–20 chars.</summary>
    private static Gen<string> MaterialNameGen() =>
        Gen.Choose(3, 20).SelectMany(len =>
            Gen.Choose(0, 25)
               .ArrayOf(len)
               .Select(chars => new string(chars.Select(c => (char)('a' + c)).ToArray())));

    /// <summary>Generates one of the five valid printing categories.</summary>
    private static Gen<string> CategoryGen() =>
        Gen.Elements(PrintingCategories);

    /// <summary>
    /// Generates a list of 2–8 (name, category) pairs for seeding materials.
    /// Names are made unique by appending a GUID suffix at seed time.
    /// </summary>
    private static Gen<List<(string name, string category)>> MaterialListGen() =>
        Gen.Choose(2, 8).SelectMany(count =>
            MaterialNameGen().SelectMany(name =>
            CategoryGen().Select(cat => (name, cat)))
            .ListOf(count)
            .Select(items => items.ToList()));

    // ── Property 11a: GET /admin/materials returns records ordered by Name ascending ──
    // Validates: Requirements 2.1

    [Property(MaxTest = 20)]
    public Property MaterialList_IsOrderedByNameAscending()
    {
        return Prop.ForAll(
            Arb.From(MaterialListGen()),
            materials => RunOrderingPropertyAsync(materials).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunOrderingPropertyAsync(List<(string name, string category)> materials)
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        // Seed materials directly via DB with unique names
        await factory.SeedAsync(async db =>
        {
            foreach (var (name, category) in materials)
            {
                var catId = Guid.NewGuid();
                db.Categories.Add(new Category
                {
                    Id = catId,
                    Slug = $"mat-cat-{catId:N}",
                    NameEs = category,
                    NameEn = category
                });
                db.Materials.Add(new Material
                {
                    Id = Guid.NewGuid(),
                    Name = $"{name}-{Guid.NewGuid():N}",
                    CategoryId = catId,
                    BaseCost = 10m,
                    CreatedAt = DateTime.UtcNow
                });
            }
            await db.SaveChangesAsync();
        });

        var resp = await client.GetAsync("/api/v1/admin/materials");
        if (!resp.IsSuccessStatusCode) return false;

        var result = await resp.Content.ReadFromJsonAsync<List<MaterialDto>>();
        if (result is null || result.Count == 0) return false;

        // Verify ordering: each item's Name must be <= the next item's Name
        for (var i = 0; i < result.Count - 1; i++)
        {
            if (string.Compare(result[i].Name, result[i + 1].Name, StringComparison.Ordinal) > 0)
                return false;
        }

        return true;
    }

    // ── Property 11b: GET /admin/materials?category=X returns only matching records, ordered by Name ──
    // Validates: Requirements 2.11

    [Property(MaxTest = 20)]
    public Property MaterialList_CategoryFilter_ReturnsOnlyMatchingRecordsOrderedByName()
    {
        return Prop.ForAll(
            Arb.From(MaterialListGen()),
            Arb.From(CategoryGen()),
            (materials, filterCategory) =>
                RunCategoryFilterPropertyAsync(materials, filterCategory).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunCategoryFilterPropertyAsync(
        List<(string name, string category)> materials,
        string filterCategory)
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        // Track which names belong to the filter category
        var expectedNames = new List<string>();
        Guid? filterCategoryId = null;

        await factory.SeedAsync(async db =>
        {
            // Create one Category entity per distinct category name
            var categoryMap = new Dictionary<string, Guid>();
            foreach (var (name, category) in materials)
            {
                if (!categoryMap.ContainsKey(category))
                {
                    var catId = Guid.NewGuid();
                    db.Categories.Add(new Category
                    {
                        Id = catId,
                        Slug = $"filt-cat-{catId:N}",
                        NameEs = category,
                        NameEn = category
                    });
                    categoryMap[category] = catId;
                }
            }

            if (!categoryMap.ContainsKey(filterCategory))
            {
                var catId = Guid.NewGuid();
                db.Categories.Add(new Category
                {
                    Id = catId,
                    Slug = $"filt-cat-{catId:N}",
                    NameEs = filterCategory,
                    NameEn = filterCategory
                });
                categoryMap[filterCategory] = catId;
            }

            filterCategoryId = categoryMap[filterCategory];

            foreach (var (name, category) in materials)
            {
                var uniqueName = $"{name}-{Guid.NewGuid():N}";
                db.Materials.Add(new Material
                {
                    Id = Guid.NewGuid(),
                    Name = uniqueName,
                    CategoryId = categoryMap[category],
                    BaseCost = 10m,
                    CreatedAt = DateTime.UtcNow
                });

                if (category == filterCategory)
                    expectedNames.Add(uniqueName);
            }
            await db.SaveChangesAsync();
        });

        var resp = await client.GetAsync($"/api/v1/admin/materials?categoryId={filterCategoryId}");
        if (!resp.IsSuccessStatusCode) return false;

        var result = await resp.Content.ReadFromJsonAsync<List<MaterialDto>>();
        if (result is null) return false;

        // All returned records must belong to the filter category
        if (result.Any(m => m.CategoryId != filterCategoryId))
            return false;

        // The count must match what we seeded for that category
        if (result.Count != expectedNames.Count)
            return false;

        // Results must be ordered by Name ascending
        for (var i = 0; i < result.Count - 1; i++)
        {
            if (string.Compare(result[i].Name, result[i + 1].Name, StringComparison.Ordinal) > 0)
                return false;
        }

        return true;
    }
}
