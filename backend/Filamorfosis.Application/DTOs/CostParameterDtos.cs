namespace Filamorfosis.Application.DTOs;

public class CostParameterDto
{
    public Guid Id { get; set; }
    public Guid ProcessId { get; set; }
    public string ProcessNameEs { get; set; } = string.Empty;
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
