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
[Route("api/v1/admin/materials")]
[Authorize(Roles = "Master,PriceManagement")]
[RequireMfa]
public class AdminMaterialsController(
    FilamorfosisDbContext db,
    IPricingCalculatorService pricing) : ControllerBase
{
    // ── GET /api/v1/admin/materials?processId= ──────────────────────────────
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Guid? processId)
    {
        var query = db.Materials
            .Include(m => m.Process)
            .Include(m => m.SupplyUsages).ThenInclude(u => u.CostParameter)
            .AsQueryable();

        if (processId.HasValue)
            query = query.Where(m => m.ProcessId == processId.Value);

        var materials = await query
            .OrderBy(m => m.Name)
            .ToListAsync();

        return Ok(materials.Select(MapToDto).ToList());
    }

    // ── GET /api/v1/admin/materials/{id} ─────────────────────────────────────
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var material = await db.Materials
            .Include(m => m.Process)
            .Include(m => m.SupplyUsages).ThenInclude(u => u.CostParameter)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (material is null)
            return NotFound(new ProblemDetails
            {
                Type = "https://filamorfosis.com/errors/not-found",
                Title = "Not found",
                Status = 404,
                Detail = "Material no encontrado."
            });

        return Ok(MapToDto(material));
    }

    // ── POST /api/v1/admin/materials ─────────────────────────────────────────
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateMaterialRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Name))
            return BadRequest(new ProblemDetails
            {
                Type = "https://filamorfosis.com/errors/validation",
                Title = "Validation error",
                Status = 400,
                Detail = "El nombre del material es requerido."
            });

        if (req.StockQuantity < 0)
            return BadRequest(new ProblemDetails
            {
                Type = "https://filamorfosis.com/errors/validation",
                Title = "Validation error",
                Status = 400,
                Detail = "El stock no puede ser negativo."
            });

        var process = await db.Processes.FirstOrDefaultAsync(c => c.Id == req.ProcessId);
        if (process is null)
            return BadRequest(new ProblemDetails
            {
                Type = "https://filamorfosis.com/errors/validation",
                Title = "Validation error",
                Status = 400,
                Detail = "Proceso no encontrado."
            });

        // Validate supply usages
        var validationError = await ValidateSupplyUsages(req.SupplyUsages ?? new());
        if (validationError is not null) return validationError;

        if (req.BaseCost < 0)
            return BadRequest(new ProblemDetails
            {
                Type = "https://filamorfosis.com/errors/validation",
                Title = "Validation error",
                Status = 400,
                Detail = "El costo base no puede ser negativo."
            });

        var material = new Material
        {
            Id = Guid.NewGuid(),
            Name = req.Name,
            ProcessId = req.ProcessId,
            Process = process,
            SizeLabel = req.SizeLabel,
            WidthCm = req.WidthCm,
            HeightCm = req.HeightCm,
            DepthCm = req.DepthCm,
            WeightGrams = req.WeightGrams,
            StockQuantity = req.StockQuantity,
            ManualBaseCost = req.BaseCost,
            CreatedAt = DateTime.UtcNow
        };

        db.Materials.Add(material);

        // Persist supply usages and compute total BaseCost = manual + supplies
        var supplyUsages = req.SupplyUsages ?? new();
        var costParams = await LoadCostParameters(supplyUsages.Keys);
        var usageEntities = BuildUsageEntities(material.Id, supplyUsages, costParams);
        db.MaterialSupplyUsages.AddRange(usageEntities);

        var suppliesCost = pricing.ComputeMaterialBaseCost(
            costParams.Select(cp => (cp.Value, supplyUsages[cp.Id.ToString()])));
        material.BaseCost = req.BaseCost + suppliesCost;

        await db.SaveChangesAsync();

        // Reload with navigations for response
        await db.Entry(material).Collection(m => m.SupplyUsages).Query()
            .Include(u => u.CostParameter).LoadAsync();

        return StatusCode(201, MapToDto(material));
    }

    // ── PUT /api/v1/admin/materials/{id} ─────────────────────────────────────
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateMaterialRequest req)
    {
        var material = await db.Materials
            .Include(m => m.Process)
            .Include(m => m.SupplyUsages).ThenInclude(u => u.CostParameter)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (material is null)
            return NotFound(new ProblemDetails
            {
                Type = "https://filamorfosis.com/errors/not-found",
                Title = "Not found",
                Status = 404,
                Detail = "Material no encontrado."
            });

        if (req.Name is not null)
        {
            if (string.IsNullOrWhiteSpace(req.Name))
                return BadRequest(new ProblemDetails
                {
                    Type = "https://filamorfosis.com/errors/validation",
                    Title = "Validation error",
                    Status = 400,
                    Detail = "El nombre del material es requerido."
                });
            material.Name = req.Name;
        }

        if (req.ProcessId.HasValue)
        {
            var process = await db.Processes.FirstOrDefaultAsync(c => c.Id == req.ProcessId.Value);
            if (process is null)
                return BadRequest(new ProblemDetails
                {
                    Type = "https://filamorfosis.com/errors/validation",
                    Title = "Validation error",
                    Status = 400,
                    Detail = "Proceso no encontrado."
                });
            material.ProcessId = req.ProcessId.Value;
            material.Process = process;
        }

        if (req.SizeLabel is not null) material.SizeLabel = req.SizeLabel;
        if (req.WidthCm is not null) material.WidthCm = req.WidthCm;
        if (req.HeightCm is not null) material.HeightCm = req.HeightCm;
        if (req.DepthCm is not null) material.DepthCm = req.DepthCm;
        if (req.WeightGrams is not null) material.WeightGrams = req.WeightGrams;

        if (req.StockQuantity is not null)
        {
            if (req.StockQuantity < 0)
                return BadRequest(new ProblemDetails
                {
                    Type = "https://filamorfosis.com/errors/validation",
                    Title = "Validation error",
                    Status = 400,
                    Detail = "El stock no puede ser negativo."
                });
            material.StockQuantity = req.StockQuantity.Value;
        }

        if (req.BaseCost is not null)
        {
            if (req.BaseCost < 0)
                return BadRequest(new ProblemDetails
                {
                    Type = "https://filamorfosis.com/errors/validation",
                    Title = "Validation error",
                    Status = 400,
                    Detail = "El costo base no puede ser negativo."
                });
        }

        if (req.SupplyUsages is not null)
        {
            var validationError = await ValidateSupplyUsages(req.SupplyUsages);
            if (validationError is not null) return validationError;

            // Replace-all: delete existing, insert new
            db.MaterialSupplyUsages.RemoveRange(material.SupplyUsages);

            var costParams = await LoadCostParameters(req.SupplyUsages.Keys);
            var usageEntities = BuildUsageEntities(material.Id, req.SupplyUsages, costParams);
            db.MaterialSupplyUsages.AddRange(usageEntities);

            var suppliesCost = pricing.ComputeMaterialBaseCost(
                costParams.Select(cp => (cp.Value, req.SupplyUsages[cp.Id.ToString()])));
            // Use new manual base if provided, otherwise keep existing minus old supplies
            var manualBase = req.BaseCost ?? 0m;
            material.ManualBaseCost = manualBase;
            material.BaseCost = manualBase + suppliesCost;

            // Update in-memory collection for response mapping
            material.SupplyUsages = usageEntities;
            foreach (var u in material.SupplyUsages)
                u.CostParameter = costParams.First(cp => cp.Id == u.CostParameterId);
        }
        else if (req.BaseCost is not null)
        {
            // Only manual base changed — recompute total keeping existing supplies cost
            var existingSuppliesCost = pricing.ComputeMaterialBaseCost(
                material.SupplyUsages.Select(u => (u.CostParameter.Value, u.Quantity)));
            material.ManualBaseCost = req.BaseCost.Value;
            material.BaseCost = req.BaseCost.Value + existingSuppliesCost;
        }

        await db.SaveChangesAsync();

        return Ok(MapToDto(material));
    }

    // ── DELETE /api/v1/admin/materials/{id} ──────────────────────────────────
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var material = await db.Materials
            .Include(m => m.SupplyUsages)
            .FirstOrDefaultAsync(m => m.Id == id);
        if (material is null)
            return NotFound(new ProblemDetails
            {
                Type = "https://filamorfosis.com/errors/not-found",
                Title = "Not found",
                Status = 404,
                Detail = "Material no encontrado."
            });

        var inUse = await db.VariantMaterialUsages.AnyAsync(u => u.MaterialId == id);
        if (inUse)
            return Conflict(new ProblemDetails
            {
                Type = "https://filamorfosis.com/errors/material-in-use",
                Title = "Conflict",
                Status = 409,
                Detail = "El material está en uso por una o más variantes y no puede eliminarse."
            });

        db.Materials.Remove(material);
        await db.SaveChangesAsync();

        return NoContent();
    }

    // ── POST /api/v1/admin/materials/{id}/recompute-variants ─────────────────
    [HttpPost("{id:guid}/recompute-variants")]
    public async Task<IActionResult> RecomputeVariants(Guid id)
    {
        var materialExists = await db.Materials.AnyAsync(m => m.Id == id);
        if (!materialExists)
            return NotFound(new ProblemDetails
            {
                Type = "https://filamorfosis.com/errors/not-found",
                Title = "Not found",
                Status = 404,
                Detail = "Material no encontrado."
            });

        // Load all variant IDs that reference this material
        var affectedVariantIds = await db.VariantMaterialUsages
            .Where(u => u.MaterialId == id)
            .Select(u => u.VariantId)
            .Distinct()
            .ToListAsync();

        if (affectedVariantIds.Count == 0)
            return Ok(new { recomputedCount = 0 });

        // Load electric_cost_per_hour once
        var electricParam = await db.GlobalParameters.AsNoTracking()
            .FirstOrDefaultAsync(p => p.Key == "electric_cost_per_hour");
        var electricCostPerHour = electricParam is not null
            && decimal.TryParse(electricParam.Value, out var ep) ? ep : 0m;

        var recomputedCount = 0;

        foreach (var variantId in affectedVariantIds)
        {
            var variant = await db.ProductVariants
                .Include(v => v.MaterialUsages).ThenInclude(u => u.Material)
                .FirstOrDefaultAsync(v => v.Id == variantId);

            if (variant is null) continue;

            var materialUsages = variant.MaterialUsages
                .Select(u => (u.Material.BaseCost, u.Quantity));

            var newBaseCost = pricing.ComputeVariantBaseCost(
                materialUsages,
                variant.ManufactureTimeMinutes,
                electricCostPerHour);

            variant.BaseCost = newBaseCost;
            variant.Price = await pricing.ComputePriceAsync(newBaseCost, variant.Profit);

            recomputedCount++;
        }

        await db.SaveChangesAsync();

        return Ok(new { recomputedCount });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static MaterialDto MapToDto(Material m) => new()
    {
        Id = m.Id,
        Name = m.Name,
        ProcessId = m.ProcessId,
        ProcessNameEs = m.Process.NameEs,
        SizeLabel = m.SizeLabel,
        WidthCm = m.WidthCm,
        HeightCm = m.HeightCm,
        DepthCm = m.DepthCm,
        WeightGrams = m.WeightGrams,
        BaseCost = m.BaseCost,
        ManualBaseCost = m.ManualBaseCost,
        StockQuantity = m.StockQuantity,
        SupplyUsages = m.SupplyUsages.Select(u => new MaterialSupplyUsageDto
        {
            CostParameterId = u.CostParameterId,
            Label = u.CostParameter.Label,
            Unit = u.CostParameter.Unit,
            UnitCost = u.CostParameter.Value,
            Quantity = u.Quantity
        }).ToList(),
        CreatedAt = m.CreatedAt
    };

    private async Task<IActionResult?> ValidateSupplyUsages(Dictionary<string, decimal> usages)
    {
        foreach (var (key, quantity) in usages)
        {
            if (quantity <= 0)
                return BadRequest(new ProblemDetails
                {
                    Type = "https://filamorfosis.com/errors/validation",
                    Title = "Validation error",
                    Status = 400,
                    Detail = "La cantidad debe ser mayor a 0."
                });

            if (!Guid.TryParse(key, out var cpId))
                return BadRequest(new ProblemDetails
                {
                    Type = "https://filamorfosis.com/errors/validation",
                    Title = "Validation error",
                    Status = 400,
                    Detail = $"Parámetro de costo no encontrado: {key}"
                });

            var exists = await db.CostParameters.AnyAsync(cp => cp.Id == cpId);
            if (!exists)
                return BadRequest(new ProblemDetails
                {
                    Type = "https://filamorfosis.com/errors/validation",
                    Title = "Validation error",
                    Status = 400,
                    Detail = $"Parámetro de costo no encontrado: {key}"
                });
        }

        return null;
    }

    private async Task<List<CostParameter>> LoadCostParameters(IEnumerable<string> keys)
    {
        var ids = keys.Select(Guid.Parse).ToList();
        return await db.CostParameters
            .Where(cp => ids.Contains(cp.Id))
            .ToListAsync();
    }

    private static List<MaterialSupplyUsage> BuildUsageEntities(
        Guid materialId,
        Dictionary<string, decimal> usages,
        List<CostParameter> costParams)
    {
        return usages.Select(kv => new MaterialSupplyUsage
        {
            Id = Guid.NewGuid(),
            MaterialId = materialId,
            CostParameterId = Guid.Parse(kv.Key),
            Quantity = kv.Value
        }).ToList();
    }
}
