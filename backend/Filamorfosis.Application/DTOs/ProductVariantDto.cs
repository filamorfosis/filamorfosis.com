namespace Filamorfosis.Application.DTOs;

public class VariantMaterialUsageDto
{
    public Guid MaterialId { get; set; }
    public string MaterialName { get; set; } = string.Empty;
    public decimal MaterialBaseCost { get; set; }
    public decimal Quantity { get; set; }
    public decimal TotalCost => MaterialBaseCost * Quantity;
}

public class ProductVariantDto
{
    public Guid Id { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string LabelEs { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public decimal EffectivePrice { get; set; }
    public bool IsAvailable { get; set; }
    public bool AcceptsDesignFile { get; set; }
    /// <summary>Derived from material stock — true if ALL referenced materials have StockQuantity > 0.</summary>
    public bool InStock { get; set; }
    public decimal BaseCost { get; set; }
    public decimal Profit { get; set; }
    public int? ManufactureTimeMinutes { get; set; }
    public List<VariantAttributeValueDto> Attributes { get; set; } = new();
    public List<DiscountDto> Discounts { get; set; } = new();
    /// <summary>Material usages: { materialId -> quantity }</summary>
    public Dictionary<string, decimal> MaterialUsages { get; set; } = new();
}
