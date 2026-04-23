using System.Security.Claims;
using Filamorfosis.Application;
using Filamorfosis.Application.DTOs;
using Filamorfosis.Domain.Entities;
using Filamorfosis.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Filamorfosis.API.Controllers;

[ApiController]
[Route("api/v1/cart")]
public class CartController(FilamorfosisDbContext db) : ControllerBase
{
    // ── Resolve current cart ──────────────────────────────────────────────────

    private async Task<Cart?> ResolveCartAsync()
    {
        if (User.Identity?.IsAuthenticated == true)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue("sub")!);

            var cart = await db.Carts
                .Include(c => c.Items).ThenInclude(i => i.Variant).ThenInclude(v => v.Product)
                .Include(c => c.Items).ThenInclude(i => i.Variant).ThenInclude(v => v.Discounts)
                .Include(c => c.Items).ThenInclude(i => i.DesignFile)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart is null)
            {
                cart = new Cart
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    UpdatedAt = DateTime.UtcNow,
                    ExpiresAt = DateTime.UtcNow.AddYears(1)
                };
                db.Carts.Add(cart);
                await db.SaveChangesAsync();
                // Reload to get a fully tracked entity with navigation properties initialized
                cart = await db.Carts
                    .Include(c => c.Items).ThenInclude(i => i.Variant).ThenInclude(v => v.Product)
                    .Include(c => c.Items).ThenInclude(i => i.Variant).ThenInclude(v => v.Discounts)
                    .Include(c => c.Items).ThenInclude(i => i.DesignFile)
                    .FirstAsync(c => c.Id == cart.Id);
            }
            return cart;
        }
        else
        {
            // Try request cookie first, then fall back to Items set by GuestCartMiddleware
            // (for the first request where the cookie is set in the response but not yet in the request)
            string? token = null;
            if (Request.Cookies.TryGetValue("guest_cart_token", out var cookieToken))
                token = cookieToken;
            else if (HttpContext.Items.TryGetValue("guest_cart_token", out var itemToken))
                token = itemToken as string;

            if (string.IsNullOrEmpty(token))
                return null;

            return await db.Carts
                .Include(c => c.Items).ThenInclude(i => i.Variant).ThenInclude(v => v.Product)
                .Include(c => c.Items).ThenInclude(i => i.Variant).ThenInclude(v => v.Discounts)
                .Include(c => c.Items).ThenInclude(i => i.DesignFile)
                .FirstOrDefaultAsync(c => c.GuestToken == token);
        }
    }

    // ── GET /api/v1/cart ──────────────────────────────────────────────────────

    [HttpGet]
    public async Task<IActionResult> GetCart()
    {
        var cart = await ResolveCartAsync();
        if (cart is null)
            return Ok(new CartDto { Items = new(), Total = 0 });

        return Ok(MapCart(cart));
    }

    // ── POST /api/v1/cart/items ───────────────────────────────────────────────

    [HttpPost("items")]
    public async Task<IActionResult> AddItem([FromBody] AddCartItemRequest req)
    {
        var variant = await db.ProductVariants
            .Include(v => v.Product)
            .FirstOrDefaultAsync(v => v.Id == req.ProductVariantId);

        if (variant is null || !variant.IsAvailable)
            return BadRequest(new
            {
                type = "https://filamorfosis.com/errors/variant-unavailable",
                title = "Bad Request",
                status = 400,
                detail = "Product variant is not available."
            });

        var cart = await ResolveCartAsync();
        if (cart is null)
            return BadRequest(new { detail = "Cart session not found." });

        var existing = cart.Items.FirstOrDefault(i => i.ProductVariantId == req.ProductVariantId);
        if (existing is not null)
        {
            existing.Quantity += req.Quantity;
        }
        else
        {
            var newItem = new CartItem
            {
                Id = Guid.NewGuid(),
                CartId = cart.Id,
                ProductVariantId = req.ProductVariantId,
                Quantity = req.Quantity,
                CustomizationNotes = req.CustomizationNotes
            };
            db.CartItems.Add(newItem);
        }

        await db.SaveChangesAsync();

        // Reload with navigation properties
        cart = await ResolveCartAsync();
        return Ok(MapCart(cart!));
    }

    // ── PUT /api/v1/cart/items/{itemId} ───────────────────────────────────────

    [HttpPut("items/{itemId:guid}")]
    public async Task<IActionResult> UpdateItem(Guid itemId, [FromBody] UpdateCartItemRequest req)
    {
        var cart = await ResolveCartAsync();
        if (cart is null) return NotFound();

        var item = cart.Items.FirstOrDefault(i => i.Id == itemId);
        if (item is null) return NotFound();

        if (req.Quantity <= 0)
            db.CartItems.Remove(item);
        else
            item.Quantity = req.Quantity;

        await db.SaveChangesAsync();

        cart = await ResolveCartAsync();
        return Ok(MapCart(cart!));
    }

    // ── DELETE /api/v1/cart/items/{itemId} ────────────────────────────────────

    [HttpDelete("items/{itemId:guid}")]
    public async Task<IActionResult> RemoveItem(Guid itemId)
    {
        var cart = await ResolveCartAsync();
        if (cart is null) return NotFound();

        var item = cart.Items.FirstOrDefault(i => i.Id == itemId);
        if (item is null) return NotFound();

        db.CartItems.Remove(item);
        await db.SaveChangesAsync();

        cart = await ResolveCartAsync();
        return Ok(MapCart(cart!));
    }

    // ── DELETE /api/v1/cart ───────────────────────────────────────────────────

    [HttpDelete]
    public async Task<IActionResult> ClearCart()
    {
        var cart = await ResolveCartAsync();
        if (cart is null) return Ok(new CartDto());

        db.CartItems.RemoveRange(cart.Items);
        await db.SaveChangesAsync();

        return Ok(new CartDto { Id = cart.Id });
    }

    // ── Cart merge (called from AuthController on login/register) ─────────────

    public static async Task MergeGuestCartAsync(FilamorfosisDbContext db, Guid userId, string? guestToken)
    {
        if (string.IsNullOrEmpty(guestToken)) return;

        var guestCart = await db.Carts
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.GuestToken == guestToken);

        if (guestCart is null || !guestCart.Items.Any()) return;

        var userCart = await db.Carts
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (userCart is null)
        {
            guestCart.UserId = userId;
            guestCart.GuestToken = null;
            guestCart.ExpiresAt = DateTime.UtcNow.AddYears(1);
        }
        else
        {
            foreach (var guestItem in guestCart.Items)
            {
                var existing = userCart.Items.FirstOrDefault(i => i.ProductVariantId == guestItem.ProductVariantId);
                if (existing is not null)
                    existing.Quantity += guestItem.Quantity;
                else
                {
                    guestItem.CartId = userCart.Id;
                    userCart.Items.Add(guestItem);
                }
            }
            db.Carts.Remove(guestCart);
        }

        await db.SaveChangesAsync();
    }

    // ── Mapping ───────────────────────────────────────────────────────────────

    private static CartDto MapCart(Cart cart) => new()
    {
        Id = cart.Id,
        Items = cart.Items.Select(i => new CartItemDto
        {
            Id = i.Id,
            ProductVariantId = i.ProductVariantId,
            ProductTitleEs = i.Variant?.Product?.TitleEs ?? string.Empty,
            ProductTitleEn = i.Variant?.Product?.TitleEn ?? string.Empty,
            VariantLabelEs = i.Variant?.LabelEs ?? string.Empty,
            VariantLabelEn = i.Variant?.LabelEs ?? string.Empty,
            UnitPrice = DiscountCalculator.ComputeEffectivePrice(i.Variant?.Price ?? 0, i.Variant?.Discounts ?? []),
            OriginalPrice = i.Variant?.Price ?? 0,
            Quantity = i.Quantity,
            CustomizationNotes = i.CustomizationNotes,
            AcceptsDesignFile = i.Variant?.AcceptsDesignFile ?? false,
            DesignFileId = i.DesignFileId,
            DesignFileName = i.DesignFile?.FileName
        }).ToList(),
        Total = cart.Items.Sum(i => DiscountCalculator.ComputeEffectivePrice(i.Variant?.Price ?? 0, i.Variant?.Discounts ?? []) * i.Quantity)
    };
}
