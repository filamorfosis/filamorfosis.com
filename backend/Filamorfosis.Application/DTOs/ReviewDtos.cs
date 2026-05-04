namespace Filamorfosis.Application.DTOs;

public class ReviewDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public Guid? ProductVariantId { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string Body { get; set; } = string.Empty;
    public string[] ImageUrls { get; set; } = [];
    public string Status { get; set; } = "Pending";
    public string? AdminNote { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
    /// <summary>Product title — populated in admin list view.</summary>
    public string? ProductTitle { get; set; }
    /// <summary>Indicates if the reviewer has a completed order with this product.</summary>
    public bool IsVerifiedPurchase { get; set; }
}

public class SubmitReviewRequest
{
    public Guid ProductId { get; set; }
    public Guid? ProductVariantId { get; set; }
    /// <summary>Display name for the review. Required.</summary>
    public string AuthorName { get; set; } = string.Empty;
    /// <summary>1–5 stars.</summary>
    public int Rating { get; set; }
    public string Body { get; set; } = string.Empty;
}

public class ReviewDecisionRequest
{
    /// <summary>"Approved" or "Rejected"</summary>
    public string Decision { get; set; } = string.Empty;
    public string? AdminNote { get; set; }
}
