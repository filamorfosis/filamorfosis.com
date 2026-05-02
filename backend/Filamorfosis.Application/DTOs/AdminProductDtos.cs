namespace Filamorfosis.Application.DTOs;

public class CreateProductRequest
{
    public string TitleEs { get; set; } = string.Empty;
    public string DescriptionEs { get; set; } = string.Empty;
    public Guid ProcessId { get; set; }
    public string[] Tags { get; set; } = [];
    public string? Badge { get; set; }
    public bool IsActive { get; set; } = true;
}

public class UpdateProductRequest
{
    public string? TitleEs { get; set; }
    public string? DescriptionEs { get; set; }
    public Guid? ProcessId { get; set; }
    public string[]? Tags { get; set; }
    public string? Badge { get; set; }
    public bool? IsActive { get; set; }
}

public class CreateVariantRequest
{
    public string LabelEs { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int StockQuantity { get; set; }
    public bool IsAvailable { get; set; } = true;
    public bool AcceptsDesignFile { get; set; }
    public List<VariantAttributeInput> Attributes { get; set; } = new();
    public decimal Profit { get; set; } = 0;
    public int? ManufactureTimeMinutes { get; set; }
    /// <summary>Material usages: { materialId -> quantity }</summary>
    public Dictionary<string, decimal> MaterialUsages { get; set; } = new();
}

public class UpdateVariantRequest
{
    public string? LabelEs { get; set; }
    public string? Sku { get; set; }
    public decimal? Price { get; set; }
    public int? StockQuantity { get; set; }
    public bool? IsAvailable { get; set; }
    public bool? AcceptsDesignFile { get; set; }
    public List<VariantAttributeInput> Attributes { get; set; } = new();
    public decimal? Profit { get; set; }
    public int? ManufactureTimeMinutes { get; set; }
    /// <summary>Material usages: { materialId -> quantity }</summary>
    public Dictionary<string, decimal> MaterialUsages { get; set; } = new();
}

public class CreateProcessRequest
{
    public string Slug { get; set; } = string.Empty;
    public string NameEs { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
}

public class UpdateProcessRequest
{
    public string? NameEs { get; set; }
    public string? Slug { get; set; }
    public string? ImageUrl { get; set; }
    public bool? IsActive { get; set; }
}

public class DeleteImageRequest
{
    public string ImageUrl { get; set; } = string.Empty;
}
