// Feature: online-store, Property 3: Process product count accuracy

using System.Net.Http.Json;
using Filamorfosis.Application.DTOs;
using Filamorfosis.Domain.Entities;
using Filamorfosis.Infrastructure.Data;
using Filamorfosis.Tests.Infrastructure;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;
using Microsoft.Extensions.DependencyInjection;

namespace Filamorfosis.Tests;

/// <summary>
/// Property 3: Process product count accuracy
///
/// For any set of categories and products (some active, some inactive),
/// the productCount returned for each Process by GET /api/v1/categories
/// must equal the actual number of active (IsActive = true) products
/// assigned to that Process.
///
/// Validates: Requirements 1.3
/// </summary>
public class ProductCatalogPropertyTests
{
    // ── Generators ──────────────────────────────────────────────────────────

    /// <summary>
    /// Generates a non-empty list of 1–5 categories, each with 0–4 products
    /// where each product is independently active or inactive.
    /// </summary>
    private static Gen<List<Process>> CategoriesWithProductsGen()
    {
        var boolGen = Gen.Elements(new[] { true, false });

        return Gen.Choose(1, 5).SelectMany(catCount =>
        {
            var categoryGens = Enumerable.Range(0, catCount).Select(i =>
                Gen.Choose(0, 4).SelectMany(prodCount =>
                {
                    var productGens = Enumerable.Range(0, prodCount).Select(j =>
                        boolGen.Select(isActive =>
                        {
                            var productId = Guid.NewGuid();
                            return new Product
                            {
                                Id = productId,
                                Slug = $"product-{productId:N}",
                                TitleEs = $"Producto {j}",
                                TitleEn = $"Product {j}",
                                DescriptionEs = "Descripción",
                                DescriptionEn = "Description",
                                Tags = [],
                                ImageUrls = [],
                                IsActive = isActive,
                                CreatedAt = DateTime.UtcNow
                            };
                        })
                    );

                    return Gen.CollectToList(productGens).Select(products =>
                    {
                        var catId = Guid.NewGuid();
                        var Process = new Process
                        {
                            Id = catId,
                            Slug = $"cat-{catId:N}",
                            NameEs = $"Categoría {i}",
                            NameEn = $"Process {i}"
                        };
                        foreach (var p in products)
                        {
                            p.ProcessId = catId;
                            Process.Products.Add(p);
                        }
                        return Process;
                    });
                })
            );

            return Gen.CollectToList(categoryGens);
        });
    }

    // ── Property ─────────────────────────────────────────────────────────────

    [Property(MaxTest = 50, Arbitrary = new Type[] { })]
    public Property CategoryProductCount_MatchesActiveProductsInDb()
    {
        return Prop.ForAll(
            Arb.From(CategoriesWithProductsGen()),
            categories => RunPropertyAsync(categories).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunPropertyAsync(List<Process> categories)
    {
        await using var factory = new FilamorfosisWebFactory();

        // Seed categories and their products
        await factory.SeedAsync(async db =>
        {
            db.Processes.AddRange(categories);
            // Products are owned via navigation; add them explicitly too
            foreach (var cat in categories)
                db.Products.AddRange(cat.Products);
            await db.SaveChangesAsync();
        });

        // Call GET /api/v1/processes
        var client = factory.CreateClient();
        var response = await client.GetAsync("/api/v1/processes");

        if (!response.IsSuccessStatusCode)
            return false;

        var dtos = await response.Content.ReadFromJsonAsync<List<ProcessDto>>();
        if (dtos is null)
            return false;

        // For every seeded Process, verify productCount == count of active products
        foreach (var Process in categories)
        {
            var dto = dtos.FirstOrDefault(d => d.Id == Process.Id);
            if (dto is null)
                return false;

            var expectedCount = Process.Products.Count(p => p.IsActive);
            if (dto.ProductCount != expectedCount)
                return false;
        }

        return true;
    }
}

