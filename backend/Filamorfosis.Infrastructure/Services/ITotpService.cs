namespace Filamorfosis.Infrastructure.Services;

public interface ITotpService
{
    /// <summary>Generates a new random Base32-encoded TOTP secret.</summary>
    string GenerateSecret();

    /// <summary>Returns an otpauth://totp/ URI for QR code display in authenticator apps.</summary>
    string GetQrCodeUri(string email, string secret);

    /// <summary>Validates a 6-digit TOTP code against the given Base32 secret (±1 step window).</summary>
    bool ValidateCode(string secret, string code);
}
