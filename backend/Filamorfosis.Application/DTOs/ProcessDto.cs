namespace Filamorfosis.Application.DTOs;

public class ProcessDto
{
    public Guid Id { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string NameEs { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public int ProductCount { get; set; }
    public List<ProcessAttributeDto> Attributes { get; set; } = new();
    public List<ProcessCostDto> CostParameters { get; set; } = new();
}

public class ProcessAttributeDto
{
    public Guid Id { get; set; }
    public string AttributeType { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
}

public class CreateProcessAttributeRequest
{
    public string AttributeType { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
}
