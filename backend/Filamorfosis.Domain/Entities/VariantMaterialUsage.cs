namespace Filamorfosis.Domain.Entities;

/// <summary>
/// Records how many units of a material a variant uses.
/// e.g. Variant "Taza UV 11oz" uses 1 unit of "Ceramic Mug 11oz"
/// </summary>
public class VariantMaterialUsage
{
    public Guid Id { get; set; }
    public Guid VariantId { get; set; }
    public ProductVariant Variant { get; set; } = null!;
    public Guid MaterialId { get; set; }
    public Material Material { get; set; } = null!;
    /// <summary>Number of material units used (usually 1, but could be fractional).</summary>
    public decimal Quantity { get; set; } = 1;
}
