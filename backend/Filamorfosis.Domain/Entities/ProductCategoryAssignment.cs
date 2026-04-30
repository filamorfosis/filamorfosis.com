namespace Filamorfosis.Domain.Entities;

public class ProductCategoryAssignment
{
    public Guid ProductId { get; set; }
    public Guid CategoryId { get; set; }
    public Guid SubCategoryId { get; set; }

    // Navigation properties
    public Product Product { get; set; } = null!;
    public ProductCategory Category { get; set; } = null!;
    public ProductSubCategory SubCategory { get; set; } = null!;
}
