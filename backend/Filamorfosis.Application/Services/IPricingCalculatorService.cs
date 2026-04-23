using Filamorfosis.Application.Services.Requests;

namespace Filamorfosis.Application.Services;

/// <summary>
/// Computes BaseCost and Price for product variants based on category-specific formulas.
/// </summary>
public interface IPricingCalculatorService
{
    /// <summary>
    /// Computes BaseCost for a variant based on its category's formula.
    /// Throws <see cref="ArgumentOutOfRangeException"/> if any input is negative.
    /// </summary>
    Task<decimal> ComputeBaseCostAsync(ComputeBaseCostRequest request);

    /// <summary>
    /// Computes the tax-inclusive Price.
    /// Price = (baseCost + profit) × (1 + taxRate)
    /// Reads TaxRate from GlobalParameter at call time.
    /// Throws <see cref="ArgumentOutOfRangeException"/> if baseCost or profit is negative.
    /// </summary>
    Task<decimal> ComputePriceAsync(decimal baseCost, decimal profit);

    /// <summary>
    /// Overload that accepts an explicit taxRate (for preview/testing).
    /// Throws <see cref="ArgumentOutOfRangeException"/> if baseCost, profit, or taxRate is negative.
    /// </summary>
    decimal ComputePrice(decimal baseCost, decimal profit, decimal taxRate);

    /// <summary>
    /// Computes Variant_Base_Cost = Σ(Material.BaseCost × VariantMaterialUsage.Quantity)
    ///                             + (ManufactureTimeMinutes / 60 × electricCostPerHour).
    /// </summary>
    decimal ComputeVariantBaseCost(
        IEnumerable<(decimal materialBaseCost, decimal quantity)> materialUsages,
        int? manufactureTimeMinutes,
        decimal electricCostPerHour);

    /// <summary>
    /// Computes Material_Base_Cost = Σ(CostParameter.Value × MaterialSupplyUsage.Quantity).
    /// Returns 0 if usages is empty.
    /// </summary>
    decimal ComputeMaterialBaseCost(IEnumerable<(decimal unitCost, decimal quantity)> usages);
}
