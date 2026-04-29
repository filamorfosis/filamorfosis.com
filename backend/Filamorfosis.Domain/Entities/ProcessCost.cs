namespace Filamorfosis.Domain.Entities;

public class ProcessCost
{
    public Guid Id { get; set; }
    public Guid ProcessId { get; set; }
    public Process Process { get; set; } = null!;
    public string Key { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public decimal Value { get; set; }
    public DateTime UpdatedAt { get; set; }
}
