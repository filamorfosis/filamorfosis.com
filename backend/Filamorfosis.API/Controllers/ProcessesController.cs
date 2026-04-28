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
            .Select(c => new ProcessDto
            {
                Id = c.Id,
                Slug = c.Slug,
                NameEs = c.NameEs,
                NameEn = c.NameEn,
                ImageUrl = c.ImageUrl,
                ProductCount = c.Products.Count(p => p.IsActive)
            })
            .ToListAsync();

        return Ok(processes);
    }
}
