// Feature: online-store, Property 1: Category filter invariant
// Feature: online-store, Property 2: Search filter invariant
// Feature: online-store, Property 4: Minimum variant price display

using System.Net.Http.Json;
using Filamorfosis.Application.DTOs;
using Filamorfosis.Domain.Entities;
using Filamorfosis.Tests.Infrastructure;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;

namespace Filamorfosis.Tests;

public class ProductFilterPropertyTests
{
    private static Gen<(List<Category> categories, List<Product> products)> CatalogGen()
    {
        return Gen.Choose(1, 3).SelectMany(catCount =>
        {
            var catIds = Enumerable.Range(0, catCount).Select(_ => Guid.NewGuid()).ToList();
            var categories = catIds.Select((id, i) => new Category
            {
                Id = id,
                Slug = $"cat-{id:N}",
                NameEs = $"Cat {i}",
                NameEn = $"Cat {i}"
            }).ToList();

            return Gen.Choose(1, 6).SelectMany(prodCount =>
            {
                var productGens = Enumerable.Range(0, prodCount).Select(j =>
                    Gen.Elements(catIds.ToArray()).SelectMany(catId =>
                        Gen.Elements(new[] { true, false }).Select(isActive =>
                        {
                            var pid = Guid.NewGuid();
                            var suffix = $"alpha-{j}";
                            return new Product
                            {
                                Id = pid,
                                CategoryId = catId,
                                Slug = $"prod-{pid:N}",
                                TitleEs = $"Producto {suffix}",
                                TitleEn = $"Product {suffix}",
                                DescriptionEs = "Desc",
                                DescriptionEn = "Desc",
                                Tags = [],
                                ImageUrls = [],
                                IsActive = isActive,
                                CreatedAt = DateTime.UtcNow,
                                Variants = new List<ProductVariant>
                                {
                                    new() { Id = Guid.NewGuid(), ProductId = pid, Sku = $"SKU-{j}-A", LabelEs = "A", Price = (j + 1) * 100m, IsAvailable = true, AcceptsDesignFile = false, StockQuantity = 10 },
                                    new() { Id = Guid.NewGuid(), ProductId = pid, Sku = $"SKU-{j}-B", LabelEs = "B", Price = (j + 1) * 150m, IsAvailable = true, AcceptsDesignFile = false, StockQuantity = 5 }
                                }
                            };
                        })
                    )
                );
                return Gen.CollectToList(productGens).Select(prods => (categories, prods));
            });
        });
    }

    private static async Task SeedCatalog(FilamorfosisWebFactory factory, List<Category> categories, List<Product> products)
    {
        await factory.SeedAsync(async db =>
        {
            db.Categories.AddRange(categories);
            db.Products.AddRange(products);
            foreach (var p in products)
                db.ProductVariants.AddRange(p.Variants);
            await db.SaveChangesAsync();
        });
    }

    // Property 1: Category filter invariant
    // Validates: Requirements 1.4
    [Property(MaxTest = 30)]
    public Property CategoryFilter_ReturnsOnlyMatchingProducts()
    {
        return Prop.ForAll(
            Arb.From(CatalogGen()),
            data => RunCategoryFilterAsync(data.categories, data.products).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunCategoryFilterAsync(List<Category> categories, List<Product> products)
    {
        await using var factory = new FilamorfosisWebFactory();
        await SeedCatalog(factory, categories, products);

        var client = factory.CreateClient();
        foreach (var cat in categories)
        {
            var response = await client.GetAsync($"/api/v1/products?categoryId={cat.Id}&pageSize=100");
            if (!response.IsSuccessStatusCode) return false;

            var result = await response.Content.ReadFromJsonAsync<PagedResult<ProductSummaryDto>>();
            if (result is null) return false;

            var expectedIds = products.Where(p => p.CategoryId == cat.Id && p.IsActive).Select(p => p.Id).ToHashSet();
            var returnedIds = result.Items.Select(p => p.Id).ToHashSet();

            if (!returnedIds.IsSubsetOf(expectedIds)) return false;
            if (!expectedIds.IsSubsetOf(returnedIds)) return false;
        }
        return true;
    }

    // Property 2: Search filter invariant
    // Validates: Requirements 1.5
    [Property(MaxTest = 30)]
    public Property SearchFilter_ReturnsOnlyMatchingProducts()
    {
        return Prop.ForAll(
            Arb.From(CatalogGen()),
            data => RunSearchFilterAsync(data.categories, data.products).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunSearchFilterAsync(List<Category> categories, List<Product> products)
    {
        await using var factory = new FilamorfosisWebFactory();
        await SeedCatalog(factory, categories, products);

        var client = factory.CreateClient();
        const string term = "alpha";
        var response = await client.GetAsync($"/api/v1/products?search={term}&pageSize=100");
        if (!response.IsSuccessStatusCode) return false;

        var result = await response.Content.ReadFromJsonAsync<PagedResult<ProductSummaryDto>>();
        if (result is null) return false;

        var expectedIds = products
            .Where(p => p.IsActive && (
                p.TitleEs.Contains(term, StringComparison.OrdinalIgnoreCase) ||
                p.TitleEn.Contains(term, StringComparison.OrdinalIgnoreCase) ||
                p.DescriptionEs.Contains(term, StringComparison.OrdinalIgnoreCase) ||
                p.DescriptionEn.Contains(term, StringComparison.OrdinalIgnoreCase)))
            .Select(p => p.Id).ToHashSet();

        var returnedIds = result.Items.Select(p => p.Id).ToHashSet();
        return returnedIds.SetEquals(expectedIds);
    }

    // Property 4: Minimum variant price display
    // Validates: Requirements 1.7
    [Property(MaxTest = 30)]
    public Property DesdePrice_IsMinimumAvailableVariantPrice()
    {
        return Prop.ForAll(
            Arb.From(CatalogGen()),
            data => RunMinPriceAsync(data.categories, data.products).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunMinPriceAsync(List<Category> categories, List<Product> products)
    {
        await using var factory = new FilamorfosisWebFactory();
        await SeedCatalog(factory, categories, products);

        var client = factory.CreateClient();
        var response = await client.GetAsync("/api/v1/products?pageSize=100");
        if (!response.IsSuccessStatusCode) return false;

        var result = await response.Content.ReadFromJsonAsync<PagedResult<ProductSummaryDto>>();
        if (result is null) return false;

        foreach (var dto in result.Items)
        {
            // Skip products seeded by DbSeeder (not in our test data)
            var product = products.FirstOrDefault(p => p.Id == dto.Id);
            if (product is null) continue;

            var expectedMin = product.Variants.Where(v => v.IsAvailable).Any()
                ? product.Variants.Where(v => v.IsAvailable).Min(v => v.Price)
                : 0m;
            if (dto.BasePrice != expectedMin) return false;
        }
        return true;
    }
}
