namespace Filamorfosis.Domain.Entities;

public class CategoryAttribute
{
    public Guid Id { get; set; }
    public Guid CategoryId { get; set; }
    /// <summary>One of: "Type" | "Color" | "Size"</summary>
    public string AttributeType { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public Category Category { get; set; } = null!;
}
