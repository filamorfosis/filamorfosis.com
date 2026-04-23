// Feature: admin-store-management, Property 1: Admin endpoint authorization
// Feature: admin-store-management, Property 2: Admin endpoint role enforcement
// Feature: admin-store-management, Property 3: MFA enforcement on admin login

using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Filamorfosis.Application.DTOs;
using Filamorfosis.Domain.Entities;
using Filamorfosis.Tests.Infrastructure;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;

namespace Filamorfosis.Tests;

/// <summary>
/// Property-based tests for admin endpoint authorization, role enforcement, and
/// MFA enforcement as defined by Properties 1–3 of the admin-store-management spec.
///
/// All three properties are verified across a representative set of admin endpoints:
///   GET /api/v1/admin/orders
///   GET /api/v1/admin/products
///   GET /api/v1/admin/categories
///
/// Validates: Requirements 1.4, 1.5, 1.8, 1.10, 1.11
/// </summary>
public class AdminAuthorizationPropertyTests
{
    // Representative admin endpoints to probe for each property.
    private static readonly string[] AdminEndpoints =
    [
        "/api/v1/admin/orders",
        "/api/v1/admin/products",
        "/api/v1/admin/categories",
    ];

    // ── Helpers ───────────────────────────────────────────────────────────────

    /// <summary>Creates an unauthenticated client (no cookies, no Authorization header).</summary>
    private static HttpClient CreateAnonymousClient(FilamorfosisWebFactory factory)
    {
        var client = factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            HandleCookies = false,
            AllowAutoRedirect = false,
        });
        client.DefaultRequestHeaders.Add("X-Requested-With", "XMLHttpRequest");
        return client;
    }

    /// <summary>Creates a client that carries cookies (used for the regular customer login flow).</summary>
    private static HttpClient CreateCookieClient(FilamorfosisWebFactory factory)
    {
        var client = factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            HandleCookies = true,
            AllowAutoRedirect = false,
        });
        client.DefaultRequestHeaders.Add("X-Requested-With", "XMLHttpRequest");
        return client;
    }

    /// <summary>
    /// Registers a Customer-role user and completes the standard (non-admin) login,
    /// returning a client with the customer's access_token cookie set.
    /// </summary>
    private static async Task<HttpClient> LoginAsCustomerAsync(
        FilamorfosisWebFactory factory, string email)
    {
        var client = CreateCookieClient(factory);

        await client.PostAsJsonAsync("/api/v1/auth/register", new RegisterRequest
        {
            Email = email,
            Password = "Password1",
            FirstName = "Test",
            LastName = "User",
        });

        await client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest
        {
            Email = email,
            Password = "Password1",
        });

        return client;
    }

    /// <summary>
    /// Creates an Admin user and obtains the intermediate mfaToken by completing
    /// only the first step of the admin login flow (password check).
    /// The returned token has mfa_step="pending" — it does NOT carry Admin-role access.
    /// </summary>
    private static async Task<(HttpClient client, string mfaToken)> GetMfaTokenAsync(
        FilamorfosisWebFactory factory)
    {
        var adminEmail = $"authprop-{Guid.NewGuid():N}@test.com";
        const string adminPassword = "AdminPass1";

        using var scope = factory.Services.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();

        if (!await roleManager.RoleExistsAsync("Master"))
            await roleManager.CreateAsync(new IdentityRole<Guid>("Master"));

        var admin = new User
        {
            Id = Guid.NewGuid(),
            UserName = adminEmail,
            Email = adminEmail,
            FirstName = "Admin",
            LastName = "Prop",
            CreatedAt = DateTime.UtcNow,
        };
        await userManager.CreateAsync(admin, adminPassword);
        await userManager.AddToRoleAsync(admin, "Master");

        var client = CreateCookieClient(factory);

        var loginResp = await client.PostAsJsonAsync("/api/v1/auth/admin/login",
            new AdminLoginRequest { Email = adminEmail, Password = adminPassword });

        if (!loginResp.IsSuccessStatusCode)
            throw new InvalidOperationException($"Admin login step-1 failed: {loginResp.StatusCode}");

        var loginData = await loginResp.Content.ReadFromJsonAsync<AdminLoginResponse>();
        if (loginData is null || string.IsNullOrEmpty(loginData.MfaToken))
            throw new InvalidOperationException("mfaToken missing from login response.");

        return (client, loginData.MfaToken);
    }

    // ── Property 1: Admin endpoint authorization ──────────────────────────────
    //
    // For any request to /api/v1/admin/* without a valid JWT cookie, the API SHALL
    // return 401 Unauthorized.
    //
    // Validates: Requirements 1.4

    [Property(MaxTest = 100)]
    public Property Property1_AdminEndpoints_WithoutJwt_Return401()
    {
        var endpointGen = Gen.Elements(AdminEndpoints);

        return Prop.ForAll(
            Arb.From(endpointGen),
            endpoint => RunProperty1Async(endpoint).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunProperty1Async(string endpoint)
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = CreateAnonymousClient(factory);

        var resp = await client.GetAsync(endpoint);
        return resp.StatusCode == HttpStatusCode.Unauthorized;
    }

    // ── Property 2: Admin endpoint role enforcement ───────────────────────────
    //
    // For any request to /api/v1/admin/* with a valid JWT belonging to a Customer-role
    // user, the API SHALL return 403 Forbidden.
    //
    // Validates: Requirements 1.5

    [Property(MaxTest = 100)]
    public Property Property2_AdminEndpoints_WithCustomerJwt_Return403()
    {
        // Generate a unique customer email and an endpoint to probe.
        var gen =
            from n in Gen.Choose(1, 999_999)
            from endpoint in Gen.Elements(AdminEndpoints)
            select (email: $"cust{n}@authprop.test", endpoint);

        return Prop.ForAll(
            Arb.From(gen),
            pair => RunProperty2Async(pair.email, pair.endpoint).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunProperty2Async(string email, string endpoint)
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await LoginAsCustomerAsync(factory, email);

        var resp = await client.GetAsync(endpoint);
        return resp.StatusCode == HttpStatusCode.Forbidden;
    }

    // ── Property 3: MFA enforcement on admin login ────────────────────────────
    //
    // For valid Admin credentials, using only the intermediate mfaToken
    // (mfa_step="pending", no mfa_verified claim) as a Bearer token on any
    // /api/v1/admin/* endpoint SHALL return 403 Forbidden.
    //
    // The mfaToken is a short-lived JWT that grants access only to the MFA
    // verification step — it does not carry the Admin role or the mfa_verified claim
    // needed to reach any /api/v1/admin/* resource.
    //
    // Validates: Requirements 1.8, 1.10, 1.11

    [Property(MaxTest = 100)]
    public Property Property3_AdminEndpoints_WithOnlyMfaToken_Return403()
    {
        var endpointGen = Gen.Elements(AdminEndpoints);

        return Prop.ForAll(
            Arb.From(endpointGen),
            endpoint => RunProperty3Async(endpoint).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunProperty3Async(string endpoint)
    {
        await using var factory = new FilamorfosisWebFactory();
        var (_, mfaToken) = await GetMfaTokenAsync(factory);

        // Build a fresh client with no cookie jar — attach mfaToken as Bearer only.
        var mfaClient = factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            HandleCookies = false,
            AllowAutoRedirect = false,
        });
        mfaClient.DefaultRequestHeaders.Add("X-Requested-With", "XMLHttpRequest");
        mfaClient.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", mfaToken);

        var resp = await mfaClient.GetAsync(endpoint);

        // The mfaToken carries no Admin role and no mfa_verified claim.
        // Admin endpoints protected by [RequireMfa] must reject it with 403.
        return resp.StatusCode == HttpStatusCode.Forbidden;
    }
}
