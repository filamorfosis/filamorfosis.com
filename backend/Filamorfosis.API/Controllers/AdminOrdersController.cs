using Filamorfosis.Application.DTOs;
using Filamorfosis.Domain.Entities;
using Filamorfosis.Infrastructure.Data;
using Filamorfosis.Infrastructure.Services;
using Filamorfosis.API.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Filamorfosis.API.Controllers;

[ApiController]
[Route("api/v1/admin/orders")]
[Authorize(Roles = "Master,OrderManagement")]
[RequireMfa]
public class AdminOrdersController(
    FilamorfosisDbContext db,
    IS3Service s3,
    IEmailService emailService,
    ILogger<AdminOrdersController> logger) : ControllerBase
{
    private static readonly Dictionary<OrderStatus, OrderStatus[]> AllowedTransitions = new()
    {
        [OrderStatus.Paid]      = [OrderStatus.Preparing],
        [OrderStatus.Preparing] = [OrderStatus.Shipped],
        [OrderStatus.Shipped]   = [OrderStatus.Delivered],
        [OrderStatus.Delivered] = [],
    };

    // GET /api/v1/admin/orders?page=1&pageSize=20&status=Paid&search=abc
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        [FromQuery] string? search = null)
    {
        var query = db.Orders
            .Include(o => o.User)
            .Include(o => o.Items)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<OrderStatus>(status, ignoreCase: true, out var parsedStatus))
            query = query.Where(o => o.Status == parsedStatus);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.Trim().ToLower();
            query = query.Where(o =>
                (o.User != null && EF.Functions.Like(o.User.Email!.ToLower(), $"%{searchLower}%")) ||
                o.Id.ToString().ToLower().Contains(searchLower));
        }

        query = query.OrderByDescending(o => o.CreatedAt);

        var total = await query.CountAsync();
        var orders = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        var items = orders.Select(o => new AdminOrderSummaryDto
        {
            Id = o.Id,
            UserEmail = o.User?.Email ?? string.Empty,
            Total = o.Total,
            Status = o.Status.ToString(),
            CreatedAt = o.CreatedAt,
            ItemCount = o.Items.Count
        }).ToList();

        return Ok(new PagedResult<AdminOrderSummaryDto>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = total
        });
    }

    // GET /api/v1/admin/orders/{orderId}
    [HttpGet("{orderId:guid}")]
    public async Task<IActionResult> GetById(Guid orderId)
    {
        var order = await db.Orders
            .Include(o => o.User)
            .Include(o => o.ShippingAddress)
            .Include(o => o.Items).ThenInclude(i => i.DesignFile)
            .FirstOrDefaultAsync(o => o.Id == orderId);

        if (order is null)
            return NotFound(new
            {
                type = "https://filamorfosis.com/errors/not-found",
                title = "Not Found",
                status = 404,
                detail = $"Order {orderId} not found."
            });

        var designFileCount = order.Items.Count(i => i.DesignFile is not null);

        var dto = new AdminOrderDetailDto
        {
            Id = order.Id,
            UserEmail = order.User?.Email ?? string.Empty,
            Total = order.Total,
            Status = order.Status.ToString(),
            Notes = order.Notes,
            CreatedAt = order.CreatedAt,
            UpdatedAt = order.UpdatedAt,
            MercadoPagoPreferenceId = order.MercadoPagoPreferenceId,
            DesignFileCount = designFileCount,
            ShippingAddress = order.ShippingAddress is null ? new AddressDto() : new AddressDto
            {
                Id = order.ShippingAddress.Id,
                Street = order.ShippingAddress.Street,
                City = order.ShippingAddress.City,
                State = order.ShippingAddress.State,
                PostalCode = order.ShippingAddress.PostalCode,
                Country = order.ShippingAddress.Country,
                IsDefault = order.ShippingAddress.IsDefault
            },
            Items = order.Items.Select(i => new OrderItemDto
            {
                Id = i.Id,
                ProductTitleEs = i.ProductTitleEs,
                VariantLabelEs = i.VariantLabelEs,
                UnitPrice = i.UnitPrice,
                Quantity = i.Quantity,
                DesignFileId = i.DesignFileId
            }).ToList()
        };

        return Ok(dto);
    }

    // PUT /api/v1/admin/orders/{orderId}/status
    [HttpPut("{orderId:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid orderId, [FromBody] UpdateOrderStatusRequest req)
    {
        var order = await db.Orders
            .Include(o => o.User)
            .FirstOrDefaultAsync(o => o.Id == orderId);

        if (order is null)
            return NotFound(new
            {
                type = "https://filamorfosis.com/errors/not-found",
                title = "Not Found",
                status = 404,
                detail = $"Order {orderId} not found."
            });

        if (!Enum.TryParse<OrderStatus>(req.Status, ignoreCase: true, out var newStatus))
            return UnprocessableEntity(new
            {
                type = "https://filamorfosis.com/errors/invalid-status",
                title = "Unprocessable Entity",
                status = 422,
                detail = $"'{req.Status}' is not a valid order status."
            });

        if (!AllowedTransitions.TryGetValue(order.Status, out var allowedNext) || !allowedNext.Contains(newStatus))
        {
            var allowedNames = AllowedTransitions.TryGetValue(order.Status, out var transitions)
                ? transitions.Select(s => s.ToString()).ToArray()
                : Array.Empty<string>();

            return UnprocessableEntity(new
            {
                type = "https://filamorfosis.com/errors/invalid-transition",
                title = "Unprocessable Entity",
                status = 422,
                detail = $"Invalid transition from {order.Status} to {newStatus}. Allowed next statuses: [{string.Join(", ", allowedNames)}]."
            });
        }

        order.Status = newStatus;
        order.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        if (newStatus == OrderStatus.Shipped && order.User?.Email is not null)
        {
            var email = order.User.Email;
            var id = order.Id;
            _ = Task.Run(async () =>
            {
                try { await emailService.SendShipmentNotificationAsync(email, id); }
                catch (Exception ex) { logger.LogError(ex, "Failed to send shipment notification for order {OrderId}", id); }
            });
        }

        return Ok(new { orderId = order.Id, status = order.Status.ToString() });
    }

    // GET /api/v1/admin/orders/{orderId}/design-files
    [HttpGet("{orderId:guid}/design-files")]
    public async Task<IActionResult> GetDesignFiles(Guid orderId)
    {
        var order = await db.Orders
            .Include(o => o.Items).ThenInclude(i => i.DesignFile)
            .FirstOrDefaultAsync(o => o.Id == orderId);

        if (order is null)
            return NotFound(new
            {
                type = "https://filamorfosis.com/errors/not-found",
                title = "Not Found",
                status = 404,
                detail = $"Order {orderId} not found."
            });

        var files = order.Items
            .Where(i => i.DesignFile is not null)
            .Select(async i => new
            {
                designFileId = i.DesignFile!.Id,
                fileName = i.DesignFile.FileName,
                presignedUrl = await s3.GetPresignedUrlAsync(i.DesignFile.S3Key, 60)
            });

        return Ok(await Task.WhenAll(files));
    }
}
