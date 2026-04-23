namespace Filamorfosis.Domain.Entities;

public class Material
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public Guid CategoryId { get; set; }
    public Category Category { get; set; } = null!;
    public string? SizeLabel { get; set; }
    public decimal? WidthCm { get; set; }
    public decimal? HeightCm { get; set; }
    public decimal? DepthCm { get; set; }
    public int? WeightGrams { get; set; }
    /// <summary>Cached computed cost = manualBaseCost + Σ(supply.value × usage.quantity). Updated on save.</summary>
    public decimal BaseCost { get; set; }
    /// <summary>Manual base cost entered by the admin (material purchase price). Stored separately from supply costs.</summary>
    public decimal ManualBaseCost { get; set; } = 0;
    /// <summary>Number of units currently in stock. Drives variant in-stock status.</summary>
    public int StockQuantity { get; set; } = 0;
    public DateTime CreatedAt { get; set; }
    public ICollection<MaterialSupplyUsage> SupplyUsages { get; set; } = new List<MaterialSupplyUsage>();
    public ICollection<VariantMaterialUsage> VariantUsages { get; set; } = new List<VariantMaterialUsage>();
}
