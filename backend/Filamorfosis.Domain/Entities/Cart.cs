namespace Filamorfosis.Domain.Entities;

public class Cart
{
    public Guid Id { get; set; }
    public Guid? UserId { get; set; }
    public string? GuestToken { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public User? User { get; set; }
    public ICollection<CartItem> Items { get; set; } = new List<CartItem>();
}
