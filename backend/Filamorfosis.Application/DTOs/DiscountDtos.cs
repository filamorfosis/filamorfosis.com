namespace Filamorfosis.Application.DTOs;

public class CreateDiscountRequest
{
    public string DiscountType { get; set; } = string.Empty; // "Percentage" | "FixedAmount"
    public decimal Value { get; set; }
    public DateTime? StartsAt { get; set; }
    public DateTime? EndsAt { get; set; }
}

public class DiscountDto
{
    public Guid Id { get; set; }
    public string DiscountType { get; set; } = string.Empty;
    public decimal Value { get; set; }
    public DateTime? StartsAt { get; set; }
    public DateTime? EndsAt { get; set; }
    public DateTime CreatedAt { get; set; }
}
