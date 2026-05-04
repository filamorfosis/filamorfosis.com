using Filamorfosis.Application;
using Filamorfosis.Application.DTOs;
using Filamorfosis.Application.Services;
using Filamorfosis.Domain.Entities;
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
        [FromQuery] Guid? processId = null,
        [FromQuery] string? search = null,
        [FromQuery] string? badge = null,
        [FromQuery] string? useCase = null,
        [FromQuery] string? categorySlug = null,
        [FromQuery] string? subCategorySlug = null)
    {
        var query = db.Products
            .Include(p => p.Discounts)
            .Include(p => p.Variants)
                .ThenInclude(v => v.AttributeValues)
                    .ThenInclude(av => av.AttributeDefinition)
            .Include(p => p.Variants)
                .ThenInclude(v => v.MaterialUsages)
                    .ThenInclude(u => u.Material)
            .Include(p => p.Variants)
                .ThenInclude(v => v.Discounts)
            .Include(p => p.CategoryAssignments)
                .ThenInclude(ca => ca.Category)
            .Include(p => p.CategoryAssignments)
                .ThenInclude(ca => ca.SubCategory)
            .Where(p => p.IsActive);

        if (processId.HasValue)
            query = query.Where(p => p.ProcessId == processId.Value);

        // Filter by category slug — matches either parent category OR subcategory slug (OR, not AND)
        if (!string.IsNullOrWhiteSpace(categorySlug))
        {
            query = query.Where(p =>
                p.CategoryAssignments.Any(ca =>
                    ca.Category.Slug == categorySlug ||
                    (ca.SubCategory != null && ca.SubCategory.Slug == categorySlug)));
        }

        // Explicit subcategory-only filter (optional, kept for future use)
        if (!string.IsNullOrWhiteSpace(subCategorySlug))
        {
            query = query.Where(p =>
                p.CategoryAssignments.Any(ca =>
                    ca.SubCategory != null && ca.SubCategory.Slug == subCategorySlug));
        }

        // For SQLite: UseCases is stored as JSON TEXT, so we need to use string operations
        // We'll filter in-memory after fetching the data
        var useCaseFilter = useCase;

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower();
            query = query.Where(p =>
                p.TitleEs.ToLower().Contains(term) ||
                p.DescriptionEs.ToLower().Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(badge))
            query = query.Where(p => p.Badge == badge);

        // Apply use-case filter in-memory (SQLite limitation)
        if (!string.IsNullOrWhiteSpace(useCaseFilter))
        {
            var allProducts = await query.ToListAsync();
            var filteredProducts = allProducts.Where(p => p.UseCases != null && p.UseCases.Contains(useCaseFilter));
            var totalCount = filteredProducts.Count();
            
            var products = filteredProducts
                .OrderBy(p => p.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            var items = products.Select(p => new ProductSummaryDto
            {
                Id = p.Id,
                Slug = p.Slug,
                TitleEs = p.TitleEs,
                DescriptionEs = p.DescriptionEs,
                Tags = p.Tags,
                ImageUrls = AggregateVariantImages(p.Variants),
                Badge = p.Badge,
                IsActive = p.IsActive,
                ProcessId = p.ProcessId,
                BasePrice = p.Variants.Where(v => v.IsAvailable).Any()
                    ? p.Variants.Where(v => v.IsAvailable).Min(v => DiscountCalculator.ComputeEffectivePrice(v.Price, v.Discounts.Concat(p.Discounts)))
                    : 0m,
                HasDiscount = p.Variants.Where(v => v.IsAvailable).Any(v =>
                    DiscountCalculator.ComputeEffectivePrice(v.Price, v.Discounts.Concat(p.Discounts)) < v.Price),
                Variants = p.Variants.Select(v => new ProductVariantDto
                {
                    Id = v.Id,
                    Sku = v.Sku,
                    LabelEs = v.LabelEs,
                    Price = v.Price,
                    EffectivePrice = DiscountCalculator.ComputeEffectivePrice(v.Price, v.Discounts.Concat(p.Discounts)),
                    IsAvailable = v.IsAvailable,
                    AcceptsDesignFile = v.AcceptsDesignFile,
                    InStock = stockService.IsVariantInStock(v.MaterialUsages.Select(u => ((decimal)(u.Material?.StockQuantity ?? 0), u.Quantity))),
                    ImageUrls = v.ImageUrls,
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
        else
        {
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
                DescriptionEs = p.DescriptionEs,
                Tags = p.Tags,
                ImageUrls = AggregateVariantImages(p.Variants),
                Badge = p.Badge,
                IsActive = p.IsActive,
                ProcessId = p.ProcessId,
                BasePrice = p.Variants.Where(v => v.IsAvailable).Any()
                    ? p.Variants.Where(v => v.IsAvailable).Min(v => DiscountCalculator.ComputeEffectivePrice(v.Price, v.Discounts.Concat(p.Discounts)))
                    : 0m,
                HasDiscount = p.Variants.Where(v => v.IsAvailable).Any(v =>
                    DiscountCalculator.ComputeEffectivePrice(v.Price, v.Discounts.Concat(p.Discounts)) < v.Price),
                Variants = p.Variants.Select(v => new ProductVariantDto
                {
                    Id = v.Id,
                    Sku = v.Sku,
                    LabelEs = v.LabelEs,
                    Price = v.Price,
                    EffectivePrice = DiscountCalculator.ComputeEffectivePrice(v.Price, v.Discounts.Concat(p.Discounts)),
                    IsAvailable = v.IsAvailable,
                    AcceptsDesignFile = v.AcceptsDesignFile,
                    InStock = stockService.IsVariantInStock(v.MaterialUsages.Select(u => ((decimal)(u.Material?.StockQuantity ?? 0), u.Quantity))),
                    ImageUrls = v.ImageUrls,
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
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var product = await db.Products
            .Include(p => p.Discounts)
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

        return Ok(MapProductDetail(product));
    }

    [HttpGet("by-slug/{slug}")]
    public async Task<IActionResult> GetBySlug(string slug)
    {
        var product = await db.Products
            .Include(p => p.Discounts)
            .Include(p => p.Variants)
                .ThenInclude(v => v.AttributeValues)
                    .ThenInclude(av => av.AttributeDefinition)
            .Include(p => p.Variants)
                .ThenInclude(v => v.MaterialUsages)
                    .ThenInclude(u => u.Material)
            .Include(p => p.Variants)
                .ThenInclude(v => v.Discounts)
            .FirstOrDefaultAsync(p => p.Slug == slug && p.IsActive);

        if (product is null)
            return NotFound(new
            {
                type = "https://filamorfosis.com/errors/not-found",
                title = "Not Found",
                status = 404,
                detail = $"Product with slug '{slug}' not found."
            });

        return Ok(MapProductDetail(product));
    }

    private ProductDetailDto MapProductDetail(Product product) => new ProductDetailDto
    {
        Id = product.Id,
        Slug = product.Slug,
        TitleEs = product.TitleEs,
        DescriptionEs = product.DescriptionEs,
        Tags = product.Tags,
        ImageUrls = AggregateVariantImages(product.Variants),
        Badge = product.Badge,
        IsActive = product.IsActive,
        ProcessId = product.ProcessId,
        Variants = product.Variants.Select(v => new ProductVariantDto
        {
            Id = v.Id,
            Sku = v.Sku,
            LabelEs = v.LabelEs,
            Price = v.Price,
            EffectivePrice = DiscountCalculator.ComputeEffectivePrice(v.Price, v.Discounts.Concat(product.Discounts)),
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
    };

    /// <summary>
    /// Aggregates all ImageUrls from a product's variants into a single deduplicated array,
    /// preserving insertion order. This replaces the removed Product.ImageUrls column.
    /// </summary>
    private static string[] AggregateVariantImages(IEnumerable<ProductVariant> variants)
    {
        var seen = new HashSet<string>(StringComparer.Ordinal);
        var result = new List<string>();
        foreach (var v in variants)
        {
            foreach (var url in v.ImageUrls)
            {
                if (!string.IsNullOrEmpty(url) && seen.Add(url))
                    result.Add(url);
            }
        }
        return result.ToArray();
    }
}
