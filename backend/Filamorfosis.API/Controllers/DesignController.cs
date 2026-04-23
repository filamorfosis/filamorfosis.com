using System.Security.Claims;
using Filamorfosis.Domain.Entities;
using Filamorfosis.Infrastructure.Data;
using Filamorfosis.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Filamorfosis.API.Controllers;

[ApiController]
[Route("api/v1/cart/items/{itemId:guid}/design")]
public class DesignController(FilamorfosisDbContext db, IS3Service s3) : ControllerBase
{
    private static readonly HashSet<string> AllowedMimeTypes =
        new(StringComparer.OrdinalIgnoreCase)
        {
            "image/png", "image/jpeg", "image/jpg",
            "image/svg+xml", "application/pdf"
        };

    private const long MaxBytes = 20 * 1024 * 1024; // 20 MB

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Upload(Guid itemId, IFormFile file)
    {
        if (file is null || file.Length == 0)
            return UnprocessableEntity(new { detail = "No file provided." });

        if (!AllowedMimeTypes.Contains(file.ContentType))
            return UnprocessableEntity(new
            {
                type = "https://filamorfosis.com/errors/invalid-file-type",
                title = "Unprocessable Entity",
                status = 422,
                detail = "File type not allowed. Accepted: PNG, JPG, SVG, PDF."
            });

        if (file.Length > MaxBytes)
            return UnprocessableEntity(new
            {
                type = "https://filamorfosis.com/errors/file-too-large",
                title = "Unprocessable Entity",
                status = 422,
                detail = "File exceeds the 20 MB limit."
            });

        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")!);

        // Verify the cart item belongs to the authenticated user's cart
        var cartItem = await db.CartItems
            .Include(ci => ci.Cart)
            .FirstOrDefaultAsync(ci => ci.Id == itemId && ci.Cart.UserId == userId);

        if (cartItem is null)
            return NotFound(new { detail = "Cart item not found." });

        var s3Key = $"designs/{userId}/{itemId}/{file.FileName}";

        await using var stream = file.OpenReadStream();
        await s3.UploadAsync(stream, s3Key, file.ContentType);

        var designFile = new DesignFile
        {
            Id = Guid.NewGuid(),
            S3Key = s3Key,
            FileName = file.FileName,
            ContentType = file.ContentType,
            SizeBytes = file.Length,
            UploadedAt = DateTime.UtcNow,
            UploadedByUserId = userId
        };

        db.DesignFiles.Add(designFile);
        cartItem.DesignFileId = designFile.Id;
        await db.SaveChangesAsync();

        return Ok(new
        {
            designFileId = designFile.Id,
            fileName = designFile.FileName,
            s3Key = designFile.S3Key
        });
    }
}
