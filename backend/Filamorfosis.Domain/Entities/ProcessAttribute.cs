namespace Filamorfosis.Domain.Entities;

public class ProcessAttribute
{
    public Guid Id { get; set; }
    public Guid ProcessId { get; set; }
    /// <summary>One of: "Type" | "Color" | "Size"</summary>
    public string AttributeType { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public Process Process { get; set; } = null!;
}
