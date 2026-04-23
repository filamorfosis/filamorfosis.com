using Filamorfosis.Domain.Entities;

namespace Filamorfosis.Application;

/// <summary>
/// Computes the effective price for a product variant given its active discounts.
/// Priority logic: active discounts only, best reduction wins, floor at 0.
/// </summary>
public static class DiscountCalculator
{
    /// <summary>
    /// Returns the lowest price achievable by applying any single active discount.
    /// If no discount is active, returns <paramref name="price"/> unchanged.
    /// </summary>
    /// <param name="price">The base variant price.</param>
    /// <param name="discounts">All discounts associated with the variant (direct or inherited from product).</param>
    public static decimal ComputeEffectivePrice(decimal price, IEnumerable<Discount> discounts)
    {
        var now = DateTime.UtcNow;

        var active = discounts.Where(d =>
            (d.StartsAt == null || d.StartsAt <= now) &&
            (d.EndsAt   == null || d.EndsAt   >= now));

        return active.Aggregate(price, (best, d) =>
        {
            var candidate = d.DiscountType == "Percentage"
                ? price * (1 - d.Value / 100m)
                : Math.Max(0m, price - d.Value);

            return candidate < best ? candidate : best;
        });
    }
}
