namespace Filamorfosis.Application.DTOs;

/// <summary>
/// DTO for root category data transfer.
/// </summary>
public class CategoryDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Icon { get; set; }
    public List<SubCategoryDto> SubCategories { get; set; } = new();
}

/// <summary>
/// DTO for subcategory data transfer.
/// </summary>
public class SubCategoryDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Icon { get; set; }
    public Guid ParentCategoryId { get; set; }
}

/// <summary>
/// Request DTO for creating a new category.
/// </summary>
public class CreateCategoryRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? Description { get; set; }
    public string? Icon { get; set; }
}

/// <summary>
/// Request DTO for updating an existing category.
/// All fields are optional to support partial updates.
/// </summary>
public class UpdateCategoryRequest
{
    public string? Name { get; set; }
    public string? Slug { get; set; }
    public string? Description { get; set; }
    public string? Icon { get; set; }
}

/// <summary>
/// Request DTO for creating a new subcategory.
/// </summary>
public class CreateSubCategoryRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? Description { get; set; }
    public string? Icon { get; set; }
    public Guid ParentCategoryId { get; set; }
}

/// <summary>
/// Request DTO for updating an existing subcategory.
/// All fields are optional to support partial updates.
/// </summary>
public class UpdateSubCategoryRequest
{
    public string? Name { get; set; }
    public string? Slug { get; set; }
    public string? Description { get; set; }
    public string? Icon { get; set; }
    public Guid? ParentCategoryId { get; set; }
}

/// <summary>
/// Request DTO for assigning categories to a product.
/// </summary>
public class AssignCategoriesRequest
{
    public List<CategoryAssignmentDto> Assignments { get; set; } = new();
}

/// <summary>
/// DTO for a single category assignment (category + subcategory).
/// </summary>
public class CategoryAssignmentDto
{
    public Guid CategoryId { get; set; }
    public Guid SubCategoryId { get; set; }
}

/// <summary>
/// DTO for displaying a product's category assignment (includes names and icons).
/// </summary>
public class ProductCategoryAssignmentDto
{
    public Guid CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string? CategoryIcon { get; set; }
    public Guid SubCategoryId { get; set; }
    public string SubCategoryName { get; set; } = string.Empty;
    public string? SubCategoryIcon { get; set; }
    
    // For display purposes - shows subcategory name
    public string Name { get; set; } = string.Empty;
    public string? Icon { get; set; }
}

/// <summary>
/// Result of a validation operation.
/// </summary>
public class ValidationResult
{
    public bool IsValid { get; set; }
    public List<string> Errors { get; set; } = new();
}
