namespace Filamorfosis.Domain.Entities;

/// <summary>
/// A customer review for a product.
/// Reviews require admin approval before appearing on the storefront.
/// </summary>
public class ProductReview
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    /// <summary>Optional — links the review to the specific variant purchased.</summary>
    public Guid? ProductVariantId { get; set; }
    /// <summary>Null for anonymous/guest reviews.</summary>
    public Guid? UserId { get; set; }

    /// <summary>Display name shown on the storefront (may differ from account name).</summary>
    public string AuthorName { get; set; } = string.Empty;
    /// <summary>1–5 star rating.</summary>
    public int Rating { get; set; }
    public string Body { get; set; } = string.Empty;

    /// <summary>S3 keys or CDN URLs for review images (uploaded by the reviewer).</summary>
    public string[] ImageUrls { get; set; } = [];

    public ReviewStatus Status { get; set; } = ReviewStatus.Pending;
    /// <summary>Optional note left by the admin when rejecting a review.</summary>
    public string? AdminNote { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }

    // Navigation
    public Product Product { get; set; } = null!;
    public ProductVariant? Variant { get; set; }
    public User? User { get; set; }
}

public enum ReviewStatus
{
    Pending,
    Approved,
    Rejected
}
