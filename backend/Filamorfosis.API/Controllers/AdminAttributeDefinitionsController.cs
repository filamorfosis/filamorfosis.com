using Filamorfosis.Application.DTOs;
using Filamorfosis.Domain.Entities;
using Filamorfosis.Infrastructure.Data;
using Filamorfosis.API.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Filamorfosis.API.Controllers;

[ApiController]
[Authorize(Roles = "Master,ProductManagement")]
[RequireMfa]
public class AdminAttributeDefinitionsController(FilamorfosisDbContext db) : ControllerBase
{
    // GET /api/v1/admin/attribute-definitions
    [HttpGet("api/v1/admin/attribute-definitions")]
    public async Task<IActionResult> GetAll()
    {
        var defs = await db.AttributeDefinitions
            .OrderBy(a => a.Name)
            .Select(a => new AttributeDefinitionDto
            {
                Id = a.Id,
                Name = a.Name,
                CreatedAt = a.CreatedAt
            })
            .ToListAsync();
        return Ok(defs);
    }

    // POST /api/v1/admin/attribute-definitions
    [HttpPost("api/v1/admin/attribute-definitions")]
    public async Task<IActionResult> Create([FromBody] CreateAttributeDefinitionRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Name))
            return BadRequest(new ProblemDetails { Title = "Name is required." });

        var def = new AttributeDefinition
        {
            Id = Guid.NewGuid(),
            Name = req.Name.Trim(),
            CreatedAt = DateTime.UtcNow
        };
        db.AttributeDefinitions.Add(def);
        await db.SaveChangesAsync();

        return StatusCode(201, new AttributeDefinitionDto
        {
            Id = def.Id,
            Name = def.Name,
            CreatedAt = def.CreatedAt
        });
    }

    // POST /api/v1/admin/products/{id}/attributes
    [HttpPost("api/v1/admin/products/{id:guid}/attributes")]
    public async Task<IActionResult> AddProductAttribute(Guid id, [FromBody] AddProductAttributeRequest req)
    {
        var product = await db.Products.FirstOrDefaultAsync(p => p.Id == id);
        if (product is null) return NotFound();

        var attrDef = await db.AttributeDefinitions.FirstOrDefaultAsync(a => a.Id == req.AttributeDefinitionId);
        if (attrDef is null) return NotFound(new ProblemDetails { Title = "AttributeDefinition not found." });

        var exists = await db.ProductAttributeDefinitions
            .AnyAsync(pa => pa.ProductId == id && pa.AttributeDefinitionId == req.AttributeDefinitionId);
        if (exists)
            return Conflict(new ProblemDetails
            {
                Status = 409,
                Title = "Conflict",
                Detail = "This attribute is already declared on the product."
            });

        db.ProductAttributeDefinitions.Add(new ProductAttributeDefinition
        {
            ProductId = id,
            AttributeDefinitionId = req.AttributeDefinitionId
        });
        await db.SaveChangesAsync();
        return StatusCode(201, new { productId = id, attributeDefinitionId = req.AttributeDefinitionId });
    }

    // DELETE /api/v1/admin/products/{id}/attributes/{attributeDefinitionId}
    [HttpDelete("api/v1/admin/products/{id:guid}/attributes/{attributeDefinitionId:guid}")]
    public async Task<IActionResult> RemoveProductAttribute(Guid id, Guid attributeDefinitionId)
    {
        var pa = await db.ProductAttributeDefinitions
            .FirstOrDefaultAsync(pa => pa.ProductId == id && pa.AttributeDefinitionId == attributeDefinitionId);
        if (pa is null) return NotFound();

        db.ProductAttributeDefinitions.Remove(pa);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
