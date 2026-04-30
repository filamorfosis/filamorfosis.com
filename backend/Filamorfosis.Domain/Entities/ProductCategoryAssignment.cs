namespace Filamorfosis.Domain.Entities;

public class ProductCategoryAssignment
{
    public Guid ProductId { get; set; }
    public Guid CategoryId { get; set; }

    // Navigation properties
    public Product Product { get; set; } = null!;
    public ProductCategory Category { get; set; } = null!;
}
