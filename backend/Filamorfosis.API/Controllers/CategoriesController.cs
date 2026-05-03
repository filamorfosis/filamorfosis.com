using Filamorfosis.Application.DTOs;
using Filamorfosis.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Filamorfosis.API.Controllers;

/// <summary>
/// Public read-only categories endpoint — no authentication required.
/// Write operations are handled by AdminCategoriesController.
/// </summary>
[ApiController]
[Route("api/v1/categories")]
public class CategoriesController(FilamorfosisDbContext db) : ControllerBase
{
    /// <summary>
    /// GET /api/v1/categories
    /// Returns all active root categories with their subcategories.
    /// Public — no auth required.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var categories = await db.ProductCategories
            .Include(c => c.SubCategories)
            .OrderBy(c => c.Name)
            .ToListAsync();

        var result = categories.Select(c => new CategoryDto
        {
            Id = c.Id,
            Name = c.Name,
            Slug = c.Slug,
            Description = c.Description,
            Icon = c.Icon,
            SubCategories = c.SubCategories
                .Select(sc => new SubCategoryDto
                {
                    Id = sc.Id,
                    Name = sc.Name,
                    Slug = sc.Slug,
                    Description = sc.Description,
                    Icon = sc.Icon,
                    ParentCategoryId = sc.ParentCategoryId
                })
                .OrderBy(sc => sc.Name)
                .ToList()
        }).ToList();

        return Ok(result);
    }
}
