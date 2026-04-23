namespace Filamorfosis.Domain.Entities;

public class AdminMfaSecret
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    /// <summary>TOTP secret encoded as Base32. Encrypted at rest by the infrastructure layer.</summary>
    public string SecretBase32 { get; set; } = string.Empty;
    public bool IsConfirmed { get; set; }
    public DateTime CreatedAt { get; set; }
    /// <summary>
    /// The last TOTP code successfully used for this user. Used for replay protection:
    /// a code that matches this value within the same 30-second window is rejected.
    /// </summary>
    public string? LastUsedTotpCode { get; set; }
    public User User { get; set; } = null!;
}
