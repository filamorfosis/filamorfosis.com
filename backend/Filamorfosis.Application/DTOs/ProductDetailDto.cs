namespace Filamorfosis.Application.DTOs;

public class ProductDetailDto
{
    public Guid Id { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string TitleEs { get; set; } = string.Empty;
    public string DescriptionEs { get; set; } = string.Empty;
    public string[] Tags { get; set; } = [];
    public string[] ImageUrls { get; set; } = [];
    public string? Badge { get; set; }
    public bool IsActive { get; set; }
    public Guid ProcessId { get; set; }
    public string? ProcessNameEs { get; set; }
    public List<ProductVariantDto> Variants { get; set; } = new();
    public List<AttributeDefinitionDto> AttributeDefinitions { get; set; } = new();
    public List<DiscountDto> Discounts { get; set; } = new();
    public List<ProductCategoryAssignmentDto> CategoryAssignments { get; set; } = new();
}
