namespace Filamorfosis.Domain.Entities;

public class AttributeDefinition
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public ICollection<ProductAttributeDefinition> ProductAttributes { get; set; } = new List<ProductAttributeDefinition>();
    public ICollection<VariantAttributeValue> VariantValues { get; set; } = new List<VariantAttributeValue>();
}
