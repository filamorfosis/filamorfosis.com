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
    // Returns all parameters grouped by ProcessId
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var parameters = await db.CostParameters
            .Include(p => p.Process)
            .OrderBy(p => p.Process.NameEs)
            .ThenBy(p => p.Key)
            .Select(p => new CostParameterDto
            {
                Id = p.Id,
                ProcessId = p.ProcessId,
                ProcessNameEs = p.Process.NameEs,
                Key = p.Key,
                Label = p.Label,
                Unit = p.Unit,
                Value = p.Value,
                UpdatedAt = p.UpdatedAt
            })
            .ToListAsync();

        var grouped = parameters
            .GroupBy(p => p.ProcessId.ToString())
            .ToDictionary(g => g.Key, g => g.ToList());

        return Ok(grouped);
    }

    // PUT /api/v1/admin/cost-parameters/{processId}/{key}
    [HttpPut("{processId:guid}/{key}")]
    public async Task<IActionResult> Upsert(Guid processId, string key, [FromBody] UpsertCostParameterRequest req)
    {
        if (req.Value < 0)
            return BadRequest(new ProblemDetails
            {
                Type = "https://filamorfosis.com/errors/validation",
                Title = "Validation error",
                Status = 400,
                Detail = "El valor del parámetro no puede ser negativo."
            });

        var process = await db.Processes.FirstOrDefaultAsync(c => c.Id == processId);
        if (process is null)
            return NotFound(new ProblemDetails { Status = 404, Detail = "Proceso no encontrado." });

        var parameter = await db.CostParameters
            .FirstOrDefaultAsync(p => p.ProcessId == processId && p.Key == key);

        if (parameter is null)
        {
            parameter = new CostParameter
            {
                Id = Guid.NewGuid(),
                ProcessId = processId,
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
            ProcessId = parameter.ProcessId,
            ProcessNameEs = process.NameEs,
            Key = parameter.Key,
            Label = parameter.Label,
            Unit = parameter.Unit,
            Value = parameter.Value,
            UpdatedAt = parameter.UpdatedAt
        });
    }

}
