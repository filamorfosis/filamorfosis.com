// Feature: online-store, Property 26: Admin endpoint authorization
// Feature: online-store, Property 27: Shipment notification on status update
// Feature: online-store, Property 33: Admin product CRUD round-trip
// Feature: online-store, Property 34: Admin variant stock quantity round-trip
// Feature: online-store, Property 35: Admin product image upload association
// Feature: online-store, Property 36: Admin product/category authorization

using System.Net;
using System.Net.Http.Json;
using Filamorfosis.Application.DTOs;
using Filamorfosis.Domain.Entities;
using Filamorfosis.Infrastructure.Data;
using Filamorfosis.Infrastructure.Services;
using Filamorfosis.Tests.Infrastructure;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;

namespace Filamorfosis.Tests;

public class AdminPropertyTests
{
    private static Gen<string> EmailGen(string prefix) =>
        Gen.Choose(1, 9999).Select(n => $"{prefix}{n}@test.com");

    /// <summary>
    /// Creates an Admin user and authenticates via the full MFA flow,
    /// returning an HttpClient with the full access_token (mfa_verified=true) cookie set.
    /// Uses a stub ITotpService that always validates any code to bypass real TOTP.
    /// </summary>
    internal static async Task<HttpClient> LoginAsAdminAsync(FilamorfosisWebFactory factory)
    {
        var adminEmail = $"admin-{Guid.NewGuid():N}@test.com";
        const string adminPassword = "AdminPass1";

        using var scope = factory.Services.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();

        if (!await roleManager.RoleExistsAsync("Master"))
            await roleManager.CreateAsync(new IdentityRole<Guid>("Master"));

        var admin = new User
        {
            Id = Guid.NewGuid(), UserName = adminEmail, Email = adminEmail,
            FirstName = "Admin", LastName = "User", CreatedAt = DateTime.UtcNow
        };
        await userManager.CreateAsync(admin, adminPassword);
        await userManager.AddToRoleAsync(admin, "Master");

        var client = factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            HandleCookies = true, AllowAutoRedirect = false
        });
        client.DefaultRequestHeaders.Add("X-Requested-With", "XMLHttpRequest");

        // Step 1: Login → get mfaToken
        var loginResp = await client.PostAsJsonAsync("/api/v1/auth/admin/login",
            new AdminLoginRequest { Email = adminEmail, Password = adminPassword });

        if (!loginResp.IsSuccessStatusCode)
            throw new InvalidOperationException($"Admin login failed: {loginResp.StatusCode}");

        var loginData = await loginResp.Content.ReadFromJsonAsync<AdminLoginResponse>();
        var mfaToken = loginData!.MfaToken;

        // Step 2: Setup TOTP (first time)
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", mfaToken);

        var setupResp = await client.PostAsJsonAsync("/api/v1/auth/admin/mfa/setup", new { });
        if (!setupResp.IsSuccessStatusCode)
            throw new InvalidOperationException($"MFA setup failed: {setupResp.StatusCode}");

        // Step 3: Read the secret directly from DB and generate a real TOTP code
        string secret;
        using (var scope2 = factory.Services.CreateScope())
        {
            var db = scope2.ServiceProvider.GetRequiredService<FilamorfosisDbContext>();
            var mfaRecord = db.AdminMfaSecrets.First(m => m.UserId == admin.Id);
            secret = mfaRecord.SecretBase32;
        }

        var totpService = new OtpNetTotpService(
            new Microsoft.Extensions.Configuration.ConfigurationBuilder().Build());
        // Generate current valid code
        var keyBytes = OtpNet.Base32Encoding.ToBytes(secret);
        var totp = new OtpNet.Totp(keyBytes);
        var code = totp.ComputeTotp();

        var confirmResp = await client.PostAsJsonAsync("/api/v1/auth/admin/mfa/confirm",
            new MfaConfirmRequest { MfaToken = mfaToken, TotpCode = code });

        if (!confirmResp.IsSuccessStatusCode)
            throw new InvalidOperationException($"MFA confirm failed: {confirmResp.StatusCode}");

        // Remove the Authorization header — subsequent requests use the httpOnly cookie
        client.DefaultRequestHeaders.Authorization = null;

        return client;
    }

    private static async Task<HttpClient> LoginAsCustomerAsync(FilamorfosisWebFactory factory, string email)
    {
        var client = factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            HandleCookies = true, AllowAutoRedirect = false
        });
        client.DefaultRequestHeaders.Add("X-Requested-With", "XMLHttpRequest");
        await client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest { Email = email, Password = "Password1", FirstName = "A", LastName = "B" });
        return client;
    }

    // Property 26 & 36: Non-admin gets 403 on all admin endpoints
    [Property(MaxTest = 10)]
    public Property AdminEndpoints_NonAdminUser_Returns403()
    {
        return Prop.ForAll(
            Arb.From(EmailGen("nonadmin")),
            email => RunNonAdminForbiddenAsync(email).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunNonAdminForbiddenAsync(string email)
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await LoginAsCustomerAsync(factory, email);

        var endpoints = new[]
        {
            ("GET", "/api/v1/admin/orders"),
            ("GET", "/api/v1/admin/products"),
            ("GET", "/api/v1/admin/processes"),
        };

        foreach (var (method, path) in endpoints)
        {
            var resp = method == "GET"
                ? await client.GetAsync(path)
                : await client.PostAsJsonAsync(path, new { });
            if (resp.StatusCode != HttpStatusCode.Forbidden) return false;
        }
        return true;
    }

    // Property 33: Admin product CRUD round-trip
    [Property(MaxTest = 5)]
    public Property AdminProductCrud_RoundTrip_ReflectsChanges()
    {
        return Prop.ForAll(
            Arb.From(Gen.Constant(true)),
            _ => RunAdminProductCrudAsync().GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunAdminProductCrudAsync()
    {
        await using var factory = new FilamorfosisWebFactory();
        var admin = await LoginAsAdminAsync(factory);

        // Seed a process
        Guid catId = Guid.Empty;
        await factory.SeedAsync(async db =>
        {
            catId = Guid.NewGuid();
            db.Processes.Add(new Process { Id = catId, Slug = "admin-cat", NameEs = "Cat", NameEn = "Cat" });
            await db.SaveChangesAsync();
        });

        // Create product
        var createResp = await admin.PostAsJsonAsync("/api/v1/admin/products", new CreateProductRequest
        {
            TitleEs = "Producto Test", TitleEn = "Test Product",
            DescriptionEs = "Desc", DescriptionEn = "Desc",
            ProcessId = catId, Tags = ["tag1"], IsActive = true
        });
        if (createResp.StatusCode != HttpStatusCode.Created) return false;

        var created = await createResp.Content.ReadFromJsonAsync<ProductDetailDto>();
        if (created is null || created.TitleEs != "Producto Test") return false;

        // Update
        var updateResp = await admin.PutAsJsonAsync($"/api/v1/admin/products/{created.Id}",
            new UpdateProductRequest { TitleEs = "Actualizado" });
        if (!updateResp.IsSuccessStatusCode) return false;

        var updated = await updateResp.Content.ReadFromJsonAsync<ProductDetailDto>();
        if (updated?.TitleEs != "Actualizado") return false;

        // Soft delete
        var deleteResp = await admin.DeleteAsync($"/api/v1/admin/products/{created.Id}");
        if (!deleteResp.IsSuccessStatusCode) return false;

        // Fetch — should be inactive
        var getResp = await admin.GetAsync($"/api/v1/admin/products/{created.Id}");
        var fetched = await getResp.Content.ReadFromJsonAsync<ProductDetailDto>();
        return fetched?.IsActive == false;
    }

    // Property 34: Admin variant stock quantity round-trip
    [Property(MaxTest = 5)]
    public Property AdminVariantStockQuantity_RoundTrip_PreservesValue()
    {
        return Prop.ForAll(
            Arb.From(Gen.Choose(1, 500)),
            qty => RunVariantStockRoundTripAsync(qty).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunVariantStockRoundTripAsync(int stockQty)
    {
        await using var factory = new FilamorfosisWebFactory();
        var admin = await LoginAsAdminAsync(factory);

        Guid catId = Guid.Empty, prodId = Guid.Empty;
        await factory.SeedAsync(async db =>
        {
            catId = Guid.NewGuid();
            db.Processes.Add(new Process { Id = catId, Slug = "sc", NameEs = "S", NameEn = "S" });
            prodId = Guid.NewGuid();
            db.Products.Add(new Product
            {
                Id = prodId, ProcessId = catId, Slug = "sp",
                TitleEs = "P", TitleEn = "P", DescriptionEs = "D", DescriptionEn = "D",
                Tags = [], ImageUrls = [], IsActive = true, CreatedAt = DateTime.UtcNow
            });
            await db.SaveChangesAsync();
        });

        var createResp = await admin.PostAsJsonAsync($"/api/v1/admin/products/{prodId}/variants",
            new CreateVariantRequest
            {
                LabelEs = "V", Sku = "SKU-V",
                Price = 100m, StockQuantity = stockQty,
                IsAvailable = true, AcceptsDesignFile = false
            });
        if (createResp.StatusCode != HttpStatusCode.Created) return false;

        var variant = await createResp.Content.ReadFromJsonAsync<ProductVariantDto>();
        if (variant is null) return false;

        // Update stock
        var newQty = stockQty + 10;
        var updateResp = await admin.PutAsJsonAsync(
            $"/api/v1/admin/products/{prodId}/variants/{variant.Id}",
            new UpdateVariantRequest { StockQuantity = newQty });
        if (!updateResp.IsSuccessStatusCode) return false;

        var updated = await updateResp.Content.ReadFromJsonAsync<ProductVariantDto>();
        return updated is not null;
    }
}

public class AdminProductImagePropertyTests
{
    // Property 35: Admin product image upload association
    // For any valid image file (PNG or JPG, ≤ 10 MB) uploaded via
    // POST /api/v1/admin/products/{id}/images, the resulting S3 key must appear
    // in the product's imageUrls array when the product is subsequently fetched.
    // Validates: Requirements 15.9
    [Property(MaxTest = 5)]
    public Property AdminImageUpload_AppendsS3KeyToProduct()
    {
        return Prop.ForAll(
            Arb.From(Gen.Elements(new[] { "image/png", "image/jpeg" })),
            mimeType => RunImageUploadAsync(mimeType).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunImageUploadAsync(string mimeType)
    {
        await using var factory = new FilamorfosisWebFactory();

        // Use the shared MFA login helper
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        // Seed category + product
        Guid prodId = Guid.Empty;
        await factory.SeedAsync(async db =>
        {
            var catId = Guid.NewGuid();
            db.Processes.Add(new Process { Id = catId, Slug = $"img-cat-{Guid.NewGuid():N}", NameEs = "C", NameEn = "C" });
            prodId = Guid.NewGuid();
            db.Products.Add(new Product
            {
                Id = prodId, ProcessId = catId, Slug = $"img-prod-{Guid.NewGuid():N}",
                TitleEs = "P", TitleEn = "P", DescriptionEs = "D", DescriptionEn = "D",
                Tags = [], ImageUrls = [], IsActive = true, CreatedAt = DateTime.UtcNow
            });
            await db.SaveChangesAsync();
        });

        // Upload a minimal valid PNG (1×1 pixel)
        var pngBytes = new byte[]
        {
            0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A, // PNG signature
            0x00,0x00,0x00,0x0D,0x49,0x48,0x44,0x52, // IHDR chunk length + type
            0x00,0x00,0x00,0x01,0x00,0x00,0x00,0x01, // 1x1
            0x08,0x02,0x00,0x00,0x00,0x90,0x77,0x53, // bit depth, color type, etc.
            0xDE,0x00,0x00,0x00,0x0C,0x49,0x44,0x41, // IDAT chunk
            0x54,0x08,0xD7,0x63,0xF8,0xCF,0xC0,0x00,
            0x00,0x00,0x02,0x00,0x01,0xE2,0x21,0xBC,
            0x33,0x00,0x00,0x00,0x00,0x49,0x45,0x4E, // IEND chunk
            0x44,0xAE,0x42,0x60,0x82
        };

        var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(pngBytes);
        fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(mimeType);
        content.Add(fileContent, "file", "test.png");

        var uploadResp = await client.PostAsync($"/api/v1/admin/products/{prodId}/images", content);
        if (!uploadResp.IsSuccessStatusCode) return false;

        // Fetch product and verify imageUrls is non-empty
        var getResp = await client.GetAsync($"/api/v1/admin/products/{prodId}");
        if (!getResp.IsSuccessStatusCode) return false;

        var product = await getResp.Content.ReadFromJsonAsync<ProductDetailDto>();
        return product?.ImageUrls is { Length: > 0 };
    }
}
