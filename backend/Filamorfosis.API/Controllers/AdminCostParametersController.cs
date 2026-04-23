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
[Route("api/v1/admin/cost-parameters")]
[Authorize(Roles = "Master,PriceManagement")]
[RequireMfa]
public class AdminCostParametersController(FilamorfosisDbContext db, IPricingCalculatorService pricing) : ControllerBase
{
    // GET /api/v1/admin/cost-parameters
    // Returns all parameters grouped by CategoryId
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var parameters = await db.CostParameters
            .Include(p => p.Category)
            .OrderBy(p => p.Category.NameEs)
            .ThenBy(p => p.Key)
            .Select(p => new CostParameterDto
            {
                Id = p.Id,
                CategoryId = p.CategoryId,
                CategoryNameEs = p.Category.NameEs,
                Key = p.Key,
                Label = p.Label,
                Unit = p.Unit,
                Value = p.Value,
                UpdatedAt = p.UpdatedAt
            })
            .ToListAsync();

        var grouped = parameters
            .GroupBy(p => p.CategoryId.ToString())
            .ToDictionary(g => g.Key, g => g.ToList());

        return Ok(grouped);
    }

    // PUT /api/v1/admin/cost-parameters/{categoryId}/{key}
    [HttpPut("{categoryId:guid}/{key}")]
    public async Task<IActionResult> Upsert(Guid categoryId, string key, [FromBody] UpsertCostParameterRequest req)
    {
        if (req.Value < 0)
            return BadRequest(new ProblemDetails
            {
                Type = "https://filamorfosis.com/errors/validation",
                Title = "Validation error",
                Status = 400,
                Detail = "El valor del parámetro no puede ser negativo."
            });

        var category = await db.Categories.FirstOrDefaultAsync(c => c.Id == categoryId);
        if (category is null)
            return NotFound(new ProblemDetails { Status = 404, Detail = "Categoría no encontrada." });

        var parameter = await db.CostParameters
            .FirstOrDefaultAsync(p => p.CategoryId == categoryId && p.Key == key);

        if (parameter is null)
        {
            parameter = new CostParameter
            {
                Id = Guid.NewGuid(),
                CategoryId = categoryId,
                Key = key,
                Label = req.Label,
                Unit = req.Unit,
                Value = req.Value,
                UpdatedAt = DateTime.UtcNow
            };
            db.CostParameters.Add(parameter);
        }
        else
        {
            parameter.Label = req.Label;
            parameter.Unit = req.Unit;
            parameter.Value = req.Value;
            parameter.UpdatedAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync();

        // Detach the updated parameter so AsNoTracking queries see the new value
        db.Entry(parameter).State = Microsoft.EntityFrameworkCore.EntityState.Detached;

        // Recompute BaseCost for all materials referencing this cost parameter
        var affectedMaterialIds = await db.MaterialSupplyUsages
            .Where(u => u.CostParameterId == parameter.Id)
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
            Id = parameter.Id,
            CategoryId = parameter.CategoryId,
            CategoryNameEs = category.NameEs,
            Key = parameter.Key,
            Label = parameter.Label,
            Unit = parameter.Unit,
            Value = parameter.Value,
            UpdatedAt = parameter.UpdatedAt
        });
    }

}
