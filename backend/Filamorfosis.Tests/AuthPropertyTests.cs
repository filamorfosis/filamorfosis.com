// Feature: online-store, Property 5: Registration accepts valid credentials
// Feature: online-store, Property 6: Registration rejects duplicate email
// Feature: online-store, Property 7: Registration rejects invalid passwords
// Feature: online-store, Property 9: Login round-trip
// Feature: online-store, Property 10: Login rejects invalid credentials
// Feature: online-store, Property 11: Refresh token invalidation after logout

using System.Net;
using System.Net.Http.Json;
using Filamorfosis.Application.DTOs;
using Filamorfosis.Tests.Infrastructure;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;

namespace Filamorfosis.Tests;

public class AuthPropertyTests
{
    private static readonly string[] ValidPasswords = ["Password1", "Secure2Pass", "Hello3World", "Test4Valid"];
    private static readonly string[] InvalidPasswords = ["short1A", "nouppercase1", "NODIGIT", "ab"];

    private static Gen<string> ValidEmailGen() =>
        Gen.Choose(1, 9999).Select(n => $"user{n}@test{n}.com");

    private static Gen<string> ValidPasswordGen() =>
        Gen.Elements(ValidPasswords);

    private static Gen<string> InvalidPasswordGen() =>
        Gen.Elements(InvalidPasswords);

    private static HttpClient CreateClient(FilamorfosisWebFactory factory)
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Requested-With", "XMLHttpRequest");
        return client;
    }

    // Property 5: Registration accepts valid credentials
    [Property(MaxTest = 20)]
    public Property Register_ValidCredentials_Succeeds()
    {
        return Prop.ForAll(
            Arb.From(ValidEmailGen()),
            Arb.From(ValidPasswordGen()),
            (email, password) => RunRegisterValidAsync(email, password).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunRegisterValidAsync(string email, string password)
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = CreateClient(factory);

        var resp = await client.PostAsJsonAsync("/api/v1/auth/register", new RegisterRequest
        {
            Email = email,
            Password = password,
            FirstName = "Test",
            LastName = "User"
        });

        return resp.StatusCode == HttpStatusCode.Created;
    }

    // Property 6: Registration rejects duplicate email
    [Property(MaxTest = 20)]
    public Property Register_DuplicateEmail_Returns409()
    {
        return Prop.ForAll(
            Arb.From(ValidEmailGen()),
            email => RunDuplicateEmailAsync(email).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunDuplicateEmailAsync(string email)
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = CreateClient(factory);

        var req = new RegisterRequest { Email = email, Password = "Password1", FirstName = "A", LastName = "B" };
        await client.PostAsJsonAsync("/api/v1/auth/register", req);
        var second = await client.PostAsJsonAsync("/api/v1/auth/register", req);

        return second.StatusCode == HttpStatusCode.Conflict;
    }

    // Property 7: Registration rejects invalid passwords
    [Property(MaxTest = 20)]
    public Property Register_InvalidPassword_Returns422()
    {
        return Prop.ForAll(
            Arb.From(ValidEmailGen()),
            Arb.From(InvalidPasswordGen()),
            (email, password) => RunInvalidPasswordAsync(email, password).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunInvalidPasswordAsync(string email, string password)
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = CreateClient(factory);

        var resp = await client.PostAsJsonAsync("/api/v1/auth/register", new RegisterRequest
        {
            Email = email,
            Password = password,
            FirstName = "A",
            LastName = "B"
        });

        return resp.StatusCode == HttpStatusCode.UnprocessableEntity;
    }

    // Property 9: Login round-trip — valid credentials return 200
    [Property(MaxTest = 20)]
    public Property Login_ValidCredentials_ReturnsOk()
    {
        return Prop.ForAll(
            Arb.From(ValidEmailGen()),
            email => RunLoginRoundTripAsync(email).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunLoginRoundTripAsync(string email)
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = CreateClient(factory);

        const string password = "Password1";
        await client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest { Email = email, Password = password, FirstName = "A", LastName = "B" });

        var loginResp = await client.PostAsJsonAsync("/api/v1/auth/login",
            new LoginRequest { Email = email, Password = password });

        if (!loginResp.IsSuccessStatusCode) return false;

        // Verify access_token cookie is set
        return loginResp.Headers.TryGetValues("Set-Cookie", out var cookies)
               && cookies.Any(c => c.StartsWith("access_token"));
    }

    // Property 10: Login rejects invalid credentials
    [Property(MaxTest = 20)]
    public Property Login_InvalidCredentials_Returns401()
    {
        return Prop.ForAll(
            Arb.From(ValidEmailGen()),
            email => RunLoginInvalidAsync(email).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunLoginInvalidAsync(string email)
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = CreateClient(factory);

        var resp = await client.PostAsJsonAsync("/api/v1/auth/login",
            new LoginRequest { Email = email, Password = "WrongPass1" });

        return resp.StatusCode == HttpStatusCode.Unauthorized;
    }

    // Property 11: Refresh token invalidation after logout
    [Property(MaxTest = 10)]
    public Property Logout_InvalidatesRefreshToken()
    {
        return Prop.ForAll(
            Arb.From(ValidEmailGen()),
            email => RunLogoutInvalidatesRefreshAsync(email).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunLogoutInvalidatesRefreshAsync(string email)
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            HandleCookies = true,
            AllowAutoRedirect = false
        });
        client.DefaultRequestHeaders.Add("X-Requested-With", "XMLHttpRequest");

        const string password = "Password1";
        await client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest { Email = email, Password = password, FirstName = "A", LastName = "B" });

        await client.PostAsJsonAsync("/api/v1/auth/login",
            new LoginRequest { Email = email, Password = password });

        // Logout
        await client.PostAsJsonAsync("/api/v1/auth/logout", new { });

        // Try to refresh — should fail with 401
        var refreshResp = await client.PostAsJsonAsync("/api/v1/auth/refresh", new { });
        return refreshResp.StatusCode == HttpStatusCode.Unauthorized;
    }
}
