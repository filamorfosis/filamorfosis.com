using System.Net.Http.Json;
using Filamorfosis.Application.DTOs;
using Filamorfosis.Domain.Entities;
using Filamorfosis.Infrastructure.Data;
using Filamorfosis.Tests.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Filamorfosis.Tests;

/// <summary>
/// Integration tests for product category assignment endpoints in AdminProductsController.
/// Validates: Requirements 8.6, 8.8, 8.9
/// </summary>
public class AdminProductCategoryAssignmentTests
{
    /// <summary>
    /// Test: GET /api/v1/admin/products/{id}/categories returns assigned categories.
    /// Validates: Requirements 8.6, 8.8, 8.9
    /// </summary>
    [Fact]
    public async Task GetProductCategories_ReturnsAssignedCategories()
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        // Arrange: Create a product and categories
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<FilamorfosisDbContext>();

        // Get an existing process for the product
        var process = await db.Processes.FirstAsync();

        // Create a test product
        var product = new Product
        {
            Id = Guid.NewGuid(),
            ProcessId = process.Id,
            Slug = "test-product-categories",
            TitleEs = "Producto de Prueba",
            DescriptionEs = "Descripción de prueba",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        db.Products.Add(product);
        await db.SaveChangesAsync();

        // Get some existing categories from seed data
        var categories = await db.ProductCategories
            .Where(c => c.IsActive)
            .Take(2)
            .ToListAsync();

        Assert.True(categories.Count >= 2, "Should have at least 2 seeded categories");

        // Assign categories to the product
        foreach (var category in categories)
        {
            db.ProductCategoryAssignments.Add(new ProductCategoryAssignment
            {
                ProductId = product.Id,
                CategoryId = category.Id
            });
        }
        await db.SaveChangesAsync();

        // Act: GET /api/v1/admin/products/{id}/categories
        var response = await client.GetAsync($"/api/v1/admin/products/{product.Id}/categories");

        // Assert: Response is successful
        Assert.True(response.IsSuccessStatusCode, $"Expected success status code, got {response.StatusCode}");

        var result = await response.Content.ReadFromJsonAsync<List<CategoryDto>>();
        Assert.NotNull(result);

        // Assert: Returns the assigned categories
        Assert.Equal(2, result.Count);
        Assert.Contains(result, c => c.Id == categories[0].Id);
        Assert.Contains(result, c => c.Id == categories[1].Id);

        // Assert: Categories have all required fields
        foreach (var categoryDto in result)
        {
            Assert.NotEqual(Guid.Empty, categoryDto.Id);
            Assert.NotEmpty(categoryDto.NameEs);
            Assert.NotEmpty(categoryDto.NameEn);
            Assert.NotEmpty(categoryDto.Slug);
        }
    }

    /// <summary>
    /// Test: GET /api/v1/admin/products/{id}/categories returns empty list when no categories assigned.
    /// Validates: Requirements 8.6, 8.8, 8.9
    /// </summary>
    [Fact]
    public async Task GetProductCategories_ReturnsEmptyList_WhenNoCategoriesAssigned()
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        // Arrange: Create a product without category assignments
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<FilamorfosisDbContext>();

        var process = await db.Processes.FirstAsync();

        var product = new Product
        {
            Id = Guid.NewGuid(),
            ProcessId = process.Id,
            Slug = "test-product-no-categories",
            TitleEs = "Producto Sin Categorías",
            DescriptionEs = "Producto sin categorías asignadas",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        db.Products.Add(product);
        await db.SaveChangesAsync();

        // Act: GET /api/v1/admin/products/{id}/categories
        var response = await client.GetAsync($"/api/v1/admin/products/{product.Id}/categories");

        // Assert: Response is successful
        Assert.True(response.IsSuccessStatusCode);

        var result = await response.Content.ReadFromJsonAsync<List<CategoryDto>>();
        Assert.NotNull(result);

        // Assert: Returns empty list
        Assert.Empty(result);
    }

    /// <summary>
    /// Test: GET /api/v1/admin/products/{id}/categories returns 404 when product not found.
    /// Validates: Requirements 8.6, 8.8, 8.9
    /// </summary>
    [Fact]
    public async Task GetProductCategories_Returns404_WhenProductNotFound()
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        // Arrange: Use a non-existent product ID
        var nonExistentId = Guid.NewGuid();

        // Act: GET /api/v1/admin/products/{id}/categories
        var response = await client.GetAsync($"/api/v1/admin/products/{nonExistentId}/categories");

        // Assert: Response is 404 Not Found
        Assert.Equal(System.Net.HttpStatusCode.NotFound, response.StatusCode);
    }

    /// <summary>
    /// Test: GET /api/v1/admin/products/{id}/categories includes all multilingual fields.
    /// Validates: Requirements 4.5, 8.6, 8.8, 8.9
    /// </summary>
    [Fact]
    public async Task GetProductCategories_IncludesAllMultilingualFields()
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        // Arrange: Create a product and assign a category
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<FilamorfosisDbContext>();

        var process = await db.Processes.FirstAsync();

        var product = new Product
        {
            Id = Guid.NewGuid(),
            ProcessId = process.Id,
            Slug = "test-product-multilingual",
            TitleEs = "Producto Multilingüe",
            DescriptionEs = "Producto con categorías multilingües",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        db.Products.Add(product);
        await db.SaveChangesAsync();

        // Get a seeded category (should have all language fields)
        var category = await db.ProductCategories
            .Where(c => c.IsActive)
            .FirstAsync();

        db.ProductCategoryAssignments.Add(new ProductCategoryAssignment
        {
            ProductId = product.Id,
            CategoryId = category.Id
        });
        await db.SaveChangesAsync();

        // Act: GET /api/v1/admin/products/{id}/categories
        var response = await client.GetAsync($"/api/v1/admin/products/{product.Id}/categories");

        // Assert: Response is successful
        Assert.True(response.IsSuccessStatusCode);

        var result = await response.Content.ReadFromJsonAsync<List<CategoryDto>>();
        Assert.NotNull(result);
        Assert.Single(result);

        var categoryDto = result[0];

        // Assert: All multilingual fields are present
        Assert.NotEmpty(categoryDto.NameEs);
        Assert.NotEmpty(categoryDto.NameEn);
        Assert.NotEmpty(categoryDto.NameDe);
        Assert.NotEmpty(categoryDto.NamePt);
        Assert.NotEmpty(categoryDto.NameJa);
        Assert.NotEmpty(categoryDto.NameZh);
    }

    /// <summary>
    /// Test: PUT /api/v1/admin/products/{id}/categories assigns categories to a product.
    /// Validates: Requirements 5.6, 8.7, 8.8, 8.9, 8.10
    /// </summary>
    [Fact]
    public async Task UpdateProductCategories_AssignsCategoriesSuccessfully()
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        // Arrange: Create a product
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<FilamorfosisDbContext>();

        var process = await db.Processes.FirstAsync();

        var product = new Product
        {
            Id = Guid.NewGuid(),
            ProcessId = process.Id,
            Slug = "test-product-assign",
            TitleEs = "Producto para Asignar",
            DescriptionEs = "Producto para probar asignación de categorías",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        db.Products.Add(product);
        await db.SaveChangesAsync();

        // Get some existing categories
        var categories = await db.ProductCategories
            .Where(c => c.IsActive)
            .Take(3)
            .ToListAsync();

        Assert.True(categories.Count >= 3, "Should have at least 3 seeded categories");

        var request = new AssignCategoriesRequest
        {
            CategoryIds = categories.Select(c => c.Id).ToList()
        };

        // Act: PUT /api/v1/admin/products/{id}/categories
        var response = await client.PutAsJsonAsync($"/api/v1/admin/products/{product.Id}/categories", request);

        // Assert: Response is successful
        Assert.True(response.IsSuccessStatusCode, $"Expected success status code, got {response.StatusCode}");

        var result = await response.Content.ReadFromJsonAsync<List<CategoryDto>>();
        Assert.NotNull(result);

        // Assert: Returns the assigned categories
        Assert.Equal(3, result.Count);
        Assert.All(categories, category => Assert.Contains(result, c => c.Id == category.Id));

        // Verify in database
        var assignments = await db.ProductCategoryAssignments
            .Where(pca => pca.ProductId == product.Id)
            .ToListAsync();

        Assert.Equal(3, assignments.Count);
    }

    /// <summary>
    /// Test: PUT /api/v1/admin/products/{id}/categories replaces existing assignments.
    /// Validates: Requirements 5.6, 8.7, 8.8, 8.9, 8.10
    /// </summary>
    [Fact]
    public async Task UpdateProductCategories_ReplacesExistingAssignments()
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        // Arrange: Create a product with existing category assignments
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<FilamorfosisDbContext>();

        var process = await db.Processes.FirstAsync();

        var product = new Product
        {
            Id = Guid.NewGuid(),
            ProcessId = process.Id,
            Slug = "test-product-replace",
            TitleEs = "Producto para Reemplazar",
            DescriptionEs = "Producto para probar reemplazo de categorías",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        db.Products.Add(product);
        await db.SaveChangesAsync();

        // Get categories
        var allCategories = await db.ProductCategories
            .Where(c => c.IsActive)
            .Take(5)
            .ToListAsync();

        Assert.True(allCategories.Count >= 5, "Should have at least 5 seeded categories");

        // Assign first 2 categories
        var initialCategories = allCategories.Take(2).ToList();
        foreach (var category in initialCategories)
        {
            db.ProductCategoryAssignments.Add(new ProductCategoryAssignment
            {
                ProductId = product.Id,
                CategoryId = category.Id
            });
        }
        await db.SaveChangesAsync();

        // Prepare request with different categories (last 3)
        var newCategories = allCategories.Skip(2).Take(3).ToList();
        var request = new AssignCategoriesRequest
        {
            CategoryIds = newCategories.Select(c => c.Id).ToList()
        };

        // Act: PUT /api/v1/admin/products/{id}/categories
        var response = await client.PutAsJsonAsync($"/api/v1/admin/products/{product.Id}/categories", request);

        // Assert: Response is successful
        Assert.True(response.IsSuccessStatusCode);

        var result = await response.Content.ReadFromJsonAsync<List<CategoryDto>>();
        Assert.NotNull(result);

        // Assert: Returns only the new categories
        Assert.Equal(3, result.Count);
        Assert.All(newCategories, category => Assert.Contains(result, c => c.Id == category.Id));

        // Assert: Old categories are not present
        Assert.All(initialCategories, category => Assert.DoesNotContain(result, c => c.Id == category.Id));

        // Verify in database
        var assignments = await db.ProductCategoryAssignments
            .Where(pca => pca.ProductId == product.Id)
            .ToListAsync();

        Assert.Equal(3, assignments.Count);
        Assert.All(newCategories, category => Assert.Contains(assignments, a => a.CategoryId == category.Id));
    }

    /// <summary>
    /// Test: PUT /api/v1/admin/products/{id}/categories returns 404 when product not found.
    /// Validates: Requirements 5.6, 8.7, 8.8, 8.9, 8.10
    /// </summary>
    [Fact]
    public async Task UpdateProductCategories_Returns404_WhenProductNotFound()
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        // Arrange: Use a non-existent product ID
        var nonExistentId = Guid.NewGuid();

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<FilamorfosisDbContext>();

        var category = await db.ProductCategories.FirstAsync();

        var request = new AssignCategoriesRequest
        {
            CategoryIds = new List<Guid> { category.Id }
        };

        // Act: PUT /api/v1/admin/products/{id}/categories
        var response = await client.PutAsJsonAsync($"/api/v1/admin/products/{nonExistentId}/categories", request);

        // Assert: Response is 404 Not Found
        Assert.Equal(System.Net.HttpStatusCode.NotFound, response.StatusCode);
    }

    /// <summary>
    /// Test: PUT /api/v1/admin/products/{id}/categories returns 400 when category IDs are invalid.
    /// Validates: Requirements 5.6, 8.7, 8.8, 8.9, 8.10
    /// </summary>
    [Fact]
    public async Task UpdateProductCategories_Returns400_WhenCategoryIdsInvalid()
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        // Arrange: Create a product
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<FilamorfosisDbContext>();

        var process = await db.Processes.FirstAsync();

        var product = new Product
        {
            Id = Guid.NewGuid(),
            ProcessId = process.Id,
            Slug = "test-product-invalid-categories",
            TitleEs = "Producto con Categorías Inválidas",
            DescriptionEs = "Producto para probar categorías inválidas",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        db.Products.Add(product);
        await db.SaveChangesAsync();

        // Use non-existent category IDs
        var request = new AssignCategoriesRequest
        {
            CategoryIds = new List<Guid> { Guid.NewGuid(), Guid.NewGuid() }
        };

        // Act: PUT /api/v1/admin/products/{id}/categories
        var response = await client.PutAsJsonAsync($"/api/v1/admin/products/{product.Id}/categories", request);

        // Assert: Response is 400 Bad Request
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, response.StatusCode);
    }

    /// <summary>
    /// Test: PUT /api/v1/admin/products/{id}/categories handles empty category list.
    /// Validates: Requirements 5.6, 8.7, 8.8, 8.9, 8.10
    /// </summary>
    [Fact]
    public async Task UpdateProductCategories_HandlesEmptyCategoryList()
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        // Arrange: Create a product with existing assignments
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<FilamorfosisDbContext>();

        var process = await db.Processes.FirstAsync();

        var product = new Product
        {
            Id = Guid.NewGuid(),
            ProcessId = process.Id,
            Slug = "test-product-empty-categories",
            TitleEs = "Producto con Lista Vacía",
            DescriptionEs = "Producto para probar lista vacía de categorías",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        db.Products.Add(product);
        await db.SaveChangesAsync();

        // Assign a category first
        var category = await db.ProductCategories.FirstAsync();
        db.ProductCategoryAssignments.Add(new ProductCategoryAssignment
        {
            ProductId = product.Id,
            CategoryId = category.Id
        });
        await db.SaveChangesAsync();

        // Prepare request with empty list
        var request = new AssignCategoriesRequest
        {
            CategoryIds = new List<Guid>()
        };

        // Act: PUT /api/v1/admin/products/{id}/categories
        var response = await client.PutAsJsonAsync($"/api/v1/admin/products/{product.Id}/categories", request);

        // Assert: Response is successful
        Assert.True(response.IsSuccessStatusCode);

        var result = await response.Content.ReadFromJsonAsync<List<CategoryDto>>();
        Assert.NotNull(result);

        // Assert: Returns empty list
        Assert.Empty(result);

        // Verify in database - all assignments should be removed
        var assignments = await db.ProductCategoryAssignments
            .Where(pca => pca.ProductId == product.Id)
            .ToListAsync();

        Assert.Empty(assignments);
    }
}
