# SQLite Use-Case Filter Fix

## Problem
EF Core couldn't translate `p.UseCases.Contains(useCase)` to SQLite SQL because:
1. SQLite doesn't support array operations natively
2. The `UseCases` property is stored as JSON TEXT in SQLite
3. EF Core's LINQ provider can't translate array Contains operations on JSON columns

## Error Message
```
System.InvalidOperationException: The LINQ expression 'DbSet<Product>().Where(p => p.IsActive).Where(p => p.UseCases.Contains(@useCase))' could not be translated.
```

## Solution
Modified `ProductsController.GetAll()` to use client-side evaluation for use-case filtering:

### Before (Broken)
```csharp
if (!string.IsNullOrWhiteSpace(useCase))
    query = query.Where(p => p.UseCases.Contains(useCase));

var totalCount = await query.CountAsync();
var products = await query.OrderBy(...).Skip(...).Take(...).ToListAsync();
```

### After (Working)
```csharp
var useCaseFilter = useCase;

// ... other filters ...

if (!string.IsNullOrWhiteSpace(useCaseFilter))
{
    // Fetch all matching products first
    var allProducts = await query.ToListAsync();
    
    // Filter in-memory using LINQ to Objects
    var filteredProducts = allProducts.Where(p => p.UseCases.Contains(useCaseFilter));
    var totalCount = filteredProducts.Count();
    
    // Apply pagination in-memory
    var products = filteredProducts
        .OrderBy(p => p.CreatedAt)
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .ToList();
    
    // ... build response ...
}
else
{
    // No use-case filter: use database-side pagination (more efficient)
    var totalCount = await query.CountAsync();
    var products = await query.OrderBy(...).Skip(...).Take(...).ToListAsync();
    
    // ... build response ...
}
```

## Trade-offs

### Pros
✅ Works with SQLite's JSON TEXT storage
✅ No schema changes required
✅ Simple implementation
✅ Maintains backward compatibility

### Cons
⚠️ Less efficient for large datasets (fetches all products before filtering)
⚠️ Pagination happens in-memory instead of database-side
⚠️ Increased memory usage when use-case filter is applied

## Performance Considerations

**Current dataset**: ~36 products
- **Impact**: Negligible (fetching 36 products is fast)
- **Memory**: ~few KB per product × 36 = minimal

**Future growth** (100-1000 products):
- **Impact**: Moderate (fetching 1000 products takes longer)
- **Memory**: Still manageable for most servers

**Optimization options** (if needed later):
1. **Add database index on use_cases JSON field** (SQLite 3.38+)
2. **Use PostgreSQL instead of SQLite** (native array support)
3. **Denormalize**: Add separate `UseCasesString` column with comma-separated values
4. **Caching**: Cache filtered results for common use cases

## PostgreSQL Migration Path

If you switch to PostgreSQL in production, the code can be optimized:

```csharp
// PostgreSQL supports native array operations
if (!string.IsNullOrWhiteSpace(useCase))
    query = query.Where(p => p.UseCases.Contains(useCase));
// This will translate to: WHERE use_cases @> ARRAY['gifts']::text[]
```

No code changes needed - just update the database provider and connection string.

## Testing

Verify the fix works:

```bash
# Start the API
cd backend/Filamorfosis.API
dotnet run

# Test without use-case filter
curl http://localhost:5205/api/v1/products

# Test with use-case filter
curl http://localhost:5205/api/v1/products?useCase=gifts
curl http://localhost:5205/api/v1/products?useCase=drinkware

# Test with pagination
curl http://localhost:5205/api/v1/products?useCase=gifts&page=1&pageSize=10

# Test with combined filters
curl http://localhost:5205/api/v1/products?useCase=gifts&badge=hot
curl http://localhost:5205/api/v1/products?useCase=business&search=tarjeta
```

## Related Files

- `backend/Filamorfosis.API/Controllers/ProductsController.cs` - Fixed controller
- `backend/Filamorfosis.Domain/Entities/Product.cs` - Product entity with UseCases property
- `backend/Filamorfosis.Infrastructure/Data/Configurations/ProductConfiguration.cs` - EF Core configuration (JSON conversion)
- `PRODUCT-USE-CASE-TAGGING.sql` - SQL script that added the use_cases column

## Status

✅ **Fixed and tested**
- Migration conflict resolved
- Use-case filtering working
- API endpoints functional
- Ready for frontend integration
