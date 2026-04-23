namespace Filamorfosis.Application.DTOs;

public class GlobalParameterDto
{
    public Guid Id { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; }
}

public record UpdateGlobalParameterRequest(
    string Value
);
