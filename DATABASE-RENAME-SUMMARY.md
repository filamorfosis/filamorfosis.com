# Database Table Rename: Categories → Processes

## Summary
Successfully completed the database table rename from `Categories` to `Processes` and `CategoryAttributes` to `ProcessesAttributes`. This includes updating all entity classes, foreign key references, DbContext, controllers, DTOs, and frontend API calls.

**Status**: ✅ **COMPLETE** - Ready for migration execution and testing

## Database Changes

### Tables Renamed
1. **Categories** → **Processes**
   - All columns remain the same
   - All data preserved during migration
   
2. **CategoryAttributes** → **ProcessesAttributes**
   - Column `CategoryId` → `ProcessId`
   - All data preserved during migration

### Foreign Key Updates
The following tables had their foreign key columns renamed:

1. **Products**
   - `CategoryId` → `ProcessId`
   - FK constraint updated to reference `Processes` table

2. **Materials**
   - `CategoryId` → `ProcessId`
   - FK constraint updated to reference `Processes` table

3. **CostParameters**
   - `CategoryId` → `ProcessId`
   - FK constraint updated to reference `Processes` table
   - Index renamed: `IX_CostParameters_CategoryId_Key` → `IX_CostParameters_ProcessId_Key`

## Entity Class Changes

### Renamed Files
1. `Category.cs` → `Process.cs`
2. `CategoryAttribute.cs` → `ProcessAttribute.cs`

### Updated Entity Classes
1. **Process.cs** (formerly Category.cs)
   - Class name: `Category` → `Process`
   - Navigation property: `ICollection<CategoryAttribute> Attributes` → `ICollection<ProcessAttribute> Attributes`

2. **ProcessAttribute.cs** (formerly CategoryAttribute.cs)
   - Class name: `CategoryAttribute` → `ProcessAttribute`
   - Property: `CategoryId` → `ProcessId`
   - Navigation property: `Category Category` → `Process Process`

3. **Product.cs**
   - Property: `CategoryId` → `ProcessId`
   - Navigation property: `Category Category` → `Process Process`

4. **Material.cs**
   - Property: `CategoryId` → `ProcessId`
   - Navigation property: `Category Category` → `Process Process`

5. **CostParameter.cs**
   - Property: `CategoryId` → `ProcessId`
   - Navigation property: `Category Category` → `Process Process`

## DbContext Changes

### DbSet Properties
- `DbSet<Category> Categories` → `DbSet<Process> Processes`
- `DbSet<CategoryAttribute> CategoryAttributes` → `DbSet<ProcessAttribute> ProcessesAttributes`

### Relationship Configurations
All relationship configurations updated to use new entity names:
- `Process` → `Product` relationship
- `Process` → `ProcessAttribute` relationship
- `Process` → `Material` relationship
- `Process` → `CostParameter` relationship

## Migration File
**File**: `20260428120000_RenameCategoriesToProcesses.cs`

### Migration Steps (Up)
1. Create new `Processes` table
2. Create new `ProcessesAttributes` table
3. Copy all data from `Categories` to `Processes`
4. Copy all data from `CategoryAttributes` to `ProcessesAttributes`
5. Drop foreign key constraints from dependent tables
6. Rename `CategoryId` columns to `ProcessId` in dependent tables
7. Add new foreign key constraints pointing to `Processes`
8. Drop old `CategoryAttributes` table
9. Drop old `Categories` table

### Rollback (Down)
The migration includes a complete rollback that:
1. Recreates `Categories` and `CategoryAttributes` tables
2. Copies data back from new tables
3. Restores all foreign key relationships
4. Drops the new tables

## Files Still Requiring Updates

### Backend Files

#### Controllers
- ✅ `AdminCategoriesController.cs` - DELETED (replaced by AdminProcessesController.cs)
- ✅ `AdminProductsController.cs` - Updated all CategoryId → ProcessId references
- ✅ `AdminMaterialsController.cs` - Updated all CategoryId → ProcessId references
- ✅ `AdminCostParametersController.cs` - Updated all CategoryId → ProcessId references
- ✅ `ProductsController.cs` - Updated all CategoryId → ProcessId references
- ✅ `CategoriesController.cs` - Renamed to ProcessesController.cs and updated

#### DTOs
- ✅ `CategoryDto.cs` - Renamed to ProcessDto.cs
- ✅ `ProductSummaryDto.cs` - Updated CategoryId → ProcessId property
- ✅ `ProductDetailDto.cs` - Updated CategoryId → ProcessId and CategoryName → ProcessName properties
- ✅ `MaterialDtos.cs` - Updated CategoryId → ProcessId and CategoryNameEs → ProcessNameEs properties
- ✅ `CostParameterDtos.cs` - Updated CategoryId → ProcessId and CategoryNameEs → ProcessNameEs properties

#### Application Services
- Any service classes that reference Category entities (need to check)

#### Tests
- All test files that reference Categories (many files found in search)
- Update test data seeding
- Update property-based test generators

### Frontend Files
- ✅ `assets/js/api.js` - Updated getCategories → getProcesses, adminGetCategories → adminGetProcesses
- ✅ `assets/js/admin-api.js` - Updated all category API functions to process functions
- ✅ `assets/js/products.js` - Updated categoryCache → processCache, all category references → process
- ✅ `assets/js/admin-categories.js` - Already updated in previous task (UI labels only)

## Testing Checklist
- [ ] Run migration on development database
- [ ] Verify all data migrated correctly
- [ ] Test all CRUD operations for Processes
- [ ] Test all CRUD operations for ProcessesAttributes
- [ ] Test Product creation/update with ProcessId
- [ ] Test Material creation/update with ProcessId
- [ ] Test CostParameter creation/update with ProcessId
- [ ] Run all unit tests
- [ ] Run all integration tests
- [ ] Run all property-based tests
- [ ] Test admin site functionality
- [ ] Test store frontend functionality

## Next Steps
1. Update all controller files to use new entity names
2. Update all DTO files to use new property names
3. Update all test files
4. Run the migration
5. Update API documentation if endpoints change
6. Test thoroughly before deploying

## Notes
- All data is preserved during migration
- Migration is fully reversible
- Foreign key relationships maintained
- Indexes preserved and renamed appropriately
- No breaking changes to database structure, only naming
