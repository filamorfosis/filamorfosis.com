namespace Filamorfosis.Domain.Entities;

public class Discount
{
    public Guid Id { get; set; }
    /// <summary>Set when the discount applies at the product level; null for variant-level discounts.</summary>
    public Guid? ProductId { get; set; }
    /// <summary>Set when the discount applies at the variant level; null for product-level discounts.</summary>
    public Guid? ProductVariantId { get; set; }
    /// <summary>One of: "Percentage" | "FixedAmount"</summary>
    public string DiscountType { get; set; } = string.Empty;
    public decimal Value { get; set; }
    public DateTime? StartsAt { get; set; }
    public DateTime? EndsAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public Product? Product { get; set; }
    public ProductVariant? Variant { get; set; }
}
