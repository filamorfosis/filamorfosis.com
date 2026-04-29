# Bugfix Design Document

## Introduction

This document provides the technical design for fixing database schema issues in the Admin site. The fixes address table naming inconsistencies, unused localization fields, unused product variant fields, and ensure the admin UI properly supports the existing many-to-many relationship between ProductVariants and Materials.

## Technical Context

### Current Architecture

**Backend Stack:**
- C# .NET 8, ASP.NET Core Web API
- Entity Framework Core 8 with SQLite (dev) / PostgreSQL (production)
- Clean architecture: Domain / Application / Infrastructure / API layers
- Identity + JWT authentication with MFA

**Frontend Stack:**
- Vanilla JavaScript (no framework)
- jQuery for DOM manipulation
- Admin interface uses modals for CRUD operations

**Database Schema (Current State):**

```
Processes
├── Id (Guid, PK)
├── Slug (string)
├── NameEs (string)
├── NameEn (string) ← TO REMOVE
├── ImageUrl (string?)
└── IsActive (bool)

CostParameters ← TO RENAME to ProcessesCosts
├── Id (Guid, PK)
├── ProcessId (Guid, FK → Processes.Id) ✓ Already proper FK
├── Key (string)
├── Label (string)
├── Unit (string)
├── Value (decimal)
└── UpdatedAt (DateTime)

Products
├── Id (Guid, PK)
├── ProcessId (Guid, FK → Processes.Id)
├── Slug (string)
├── TitleEs (string)
├── TitleEn (string) ← TO REMOVE
├── DescriptionEs (string)
├── DescriptionEn (string) ← TO REMOVE
├── Tags (string[])
├── ImageUrls (string[])
├── Badge (string?)
├── IsActive (bool)
├── CreatedAt (DateTime)
└── UseCases (string[])

ProductVariants
├── Id (Guid, PK)
├── ProductId (Guid, FK → Products.Id)
├── Sku (string)
├── LabelEs (string)
├── LabelEn (string) ← ALREADY REMOVED in migration 20260421100000
├── Price (decimal)
├── IsAvailable (bool)
├── AcceptsDesignFile (bool)
├── WasAutoPaused (bool)
├── StockQuantity (int)
├── WeightGrams (int?) ← TO REMOVE
├── BaseCost (decimal)
├── Profit (decimal)
├── ManufactureTimeMinutes (int?)
├── PrintType (string?) ← TO REMOVE
├── FilamentGrams (decimal?) ← ALREADY REMOVED in migration 20260421100000
└── SizeLabel (string?) ← ALREADY REMOVED in migration 20260421100000

Materials
├── Id (Guid, PK)
├── Name (string)
├── ProcessId (Guid, FK → Processes.Id)
├── SizeLabel (string?)
├── WidthCm (decimal?)
├── HeightCm (decimal?)
├── DepthCm (decimal?)
├── WeightGrams (int?)
├── BaseCost (decimal) ← Computed: ManualBaseCost + Σ(supply costs)
├── ManualBaseCost (decimal)
├── StockQuantity (int)
└── CreatedAt (DateTime)

VariantMaterialUsage ✓ Already exists as many-to-many
├── Id (Guid, PK)
├── VariantId (Guid, FK → ProductVariants.Id, CASCADE)
├── MaterialId (Guid, FK → Materials.Id, RESTRICT)
└── Quantity (decimal) ← Units of material used
```

**Key Findings:**
1. **CostParameters table** already has proper FK relationship with Processes (ProcessId + navigation property)
2. **VariantMaterialUsage** many-to-many table already exists and is functional
3. **Some fields already removed** in migration `20260421100000_DropVariantUnusedColumns`: FilamentGrams, LabelEn (ProductVariant), SizeLabel (ProductVariant)
4. **MaterialId field** does NOT exist in ProductVariant (many-to-many is correctly implemented)
5. **Admin UI** in `assets/js/admin-products.js` already supports material usages via `MaterialUsages` dictionary

### Files to Modify

**Backend - Entity Classes:**
- `backend/Filamorfosis.Domain/Entities/Process.cs` - Remove NameEn
- `backend/Filamorfosis.Domain/Entities/Product.cs` - Remove TitleEn, DescriptionEn
- `backend/Filamorfosis.Domain/Entities/ProductVariant.cs` - Remove WeightGrams, PrintType
- `backend/Filamorfosis.Domain/Entities/CostParameter.cs` - Rename class to ProcessCost

**Backend - DbContext:**
- `backend/Filamorfosis.Infrastructure/Data/FilamorfosisDbContext.cs` - Rename DbSet from CostParameters to ProcessesCosts

**Backend - Controllers:**
- `backend/Filamorfosis.API/Controllers/AdminCostParametersController.cs` - Update to use ProcessCost entity, rename to AdminProcessCostsController
- `backend/Filamorfosis.API/Controllers/AdminProductsController.cs` - Remove references to TitleEn, DescriptionEn in search query
- `backend/Filamorfosis.API/Controllers/AdminMaterialsController.cs` - Update references to CostParameter → ProcessCost

**Backend - DTOs:**
- `backend/Filamorfosis.Application/DTOs/CostParameterDtos.cs` - Rename to ProcessCostDtos.cs, update class names
- `backend/Filamorfosis.Application/DTOs/AdminProductDtos.cs` - Remove TitleEn, DescriptionEn, LabelEn from DTOs

**Backend - Services:**
- Search for any references to CostParameter and update to ProcessCost

**Backend - Migrations:**
- Create new migration to:
  - Rename table CostParameters → ProcessesCosts
  - Drop column Processes.NameEn
  - Drop column Products.TitleEn
  - Drop column Products.DescriptionEn
  - Drop column ProductVariants.WeightGrams
  - Drop column ProductVariants.PrintType

**Frontend - Admin UI:**
- `assets/js/admin-costs.js` - Update API calls from cost-parameters → process-costs
- `assets/js/admin-products.js` - Verify no references to removed fields, ensure material quantity validation
- `admin.html` - Update modal field references if any

**API Routes:**
- `/api/v1/admin/cost-parameters` → `/api/v1/admin/process-costs`

## Implementation Approach

### Phase 1: Backend Entity and Database Changes

**Step 1.1: Rename CostParameter Entity**
- Rename `CostParameter.cs` → `ProcessCost.cs`
- Update class name: `CostParameter` → `ProcessCost`
- Update all navigation properties in related entities (Material, MaterialSupplyUsage)

**Step 1.2: Remove English Localization Fields**
- Remove `NameEn` from `Process` entity
- Remove `TitleEn` and `DescriptionEn` from `Product` entity
- Note: `LabelEn` already removed from `ProductVariant` in previous migration

**Step 1.3: Remove Unused ProductVariant Fields**
- Remove `WeightGrams` property
- Remove `PrintType` property
- Note: `FilamentGrams`, `SizeLabel`, `MaterialId` already removed or never existed

**Step 1.4: Update DbContext**
- Rename `DbSet<CostParameter> CostParameters` → `DbSet<ProcessCost> ProcessesCosts`
- Update all `modelBuilder.Entity<CostParameter>()` → `modelBuilder.Entity<ProcessCost>()`
- Update table name mapping if explicitly set

**Step 1.5: Create EF Migration**
```csharp
// Migration: RemoveEnglishFieldsAndRenameProcessCosts
protected override void Up(MigrationBuilder migrationBuilder)
{
    // Rename table
    migrationBuilder.RenameTable(
        name: "CostParameters",
        newName: "ProcessesCosts");

    // Drop English localization columns
    migrationBuilder.DropColumn(
        name: "NameEn",
        table: "Processes");

    migrationBuilder.DropColumn(
        name: "TitleEn",
        table: "Products");

    migrationBuilder.DropColumn(
        name: "DescriptionEn",
        table: "Products");

    // Drop unused ProductVariant columns
    migrationBuilder.DropColumn(
        name: "WeightGrams",
        table: "ProductVariants");

    migrationBuilder.DropColumn(
        name: "PrintType",
        table: "ProductVariants");
}
```

### Phase 2: Backend API and Service Updates

**Step 2.1: Update DTOs**
- Rename `CostParameterDto` → `ProcessCostDto`
- Rename `UpsertCostParameterRequest` → `UpsertProcessCostRequest`
- Remove `TitleEn`, `DescriptionEn` from `ProductDetailDto`
- Remove `LabelEn` from `ProductVariantDto` (if still present)
- Remove `ProcessNameEn` from DTOs

**Step 2.2: Rename Controller**
- Rename `AdminCostParametersController.cs` → `AdminProcessCostsController.cs`
- Update route: `[Route("api/v1/admin/cost-parameters")]` → `[Route("api/v1/admin/process-costs")]`
- Update all references to `CostParameter` → `ProcessCost`
- Update `db.CostParameters` → `db.ProcessesCosts`

**Step 2.3: Update AdminProductsController**
- Remove `TitleEn` from search query:
  ```csharp
  // BEFORE:
  query = query.Where(p =>
      EF.Functions.Like(p.TitleEs, pattern) ||
      EF.Functions.Like(p.TitleEn, pattern) ||
      EF.Functions.Like(p.Slug, pattern));

  // AFTER:
  query = query.Where(p =>
      EF.Functions.Like(p.TitleEs, pattern) ||
      EF.Functions.Like(p.Slug, pattern));
  ```
- Remove `TitleEn`, `DescriptionEn` from Create/Update methods
- Remove `ProcessNameEn` from DTO mapping

**Step 2.4: Update AdminMaterialsController**
- Update all `db.CostParameters` → `db.ProcessesCosts`
- Update variable names: `costParams` → `processCosts` (optional, for clarity)

**Step 2.5: Update PricingCalculatorService**
- Search for any references to `CostParameter` and update to `ProcessCost`

### Phase 3: Frontend Admin UI Updates

**Step 3.1: Update admin-costs.js**
- Update API endpoint calls:
  ```javascript
  // BEFORE:
  adminApi.adminGetCostParameters()
  adminApi.adminUpsertCostParameter(categoryId, key, data)

  // AFTER:
  adminApi.adminGetProcessCosts()
  adminApi.adminUpsertProcessCost(processId, key, data)
  ```
- Update variable names for clarity (optional):
  - `_costParams` → `_processCosts`
  - `costParameterId` → `processCostId`

**Step 3.2: Update admin-api.js**
- Rename API methods:
  ```javascript
  adminGetCostParameters: () => get('/admin/cost-parameters'),
  // TO:
  adminGetProcessCosts: () => get('/admin/process-costs'),

  adminUpsertCostParameter: (processId, key, data) => 
    put(`/admin/cost-parameters/${processId}/${key}`, data),
  // TO:
  adminUpsertProcessCost: (processId, key, data) => 
    put(`/admin/process-costs/${processId}/${key}`, data),
  ```

**Step 3.3: Update admin-products.js**
- Verify no references to `titleEn`, `descriptionEn`, `labelEn` in form fields
- Verify material quantity validation exists:
  ```javascript
  // Should already exist in _validateMaterialUsages
  if (qty <= 0) {
    return "La cantidad debe ser mayor a 0.";
  }
  ```
- Ensure stock validation is present (should already exist via backend)

**Step 3.4: Update admin.html**
- Search for any hardcoded field IDs or names referencing removed fields
- Verify modal forms don't reference `titleEn`, `descriptionEn`, `labelEn`, `weightGrams`, `printType`
- Ensure UTF-8 encoding is preserved (no changes to character encoding)

**Step 3.5: Verify Material Usage UI**
- Confirm `admin-products.js` already has material selection UI (it does, based on code review)
- Confirm quantity input exists for each material
- Confirm production cost calculation: `BaseCost = Σ(material.BaseCost × quantity) + (manufactureTime × electricRate)`

### Phase 4: Verification and Testing

**Step 4.1: Verify No Product Category References**
- Search entire codebase for:
  - `ProductCategory` (class name)
  - `product_category` (table name)
  - `CategoryId` in Product context (not Process context)
- Expected result: No matches (only Process/Category for manufacturing processes)

**Step 4.2: Backend Compilation**
- Run `dotnet build` in `backend/Filamorfosis.API`
- Verify no compilation errors
- Verify all references to `CostParameter` are updated to `ProcessCost`

**Step 4.3: Migration Application**
- Run `dotnet ef migrations add RemoveEnglishFieldsAndRenameProcessCosts`
- Review generated migration
- Apply migration: `dotnet ef database update`
- Verify table renamed and columns dropped

**Step 4.4: API Testing**
- Test GET `/api/v1/admin/process-costs` - should return grouped process costs
- Test PUT `/api/v1/admin/process-costs/{processId}/{key}` - should update cost
- Test GET `/api/v1/admin/products` - should work without TitleEn
- Test POST `/api/v1/admin/products/{id}/variants` with materials - should validate quantities

**Step 4.5: Admin UI Testing**
- Open admin.html in browser
- Navigate to Materials tab:
  - Create a material with multiple supply usages
  - Verify cost calculation works
  - Verify stock quantity is saved
- Navigate to Products tab:
  - Create a product (verify no English fields)
  - Add a variant with multiple materials
  - Verify material quantity inputs appear
  - Verify production cost calculation
  - Try to add more material quantity than stock - should fail
- Navigate to Processes tab:
  - Edit a process (verify no NameEn field)
  - Update process costs
  - Verify costs save correctly

**Step 4.6: UTF-8 Encoding Verification**
- After all changes, verify no replacement characters (�) in JS files
- Verify Spanish characters (á, é, í, ó, ú, ñ, ¿, ¡) display correctly
- Verify emoji characters in badges render correctly

## Data Migration Considerations

**No Data Loss:**
- Table rename preserves all data
- Column drops only affect unused fields
- No foreign key relationships are broken

**Backward Compatibility:**
- API route change requires frontend update (breaking change)
- Deploy backend and frontend together
- Consider adding route alias for transition period:
  ```csharp
  [Route("api/v1/admin/cost-parameters")] // Old route (deprecated)
  [Route("api/v1/admin/process-costs")]   // New route
  ```

**Rollback Plan:**
- Migration Down() method restores dropped columns with default values
- Table rename is reversible
- Keep backup before applying migration in production

## Edge Cases and Validation

**Edge Case 1: Material Quantity Exceeds Stock**
- **Current behavior**: Backend validates in `_validateMaterialUsages` (quantity > 0)
- **Expected behavior**: Should also validate quantity ≤ material.StockQuantity
- **Solution**: Add stock validation in `AdminProductsController._validateMaterialUsages`:
  ```csharp
  var material = await db.Materials.FindAsync(materialId);
  if (material == null) return BadRequest("Material not found");
  if (qty > material.StockQuantity)
      return BadRequest($"Cantidad solicitada ({qty}) excede stock disponible ({material.StockQuantity})");
  ```

**Edge Case 2: Empty Material Usages**
- **Current behavior**: Variant can be created with zero materials
- **Expected behavior**: Allow zero materials (some variants may not use materials)
- **Solution**: No change needed

**Edge Case 3: Process Cost Update Affects Material Costs**
- **Current behavior**: `AdminCostParametersController.Upsert` already recomputes affected material costs
- **Expected behavior**: Continue this behavior after rename
- **Solution**: No change needed (logic preserved)

**Edge Case 4: Existing Data with English Fields**
- **Current behavior**: English fields may contain data
- **Expected behavior**: Data is dropped (acceptable per requirements)
- **Solution**: Migration drops columns, data is lost (confirmed acceptable)

## Security Considerations

**No Security Impact:**
- Schema changes don't affect authentication/authorization
- All endpoints remain protected by `[Authorize(Roles = "Master,PriceManagement")]` and `[RequireMfa]`
- No new attack surface introduced

**UTF-8 Encoding:**
- Ensure all file saves preserve UTF-8 encoding
- Verify no encoding corruption during find/replace operations
- Test Spanish and emoji characters after changes

## Performance Considerations

**No Performance Impact:**
- Table rename is metadata-only operation (instant)
- Column drops reduce table size (minor improvement)
- Removing TitleEn from search query reduces query complexity (minor improvement)
- No new indexes needed

## Rollout Strategy

**Development:**
1. Apply entity changes
2. Generate and apply migration
3. Update controllers and DTOs
4. Update frontend API calls
5. Test all admin functionality

**Staging:**
1. Deploy backend with migration
2. Deploy frontend with updated API calls
3. Run full admin workflow tests
4. Verify no encoding issues

**Production:**
1. Backup database
2. Deploy backend (apply migration automatically on startup)
3. Deploy frontend immediately after
4. Monitor for errors
5. Verify admin functionality

**Rollback:**
- If issues found, revert backend and frontend deployments
- Run migration Down() to restore schema
- Restore from backup if needed
