// Feature: cost-management-and-pricing, Property 9: For any variant with MaterialId set, saving then fetching returns Price = (BaseCost + Profit) × (1 + TaxRate)
// Validates: Requirements 6.7, 6.12

using System.Net.Http.Json;
using System.Text.Json;
using Filamorfosis.Domain.Entities;
using Filamorfosis.Infrastructure.Data;
using Filamorfosis.Tests.Infrastructure;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using OtpNet;

namespace Filamorfosis.Tests;

/// <summary>
/// Property-based tests for variant price persistence round-trip (cost-management-and-pricing spec).
///
/// Validates: Requirements 6.7, 6.12
/// </summary>
public class VariantPricePropertyTests
{
    private static readonly string[] AllRoles =
        ["Master", "UserManagement", "ProductManagement", "OrderManagement", "PriceManagement", "Customer"];

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static async Task<HttpClient> LoginAsMasterAsync(FilamorfosisWebFactory factory)
    {
        var email = $"master-p9-{Guid.NewGuid():N}@test.com";
        const string password = "AdminPass1";

        using var scope = factory.Services.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();

        foreach (var r in AllRoles)
            if (!await roleManager.RoleExistsAsync(r))
                await roleManager.CreateAsync(new IdentityRole<Guid>(r));

        var user = new User
        {
            Id = Guid.NewGuid(),
            UserName = email,
            Email = email,
            FirstName = "Master",
            LastName = "P9",
            CreatedAt = DateTime.UtcNow,
            EmailConfirmed = true
        };
        await userManager.CreateAsync(user, password);
        await userManager.AddToRoleAsync(user, "Master");

        var client = factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            HandleCookies = true,
            AllowAutoRedirect = false
        });
        client.DefaultRequestHeaders.Add("X-Requested-With", "XMLHttpRequest");

        // Step 1: password login
        var loginResp = await client.PostAsJsonAsync("/api/v1/auth/admin/login",
            new { email, password });
        if (!loginResp.IsSuccessStatusCode)
            throw new InvalidOperationException($"Master login failed: {loginResp.StatusCode}");

        var loginData = await loginResp.Content.ReadFromJsonAsync<JsonElement>();
        var mfaToken = loginData.GetProperty("mfaToken").GetString()!;

        // Step 2: MFA setup
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", mfaToken);
        var setupResp = await client.PostAsJsonAsync("/api/v1/auth/admin/mfa/setup", new { });
        if (!setupResp.IsSuccessStatusCode)
            throw new InvalidOperationException($"MFA setup failed: {setupResp.StatusCode}");

        // Step 3: Read secret from DB and generate TOTP code
        string secret;
        using (var scope2 = factory.Services.CreateScope())
        {
            var db = scope2.ServiceProvider.GetRequiredService<FilamorfosisDbContext>();
            var mfaRecord = db.AdminMfaSecrets.First(m => m.UserId == user.Id);
            secret = mfaRecord.SecretBase32;
        }

        var keyBytes = Base32Encoding.ToBytes(secret);
        var totp = new Totp(keyBytes);
        var code = totp.ComputeTotp();

        var confirmResp = await client.PostAsJsonAsync("/api/v1/auth/admin/mfa/confirm",
            new { mfaToken, totpCode = code });
        if (!confirmResp.IsSuccessStatusCode)
            throw new InvalidOperationException($"MFA confirm failed: {confirmResp.StatusCode}");

        client.DefaultRequestHeaders.Authorization = null;
        return client;
    }

    // ── Property 9: Variant price persistence round-trip ─────────────────────
    //
    // For any variant with MaterialId set, saving then fetching returns
    // Price = (BaseCost + Profit) × (1 + TaxRate)
    //
    // Validates: Requirements 6.7, 6.12

    [Property(MaxTest = 30)]
    public Property Property9_VariantPricePersistenceRoundTrip()
    {
        // profit in [0, 100.00], manufactureTimeMinutes in [0, 120]
        var gen =
            from profit in Gen.Choose(0, 10000).Select(i => (decimal)i / 100m)
            from minutes in Gen.Choose(0, 120)
            select (profit, minutes);

        return Prop.ForAll(
            Arb.From(gen),
            tuple => RunProperty9Async(tuple.profit, tuple.minutes).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunProperty9Async(decimal profit, int manufactureTimeMinutes)
    {
        await using var factory = new FilamorfosisWebFactory();

        // Seed: Material (Laser Engraving), CostParameter, GlobalParameter
        var materialId = Guid.NewGuid();
        var categoryId = Guid.NewGuid();

        await factory.SeedAsync(async db =>
        {
            // Seed category
            db.Categories.Add(new Category
            {
                Id = categoryId,
                Slug = $"cat-{categoryId:N}",
                NameEs = "Categoría Test",
                NameEn = "Test Category"
            });

            // Seed material with the test category
            db.Materials.Add(new Material
            {
                Id = materialId,
                Name = $"Material-{materialId:N}",
                CategoryId = categoryId,
                BaseCost = 5.00m,
                CreatedAt = DateTime.UtcNow
            });

            // Seed CostParameter: electric_cost_per_hour = 10.00 for the test category
            // Use a unique ID per test run to avoid conflicts with seeded data
            var cpId = Guid.NewGuid();
            db.CostParameters.Add(new CostParameter
            {
                Id = cpId,
                CategoryId = categoryId,
                Key = $"electric_cost_per_hour_{cpId:N}",
                Label = "Electric cost per hour (MXN/hr)",
                Unit = "MXN/hr",
                Value = 10.00m,
                UpdatedAt = DateTime.UtcNow
            });

            // Seed GlobalParameter: tax_rate = 0.16
            // Check if it already exists (seeded by DbSeeder)
            var existing = db.GlobalParameters.FirstOrDefault(gp => gp.Key == "tax_rate");
            if (existing is null)
            {
                db.GlobalParameters.Add(new GlobalParameter
                {
                    Id = Guid.NewGuid(),
                    Key = "tax_rate",
                    Label = "IVA (%)",
                    Value = "0.16",
                    UpdatedAt = DateTime.UtcNow
                });
            }
            else
            {
                existing.Value = "0.16";
            }

            await db.SaveChangesAsync();
        });

        var client = await LoginAsMasterAsync(factory);

        // Create a product
        var createProductResp = await client.PostAsJsonAsync("/api/v1/admin/products", new
        {
            titleEs = $"Producto Test {Guid.NewGuid():N}",
            titleEn = "Test Product",
            descriptionEs = "Descripción",
            descriptionEn = "Description",
            categoryId,
            tags = Array.Empty<string>(),
            isActive = true
        });

        if (!createProductResp.IsSuccessStatusCode)
            return false;

        var productData = await createProductResp.Content.ReadFromJsonAsync<JsonElement>();
        var productId = productData.GetProperty("id").GetString()!;

        // Create a variant with the seeded material
        var createVariantResp = await client.PostAsJsonAsync(
            $"/api/v1/admin/products/{productId}/variants", new
            {
                labelEs = "Variante Test",
                sku = $"SKU-{Guid.NewGuid():N}",
                price = 0m,
                stockQuantity = 10,
                isAvailable = true,
                acceptsDesignFile = false,
                materialUsages = new Dictionary<string, decimal> { [materialId.ToString()] = 1m },
                profit,
                manufactureTimeMinutes,
                attributes = Array.Empty<object>()
            });

        if (!createVariantResp.IsSuccessStatusCode)
            return false;

        // Fetch the product back via GET /api/v1/admin/products/{id}
        var getResp = await client.GetAsync($"/api/v1/admin/products/{productId}");
        if (!getResp.IsSuccessStatusCode)
            return false;

        var productDetail = await getResp.Content.ReadFromJsonAsync<JsonElement>();
        var variants = productDetail.GetProperty("variants");

        if (variants.GetArrayLength() == 0)
            return false;

        var variant = variants[0];
        var returnedPrice = variant.GetProperty("price").GetDecimal();
        var returnedBaseCost = variant.GetProperty("baseCost").GetDecimal();
        var returnedProfit = variant.GetProperty("profit").GetDecimal();

        // Verify: Price = (BaseCost + Profit) × (1 + 0.16)
        const decimal taxRate = 0.16m;
        var expectedPrice = (returnedBaseCost + returnedProfit) * (1 + taxRate);

        // Allow small decimal tolerance
        return Math.Abs(returnedPrice - expectedPrice) < 0.001m;
    }
}
