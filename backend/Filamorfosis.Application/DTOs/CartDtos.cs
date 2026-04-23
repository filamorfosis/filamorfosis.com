namespace Filamorfosis.Application.DTOs;

public class CartDto
{
    public Guid Id { get; set; }
    public List<CartItemDto> Items { get; set; } = new();
    public decimal Total { get; set; }
}

public class CartItemDto
{
    public Guid Id { get; set; }
    public Guid ProductVariantId { get; set; }
    public string ProductTitleEs { get; set; } = string.Empty;
    public string ProductTitleEn { get; set; } = string.Empty;
    public string VariantLabelEs { get; set; } = string.Empty;
    public string VariantLabelEn { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }       // effective (discounted) price
    public decimal OriginalPrice { get; set; }    // full price before discount
    public int Quantity { get; set; }
    public string? CustomizationNotes { get; set; }
    public bool AcceptsDesignFile { get; set; }
    public Guid? DesignFileId { get; set; }
    public string? DesignFileName { get; set; }
}

public class AddCartItemRequest
{
    public Guid ProductVariantId { get; set; }
    public int Quantity { get; set; } = 1;
    public string? CustomizationNotes { get; set; }
}

public class UpdateCartItemRequest
{
    public int Quantity { get; set; }
}
