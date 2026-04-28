// Feature: admin-store-management, Property 5: Process data round-trip
// Feature: admin-store-management, Property 6: Process delete conflict

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
/// Property-based tests for the AdminProcessesController.
/// Covers Properties 5 and 6 from the admin-store-management spec.
/// </summary>
public class AdminProcessPropertyTests
{
    // ── Generators ────────────────────────────────────────────────────────────

    /// <summary>Generates a slug-safe string: lowercase letters and digits, 3–16 chars.</summary>
    private static Gen<string> SlugGen() =>
        Gen.Choose(3, 16).SelectMany(len =>
            Gen.Choose(0, 35)
               .ArrayOf(len)
               .Select(chars => new string(chars.Select(c => c < 26 ? (char)('a' + c) : (char)('0' + c - 26)).ToArray())));

    /// <summary>Generates a non-empty display name, 3–20 chars.</summary>
    private static Gen<string> NameGen() =>
        Gen.Choose(3, 20).SelectMany(len =>
            Gen.Choose(0, 25)
               .ArrayOf(len)
               .Select(chars => new string(chars.Select(c => (char)('a' + c)).ToArray())));

    // ── Property 5: Process data round-trip ─────────────────────────────────
    // For any valid { slug, nameEs, nameEn } payload, create then fetch and assert
    // that the stored values exactly match the submitted values.
    // Validates: Requirements 2.2, 2.3

    [Property(MaxTest = 20)]
    public Property ProcessCreate_RoundTrip_ExactFieldMatch()
    {
        return Prop.ForAll(
            Arb.From(SlugGen()),
            Arb.From(NameGen()),
            Arb.From(NameGen()),
            (slug, nameEs, nameEn) =>
                RunCategoryRoundTripAsync(slug, nameEs, nameEn).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunCategoryRoundTripAsync(string slug, string nameEs, string nameEn)
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        // Make the slug unique across parallel test runs
        var uniqueSlug = $"{slug}-{Guid.NewGuid():N}";

        // Create
        var createResp = await client.PostAsJsonAsync("/api/v1/admin/processes",
            new CreateProcessRequest
            {
                Slug = uniqueSlug,
                NameEs = nameEs,
                NameEn = nameEn,
                ImageUrl = null
            });

        if (createResp.StatusCode != HttpStatusCode.Created) return false;

        var created = await createResp.Content.ReadFromJsonAsync<ProcessDto>();
        if (created is null) return false;

        // Fetch all processes and find the one we just created
        var listResp = await client.GetAsync("/api/v1/admin/processes");
        if (!listResp.IsSuccessStatusCode) return false;

        var categories = await listResp.Content.ReadFromJsonAsync<List<ProcessDto>>();
        if (categories is null) return false;

        var fetched = categories.FirstOrDefault(c => c.Id == created.Id);
        if (fetched is null) return false;

        // Assert exact field match
        return fetched.Slug == uniqueSlug
            && fetched.NameEs == nameEs
            && fetched.NameEn == nameEn;
    }

    // ── Property 6: Process delete conflict ─────────────────────────────────
    // For any process that has ≥1 active product assigned to it,
    // DELETE /api/v1/admin/processes/{id} SHALL return 409 Conflict.
    // Validates: Requirements 2.5

    [Property(MaxTest = 10)]
    public Property ProcessDelete_WithActiveProducts_Returns409()
    {
        return Prop.ForAll(
            Arb.From(Gen.Choose(1, 5)),   // number of active products (1–5)
            productCount =>
                RunCategoryDeleteConflictAsync(productCount).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunCategoryDeleteConflictAsync(int productCount)
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        // Seed a process with the given number of active products directly via DB
        Guid catId = Guid.Empty;
        await factory.SeedAsync(async db =>
        {
            catId = Guid.NewGuid();
            db.Processes.Add(new Process {
                Id = catId,
                Slug = $"conflict-cat-{Guid.NewGuid():N}",
                NameEs = "CatConflicto",
                NameEn = "ConflictCat",
                IsActive = true
            });

            for (var i = 0; i < productCount; i++)
            {
                db.Products.Add(new Product
                {
                    Id = Guid.NewGuid(),
                    ProcessId = catId,
                    Slug = $"prod-{Guid.NewGuid():N}",
                    TitleEs = $"Producto {i}",
                    TitleEn = $"Product {i}",
                    DescriptionEs = "Descripción",
                    DescriptionEn = "Description",
                    Tags = [],
                    ImageUrls = [],
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                });
            }

            await db.SaveChangesAsync();
        });

        // Attempt to delete the category — must return 409
        var deleteResp = await client.DeleteAsync($"/api/v1/admin/processes/{catId}");
        return deleteResp.StatusCode == HttpStatusCode.Conflict;
    }
}
