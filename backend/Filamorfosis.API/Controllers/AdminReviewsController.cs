using Filamorfosis.Application.DTOs;
using Filamorfosis.Domain.Entities;
using Filamorfosis.Infrastructure.Data;
using Filamorfosis.Infrastructure.Services;
using Filamorfosis.API.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Filamorfosis.API.Controllers;

[ApiController]
[Route("api/v1/admin/reviews")]
[Authorize(Roles = "Master,ProductManagement,OrderManagement")]
[RequireMfa]
public class AdminReviewsController(FilamorfosisDbContext db, IS3Service s3) : ControllerBase
{
    // ── List all reviews with optional filters ────────────────────────────────
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        [FromQuery] Guid? productId = null,
        [FromQuery] string? search = null)
    {
        var query = db.ProductReviews
            .Include(r => r.Product)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<ReviewStatus>(status, true, out var parsedStatus))
            query = query.Where(r => r.Status == parsedStatus);

        if (productId.HasValue)
            query = query.Where(r => r.ProductId == productId.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower();
            query = query.Where(r =>
                r.AuthorName.ToLower().Contains(term) ||
                r.Body.ToLower().Contains(term));
        }

        query = query.OrderByDescending(r => r.CreatedAt);

        var total = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new
        {
            items = items.Select(r => MapDto(r, includeProductTitle: true)),
            totalCount = total,
            page,
            pageSize
        });
    }

    // ── Get single review ─────────────────────────────────────────────────────
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var review = await db.ProductReviews
            .Include(r => r.Product)
            .FirstOrDefaultAsync(r => r.Id == id);
        return review is null ? NotFound() : Ok(MapDto(review, includeProductTitle: true));
    }

    // ── Approve or reject a review ────────────────────────────────────────────
    [HttpPut("{id:guid}/decision")]
    public async Task<IActionResult> Decide(Guid id, [FromBody] ReviewDecisionRequest req)
    {
        if (!Enum.TryParse<ReviewStatus>(req.Decision, true, out var decision) ||
            decision == ReviewStatus.Pending)
            return UnprocessableEntity(new ProblemDetails
            {
                Status = 422, Title = "Invalid decision",
                Detail = "Decision must be 'Approved' or 'Rejected'."
            });

        var review = await db.ProductReviews.FindAsync(id);
        if (review is null) return NotFound();

        review.Status = decision;
        review.AdminNote = req.AdminNote?.Trim();
        review.ReviewedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return Ok(MapDto(review));
    }

    // ── Delete a review (and its images) ─────────────────────────────────────
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var review = await db.ProductReviews.FindAsync(id);
        if (review is null) return NotFound();

        // Delete S3 images
        foreach (var url in review.ImageUrls)
        {
            try
            {
                var key = url.StartsWith("http", StringComparison.OrdinalIgnoreCase)
                    ? new Uri(url).AbsolutePath.TrimStart('/')
                    : url;
                await s3.DeleteAsync(key);
            }
            catch { /* non-fatal */ }
        }

        db.ProductReviews.Remove(review);
        await db.SaveChangesAsync();
        return NoContent();
    }

    // ── Delete a single image from a review ───────────────────────────────────
    [HttpDelete("{id:guid}/images")]
    public async Task<IActionResult> DeleteImage(Guid id, [FromBody] DeleteImageRequest req)
    {
        var review = await db.ProductReviews.FindAsync(id);
        if (review is null) return NotFound();

        if (!review.ImageUrls.Contains(req.ImageUrl))
            return NotFound(new ProblemDetails { Status = 404, Title = "Not Found", Detail = "Image not found." });

        var key = req.ImageUrl.StartsWith("http", StringComparison.OrdinalIgnoreCase)
            ? new Uri(req.ImageUrl).AbsolutePath.TrimStart('/')
            : req.ImageUrl;
        await s3.DeleteAsync(key);

        review.ImageUrls = review.ImageUrls.Where(u => u != req.ImageUrl).ToArray();
        await db.SaveChangesAsync();
        return Ok(new { imageUrls = review.ImageUrls });
    }

    private static ReviewDto MapDto(ProductReview r, bool includeProductTitle = false) => new()
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
        ReviewedAt = r.ReviewedAt,
        ProductTitle = includeProductTitle ? r.Product?.TitleEs : null
    };
}
