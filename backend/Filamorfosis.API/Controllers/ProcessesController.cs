using Filamorfosis.Application.DTOs;
using Filamorfosis.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Filamorfosis.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class ProcessesController(FilamorfosisDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var processes = await db.Processes
            .Where(c => c.IsActive)
            .Select(c => new ProcessDto
            {
                Id = c.Id,
                Slug = c.Slug,
                NameEs = c.NameEs,
                ImageUrl = c.ImageUrl,
                IsActive = c.IsActive,
                ProductCount = c.Products.Count(p => p.IsActive)
            })
            .ToListAsync();

        return Ok(processes);
    }
}
