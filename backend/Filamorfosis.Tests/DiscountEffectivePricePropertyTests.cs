// Feature: admin-store-management, Property 9: Discount effectivePrice calculation

using Filamorfosis.Application;
using Filamorfosis.Domain.Entities;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;

namespace Filamorfosis.Tests;

/// <summary>
/// Property-based tests for <see cref="DiscountCalculator.ComputeEffectivePrice"/>.
/// Covers Property 9 from the admin-store-management spec.
/// Validates: Requirements 4.4, 4.5, 4.6, 4.7
/// </summary>
public class DiscountEffectivePricePropertyTests
{
    // ── Generators ────────────────────────────────────────────────────────────

    /// <summary>Generates a positive price between 0.01 and 10000 (2 decimal places).</summary>
    private static Gen<decimal> PriceGen() =>
        Gen.Choose(1, 1_000_000)
           .Select(cents => cents / 100m); // range: 0.01 to 10000.00

    /// <summary>Generates a percentage value between 0 and 100 (whole numbers).</summary>
    private static Gen<decimal> PercentageValueGen() =>
        Gen.Choose(0, 100).Select(v => (decimal)v);

    /// <summary>Generates a positive fixed-amount discount value (0.01 to 5000).</summary>
    private static Gen<decimal> FixedValueGen() =>
        Gen.Choose(1, 500_000).Select(cents => cents / 100m);

    /// <summary>
    /// Generates an active <see cref="Discount"/> with null bounds (always active).
    /// </summary>
    private static Gen<Discount> ActivePercentageDiscountGen() =>
        from value in PercentageValueGen()
        select new Discount
        {
            Id = Guid.NewGuid(),
            DiscountType = "Percentage",
            Value = value,
            StartsAt = null,
            EndsAt = null,
            CreatedAt = DateTime.UtcNow
        };

    /// <summary>
    /// Generates an active <see cref="Discount"/> with null bounds (always active).
    /// </summary>
    private static Gen<Discount> ActiveFixedAmountDiscountGen() =>
        from value in FixedValueGen()
        select new Discount
        {
            Id = Guid.NewGuid(),
            DiscountType = "FixedAmount",
            Value = value,
            StartsAt = null,
            EndsAt = null,
            CreatedAt = DateTime.UtcNow
        };

    /// <summary>
    /// Generates an inactive discount — either future (StartsAt in future)
    /// or expired (EndsAt in the past).
    /// </summary>
    private static Gen<Discount> InactiveDiscountGen() =>
        Gen.OneOf(
            // Future discount
            from value in PercentageValueGen()
            select new Discount
            {
                Id = Guid.NewGuid(),
                DiscountType = "Percentage",
                Value = value,
                StartsAt = DateTime.UtcNow.AddDays(1),
                EndsAt = DateTime.UtcNow.AddDays(10),
                CreatedAt = DateTime.UtcNow
            },
            // Expired discount
            from value in PercentageValueGen()
            select new Discount
            {
                Id = Guid.NewGuid(),
                DiscountType = "Percentage",
                Value = value,
                StartsAt = DateTime.UtcNow.AddDays(-10),
                EndsAt = DateTime.UtcNow.AddDays(-1),
                CreatedAt = DateTime.UtcNow.AddDays(-10)
            },
            // Future FixedAmount discount
            from value in FixedValueGen()
            select new Discount
            {
                Id = Guid.NewGuid(),
                DiscountType = "FixedAmount",
                Value = value,
                StartsAt = DateTime.UtcNow.AddDays(1),
                EndsAt = DateTime.UtcNow.AddDays(10),
                CreatedAt = DateTime.UtcNow
            }
        );

    // ── Property 9a: Percentage discount formula ──────────────────────────────
    // For any variant with an active Percentage discount,
    // effectivePrice = price * (1 - value / 100)
    // Validates: Requirements 4.4, 4.5

    [Property(MaxTest = 100)]
    public Property ActivePercentageDiscount_EffectivePrice_MatchesFormula()
    {
        return Prop.ForAll(
            Arb.From(PriceGen()),
            Arb.From(ActivePercentageDiscountGen()),
            (price, discount) =>
            {
                var result = DiscountCalculator.ComputeEffectivePrice(price, [discount]);
                var expected = price * (1 - discount.Value / 100m);
                // Allow a tiny rounding tolerance for decimal arithmetic
                return Math.Abs(result - expected) < 0.0001m;
            });
    }

    // ── Property 9b: FixedAmount discount formula ─────────────────────────────
    // For any variant with an active FixedAmount discount,
    // effectivePrice = max(0, price - value)
    // Validates: Requirements 4.4, 4.6

    [Property(MaxTest = 100)]
    public Property ActiveFixedAmountDiscount_EffectivePrice_MatchesFormula()
    {
        return Prop.ForAll(
            Arb.From(PriceGen()),
            Arb.From(ActiveFixedAmountDiscountGen()),
            (price, discount) =>
            {
                var result = DiscountCalculator.ComputeEffectivePrice(price, [discount]);
                var expected = Math.Max(0m, price - discount.Value);
                return Math.Abs(result - expected) < 0.0001m;
            });
    }

    // ── Property 9c: No active discount → effectivePrice equals price ─────────
    // For any variant with no active discount (expired or future),
    // effectivePrice = price
    // Validates: Requirements 4.4, 4.7

    [Property(MaxTest = 100)]
    public Property NoActiveDiscount_EffectivePrice_EqualsPrice()
    {
        return Prop.ForAll(
            Arb.From(PriceGen()),
            Arb.From(InactiveDiscountGen()),
            (price, inactiveDiscount) =>
            {
                var result = DiscountCalculator.ComputeEffectivePrice(price, [inactiveDiscount]);
                return result == price;
            });
    }

    // ── Property 9d: Empty discounts list → effectivePrice equals price ───────
    // Validates: Requirements 4.7

    [Property(MaxTest = 100)]
    public Property EmptyDiscounts_EffectivePrice_EqualsPrice()
    {
        return Prop.ForAll(
            Arb.From(PriceGen()),
            price =>
            {
                var result = DiscountCalculator.ComputeEffectivePrice(price, []);
                return result == price;
            });
    }

    // ── Property 9e: FixedAmount discount never produces negative price ────────
    // effectivePrice is always >= 0 regardless of the discount value
    // Validates: Requirements 4.6

    [Property(MaxTest = 100)]
    public Property FixedAmountDiscount_EffectivePrice_NeverNegative()
    {
        return Prop.ForAll(
            Arb.From(PriceGen()),
            Arb.From(ActiveFixedAmountDiscountGen()),
            (price, discount) =>
            {
                var result = DiscountCalculator.ComputeEffectivePrice(price, [discount]);
                return result >= 0m;
            });
    }
}
