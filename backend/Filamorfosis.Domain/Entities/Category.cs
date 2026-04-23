namespace Filamorfosis.Domain.Entities;

public class Category
{
    public Guid Id { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string NameEs { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public ICollection<Product> Products { get; set; } = new List<Product>();
    public ICollection<CategoryAttribute> Attributes { get; set; } = new List<CategoryAttribute>();
}
