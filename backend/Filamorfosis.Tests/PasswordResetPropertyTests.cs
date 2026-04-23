// Feature: online-store, Property 12: Password reset email behavior
// Feature: online-store, Property 13: Password reset round-trip

using System.Net;
using System.Net.Http.Json;
using Filamorfosis.Application.DTOs;
using Filamorfosis.Infrastructure.Data;
using Filamorfosis.Infrastructure.Services;
using Filamorfosis.Tests.Infrastructure;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;
using Microsoft.Extensions.DependencyInjection;

namespace Filamorfosis.Tests;

public class PasswordResetPropertyTests
{
    private static Gen<string> ValidEmailGen() =>
        Gen.Choose(1, 9999).Select(n => $"reset{n}@test{n}.com");

    private static HttpClient CreateClient(FilamorfosisWebFactory factory)
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Requested-With", "XMLHttpRequest");
        return client;
    }

    // Property 12: Forgot-password always returns 200; token created only for registered emails
    [Property(MaxTest = 15)]
    public Property ForgotPassword_AlwaysReturns200()
    {
        return Prop.ForAll(
            Arb.From(ValidEmailGen()),
            email => RunForgotPasswordAsync(email).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunForgotPasswordAsync(string email)
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = CreateClient(factory);

        // Unregistered email — must still return 200
        var resp = await client.PostAsJsonAsync("/api/v1/auth/forgot-password",
            new ForgotPasswordRequest { Email = email });

        if (resp.StatusCode != HttpStatusCode.OK) return false;

        // Verify no reset token was created for unregistered email
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<FilamorfosisDbContext>();
        var tokenCount = db.PasswordResetTokens.Count();
        return tokenCount == 0;
    }

    // Property 13: Password reset round-trip
    [Property(MaxTest = 10)]
    public Property ResetPassword_ValidToken_AllowsLoginWithNewPassword()
    {
        return Prop.ForAll(
            Arb.From(ValidEmailGen()),
            email => RunResetRoundTripAsync(email).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunResetRoundTripAsync(string email)
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = CreateClient(factory);

        const string oldPassword = "OldPass1";
        const string newPassword = "NewPass2";

        // Register
        var regResp = await client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest { Email = email, Password = oldPassword, FirstName = "A", LastName = "B" });
        if (!regResp.IsSuccessStatusCode) return false;

        // Request reset
        await client.PostAsJsonAsync("/api/v1/auth/forgot-password",
            new ForgotPasswordRequest { Email = email });

        // Retrieve the raw token from DB (in tests we read it directly)
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<FilamorfosisDbContext>();
        var tokenRecord = db.PasswordResetTokens.FirstOrDefault();
        if (tokenRecord is null) return false;

        // The token stored is a hash — we need the raw token from the email service.
        // In tests, we use a captured approach: re-derive by checking the hash matches.
        // Since NoOpEmailService doesn't capture, we test the endpoint with a known token
        // by directly inserting a known hash.
        var rawToken = "TestToken123";
        var hash = System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(rawToken));
        var hexHash = Convert.ToHexString(hash).ToLowerInvariant();

        tokenRecord.TokenHash = hexHash;
        tokenRecord.IsUsed = false;
        tokenRecord.ExpiresAt = DateTime.UtcNow.AddMinutes(60);
        await db.SaveChangesAsync();

        // Reset password
        var resetResp = await client.PostAsJsonAsync("/api/v1/auth/reset-password",
            new ResetPasswordRequest { Token = rawToken, NewPassword = newPassword });
        if (!resetResp.IsSuccessStatusCode) return false;

        // Login with new password must succeed
        var loginNew = await client.PostAsJsonAsync("/api/v1/auth/login",
            new LoginRequest { Email = email, Password = newPassword });
        if (!loginNew.IsSuccessStatusCode) return false;

        // Login with old password must fail
        var loginOld = await client.PostAsJsonAsync("/api/v1/auth/login",
            new LoginRequest { Email = email, Password = oldPassword });
        return loginOld.StatusCode == HttpStatusCode.Unauthorized;
    }
}
