namespace Filamorfosis.Domain.Entities;

public class ProductAttributeDefinition
{
    public Guid ProductId { get; set; }
    public Guid AttributeDefinitionId { get; set; }
    public Product Product { get; set; } = null!;
    public AttributeDefinition AttributeDefinition { get; set; } = null!;
}
