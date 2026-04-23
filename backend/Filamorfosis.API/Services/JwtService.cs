using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Filamorfosis.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Filamorfosis.API.Services;

public class JwtService(IConfiguration config)
{
    public string GenerateAccessToken(User user, IList<string> roles, bool mfaVerified = false)
    {
        var key = config["Jwt:Key"] ?? "PLACEHOLDER_CHANGE_ME_32_CHARS_MIN";
        var issuer = config["Jwt:Issuer"] ?? "filamorfosis.com";
        var audience = config["Jwt:Audience"] ?? "filamorfosis.com";
        var expiryHours = int.TryParse(config["Jwt:AccessTokenExpiryHours"], out var h) ? h : 24;

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new("firstName", user.FirstName),
            new("lastName", user.LastName)
        };
        claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));

        if (mfaVerified)
            claims.Add(new Claim("mfa_verified", "true"));

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var creds = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(expiryHours),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    /// <summary>
    /// Issues a short-lived (5-minute) intermediate token used only during the MFA verification step.
    /// Contains <c>mfa_step: "pending"</c> claim — grants NO access to admin endpoints.
    /// </summary>
    public string GenerateMfaToken(Guid userId, string email)
    {
        var key = config["Jwt:Key"] ?? "PLACEHOLDER_CHANGE_ME_32_CHARS_MIN";
        var issuer = config["Jwt:Issuer"] ?? "filamorfosis.com";
        var audience = config["Jwt:Audience"] ?? "filamorfosis.com";

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new(JwtRegisteredClaimNames.Email, email),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new("mfa_step", "pending")
        };

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var creds = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(5),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public (string token, string hash) GenerateRefreshToken()
    {
        var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        var hash = HashToken(token);
        return (token, hash);
    }

    public static string HashToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    public int RefreshTokenExpiryDays =>
        int.TryParse(config["Jwt:RefreshTokenExpiryDays"], out var d) ? d : 30;
}
