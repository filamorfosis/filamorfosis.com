// Feature: cost-management-and-pricing, Property 10: Role assignment round-trip

using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
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

/// <summary>
/// Property-based tests for multi-role admin user management (cost-management-and-pricing spec).
///
/// Validates: Requirements 1.2, 1.6
/// </summary>
public class UserRolePropertyTests
{
    // Valid roles for the round-trip test (exclude Master and Customer per spec)
    private static readonly string[] AssignableTestRoles =
        ["UserManagement", "ProductManagement", "OrderManagement", "PriceManagement"];

    // All roles that need to exist in the DB for tests to work
    private static readonly string[] AllRoles =
        ["Master", "UserManagement", "ProductManagement", "OrderManagement", "PriceManagement", "Customer"];

    // ── Helpers ───────────────────────────────────────────────────────────────

    /// <summary>
    /// Creates a Master-role user and completes the full MFA login flow,
    /// returning an authenticated HttpClient with the access_token cookie set.
    /// </summary>
    private static async Task<HttpClient> LoginAsMasterAsync(FilamorfosisWebFactory factory)
    {
        var email = $"master-p10-{Guid.NewGuid():N}@test.com";
        const string password = "AdminPass1";

        using var scope = factory.Services.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();

        // Ensure all roles exist
        foreach (var r in AllRoles)
            if (!await roleManager.RoleExistsAsync(r))
                await roleManager.CreateAsync(new IdentityRole<Guid>(r));

        var user = new User
        {
            Id = Guid.NewGuid(),
            UserName = email,
            Email = email,
            FirstName = "Master",
            LastName = "P10",
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

        var keyBytes = OtpNet.Base32Encoding.ToBytes(secret);
        var totp = new OtpNet.Totp(keyBytes);
        var code = totp.ComputeTotp();

        var confirmResp = await client.PostAsJsonAsync("/api/v1/auth/admin/mfa/confirm",
            new { mfaToken, totpCode = code });
        if (!confirmResp.IsSuccessStatusCode)
            throw new InvalidOperationException($"MFA confirm failed: {confirmResp.StatusCode}");

        client.DefaultRequestHeaders.Authorization = null;
        return client;
    }

    /// <summary>
    /// Creates a non-Master admin user (OrderManagement) via the API and returns its ID.
    /// </summary>
    private static async Task<string> CreateTargetUserAsync(HttpClient masterClient)
    {
        var email = $"target-p10-{Guid.NewGuid():N}@test.com";
        var createResp = await masterClient.PostAsJsonAsync("/api/v1/admin/users", new
        {
            email,
            password = "TargetPass1!",
            firstName = "Target",
            lastName = "User",
            role = "OrderManagement"
        });

        if (!createResp.IsSuccessStatusCode)
            throw new InvalidOperationException($"Create target user failed: {createResp.StatusCode}");

        var created = await createResp.Content.ReadFromJsonAsync<JsonElement>();
        return created.GetProperty("id").GetString()!;
    }

    // ── Property 10: Role assignment round-trip ───────────────────────────────
    //
    // For any non-empty subset of valid roles (UserManagement, ProductManagement,
    // OrderManagement, PriceManagement), assigning via PUT /roles then fetching via
    // GET /admin/users returns exactly that subset.
    //
    // Validates: Requirements 1.2, 1.6

    [Property(MaxTest = 30)]
    public Property Property10_RoleAssignmentRoundTrip()
    {
        // Generate non-empty subsets of AssignableTestRoles
        var gen =
            from n in Gen.Choose(1, AssignableTestRoles.Length)
            from roles in Gen.Shuffle(AssignableTestRoles).Select(arr => arr.Take(n).ToArray())
            select roles;

        return Prop.ForAll(
            Arb.From(gen),
            roles => RunProperty10Async(roles).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunProperty10Async(string[] rolesToAssign)
    {
        await using var factory = new FilamorfosisWebFactory();
        var masterClient = await LoginAsMasterAsync(factory);

        // Create a target user to assign roles to
        var targetUserId = await CreateTargetUserAsync(masterClient);

        // PUT /api/v1/admin/users/{userId}/roles with the generated role subset
        var putResp = await masterClient.PutAsJsonAsync(
            $"/api/v1/admin/users/{targetUserId}/roles",
            new { roles = rolesToAssign });

        if (!putResp.IsSuccessStatusCode)
            return false;

        // GET /api/v1/admin/users and find the target user
        var listResp = await masterClient.GetAsync("/api/v1/admin/users");
        if (!listResp.IsSuccessStatusCode)
            return false;

        var users = await listResp.Content.ReadFromJsonAsync<JsonElement>();
        foreach (var user in users.EnumerateArray())
        {
            var userId = user.GetProperty("id").GetString();
            if (!string.Equals(userId, targetUserId, StringComparison.OrdinalIgnoreCase))
                continue;

            var returnedRoles = user.GetProperty("roles").EnumerateArray()
                .Select(r => r.GetString()!)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            var expectedRoles = rolesToAssign.ToHashSet(StringComparer.OrdinalIgnoreCase);

            // Exact match: returned roles must equal assigned roles (no more, no less)
            return expectedRoles.SetEquals(returnedRoles);
        }

        return false; // target user not found in list
    }
}
