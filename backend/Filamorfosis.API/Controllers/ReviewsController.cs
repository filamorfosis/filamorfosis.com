using Filamorfosis.Application.DTOs;
using Filamorfosis.Domain.Entities;
using Filamorfosis.Infrastructure.Data;
using Filamorfosis.Infrastructure.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Filamorfosis.API.Controllers;

/// <summary>
/// Public reviews endpoints — no auth required for reading approved reviews.
/// Submitting a review is open (anonymous allowed); images require a separate upload call.
/// </summary>
[ApiController]
[Route("api/v1/products/{productId:guid}/reviews")]
public class ReviewsController(FilamorfosisDbContext db, IS3Service s3) : ControllerBase
{
    // ── GET approved reviews for a product ───────────────────────────────────
    [HttpGet]
    public async Task<IActionResult> GetApproved(
        Guid productId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        // Get all approved reviews with user info
        var reviews = await db.ProductReviews
            .Where(r => r.ProductId == productId && r.Status == ReviewStatus.Approved)
            .Include(r => r.User)
            .ToListAsync();

        // Check verified purchases for each review
        var reviewDtos = new List<ReviewDto>();
        foreach (var review in reviews)
        {
            var dto = MapDto(review);
            
            // Check if user has a completed order with this product
            if (review.UserId.HasValue)
            {
                var hasCompletedOrder = await db.Orders
                    .Where(o => o.UserId == review.UserId.Value 
                        && (o.Status == OrderStatus.Delivered || o.Status == OrderStatus.Shipped))
                    .AnyAsync(o => o.Items.Any(i => i.Variant.ProductId == productId));
                
                dto.IsVerifiedPurchase = hasCompletedOrder;
            }
            
            reviewDtos.Add(dto);
        }

        // Sort: verified purchases first, then by date
        var sortedReviews = reviewDtos
            .OrderByDescending(r => r.IsVerifiedPurchase)
            .ThenByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        var total = reviewDtos.Count;

        return Ok(new
        {
            items = sortedReviews,
            totalCount = total,
            page,
            pageSize,
            averageRating = total > 0
                ? Math.Round(reviewDtos.Average(r => (double)r.Rating), 1)
                : 0.0
        });
    }

    // ── Submit a new review (pending approval) ────────────────────────────────
    [HttpPost]
    public async Task<IActionResult> Submit(Guid productId, [FromBody] SubmitReviewRequest req)
    {
        if (req.Rating < 1 || req.Rating > 5)
            return UnprocessableEntity(new ProblemDetails
            {
                Status = 422, Title = "Validation error",
                Detail = "Rating must be between 1 and 5."
            });

        if (string.IsNullOrWhiteSpace(req.AuthorName))
            return UnprocessableEntity(new ProblemDetails
            {
                Status = 422, Title = "Validation error",
                Detail = "AuthorName is required."
            });

        if (string.IsNullOrWhiteSpace(req.Body))
            return UnprocessableEntity(new ProblemDetails
            {
                Status = 422, Title = "Validation error",
                Detail = "Review body is required."
            });

        var product = await db.Products.FindAsync(productId);
        if (product is null) return NotFound();

        // Resolve authenticated user if present
        Guid? userId = null;
        if (User.Identity?.IsAuthenticated == true)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(userIdClaim, out var uid)) userId = uid;
        }

        var review = new ProductReview
        {
            Id = Guid.NewGuid(),
            ProductId = productId,
            ProductVariantId = req.ProductVariantId,
            UserId = userId,
            AuthorName = req.AuthorName.Trim(),
            Rating = req.Rating,
            Body = req.Body.Trim(),
            Status = ReviewStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        db.ProductReviews.Add(review);
        await db.SaveChangesAsync();

        return StatusCode(201, MapDto(review));
    }

    // ── Upload image for a review (before or after submission) ───────────────
    [HttpPost("{reviewId:guid}/images")]
    public async Task<IActionResult> UploadImage(Guid productId, Guid reviewId, IFormFile file)
    {
        var review = await db.ProductReviews
            .FirstOrDefaultAsync(r => r.Id == reviewId && r.ProductId == productId);
        if (review is null) return NotFound();

        var allowed = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "image/png", "image/jpeg" };
        if (file is null || !allowed.Contains(file.ContentType))
            return UnprocessableEntity(new ProblemDetails
            {
                Status = 422, Title = "Invalid image type",
                Detail = "Only PNG and JPG images are accepted."
            });
        if (file.Length > 10 * 1024 * 1024)
            return UnprocessableEntity(new ProblemDetails
            {
                Status = 422, Title = "Image too large",
                Detail = "Image exceeds 10 MB limit."
            });

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (string.IsNullOrEmpty(ext)) ext = file.ContentType == "image/png" ? ".png" : ".jpg";
        var nextIndex = review.ImageUrls.Length + 1;
        var key = $"reviews/{productId}/{reviewId}-{nextIndex}{ext}";

        await using var stream = file.OpenReadStream();
        var storedUrl = await s3.UploadAsync(stream, key, file.ContentType);

        review.ImageUrls = [.. review.ImageUrls, storedUrl];
        await db.SaveChangesAsync();

        return Ok(new { imageUrls = review.ImageUrls });
    }

    private static ReviewDto MapDto(ProductReview r) => new()
    {
        Id = r.Id,
        ProductId = r.ProductId,
        ProductVariantId = r.ProductVariantId,
        AuthorName = r.AuthorName,
        Rating = r.Rating,
        Body = r.Body,
        ImageUrls = r.ImageUrls,
        Status = r.Status.ToString(),
        AdminNote = r.AdminNote,
        CreatedAt = r.CreatedAt,
        ReviewedAt = r.ReviewedAt
    };
}
