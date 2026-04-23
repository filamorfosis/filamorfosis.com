using Filamorfosis.Domain.Entities;
using Filamorfosis.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Filamorfosis.API.Middleware;

/// <summary>
/// Ensures every request has a guest cart token cookie when the user is unauthenticated.
/// </summary>
public class GuestCartMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, FilamorfosisDbContext db)
    {
        if (!context.User.Identity?.IsAuthenticated ?? true)
        {
            if (!context.Request.Cookies.TryGetValue("guest_cart_token", out var token)
                || string.IsNullOrEmpty(token))
            {
                token = Guid.NewGuid().ToString();
                context.Response.Cookies.Append("guest_cart_token", token, new CookieOptions
                {
                    HttpOnly = true,
                    SameSite = SameSiteMode.Strict,
                    Expires = DateTimeOffset.UtcNow.AddDays(30)
                });
                // Also store in Items so the controller can read it within this same request
                context.Items["guest_cart_token"] = token;
            }

            // Ensure a Cart record exists for this guest token (AsNoTracking to avoid polluting
            // the request-scoped DbContext with a tracked entity that the controller won't expect)
            var exists = await db.Carts.AsNoTracking().AnyAsync(c => c.GuestToken == token);
            if (!exists)
            {
                db.Carts.Add(new Cart
                {
                    Id = Guid.NewGuid(),
                    GuestToken = token,
                    UpdatedAt = DateTime.UtcNow,
                    ExpiresAt = DateTime.UtcNow.AddDays(30)
                });
                await db.SaveChangesAsync();
            }
        }

        await next(context);
    }
}
