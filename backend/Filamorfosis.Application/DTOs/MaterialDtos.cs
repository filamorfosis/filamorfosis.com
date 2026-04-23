namespace Filamorfosis.Application.DTOs;

public class MaterialSupplyUsageDto
{
    public Guid CostParameterId { get; set; }
    public string Label { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public decimal UnitCost { get; set; }
    public decimal Quantity { get; set; }
    public decimal TotalCost => UnitCost * Quantity;
}

public class MaterialDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public Guid CategoryId { get; set; }
    public string CategoryNameEs { get; set; } = string.Empty;
    public string? SizeLabel { get; set; }
    public decimal? WidthCm { get; set; }
    public decimal? HeightCm { get; set; }
    public decimal? DepthCm { get; set; }
    public int? WeightGrams { get; set; }
    public decimal BaseCost { get; set; }
    public decimal ManualBaseCost { get; set; }
    public int StockQuantity { get; set; }
    public List<MaterialSupplyUsageDto> SupplyUsages { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

public record CreateMaterialRequest(
    string Name,
    Guid CategoryId,
    string? SizeLabel,
    decimal? WidthCm,
    decimal? HeightCm,
    decimal? DepthCm,
    int? WeightGrams,
    int StockQuantity,
    decimal BaseCost = 0,
    Dictionary<string, decimal>? SupplyUsages = null
);

public record UpdateMaterialRequest(
    string? Name,
    Guid? CategoryId,
    string? SizeLabel,
    decimal? WidthCm,
    decimal? HeightCm,
    decimal? DepthCm,
    int? WeightGrams,
    int? StockQuantity,
    decimal? BaseCost = null,
    Dictionary<string, decimal>? SupplyUsages = null
);
