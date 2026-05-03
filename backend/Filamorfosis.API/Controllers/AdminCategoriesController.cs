using Filamorfosis.API.Authorization;
using Filamorfosis.Application.DTOs;
using Filamorfosis.Application.Services;
using Filamorfosis.Domain.Entities;
using Filamorfosis.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Filamorfosis.API.Controllers;

/// <summary>
/// Simplified admin categories management controller.
/// Manages two-level category structure: Categories → SubCategories
/// </summary>
[ApiController]
[Route("api/v1/admin/categories")]
[Authorize(Roles = "Master,ProductManagement")]
[RequireMfa]
public class AdminCategoriesController(
    FilamorfosisDbContext db,
    ISlugGenerationService slugService) : ControllerBase
{
    /// <summary>
    /// GET /api/v1/categories
    /// Retrieves all root categories with their subcategories.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var categories = await db.ProductCategories
            .Include(c => c.SubCategories)
            .OrderBy(c => c.Name)
            .ToListAsync();

        var result = categories.Select(c => new CategoryDto
        {
            Id = c.Id,
            Name = c.Name,
            Slug = c.Slug,
            Description = c.Description,
            Icon = c.Icon,
            SubCategories = c.SubCategories.Select(sc => new SubCategoryDto
            {
                Id = sc.Id,
                Name = sc.Name,
                Slug = sc.Slug,
                Description = sc.Description,
                Icon = sc.Icon,
                ParentCategoryId = sc.ParentCategoryId
            }).OrderBy(sc => sc.Name).ToList()
        }).ToList();

        return Ok(result);
    }

    /// <summary>
    /// GET /api/v1/categories/{id}
    /// Retrieves a single category by ID with its subcategories.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var category = await db.ProductCategories
            .Include(c => c.SubCategories)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (category == null)
        {
            return NotFound(new
            {
                type = "https://filamorfosis.com/errors/not-found",
                title = "Category Not Found",
                status = 404,
                detail = $"Category with ID '{id}' was not found."
            });
        }

        var dto = new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Slug = category.Slug,
            Description = category.Description,
            Icon = category.Icon,
            SubCategories = category.SubCategories.Select(sc => new SubCategoryDto
            {
                Id = sc.Id,
                Name = sc.Name,
                Slug = sc.Slug,
                Description = sc.Description,
                Icon = sc.Icon,
                ParentCategoryId = sc.ParentCategoryId
            }).OrderBy(sc => sc.Name).ToList()
        };

        return Ok(dto);
    }

    /// <summary>
    /// POST /api/v1/categories
    /// Creates a new root category.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCategoryRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new
            {
                type = "https://filamorfosis.com/errors/validation",
                title = "Validation Error",
                status = 400,
                detail = "El nombre es requerido."
            });
        }

        // Generate slug if not provided
        string slug;
        if (string.IsNullOrWhiteSpace(request.Slug))
        {
            var baseSlug = slugService.GenerateSlug(request.Name);
            slug = await slugService.EnsureUniqueSlugAsync(baseSlug);
        }
        else
        {
            slug = await slugService.EnsureUniqueSlugAsync(request.Slug);
        }

        var category = new ProductCategory
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Slug = slug,
            Description = request.Description,
            Icon = request.Icon
        };

        db.ProductCategories.Add(category);
        await db.SaveChangesAsync();

        var dto = new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Slug = category.Slug,
            Description = category.Description,
            Icon = category.Icon,
            SubCategories = new List<SubCategoryDto>()
        };

        return CreatedAtAction(nameof(GetById), new { id = category.Id }, dto);
    }

    /// <summary>
    /// PUT /api/v1/categories/{id}
    /// Updates an existing root category.
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCategoryRequest request)
    {
        var category = await db.ProductCategories
            .Include(c => c.SubCategories)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (category == null)
        {
            return NotFound(new
            {
                type = "https://filamorfosis.com/errors/not-found",
                title = "Category Not Found",
                status = 404,
                detail = $"Category with ID '{id}' was not found."
            });
        }

        if (request.Name != null)
        {
            category.Name = request.Name;
        }

        if (request.Slug != null)
        {
            category.Slug = await slugService.EnsureUniqueSlugAsync(request.Slug, id);
        }

        if (request.Description != null)
        {
            category.Description = request.Description;
        }

        if (request.Icon != null)
        {
            category.Icon = request.Icon;
        }

        await db.SaveChangesAsync();

        var dto = new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Slug = category.Slug,
            Description = category.Description,
            Icon = category.Icon,
            SubCategories = category.SubCategories.Select(sc => new SubCategoryDto
            {
                Id = sc.Id,
                Name = sc.Name,
                Slug = sc.Slug,
                Description = sc.Description,
                Icon = sc.Icon,
                ParentCategoryId = sc.ParentCategoryId
            }).OrderBy(sc => sc.Name).ToList()
        };

        return Ok(dto);
    }

    /// <summary>
    /// DELETE /api/v1/categories/{id}
    /// Deletes a root category (cascade deletes all subcategories).
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var category = await db.ProductCategories.FindAsync(id);
        if (category == null)
        {
            return NotFound(new
            {
                type = "https://filamorfosis.com/errors/not-found",
                title = "Category Not Found",
                status = 404,
                detail = $"Category with ID '{id}' was not found."
            });
        }

        db.ProductCategories.Remove(category);
        await db.SaveChangesAsync();

        return NoContent();
    }

    /// <summary>
    /// POST /api/v1/categories/{id}/subcategories
    /// Creates a new subcategory under a root category.
    /// </summary>
    [HttpPost("{id:guid}/subcategories")]
    public async Task<IActionResult> CreateSubCategory(Guid id, [FromBody] CreateSubCategoryRequest request)
    {
        var category = await db.ProductCategories.FindAsync(id);
        if (category == null)
        {
            return NotFound(new
            {
                type = "https://filamorfosis.com/errors/not-found",
                title = "Category Not Found",
                status = 404,
                detail = $"Category with ID '{id}' was not found."
            });
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new
            {
                type = "https://filamorfosis.com/errors/validation",
                title = "Validation Error",
                status = 400,
                detail = "El nombre es requerido."
            });
        }

        // Generate slug if not provided
        string slug;
        if (string.IsNullOrWhiteSpace(request.Slug))
        {
            var baseSlug = slugService.GenerateSlug(request.Name);
            slug = await slugService.EnsureUniqueSlugAsync(baseSlug);
        }
        else
        {
            slug = await slugService.EnsureUniqueSlugAsync(request.Slug);
        }

        var subCategory = new ProductSubCategory
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Slug = slug,
            Description = request.Description,
            Icon = request.Icon,
            ParentCategoryId = id
        };

        db.ProductSubCategories.Add(subCategory);
        await db.SaveChangesAsync();

        var dto = new SubCategoryDto
        {
            Id = subCategory.Id,
            Name = subCategory.Name,
            Slug = subCategory.Slug,
            Description = subCategory.Description,
            Icon = subCategory.Icon,
            ParentCategoryId = subCategory.ParentCategoryId
        };

        return CreatedAtAction(nameof(GetSubCategoryById), new { id = subCategory.Id }, dto);
    }

    /// <summary>
    /// GET /api/v1/categories/subcategories/{id}
    /// Retrieves a single subcategory by ID.
    /// </summary>
    [HttpGet("subcategories/{id:guid}")]
    public async Task<IActionResult> GetSubCategoryById(Guid id)
    {
        var subCategory = await db.ProductSubCategories.FindAsync(id);
        if (subCategory == null)
        {
            return NotFound(new
            {
                type = "https://filamorfosis.com/errors/not-found",
                title = "SubCategory Not Found",
                status = 404,
                detail = $"SubCategory with ID '{id}' was not found."
            });
        }

        var dto = new SubCategoryDto
        {
            Id = subCategory.Id,
            Name = subCategory.Name,
            Slug = subCategory.Slug,
            Description = subCategory.Description,
            Icon = subCategory.Icon,
            ParentCategoryId = subCategory.ParentCategoryId
        };

        return Ok(dto);
    }

    /// <summary>
    /// PUT /api/v1/categories/subcategories/{id}
    /// Updates an existing subcategory.
    /// </summary>
    [HttpPut("subcategories/{id:guid}")]
    public async Task<IActionResult> UpdateSubCategory(Guid id, [FromBody] UpdateSubCategoryRequest request)
    {
        var subCategory = await db.ProductSubCategories.FindAsync(id);
        if (subCategory == null)
        {
            return NotFound(new
            {
                type = "https://filamorfosis.com/errors/not-found",
                title = "SubCategory Not Found",
                status = 404,
                detail = $"SubCategory with ID '{id}' was not found."
            });
        }

        if (request.Name != null)
        {
            subCategory.Name = request.Name;
        }

        if (request.Slug != null)
        {
            subCategory.Slug = await slugService.EnsureUniqueSlugAsync(request.Slug, id);
        }

        if (request.Description != null)
        {
            subCategory.Description = request.Description;
        }

        if (request.Icon != null)
        {
            subCategory.Icon = request.Icon;
        }

        if (request.ParentCategoryId.HasValue)
        {
            // Verify parent category exists
            var parentExists = await db.ProductCategories.AnyAsync(c => c.Id == request.ParentCategoryId.Value);
            if (!parentExists)
            {
                return BadRequest(new
                {
                    type = "https://filamorfosis.com/errors/validation",
                    title = "Validation Error",
                    status = 400,
                    detail = "La categoría padre no existe."
                });
            }
            subCategory.ParentCategoryId = request.ParentCategoryId.Value;
        }

        await db.SaveChangesAsync();

        var dto = new SubCategoryDto
        {
            Id = subCategory.Id,
            Name = subCategory.Name,
            Slug = subCategory.Slug,
            Description = subCategory.Description,
            Icon = subCategory.Icon,
            ParentCategoryId = subCategory.ParentCategoryId
        };

        return Ok(dto);
    }

    /// <summary>
    /// DELETE /api/v1/categories/subcategories/{id}
    /// Deletes a subcategory.
    /// </summary>
    [HttpDelete("subcategories/{id:guid}")]
    public async Task<IActionResult> DeleteSubCategory(Guid id)
    {
        var subCategory = await db.ProductSubCategories.FindAsync(id);
        if (subCategory == null)
        {
            return NotFound(new
            {
                type = "https://filamorfosis.com/errors/not-found",
                title = "SubCategory Not Found",
                status = 404,
                detail = $"SubCategory with ID '{id}' was not found."
            });
        }

        db.ProductSubCategories.Remove(subCategory);
        await db.SaveChangesAsync();

        return NoContent();
    }
}
