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
[Route("api/v1/admin/processes")]
[Authorize(Roles = "Master,ProductManagement,PriceManagement")]
[RequireMfa]
public class AdminProcessesController(FilamorfosisDbContext db, IPricingCalculatorService pricing) : ControllerBase
{
    // GET /api/v1/admin/processes
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var processes = await db.Processes
            .Include(c => c.Attributes)
            .Where(c => c.IsActive)
            .ToListAsync();

        var processIds = processes.Select(c => c.Id).ToList();

        // Load cost parameters for all processes by ID
        var costParams = await db.CostParameters
            .Include(p => p.Process)
            .Where(p => processIds.Contains(p.ProcessId))
            .OrderBy(p => p.Label)
            .ToListAsync();

        var costParamsByProcess = costParams
            .GroupBy(p => p.ProcessId)
            .ToDictionary(g => g.Key, g => g.Select(p => new CostParameterDto
            {
                Id = p.Id,
                ProcessId = p.ProcessId,
                ProcessNameEs = p.Process.NameEs,
                Key = p.Key,
                Label = p.Label,
                Unit = p.Unit,
                Value = p.Value,
                UpdatedAt = p.UpdatedAt
            }).ToList());

        return Ok(processes.Select(c => new ProcessDto
        {
            Id = c.Id,
            Slug = c.Slug,
            NameEs = c.NameEs,
            NameEn = c.NameEn,
            ImageUrl = c.ImageUrl,
            ProductCount = db.Products.Count(p => p.ProcessId == c.Id && p.IsActive),
            Attributes = c.Attributes.Select(a => new ProcessAttributeDto
            {
                Id = a.Id,
                AttributeType = a.AttributeType,
                Value = a.Value
            }).ToList(),
            CostParameters = costParamsByProcess.TryGetValue(c.Id, out var cp) ? cp : new()
        }));
    }

    // POST /api/v1/admin/processes
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateProcessRequest req)
    {
        var process = new Process
        {
            Id = Guid.NewGuid(),
            Slug = req.Slug,
            NameEs = req.NameEs,
            NameEn = req.NameEn,
            ImageUrl = req.ImageUrl
        };
        db.Processes.Add(process);
        await db.SaveChangesAsync();

        return StatusCode(201, new ProcessDto
        {
            Id = process.Id,
            Slug = process.Slug,
            NameEs = process.NameEs,
            NameEn = process.NameEn,
            ImageUrl = process.ImageUrl,
            ProductCount = 0,
            Attributes = new List<ProcessAttributeDto>()
        });
    }

    // PUT /api/v1/admin/processes/{id}
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProcessRequest req)
    {
        var process = await db.Processes
            .Include(c => c.Attributes)
            .FirstOrDefaultAsync(c => c.Id == id);
        if (process is null) return NotFound();

        if (req.NameEs is not null) process.NameEs = req.NameEs;
        if (req.NameEn is not null) process.NameEn = req.NameEn;
        if (req.Slug is not null) process.Slug = req.Slug;
        if (req.ImageUrl is not null) process.ImageUrl = req.ImageUrl;

        await db.SaveChangesAsync();

        return Ok(new ProcessDto
        {
            Id = process.Id,
            Slug = process.Slug,
            NameEs = process.NameEs,
            NameEn = process.NameEn,
            ImageUrl = process.ImageUrl,
            ProductCount = await db.Products.CountAsync(p => p.ProcessId == process.Id && p.IsActive),
            Attributes = process.Attributes.Select(a => new ProcessAttributeDto
            {
                Id = a.Id,
                AttributeType = a.AttributeType,
                Value = a.Value
            }).ToList()
        });
    }

    // DELETE /api/v1/admin/processes/{id}
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var process = await db.Processes.FirstOrDefaultAsync(c => c.Id == id);
        if (process is null) return NotFound();

        var activeProductCount = await db.Products
            .CountAsync(p => p.ProcessId == id && p.IsActive);

        if (activeProductCount > 0)
        {
            return Conflict(new ProblemDetails
            {
                Type = "https://filamorfosis.com/errors/process-has-active-products",
                Title = "Process has active products",
                Status = 409,
                Detail = $"Cannot delete process: {activeProductCount} active product{(activeProductCount == 1 ? "" : "s")} are assigned to it."
            });
        }

        process.IsActive = false;
        await db.SaveChangesAsync();

        return Ok(new { id = process.Id, isActive = false });
    }

    // POST /api/v1/admin/processes/{id}/attributes
    [HttpPost("{id:guid}/attributes")]
    public async Task<IActionResult> AddAttribute(Guid id, [FromBody] CreateProcessAttributeRequest req)
    {
        var process = await db.Processes.FirstOrDefaultAsync(c => c.Id == id);
        if (process is null) return NotFound();

        var attribute = new ProcessAttribute
        {
            Id = Guid.NewGuid(),
            ProcessId = id,
            AttributeType = req.AttributeType,
            Value = req.Value
        };

        db.ProcessesAttributes.Add(attribute);
        await db.SaveChangesAsync();

        return StatusCode(201, new ProcessAttributeDto
        {
            Id = attribute.Id,
            AttributeType = attribute.AttributeType,
            Value = attribute.Value
        });
    }

    // DELETE /api/v1/admin/processes/{id}/attributes/{attributeId}
    [HttpDelete("{id:guid}/attributes/{attributeId:guid}")]
    public async Task<IActionResult> DeleteAttribute(Guid id, Guid attributeId)
    {
        var attribute = await db.ProcessesAttributes
            .FirstOrDefaultAsync(a => a.Id == attributeId && a.ProcessId == id);

        if (attribute is null) return NotFound();

        db.ProcessesAttributes.Remove(attribute);
        await db.SaveChangesAsync();

        return NoContent();
    }

    // GET /api/v1/admin/processes/{id}/cost-parameters
    [HttpGet("{id:guid}/cost-parameters")]
    public async Task<IActionResult> GetCostParameters(Guid id)
    {
        if (!await db.Processes.AnyAsync(c => c.Id == id)) return NotFound();

        var parameters = await db.CostParameters
            .Include(p => p.Process)
            .Where(p => p.ProcessId == id)
            .OrderBy(p => p.Label)
            .Select(p => new CostParameterDto
            {
                Id = p.Id, ProcessId = p.ProcessId, ProcessNameEs = p.Process.NameEs,
                Key = p.Key, Label = p.Label, Unit = p.Unit, Value = p.Value, UpdatedAt = p.UpdatedAt
            })
            .ToListAsync();

        return Ok(parameters);
    }

    // POST /api/v1/admin/processes/{id}/cost-parameters
    [HttpPost("{id:guid}/cost-parameters")]
    [Authorize(Roles = "Master,PriceManagement")]
    public async Task<IActionResult> AddCostParameter(Guid id, [FromBody] CreateCostParameterRequest req)
    {
        var process = await db.Processes.FirstOrDefaultAsync(c => c.Id == id);
        if (process is null) return NotFound();

        if (string.IsNullOrWhiteSpace(req.Label))
            return BadRequest(new { detail = "El nombre del parámetro es requerido." });

        var key = req.Label.ToLower()
            .Replace(" ", "_").Replace("(", "").Replace(")", "")
            .Replace("/", "_per_").Replace("²", "2").Trim('_');

        var existing = await db.CostParameters
            .FirstOrDefaultAsync(p => p.ProcessId == id && p.Key == key);
        if (existing is not null)
            return Conflict(new { detail = $"Ya existe un parámetro con la clave '{key}' en este proceso." });

        var param = new CostParameter
        {
            Id = Guid.NewGuid(),
            ProcessId = id,
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
            Id = param.Id, ProcessId = param.ProcessId, ProcessNameEs = process.NameEs,
            Key = param.Key, Label = param.Label, Unit = param.Unit, Value = param.Value, UpdatedAt = param.UpdatedAt
        });
    }

    // PUT /api/v1/admin/processes/{id}/cost-parameters/{parameterId}
    [HttpPut("{id:guid}/cost-parameters/{parameterId:guid}")]
    [Authorize(Roles = "Master,PriceManagement")]
    public async Task<IActionResult> UpdateCostParameter(Guid id, Guid parameterId, [FromBody] UpdateCostParameterRequest req)
    {
        var process = await db.Processes.FirstOrDefaultAsync(c => c.Id == id);
        if (process is null) return NotFound();

        var param = await db.CostParameters
            .FirstOrDefaultAsync(p => p.Id == parameterId && p.ProcessId == id);
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
            Id = param.Id, ProcessId = param.ProcessId, ProcessNameEs = process.NameEs,
            Key = param.Key, Label = param.Label, Unit = param.Unit, Value = param.Value, UpdatedAt = param.UpdatedAt
        });
    }

    // DELETE /api/v1/admin/processes/{id}/cost-parameters/{parameterId}
    [HttpDelete("{id:guid}/cost-parameters/{parameterId:guid}")]
    [Authorize(Roles = "Master,PriceManagement")]
    public async Task<IActionResult> DeleteCostParameter(Guid id, Guid parameterId)
    {
        var param = await db.CostParameters
            .FirstOrDefaultAsync(p => p.Id == parameterId && p.ProcessId == id);
        if (param is null) return NotFound();

        db.CostParameters.Remove(param);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
