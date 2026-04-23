using Filamorfosis.Application.Services;
using Filamorfosis.Application.Services.Requests;
using Filamorfosis.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Filamorfosis.Infrastructure.Services;

/// <summary>
/// Generic pricing calculator.
/// BaseCost = MaterialCost + Σ(supply.costPerUnit × quantity) + (minutes/60 × electricPerHour)
/// Price    = (BaseCost + Profit) × (1 + IVA)
/// </summary>
public class PricingCalculatorService(FilamorfosisDbContext db) : IPricingCalculatorService
{
    public Task<decimal> ComputeBaseCostAsync(ComputeBaseCostRequest request)
    {
        var electricPerHour = GetParam(request.CostParams, "electric_cost_per_hour");
        var manufactureHours = (request.ManufactureTimeMinutes ?? 0) / 60m;

        // Sum all supply usages: each entry is { supplyKey -> quantity }
        var supplyCost = request.SupplyUsages
            .Sum(kv => GetParam(request.CostParams, kv.Key) * kv.Value);

        var baseCost = request.MaterialBaseCost
                     + supplyCost
                     + (manufactureHours * electricPerHour);

        if (baseCost < 0)
            throw new ArgumentOutOfRangeException(nameof(baseCost), "BaseCost cannot be negative.");

        return Task.FromResult(baseCost);
    }

    public async Task<decimal> ComputePriceAsync(decimal baseCost, decimal profit)
    {
        if (baseCost < 0) throw new ArgumentOutOfRangeException(nameof(baseCost));
        if (profit < 0)   throw new ArgumentOutOfRangeException(nameof(profit));

        var param = await db.GlobalParameters.AsNoTracking()
            .FirstOrDefaultAsync(p => p.Key == "tax_rate");

        var taxRate = param is not null && decimal.TryParse(param.Value, out var parsed)
            ? parsed : 0.16m;

        return (baseCost + profit) * (1 + taxRate);
    }

    public decimal ComputePrice(decimal baseCost, decimal profit, decimal taxRate)
    {
        if (baseCost < 0) throw new ArgumentOutOfRangeException(nameof(baseCost));
        if (profit < 0)   throw new ArgumentOutOfRangeException(nameof(profit));
        if (taxRate < 0)  throw new ArgumentOutOfRangeException(nameof(taxRate));
        return (baseCost + profit) * (1 + taxRate);
    }

    public decimal ComputeVariantBaseCost(
        IEnumerable<(decimal materialBaseCost, decimal quantity)> materialUsages,
        int? manufactureTimeMinutes,
        decimal electricCostPerHour)
    {
        var materialCost = materialUsages.Sum(u => u.materialBaseCost * u.quantity);
        var electricCost = (manufactureTimeMinutes ?? 0) / 60m * electricCostPerHour;
        return materialCost + electricCost;
    }

    public decimal ComputeMaterialBaseCost(IEnumerable<(decimal unitCost, decimal quantity)> usages)
    {
        return usages.Sum(u => u.unitCost * u.quantity);
    }

    private static decimal GetParam(IReadOnlyDictionary<string, decimal> p, string key)
        => p.TryGetValue(key, out var v) ? v : 0m;
}
