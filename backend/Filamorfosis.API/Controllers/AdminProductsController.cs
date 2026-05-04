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
        [FromQuery] Guid? processId = null,
        [FromQuery] string? search = null)
    {
        var query = db.Products
            .Include(p => p.Process)
            .Include(p => p.Discounts)
            .Include(p => p.CategoryAssignments)
                .ThenInclude(ca => ca.Category)
            .Include(p => p.CategoryAssignments)
                .ThenInclude(ca => ca.SubCategory)
            .Include(p => p.Variants)
                .ThenInclude(v => v.Discounts)
            .Include(p => p.Variants)
                .ThenInclude(v => v.AttributeValues)
                    .ThenInclude(av => av.AttributeDefinition)
            .Include(p => p.Variants)
                .ThenInclude(v => v.MaterialUsages)
                    .ThenInclude(u => u.Material)
            .AsQueryable();

        if (processId.HasValue)
            query = query.Where(p => p.ProcessId == processId.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var pattern = $"%{search.Replace("%", "\\%").Replace("_", "\\_")}%";
            query = query.Where(p =>
                EF.Functions.Like(p.TitleEs, pattern) ||
                EF.Functions.Like(p.Slug, pattern));
        }

        query = query.OrderBy(p => p.CreatedAt);

        var total = await query.CountAsync();
        var products = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var items = new List<ProductDetailDto>();
        foreach (var p in products)
            items.Add(await MapDetailAsync(p, stockService, db));

        return Ok(new PagedResult<ProductDetailDto>
        {
            Items = items,
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
            ProcessId = req.ProcessId,
            Slug = req.TitleEs.ToLower().Replace(" ", "-"),
            TitleEs = req.TitleEs,
            DescriptionEs = req.DescriptionEs,
            Tags = req.Tags,
            IsActive = req.IsActive, CreatedAt = DateTime.UtcNow
        };
        db.Products.Add(product);
        await db.SaveChangesAsync();
        return StatusCode(201, await MapDetailAsync(product, stockService, db));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var p = await db.Products
            .Include(p => p.Process)
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

        return p is null ? NotFound() : Ok(await MapDetailAsync(p, stockService, db));
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
        if (req.DescriptionEs is not null) p.DescriptionEs = req.DescriptionEs;
        if (req.ProcessId.HasValue) p.ProcessId = req.ProcessId.Value;
        if (req.Tags is not null) p.Tags = req.Tags;
        if (req.IsActive.HasValue) p.IsActive = req.IsActive.Value;
        p.Badge = req.Badge;
        await db.SaveChangesAsync();
        return Ok(await MapDetailAsync(p, stockService, db));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var p = await db.Products
            .Include(p => p.Variants)
            .FirstOrDefaultAsync(p => p.Id == id);
        if (p is null) return NotFound();

        // Check if product has any variants referenced in orders
        var variantIds = p.Variants.Select(v => v.Id).ToList();
        var hasOrders = await db.OrderItems.AnyAsync(oi => variantIds.Contains(oi.ProductVariantId));
        
        if (hasOrders)
        {
            return Conflict(new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "Conflict",
                Detail = "No se puede eliminar: el producto tiene pedidos activos."
            });
        }

        // Check if product has any variants in active carts
        var hasCartItems = await db.CartItems.AnyAsync(ci => variantIds.Contains(ci.ProductVariantId));
        
        if (hasCartItems)
        {
            return Conflict(new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "Conflict",
                Detail = "No se puede eliminar: el producto está en carritos activos."
            });
        }

        // Delete the product (cascade will delete variants, discounts, etc.)
        db.Products.Remove(p);
        await db.SaveChangesAsync();
        return NoContent();
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

        // Check stock and auto-deactivate if insufficient
        await _checkAndDeactivateIfInsufficientStock(v.Id);

        var created = await db.ProductVariants
            .Include(pv => pv.Discounts)
            .Include(pv => pv.AttributeValues).ThenInclude(av => av.AttributeDefinition)
            .Include(pv => pv.MaterialUsages).ThenInclude(u => u.Material)
            .FirstAsync(pv => pv.Id == v.Id);
        var productDiscounts = await db.Discounts.Where(d => d.ProductId == id).ToListAsync();
        return StatusCode(201, await MapVariantAsync(created, stockService, db, productDiscounts));
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

        // Check stock and auto-deactivate if insufficient
        await _checkAndDeactivateIfInsufficientStock(v.Id);

        var updated = await db.ProductVariants
            .Include(pv => pv.Discounts)
            .Include(pv => pv.AttributeValues).ThenInclude(av => av.AttributeDefinition)
            .Include(pv => pv.MaterialUsages).ThenInclude(u => u.Material)
            .FirstAsync(pv => pv.Id == v.Id);
        var productDiscounts = await db.Discounts.Where(d => d.ProductId == id).ToListAsync();
        return Ok(await MapVariantAsync(updated, stockService, db, productDiscounts));
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

    [HttpPost("{id:guid}/variants/{variantId:guid}/images")]
    public async Task<IActionResult> UploadVariantImage(Guid id, Guid variantId, IFormFile file)
    {
        var v = await db.ProductVariants.FirstOrDefaultAsync(v => v.Id == variantId && v.ProductId == id);
        if (v is null) return NotFound();

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

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (string.IsNullOrEmpty(ext)) ext = file.ContentType == "image/png" ? ".png" : ".jpg";
        var nextIndex = v.ImageUrls.Length + 1;
        var key = $"products/{id}/variants/{variantId}-{nextIndex}{ext}";
        await using var stream = file.OpenReadStream();
        var storedUrl = await s3.UploadAsync(stream, key, file.ContentType);

        v.ImageUrls = [.. v.ImageUrls, storedUrl];
        await db.SaveChangesAsync();
        return Ok(new { imageUrls = v.ImageUrls });
    }

    [HttpDelete("{id:guid}/variants/{variantId:guid}/images")]
    public async Task<IActionResult> DeleteVariantImage(Guid id, Guid variantId, [FromBody] DeleteImageRequest req)
    {
        var v = await db.ProductVariants.FirstOrDefaultAsync(v => v.Id == variantId && v.ProductId == id);
        if (v is null) return NotFound();

        if (!v.ImageUrls.Contains(req.ImageUrl))
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Not Found",
                Detail = "Image URL not found in variant."
            });

        var key = req.ImageUrl.StartsWith("http", StringComparison.OrdinalIgnoreCase)
            ? new Uri(req.ImageUrl).AbsolutePath.TrimStart('/')
            : req.ImageUrl;

        await s3.DeleteAsync(key);

        v.ImageUrls = v.ImageUrls.Where(u => u != req.ImageUrl).ToArray();
        await db.SaveChangesAsync();
        return Ok(new { imageUrls = v.ImageUrls });
    }

    [HttpPost("{id:guid}/images")]
    [ApiExplorerSettings(IgnoreApi = true)] // Deprecated — images are now per-variant
    public IActionResult UploadImage_Deprecated() =>
        StatusCode(410, new ProblemDetails
        {
            Status = 410,
            Title = "Gone",
            Detail = "Product-level image upload has been removed. Upload images per variant instead."
        });

    [HttpDelete("{id:guid}/images")]
    [ApiExplorerSettings(IgnoreApi = true)] // Deprecated
    public IActionResult DeleteImage_Deprecated() =>
        StatusCode(410, new ProblemDetails
        {
            Status = 410,
            Title = "Gone",
            Detail = "Product-level image deletion has been removed. Delete images per variant instead."
        });

    [HttpGet("{id:guid}/categories")]
    public async Task<IActionResult> GetProductCategories(Guid id)
    {
        var product = await db.Products
            .Include(p => p.CategoryAssignments)
                .ThenInclude(ca => ca.Category)
            .Include(p => p.CategoryAssignments)
                .ThenInclude(ca => ca.SubCategory)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (product is null)
            return NotFound();

        var assignments = product.CategoryAssignments
            .Where(ca => ca.SubCategory != null)
            .Select(ca => new
            {
                CategoryId = ca.Category.Id,
                CategoryName = ca.Category.Name,
                CategoryIcon = ca.Category.Icon,
                SubCategoryId = ca.SubCategory.Id,
                SubCategoryName = ca.SubCategory.Name,
                SubCategoryIcon = ca.SubCategory.Icon,
                // For frontend compatibility - use subcategory as the primary display
                Id = ca.SubCategory.Id,
                Name = ca.SubCategory.Name,
                Icon = ca.SubCategory.Icon
            })
            .ToList();

        return Ok(assignments);
    }

    [HttpPut("{id:guid}/categories")]
    public async Task<IActionResult> UpdateProductCategories(Guid id, [FromBody] AssignCategoriesRequest req)
    {
        // Check if product exists
        var product = await db.Products
            .Include(p => p.CategoryAssignments)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (product is null)
            return NotFound();

        // Extract unique category and subcategory IDs
        var categoryIds = req.Assignments.Select(a => a.CategoryId).Distinct().ToList();
        var subCategoryIds = req.Assignments
            .Select(a => a.SubCategoryId)
            .Distinct()
            .ToList();

        // Validate all category IDs exist in database
        var existingCategories = await db.ProductCategories
            .Where(c => categoryIds.Contains(c.Id))
            .Select(c => c.Id)
            .ToListAsync();

        var invalidCategoryIds = categoryIds.Except(existingCategories).ToList();
        if (invalidCategoryIds.Any())
        {
            return BadRequest(new ProblemDetails
            {
                Type = "https://filamorfosis.com/errors/validation",
                Title = "Validation Error",
                Status = StatusCodes.Status400BadRequest,
                Detail = $"Las siguientes categorías no existen: {string.Join(", ", invalidCategoryIds)}"
            });
        }

        // Validate all subcategory IDs exist in database
        var existingSubCategories = await db.ProductSubCategories
            .Where(sc => subCategoryIds.Contains(sc.Id))
            .Select(sc => sc.Id)
            .ToListAsync();

        var invalidSubCategoryIds = subCategoryIds.Except(existingSubCategories).ToList();
        if (invalidSubCategoryIds.Any())
        {
            return BadRequest(new ProblemDetails
            {
                Type = "https://filamorfosis.com/errors/validation",
                Title = "Validation Error",
                Status = StatusCodes.Status400BadRequest,
                Detail = $"Las siguientes subcategorías no existen: {string.Join(", ", invalidSubCategoryIds)}"
            });
        }

        // Remove all existing ProductCategoryAssignments for the product
        db.ProductCategoryAssignments.RemoveRange(product.CategoryAssignments);

        // Create new ProductCategoryAssignments for provided assignments
        foreach (var assignment in req.Assignments)
        {
            db.ProductCategoryAssignments.Add(new ProductCategoryAssignment
            {
                ProductId = id,
                CategoryId = assignment.CategoryId,
                SubCategoryId = assignment.SubCategoryId
            });
        }

        await db.SaveChangesAsync();

        // Return updated category list
        var updatedProduct = await db.Products
            .Include(p => p.CategoryAssignments)
                .ThenInclude(ca => ca.Category)
            .Include(p => p.CategoryAssignments)
                .ThenInclude(ca => ca.SubCategory)
            .FirstAsync(p => p.Id == id);

        var categories = updatedProduct.CategoryAssignments
            .Select(ca => new CategoryDto
            {
                Id = ca.Category.Id,
                Name = ca.Category.Name,
                Slug = ca.Category.Slug,
                Description = ca.Category.Description,
                Icon = ca.Category.Icon
            })
            .ToList();

        return Ok(categories);
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

    private static async Task<ProductDetailDto> MapDetailAsync(Product p, IStockService stockService, FilamorfosisDbContext db) 
    {
        var variantDtos = new List<ProductVariantDto>();
        foreach (var v in p.Variants)
            variantDtos.Add(await MapVariantAsync(v, stockService, db, p.Discounts));

        return new ProductDetailDto
        {
        Id = p.Id, Slug = p.Slug,
        TitleEs = p.TitleEs,
        DescriptionEs = p.DescriptionEs,
        Tags = p.Tags, ImageUrls = AggregateVariantImages(p.Variants),
        Badge = p.Badge,
        IsActive = p.IsActive, ProcessId = p.ProcessId,
        ProcessNameEs = p.Process?.NameEs,
        Variants = variantDtos,
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
        }).ToList(),
        CategoryAssignments = (p.CategoryAssignments ?? [])
            .Where(ca => ca.Category != null && ca.SubCategory != null)
            .Select(ca => new ProductCategoryAssignmentDto
            {
                CategoryId = ca.Category.Id,
                CategoryName = ca.Category.Name,
                CategoryIcon = ca.Category.Icon,
                SubCategoryId = ca.SubCategory.Id,
                SubCategoryName = ca.SubCategory.Name,
                SubCategoryIcon = ca.SubCategory.Icon,
                // For display purposes, show subcategory name
                Name = ca.SubCategory.Name,
                Icon = ca.SubCategory.Icon ?? ca.Category.Icon
            })
            .OrderBy(c => c.Name)
            .ToList()
        };
    }

    private static async Task<ProductVariantDto> MapVariantAsync(ProductVariant v, IStockService stockService, FilamorfosisDbContext db, IEnumerable<Discount>? productDiscounts = null)
    {
        var allDiscounts = v.Discounts.Concat(productDiscounts ?? []);
        var effectivePrice = DiscountCalculator.ComputeEffectivePrice(v.Price, allDiscounts);
        
        // Determine pricing alert and auto-deactivate if needed
        string? pricingAlert = null;
        var shouldDeactivate = false;
        
        if (effectivePrice < v.BaseCost)
        {
            pricingAlert = "loss";
            shouldDeactivate = true;
        }
        else if (effectivePrice < v.BaseCost * 1.16m)
        {
            pricingAlert = "breakeven";
            shouldDeactivate = true;
        }
        
        // Persist deactivation to DB if needed
        if (shouldDeactivate && v.IsAvailable)
        {
            v.IsAvailable = false;
            v.WasAutoPaused = true;
            await db.SaveChangesAsync();
        }
        else if (!shouldDeactivate && v.WasAutoPaused && !v.IsAvailable)
        {
            // Reactivate only if it was auto-paused by the pricing guard, not manually disabled
            v.IsAvailable = true;
            v.WasAutoPaused = false;
            await db.SaveChangesAsync();
        }
        
        return new ProductVariantDto
        {
        Id = v.Id, Sku = v.Sku,
        LabelEs = v.LabelEs,
        Price = v.Price,
        EffectivePrice = effectivePrice,
        IsAvailable = v.IsAvailable,
        AcceptsDesignFile = v.AcceptsDesignFile,
        InStock = stockService.IsVariantInStock(v.MaterialUsages.Select(u => ((decimal)(u.Material?.StockQuantity ?? 0), u.Quantity))),
        BaseCost = v.BaseCost,
        Profit = v.Profit,
        ManufactureTimeMinutes = v.ManufactureTimeMinutes,
        PricingAlert = pricingAlert,
        ImageUrls = v.ImageUrls,
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

            if (!Guid.TryParse(materialIdStr, out var materialId))
                return BadRequest(new ProblemDetails
                {
                    Type = "https://filamorfosis.com/errors/validation",
                    Title = "Validation error",
                    Status = 400,
                    Detail = $"Material no encontrado: {materialIdStr}"
                });

            var material = await db.Materials.FindAsync(materialId);
            if (material == null)
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

    private async Task<bool> _checkAndDeactivateIfInsufficientStock(Guid variantId)
    {
        var materialUsages = await db.VariantMaterialUsages
            .Include(u => u.Material)
            .Where(u => u.VariantId == variantId)
            .ToListAsync();

        var hasInsufficientStock = materialUsages.Any(u => u.Quantity > (u.Material?.StockQuantity ?? 0));
        
        if (hasInsufficientStock)
        {
            var variant = await db.ProductVariants.FindAsync(variantId);
            if (variant != null && variant.IsAvailable)
            {
                variant.IsAvailable = false;
                variant.WasAutoPaused = true;
                await db.SaveChangesAsync();
                return true; // Was deactivated
            }
        }
        
        return false; // Not deactivated
    }
}
