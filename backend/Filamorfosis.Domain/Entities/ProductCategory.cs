namespace Filamorfosis.Domain.Entities;

/// <summary>
/// Root-level product category (e.g., "Regalos Personalizados", "Bodas & Eventos")
/// </summary>
public class ProductCategory
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Icon { get; set; }

    // Navigation properties
    public ICollection<ProductSubCategory> SubCategories { get; set; } = new List<ProductSubCategory>();
    public ICollection<ProductCategoryAssignment> ProductAssignments { get; set; } = new List<ProductCategoryAssignment>();
}
