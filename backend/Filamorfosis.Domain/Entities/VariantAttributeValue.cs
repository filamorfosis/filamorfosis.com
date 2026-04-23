namespace Filamorfosis.Domain.Entities;

public class VariantAttributeValue
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public Guid VariantId { get; set; }
    public Guid AttributeDefinitionId { get; set; }
    public string Value { get; set; } = string.Empty;
    public Product Product { get; set; } = null!;
    public ProductVariant Variant { get; set; } = null!;
    public AttributeDefinition AttributeDefinition { get; set; } = null!;
}
