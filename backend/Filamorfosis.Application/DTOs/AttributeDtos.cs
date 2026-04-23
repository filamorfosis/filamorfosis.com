namespace Filamorfosis.Application.DTOs;

public class VariantAttributeValueDto
{
    public Guid AttributeDefinitionId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
}

public class AttributeDefinitionDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class VariantAttributeInput
{
    public Guid AttributeDefinitionId { get; set; }
    public string Value { get; set; } = string.Empty;
}

public class SetVariantAttributesRequest
{
    public List<VariantAttributeInput> Attributes { get; set; } = new();
}

public class AddProductAttributeRequest
{
    public Guid AttributeDefinitionId { get; set; }
}

public class CreateAttributeDefinitionRequest
{
    public string Name { get; set; } = string.Empty;
}
