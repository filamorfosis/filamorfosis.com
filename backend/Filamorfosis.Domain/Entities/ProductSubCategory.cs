namespace Filamorfosis.Domain.Entities;

/// <summary>
/// Subcategory under a root category (e.g., "Para él", "Para ella" under "Regalos Personalizados")
/// </summary>
public class ProductSubCategory
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Icon { get; set; }
    public Guid ParentCategoryId { get; set; }

    // Navigation properties
    public ProductCategory ParentCategory { get; set; } = null!;
}
