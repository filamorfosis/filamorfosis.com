using Filamorfosis.Domain.Entities;

namespace Filamorfosis.Application.DTOs;

public class CreateOrderRequest
{
    public Guid ShippingAddressId { get; set; }
    public string? Notes { get; set; }
}

public class OrderSummaryDto
{
    public Guid Id { get; set; }
    public decimal Total { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public int ItemCount { get; set; }
}

public class AdminOrderSummaryDto : OrderSummaryDto
{
    public string UserEmail { get; set; } = string.Empty;
}

public class OrderDetailDto
{
    public Guid Id { get; set; }
    public decimal Total { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public AddressDto ShippingAddress { get; set; } = new();
    public List<OrderItemDto> Items { get; set; } = new();
    public string? MercadoPagoPreferenceId { get; set; }
}

public class AdminOrderDetailDto : OrderDetailDto
{
    public string UserEmail { get; set; } = string.Empty;
    public int DesignFileCount { get; set; }
}

public class OrderItemDto
{
    public Guid Id { get; set; }
    public string ProductTitleEs { get; set; } = string.Empty;
    public string ProductTitleEn { get; set; } = string.Empty;
    public string VariantLabelEs { get; set; } = string.Empty;
    public string VariantLabelEn { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
    public Guid? DesignFileId { get; set; }
}

public class UpdateOrderStatusRequest
{
    public string Status { get; set; } = string.Empty;
}
