using Filamorfosis.Application.DTOs;
using Filamorfosis.Infrastructure.Data;
using Filamorfosis.API.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Filamorfosis.API.Controllers;

[ApiController]
[Route("api/v1/admin/global-parameters")]
[Authorize(Roles = "Master,PriceManagement")]
[RequireMfa]
public class AdminGlobalParametersController(FilamorfosisDbContext db) : ControllerBase
{
    // GET /api/v1/admin/global-parameters
    // Returns all global parameters
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var parameters = await db.GlobalParameters
            .OrderBy(p => p.Key)
            .Select(p => new GlobalParameterDto
            {
                Id = p.Id,
                Key = p.Key,
                Label = p.Label,
                Value = p.Value,
                UpdatedAt = p.UpdatedAt
            })
            .ToListAsync();

        return Ok(parameters);
    }

    // PUT /api/v1/admin/global-parameters/{key}
    // Updates the matching GlobalParameter record
    [HttpPut("{key}")]
    public async Task<IActionResult> Update(string key, [FromBody] UpdateGlobalParameterRequest req)
    {
        var parameter = await db.GlobalParameters
            .FirstOrDefaultAsync(p => p.Key == key);

        if (parameter is null)
            return NotFound(new ProblemDetails
            {
                Type = "https://filamorfosis.com/errors/not-found",
                Title = "Not found",
                Status = 404,
                Detail = "Parámetro no encontrado."
            });

        // Validate tax_rate: must be a decimal in [0, 1]
        if (key == "tax_rate")
        {
            if (!decimal.TryParse(req.Value, System.Globalization.NumberStyles.Any,
                    System.Globalization.CultureInfo.InvariantCulture, out var taxRate)
                || taxRate < 0m || taxRate > 1m)
            {
                return BadRequest(new ProblemDetails
                {
                    Type = "https://filamorfosis.com/errors/validation",
                    Title = "Validation error",
                    Status = 400,
                    Detail = "El valor de IVA debe estar entre 0 y 1."
                });
            }
        }

        parameter.Value = req.Value;
        parameter.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();

        return Ok(new GlobalParameterDto
        {
            Id = parameter.Id,
            Key = parameter.Key,
            Label = parameter.Label,
            Value = parameter.Value,
            UpdatedAt = parameter.UpdatedAt
        });
    }
}
