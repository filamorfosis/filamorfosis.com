// Feature: use-case-category-system
// Task 3.3: Verify backward compatibility with existing parameters
// Validates: Requirements 3.3, 7.1, 7.6

using System.Net.Http.Json;
using Filamorfosis.Application.DTOs;
using Filamorfosis.Domain.Entities;
using Filamorfosis.Tests.Infrastructure;
using Xunit;

namespace Filamorfosis.Tests;

public class BackwardCompatibilityTests
{
    [Fact]
    public async Task ProcessIdParameter_StillWorks_AfterUseCaseAdded()
    {
        // Arrange
        await using var factory = new FilamorfosisWebFactory();
        var catId = Guid.NewGuid();
        var category = new Process {
            Id = catId,
            Slug = "test-cat",
            NameEs = "Test Category"};

        var product1 = new Product
        {
            Id = Guid.NewGuid(),
            ProcessId = catId,
            Slug = "prod-1",
            TitleEs = "Producto 1",
            DescriptionEs = "Desc",
            Tags = [],
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UseCases = ["gifts"],
            Variants = []
        };

        var product2 = new Product
        {
            Id = Guid.NewGuid(),
            ProcessId = Guid.NewGuid(), // Different category
            Slug = "prod-2",
            TitleEs = "Producto 2",
            DescriptionEs = "Desc",
            Tags = [],
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UseCases = ["drinkware"],
            Variants = []
        };

        await factory.SeedAsync(async db =>
        {
            db.Processes.Add(category);
            db.Products.AddRange(product1, product2);
            await db.SaveChangesAsync();
        });

        var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync($"/api/v1/products?ProcessId={catId}&pageSize=100");

        // Assert
        Assert.True(response.IsSuccessStatusCode);
        var result = await response.Content.ReadFromJsonAsync<PagedResult<ProductSummaryDto>>();
        Assert.NotNull(result);
        Assert.Single(result.Items);
        Assert.Equal(product1.Id, result.Items[0].Id);
    }

    [Fact]
    public async Task SearchParameter_StillWorks_AfterUseCaseAdded()
    {
        // Arrange
        await using var factory = new FilamorfosisWebFactory();
        var catId = Guid.NewGuid();

        var product1 = new Product
        {
            Id = Guid.NewGuid(),
            ProcessId = catId,
            Slug = "prod-1",
            TitleEs = "Taza Personalizada",
            DescriptionEs = "Desc",
            Tags = [],
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UseCases = ["gifts"],
            Variants = []
        };

        var product2 = new Product
        {
            Id = Guid.NewGuid(),
            ProcessId = catId,
            Slug = "prod-2",
            TitleEs = "Vaso Térmico",
            DescriptionEs = "Desc",
            Tags = [],
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UseCases = ["drinkware"],
            Variants = []
        };

        await factory.SeedAsync(async db =>
        {
            db.Products.AddRange(product1, product2);
            await db.SaveChangesAsync();
        });

        var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/v1/products?search=Taza&pageSize=100");

        // Assert
        Assert.True(response.IsSuccessStatusCode);
        var result = await response.Content.ReadFromJsonAsync<PagedResult<ProductSummaryDto>>();
        Assert.NotNull(result);
        
        // Should contain our test product (may also contain seeded products with "Taza" in the name)
        Assert.Contains(result.Items, p => p.Id == product1.Id);
    }

    [Fact]
    public async Task BadgeParameter_StillWorks_AfterUseCaseAdded()
    {
        // Arrange
        await using var factory = new FilamorfosisWebFactory();
        var catId = Guid.NewGuid();

        var product1 = new Product
        {
            Id = Guid.NewGuid(),
            ProcessId = catId,
            Slug = "prod-1",
            TitleEs = "Producto Hot",
            DescriptionEs = "Desc",
            Tags = [],
            Badge = "hot",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UseCases = ["gifts"],
            Variants = []
        };

        var product2 = new Product
        {
            Id = Guid.NewGuid(),
            ProcessId = catId,
            Slug = "prod-2",
            TitleEs = "Producto New",
            DescriptionEs = "Desc",
            Tags = [],
            Badge = "new",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UseCases = ["drinkware"],
            Variants = []
        };

        await factory.SeedAsync(async db =>
        {
            db.Products.AddRange(product1, product2);
            await db.SaveChangesAsync();
        });

        var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/v1/products?badge=hot&pageSize=100");

        // Assert
        Assert.True(response.IsSuccessStatusCode);
        var result = await response.Content.ReadFromJsonAsync<PagedResult<ProductSummaryDto>>();
        Assert.NotNull(result);
        
        // Should contain our test product (may also contain seeded products with "hot" badge)
        Assert.Contains(result.Items, p => p.Id == product1.Id);
        Assert.Equal("hot", result.Items.First(p => p.Id == product1.Id).Badge);
    }

    [Fact]
    public async Task PaginationParameters_StillWork_AfterUseCaseAdded()
    {
        // Arrange
        await using var factory = new FilamorfosisWebFactory();
        var catId = Guid.NewGuid();

        var products = Enumerable.Range(0, 10).Select(i => new Product
        {
            Id = Guid.NewGuid(),
            ProcessId = catId,
            Slug = $"prod-{i}",
            TitleEs = $"Producto {i}",
            DescriptionEs = "Desc",
            Tags = [],
            IsActive = true,
            CreatedAt = DateTime.UtcNow.AddMinutes(i),
            UseCases = ["gifts"],
            Variants = []
        }).ToList();

        await factory.SeedAsync(async db =>
        {
            db.Products.AddRange(products);
            await db.SaveChangesAsync();
        });

        var client = factory.CreateClient();

        // Act - Page 1
        var response1 = await client.GetAsync("/api/v1/products?page=1&pageSize=3");
        Assert.True(response1.IsSuccessStatusCode);
        var result1 = await response1.Content.ReadFromJsonAsync<PagedResult<ProductSummaryDto>>();
        Assert.NotNull(result1);

        // Act - Page 2
        var response2 = await client.GetAsync("/api/v1/products?page=2&pageSize=3");
        Assert.True(response2.IsSuccessStatusCode);
        var result2 = await response2.Content.ReadFromJsonAsync<PagedResult<ProductSummaryDto>>();
        Assert.NotNull(result2);

        // Assert
        Assert.Equal(1, result1.Page);
        Assert.Equal(3, result1.PageSize);
        Assert.Equal(3, result1.Items.Count);

        Assert.Equal(2, result2.Page);
        Assert.Equal(3, result2.PageSize);
        Assert.Equal(3, result2.Items.Count);

        // Ensure pages don't overlap
        var page1Ids = result1.Items.Select(p => p.Id).ToHashSet();
        var page2Ids = result2.Items.Select(p => p.Id).ToHashSet();
        Assert.Empty(page1Ids.Intersect(page2Ids));
    }

    [Fact]
    public async Task OmittingUseCaseParameter_ReturnsAllProducts()
    {
        // Arrange
        await using var factory = new FilamorfosisWebFactory();
        var catId = Guid.NewGuid();

        var product1 = new Product
        {
            Id = Guid.NewGuid(),
            ProcessId = catId,
            Slug = "prod-1",
            TitleEs = "Producto 1",
            DescriptionEs = "Desc",
            Tags = [],
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UseCases = ["gifts"],
            Variants = []
        };

        var product2 = new Product
        {
            Id = Guid.NewGuid(),
            ProcessId = catId,
            Slug = "prod-2",
            TitleEs = "Producto 2",
            DescriptionEs = "Desc",
            Tags = [],
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UseCases = ["drinkware"],
            Variants = []
        };

        var product3 = new Product
        {
            Id = Guid.NewGuid(),
            ProcessId = catId,
            Slug = "prod-3",
            TitleEs = "Producto 3",
            DescriptionEs = "Desc",
            Tags = [],
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UseCases = ["business"],
            Variants = []
        };

        await factory.SeedAsync(async db =>
        {
            db.Products.AddRange(product1, product2, product3);
            await db.SaveChangesAsync();
        });

        var client = factory.CreateClient();

        // Act - Request without useCase parameter
        var response = await client.GetAsync("/api/v1/products?pageSize=100");

        // Assert
        Assert.True(response.IsSuccessStatusCode);
        var result = await response.Content.ReadFromJsonAsync<PagedResult<ProductSummaryDto>>();
        Assert.NotNull(result);
        
        // Should return all 3 products (plus any seeded by DbSeeder)
        var ourProductIds = new[] { product1.Id, product2.Id, product3.Id };
        var returnedIds = result.Items.Select(p => p.Id).ToHashSet();
        
        Assert.True(ourProductIds.All(id => returnedIds.Contains(id)), 
            "All test products should be returned when useCase parameter is omitted");
    }

    [Fact]
    public async Task CombinedFilters_ProcessIdAndBadge_StillWork()
    {
        // Arrange
        await using var factory = new FilamorfosisWebFactory();
        var catId1 = Guid.NewGuid();
        var catId2 = Guid.NewGuid();

        var product1 = new Product
        {
            Id = Guid.NewGuid(),
            ProcessId = catId1,
            Slug = "prod-1",
            TitleEs = "Producto 1",
            DescriptionEs = "Desc",
            Tags = [],
            Badge = "hot",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UseCases = ["gifts"],
            Variants = []
        };

        var product2 = new Product
        {
            Id = Guid.NewGuid(),
            ProcessId = catId1,
            Slug = "prod-2",
            TitleEs = "Producto 2",
            DescriptionEs = "Desc",
            Tags = [],
            Badge = "new",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UseCases = ["drinkware"],
            Variants = []
        };

        var product3 = new Product
        {
            Id = Guid.NewGuid(),
            ProcessId = catId2,
            Slug = "prod-3",
            TitleEs = "Producto 3",
            DescriptionEs = "Desc",
            Tags = [],
            Badge = "hot",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UseCases = ["business"],
            Variants = []
        };

        await factory.SeedAsync(async db =>
        {
            db.Products.AddRange(product1, product2, product3);
            await db.SaveChangesAsync();
        });

        var client = factory.CreateClient();

        // Act - Filter by ProcessId AND badge
        var response = await client.GetAsync($"/api/v1/products?ProcessId={catId1}&badge=hot&pageSize=100");

        // Assert
        Assert.True(response.IsSuccessStatusCode);
        var result = await response.Content.ReadFromJsonAsync<PagedResult<ProductSummaryDto>>();
        Assert.NotNull(result);
        Assert.Single(result.Items);
        Assert.Equal(product1.Id, result.Items[0].Id);
    }
}
