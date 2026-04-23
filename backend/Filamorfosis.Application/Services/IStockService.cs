namespace Filamorfosis.Application.Services;

public interface IStockService
{
    /// <summary>
    /// Returns true if ALL materials referenced by the variant have StockQuantity > 0.
    /// Returns true if the variant has no material usages (no materials = not stock-gated).
    /// </summary>
    bool IsVariantInStock(IEnumerable<int> materialStockQuantities);
}
