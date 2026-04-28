// Feature: online-store, Property 19: Order creation price snapshot
// Feature: online-store, Property 20: Cart cleared after order creation
// Feature: online-store, Property 24: Order list isolation
// Feature: online-store, Property 25: Cross-user order access returns 403

using System.Net;
using System.Net.Http.Json;
using Filamorfosis.Application.DTOs;
using Filamorfosis.Domain.Entities;
using Filamorfosis.Tests.Infrastructure;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;

namespace Filamorfosis.Tests;

public class OrderPropertyTests
{
    private static Gen<string> EmailGen(string prefix) =>
        Gen.Choose(1, 9999).Select(n => $"{prefix}{n}@test.com");

    private static async Task<(HttpClient client, Guid variantId, Guid addressId)> SetupUserWithCartAsync(
        FilamorfosisWebFactory factory, string email, decimal price = 199m)
    {
        var client = factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            HandleCookies = true, AllowAutoRedirect = false
        });
        client.DefaultRequestHeaders.Add("X-Requested-With", "XMLHttpRequest");

        Guid variantId = Guid.Empty;
        await factory.SeedAsync(async db =>
        {
            var catId = Guid.NewGuid();
            db.Processes.Add(new Process { Id = catId, Slug = $"cat-{catId:N}", NameEs = "T", NameEn = "T" });
            var prodId = Guid.NewGuid();
            db.Products.Add(new Product
            {
                Id = prodId, ProcessId = catId, Slug = $"prod-{prodId:N}",
                TitleEs = "Prod", TitleEn = "Prod",
                DescriptionEs = "D", DescriptionEn = "D",
                Tags = [], ImageUrls = [], IsActive = true, CreatedAt = DateTime.UtcNow
            });
            variantId = Guid.NewGuid();
            db.ProductVariants.Add(new ProductVariant
            {
                Id = variantId, ProductId = prodId, Sku = $"SKU-{variantId:N}",
                LabelEs = "L", Price = price,
                IsAvailable = true, AcceptsDesignFile = false, StockQuantity = 10
            });
            await db.SaveChangesAsync();
        });

        await client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest { Email = email, Password = "Password1", FirstName = "A", LastName = "B" });

        // Add address
        var addrResp = await client.PostAsJsonAsync("/api/v1/users/me/addresses",
            new CreateAddressRequest { Street = "Calle 1", City = "CDMX", State = "CDMX", PostalCode = "06600", Country = "MX" });
        var addr = await addrResp.Content.ReadFromJsonAsync<AddressDto>();

        // Add to cart
        await client.PostAsJsonAsync("/api/v1/cart/items",
            new AddCartItemRequest { ProductVariantId = variantId, Quantity = 2 });

        return (client, variantId, addr!.Id);
    }

    // Property 19: Order creation price snapshot
    [Property(MaxTest = 10)]
    public Property OrderCreation_SnapshotsPricesAtCreationTime()
    {
        return Prop.ForAll(
            Arb.From(EmailGen("order")),
            email => RunPriceSnapshotAsync(email).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunPriceSnapshotAsync(string email)
    {
        await using var factory = new FilamorfosisWebFactory();
        var (client, variantId, addressId) = await SetupUserWithCartAsync(factory, email, 299m);

        var createResp = await client.PostAsJsonAsync("/api/v1/orders",
            new CreateOrderRequest { ShippingAddressId = addressId });
        if (createResp.StatusCode != HttpStatusCode.Created) return false;

        var created = await createResp.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
        var orderId = created.GetProperty("orderId").GetGuid();

        // Mutate variant price in DB after order creation
        await factory.SeedAsync(async db =>
        {
            var v = db.ProductVariants.First(v => v.Id == variantId);
            v.Price = 999m;
            await db.SaveChangesAsync();
        });

        // Fetch order — snapshot price must still be 299
        var orderResp = await client.GetAsync($"/api/v1/orders/{orderId}");
        if (!orderResp.IsSuccessStatusCode) return false;

        var order = await orderResp.Content.ReadFromJsonAsync<OrderDetailDto>();
        return order?.Items.All(i => i.UnitPrice == 299m) ?? false;
    }

    // Property 20: Cart cleared after order creation
    [Property(MaxTest = 10)]
    public Property OrderCreation_ClearsCart()
    {
        return Prop.ForAll(
            Arb.From(EmailGen("clear")),
            email => RunCartClearedAsync(email).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunCartClearedAsync(string email)
    {
        await using var factory = new FilamorfosisWebFactory();
        var (client, _, addressId) = await SetupUserWithCartAsync(factory, email);

        var createResp = await client.PostAsJsonAsync("/api/v1/orders",
            new CreateOrderRequest { ShippingAddressId = addressId });
        if (createResp.StatusCode != HttpStatusCode.Created) return false;

        var cartResp = await client.GetAsync("/api/v1/cart");
        var cart = await cartResp.Content.ReadFromJsonAsync<CartDto>();
        return cart?.Items.Count == 0;
    }

    // Property 24: Order list isolation
    [Property(MaxTest = 10)]
    public Property OrderList_ReturnsOnlyCurrentUserOrders()
    {
        return Prop.ForAll(
            Arb.From(EmailGen("iso1")),
            Arb.From(EmailGen("iso2")),
            (email1, email2) => email1 != email2 &&
                RunOrderIsolationAsync(email1, email2).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunOrderIsolationAsync(string email1, string email2)
    {
        await using var factory = new FilamorfosisWebFactory();
        var (client1, _, addr1) = await SetupUserWithCartAsync(factory, email1);
        var (client2, _, addr2) = await SetupUserWithCartAsync(factory, email2);

        await client1.PostAsJsonAsync("/api/v1/orders", new CreateOrderRequest { ShippingAddressId = addr1 });
        await client2.PostAsJsonAsync("/api/v1/orders", new CreateOrderRequest { ShippingAddressId = addr2 });

        var resp1 = await client1.GetAsync("/api/v1/orders?pageSize=100");
        var result1 = await resp1.Content.ReadFromJsonAsync<PagedResult<OrderSummaryDto>>();

        var resp2 = await client2.GetAsync("/api/v1/orders?pageSize=100");
        var result2 = await resp2.Content.ReadFromJsonAsync<PagedResult<OrderSummaryDto>>();

        // Each user should see exactly their own orders
        var ids1 = result1?.Items.Select(o => o.Id).ToHashSet() ?? new();
        var ids2 = result2?.Items.Select(o => o.Id).ToHashSet() ?? new();
        return !ids1.Overlaps(ids2);
    }

    // Property 25: Cross-user order access returns 403
    [Property(MaxTest = 10)]
    public Property CrossUserOrderAccess_Returns403()
    {
        return Prop.ForAll(
            Arb.From(EmailGen("cross1")),
            Arb.From(EmailGen("cross2")),
            (email1, email2) => email1 != email2 &&
                RunCrossUserAsync(email1, email2).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunCrossUserAsync(string email1, string email2)
    {
        await using var factory = new FilamorfosisWebFactory();
        var (client1, _, addr1) = await SetupUserWithCartAsync(factory, email1);
        var (client2, _, _) = await SetupUserWithCartAsync(factory, email2);

        var createResp = await client1.PostAsJsonAsync("/api/v1/orders",
            new CreateOrderRequest { ShippingAddressId = addr1 });
        if (createResp.StatusCode != HttpStatusCode.Created) return false;

        var created = await createResp.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
        var orderId = created.GetProperty("orderId").GetGuid();

        var resp = await client2.GetAsync($"/api/v1/orders/{orderId}");
        return resp.StatusCode == HttpStatusCode.Forbidden;
    }
}
