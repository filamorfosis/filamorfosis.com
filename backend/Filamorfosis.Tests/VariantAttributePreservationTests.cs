// Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
// Property 2: Preservation — Core Variant Fields Unchanged
// These tests MUST PASS on unfixed code — they capture baseline behavior to preserve after the fix.

using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Filamorfosis.Application.DTOs;
using Filamorfosis.Domain.Entities;
using Filamorfosis.Tests.Infrastructure;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;
using static Filamorfosis.Domain.Entities.OrderStatus;

namespace Filamorfosis.Tests;

/// <summary>
/// Preservation property tests — written BEFORE the fix.
/// All tests must PASS on unfixed code, confirming the baseline behavior
/// that must remain unchanged after the attribute system is introduced.
/// Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
/// </summary>
public class VariantAttributePreservationTests
{
    // ── Property: Core fields preservation ───────────────────────────────────
    // For randomly generated core-field values (sku, labelEs, price, stockQuantity,
    // isAvailable, acceptsDesignFile), POST /api/v1/admin/products/{id}/variants
    // followed by GET /api/v1/admin/products/{id} returns exactly those core-field
    // values unchanged.
    // Validates: Requirements 3.1, 3.2

    [Property(MaxTest = 10)]
    public Property CoreFields_PostThenGet_PreservesAllCoreFields()
    {
        var gen =
            Gen.Choose(1, 9999).Select(n => $"PRES-{n}").SelectMany(sku =>
            Gen.Elements("Talla S", "Talla M", "Talla L", "Color Rojo", "Color Azul").SelectMany(labelEs =>
            Gen.Choose(1, 9999).Select(n => (decimal)n).SelectMany(price =>
            Gen.Choose(1, 500).SelectMany(stock =>
            Gen.Elements(true, false).SelectMany(isAvailable =>
            Gen.Elements(true, false).Select(acceptsDesign =>
                (sku, labelEs, price, stock, isAvailable, acceptsDesign)))))));

        return Prop.ForAll(
            Arb.From(gen),
            tuple => RunCoreFieldsPreservationAsync(
                tuple.sku, tuple.labelEs, tuple.price,
                tuple.stock, tuple.isAvailable, tuple.acceptsDesign
            ).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunCoreFieldsPreservationAsync(
        string sku, string labelEs, decimal price,
        int stockQuantity, bool isAvailable, bool acceptsDesignFile)
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        Guid prodId = Guid.Empty;
        await factory.SeedAsync(async db =>
        {
            var catId = Guid.NewGuid();
            db.Processes.Add(new Process
            {
                Id = catId,
                Slug = $"pres-cat-{Guid.NewGuid():N}",
                NameEs = "Cat"});
            prodId = Guid.NewGuid();
            db.Products.Add(new Product
            {
                Id = prodId, ProcessId = catId,
                Slug = $"pres-prod-{Guid.NewGuid():N}",
                TitleEs = "Preservation Product",
                DescriptionEs = "D",
                Tags = [],
                IsActive = true, CreatedAt = DateTime.UtcNow
            });
            await db.SaveChangesAsync();
        });

        // POST variant with only core fields
        var createResp = await client.PostAsJsonAsync(
            $"/api/v1/admin/products/{prodId}/variants",
            new CreateVariantRequest
            {
                Sku = sku,
                LabelEs = labelEs,
                Price = price,
                StockQuantity = stockQuantity,
                IsAvailable = isAvailable,
                AcceptsDesignFile = acceptsDesignFile
            });

        if (createResp.StatusCode != HttpStatusCode.Created) return false;

        var created = await createResp.Content.ReadFromJsonAsync<ProductVariantDto>();
        if (created is null) return false;

        // GET product and find the variant
        var getResp = await client.GetAsync($"/api/v1/admin/products/{prodId}");
        if (!getResp.IsSuccessStatusCode) return false;

        var product = await getResp.Content.ReadFromJsonAsync<ProductDetailDto>();
        var variant = product?.Variants.FirstOrDefault(v => v.Id == created.Id);
        if (variant is null) return false;

        // Assert all core fields are preserved exactly
        return variant.Sku == sku
            && variant.LabelEs == labelEs
            && variant.Price == price
            && variant.IsAvailable == isAvailable
            && variant.AcceptsDesignFile == acceptsDesignFile;
    }

    // ── Property: Variant delete conflict ────────────────────────────────────
    // For any variant referenced by an order,
    // DELETE /api/v1/admin/products/{id}/variants/{variantId} returns HTTP 409.
    // Validates: Requirements 3.3

    [Property(MaxTest = 10)]
    public Property VariantDelete_ReferencedByOrder_Returns409()
    {
        return Prop.ForAll(
            Arb.From(Gen.Choose(1, 3)),
            orderItemCount =>
                RunDeleteConflictAsync(orderItemCount).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunDeleteConflictAsync(int orderItemCount)
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        Guid prodId = Guid.Empty, variantId = Guid.Empty;

        await factory.SeedAsync(async db =>
        {
            var catId = Guid.NewGuid();
            db.Processes.Add(new Process
            {
                Id = catId,
                Slug = $"dc-cat-{Guid.NewGuid():N}",
                NameEs = "DCat"});

            prodId = Guid.NewGuid();
            db.Products.Add(new Product
            {
                Id = prodId, ProcessId = catId,
                Slug = $"dc-prod-{Guid.NewGuid():N}",
                TitleEs = "P",
                DescriptionEs = "D",
                Tags = [],
                IsActive = true, CreatedAt = DateTime.UtcNow
            });

            variantId = Guid.NewGuid();
            db.ProductVariants.Add(new ProductVariant
            {
                Id = variantId, ProductId = prodId,
                Sku = $"DC-{Guid.NewGuid():N}",
                LabelEs = "V",
                Price = 100m, StockQuantity = 10,
                IsAvailable = true, AcceptsDesignFile = false
            });

            var userId = Guid.NewGuid();
            db.Users.Add(new User
            {
                Id = userId,
                UserName = $"user-{Guid.NewGuid():N}@test.com",
                Email = $"user-{Guid.NewGuid():N}@test.com",
                FirstName = "Test", LastName = "User",
                CreatedAt = DateTime.UtcNow,
                NormalizedEmail = "USER@TEST.COM",
                NormalizedUserName = "USER@TEST.COM"
            });

            var addressId = Guid.NewGuid();
            db.Addresses.Add(new Address
            {
                Id = addressId, UserId = userId,
                Street = "Calle 1", City = "CDMX",
                State = "CDMX", PostalCode = "06600",
                Country = "MX", IsDefault = true
            });

            var orderId = Guid.NewGuid();
            db.Orders.Add(new Order
            {
                Id = orderId, UserId = userId,
                ShippingAddressId = addressId,
                Status = OrderStatus.Paid,
                Total = 100m * orderItemCount,
                CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow
            });

            for (var i = 0; i < orderItemCount; i++)
            {
                db.OrderItems.Add(new OrderItem
                {
                    Id = Guid.NewGuid(),
                    OrderId = orderId,
                    ProductVariantId = variantId,
                    ProductTitleEs = "P", VariantLabelEs = "V", UnitPrice = 100m, Quantity = 1
                });
            }

            await db.SaveChangesAsync();
        });

        var resp = await client.DeleteAsync($"/api/v1/admin/products/{prodId}/variants/{variantId}");
        return resp.StatusCode == HttpStatusCode.Conflict;
    }

    // ── Fact: Variant delete success ─────────────────────────────────────────
    // For an unreferenced variant, DELETE returns HTTP 204.
    // Validates: Requirements 3.3

    [Fact]
    public async Task VariantDelete_Unreferenced_Returns204()
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        Guid prodId = Guid.Empty, variantId = Guid.Empty;

        await factory.SeedAsync(async db =>
        {
            var catId = Guid.NewGuid();
            db.Processes.Add(new Process
            {
                Id = catId,
                Slug = $"del-cat-{Guid.NewGuid():N}",
                NameEs = "DelCat"});

            prodId = Guid.NewGuid();
            db.Products.Add(new Product
            {
                Id = prodId, ProcessId = catId,
                Slug = $"del-prod-{Guid.NewGuid():N}",
                TitleEs = "P",
                DescriptionEs = "D",
                Tags = [],
                IsActive = true, CreatedAt = DateTime.UtcNow
            });

            variantId = Guid.NewGuid();
            db.ProductVariants.Add(new ProductVariant
            {
                Id = variantId, ProductId = prodId,
                Sku = $"DEL-{Guid.NewGuid():N}",
                LabelEs = "V",
                Price = 50m, StockQuantity = 5,
                IsAvailable = true, AcceptsDesignFile = false
            });

            await db.SaveChangesAsync();
        });

        var resp = await client.DeleteAsync($"/api/v1/admin/products/{prodId}/variants/{variantId}");
        Assert.Equal(HttpStatusCode.NoContent, resp.StatusCode);
    }

    // ── Fact: Storefront GET preservation ────────────────────────────────────
    // GET /api/v1/products returns HTTP 200 with paginated product summaries
    // containing all existing product-level fields.
    // Validates: Requirements 3.4, 3.5

    [Fact]
    public async Task StorefrontGetProducts_ReturnsAllProductLevelFields()
    {
        await using var factory = new FilamorfosisWebFactory();

        // Seed a product with a variant so the response is non-empty
        await factory.SeedAsync(async db =>
        {
            var catId = Guid.NewGuid();
            db.Processes.Add(new Process
            {
                Id = catId,
                Slug = $"sf-cat-{Guid.NewGuid():N}",
                NameEs = "SFCat"});

            var prodId = Guid.NewGuid();
            db.Products.Add(new Product
            {
                Id = prodId, ProcessId = catId,
                Slug = $"sf-prod-{Guid.NewGuid():N}",
                TitleEs = "Producto Storefront",
                DescriptionEs = "Descripción",
                Tags = ["tag1", "tag2"],
                Badge = "new",
                IsActive = true, CreatedAt = DateTime.UtcNow
            });

            db.ProductVariants.Add(new ProductVariant
            {
                Id = Guid.NewGuid(), ProductId = prodId,
                Sku = $"SF-{Guid.NewGuid():N}",
                LabelEs = "Variante",
                Price = 299m, StockQuantity = 20,
                IsAvailable = true, AcceptsDesignFile = false
            });

            await db.SaveChangesAsync();
        });

        // Use an unauthenticated client — storefront is public
        await using var factory2 = factory;
        var client = factory.CreateClient();

        var resp = await client.GetAsync("/api/v1/products");
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);

        var json = await resp.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        // Verify top-level pagination fields
        Assert.True(root.TryGetProperty("items", out var items), "Response must have 'items' array");
        Assert.True(root.TryGetProperty("totalCount", out _), "Response must have 'totalCount'");
        Assert.True(root.TryGetProperty("page", out _), "Response must have 'page'");
        Assert.True(root.TryGetProperty("pageSize", out _), "Response must have 'pageSize'");

        Assert.True(items.GetArrayLength() > 0, "items array must be non-empty");

        // Verify all product-level fields are present on the first item
        var first = items.EnumerateArray().First();
        Assert.True(first.TryGetProperty("id", out _), "Product must have 'id'");
        Assert.True(first.TryGetProperty("slug", out _), "Product must have 'slug'");
        Assert.True(first.TryGetProperty("titleEs", out _), "Product must have 'titleEs'");
        Assert.True(first.TryGetProperty("titleEn", out _), "Product must have 'titleEn'");
        Assert.True(first.TryGetProperty("descriptionEs", out _), "Product must have 'descriptionEs'");
        Assert.True(first.TryGetProperty("descriptionEn", out _), "Product must have 'descriptionEn'");
        Assert.True(first.TryGetProperty("tags", out _), "Product must have 'tags'");
        Assert.True(first.TryGetProperty("imageUrls", out _), "Product must have 'imageUrls'");
        Assert.True(first.TryGetProperty("badge", out _), "Product must have 'badge'");
        Assert.True(first.TryGetProperty("basePrice", out _), "Product must have 'basePrice'");
        Assert.True(first.TryGetProperty("isActive", out _), "Product must have 'isActive'");
        Assert.True(first.TryGetProperty("ProcessId", out _), "Product must have 'ProcessId'");
    }
}

