namespace Filamorfosis.Application.Services.Requests;

/// <summary>
/// Generic input for pricing calculation.
/// BaseCost = MaterialCost + Σ(supply.costPerUnit × quantity) + (minutes/60 × electricPerHour)
/// </summary>
/// <param name="MaterialBaseCost">Base cost of the selected material (MXN).</param>
/// <param name="ManufactureTimeMinutes">Production time in minutes (for electricity cost).</param>
/// <param name="SupplyUsages">
/// Dict of supplyKey → quantity consumed.
/// e.g. { "ink_cost_flat_per_cm2": 50, "filament_pla_per_gram": 120 }
/// </param>
/// <param name="CostParams">
/// All cost parameters for the category, keyed by parameter key.
/// Also includes "electric_cost_per_hour" from global parameters.
/// </param>
public record ComputeBaseCostRequest(
    decimal MaterialBaseCost,
    int? ManufactureTimeMinutes,
    IReadOnlyDictionary<string, decimal> SupplyUsages,
    IReadOnlyDictionary<string, decimal> CostParams
);
