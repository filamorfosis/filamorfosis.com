using Filamorfosis.Application.Services;

namespace Filamorfosis.Infrastructure.Services;

public class StockService : IStockService
{
    public bool IsVariantInStock(IEnumerable<(decimal stock, decimal required)> materialUsages)
    {
        var usages = materialUsages.ToList();
        if (usages.Count == 0) return true;   // no materials = not stock-gated
        return usages.All(u => u.stock >= u.required);
    }
}
