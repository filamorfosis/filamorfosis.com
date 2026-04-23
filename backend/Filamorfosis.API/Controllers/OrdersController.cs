using System.Security.Claims;
using Filamorfosis.Application;
using Filamorfosis.Application.DTOs;
using Filamorfosis.Domain.Entities;
using Filamorfosis.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Filamorfosis.API.Controllers;

[ApiController]
[Route("api/v1/orders")]
[Authorize]
public class OrdersController(FilamorfosisDbContext db) : ControllerBase
{
    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")!);

    // ── POST /api/v1/orders ───────────────────────────────────────────────────

    [HttpPost]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest req)
    {
        var userId = CurrentUserId;

        // Verify shipping address belongs to user
        var address = await db.Addresses
            .FirstOrDefaultAsync(a => a.Id == req.ShippingAddressId && a.UserId == userId);
        if (address is null)
            return BadRequest(new
            {
                type = "https://filamorfosis.com/errors/invalid-address",
                title = "Bad Request",
                status = 400,
                detail = "Shipping address not found or does not belong to the current user."
            });

        // Load user cart
        var cart = await db.Carts
            .Include(c => c.Items).ThenInclude(i => i.Variant).ThenInclude(v => v.Product)
            .Include(c => c.Items).ThenInclude(i => i.Variant).ThenInclude(v => v.Discounts)
            .Include(c => c.Items).ThenInclude(i => i.DesignFile)
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (cart is null || !cart.Items.Any())
            return BadRequest(new
            {
                type = "https://filamorfosis.com/errors/empty-cart",
                title = "Bad Request",
                status = 400,
                detail = "Cart is empty."
            });

        // Snapshot order items
        var orderItems = cart.Items.Select(i => new OrderItem
        {
            Id = Guid.NewGuid(),
            ProductVariantId = i.ProductVariantId,
            ProductTitleEs = i.Variant?.Product?.TitleEs ?? string.Empty,
            ProductTitleEn = i.Variant?.Product?.TitleEn ?? string.Empty,
            VariantLabelEs = i.Variant?.LabelEs ?? string.Empty,
            VariantLabelEn = i.Variant?.LabelEs ?? string.Empty,
            UnitPrice = DiscountCalculator.ComputeEffectivePrice(i.Variant?.Price ?? 0, i.Variant?.Discounts ?? []),
            Quantity = i.Quantity,
            DesignFileId = i.DesignFileId
        }).ToList();

        var total = orderItems.Sum(i => i.UnitPrice * i.Quantity);

        var order = new Order
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            ShippingAddressId = req.ShippingAddressId,
            Notes = req.Notes,
            Total = total,
            Status = OrderStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Items = orderItems
        };

        db.Orders.Add(order);

        // Clear cart
        db.CartItems.RemoveRange(cart.Items);
        cart.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();

        return StatusCode(201, new { orderId = order.Id, total = order.Total, status = order.Status.ToString() });
    }

    // ── GET /api/v1/orders ────────────────────────────────────────────────────

    [HttpGet]
    public async Task<IActionResult> GetOrders(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var userId = CurrentUserId;
        var query = db.Orders
            .Include(o => o.Items)
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.CreatedAt);

        var total = await query.CountAsync();
        var orders = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        return Ok(new PagedResult<OrderSummaryDto>
        {
            Items = orders.Select(o => new OrderSummaryDto
            {
                Id = o.Id,
                Total = o.Total,
                Status = o.Status.ToString(),
                CreatedAt = o.CreatedAt,
                ItemCount = o.Items.Count
            }).ToList(),
            Page = page,
            PageSize = pageSize,
            TotalCount = total
        });
    }

    // ── GET /api/v1/orders/{orderId} ──────────────────────────────────────────

    [HttpGet("{orderId:guid}")]
    public async Task<IActionResult> GetOrder(Guid orderId)
    {
        var userId = CurrentUserId;
        var order = await db.Orders
            .Include(o => o.Items)
            .Include(o => o.ShippingAddress)
            .FirstOrDefaultAsync(o => o.Id == orderId);

        if (order is null)
            return NotFound(new { detail = "Order not found." });

        if (order.UserId != userId)
            return StatusCode(403, new
            {
                type = "https://filamorfosis.com/errors/forbidden",
                title = "Forbidden",
                status = 403,
                detail = "You do not have access to this order."
            });

        return Ok(MapOrderDetail(order));
    }

    private static OrderDetailDto MapOrderDetail(Order o) => new()
    {
        Id = o.Id,
        Total = o.Total,
        Status = o.Status.ToString(),
        Notes = o.Notes,
        CreatedAt = o.CreatedAt,
        UpdatedAt = o.UpdatedAt,
        MercadoPagoPreferenceId = o.MercadoPagoPreferenceId,
        ShippingAddress = o.ShippingAddress is null ? new() : new AddressDto
        {
            Id = o.ShippingAddress.Id,
            Street = o.ShippingAddress.Street,
            City = o.ShippingAddress.City,
            State = o.ShippingAddress.State,
            PostalCode = o.ShippingAddress.PostalCode,
            Country = o.ShippingAddress.Country
        },
        Items = o.Items.Select(i => new OrderItemDto
        {
            Id = i.Id,
            ProductTitleEs = i.ProductTitleEs,
            ProductTitleEn = i.ProductTitleEn,
            VariantLabelEs = i.VariantLabelEs,
            VariantLabelEn = i.VariantLabelEn,
            UnitPrice = i.UnitPrice,
            Quantity = i.Quantity,
            DesignFileId = i.DesignFileId
        }).ToList()
    };
}
