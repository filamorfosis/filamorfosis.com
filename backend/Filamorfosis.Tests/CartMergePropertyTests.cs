// Feature: online-store, Property 8: Cart merge on authentication

using System.Net.Http.Json;
using Filamorfosis.Application.DTOs;
using Filamorfosis.Domain.Entities;
using Filamorfosis.Tests.Infrastructure;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;

namespace Filamorfosis.Tests;

/// <summary>
/// Property 8: Cart merge on authentication
///
/// For any guest cart containing N items and any user cart containing M items
/// (with possible variant overlaps), after login or registration the user's cart
/// must contain all variants from both carts, with quantities summed for
/// overlapping variants, and the total item count must be ≥ max(N, M).
///
/// Validates: Requirements 2.6, 3.7
/// </summary>
public class CartMergePropertyTests
{
    private static Gen<string> EmailGen(string prefix) =>
        Gen.Choose(1, 9999).Select(n => $"{prefix}{n}@merge-test.com");

    /// <summary>
    /// Seeds a category + product + two variants, returning their IDs.
    /// </summary>
    private static async Task<(Guid variantA, Guid variantB)> SeedVariantsAsync(FilamorfosisWebFactory factory)
    {
        var variantA = Guid.Empty;
        var variantB = Guid.Empty;

        await factory.SeedAsync(async db =>
        {
            var catId = Guid.NewGuid();
            db.Processes.Add(new Process { Id = catId, Slug = $"merge-{catId:N}", NameEs = "Merge"});

            var prodId = Guid.NewGuid();
            db.Products.Add(new Product
            {
                Id = prodId, ProcessId = catId, Slug = $"merge-prod-{prodId:N}",
                TitleEs = "Merge Prod",
                DescriptionEs = "D",
                Tags = [], ImageUrls = [], IsActive = true, CreatedAt = DateTime.UtcNow
            });

            variantA = Guid.NewGuid();
            variantB = Guid.NewGuid();
            db.ProductVariants.AddRange(
                new ProductVariant { Id = variantA, ProductId = prodId, Sku = $"MA-{variantA:N}", LabelEs = "A", Price = 100m, IsAvailable = true, AcceptsDesignFile = false, StockQuantity = 50 },
                new ProductVariant { Id = variantB, ProductId = prodId, Sku = $"MB-{variantB:N}", LabelEs = "B", Price = 200m, IsAvailable = true, AcceptsDesignFile = false, StockQuantity = 50 }
            );
            await db.SaveChangesAsync();
        });

        return (variantA, variantB);
    }

    // Property 8a: Guest cart items are merged into user cart on registration
    [Property(MaxTest = 10)]
    public Property GuestCart_MergedIntoNewUserCart_OnRegister()
    {
        return Prop.ForAll(
            Arb.From(EmailGen("reg-merge")),
            email => RunGuestMergeOnRegisterAsync(email).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunGuestMergeOnRegisterAsync(string email)
    {
        await using var factory = new FilamorfosisWebFactory();
        var (variantA, variantB) = await SeedVariantsAsync(factory);

        // Guest client — cookies tracked so guest_cart_token is sent
        var guestClient = factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            HandleCookies = true, AllowAutoRedirect = false
        });
        guestClient.DefaultRequestHeaders.Add("X-Requested-With", "XMLHttpRequest");

        // Add 2 of variantA as guest
        var addResp = await guestClient.PostAsJsonAsync("/api/v1/cart/items",
            new AddCartItemRequest { ProductVariantId = variantA, Quantity = 2 });
        if (!addResp.IsSuccessStatusCode)
            throw new Exception($"Guest add failed: {addResp.StatusCode} - {await addResp.Content.ReadAsStringAsync()}");

        // Register — should trigger cart merge
        var regResp = await guestClient.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest { Email = email, Password = "Password1", FirstName = "A", LastName = "B" });
        if (!regResp.IsSuccessStatusCode)
            throw new Exception($"Register failed: {regResp.StatusCode} - {await regResp.Content.ReadAsStringAsync()}");

        // Fetch cart — must contain variantA with qty ≥ 2
        var cartResp = await guestClient.GetAsync("/api/v1/cart");
        if (!cartResp.IsSuccessStatusCode)
            throw new Exception($"GetCart failed: {cartResp.StatusCode} - {await cartResp.Content.ReadAsStringAsync()}");

        var cart = await cartResp.Content.ReadFromJsonAsync<CartDto>();
        if (cart is null) throw new Exception("Cart is null");

        var itemA = cart.Items.FirstOrDefault(i => i.ProductVariantId == variantA);
        if (itemA is null)
            throw new Exception($"variantA not found in cart. Items: {string.Join(", ", cart.Items.Select(i => $"{i.ProductVariantId}={i.Quantity}"))}");
        if (itemA.Quantity < 2)
            throw new Exception($"Expected qty >= 2 for variantA, got {itemA.Quantity}");
        return true;
    }

    // Property 8b: Guest cart items are merged into existing user cart on login
    [Property(MaxTest = 10)]
    public Property GuestCart_MergedIntoExistingUserCart_OnLogin()
    {
        return Prop.ForAll(
            Arb.From(EmailGen("login-merge")),
            email => RunGuestMergeOnLoginAsync(email).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunGuestMergeOnLoginAsync(string email)
    {
        await using var factory = new FilamorfosisWebFactory();
        var (variantA, variantB) = await SeedVariantsAsync(factory);

        // Pre-register the user (no guest cart yet)
        var setupClient = factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            HandleCookies = true, AllowAutoRedirect = false
        });
        setupClient.DefaultRequestHeaders.Add("X-Requested-With", "XMLHttpRequest");

        await setupClient.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest { Email = email, Password = "Password1", FirstName = "A", LastName = "B" });

        // Add variantB to the logged-in user's cart
        await setupClient.PostAsJsonAsync("/api/v1/cart/items",
            new AddCartItemRequest { ProductVariantId = variantB, Quantity = 3 });

        // Logout
        await setupClient.PostAsJsonAsync("/api/v1/auth/logout", new { });

        // New guest client — add variantA as guest
        var guestClient = factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            HandleCookies = true, AllowAutoRedirect = false
        });
        guestClient.DefaultRequestHeaders.Add("X-Requested-With", "XMLHttpRequest");

        await guestClient.PostAsJsonAsync("/api/v1/cart/items",
            new AddCartItemRequest { ProductVariantId = variantA, Quantity = 1 });

        // Login — should merge guest cart (variantA×1) into user cart (variantB×3)
        var loginResp = await guestClient.PostAsJsonAsync("/api/v1/auth/login",
            new LoginRequest { Email = email, Password = "Password1" });
        if (!loginResp.IsSuccessStatusCode) return false;

        // Fetch merged cart
        var cartResp = await guestClient.GetAsync("/api/v1/cart");
        if (!cartResp.IsSuccessStatusCode) return false;

        var cart = await cartResp.Content.ReadFromJsonAsync<CartDto>();
        if (cart is null) return false;

        // Must contain both variants
        var hasA = cart.Items.Any(i => i.ProductVariantId == variantA && i.Quantity >= 1);
        var hasB = cart.Items.Any(i => i.ProductVariantId == variantB && i.Quantity >= 3);
        return hasA && hasB;
    }

    // Property 8c: Overlapping variants have quantities summed after merge
    [Property(MaxTest = 10)]
    public Property OverlappingVariants_QuantitiesSummed_AfterMerge()
    {
        return Prop.ForAll(
            Arb.From(EmailGen("overlap-merge")),
            email => RunOverlapMergeAsync(email).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunOverlapMergeAsync(string email)
    {
        await using var factory = new FilamorfosisWebFactory();
        var (variantA, _) = await SeedVariantsAsync(factory);

        // Pre-register and add variantA×3 to user cart
        var setupClient = factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            HandleCookies = true, AllowAutoRedirect = false
        });
        setupClient.DefaultRequestHeaders.Add("X-Requested-With", "XMLHttpRequest");

        await setupClient.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest { Email = email, Password = "Password1", FirstName = "A", LastName = "B" });
        await setupClient.PostAsJsonAsync("/api/v1/cart/items",
            new AddCartItemRequest { ProductVariantId = variantA, Quantity = 3 });
        await setupClient.PostAsJsonAsync("/api/v1/auth/logout", new { });

        // Guest adds variantA×2
        var guestClient = factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            HandleCookies = true, AllowAutoRedirect = false
        });
        guestClient.DefaultRequestHeaders.Add("X-Requested-With", "XMLHttpRequest");

        await guestClient.PostAsJsonAsync("/api/v1/cart/items",
            new AddCartItemRequest { ProductVariantId = variantA, Quantity = 2 });

        // Login — variantA should be 3+2=5
        await guestClient.PostAsJsonAsync("/api/v1/auth/login",
            new LoginRequest { Email = email, Password = "Password1" });

        var cartResp = await guestClient.GetAsync("/api/v1/cart");
        var cart = await cartResp.Content.ReadFromJsonAsync<CartDto>();
        if (cart is null) return false;

        // Exactly one entry for variantA with quantity = 5
        var items = cart.Items.Where(i => i.ProductVariantId == variantA).ToList();
        return items.Count == 1 && items[0].Quantity == 5;
    }
}
