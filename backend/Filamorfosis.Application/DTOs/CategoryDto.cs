namespace Filamorfosis.Application.DTOs;

public class CategoryDto
{
    public Guid Id { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string NameEs { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public int ProductCount { get; set; }
    public List<CategoryAttributeDto> Attributes { get; set; } = new();
    public List<CostParameterDto> CostParameters { get; set; } = new();
}

public class CategoryAttributeDto
{
    public Guid Id { get; set; }
    public string AttributeType { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
}

public class CreateCategoryAttributeRequest
{
    public string AttributeType { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
}

public class CreateCostParameterRequest
{
    public string Label { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public decimal Value { get; set; }
}

public class UpdateCostParameterRequest
{
    public string? Label { get; set; }
    public string? Unit { get; set; }
    public decimal Value { get; set; }
}
