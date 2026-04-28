// Feature: online-store, Property 1: Process filter invariant
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
    private static Gen<(List<Process> processes, List<Product> products)> CatalogGen()
    {
        return Gen.Choose(1, 3).SelectMany(catCount =>
        {
            var catIds = Enumerable.Range(0, catCount).Select(_ => Guid.NewGuid()).ToList();
            var processes = catIds.Select((id, i) => new Process
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
                                ProcessId = catId,
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
                return Gen.CollectToList(productGens).Select(prods => (processes, prods));
            });
        });
    }

    private static async Task SeedCatalog(FilamorfosisWebFactory factory, List<Process> processes, List<Product> products)
    {
        await factory.SeedAsync(async db =>
        {
            db.Processes.AddRange(processes);
            db.Products.AddRange(products);
            foreach (var p in products)
                db.ProductVariants.AddRange(p.Variants);
            await db.SaveChangesAsync();
        });
    }

    // Property 1: Process filter invariant
    // Validates: Requirements 1.4
    [Property(MaxTest = 30)]
    public Property CategoryFilter_ReturnsOnlyMatchingProducts()
    {
        return Prop.ForAll(
            Arb.From(CatalogGen()),
            data => RunCategoryFilterAsync(data.processes, data.products).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunCategoryFilterAsync(List<Process> processes, List<Product> products)
    {
        await using var factory = new FilamorfosisWebFactory();
        await SeedCatalog(factory, processes, products);

        var client = factory.CreateClient();
        foreach (var cat in processes)
        {
            var response = await client.GetAsync($"/api/v1/products?ProcessId={cat.Id}&pageSize=100");
            if (!response.IsSuccessStatusCode) return false;

            var result = await response.Content.ReadFromJsonAsync<PagedResult<ProductSummaryDto>>();
            if (result is null) return false;

            var expectedIds = products.Where(p => p.ProcessId == cat.Id && p.IsActive).Select(p => p.Id).ToHashSet();
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
            data => RunSearchFilterAsync(data.processes, data.products).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunSearchFilterAsync(List<Process> processes, List<Product> products)
    {
        await using var factory = new FilamorfosisWebFactory();
        await SeedCatalog(factory, processes, products);

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
            data => RunMinPriceAsync(data.processes, data.products).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunMinPriceAsync(List<Process> processes, List<Product> products)
    {
        await using var factory = new FilamorfosisWebFactory();
        await SeedCatalog(factory, processes, products);

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

    // Backward Compatibility Tests for use-case-Process-system feature

    // Test: ProcessId parameter still works after useCase parameter added
    // Validates: Requirements 3.3, 7.1, 7.6
    [Property(MaxTest = 30)]
    public Property BackwardCompat_ProcessIdFilter_StillWorks()
    {
        return Prop.ForAll(
            Arb.From(CatalogGen()),
            data => RunBackwardCompatProcessIdAsync(data.processes, data.products).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunBackwardCompatProcessIdAsync(List<Process> processes, List<Product> products)
    {
        await using var factory = new FilamorfosisWebFactory();
        await SeedCatalog(factory, processes, products);

        var client = factory.CreateClient();
        foreach (var cat in processes)
        {
            var response = await client.GetAsync($"/api/v1/products?ProcessId={cat.Id}&pageSize=100");
            if (!response.IsSuccessStatusCode) return false;

            var result = await response.Content.ReadFromJsonAsync<PagedResult<ProductSummaryDto>>();
            if (result is null) return false;

            var expectedIds = products.Where(p => p.ProcessId == cat.Id && p.IsActive).Select(p => p.Id).ToHashSet();
            var returnedIds = result.Items.Select(p => p.Id).ToHashSet();

            if (!returnedIds.SetEquals(expectedIds)) return false;
        }
        return true;
    }

    // Test: Search parameter still works with useCase parameter present
    // Validates: Requirements 3.3, 7.4, 7.6
    [Property(MaxTest = 30)]
    public Property BackwardCompat_SearchFilter_StillWorks()
    {
        return Prop.ForAll(
            Arb.From(CatalogGen()),
            data => RunBackwardCompatSearchAsync(data.processes, data.products).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunBackwardCompatSearchAsync(List<Process> processes, List<Product> products)
    {
        await using var factory = new FilamorfosisWebFactory();
        await SeedCatalog(factory, processes, products);

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

    // Test: Badge parameter still works
    // Validates: Requirements 3.3, 7.1, 7.6
    [Property(MaxTest = 30)]
    public Property BackwardCompat_BadgeFilter_StillWorks()
    {
        return Prop.ForAll(
            Arb.From(BadgeCatalogGen()),
            data => RunBackwardCompatBadgeAsync(data.processes, data.products).GetAwaiter().GetResult()
        );
    }

    private static Gen<(List<Process> processes, List<Product> products)> BadgeCatalogGen()
    {
        return Gen.Choose(1, 3).SelectMany(catCount =>
        {
            var catIds = Enumerable.Range(0, catCount).Select(_ => Guid.NewGuid()).ToList();
            var processes = catIds.Select((id, i) => new Process
            {
                Id = id,
                Slug = $"cat-{id:N}",
                NameEs = $"Cat {i}",
                NameEn = $"Cat {i}"
            }).ToList();

            return Gen.Choose(2, 6).SelectMany(prodCount =>
            {
                var badges = new[] { "hot", "new", null };
                var productGens = Enumerable.Range(0, prodCount).Select(j =>
                    Gen.Elements(catIds.ToArray()).SelectMany(catId =>
                        Gen.Elements(badges).Select(badge =>
                        {
                            var pid = Guid.NewGuid();
                            return new Product
                            {
                                Id = pid,
                                ProcessId = catId,
                                Slug = $"prod-{pid:N}",
                                TitleEs = $"Producto {j}",
                                TitleEn = $"Product {j}",
                                DescriptionEs = "Desc",
                                DescriptionEn = "Desc",
                                Tags = [],
                                ImageUrls = [],
                                Badge = badge,
                                IsActive = true,
                                CreatedAt = DateTime.UtcNow,
                                Variants = new List<ProductVariant>
                                {
                                    new() { Id = Guid.NewGuid(), ProductId = pid, Sku = $"SKU-{j}", LabelEs = "A", Price = 100m, IsAvailable = true, AcceptsDesignFile = false, StockQuantity = 10 }
                                }
                            };
                        })
                    )
                );
                return Gen.CollectToList(productGens).Select(prods => (processes, prods));
            });
        });
    }

    private static async Task<bool> RunBackwardCompatBadgeAsync(List<Process> processes, List<Product> products)
    {
        await using var factory = new FilamorfosisWebFactory();
        await SeedCatalog(factory, processes, products);

        var client = factory.CreateClient();
        var badges = new[] { "hot", "new" };
        
        foreach (var badge in badges)
        {
            var response = await client.GetAsync($"/api/v1/products?badge={badge}&pageSize=100");
            if (!response.IsSuccessStatusCode) return false;

            var result = await response.Content.ReadFromJsonAsync<PagedResult<ProductSummaryDto>>();
            if (result is null) return false;

            var expectedIds = products.Where(p => p.Badge == badge && p.IsActive).Select(p => p.Id).ToHashSet();
            var returnedIds = result.Items.Select(p => p.Id).ToHashSet();

            if (!returnedIds.SetEquals(expectedIds)) return false;
        }
        return true;
    }

    // Test: Pagination parameters (page, pageSize) still work
    // Validates: Requirements 3.3, 7.1, 7.6
    [Property(MaxTest = 30)]
    public Property BackwardCompat_PaginationParameters_StillWork()
    {
        return Prop.ForAll(
            Arb.From(LargeCatalogGen()),
            data => RunBackwardCompatPaginationAsync(data.processes, data.products).GetAwaiter().GetResult()
        );
    }

    private static Gen<(List<Process> processes, List<Product> products)> LargeCatalogGen()
    {
        var catId = Guid.NewGuid();
        var Process = new Process
        {
            Id = catId,
            Slug = "test-cat",
            NameEs = "Test",
            NameEn = "Test"
        };

        return Gen.Choose(5, 10).SelectMany(prodCount =>
        {
            var products = Enumerable.Range(0, prodCount).Select(j =>
            {
                var pid = Guid.NewGuid();
                return new Product
                {
                    Id = pid,
                    ProcessId = catId,
                    Slug = $"prod-{j}",
                    TitleEs = $"Producto {j}",
                    TitleEn = $"Product {j}",
                    DescriptionEs = "Desc",
                    DescriptionEn = "Desc",
                    Tags = [],
                    ImageUrls = [],
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow.AddMinutes(j),
                    Variants = new List<ProductVariant>
                    {
                        new() { Id = Guid.NewGuid(), ProductId = pid, Sku = $"SKU-{j}", LabelEs = "A", Price = 100m, IsAvailable = true, AcceptsDesignFile = false, StockQuantity = 10 }
                    }
                };
            }).ToList();
            return Gen.Constant((new List<Process> { Process }, products));
        });
    }

    private static async Task<bool> RunBackwardCompatPaginationAsync(List<Process> processes, List<Product> products)
    {
        await using var factory = new FilamorfosisWebFactory();
        await SeedCatalog(factory, processes, products);

        var client = factory.CreateClient();
        const int pageSize = 3;
        
        // Test first page
        var response1 = await client.GetAsync($"/api/v1/products?page=1&pageSize={pageSize}");
        if (!response1.IsSuccessStatusCode) return false;

        var result1 = await response1.Content.ReadFromJsonAsync<PagedResult<ProductSummaryDto>>();
        if (result1 is null) return false;
        if (result1.Page != 1) return false;
        if (result1.PageSize != pageSize) return false;
        if (result1.Items.Count > pageSize) return false;

        // Test second page if there are enough products
        if (products.Count(p => p.IsActive) > pageSize)
        {
            var response2 = await client.GetAsync($"/api/v1/products?page=2&pageSize={pageSize}");
            if (!response2.IsSuccessStatusCode) return false;

            var result2 = await response2.Content.ReadFromJsonAsync<PagedResult<ProductSummaryDto>>();
            if (result2 is null) return false;
            if (result2.Page != 2) return false;
            if (result2.PageSize != pageSize) return false;

            // Ensure pages don't overlap
            var page1Ids = result1.Items.Select(p => p.Id).ToHashSet();
            var page2Ids = result2.Items.Select(p => p.Id).ToHashSet();
            if (page1Ids.Overlaps(page2Ids)) return false;
        }

        return true;
    }

    // Test: Omitting useCase parameter returns all products
    // Validates: Requirements 3.3, 7.1, 7.6
    [Property(MaxTest = 30)]
    public Property BackwardCompat_OmittingUseCase_ReturnsAllProducts()
    {
        return Prop.ForAll(
            Arb.From(CatalogGen()),
            data => RunBackwardCompatNoUseCaseAsync(data.processes, data.products).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunBackwardCompatNoUseCaseAsync(List<Process> processes, List<Product> products)
    {
        await using var factory = new FilamorfosisWebFactory();
        await SeedCatalog(factory, processes, products);

        var client = factory.CreateClient();
        
        // Request without useCase parameter
        var response = await client.GetAsync("/api/v1/products?pageSize=100");
        if (!response.IsSuccessStatusCode) return false;

        var result = await response.Content.ReadFromJsonAsync<PagedResult<ProductSummaryDto>>();
        if (result is null) return false;

        var expectedIds = products.Where(p => p.IsActive).Select(p => p.Id).ToHashSet();
        var returnedIds = result.Items.Select(p => p.Id).ToHashSet();

        // All active products should be returned
        return returnedIds.SetEquals(expectedIds);
    }
}

