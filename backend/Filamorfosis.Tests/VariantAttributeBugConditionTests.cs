// Bug Condition Exploration Tests — Product Variant Attributes
// ============================================================
// These tests encode the EXPECTED (fixed) behavior and are intentionally
// written to FAIL on unfixed code. Failure confirms the bug exists.
//
// CONFIRMED FAILURES on unfixed code (run date: task 1 execution):
//
//   Test 1 (GetProduct_VariantShape_HasAttributesNotMaterial): FAIL
//     Counterexample: GET /api/v1/admin/products/{id} returns variant JSON with
//     key "material": null but NO "attributes" key.
//     Assert message: "variants[0] must have an 'attributes' key (FAILS on unfixed code — key is missing)"
//
//   Test 2 (CreateVariant_WithAttributesArray_ResponseHasAttributesNotMaterial): FAIL
//     Counterexample: POST /api/v1/admin/products/{id}/variants returns variant JSON with
//     key "material": null but NO "attributes" key. The "attributes" field in the request
//     body is silently ignored by the unfixed CreateVariantRequest.
//     Assert message: "Response must have an 'attributes' key (FAILS on unfixed code — key is missing)"
//
//   Test 3 (GetAttributeDefinitions_ReturnsHttp200): FAIL
//     Counterexample: GET /api/v1/admin/attribute-definitions returns HTTP 404 NotFound.
//     The AdminAttributeDefinitionsController does not exist yet.
//     Assert message: "Assert.Equal() Failure: Values differ — Expected: OK, Actual: NotFound"
//
// These tests will PASS after the fix is implemented (Tasks 3.x).
// Validates: Requirements 1.1, 1.4, 1.5, 2.1, 2.5, 2.6, 2.8

using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Filamorfosis.Application.DTOs;
using Filamorfosis.Domain.Entities;
using Filamorfosis.Tests.Infrastructure;

namespace Filamorfosis.Tests;

public class VariantAttributeBugConditionTests
{
    // ── Test 1: GET response shape ────────────────────────────────────────────
    // Seed a product + variant, call GET /api/v1/admin/products/{id},
    // assert variants[0].attributes exists (is array) and variants[0].material does NOT exist.
    [Fact]
    public async Task GetProduct_VariantShape_HasAttributesNotMaterial()
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        Guid prodId = Guid.Empty;
        await factory.SeedAsync(async db =>
        {
            var catId = Guid.NewGuid();
            db.Categories.Add(new Category
            {
                Id = catId,
                Slug = $"bug-cat-{Guid.NewGuid():N}",
                NameEs = "Cat", NameEn = "Cat"
            });

            prodId = Guid.NewGuid();
            db.Products.Add(new Product
            {
                Id = prodId, CategoryId = catId,
                Slug = $"bug-prod-{Guid.NewGuid():N}",
                TitleEs = "Producto Bug", TitleEn = "Bug Product",
                DescriptionEs = "Desc", DescriptionEn = "Desc",
                Tags = [], ImageUrls = [],
                IsActive = true, CreatedAt = DateTime.UtcNow
            });

            db.ProductVariants.Add(new ProductVariant
            {
                Id = Guid.NewGuid(), ProductId = prodId,
                Sku = $"BUG-SKU-{Guid.NewGuid():N}",
                LabelEs = "Variante",
                Price = 99m, StockQuantity = 5,
                IsAvailable = true, AcceptsDesignFile = false
                // Material column removed as part of the fix
            });

            await db.SaveChangesAsync();
        });

        var resp = await client.GetAsync($"/api/v1/admin/products/{prodId}");
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);

        var json = await resp.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        // Navigate to variants[0]
        Assert.True(root.TryGetProperty("variants", out var variantsEl),
            "Response must have a 'variants' array");
        Assert.True(variantsEl.GetArrayLength() > 0,
            "variants array must have at least one element");

        var variant0 = variantsEl[0];

        // EXPECTED (fixed) behavior: "attributes" key exists and is an array
        Assert.True(variant0.TryGetProperty("attributes", out var attributesEl),
            "variants[0] must have an 'attributes' key (FAILS on unfixed code — key is missing)");
        Assert.True(attributesEl.ValueKind == JsonValueKind.Array,
            "variants[0].attributes must be a JSON array");

        // EXPECTED (fixed) behavior: "material" key must NOT exist
        Assert.False(variant0.TryGetProperty("material", out _),
            "variants[0] must NOT have a 'material' key (FAILS on unfixed code — key is present)");
    }

    // ── Test 2: POST with attributes array ───────────────────────────────────
    // Call POST /api/v1/admin/products/{id}/variants with an attributes array,
    // assert response contains "attributes" array and no "material" field.
    [Fact]
    public async Task CreateVariant_WithAttributesArray_ResponseHasAttributesNotMaterial()
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        Guid prodId = Guid.Empty;
        await factory.SeedAsync(async db =>
        {
            var catId = Guid.NewGuid();
            db.Categories.Add(new Category
            {
                Id = catId,
                Slug = $"bug2-cat-{Guid.NewGuid():N}",
                NameEs = "Cat2", NameEn = "Cat2"
            });

            prodId = Guid.NewGuid();
            db.Products.Add(new Product
            {
                Id = prodId, CategoryId = catId,
                Slug = $"bug2-prod-{Guid.NewGuid():N}",
                TitleEs = "Producto Bug2", TitleEn = "Bug Product2",
                DescriptionEs = "Desc", DescriptionEn = "Desc",
                Tags = [], ImageUrls = [],
                IsActive = true, CreatedAt = DateTime.UtcNow
            });

            await db.SaveChangesAsync();
        });

        // POST with an attributes array (expected fixed API shape)
        var someAttributeDefinitionId = Guid.NewGuid();
        var payload = new
        {
            labelEs = "Talla L",
            labelEn = "Size L",
            sku = $"ATTR-SKU-{Guid.NewGuid():N}",
            price = 150m,
            stockQuantity = 10,
            isAvailable = true,
            acceptsDesignFile = false,
            attributes = new[]
            {
                new { attributeDefinitionId = someAttributeDefinitionId, value = "L" }
            }
        };

        var createResp = await client.PostAsJsonAsync(
            $"/api/v1/admin/products/{prodId}/variants", payload);

        Assert.Equal(HttpStatusCode.Created, createResp.StatusCode);

        var json = await createResp.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        // EXPECTED (fixed) behavior: "attributes" key exists and is an array
        Assert.True(root.TryGetProperty("attributes", out var attributesEl),
            "Response must have an 'attributes' key (FAILS on unfixed code — key is missing)");
        Assert.True(attributesEl.ValueKind == JsonValueKind.Array,
            "Response 'attributes' must be a JSON array");

        // EXPECTED (fixed) behavior: "material" key must NOT exist
        Assert.False(root.TryGetProperty("material", out _),
            "Response must NOT have a 'material' key (FAILS on unfixed code — key is present)");
    }

    // ── Test 3: Attribute catalog endpoint ───────────────────────────────────
    // Call GET /api/v1/admin/attribute-definitions, assert HTTP 200 (not 404).
    [Fact]
    public async Task GetAttributeDefinitions_ReturnsHttp200()
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        var resp = await client.GetAsync("/api/v1/admin/attribute-definitions");

        // EXPECTED (fixed) behavior: endpoint exists and returns 200
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
    }
}
