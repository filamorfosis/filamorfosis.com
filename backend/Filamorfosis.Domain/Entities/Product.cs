namespace Filamorfosis.Domain.Entities;

public class Product
{
    public Guid Id { get; set; }
    public Guid ProcessId { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string TitleEs { get; set; } = string.Empty;
    public string DescriptionEs { get; set; } = string.Empty;
    public string[] Tags { get; set; } = [];
    public string[] ImageUrls { get; set; } = [];
    public string? Badge { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public string[] UseCases { get; set; } = [];
    public Process Process { get; set; } = null!;
    public ICollection<ProductVariant> Variants { get; set; } = new List<ProductVariant>();
    public ICollection<ProductAttributeDefinition> AttributeDefinitions { get; set; } = new List<ProductAttributeDefinition>();
    public ICollection<Discount> Discounts { get; set; } = new List<Discount>();
    public ICollection<ProductCategoryAssignment> CategoryAssignments { get; set; } = new List<ProductCategoryAssignment>();
}
