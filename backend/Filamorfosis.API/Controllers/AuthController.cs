using System.Security.Cryptography;
using System.Text;
using Filamorfosis.Application.DTOs;
using Filamorfosis.Domain.Entities;
using Filamorfosis.Infrastructure.Data;
using Filamorfosis.API.Services;
using Filamorfosis.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace Filamorfosis.API.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController(
    UserManager<User> userManager,
    FilamorfosisDbContext db,
    JwtService jwtService,
    IEmailService emailService,
    ILogger<AuthController> logger) : ControllerBase
{
    // ── Register ─────────────────────────────────────────────────────────────

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        // Validate password rules manually (Identity also enforces, but we want 422 with details)
        var passwordErrors = ValidatePassword(req.Password);
        if (passwordErrors.Count > 0)
            return UnprocessableEntity(new
            {
                type = "https://filamorfosis.com/errors/validation-failed",
                title = "Validation Failed",
                status = 422,
                detail = "Password does not meet requirements.",
                errors = new { password = passwordErrors }
            });

        var existing = await userManager.FindByEmailAsync(req.Email);
        if (existing is not null)
            return Conflict(new
            {
                type = "https://filamorfosis.com/errors/duplicate-email",
                title = "Conflict",
                status = 409,
                detail = "An account with this email address already exists."
            });

        var user = new User
        {
            Id = Guid.NewGuid(),
            UserName = req.Email,
            Email = req.Email,
            FirstName = req.FirstName,
            LastName = req.LastName,
            CreatedAt = DateTime.UtcNow
        };

        var result = await userManager.CreateAsync(user, req.Password);
        if (!result.Succeeded)
            return UnprocessableEntity(new
            {
                type = "https://filamorfosis.com/errors/validation-failed",
                title = "Validation Failed",
                status = 422,
                detail = "Registration failed.",
                errors = result.Errors.Select(e => e.Description)
            });

        await userManager.AddToRoleAsync(user, "Customer");

        var roles = await userManager.GetRolesAsync(user);
        var (accessToken, refreshToken) = await IssueTokensAsync(user);

        SetAuthCookies(accessToken, refreshToken);

        // Merge guest cart into new user cart
        if (Request.Cookies.TryGetValue("guest_cart_token", out var guestToken))
        {
            await CartController.MergeGuestCartAsync(db, user.Id, guestToken);
            Response.Cookies.Delete("guest_cart_token");
        }

        // Fire-and-forget welcome email
        _ = Task.Run(async () =>
        {
            try { await emailService.SendWelcomeAsync(user.Email!, user.FirstName); }
            catch (Exception ex) { logger.LogError(ex, "Failed to send welcome email to {Email}", user.Email); }
        });

        return StatusCode(201, new AuthResponse
        {
            UserId = user.Id,
            Email = user.Email!,
            FirstName = user.FirstName,
            LastName = user.LastName
        });
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    [HttpPost("login")]
    [EnableRateLimiting("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
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

        var (accessToken, refreshToken) = await IssueTokensAsync(user);
        SetAuthCookies(accessToken, refreshToken);

        // Merge guest cart into user cart on login
        if (Request.Cookies.TryGetValue("guest_cart_token", out var guestToken))
        {
            await CartController.MergeGuestCartAsync(db, user.Id, guestToken);
            Response.Cookies.Delete("guest_cart_token");
        }

        return Ok(new AuthResponse
        {
            UserId = user.Id,
            Email = user.Email!,
            FirstName = user.FirstName,
            LastName = user.LastName
        });
    }

    // ── Refresh ───────────────────────────────────────────────────────────────

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh()
    {
        if (!Request.Cookies.TryGetValue("refresh_token", out var rawToken) || string.IsNullOrEmpty(rawToken))
            return Unauthorized(new { type = "https://filamorfosis.com/errors/invalid-token", title = "Unauthorized", status = 401, detail = "Refresh token missing." });

        var hash = JwtService.HashToken(rawToken);
        var stored = await db.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Token == hash && !rt.IsRevoked && rt.ExpiresAt > DateTime.UtcNow);

        if (stored is null)
            return Unauthorized(new { type = "https://filamorfosis.com/errors/invalid-token", title = "Unauthorized", status = 401, detail = "Refresh token is invalid or expired." });

        // Rotate: revoke old, issue new
        stored.IsRevoked = true;
        var (newAccess, newRefresh) = await IssueTokensAsync(stored.User);
        await db.SaveChangesAsync();

        SetAuthCookies(newAccess, newRefresh);
        return Ok(new { message = "Token refreshed." });
    }

    // ── Logout ────────────────────────────────────────────────────────────────

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        if (Request.Cookies.TryGetValue("refresh_token", out var rawToken) && !string.IsNullOrEmpty(rawToken))
        {
            var hash = JwtService.HashToken(rawToken);
            var stored = await db.RefreshTokens.FirstOrDefaultAsync(rt => rt.Token == hash);
            if (stored is not null)
            {
                stored.IsRevoked = true;
                await db.SaveChangesAsync();
            }
        }

        Response.Cookies.Delete("access_token");
        Response.Cookies.Delete("refresh_token");
        return Ok(new { message = "Logged out." });
    }

    // ── Forgot Password ───────────────────────────────────────────────────────

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest req)
    {
        // Always return 200 — never reveal whether email exists
        var user = await userManager.FindByEmailAsync(req.Email);
        if (user is not null)
        {
            var rawToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
            var tokenHash = SHA256Hash(rawToken);

            db.PasswordResetTokens.Add(new PasswordResetToken
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                TokenHash = tokenHash,
                ExpiresAt = DateTime.UtcNow.AddMinutes(60),
                IsUsed = false
            });
            await db.SaveChangesAsync();

            _ = Task.Run(async () =>
            {
                try { await emailService.SendPasswordResetAsync(user.Email!, rawToken); }
                catch (Exception ex) { logger.LogError(ex, "Failed to send password reset email to {Email}", user.Email); }
            });
        }

        return Ok(new { message = "If that email is registered, a reset link has been sent." });
    }

    // ── Reset Password ────────────────────────────────────────────────────────

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest req)
    {
        var tokenHash = SHA256Hash(req.Token);
        var stored = await db.PasswordResetTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.TokenHash == tokenHash && !t.IsUsed && t.ExpiresAt > DateTime.UtcNow);

        if (stored is null)
            return BadRequest(new
            {
                type = "https://filamorfosis.com/errors/invalid-token",
                title = "Bad Request",
                status = 400,
                detail = "Reset token is invalid, expired, or already used."
            });

        var passwordErrors = ValidatePassword(req.NewPassword);
        if (passwordErrors.Count > 0)
            return UnprocessableEntity(new
            {
                type = "https://filamorfosis.com/errors/validation-failed",
                title = "Validation Failed",
                status = 422,
                errors = new { password = passwordErrors }
            });

        var resetToken = await userManager.GeneratePasswordResetTokenAsync(stored.User);
        var result = await userManager.ResetPasswordAsync(stored.User, resetToken, req.NewPassword);
        if (!result.Succeeded)
            return UnprocessableEntity(new
            {
                type = "https://filamorfosis.com/errors/validation-failed",
                title = "Validation Failed",
                status = 422,
                errors = result.Errors.Select(e => e.Description)
            });

        stored.IsUsed = true;
        await db.SaveChangesAsync();

        return Ok(new { message = "Password reset successfully." });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private async Task<(string accessToken, string refreshToken)> IssueTokensAsync(User user)
    {
        var roles = await userManager.GetRolesAsync(user);
        var accessToken = jwtService.GenerateAccessToken(user, roles);

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

        Response.Cookies.Append("access_token", accessToken, new CookieOptions
        {
            HttpOnly = true,
            SameSite = sameSite,
            Secure = secure,
            Expires = DateTimeOffset.UtcNow.AddHours(24)
        });
        Response.Cookies.Append("refresh_token", refreshToken, new CookieOptions
        {
            HttpOnly = true,
            SameSite = sameSite,
            Secure = secure,
            Expires = DateTimeOffset.UtcNow.AddDays(jwtService.RefreshTokenExpiryDays)
        });
    }

    private static List<string> ValidatePassword(string password)
    {
        var errors = new List<string>();
        if (password.Length < 8) errors.Add("Must be at least 8 characters.");
        if (!password.Any(char.IsUpper)) errors.Add("Must contain at least one uppercase letter.");
        if (!password.Any(char.IsDigit)) errors.Add("Must contain at least one digit.");
        return errors;
    }

    private static string SHA256Hash(string input)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}
