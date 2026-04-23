namespace Filamorfosis.Application.DTOs;

public class AdminLoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class AdminLoginResponse
{
    public bool MfaRequired { get; set; } = true;
    public string MfaToken { get; set; } = string.Empty;
    public bool MfaEnabled { get; set; }
}

public class MfaSetupResponse
{
    public string QrCodeUri { get; set; } = string.Empty;
    public string Secret { get; set; } = string.Empty;
}

public class MfaVerifyRequest
{
    public string MfaToken { get; set; } = string.Empty;
    public string TotpCode { get; set; } = string.Empty;
}

public class MfaConfirmRequest
{
    public string MfaToken { get; set; } = string.Empty;
    public string TotpCode { get; set; } = string.Empty;
}
