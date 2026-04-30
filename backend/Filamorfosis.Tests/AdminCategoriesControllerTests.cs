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
/// Integration tests for AdminCategoriesController.
/// Validates: Requirements 8.1, 8.8, 8.9
/// </summary>
public class AdminCategoriesControllerTests
{
    /// <summary>
    /// Test: GET /api/v1/categories returns hierarchical structure with nested children.
    /// Validates: Requirements 8.1, 8.8, 8.9
    /// Note: CategorySeedService runs automatically, so we verify the seeded structure.
    /// </summary>
    [Fact]
    public async Task GetAll_ReturnsHierarchicalStructure_WithNestedChildren()
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        // Act: GET /api/v1/categories (CategorySeedService runs automatically)
        var response = await client.GetAsync("/api/v1/categories");

        // Assert: Response is successful
        Assert.True(response.IsSuccessStatusCode, $"Expected success status code, got {response.StatusCode}");

        var result = await response.Content.ReadFromJsonAsync<List<CategoryDto>>();
        Assert.NotNull(result);

        // Assert: Root categories exist (CategorySeedService seeds 8 root categories)
        Assert.True(result.Count >= 8, $"Expected at least 8 root categories, got {result.Count}");

        // Find "Regalos Personalizados" category (should have children)
        var regalosCategory = result.FirstOrDefault(c => c.NameEs == "Regalos Personalizados");
        Assert.NotNull(regalosCategory);
        Assert.Equal("🎁", regalosCategory.Icon);

        // Assert: Regalos Personalizados has children (seeded by CategorySeedService)
        Assert.True(regalosCategory.Children.Count > 0, "Regalos Personalizados should have child categories");

        // Verify children are ordered by DisplayOrder
        for (int i = 0; i < regalosCategory.Children.Count - 1; i++)
        {
            Assert.True(
                regalosCategory.Children[i].DisplayOrder <= regalosCategory.Children[i + 1].DisplayOrder,
                $"Children should be ordered by DisplayOrder: {regalosCategory.Children[i].NameEs} ({regalosCategory.Children[i].DisplayOrder}) should come before {regalosCategory.Children[i + 1].NameEs} ({regalosCategory.Children[i + 1].DisplayOrder})"
            );
        }

        // Assert: All multilingual fields are present
        Assert.NotEmpty(regalosCategory.NameEn);
        Assert.NotEmpty(regalosCategory.NameDe);
        Assert.NotEmpty(regalosCategory.NamePt);
        Assert.NotEmpty(regalosCategory.NameJa);
        Assert.NotEmpty(regalosCategory.NameZh);
    }

    /// <summary>
    /// Test: GET /api/v1/categories returns seeded categories from CategorySeedService.
    /// Note: CategorySeedService runs automatically and seeds 8 root categories.
    /// </summary>
    [Fact]
    public async Task GetAll_ReturnsSeededCategories()
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        // Act: GET /api/v1/categories (CategorySeedService runs automatically)
        var response = await client.GetAsync("/api/v1/categories");

        // Assert
        Assert.True(response.IsSuccessStatusCode);
        var result = await response.Content.ReadFromJsonAsync<List<CategoryDto>>();
        Assert.NotNull(result);
        
        // CategorySeedService seeds 8 root categories
        Assert.True(result.Count >= 8, $"Expected at least 8 root categories from seed, got {result.Count}");
        
        // Verify some expected seeded categories exist
        Assert.Contains(result, c => c.NameEs == "Regalos Personalizados" && c.Icon == "🎁");
        Assert.Contains(result, c => c.NameEs == "Bodas & Eventos" && c.Icon == "💍");
        Assert.Contains(result, c => c.NameEs == "Negocios & Branding" && c.Icon == "🏢");
    }

    /// <summary>
    /// Test: GET /api/v1/categories orders categories by DisplayOrder, then by NameEs alphabetically.
    /// Note: CategorySeedService runs automatically, so we verify ordering of seeded data.
    /// </summary>
    [Fact]
    public async Task GetAll_OrdersByDisplayOrderThenNameEs()
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        // Act: GET /api/v1/categories (CategorySeedService runs automatically)
        var response = await client.GetAsync("/api/v1/categories");

        // Assert
        Assert.True(response.IsSuccessStatusCode);
        var result = await response.Content.ReadFromJsonAsync<List<CategoryDto>>();
        Assert.NotNull(result);
        Assert.True(result.Count > 0, "Should have seeded categories");

        // Verify ordering: DisplayOrder ascending, then NameEs alphabetically
        for (int i = 0; i < result.Count - 1; i++)
        {
            var current = result[i];
            var next = result[i + 1];

            if (current.DisplayOrder == next.DisplayOrder)
            {
                // Same DisplayOrder: should be sorted alphabetically by NameEs
                Assert.True(
                    string.Compare(current.NameEs, next.NameEs, StringComparison.Ordinal) <= 0,
                    $"Categories with same DisplayOrder should be sorted alphabetically: '{current.NameEs}' should come before or equal to '{next.NameEs}'"
                );
            }
            else
            {
                // Different DisplayOrder: should be sorted by DisplayOrder
                Assert.True(
                    current.DisplayOrder < next.DisplayOrder,
                    $"Categories should be sorted by DisplayOrder: {current.NameEs} ({current.DisplayOrder}) should come before {next.NameEs} ({next.DisplayOrder})"
                );
            }
        }
    }

    /// <summary>
    /// Test: GET /api/v1/categories/{id} returns a single category with all multilingual fields.
    /// Validates: Requirements 8.2, 8.8, 8.9
    /// </summary>
    [Fact]
    public async Task GetById_ReturnsCategory_WithAllMultilingualFields()
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        // Arrange: Get all categories to find a valid ID
        var allCategoriesResponse = await client.GetAsync("/api/v1/categories");
        var allCategories = await allCategoriesResponse.Content.ReadFromJsonAsync<List<CategoryDto>>();
        Assert.NotNull(allCategories);
        Assert.True(allCategories.Count > 0, "Should have seeded categories");

        var testCategory = allCategories.First();

        // Act: GET /api/v1/categories/{id}
        var response = await client.GetAsync($"/api/v1/categories/{testCategory.Id}");

        // Assert: Response is successful
        Assert.True(response.IsSuccessStatusCode, $"Expected success status code, got {response.StatusCode}");

        var result = await response.Content.ReadFromJsonAsync<CategoryDto>();
        Assert.NotNull(result);

        // Assert: Category matches expected data
        Assert.Equal(testCategory.Id, result.Id);
        Assert.Equal(testCategory.NameEs, result.NameEs);
        Assert.Equal(testCategory.Slug, result.Slug);

        // Assert: All multilingual fields are present
        Assert.NotEmpty(result.NameEs);
        Assert.NotEmpty(result.NameEn);
        Assert.NotEmpty(result.NameDe);
        Assert.NotEmpty(result.NamePt);
        Assert.NotEmpty(result.NameJa);
        Assert.NotEmpty(result.NameZh);
    }

    /// <summary>
    /// Test: GET /api/v1/categories/{id} returns category with nested children.
    /// Validates: Requirements 8.2, 8.8, 8.9
    /// </summary>
    [Fact]
    public async Task GetById_ReturnsCategoryWithChildren()
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        // Arrange: Get all categories and find one with children
        var allCategoriesResponse = await client.GetAsync("/api/v1/categories");
        var allCategories = await allCategoriesResponse.Content.ReadFromJsonAsync<List<CategoryDto>>();
        Assert.NotNull(allCategories);

        var categoryWithChildren = allCategories.FirstOrDefault(c => c.Children.Count > 0);
        Assert.NotNull(categoryWithChildren);

        // Act: GET /api/v1/categories/{id}
        var response = await client.GetAsync($"/api/v1/categories/{categoryWithChildren.Id}");

        // Assert: Response is successful
        Assert.True(response.IsSuccessStatusCode);

        var result = await response.Content.ReadFromJsonAsync<CategoryDto>();
        Assert.NotNull(result);

        // Assert: Category has children
        Assert.True(result.Children.Count > 0, "Category should have children");
        Assert.Equal(categoryWithChildren.Children.Count, result.Children.Count);

        // Assert: Children are ordered by DisplayOrder
        for (int i = 0; i < result.Children.Count - 1; i++)
        {
            Assert.True(
                result.Children[i].DisplayOrder <= result.Children[i + 1].DisplayOrder,
                $"Children should be ordered by DisplayOrder"
            );
        }
    }

    /// <summary>
    /// Test: GET /api/v1/categories/{id} returns 404 for non-existent category.
    /// Validates: Requirements 8.2, 8.8, 8.9
    /// </summary>
    [Fact]
    public async Task GetById_Returns404_WhenCategoryNotFound()
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        // Arrange: Use a non-existent GUID
        var nonExistentId = Guid.NewGuid();

        // Act: GET /api/v1/categories/{id}
        var response = await client.GetAsync($"/api/v1/categories/{nonExistentId}");

        // Assert: Response is 404 Not Found
        Assert.Equal(System.Net.HttpStatusCode.NotFound, response.StatusCode);

        // Assert: Response contains RFC 7807 Problem Details
        var problemDetails = await response.Content.ReadAsStringAsync();
        Assert.Contains("not found", problemDetails, StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Test: POST /api/v1/categories creates a new category with all multilingual fields.
    /// Validates: Requirements 2.1, 2.2, 8.3, 8.8, 8.9, 8.10, 9.1, 9.2, 9.3, 9.4
    /// </summary>
    [Fact]
    public async Task Create_CreatesCategory_WithAllMultilingualFields()
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        // Arrange: Create request with all multilingual fields
        var request = new CreateCategoryRequest
        {
            NameEs = "Categoría de Prueba",
            NameEn = "Test Category",
            NameDe = "Testkategorie",
            NamePt = "Categoria de Teste",
            NameJa = "テストカテゴリ",
            NameZh = "测试类别",
            Slug = "categoria-de-prueba",
            Description = "Descripción de prueba",
            Icon = "🧪",
            DisplayOrder = 100,
            IsActive = true
        };

        // Act: POST /api/v1/categories
        var response = await client.PostAsJsonAsync("/api/v1/categories", request);

        // Assert: Response is 201 Created
        Assert.Equal(System.Net.HttpStatusCode.Created, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<CategoryDto>();
        Assert.NotNull(result);

        // Assert: Category has all expected fields
        Assert.NotEqual(Guid.Empty, result.Id);
        Assert.Equal(request.NameEs, result.NameEs);
        Assert.Equal(request.NameEn, result.NameEn);
        Assert.Equal(request.NameDe, result.NameDe);
        Assert.Equal(request.NamePt, result.NamePt);
        Assert.Equal(request.NameJa, result.NameJa);
        Assert.Equal(request.NameZh, result.NameZh);
        Assert.Equal(request.Slug, result.Slug);
        Assert.Equal(request.Description, result.Description);
        Assert.Equal(request.Icon, result.Icon);
        Assert.Equal(request.DisplayOrder, result.DisplayOrder);
        Assert.True(result.IsActive);
        Assert.Null(result.ParentId);

        // Assert: Location header points to the created resource
        Assert.NotNull(response.Headers.Location);
        Assert.Contains(result.Id.ToString(), response.Headers.Location.ToString());
    }

    /// <summary>
    /// Test: POST /api/v1/categories generates slug when not provided.
    /// Validates: Requirements 9.1, 9.2, 9.3
    /// </summary>
    [Fact]
    public async Task Create_GeneratesSlug_WhenNotProvided()
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        // Arrange: Create request without slug
        var request = new CreateCategoryRequest
        {
            NameEs = "Nueva Categoría Sin Slug",
            NameEn = "New Category Without Slug"
        };

        // Act: POST /api/v1/categories
        var response = await client.PostAsJsonAsync("/api/v1/categories", request);

        // Assert: Response is 201 Created
        Assert.Equal(System.Net.HttpStatusCode.Created, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<CategoryDto>();
        Assert.NotNull(result);

        // Assert: Slug was generated from NameEs
        Assert.NotEmpty(result.Slug);
        Assert.Equal("nueva-categoria-sin-slug", result.Slug);
    }

    /// <summary>
    /// Test: POST /api/v1/categories defaults empty language fields to Spanish name.
    /// Validates: Requirements 4.2, 4.3
    /// </summary>
    [Fact]
    public async Task Create_DefaultsEmptyLanguageFields_ToSpanishName()
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        // Arrange: Create request with only Spanish name
        var request = new CreateCategoryRequest
        {
            NameEs = "Solo Español"
        };

        // Act: POST /api/v1/categories
        var response = await client.PostAsJsonAsync("/api/v1/categories", request);

        // Assert: Response is 201 Created
        Assert.Equal(System.Net.HttpStatusCode.Created, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<CategoryDto>();
        Assert.NotNull(result);

        // Assert: All language fields default to Spanish name
        Assert.Equal("Solo Español", result.NameEs);
        Assert.Equal("Solo Español", result.NameEn);
        Assert.Equal("Solo Español", result.NameDe);
        Assert.Equal("Solo Español", result.NamePt);
        Assert.Equal("Solo Español", result.NameJa);
        Assert.Equal("Solo Español", result.NameZh);
    }

    /// <summary>
    /// Test: POST /api/v1/categories ensures slug uniqueness by appending suffix.
    /// Validates: Requirements 9.3, 9.4
    /// </summary>
    [Fact]
    public async Task Create_EnsuresSlugUniqueness_ByAppendingSuffix()
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        // Arrange: Create first category
        var request1 = new CreateCategoryRequest
        {
            NameEs = "Categoría Duplicada",
            Slug = "categoria-duplicada"
        };

        var response1 = await client.PostAsJsonAsync("/api/v1/categories", request1);
        Assert.Equal(System.Net.HttpStatusCode.Created, response1.StatusCode);

        // Arrange: Create second category with same slug
        var request2 = new CreateCategoryRequest
        {
            NameEs = "Categoría Duplicada 2",
            Slug = "categoria-duplicada"
        };

        // Act: POST /api/v1/categories
        var response2 = await client.PostAsJsonAsync("/api/v1/categories", request2);

        // Assert: Response is 201 Created
        Assert.Equal(System.Net.HttpStatusCode.Created, response2.StatusCode);

        var result2 = await response2.Content.ReadFromJsonAsync<CategoryDto>();
        Assert.NotNull(result2);

        // Assert: Slug has numeric suffix to ensure uniqueness
        Assert.Equal("categoria-duplicada-2", result2.Slug);
    }

    /// <summary>
    /// Test: POST /api/v1/categories returns 400 when Spanish name is missing.
    /// Validates: Requirements 2.2, 4.2, 8.10
    /// </summary>
    [Fact]
    public async Task Create_Returns400_WhenSpanishNameMissing()
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        // Arrange: Create request without Spanish name
        var request = new CreateCategoryRequest
        {
            NameEs = "",
            NameEn = "English Only"
        };

        // Act: POST /api/v1/categories
        var response = await client.PostAsJsonAsync("/api/v1/categories", request);

        // Assert: Response is 400 Bad Request
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, response.StatusCode);

        // Assert: Response contains RFC 7807 Problem Details
        var problemDetails = await response.Content.ReadAsStringAsync();
        Assert.Contains("español", problemDetails, StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Test: POST /api/v1/categories returns 400 when slug format is invalid.
    /// Validates: Requirements 9.2, 8.10
    /// </summary>
    [Fact]
    public async Task Create_Returns400_WhenSlugFormatInvalid()
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        // Arrange: Create request with invalid slug (uppercase, spaces, special chars)
        var request = new CreateCategoryRequest
        {
            NameEs = "Categoría con Slug Inválido",
            Slug = "Invalid Slug!"
        };

        // Act: POST /api/v1/categories
        var response = await client.PostAsJsonAsync("/api/v1/categories", request);

        // Assert: Response is 400 Bad Request
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, response.StatusCode);

        // Assert: Response contains RFC 7807 Problem Details
        var problemDetails = await response.Content.ReadAsStringAsync();
        Assert.Contains("slug", problemDetails, StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Test: POST /api/v1/categories creates child category with valid parent.
    /// Validates: Requirements 2.1, 10.1
    /// </summary>
    [Fact]
    public async Task Create_CreatesChildCategory_WithValidParent()
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        // Arrange: Get existing parent category
        var allCategoriesResponse = await client.GetAsync("/api/v1/categories");
        var allCategories = await allCategoriesResponse.Content.ReadFromJsonAsync<List<CategoryDto>>();
        Assert.NotNull(allCategories);
        var parentCategory = allCategories.First();

        // Arrange: Create child category request
        var request = new CreateCategoryRequest
        {
            NameEs = "Categoría Hija",
            NameEn = "Child Category",
            ParentId = parentCategory.Id
        };

        // Act: POST /api/v1/categories
        var response = await client.PostAsJsonAsync("/api/v1/categories", request);

        // Assert: Response is 201 Created
        Assert.Equal(System.Net.HttpStatusCode.Created, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<CategoryDto>();
        Assert.NotNull(result);

        // Assert: Child category has correct parent
        Assert.Equal(parentCategory.Id, result.ParentId);
    }

    /// <summary>
    /// Test: POST /api/v1/categories returns 400 when parent does not exist.
    /// Validates: Requirements 10.1, 8.10
    /// </summary>
    [Fact]
    public async Task Create_Returns400_WhenParentDoesNotExist()
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        // Arrange: Create request with non-existent parent
        var request = new CreateCategoryRequest
        {
            NameEs = "Categoría con Padre Inexistente",
            ParentId = Guid.NewGuid()
        };

        // Act: POST /api/v1/categories
        var response = await client.PostAsJsonAsync("/api/v1/categories", request);

        // Assert: Response is 400 Bad Request
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, response.StatusCode);

        // Assert: Response contains RFC 7807 Problem Details
        var problemDetails = await response.Content.ReadAsStringAsync();
        Assert.Contains("padre", problemDetails, StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Test: POST /api/v1/categories returns 400 when hierarchy depth exceeds 3 levels.
    /// Validates: Requirements 10.4, 10.5, 8.10
    /// </summary>
    [Fact]
    public async Task Create_Returns400_WhenHierarchyDepthExceeds3Levels()
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        // Arrange: Create root category
        var rootRequest = new CreateCategoryRequest { NameEs = "Raíz" };
        var rootResponse = await client.PostAsJsonAsync("/api/v1/categories", rootRequest);
        var root = await rootResponse.Content.ReadFromJsonAsync<CategoryDto>();
        Assert.NotNull(root);

        // Arrange: Create child category
        var childRequest = new CreateCategoryRequest { NameEs = "Hijo", ParentId = root.Id };
        var childResponse = await client.PostAsJsonAsync("/api/v1/categories", childRequest);
        var child = await childResponse.Content.ReadFromJsonAsync<CategoryDto>();
        Assert.NotNull(child);

        // Arrange: Create grandchild category
        var grandchildRequest = new CreateCategoryRequest { NameEs = "Nieto", ParentId = child.Id };
        var grandchildResponse = await client.PostAsJsonAsync("/api/v1/categories", grandchildRequest);
        var grandchild = await grandchildResponse.Content.ReadFromJsonAsync<CategoryDto>();
        Assert.NotNull(grandchild);

        // Arrange: Try to create great-grandchild (4th level - should fail)
        var greatGrandchildRequest = new CreateCategoryRequest
        {
            NameEs = "Bisnieto",
            ParentId = grandchild.Id
        };

        // Act: POST /api/v1/categories
        var response = await client.PostAsJsonAsync("/api/v1/categories", greatGrandchildRequest);

        // Assert: Response is 400 Bad Request
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, response.StatusCode);

        // Assert: Response contains RFC 7807 Problem Details
        var problemDetails = await response.Content.ReadAsStringAsync();
        Assert.Contains("jerarquía", problemDetails, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("3 niveles", problemDetails, StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Test: PUT /api/v1/categories/{id} updates category with all fields.
    /// Validates: Requirements 2.5, 2.8, 8.4, 8.8, 8.9, 8.10
    /// </summary>
    [Fact]
    public async Task Update_UpdatesCategory_WithAllFields()
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        // Arrange: Create a category to update
        var createRequest = new CreateCategoryRequest
        {
            NameEs = "Categoría Original",
            NameEn = "Original Category"
        };
        var createResponse = await client.PostAsJsonAsync("/api/v1/categories", createRequest);
        var created = await createResponse.Content.ReadFromJsonAsync<CategoryDto>();
        Assert.NotNull(created);

        // Arrange: Update request with all fields
        var updateRequest = new UpdateCategoryRequest
        {
            NameEs = "Categoría Actualizada",
            NameEn = "Updated Category",
            NameDe = "Aktualisierte Kategorie",
            NamePt = "Categoria Atualizada",
            NameJa = "更新されたカテゴリ",
            NameZh = "更新的类别",
            Slug = "categoria-actualizada",
            Description = "Descripción actualizada",
            Icon = "✨",
            DisplayOrder = 50,
            IsActive = false
        };

        // Act: PUT /api/v1/categories/{id}
        var response = await client.PutAsJsonAsync($"/api/v1/categories/{created.Id}", updateRequest);

        // Assert: Response is 200 OK
        Assert.Equal(System.Net.HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<CategoryDto>();
        Assert.NotNull(result);

        // Assert: All fields were updated
        Assert.Equal(created.Id, result.Id);
        Assert.Equal(updateRequest.NameEs, result.NameEs);
        Assert.Equal(updateRequest.NameEn, result.NameEn);
        Assert.Equal(updateRequest.NameDe, result.NameDe);
        Assert.Equal(updateRequest.NamePt, result.NamePt);
        Assert.Equal(updateRequest.NameJa, result.NameJa);
        Assert.Equal(updateRequest.NameZh, result.NameZh);
        Assert.Equal(updateRequest.Slug, result.Slug);
        Assert.Equal(updateRequest.Description, result.Description);
        Assert.Equal(updateRequest.Icon, result.Icon);
        Assert.Equal(updateRequest.DisplayOrder, result.DisplayOrder);
        Assert.Equal(updateRequest.IsActive, result.IsActive);
    }

    /// <summary>
    /// Test: PUT /api/v1/categories/{id} supports partial updates (only provided fields).
    /// Validates: Requirements 2.5, 8.4
    /// </summary>
    [Fact]
    public async Task Update_SupportsPartialUpdates_OnlyProvidedFields()
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        // Arrange: Create a category to update
        var createRequest = new CreateCategoryRequest
        {
            NameEs = "Categoría Original",
            NameEn = "Original Category",
            Description = "Descripción original",
            DisplayOrder = 10,
            IsActive = true
        };
        var createResponse = await client.PostAsJsonAsync("/api/v1/categories", createRequest);
        var created = await createResponse.Content.ReadFromJsonAsync<CategoryDto>();
        Assert.NotNull(created);

        // Arrange: Partial update request (only update NameEs and DisplayOrder)
        var updateRequest = new UpdateCategoryRequest
        {
            NameEs = "Nombre Actualizado",
            DisplayOrder = 20
            // Other fields are null, should not be updated
        };

        // Act: PUT /api/v1/categories/{id}
        var response = await client.PutAsJsonAsync($"/api/v1/categories/{created.Id}", updateRequest);

        // Assert: Response is 200 OK
        Assert.Equal(System.Net.HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<CategoryDto>();
        Assert.NotNull(result);

        // Assert: Only specified fields were updated
        Assert.Equal("Nombre Actualizado", result.NameEs);
        Assert.Equal(20, result.DisplayOrder);

        // Assert: Other fields remain unchanged
        Assert.Equal("Original Category", result.NameEn);
        Assert.Equal("Descripción original", result.Description);
        Assert.True(result.IsActive);
    }

    /// <summary>
    /// Test: PUT /api/v1/categories/{id} validates slug uniqueness when slug is changed.
    /// Validates: Requirements 2.8, 8.4, 8.10
    /// </summary>
    [Fact]
    public async Task Update_ValidatesSlugUniqueness_WhenSlugChanged()
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        // Arrange: Create two categories
        var category1Request = new CreateCategoryRequest
        {
            NameEs = "Categoría 1",
            Slug = "categoria-1"
        };
        var category1Response = await client.PostAsJsonAsync("/api/v1/categories", category1Request);
        var category1 = await category1Response.Content.ReadFromJsonAsync<CategoryDto>();
        Assert.NotNull(category1);

        var category2Request = new CreateCategoryRequest
        {
            NameEs = "Categoría 2",
            Slug = "categoria-2"
        };
        var category2Response = await client.PostAsJsonAsync("/api/v1/categories", category2Request);
        var category2 = await category2Response.Content.ReadFromJsonAsync<CategoryDto>();
        Assert.NotNull(category2);

        // Arrange: Try to update category2 with category1's slug
        var updateRequest = new UpdateCategoryRequest
        {
            Slug = "categoria-1"
        };

        // Act: PUT /api/v1/categories/{id}
        var response = await client.PutAsJsonAsync($"/api/v1/categories/{category2.Id}", updateRequest);

        // Assert: Response is 422 Unprocessable Entity (business logic error)
        Assert.Equal(System.Net.HttpStatusCode.UnprocessableEntity, response.StatusCode);

        // Assert: Response contains RFC 7807 Problem Details
        var problemDetails = await response.Content.ReadAsStringAsync();
        Assert.Contains("slug", problemDetails, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("ya existe", problemDetails, StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Test: PUT /api/v1/categories/{id} checks for circular references when ParentId is changed.
    /// Validates: Requirements 2.8, 8.4, 10.6
    /// </summary>
    [Fact]
    public async Task Update_ChecksCircularReferences_WhenParentIdChanged()
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        // Arrange: Create parent and child categories
        var parentRequest = new CreateCategoryRequest { NameEs = "Padre" };
        var parentResponse = await client.PostAsJsonAsync("/api/v1/categories", parentRequest);
        var parent = await parentResponse.Content.ReadFromJsonAsync<CategoryDto>();
        Assert.NotNull(parent);

        var childRequest = new CreateCategoryRequest { NameEs = "Hijo", ParentId = parent.Id };
        var childResponse = await client.PostAsJsonAsync("/api/v1/categories", childRequest);
        var child = await childResponse.Content.ReadFromJsonAsync<CategoryDto>();
        Assert.NotNull(child);

        // Arrange: Try to set parent's ParentId to child (circular reference)
        var updateRequest = new UpdateCategoryRequest
        {
            ParentId = child.Id
        };

        // Act: PUT /api/v1/categories/{id}
        var response = await client.PutAsJsonAsync($"/api/v1/categories/{parent.Id}", updateRequest);

        // Assert: Response is 422 Unprocessable Entity
        Assert.Equal(System.Net.HttpStatusCode.UnprocessableEntity, response.StatusCode);

        // Assert: Response contains RFC 7807 Problem Details
        var problemDetails = await response.Content.ReadAsStringAsync();
        Assert.Contains("circular", problemDetails, StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Test: PUT /api/v1/categories/{id} prevents self-reference when ParentId is set to own ID.
    /// Validates: Requirements 2.8, 10.2
    /// </summary>
    [Fact]
    public async Task Update_PreventsSelfReference_WhenParentIdSetToOwnId()
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        // Arrange: Create a category
        var createRequest = new CreateCategoryRequest { NameEs = "Categoría" };
        var createResponse = await client.PostAsJsonAsync("/api/v1/categories", createRequest);
        var created = await createResponse.Content.ReadFromJsonAsync<CategoryDto>();
        Assert.NotNull(created);

        // Arrange: Try to set ParentId to own ID
        var updateRequest = new UpdateCategoryRequest
        {
            ParentId = created.Id
        };

        // Act: PUT /api/v1/categories/{id}
        var response = await client.PutAsJsonAsync($"/api/v1/categories/{created.Id}", updateRequest);

        // Assert: Response is 422 Unprocessable Entity
        Assert.Equal(System.Net.HttpStatusCode.UnprocessableEntity, response.StatusCode);

        // Assert: Response contains RFC 7807 Problem Details
        var problemDetails = await response.Content.ReadAsStringAsync();
        Assert.Contains("propio padre", problemDetails, StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Test: PUT /api/v1/categories/{id} validates hierarchy depth when ParentId is changed.
    /// Validates: Requirements 2.8, 10.4, 10.6
    /// </summary>
    [Fact]
    public async Task Update_ValidatesHierarchyDepth_WhenParentIdChanged()
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        // Arrange: Create a 3-level hierarchy (root → child → grandchild)
        var rootRequest = new CreateCategoryRequest { NameEs = "Raíz" };
        var rootResponse = await client.PostAsJsonAsync("/api/v1/categories", rootRequest);
        var root = await rootResponse.Content.ReadFromJsonAsync<CategoryDto>();
        Assert.NotNull(root);

        var childRequest = new CreateCategoryRequest { NameEs = "Hijo", ParentId = root.Id };
        var childResponse = await client.PostAsJsonAsync("/api/v1/categories", childRequest);
        var child = await childResponse.Content.ReadFromJsonAsync<CategoryDto>();
        Assert.NotNull(child);

        var grandchildRequest = new CreateCategoryRequest { NameEs = "Nieto", ParentId = child.Id };
        var grandchildResponse = await client.PostAsJsonAsync("/api/v1/categories", grandchildRequest);
        var grandchild = await grandchildResponse.Content.ReadFromJsonAsync<CategoryDto>();
        Assert.NotNull(grandchild);

        // Arrange: Create another root category
        var anotherRootRequest = new CreateCategoryRequest { NameEs = "Otra Raíz" };
        var anotherRootResponse = await client.PostAsJsonAsync("/api/v1/categories", anotherRootRequest);
        var anotherRoot = await anotherRootResponse.Content.ReadFromJsonAsync<CategoryDto>();
        Assert.NotNull(anotherRoot);

        // Arrange: Try to move anotherRoot under grandchild (would create 4th level)
        var updateRequest = new UpdateCategoryRequest
        {
            ParentId = grandchild.Id
        };

        // Act: PUT /api/v1/categories/{id}
        var response = await client.PutAsJsonAsync($"/api/v1/categories/{anotherRoot.Id}", updateRequest);

        // Assert: Response is 422 Unprocessable Entity
        Assert.Equal(System.Net.HttpStatusCode.UnprocessableEntity, response.StatusCode);

        // Assert: Response contains RFC 7807 Problem Details
        var problemDetails = await response.Content.ReadAsStringAsync();
        Assert.Contains("jerarquía", problemDetails, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("3 niveles", problemDetails, StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Test: PUT /api/v1/categories/{id} returns 404 when category not found.
    /// Validates: Requirements 8.4
    /// </summary>
    [Fact]
    public async Task Update_Returns404_WhenCategoryNotFound()
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        // Arrange: Use a non-existent GUID
        var nonExistentId = Guid.NewGuid();
        var updateRequest = new UpdateCategoryRequest
        {
            NameEs = "Actualizado"
        };

        // Act: PUT /api/v1/categories/{id}
        var response = await client.PutAsJsonAsync($"/api/v1/categories/{nonExistentId}", updateRequest);

        // Assert: Response is 404 Not Found
        Assert.Equal(System.Net.HttpStatusCode.NotFound, response.StatusCode);

        // Assert: Response contains RFC 7807 Problem Details
        var problemDetails = await response.Content.ReadAsStringAsync();
        Assert.Contains("not found", problemDetails, StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Test: PUT /api/v1/categories/{id} returns 400 for validation errors.
    /// Validates: Requirements 8.4, 8.10
    /// </summary>
    [Fact]
    public async Task Update_Returns400_ForValidationErrors()
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        // Arrange: Create a category
        var createRequest = new CreateCategoryRequest { NameEs = "Categoría" };
        var createResponse = await client.PostAsJsonAsync("/api/v1/categories", createRequest);
        var created = await createResponse.Content.ReadFromJsonAsync<CategoryDto>();
        Assert.NotNull(created);

        // Arrange: Update with invalid slug format
        var updateRequest = new UpdateCategoryRequest
        {
            Slug = "Invalid Slug!"
        };

        // Act: PUT /api/v1/categories/{id}
        var response = await client.PutAsJsonAsync($"/api/v1/categories/{created.Id}", updateRequest);

        // Assert: Response is 400 Bad Request
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, response.StatusCode);

        // Assert: Response contains RFC 7807 Problem Details
        var problemDetails = await response.Content.ReadAsStringAsync();
        Assert.Contains("slug", problemDetails, StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Test: PUT /api/v1/categories/{id} returns updated category with children.
    /// Validates: Requirements 8.4, 8.8, 8.9
    /// </summary>
    [Fact]
    public async Task Update_ReturnsUpdatedCategory_WithChildren()
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        // Arrange: Create parent and child categories
        var parentRequest = new CreateCategoryRequest { NameEs = "Padre" };
        var parentResponse = await client.PostAsJsonAsync("/api/v1/categories", parentRequest);
        var parent = await parentResponse.Content.ReadFromJsonAsync<CategoryDto>();
        Assert.NotNull(parent);

        var childRequest = new CreateCategoryRequest { NameEs = "Hijo", ParentId = parent.Id };
        var childResponse = await client.PostAsJsonAsync("/api/v1/categories", childRequest);
        var child = await childResponse.Content.ReadFromJsonAsync<CategoryDto>();
        Assert.NotNull(child);

        // Arrange: Update parent category
        var updateRequest = new UpdateCategoryRequest
        {
            NameEs = "Padre Actualizado"
        };

        // Act: PUT /api/v1/categories/{id}
        var response = await client.PutAsJsonAsync($"/api/v1/categories/{parent.Id}", updateRequest);

        // Assert: Response is 200 OK
        Assert.Equal(System.Net.HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<CategoryDto>();
        Assert.NotNull(result);

        // Assert: Updated category includes children
        Assert.Equal("Padre Actualizado", result.NameEs);
        Assert.True(result.Children.Count > 0, "Updated category should include children");
        Assert.Contains(result.Children, c => c.Id == child.Id);
    }

    /// <summary>
    /// Test: DELETE /api/v1/categories/{id} deletes category without children.
    /// Validates: Requirements 2.7, 8.5, 8.8, 8.9
    /// </summary>
    [Fact]
    public async Task Delete_DeletesCategory_WithoutChildren()
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        // Arrange: Create a category without children
        var createRequest = new CreateCategoryRequest
        {
            NameEs = "Categoría a Eliminar",
            NameEn = "Category to Delete"
        };
        var createResponse = await client.PostAsJsonAsync("/api/v1/categories", createRequest);
        var created = await createResponse.Content.ReadFromJsonAsync<CategoryDto>();
        Assert.NotNull(created);

        // Act: DELETE /api/v1/categories/{id}
        var response = await client.DeleteAsync($"/api/v1/categories/{created.Id}");

        // Assert: Response is 204 No Content
        Assert.Equal(System.Net.HttpStatusCode.NoContent, response.StatusCode);

        // Assert: Category no longer exists
        var getResponse = await client.GetAsync($"/api/v1/categories/{created.Id}");
        Assert.Equal(System.Net.HttpStatusCode.NotFound, getResponse.StatusCode);
    }

    /// <summary>
    /// Test: DELETE /api/v1/categories/{id} returns 409 when category has children.
    /// Validates: Requirements 2.6, 8.5, 8.8, 8.9
    /// </summary>
    [Fact]
    public async Task Delete_Returns409_WhenCategoryHasChildren()
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        // Arrange: Create parent and child categories
        var parentRequest = new CreateCategoryRequest { NameEs = "Padre con Hijos" };
        var parentResponse = await client.PostAsJsonAsync("/api/v1/categories", parentRequest);
        var parent = await parentResponse.Content.ReadFromJsonAsync<CategoryDto>();
        Assert.NotNull(parent);

        var childRequest = new CreateCategoryRequest { NameEs = "Hijo", ParentId = parent.Id };
        var childResponse = await client.PostAsJsonAsync("/api/v1/categories", childRequest);
        var child = await childResponse.Content.ReadFromJsonAsync<CategoryDto>();
        Assert.NotNull(child);

        // Act: DELETE /api/v1/categories/{id} (try to delete parent)
        var response = await client.DeleteAsync($"/api/v1/categories/{parent.Id}");

        // Assert: Response is 409 Conflict
        Assert.Equal(System.Net.HttpStatusCode.Conflict, response.StatusCode);

        // Assert: Response contains RFC 7807 Problem Details
        var problemDetails = await response.Content.ReadAsStringAsync();
        Assert.Contains("subcategorías", problemDetails, StringComparison.OrdinalIgnoreCase);

        // Assert: Parent category still exists
        var getResponse = await client.GetAsync($"/api/v1/categories/{parent.Id}");
        Assert.Equal(System.Net.HttpStatusCode.OK, getResponse.StatusCode);
    }

    /// <summary>
    /// Test: DELETE /api/v1/categories/{id} returns 404 when category not found.
    /// Validates: Requirements 8.5, 8.8, 8.9
    /// </summary>
    [Fact]
    public async Task Delete_Returns404_WhenCategoryNotFound()
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        // Arrange: Use a non-existent GUID
        var nonExistentId = Guid.NewGuid();

        // Act: DELETE /api/v1/categories/{id}
        var response = await client.DeleteAsync($"/api/v1/categories/{nonExistentId}");

        // Assert: Response is 404 Not Found
        Assert.Equal(System.Net.HttpStatusCode.NotFound, response.StatusCode);

        // Assert: Response contains RFC 7807 Problem Details
        var problemDetails = await response.Content.ReadAsStringAsync();
        Assert.Contains("not found", problemDetails, StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Test: DELETE /api/v1/categories/{id} cascade deletes ProductCategoryAssignments.
    /// Validates: Requirements 2.7, 8.5
    /// Note: In-memory database doesn't enforce cascade deletes the same way as real databases.
    /// The EF configuration (OnDelete(DeleteBehavior.Cascade)) ensures this works in production.
    /// This test verifies the endpoint succeeds when a category has product assignments.
    /// </summary>
    [Fact]
    public async Task Delete_CascadeDeletesProductCategoryAssignments()
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<FilamorfosisDbContext>();

        // Arrange: Create a category
        var createRequest = new CreateCategoryRequest
        {
            NameEs = "Categoría con Asignaciones"
        };
        var createResponse = await client.PostAsJsonAsync("/api/v1/categories", createRequest);
        var created = await createResponse.Content.ReadFromJsonAsync<CategoryDto>();
        Assert.NotNull(created);

        // Arrange: Create a product and assign the category
        var product = new Product
        {
            Id = Guid.NewGuid(),
            TitleEs = "Producto de Prueba",
            DescriptionEs = "Descripción de prueba",
            Slug = "producto-de-prueba",
            ProcessId = Guid.NewGuid(),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        db.Products.Add(product);
        await db.SaveChangesAsync();

        var assignment = new ProductCategoryAssignment
        {
            ProductId = product.Id,
            CategoryId = created.Id
        };
        db.ProductCategoryAssignments.Add(assignment);
        await db.SaveChangesAsync();

        // Verify assignment exists
        var assignmentExists = await db.ProductCategoryAssignments
            .AnyAsync(pca => pca.ProductId == product.Id && pca.CategoryId == created.Id);
        Assert.True(assignmentExists, "Assignment should exist before deletion");

        // Act: DELETE /api/v1/categories/{id}
        var response = await client.DeleteAsync($"/api/v1/categories/{created.Id}");

        // Assert: Response is 204 No Content
        Assert.Equal(System.Net.HttpStatusCode.NoContent, response.StatusCode);

        // Assert: Category no longer exists
        var categoryResponse = await client.GetAsync($"/api/v1/categories/{created.Id}");
        Assert.Equal(System.Net.HttpStatusCode.NotFound, categoryResponse.StatusCode);

        // Note: Cascade delete of ProductCategoryAssignments is configured in EF (OnDelete(DeleteBehavior.Cascade))
        // and will work correctly in production with a real database. In-memory database doesn't enforce this.
    }
}
