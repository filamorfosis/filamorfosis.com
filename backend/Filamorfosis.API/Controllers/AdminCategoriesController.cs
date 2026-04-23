using Filamorfosis.Application.DTOs;
using Filamorfosis.Application.Services;
using Filamorfosis.Domain.Entities;
using Filamorfosis.Infrastructure.Data;
using Filamorfosis.API.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Filamorfosis.API.Controllers;

[ApiController]
[Route("api/v1/admin/categories")]
[Authorize(Roles = "Master,ProductManagement,PriceManagement")]
[RequireMfa]
public class AdminCategoriesController(FilamorfosisDbContext db, IPricingCalculatorService pricing) : ControllerBase
{
    // GET /api/v1/admin/categories
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var cats = await db.Categories
            .Include(c => c.Attributes)
            .Where(c => c.IsActive)
            .ToListAsync();

        var catIds = cats.Select(c => c.Id).ToList();
        var catNames = cats.Select(c => c.NameEs).ToList();

        // Load cost parameters for all categories by ID
        var costParams = await db.CostParameters
            .Include(p => p.Category)
            .Where(p => catIds.Contains(p.CategoryId))
            .OrderBy(p => p.Label)
            .ToListAsync();

        var costParamsByCategory = costParams
            .GroupBy(p => p.CategoryId)
            .ToDictionary(g => g.Key, g => g.Select(p => new CostParameterDto
            {
                Id = p.Id,
                CategoryId = p.CategoryId,
                CategoryNameEs = p.Category.NameEs,
                Key = p.Key,
                Label = p.Label,
                Unit = p.Unit,
                Value = p.Value,
                UpdatedAt = p.UpdatedAt
            }).ToList());

        return Ok(cats.Select(c => new CategoryDto
        {
            Id = c.Id,
            Slug = c.Slug,
            NameEs = c.NameEs,
            NameEn = c.NameEn,
            ImageUrl = c.ImageUrl,
            ProductCount = db.Products.Count(p => p.CategoryId == c.Id && p.IsActive),
            Attributes = c.Attributes.Select(a => new CategoryAttributeDto
            {
                Id = a.Id,
                AttributeType = a.AttributeType,
                Value = a.Value
            }).ToList(),
            CostParameters = costParamsByCategory.TryGetValue(c.Id, out var cp) ? cp : new()
        }));
    }

    // POST /api/v1/admin/categories
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCategoryRequest req)
    {
        var cat = new Category
        {
            Id = Guid.NewGuid(),
            Slug = req.Slug,
            NameEs = req.NameEs,
            NameEn = req.NameEn,
            ImageUrl = req.ImageUrl
        };
        db.Categories.Add(cat);
        await db.SaveChangesAsync();

        return StatusCode(201, new CategoryDto
        {
            Id = cat.Id,
            Slug = cat.Slug,
            NameEs = cat.NameEs,
            NameEn = cat.NameEn,
            ImageUrl = cat.ImageUrl,
            ProductCount = 0,
            Attributes = new List<CategoryAttributeDto>()
        });
    }

    // PUT /api/v1/admin/categories/{id}
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCategoryRequest req)
    {
        var cat = await db.Categories
            .Include(c => c.Attributes)
            .FirstOrDefaultAsync(c => c.Id == id);
        if (cat is null) return NotFound();

        if (req.NameEs is not null) cat.NameEs = req.NameEs;
        if (req.NameEn is not null) cat.NameEn = req.NameEn;
        if (req.Slug is not null) cat.Slug = req.Slug;
        if (req.ImageUrl is not null) cat.ImageUrl = req.ImageUrl;

        await db.SaveChangesAsync();

        return Ok(new CategoryDto
        {
            Id = cat.Id,
            Slug = cat.Slug,
            NameEs = cat.NameEs,
            NameEn = cat.NameEn,
            ImageUrl = cat.ImageUrl,
            ProductCount = await db.Products.CountAsync(p => p.CategoryId == cat.Id && p.IsActive),
            Attributes = cat.Attributes.Select(a => new CategoryAttributeDto
            {
                Id = a.Id,
                AttributeType = a.AttributeType,
                Value = a.Value
            }).ToList()
        });
    }

    // DELETE /api/v1/admin/categories/{id}
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var cat = await db.Categories.FirstOrDefaultAsync(c => c.Id == id);
        if (cat is null) return NotFound();

        var activeProductCount = await db.Products
            .CountAsync(p => p.CategoryId == id && p.IsActive);

        if (activeProductCount > 0)
        {
            return Conflict(new ProblemDetails
            {
                Type = "https://filamorfosis.com/errors/category-has-active-products",
                Title = "Category has active products",
                Status = 409,
                Detail = $"Cannot delete category: {activeProductCount} active product{(activeProductCount == 1 ? "" : "s")} are assigned to it."
            });
        }

        cat.IsActive = false;
        await db.SaveChangesAsync();

        return Ok(new { id = cat.Id, isActive = false });
    }

    // POST /api/v1/admin/categories/{id}/attributes
    [HttpPost("{id:guid}/attributes")]
    public async Task<IActionResult> AddAttribute(Guid id, [FromBody] CreateCategoryAttributeRequest req)
    {
        var cat = await db.Categories.FirstOrDefaultAsync(c => c.Id == id);
        if (cat is null) return NotFound();

        var attribute = new CategoryAttribute
        {
            Id = Guid.NewGuid(),
            CategoryId = id,
            AttributeType = req.AttributeType,
            Value = req.Value
        };

        db.CategoryAttributes.Add(attribute);
        await db.SaveChangesAsync();

        return StatusCode(201, new CategoryAttributeDto
        {
            Id = attribute.Id,
            AttributeType = attribute.AttributeType,
            Value = attribute.Value
        });
    }

    // DELETE /api/v1/admin/categories/{id}/attributes/{attributeId}
    [HttpDelete("{id:guid}/attributes/{attributeId:guid}")]
    public async Task<IActionResult> DeleteAttribute(Guid id, Guid attributeId)
    {
        var attribute = await db.CategoryAttributes
            .FirstOrDefaultAsync(a => a.Id == attributeId && a.CategoryId == id);

        if (attribute is null) return NotFound();

        db.CategoryAttributes.Remove(attribute);
        await db.SaveChangesAsync();

        return NoContent();
    }

    // GET /api/v1/admin/categories/{id}/cost-parameters
    [HttpGet("{id:guid}/cost-parameters")]
    public async Task<IActionResult> GetCostParameters(Guid id)
    {
        if (!await db.Categories.AnyAsync(c => c.Id == id)) return NotFound();

        var parameters = await db.CostParameters
            .Include(p => p.Category)
            .Where(p => p.CategoryId == id)
            .OrderBy(p => p.Label)
            .Select(p => new CostParameterDto
            {
                Id = p.Id, CategoryId = p.CategoryId, CategoryNameEs = p.Category.NameEs,
                Key = p.Key, Label = p.Label, Unit = p.Unit, Value = p.Value, UpdatedAt = p.UpdatedAt
            })
            .ToListAsync();

        return Ok(parameters);
    }

    // POST /api/v1/admin/categories/{id}/cost-parameters
    [HttpPost("{id:guid}/cost-parameters")]
    [Authorize(Roles = "Master,PriceManagement")]
    public async Task<IActionResult> AddCostParameter(Guid id, [FromBody] CreateCostParameterRequest req)
    {
        var cat = await db.Categories.FirstOrDefaultAsync(c => c.Id == id);
        if (cat is null) return NotFound();

        if (string.IsNullOrWhiteSpace(req.Label))
            return BadRequest(new { detail = "El nombre del parámetro es requerido." });

        var key = req.Label.ToLower()
            .Replace(" ", "_").Replace("(", "").Replace(")", "")
            .Replace("/", "_per_").Replace("²", "2").Trim('_');

        var existing = await db.CostParameters
            .FirstOrDefaultAsync(p => p.CategoryId == id && p.Key == key);
        if (existing is not null)
            return Conflict(new { detail = $"Ya existe un parámetro con la clave '{key}' en esta categoría." });

        var param = new CostParameter
        {
            Id = Guid.NewGuid(),
            CategoryId = id,
            Key = key,
            Label = req.Label,
            Unit = req.Unit ?? string.Empty,
            Value = req.Value,
            UpdatedAt = DateTime.UtcNow
        };
        db.CostParameters.Add(param);
        await db.SaveChangesAsync();

        return StatusCode(201, new CostParameterDto
        {
            Id = param.Id, CategoryId = param.CategoryId, CategoryNameEs = cat.NameEs,
            Key = param.Key, Label = param.Label, Unit = param.Unit, Value = param.Value, UpdatedAt = param.UpdatedAt
        });
    }

    // PUT /api/v1/admin/categories/{id}/cost-parameters/{parameterId}
    [HttpPut("{id:guid}/cost-parameters/{parameterId:guid}")]
    [Authorize(Roles = "Master,PriceManagement")]
    public async Task<IActionResult> UpdateCostParameter(Guid id, Guid parameterId, [FromBody] UpdateCostParameterRequest req)
    {
        var cat = await db.Categories.FirstOrDefaultAsync(c => c.Id == id);
        if (cat is null) return NotFound();

        var param = await db.CostParameters
            .FirstOrDefaultAsync(p => p.Id == parameterId && p.CategoryId == id);
        if (param is null) return NotFound();

        if (req.Value < 0)
            return BadRequest(new { detail = "El valor no puede ser negativo." });

        param.Value = req.Value;
        if (!string.IsNullOrWhiteSpace(req.Label)) param.Label = req.Label;
        if (req.Unit is not null) param.Unit = req.Unit;
        param.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        // Detach so AsNoTracking queries below see the new value
        db.Entry(param).State = EntityState.Detached;

        // Recompute BaseCost for every material that references this cost parameter
        var affectedMaterialIds = await db.MaterialSupplyUsages
            .Where(u => u.CostParameterId == parameterId)
            .Select(u => u.MaterialId)
            .Distinct()
            .ToListAsync();

        foreach (var materialId in affectedMaterialIds)
        {
            var usages = await db.MaterialSupplyUsages
                .AsNoTracking()
                .Include(u => u.CostParameter)
                .Where(u => u.MaterialId == materialId)
                .ToListAsync();

            var suppliesCost = pricing.ComputeMaterialBaseCost(
                usages.Select(u => (u.CostParameter.Value, u.Quantity)));

            var material = await db.Materials.FirstAsync(m => m.Id == materialId);
            material.BaseCost = material.ManualBaseCost + suppliesCost;
        }

        if (affectedMaterialIds.Count > 0)
            await db.SaveChangesAsync();

        return Ok(new CostParameterDto
        {
            Id = param.Id, CategoryId = param.CategoryId, CategoryNameEs = cat.NameEs,
            Key = param.Key, Label = param.Label, Unit = param.Unit, Value = param.Value, UpdatedAt = param.UpdatedAt
        });
    }

    // DELETE /api/v1/admin/categories/{id}/cost-parameters/{parameterId}
    [HttpDelete("{id:guid}/cost-parameters/{parameterId:guid}")]
    [Authorize(Roles = "Master,PriceManagement")]
    public async Task<IActionResult> DeleteCostParameter(Guid id, Guid parameterId)
    {
        var param = await db.CostParameters
            .FirstOrDefaultAsync(p => p.Id == parameterId && p.CategoryId == id);
        if (param is null) return NotFound();

        db.CostParameters.Remove(param);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
