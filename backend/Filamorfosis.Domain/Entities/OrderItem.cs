namespace Filamorfosis.Domain.Entities;

public class OrderItem
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public Guid ProductVariantId { get; set; }
    public string ProductTitleEs { get; set; } = string.Empty;
    public string ProductTitleEn { get; set; } = string.Empty;
    public string VariantLabelEs { get; set; } = string.Empty;
    public string VariantLabelEn { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
    public Guid? DesignFileId { get; set; }
    public Order Order { get; set; } = null!;
    public ProductVariant Variant { get; set; } = null!;
    public DesignFile? DesignFile { get; set; }
}
