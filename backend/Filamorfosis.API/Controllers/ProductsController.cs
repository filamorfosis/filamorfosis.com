using Filamorfosis.Application;
using Filamorfosis.Application.DTOs;
using Filamorfosis.Application.Services;
using Filamorfosis.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Filamorfosis.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class ProductsController(FilamorfosisDbContext db, IStockService stockService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] Guid? categoryId = null,
        [FromQuery] string? search = null,
        [FromQuery] string? badge = null)
    {
        var query = db.Products
            .Include(p => p.Variants)
                .ThenInclude(v => v.AttributeValues)
                    .ThenInclude(av => av.AttributeDefinition)
            .Include(p => p.Variants)
                .ThenInclude(v => v.MaterialUsages)
                    .ThenInclude(u => u.Material)
            .Include(p => p.Variants)
                .ThenInclude(v => v.Discounts)
            .Where(p => p.IsActive);

        if (categoryId.HasValue)
            query = query.Where(p => p.CategoryId == categoryId.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower();
            query = query.Where(p =>
                p.TitleEs.ToLower().Contains(term) ||
                p.TitleEn.ToLower().Contains(term) ||
                p.DescriptionEs.ToLower().Contains(term) ||
                p.DescriptionEn.ToLower().Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(badge))
            query = query.Where(p => p.Badge == badge);

        var totalCount = await query.CountAsync();

        var products = await query
            .OrderBy(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var items = products.Select(p => new ProductSummaryDto
        {
            Id = p.Id,
            Slug = p.Slug,
            TitleEs = p.TitleEs,
            TitleEn = p.TitleEn,
            DescriptionEs = p.DescriptionEs,
            DescriptionEn = p.DescriptionEn,
            Tags = p.Tags,
            ImageUrls = p.ImageUrls,
            Badge = p.Badge,
            IsActive = p.IsActive,
            CategoryId = p.CategoryId,
            BasePrice = p.Variants.Where(v => v.IsAvailable).Any()
                ? p.Variants.Where(v => v.IsAvailable).Min(v => DiscountCalculator.ComputeEffectivePrice(v.Price, v.Discounts))
                : 0m,
            HasDiscount = p.Variants.Where(v => v.IsAvailable).Any(v =>
                DiscountCalculator.ComputeEffectivePrice(v.Price, v.Discounts) < v.Price),
            Variants = p.Variants.Select(v => new ProductVariantDto
            {
                Id = v.Id,
                Sku = v.Sku,
                LabelEs = v.LabelEs,
                Price = v.Price,
                EffectivePrice = DiscountCalculator.ComputeEffectivePrice(v.Price, v.Discounts),
                IsAvailable = v.IsAvailable,
                AcceptsDesignFile = v.AcceptsDesignFile,
                InStock = stockService.IsVariantInStock(v.MaterialUsages.Select(u => ((decimal)(u.Material?.StockQuantity ?? 0), u.Quantity))),
                Attributes = v.AttributeValues.Select(a => new VariantAttributeValueDto
                {
                    AttributeDefinitionId = a.AttributeDefinitionId,
                    Name = a.AttributeDefinition.Name,
                    Value = a.Value
                }).ToList()
            }).ToList()
        }).ToList();

        return Ok(new PagedResult<ProductSummaryDto>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var product = await db.Products
            .Include(p => p.Variants)
                .ThenInclude(v => v.AttributeValues)
                    .ThenInclude(av => av.AttributeDefinition)
            .Include(p => p.Variants)
                .ThenInclude(v => v.MaterialUsages)
                    .ThenInclude(u => u.Material)
            .Include(p => p.Variants)
                .ThenInclude(v => v.Discounts)
            .FirstOrDefaultAsync(p => p.Id == id && p.IsActive);

        if (product is null)
            return NotFound(new
            {
                type = "https://filamorfosis.com/errors/not-found",
                title = "Not Found",
                status = 404,
                detail = $"Product {id} not found."
            });

        return Ok(new ProductDetailDto
        {
            Id = product.Id,
            Slug = product.Slug,
            TitleEs = product.TitleEs,
            TitleEn = product.TitleEn,
            DescriptionEs = product.DescriptionEs,
            DescriptionEn = product.DescriptionEn,
            Tags = product.Tags,
            ImageUrls = product.ImageUrls,
            Badge = product.Badge,
            IsActive = product.IsActive,
            CategoryId = product.CategoryId,
            Variants = product.Variants.Select(v => new ProductVariantDto
            {
                Id = v.Id,
                Sku = v.Sku,
                LabelEs = v.LabelEs,
                Price = v.Price,
                EffectivePrice = DiscountCalculator.ComputeEffectivePrice(v.Price, v.Discounts),
                IsAvailable = v.IsAvailable,
                AcceptsDesignFile = v.AcceptsDesignFile,
                InStock = stockService.IsVariantInStock(v.MaterialUsages.Select(u => ((decimal)(u.Material?.StockQuantity ?? 0), u.Quantity))),
                Discounts = v.Discounts.Select(d => new DiscountDto
                {
                    Id = d.Id,
                    DiscountType = d.DiscountType,
                    Value = d.Value,
                    StartsAt = d.StartsAt,
                    EndsAt = d.EndsAt
                }).ToList(),
                Attributes = v.AttributeValues.Select(a => new VariantAttributeValueDto
                {
                    AttributeDefinitionId = a.AttributeDefinitionId,
                    Name = a.AttributeDefinition.Name,
                    Value = a.Value
                }).ToList()
            }).ToList()
        });
    }
}
