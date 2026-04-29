namespace Filamorfosis.Domain.Entities;

/// <summary>
/// Records how much of a specific supply (ProcessCost) a material consumes.
/// e.g. "Ceramic Coaster" uses 50 cm² of ink → ink_cost_flat_per_cm2 × 50
/// </summary>
public class MaterialSupplyUsage
{
    public Guid Id { get; set; }
    public Guid MaterialId { get; set; }
    public Material Material { get; set; } = null!;
    public Guid ProcessCostId { get; set; }
    public ProcessCost ProcessCost { get; set; } = null!;
    /// <summary>Quantity consumed (cm², grams, sheets, etc.).</summary>
    public decimal Quantity { get; set; }
}
