using Filamorfosis.Application.DTOs;
using Filamorfosis.Domain.Entities;
using Filamorfosis.Infrastructure.Data;
using Filamorfosis.API.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Filamorfosis.API.Controllers;

[ApiController]
[Route("api/v1/admin")]
[Authorize]
[RequireMfa]
public class AdminDiscountsController(FilamorfosisDbContext db) : ControllerBase
{
    // POST /api/v1/admin/products/{id}/discounts
    [HttpPost("products/{id:guid}/discounts")]
    public async Task<IActionResult> CreateProductDiscount(Guid id, [FromBody] CreateDiscountRequest req)
    {
        var product = await db.Products.FirstOrDefaultAsync(p => p.Id == id);
        if (product is null) return NotFound();

        if (req.StartsAt.HasValue && req.EndsAt.HasValue && req.EndsAt <= req.StartsAt)
        {
            return UnprocessableEntity(new ProblemDetails
            {
                Type = "https://filamorfosis.com/errors/invalid-discount-dates",
                Title = "Invalid discount dates",
                Status = 422,
                Detail = "endsAt must be after startsAt."
            });
        }

        var discount = new Discount
        {
            Id = Guid.NewGuid(),
            ProductId = id,
            ProductVariantId = null,
            DiscountType = req.DiscountType,
            Value = req.Value,
            StartsAt = req.StartsAt,
            EndsAt = req.EndsAt,
            CreatedAt = DateTime.UtcNow
        };

        db.Discounts.Add(discount);
        await db.SaveChangesAsync();

        return StatusCode(201, MapDto(discount));
    }

    // POST /api/v1/admin/products/{id}/variants/{variantId}/discounts
    [HttpPost("products/{id:guid}/variants/{variantId:guid}/discounts")]
    public async Task<IActionResult> CreateVariantDiscount(Guid id, Guid variantId, [FromBody] CreateDiscountRequest req)
    {
        var variant = await db.ProductVariants
            .FirstOrDefaultAsync(v => v.Id == variantId && v.ProductId == id);
        if (variant is null) return NotFound();

        if (req.StartsAt.HasValue && req.EndsAt.HasValue && req.EndsAt <= req.StartsAt)
        {
            return UnprocessableEntity(new ProblemDetails
            {
                Type = "https://filamorfosis.com/errors/invalid-discount-dates",
                Title = "Invalid discount dates",
                Status = 422,
                Detail = "endsAt must be after startsAt."
            });
        }

        var discount = new Discount
        {
            Id = Guid.NewGuid(),
            ProductId = null,
            ProductVariantId = variantId,
            DiscountType = req.DiscountType,
            Value = req.Value,
            StartsAt = req.StartsAt,
            EndsAt = req.EndsAt,
            CreatedAt = DateTime.UtcNow
        };

        db.Discounts.Add(discount);
        await db.SaveChangesAsync();

        return StatusCode(201, MapDto(discount));
    }

    // DELETE /api/v1/admin/discounts/{discountId}
    [HttpDelete("discounts/{discountId:guid}")]
    public async Task<IActionResult> DeleteDiscount(Guid discountId)
    {
        var discount = await db.Discounts.FirstOrDefaultAsync(d => d.Id == discountId);
        if (discount is null) return NotFound();

        db.Discounts.Remove(discount);
        await db.SaveChangesAsync();

        return NoContent();
    }

    private static DiscountDto MapDto(Discount d) => new()
    {
        Id = d.Id,
        DiscountType = d.DiscountType,
        Value = d.Value,
        StartsAt = d.StartsAt,
        EndsAt = d.EndsAt,
        CreatedAt = d.CreatedAt
    };
}
