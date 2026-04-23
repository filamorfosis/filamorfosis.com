// Feature: admin-store-management, Property 9: Discount effectivePrice calculation

using Filamorfosis.Application;
using Filamorfosis.Domain.Entities;

namespace Filamorfosis.Tests;

public class DiscountCalculatorTests
{
    private static Discount MakeDiscount(string type, decimal value, DateTime? startsAt = null, DateTime? endsAt = null) =>
        new()
        {
            Id = Guid.NewGuid(),
            DiscountType = type,
            Value = value,
            StartsAt = startsAt,
            EndsAt = endsAt,
            CreatedAt = DateTime.UtcNow
        };

    // Test: no active discounts → effectivePrice equals price
    [Fact]
    public void NoActiveDiscounts_ReturnsOriginalPrice()
    {
        var price = 200m;
        var result = DiscountCalculator.ComputeEffectivePrice(price, []);
        Assert.Equal(price, result);
    }

    // Test: Percentage discount → price * (1 - value/100)
    [Fact]
    public void PercentageDiscount_AppliesCorrectFormula()
    {
        var price = 200m;
        var discount = MakeDiscount("Percentage", 25m); // 25% off
        var result = DiscountCalculator.ComputeEffectivePrice(price, [discount]);
        Assert.Equal(150m, result); // 200 * (1 - 25/100) = 150
    }

    // Test: FixedAmount discount → max(0, price - value)
    [Fact]
    public void FixedAmountDiscount_AppliesCorrectFormula()
    {
        var price = 200m;
        var discount = MakeDiscount("FixedAmount", 50m);
        var result = DiscountCalculator.ComputeEffectivePrice(price, [discount]);
        Assert.Equal(150m, result); // 200 - 50 = 150
    }

    [Fact]
    public void FixedAmountDiscount_LargerThanPrice_FloorsAtZero()
    {
        var price = 30m;
        var discount = MakeDiscount("FixedAmount", 100m);
        var result = DiscountCalculator.ComputeEffectivePrice(price, [discount]);
        Assert.Equal(0m, result); // max(0, 30 - 100) = 0
    }

    // Test: discount outside date range → treated as inactive
    [Fact]
    public void DiscountWithFutureStartsAt_IsIgnored()
    {
        var price = 200m;
        var futureDiscount = MakeDiscount("Percentage", 50m, startsAt: DateTime.UtcNow.AddDays(1));
        var result = DiscountCalculator.ComputeEffectivePrice(price, [futureDiscount]);
        Assert.Equal(price, result);
    }

    [Fact]
    public void DiscountWithPastEndsAt_IsIgnored()
    {
        var price = 200m;
        var expiredDiscount = MakeDiscount("Percentage", 50m, endsAt: DateTime.UtcNow.AddDays(-1));
        var result = DiscountCalculator.ComputeEffectivePrice(price, [expiredDiscount]);
        Assert.Equal(price, result);
    }

    [Fact]
    public void DiscountWithNullBounds_IsAlwaysActive()
    {
        var price = 200m;
        var openDiscount = MakeDiscount("Percentage", 10m, startsAt: null, endsAt: null);
        var result = DiscountCalculator.ComputeEffectivePrice(price, [openDiscount]);
        Assert.Equal(180m, result); // 200 * (1 - 10/100) = 180
    }

    // Test: multiple active discounts → best reduction wins
    [Fact]
    public void MultipleActiveDiscounts_BestReductionWins()
    {
        var price = 200m;
        var discounts = new[]
        {
            MakeDiscount("Percentage", 10m),   // → 180
            MakeDiscount("FixedAmount", 60m),  // → 140  ← best
            MakeDiscount("Percentage", 20m),   // → 160
        };
        var result = DiscountCalculator.ComputeEffectivePrice(price, discounts);
        Assert.Equal(140m, result);
    }

    [Fact]
    public void MultipleDiscounts_OnlyActiveOnesConsidered()
    {
        var price = 200m;
        var discounts = new[]
        {
            MakeDiscount("Percentage", 90m, endsAt: DateTime.UtcNow.AddDays(-1)), // expired, would give 20
            MakeDiscount("FixedAmount", 30m),                                      // active → 170
        };
        var result = DiscountCalculator.ComputeEffectivePrice(price, discounts);
        Assert.Equal(170m, result);
    }
}
