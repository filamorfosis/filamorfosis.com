// Feature: online-store, Property 14: Profile data round-trip
// Feature: online-store, Property 15: Unauthenticated access returns 401

using System.Net;
using System.Net.Http.Json;
using Filamorfosis.Application.DTOs;
using Filamorfosis.Tests.Infrastructure;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;

namespace Filamorfosis.Tests;

public class UserProfilePropertyTests
{
    private static Gen<string> EmailGen() =>
        Gen.Choose(1, 9999).Select(n => $"profile{n}@test.com");

    private static Gen<string> NameGen() =>
        Gen.Elements(new[] { "Alice", "Bob", "Carlos", "Diana", "Eve" });

    private static async Task<HttpClient> RegisterAndLoginAsync(FilamorfosisWebFactory factory, string email)
    {
        var client = factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            HandleCookies = true,
            AllowAutoRedirect = false
        });
        client.DefaultRequestHeaders.Add("X-Requested-With", "XMLHttpRequest");

        await client.PostAsJsonAsync("/api/v1/auth/register", new RegisterRequest
        {
            Email = email,
            Password = "Password1",
            FirstName = "Test",
            LastName = "User"
        });
        return client;
    }

    // Property 14: Profile data round-trip
    [Property(MaxTest = 15)]
    public Property ProfileUpdate_RoundTrip_PreservesValues()
    {
        return Prop.ForAll(
            Arb.From(EmailGen()),
            Arb.From(NameGen()),
            Arb.From(NameGen()),
            (email, firstName, lastName) =>
                RunProfileRoundTripAsync(email, firstName, lastName).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunProfileRoundTripAsync(string email, string firstName, string lastName)
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await RegisterAndLoginAsync(factory, email);

        // Update profile
        var updateResp = await client.PutAsJsonAsync("/api/v1/users/me", new UpdateProfileRequest
        {
            FirstName = firstName,
            LastName = lastName,
            PhoneNumber = "5551234567"
        });
        if (!updateResp.IsSuccessStatusCode) return false;

        // Fetch and verify
        var getResp = await client.GetAsync("/api/v1/users/me");
        if (!getResp.IsSuccessStatusCode) return false;

        var profile = await getResp.Content.ReadFromJsonAsync<UserProfileDto>();
        if (profile is null) return false;

        if (profile.FirstName != firstName) return false;
        if (profile.LastName != lastName) return false;
        if (profile.PhoneNumber != "5551234567") return false;

        // Add address
        var addResp = await client.PostAsJsonAsync("/api/v1/users/me/addresses", new CreateAddressRequest
        {
            Street = "Calle 1",
            City = "CDMX",
            State = "CDMX",
            PostalCode = "06600",
            Country = "MX"
        });
        if (addResp.StatusCode != HttpStatusCode.Created) return false;

        var addrDto = await addResp.Content.ReadFromJsonAsync<AddressDto>();
        if (addrDto is null) return false;

        // Verify address appears in profile
        var profileWithAddr = await (await client.GetAsync("/api/v1/users/me"))
            .Content.ReadFromJsonAsync<UserProfileDto>();
        if (profileWithAddr?.Addresses.All(a => a.Id != addrDto.Id) ?? true) return false;

        // Delete address
        var deleteResp = await client.DeleteAsync($"/api/v1/users/me/addresses/{addrDto.Id}");
        if (deleteResp.StatusCode != HttpStatusCode.NoContent) return false;

        // Verify address gone
        var profileAfterDelete = await (await client.GetAsync("/api/v1/users/me"))
            .Content.ReadFromJsonAsync<UserProfileDto>();
        return profileAfterDelete?.Addresses.All(a => a.Id != addrDto.Id) ?? true;
    }

    // Property 15: Unauthenticated access returns 401
    [Property(MaxTest = 10)]
    public Property ProtectedEndpoints_WithoutAuth_Return401()
    {
        return Prop.ForAll(
            Arb.From(Gen.Elements(new[]
            {
                ("GET", "/api/v1/users/me"),
                ("PUT", "/api/v1/users/me"),
                ("POST", "/api/v1/users/me/addresses"),
                ("POST", "/api/v1/orders")
            })),
            endpoint => RunUnauthAsync(endpoint.Item1, endpoint.Item2).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunUnauthAsync(string method, string path)
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Requested-With", "XMLHttpRequest");

        var resp = method switch
        {
            "GET" => await client.GetAsync(path),
            "PUT" => await client.PutAsJsonAsync(path, new { }),
            "POST" => await client.PostAsJsonAsync(path, new { }),
            _ => await client.GetAsync(path)
        };

        return resp.StatusCode == HttpStatusCode.Unauthorized;
    }
}
