using Filamorfosis.Application.DTOs;
using Filamorfosis.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Filamorfosis.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class CategoriesController(FilamorfosisDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var categories = await db.Categories
            .Select(c => new CategoryDto
            {
                Id = c.Id,
                Slug = c.Slug,
                NameEs = c.NameEs,
                NameEn = c.NameEn,
                ImageUrl = c.ImageUrl,
                ProductCount = c.Products.Count(p => p.IsActive)
            })
            .ToListAsync();

        return Ok(categories);
    }
}
