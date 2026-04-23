using Microsoft.Extensions.Configuration;
using OtpNet;

namespace Filamorfosis.Infrastructure.Services;

/// <summary>
/// RFC 6238 TOTP implementation backed by the Otp.NET library.
/// Accepts codes within a ±1 step (30-second) window to tolerate minor clock skew.
/// </summary>
public class OtpNetTotpService(IConfiguration configuration) : ITotpService
{
    private readonly string _issuer =
        configuration["Totp:Issuer"] ?? "Filamorfosis";

    public string GenerateSecret()
    {
        var key = KeyGeneration.GenerateRandomKey(20); // 160-bit secret
        return Base32Encoding.ToString(key);
    }

    public string GetQrCodeUri(string email, string secret)
    {
        var encodedIssuer = Uri.EscapeDataString(_issuer);
        var encodedEmail  = Uri.EscapeDataString(email);
        return $"otpauth://totp/{encodedIssuer}:{encodedEmail}" +
               $"?secret={secret}&issuer={encodedIssuer}&algorithm=SHA1&digits=6&period=30";
    }

    public bool ValidateCode(string secret, string code)
    {
        if (string.IsNullOrWhiteSpace(code) || code.Length != 6)
            return false;

        var keyBytes = Base32Encoding.ToBytes(secret);
        var totp = new Totp(keyBytes);

        return totp.VerifyTotp(
            code,
            out _,
            new VerificationWindow(previous: 1, future: 1));
    }
}
