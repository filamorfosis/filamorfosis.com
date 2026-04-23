namespace Filamorfosis.Domain.Entities;

public class ProductVariant
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string LabelEs { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public bool IsAvailable { get; set; }
    public bool AcceptsDesignFile { get; set; }
    public int StockQuantity { get; set; }
    public int? WeightGrams { get; set; }
    public decimal BaseCost { get; set; } = 0;
    public decimal Profit { get; set; } = 0;
    public int? ManufactureTimeMinutes { get; set; }
    public string? PrintType { get; set; }
    public Product Product { get; set; } = null!;
    public ICollection<Discount> Discounts { get; set; } = new List<Discount>();
    public ICollection<VariantAttributeValue> AttributeValues { get; set; } = new List<VariantAttributeValue>();
    public ICollection<VariantMaterialUsage> MaterialUsages { get; set; } = new List<VariantMaterialUsage>();
}
