using Filamorfosis.Application.Services;

namespace Filamorfosis.Infrastructure.Services;

public class StockService : IStockService
{
    public bool IsVariantInStock(IEnumerable<int> materialStockQuantities)
    {
        var quantities = materialStockQuantities.ToList();
        if (quantities.Count == 0) return true;   // no materials = not stock-gated
        return quantities.All(q => q > 0);
    }
}
