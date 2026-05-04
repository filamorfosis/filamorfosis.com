using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Filamorfosis.Application.DTOs;
using Filamorfosis.Domain.Entities;
using Filamorfosis.Infrastructure.Data;
using Filamorfosis.Infrastructure.Services;
using Filamorfosis.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace Filamorfosis.API.Controllers;

[ApiController]
[Route("api/v1/auth/admin")]
public class AdminAuthController(
    UserManager<User> userManager,
    FilamorfosisDbContext db,
    JwtService jwtService,
    ITotpService totpService,
    IConfiguration configuration,
    ILogger<AdminAuthController> logger) : ControllerBase
{
    // ── POST /api/v1/auth/admin/login ─────────────────────────────────────────
    // Step 1 of the MFA flow: validate credentials, return a short-lived mfaToken.
    // The mfaToken grants NO access to admin endpoints — it only authorises the
    // subsequent /mfa/setup, /mfa/confirm, or /mfa/verify calls.

    [HttpPost("login")]
    [EnableRateLimiting("login")]
    public async Task<IActionResult> Login([FromBody] AdminLoginRequest req)
    {
        var user = await userManager.FindByEmailAsync(req.Email);
        if (user is null || !await userManager.CheckPasswordAsync(user, req.Password))
            return Unauthorized(new
            {
                type = "https://filamorfosis.com/errors/invalid-credentials",
                title = "Unauthorized",
                status = 401,
                detail = "Invalid email or password."
            });

        if (!await userManager.IsInRoleAsync(user, "Admin") &&
            !await userManager.IsInRoleAsync(user, "Master") &&
            !await userManager.IsInRoleAsync(user, "UserManagement") &&
            !await userManager.IsInRoleAsync(user, "ProductManagement") &&
            !await userManager.IsInRoleAsync(user, "OrderManagement"))
            return Unauthorized(new
            {
                type = "https://filamorfosis.com/errors/invalid-credentials",
                title = "Unauthorized",
                status = 401,
                detail = "Invalid email or password."
            });

        var mfaToken = jwtService.GenerateMfaToken(user.Id, user.Email!);
        var mfaEnabled = await db.AdminMfaSecrets.AnyAsync(m => m.UserId == user.Id && m.IsConfirmed);

        return Ok(new AdminLoginResponse
        {
            MfaRequired = true,
            MfaToken = mfaToken,
            MfaEnabled = mfaEnabled
        });
    }

    // ── POST /api/v1/auth/admin/mfa/setup ─────────────────────────────────────
    // First-time enrollment: generate a TOTP secret and return the QR code URI.
    // Requires a valid mfaToken in the Authorization Bearer header.

    [HttpPost("mfa/setup")]
    public async Task<IActionResult> MfaSetup()
    {
        var (user, error) = await ValidateMfaTokenAsync();
        if (user is null) return error!;

        // If a confirmed secret already exists, reject setup to prevent re-enrollment
        var existing = await db.AdminMfaSecrets
            .FirstOrDefaultAsync(m => m.UserId == user.Id && m.IsConfirmed);
        if (existing is not null)
            return Conflict(new
            {
                type = "https://filamorfosis.com/errors/mfa-already-configured",
                title = "Conflict",
                status = 409,
                detail = "MFA is already configured for this account. Use /mfa/verify to authenticate."
            });

        // Remove any unconfirmed secret before creating a new one
        var unconfirmed = await db.AdminMfaSecrets
            .FirstOrDefaultAsync(m => m.UserId == user.Id && !m.IsConfirmed);
        if (unconfirmed is not null)
            db.AdminMfaSecrets.Remove(unconfirmed);

        var secret = totpService.GenerateSecret();
        var qrCodeUri = totpService.GetQrCodeUri(user.Email!, secret);

        db.AdminMfaSecrets.Add(new AdminMfaSecret
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            SecretBase32 = secret,
            IsConfirmed = false,
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        return Ok(new MfaSetupResponse
        {
            QrCodeUri = qrCodeUri,
            Secret = secret
        });
    }

    // ── POST /api/v1/auth/admin/mfa/confirm ───────────────────────────────────
    // Completes first-time enrollment: validates the TOTP code, marks the secret
    // as confirmed, and issues the full access_token + refresh_token.

    [HttpPost("mfa/confirm")]
    public async Task<IActionResult> MfaConfirm([FromBody] MfaConfirmRequest req)
    {
        var (user, error) = await ValidateMfaTokenAsync();
        if (user is null) return error!;

        var mfaSecret = await db.AdminMfaSecrets
            .FirstOrDefaultAsync(m => m.UserId == user.Id && !m.IsConfirmed);

        if (mfaSecret is null)
            return BadRequest(new
            {
                type = "https://filamorfosis.com/errors/mfa-setup-required",
                title = "Bad Request",
                status = 400,
                detail = "No pending MFA setup found. Call /mfa/setup first."
            });

        if (!totpService.ValidateCode(mfaSecret.SecretBase32, req.TotpCode))
            return UnprocessableEntity(new
            {
                type = "https://filamorfosis.com/errors/invalid-totp",
                title = "Unprocessable Entity",
                status = 422,
                detail = "El código de verificación es incorrecto o ha expirado."
            });

        mfaSecret.IsConfirmed = true;
        mfaSecret.LastUsedTotpCode = req.TotpCode;
        await db.SaveChangesAsync();

        var (accessToken, refreshToken) = await IssueTokensAsync(user, mfaVerified: true);
        SetAuthCookies(accessToken, refreshToken);

        return Ok(new { message = "MFA enrollment complete." });
    }

    // ── POST /api/v1/auth/admin/mfa/verify ────────────────────────────────────
    // Subsequent logins: validates the TOTP code with replay protection and
    // issues the full access_token + refresh_token.

    [HttpPost("mfa/verify")]
    [EnableRateLimiting("mfa-verify")]
    public async Task<IActionResult> MfaVerify([FromBody] MfaVerifyRequest req)
    {
        var (user, error) = await ValidateMfaTokenAsync();
        if (user is null) return error!;

        var mfaSecret = await db.AdminMfaSecrets
            .FirstOrDefaultAsync(m => m.UserId == user.Id && m.IsConfirmed);

        if (mfaSecret is null)
            return Forbid();

        if (!totpService.ValidateCode(mfaSecret.SecretBase32, req.TotpCode))
            return UnprocessableEntity(new
            {
                type = "https://filamorfosis.com/errors/invalid-totp",
                title = "Unprocessable Entity",
                status = 422,
                detail = "El código de verificación es incorrecto o ha expirado."
            });

        // Replay protection: reject if this exact code was already used
        var codeKey = $"totp_used:{user.Id}:{req.TotpCode}";
        if (HttpContext.Items.ContainsKey(codeKey) ||
            await db.AdminMfaSecrets.AnyAsync(m => m.UserId == user.Id && m.LastUsedTotpCode == req.TotpCode))
        {
            return UnprocessableEntity(new
            {
                type = "https://filamorfosis.com/errors/totp-replayed",
                title = "Unprocessable Entity",
                status = 422,
                detail = "Este código ya fue utilizado. Espera el siguiente."
            });
        }

        // Store the last-used code for replay protection
        mfaSecret.LastUsedTotpCode = req.TotpCode;
        await db.SaveChangesAsync();

        var (accessToken, refreshToken) = await IssueTokensAsync(user, mfaVerified: true);
        SetAuthCookies(accessToken, refreshToken);

        return Ok(new { message = "MFA verification successful." });
    }

    // ── GET /api/v1/auth/admin/me ─────────────────────────────────────────────
    // Returns the currently authenticated admin user profile.
    // Uses admin_access_token (via the /auth/admin route prefix in Program.cs).
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetMe()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub);

        if (userIdStr is null || !Guid.TryParse(userIdStr, out var userId))
            return Unauthorized();

        var user = await userManager.Users
            .Include(u => u.MfaSecret)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user is null) return NotFound();

        var roles = await userManager.GetRolesAsync(user);
        var mfaVerified = User.FindFirstValue("mfa_verified") == "true";

        return Ok(new
        {
            id = user.Id,
            email = user.Email,
            firstName = user.FirstName,
            lastName = user.LastName,
            roles = roles.ToList(),
            mfaEnabled = user.MfaSecret?.IsConfirmed == true,
            mfaVerified
        });
    }

    // ── POST /api/v1/auth/admin/logout ───────────────────────────────────────
    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        if (Request.Cookies.TryGetValue("admin_refresh_token", out var rawToken) && !string.IsNullOrEmpty(rawToken))
        {
            var hash = JwtService.HashToken(rawToken);
            var stored = await db.RefreshTokens.FirstOrDefaultAsync(rt => rt.Token == hash);
            if (stored is not null)
            {
                stored.IsRevoked = true;
                await db.SaveChangesAsync();
            }
        }

        Response.Cookies.Delete("admin_access_token");
        Response.Cookies.Delete("admin_refresh_token");
        return Ok(new { message = "Admin logged out." });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /// <summary>
    /// Reads and validates the mfaToken from the Authorization Bearer header.
    /// Returns the resolved User, or an IActionResult error if validation fails.
    /// </summary>
    private async Task<(User? user, IActionResult? error)> ValidateMfaTokenAsync()
    {
        var authHeader = Request.Headers.Authorization.FirstOrDefault();
        if (authHeader is null || !authHeader.StartsWith("Bearer "))
            return (null, Unauthorized(new
            {
                type = "https://filamorfosis.com/errors/missing-mfa-token",
                title = "Unauthorized",
                status = 401,
                detail = "A valid mfaToken is required in the Authorization header."
            }));

        var token = authHeader["Bearer ".Length..].Trim();
        var jwtKey = configuration["Jwt:Key"] ?? "PLACEHOLDER_CHANGE_ME_32_CHARS_MIN";

        ClaimsPrincipal principal;
        try
        {
            var handler = new JwtSecurityTokenHandler();
            principal = handler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = configuration["Jwt:Issuer"],
                ValidAudience = configuration["Jwt:Audience"],
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
                ClockSkew = TimeSpan.Zero
            }, out _);
        }
        catch (Exception ex)
        {
            logger.LogDebug(ex, "MFA token validation failed");
            return (null, Unauthorized(new
            {
                type = "https://filamorfosis.com/errors/invalid-mfa-token",
                title = "Unauthorized",
                status = 401,
                detail = "The mfaToken is invalid or has expired."
            }));
        }

        // Ensure this is an mfa_step: pending token (not a full access token)
        var mfaStep = principal.FindFirstValue("mfa_step");
        if (mfaStep != "pending")
            return (null, Forbid());

        var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? principal.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (userId is null || !Guid.TryParse(userId, out var userGuid))
            return (null, Unauthorized(new
            {
                type = "https://filamorfosis.com/errors/invalid-mfa-token",
                title = "Unauthorized",
                status = 401,
                detail = "The mfaToken is invalid or has expired."
            }));

        var user = await userManager.FindByIdAsync(userGuid.ToString());
        if (user is null)
            return (null, Unauthorized(new
            {
                type = "https://filamorfosis.com/errors/invalid-mfa-token",
                title = "Unauthorized",
                status = 401,
                detail = "The mfaToken is invalid or has expired."
            }));

        return (user, null);
    }

    private async Task<(string accessToken, string refreshToken)> IssueTokensAsync(User user, bool mfaVerified)
    {
        var roles = await userManager.GetRolesAsync(user);
        var accessToken = jwtService.GenerateAccessToken(user, roles, mfaVerified);

        var (rawRefresh, refreshHash) = jwtService.GenerateRefreshToken();
        db.RefreshTokens.Add(new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = refreshHash,
            ExpiresAt = DateTime.UtcNow.AddDays(jwtService.RefreshTokenExpiryDays),
            IsRevoked = false,
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        return (accessToken, rawRefresh);
    }

    private void SetAuthCookies(string accessToken, string refreshToken)
    {
        var isLocalhost = HttpContext.Request.Host.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase);
        var secure = !isLocalhost;
        // Use SameSite=None for production to allow cross-origin requests (frontend on filamorfosis.com, API on api.filamorfosis.com)
        // Use SameSite=Lax for localhost to allow development without HTTPS
        var sameSite = isLocalhost ? SameSiteMode.Lax : SameSiteMode.None;

        // Use different cookie names for admin to avoid conflicts with customer auth
        Response.Cookies.Append("admin_access_token", accessToken, new CookieOptions
        {
            HttpOnly = true,
            SameSite = sameSite,
            Secure = secure,
            Path = "/",
            Expires = DateTimeOffset.UtcNow.AddHours(24)
        });
        Response.Cookies.Append("admin_refresh_token", refreshToken, new CookieOptions
        {
            HttpOnly = true,
            SameSite = sameSite,
            Secure = secure,
            Path = "/",
            Expires = DateTimeOffset.UtcNow.AddDays(jwtService.RefreshTokenExpiryDays)
        });
    }
}
