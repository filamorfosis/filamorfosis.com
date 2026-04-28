namespace Filamorfosis.Application.DTOs;

public class ProductSummaryDto
{
    public Guid Id { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string TitleEs { get; set; } = string.Empty;
    public string TitleEn { get; set; } = string.Empty;
    public string DescriptionEs { get; set; } = string.Empty;
    public string DescriptionEn { get; set; } = string.Empty;
    public string[] Tags { get; set; } = [];
    public string[] ImageUrls { get; set; } = [];
    public string? Badge { get; set; }
    public bool IsActive { get; set; }
    public Guid ProcessId { get; set; }
    public decimal BasePrice { get; set; }  // minimum effective (discounted) variant price
    public bool HasDiscount { get; set; }   // true if any available variant has an active discount
    public List<ProductVariantDto> Variants { get; set; } = new();
}
