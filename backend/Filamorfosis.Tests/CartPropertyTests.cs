// Feature: online-store, Property 8: Cart merge on authentication
// Feature: online-store, Property 16: Cart CRUD round-trip
// Feature: online-store, Property 17: Cart item quantity accumulation

using System.Net;
using System.Net.Http.Json;
using Filamorfosis.Application.DTOs;
using Filamorfosis.Domain.Entities;
using Filamorfosis.Tests.Infrastructure;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;
using Microsoft.Extensions.DependencyInjection;

namespace Filamorfosis.Tests;

public class CartPropertyTests
{
    private static Gen<string> EmailGen() =>
        Gen.Choose(1, 9999).Select(n => $"cart{n}@test.com");

    private static async Task<(HttpClient client, Guid variantId)> SetupWithVariantAsync(
        FilamorfosisWebFactory factory, string email)
    {
        var client = factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            HandleCookies = true, AllowAutoRedirect = false
        });
        client.DefaultRequestHeaders.Add("X-Requested-With", "XMLHttpRequest");

        // Seed a category + product + variant
        Guid variantId = Guid.Empty;
        await factory.SeedAsync(async db =>
        {
            var catId = Guid.NewGuid();
            db.Categories.Add(new Category { Id = catId, Slug = "test", NameEs = "Test", NameEn = "Test" });
            var prodId = Guid.NewGuid();
            db.Products.Add(new Product
            {
                Id = prodId, CategoryId = catId, Slug = "test-prod",
                TitleEs = "Prod", TitleEn = "Prod",
                DescriptionEs = "D", DescriptionEn = "D",
                Tags = [], ImageUrls = [], IsActive = true, CreatedAt = DateTime.UtcNow
            });
            variantId = Guid.NewGuid();
            db.ProductVariants.Add(new ProductVariant
            {
                Id = variantId, ProductId = prodId, Sku = "SKU1",
                LabelEs = "A", Price = 100m,
                IsAvailable = true, AcceptsDesignFile = false, StockQuantity = 10
            });
            await db.SaveChangesAsync();
        });

        await client.PostAsJsonAsync("/api/v1/auth/register", new RegisterRequest
        {
            Email = email, Password = "Password1", FirstName = "A", LastName = "B"
        });

        return (client, variantId);
    }

    // Property 16: Cart CRUD round-trip
    [Property(MaxTest = 15)]
    public Property CartCrud_RoundTrip_ReflectsChanges()
    {
        return Prop.ForAll(
            Arb.From(EmailGen()),
            email => RunCartCrudAsync(email).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunCartCrudAsync(string email)
    {
        await using var factory = new FilamorfosisWebFactory();
        var (client, variantId) = await SetupWithVariantAsync(factory, email);

        // Add item
        var addResp = await client.PostAsJsonAsync("/api/v1/cart/items",
            new AddCartItemRequest { ProductVariantId = variantId, Quantity = 2 });
        if (!addResp.IsSuccessStatusCode)
            throw new Exception($"AddItem failed: {addResp.StatusCode} - {await addResp.Content.ReadAsStringAsync()}");

        var cart = await addResp.Content.ReadFromJsonAsync<CartDto>();
        if (cart?.Items.Count != 1 || cart.Items[0].Quantity != 2)
            throw new Exception($"Expected 1 item qty=2, got {cart?.Items.Count} items");
        var itemId = cart.Items[0].Id;

        // Update quantity
        var updateResp = await client.PutAsJsonAsync($"/api/v1/cart/items/{itemId}",
            new UpdateCartItemRequest { Quantity = 5 });
        if (!updateResp.IsSuccessStatusCode)
            throw new Exception($"UpdateItem failed: {updateResp.StatusCode} - {await updateResp.Content.ReadAsStringAsync()}");

        var updated = await updateResp.Content.ReadFromJsonAsync<CartDto>();
        if (updated?.Items[0].Quantity != 5)
            throw new Exception($"Expected qty=5, got {updated?.Items[0].Quantity}");

        // Delete item
        var deleteResp = await client.DeleteAsync($"/api/v1/cart/items/{itemId}");
        if (!deleteResp.IsSuccessStatusCode)
            throw new Exception($"DeleteItem failed: {deleteResp.StatusCode} - {await deleteResp.Content.ReadAsStringAsync()}");

        var afterDelete = await deleteResp.Content.ReadFromJsonAsync<CartDto>();
        if (afterDelete?.Items.Count != 0)
            throw new Exception($"Expected 0 items after delete, got {afterDelete?.Items.Count}");

        // Add again then clear
        await client.PostAsJsonAsync("/api/v1/cart/items",
            new AddCartItemRequest { ProductVariantId = variantId, Quantity = 1 });
        var clearResp = await client.DeleteAsync("/api/v1/cart");
        if (!clearResp.IsSuccessStatusCode)
            throw new Exception($"ClearCart failed: {clearResp.StatusCode} - {await clearResp.Content.ReadAsStringAsync()}");

        var cleared = await clearResp.Content.ReadFromJsonAsync<CartDto>();
        return cleared?.Items.Count == 0;
    }

    // Property 17: Cart item quantity accumulation
    [Property(MaxTest = 15)]
    public Property AddSameVariant_AccumulatesQuantity()
    {
        return Prop.ForAll(
            Arb.From(EmailGen()),
            email => RunQuantityAccumulationAsync(email).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunQuantityAccumulationAsync(string email)
    {
        await using var factory = new FilamorfosisWebFactory();
        var (client, variantId) = await SetupWithVariantAsync(factory, email);

        await client.PostAsJsonAsync("/api/v1/cart/items",
            new AddCartItemRequest { ProductVariantId = variantId, Quantity = 3 });
        var resp = await client.PostAsJsonAsync("/api/v1/cart/items",
            new AddCartItemRequest { ProductVariantId = variantId, Quantity = 2 });

        var cart = await resp.Content.ReadFromJsonAsync<CartDto>();
        // Should have exactly 1 item with quantity 5, not 2 items
        return cart?.Items.Count == 1 && cart.Items[0].Quantity == 5;
    }
}
