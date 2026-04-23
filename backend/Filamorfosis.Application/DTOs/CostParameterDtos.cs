namespace Filamorfosis.Application.DTOs;

public class CostParameterDto
{
    public Guid Id { get; set; }
    public Guid CategoryId { get; set; }
    public string CategoryNameEs { get; set; } = string.Empty;
    public string Key { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public decimal Value { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public record UpsertCostParameterRequest(
    string Label,
    string Unit,
    decimal Value
);
