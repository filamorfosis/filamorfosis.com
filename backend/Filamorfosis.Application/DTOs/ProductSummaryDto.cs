namespace Filamorfosis.Application.DTOs;

public class ProductSummaryDto
{
    public Guid Id { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string TitleEs { get; set; } = string.Empty;
    public string DescriptionEs { get; set; } = string.Empty;
    public string[] Tags { get; set; } = [];
    /// <summary>Aggregated from all variant ImageUrls (deduplicated, order preserved).</summary>
    public string[] ImageUrls { get; set; } = [];
    public string? Badge { get; set; }
    public bool IsActive { get; set; }
    public Guid ProcessId { get; set; }
    public decimal BasePrice { get; set; }
    public bool HasDiscount { get; set; }
    public List<ProductVariantDto> Variants { get; set; } = new();
}
