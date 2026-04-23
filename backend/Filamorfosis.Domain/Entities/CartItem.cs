namespace Filamorfosis.Domain.Entities;

public class CartItem
{
    public Guid Id { get; set; }
    public Guid CartId { get; set; }
    public Guid ProductVariantId { get; set; }
    public int Quantity { get; set; }
    public string? CustomizationNotes { get; set; }
    public Guid? DesignFileId { get; set; }
    public Cart Cart { get; set; } = null!;
    public ProductVariant Variant { get; set; } = null!;
    public DesignFile? DesignFile { get; set; }
}
