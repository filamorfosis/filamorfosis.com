using Filamorfosis.Application;
using Filamorfosis.Application.DTOs;
using Filamorfosis.Application.Services;
using Filamorfosis.Application.Services.Requests;
using Filamorfosis.Application.Validation;
using Filamorfosis.Domain.Entities;
using Filamorfosis.Infrastructure.Data;
using Filamorfosis.Infrastructure.Services;
using Filamorfosis.API.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Filamorfosis.API.Controllers;

[ApiController]
[Route("api/v1/admin/products")]
[Authorize(Roles = "Master,ProductManagement")]
[RequireMfa]
public class AdminProductsController(FilamorfosisDbContext db, IS3Service s3, IPricingCalculatorService pricing, IStockService stockService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] Guid? categoryId = null,
        [FromQuery] string? search = null)
    {
        var query = db.Products
            .Include(p => p.Category)
            .Include(p => p.Discounts)
            .Include(p => p.Variants)
                .ThenInclude(v => v.Discounts)
            .Include(p => p.Variants)
                .ThenInclude(v => v.AttributeValues)
                    .ThenInclude(av => av.AttributeDefinition)
            .Include(p => p.Variants)
                .ThenInclude(v => v.MaterialUsages)
                    .ThenInclude(u => u.Material)
            .AsQueryable();

        if (categoryId.HasValue)
            query = query.Where(p => p.CategoryId == categoryId.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var pattern = $"%{search.Replace("%", "\\%").Replace("_", "\\_")}%";
            query = query.Where(p =>
                EF.Functions.Like(p.TitleEs, pattern) ||
                EF.Functions.Like(p.TitleEn, pattern) ||
                EF.Functions.Like(p.Slug, pattern));
        }

        query = query.OrderBy(p => p.CreatedAt);

        var total = await query.CountAsync();
        var products = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new PagedResult<ProductDetailDto>
        {
            Items = products.Select(p => MapDetail(p, stockService)).ToList(),
            Page = page,
            PageSize = pageSize,
            TotalCount = total
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateProductRequest req)
    {
        if (!BadgeValues.IsValid(req.Badge))
            return UnprocessableEntity(new ProblemDetails
            {
                Status = StatusCodes.Status422UnprocessableEntity,
                Title = "Invalid Badge",
                Detail = "Badge must be one of: hot, new, promo, popular, or null."
            });

        var product = new Product
        {
            Id = Guid.NewGuid(),
            CategoryId = req.CategoryId,
            Slug = req.TitleEs.ToLower().Replace(" ", "-"),
            TitleEs = req.TitleEs, TitleEn = req.TitleEn,
            DescriptionEs = req.DescriptionEs, DescriptionEn = req.DescriptionEn,
            Tags = req.Tags, ImageUrls = [],
            IsActive = req.IsActive, CreatedAt = DateTime.UtcNow
        };
        db.Products.Add(product);
        await db.SaveChangesAsync();
        return StatusCode(201, MapDetail(product, stockService));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var p = await db.Products
            .Include(p => p.Category)
            .Include(p => p.Discounts)
            .Include(p => p.Variants)
                .ThenInclude(v => v.Discounts)
            .Include(p => p.Variants)
                .ThenInclude(v => v.AttributeValues)
                    .ThenInclude(av => av.AttributeDefinition)
            .Include(p => p.Variants)
                .ThenInclude(v => v.MaterialUsages)
                    .ThenInclude(u => u.Material)
            .Include(p => p.AttributeDefinitions)
                .ThenInclude(pa => pa.AttributeDefinition)
            .FirstOrDefaultAsync(p => p.Id == id);

        return p is null ? NotFound() : Ok(MapDetail(p, stockService));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProductRequest req)
    {
        var p = await db.Products
            .Include(p => p.Variants)
                .ThenInclude(v => v.Discounts)
            .Include(p => p.Variants)
                .ThenInclude(v => v.AttributeValues)
                    .ThenInclude(av => av.AttributeDefinition)
            .Include(p => p.Variants)
                .ThenInclude(v => v.MaterialUsages)
                    .ThenInclude(u => u.Material)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (p is null) return NotFound();
        if (!BadgeValues.IsValid(req.Badge))
            return UnprocessableEntity(new ProblemDetails
            {
                Status = StatusCodes.Status422UnprocessableEntity,
                Title = "Invalid Badge",
                Detail = "Badge must be one of: hot, new, promo, popular, or null."
            });

        if (req.TitleEs is not null) p.TitleEs = req.TitleEs;
        if (req.TitleEn is not null) p.TitleEn = req.TitleEn;
        if (req.DescriptionEs is not null) p.DescriptionEs = req.DescriptionEs;
        if (req.DescriptionEn is not null) p.DescriptionEn = req.DescriptionEn;
        if (req.CategoryId.HasValue) p.CategoryId = req.CategoryId.Value;
        if (req.Tags is not null) p.Tags = req.Tags;
        if (req.IsActive.HasValue) p.IsActive = req.IsActive.Value;
        p.Badge = req.Badge;
        await db.SaveChangesAsync();
        return Ok(MapDetail(p, stockService));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var p = await db.Products.FirstOrDefaultAsync(p => p.Id == id);
        if (p is null) return NotFound();
        p.IsActive = false;
        await db.SaveChangesAsync();
        return Ok(new { id, isActive = false });
    }

    [HttpPost("{id:guid}/variants")]
    public async Task<IActionResult> CreateVariant(Guid id, [FromBody] CreateVariantRequest req)
    {
        var p = await db.Products.FirstOrDefaultAsync(p => p.Id == id);
        if (p is null) return NotFound();

        var validationError = await _validateMaterialUsages(req.MaterialUsages);
        if (validationError is not null) return validationError;

        var v = new ProductVariant
        {
            Id = Guid.NewGuid(), ProductId = id,
            LabelEs = req.LabelEs, Sku = req.Sku,
            Price = req.Price, StockQuantity = req.StockQuantity,
            IsAvailable = req.IsAvailable, AcceptsDesignFile = req.AcceptsDesignFile,
            Profit = req.Profit,
            ManufactureTimeMinutes = req.ManufactureTimeMinutes
        };
        db.ProductVariants.Add(v);
        await db.SaveChangesAsync();

        // Save material usages
        await _saveMaterialUsages(v.Id, req.MaterialUsages);

        // Insert attribute values
        foreach (var attr in req.Attributes)
        {
            db.VariantAttributeValues.Add(new VariantAttributeValue
            {
                Id = Guid.NewGuid(), ProductId = id,
                VariantId = v.Id, AttributeDefinitionId = attr.AttributeDefinitionId, Value = attr.Value
            });
        }
        if (req.Attributes.Count > 0) await db.SaveChangesAsync();

        // Compute BaseCost and Price
        bool hasCostFields = req.Profit != 0 || req.MaterialUsages.Count > 0;
        if (hasCostFields)
        {
            var (baseCost, computedPrice) = await _computeCost(v.Id, v.ManufactureTimeMinutes, v.Profit);
            v.BaseCost = baseCost;
            v.Price = computedPrice;
            await db.SaveChangesAsync();
        }

        var created = await db.ProductVariants
            .Include(pv => pv.Discounts)
            .Include(pv => pv.AttributeValues).ThenInclude(av => av.AttributeDefinition)
            .Include(pv => pv.MaterialUsages).ThenInclude(u => u.Material)
            .FirstAsync(pv => pv.Id == v.Id);
        return StatusCode(201, MapVariant(created, stockService));
    }

    [HttpPut("{id:guid}/variants/{variantId:guid}")]
    public async Task<IActionResult> UpdateVariant(Guid id, Guid variantId, [FromBody] UpdateVariantRequest req)
    {
        var v = await db.ProductVariants
            .Include(v => v.Discounts)
            .Include(v => v.AttributeValues)
            .Include(v => v.MaterialUsages)
            .FirstOrDefaultAsync(v => v.Id == variantId && v.ProductId == id);

        if (v is null) return NotFound();

        var validationError = await _validateMaterialUsages(req.MaterialUsages);
        if (validationError is not null) return validationError;

        if (req.LabelEs is not null) v.LabelEs = req.LabelEs;
        if (req.Sku is not null) v.Sku = req.Sku;
        if (req.Price.HasValue) v.Price = req.Price.Value;
        if (req.StockQuantity.HasValue) v.StockQuantity = req.StockQuantity.Value;
        if (req.IsAvailable.HasValue) v.IsAvailable = req.IsAvailable.Value;
        if (req.AcceptsDesignFile.HasValue) v.AcceptsDesignFile = req.AcceptsDesignFile.Value;
        if (req.Profit.HasValue) v.Profit = req.Profit.Value;
        if (req.ManufactureTimeMinutes.HasValue) v.ManufactureTimeMinutes = req.ManufactureTimeMinutes.Value;

        // Replace attribute values
        db.VariantAttributeValues.RemoveRange(v.AttributeValues);
        foreach (var attr in req.Attributes)
        {
            db.VariantAttributeValues.Add(new VariantAttributeValue
            {
                Id = Guid.NewGuid(), ProductId = id,
                VariantId = v.Id, AttributeDefinitionId = attr.AttributeDefinitionId, Value = attr.Value
            });
        }

        // Replace material usages
        db.VariantMaterialUsages.RemoveRange(v.MaterialUsages);
        await db.SaveChangesAsync();
        await _saveMaterialUsages(v.Id, req.MaterialUsages);

        // Recompute BaseCost and Price
        bool hasCostFields = v.Profit != 0 || req.MaterialUsages.Count > 0;
        if (hasCostFields)
        {
            var (baseCost, computedPrice) = await _computeCost(v.Id, v.ManufactureTimeMinutes, v.Profit);
            v.BaseCost = baseCost;
            v.Price = computedPrice;
            await db.SaveChangesAsync();
        }

        var updated = await db.ProductVariants
            .Include(pv => pv.Discounts)
            .Include(pv => pv.AttributeValues).ThenInclude(av => av.AttributeDefinition)
            .Include(pv => pv.MaterialUsages).ThenInclude(u => u.Material)
            .FirstAsync(pv => pv.Id == v.Id);
        return Ok(MapVariant(updated, stockService));
    }

    [HttpDelete("{id:guid}/variants/{variantId:guid}")]
    public async Task<IActionResult> DeleteVariant(Guid id, Guid variantId)
    {
        var v = await db.ProductVariants
            .Include(v => v.MaterialUsages)
            .FirstOrDefaultAsync(v => v.Id == variantId && v.ProductId == id);
        if (v is null) return NotFound();

        var referencedByOrder = await db.OrderItems.AnyAsync(oi => oi.ProductVariantId == variantId);
        if (referencedByOrder)
        {
            return Conflict(new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "Conflict",
                Detail = "Cannot delete variant: it is referenced by existing orders."
            });
        }

        var referencedByCart = await db.CartItems.AnyAsync(ci => ci.ProductVariantId == variantId);
        if (referencedByCart)
        {
            return Conflict(new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "Conflict",
                Detail = "Cannot delete variant: it is currently in one or more active carts."
            });
        }

        db.ProductVariants.Remove(v);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id:guid}/images")]
    public async Task<IActionResult> UploadImage(Guid id, IFormFile file)
    {
        var p = await db.Products.FirstOrDefaultAsync(p => p.Id == id);
        if (p is null) return NotFound();

        var allowed = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "image/png", "image/jpeg" };
        if (file is null || !allowed.Contains(file.ContentType))
            return UnprocessableEntity(new ProblemDetails
            {
                Status = StatusCodes.Status422UnprocessableEntity,
                Title = "Invalid image type",
                Detail = "Only PNG and JPG images are accepted."
            });
        if (file.Length > 10 * 1024 * 1024)
            return UnprocessableEntity(new ProblemDetails
            {
                Status = StatusCodes.Status422UnprocessableEntity,
                Title = "Image too large",
                Detail = "Image exceeds 10 MB limit."
            });

        var key = $"products/{id}/{Guid.NewGuid()}-{file.FileName}";
        await using var stream = file.OpenReadStream();
        await s3.UploadAsync(stream, key, file.ContentType);

        p.ImageUrls = [.. p.ImageUrls, key];
        await db.SaveChangesAsync();
        return Ok(new { imageUrls = p.ImageUrls });
    }

    [HttpDelete("{id:guid}/images")]
    public async Task<IActionResult> DeleteImage(Guid id, [FromBody] DeleteImageRequest req)
    {
        var p = await db.Products.FirstOrDefaultAsync(p => p.Id == id);
        if (p is null) return NotFound();

        if (!p.ImageUrls.Contains(req.ImageUrl))
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Not Found",
                Detail = "Image URL not found in product."
            });

        // Extract S3 key from URL (may be a full CDN URL or a raw key)
        var key = req.ImageUrl.StartsWith("http", StringComparison.OrdinalIgnoreCase)
            ? new Uri(req.ImageUrl).AbsolutePath.TrimStart('/')
            : req.ImageUrl;

        await s3.DeleteAsync(key);

        p.ImageUrls = p.ImageUrls.Where(u => u != req.ImageUrl).ToArray();
        await db.SaveChangesAsync();
        return Ok(new { imageUrls = p.ImageUrls });
    }

    private async Task _saveMaterialUsages(Guid variantId, Dictionary<string, decimal> usages)
    {
        foreach (var (materialIdStr, qty) in usages)
        {
            if (!Guid.TryParse(materialIdStr, out var materialId) || qty <= 0) continue;
            db.VariantMaterialUsages.Add(new VariantMaterialUsage
            {
                Id = Guid.NewGuid(),
                VariantId = variantId,
                MaterialId = materialId,
                Quantity = qty
            });
        }
        await db.SaveChangesAsync();
    }

    private async Task<(decimal baseCost, decimal price)> _computeCost(
        Guid variantId, int? manufactureMinutes, decimal profit)
    {
        var materialUsages = await db.VariantMaterialUsages
            .Include(u => u.Material)
            .AsNoTracking()
            .Where(u => u.VariantId == variantId)
            .ToListAsync();

        var elec = await db.GlobalParameters.AsNoTracking()
            .FirstOrDefaultAsync(p => p.Key == "electric_cost_per_hour");
        decimal electricRate = elec is not null && decimal.TryParse(elec.Value, out var ev) ? ev : 0;

        var usagePairs = materialUsages.Select(u => (u.Material.BaseCost, u.Quantity));
        var baseCost = pricing.ComputeVariantBaseCost(usagePairs, manufactureMinutes, electricRate);
        var price = await pricing.ComputePriceAsync(baseCost, profit);
        return (baseCost, price);
    }

    private static ProductDetailDto MapDetail(Product p, IStockService stockService) => new()
    {
        Id = p.Id, Slug = p.Slug,
        TitleEs = p.TitleEs, TitleEn = p.TitleEn,
        DescriptionEs = p.DescriptionEs, DescriptionEn = p.DescriptionEn,
        Tags = p.Tags, ImageUrls = p.ImageUrls,
        Badge = p.Badge,
        IsActive = p.IsActive, CategoryId = p.CategoryId,
        CategoryNameEs = p.Category?.NameEs,
        CategoryNameEn = p.Category?.NameEn,
        Variants = p.Variants.Select(v => MapVariant(v, stockService, p.Discounts)).ToList(),
        AttributeDefinitions = p.AttributeDefinitions
            .Select(pa => new AttributeDefinitionDto
            {
                Id = pa.AttributeDefinition.Id,
                Name = pa.AttributeDefinition.Name,
                CreatedAt = pa.AttributeDefinition.CreatedAt
            })
            .OrderBy(a => a.Name)
            .ToList(),
        Discounts = (p.Discounts ?? []).Select(d => new DiscountDto
        {
            Id = d.Id,
            DiscountType = d.DiscountType,
            Value = d.Value,
            StartsAt = d.StartsAt,
            EndsAt = d.EndsAt,
            CreatedAt = d.CreatedAt
        }).ToList()
    };

    private static ProductVariantDto MapVariant(ProductVariant v, IStockService stockService, IEnumerable<Discount>? productDiscounts = null)
    {
        var allDiscounts = v.Discounts.Concat(productDiscounts ?? []);
        return new ProductVariantDto
        {
        Id = v.Id, Sku = v.Sku,
        LabelEs = v.LabelEs,
        Price = v.Price,
        EffectivePrice = DiscountCalculator.ComputeEffectivePrice(v.Price, allDiscounts),
        IsAvailable = v.IsAvailable,
        AcceptsDesignFile = v.AcceptsDesignFile,
        InStock = stockService.IsVariantInStock(v.MaterialUsages.Select(u => ((decimal)(u.Material?.StockQuantity ?? 0), u.Quantity))),
        BaseCost = v.BaseCost,
        Profit = v.Profit,
        ManufactureTimeMinutes = v.ManufactureTimeMinutes,
        Attributes = v.AttributeValues.Select(a => new VariantAttributeValueDto
        {
            AttributeDefinitionId = a.AttributeDefinitionId,
            Name = a.AttributeDefinition?.Name ?? string.Empty,
            Value = a.Value
        }).ToList(),
        Discounts = v.Discounts.Select(d => new DiscountDto
        {
            Id = d.Id,
            DiscountType = d.DiscountType,
            Value = d.Value,
            StartsAt = d.StartsAt,
            EndsAt = d.EndsAt,
            CreatedAt = d.CreatedAt
        }).ToList(),
        MaterialUsages = v.MaterialUsages.ToDictionary(
            u => u.MaterialId.ToString(),
            u => u.Quantity)
        };
    }

    private async Task<IActionResult?> _validateMaterialUsages(Dictionary<string, decimal> usages)
    {
        foreach (var (materialIdStr, qty) in usages)
        {
            if (qty <= 0)
                return BadRequest(new ProblemDetails
                {
                    Type = "https://filamorfosis.com/errors/validation",
                    Title = "Validation error",
                    Status = 400,
                    Detail = "La cantidad debe ser mayor a 0."
                });

            if (!Guid.TryParse(materialIdStr, out var materialId) ||
                !await db.Materials.AnyAsync(m => m.Id == materialId))
                return BadRequest(new ProblemDetails
                {
                    Type = "https://filamorfosis.com/errors/validation",
                    Title = "Validation error",
                    Status = 400,
                    Detail = $"Material no encontrado: {materialIdStr}"
                });
        }
        return null;
    }
}
