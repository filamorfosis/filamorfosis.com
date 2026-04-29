# Implementation Tasks

## 📊 Overall Progress Summary

**Phase 1: Backend Entity and Database Changes** - ✅ 100% Complete (5/5 tasks)
- ✅ Entity renames and field removals complete
- ✅ Migration created and applied

**Phase 2: Backend API and Service Updates** - ✅ 100% Complete (7/7 tasks)
- ✅ DTOs fully updated (ProcessCost rename + English fields removed)
- ✅ Admin controllers updated
- ✅ Public controllers updated (ProductsController, OrdersController, CartController, AdminOrdersController)
- ✅ Backend compiles successfully

**Phase 3: Frontend Admin UI Updates** - ✅ 100% Complete (4/4 tasks)
- ✅ admin-api.js updated
- ✅ admin-costs.js updated
- ✅ admin-products.js updated
- ✅ admin.html verified (no changes needed)

**Phase 4: Verification and Testing** - ❌ 0% Complete (0/6 tasks)

**Phase 5: Documentation and Cleanup** - ❌ 0% Complete (0/3 tasks)

---

## 🚨 Critical Blockers

**None** - All critical blockers resolved! ✅

---

## Phase 1: Backend Entity and Database Changes

### 1.1 Rename CostParameter Entity to ProcessCost

**Files to modify:**
- `backend/Filamorfosis.Domain/Entities/CostParameter.cs` → rename to `ProcessCost.cs`
- `backend/Filamorfosis.Domain/Entities/Material.cs`
- `backend/Filamorfosis.Domain/Entities/MaterialSupplyUsage.cs`

**Steps:**
1. Rename file `CostParameter.cs` to `ProcessCost.cs`
2. Rename class `CostParameter` to `ProcessCost`
3. Update navigation property in `Material` entity (if any)
4. Update navigation property in `MaterialSupplyUsage` entity: `CostParameter` → `ProcessCost`

**Acceptance Criteria:**
- [x] File renamed to `ProcessCost.cs`
- [x] Class renamed to `ProcessCost`
- [x] All navigation properties updated
- [x] No compilation errors in Domain project

### 1.2 Remove English Localization Fields from Entities

**Files to modify:**
- `backend/Filamorfosis.Domain/Entities/Process.cs`
- `backend/Filamorfosis.Domain/Entities/Product.cs`

**Steps:**
1. Remove `NameEn` property from `Process` entity
2. Remove `TitleEn` property from `Product` entity
3. Remove `DescriptionEn` property from `Product` entity

**Acceptance Criteria:**
- [x] `NameEn` removed from `Process`
- [x] `TitleEn` removed from `Product`
- [x] `DescriptionEn` removed from `Product`
- [x] No compilation errors in Domain project

### 1.3 Remove Unused ProductVariant Fields

**Files to modify:**
- `backend/Filamorfosis.Domain/Entities/ProductVariant.cs`

**Steps:**
1. Remove `WeightGrams` property
2. Remove `PrintType` property
3. Verify `FilamentGrams`, `SizeLabel`, `MaterialId` do not exist (already removed)

**Acceptance Criteria:**
- [x] `WeightGrams` property removed
- [x] `PrintType` property removed
- [x] `LabelEn` property removed (bonus)
- [x] No compilation errors in Domain project

### 1.4 Update DbContext

**Files to modify:**
- `backend/Filamorfosis.Infrastructure/Data/FilamorfosisDbContext.cs`

**Steps:**
1. Rename `DbSet<CostParameter> CostParameters` to `DbSet<ProcessCost> ProcessesCosts`
2. Update all `modelBuilder.Entity<CostParameter>()` to `modelBuilder.Entity<ProcessCost>()`
3. Update FK configuration for `MaterialSupplyUsage.CostParameter` → `ProcessCost`
4. Update FK configuration for `CostParameter.Process` → `ProcessCost.Process`

**Acceptance Criteria:**
- [x] DbSet renamed to `ProcessesCosts`
- [x] All `modelBuilder.Entity<CostParameter>()` updated to `ProcessCost`
- [x] FK configurations updated
- [x] No compilation errors in Infrastructure project

### 1.5 Create and Apply EF Migration

**Files to create:**
- `backend/Filamorfosis.Infrastructure/Migrations/YYYYMMDDHHMMSS_RemoveEnglishFieldsAndRenameProcessCosts.cs`

**Steps:**
1. Run `dotnet ef migrations add RemoveEnglishFieldsAndRenameProcessCosts --project backend/Filamorfosis.Infrastructure --startup-project backend/Filamorfosis.API`
2. Review generated migration
3. Verify migration includes:
   - Rename table `CostParameters` → `ProcessesCosts`
   - Drop column `Processes.NameEn`
   - Drop column `Products.TitleEn`
   - Drop column `Products.DescriptionEn`
   - Drop column `ProductVariants.WeightGrams`
   - Drop column `ProductVariants.PrintType`
4. Apply migration: `dotnet ef database update --project backend/Filamorfosis.Infrastructure --startup-project backend/Filamorfosis.API`

**Acceptance Criteria:**
- [x] Migration created successfully
- [x] Migration includes table rename
- [x] Migration includes all column drops
- [x] Migration applied without errors
- [x] Database schema updated correctly

## Phase 2: Backend API and Service Updates

### 2.1 Update DTOs

**Files to modify:**
- `backend/Filamorfosis.Application/DTOs/CostParameterDtos.cs` → rename to `ProcessCostDtos.cs`
- `backend/Filamorfosis.Application/DTOs/AdminProductDtos.cs`
- `backend/Filamorfosis.Application/DTOs/ProductSummaryDto.cs`
- `backend/Filamorfosis.Application/DTOs/ProductDetailDto.cs`
- `backend/Filamorfosis.Application/DTOs/OrderDtos.cs`
- `backend/Filamorfosis.Application/DTOs/CartDtos.cs`

**Steps:**
1. Rename file `CostParameterDtos.cs` to `ProcessCostDtos.cs`
2. Rename `CostParameterDto` to `ProcessCostDto`
3. Rename `UpsertCostParameterRequest` to `UpsertProcessCostRequest`
4. Remove `TitleEn` and `DescriptionEn` from `ProductSummaryDto`
5. Remove `TitleEn` and `DescriptionEn` from `ProductDetailDto` (if present)
6. Remove `ProcessNameEn` from `ProductDetailDto` (if present)
7. Remove `ProductTitleEn` and `VariantLabelEn` from `OrderItemDto`
8. Remove `ProductTitleEn` and `VariantLabelEn` from `CartItemDto`
9. Remove `LabelEn` from `ProductVariantDto` (if still present)

**Acceptance Criteria:**
- [x] File renamed to `ProcessCostDtos.cs`
- [x] All DTO classes renamed
- [x] English fields removed from ProductSummaryDto
- [x] English fields removed from ProductDetailDto
- [x] English fields removed from OrderItemDto
- [x] English fields removed from CartItemDto
- [x] No compilation errors in Application project

**Status:** ✅ COMPLETED

### 2.2 Rename and Update AdminCostParametersController

**Files to modify:**
- `backend/Filamorfosis.API/Controllers/AdminCostParametersController.cs` → rename to `AdminProcessCostsController.cs`

**Steps:**
1. Rename file to `AdminProcessCostsController.cs`
2. Rename class to `AdminProcessCostsController`
3. Update route attribute: `[Route("api/v1/admin/cost-parameters")]` → `[Route("api/v1/admin/process-costs")]`
4. Update all `db.CostParameters` to `db.ProcessesCosts`
5. Update all `CostParameter` type references to `ProcessCost`
6. Update all `CostParameterDto` to `ProcessCostDto`
7. Update all `UpsertCostParameterRequest` to `UpsertProcessCostRequest`
8. Update variable names for clarity (optional)

**Acceptance Criteria:**
- [x] File renamed to `AdminProcessCostsController.cs`
- [x] Class renamed
- [x] Route updated to `/api/v1/admin/process-costs`
- [x] All entity references updated
- [x] All DTO references updated
- [x] No compilation errors

### 2.3 Update AdminProductsController

**Files to modify:**
- `backend/Filamorfosis.API/Controllers/AdminProductsController.cs`

**Steps:**
1. Remove `TitleEn` from search query in `GetAll` method:
   ```csharp
   // Remove: EF.Functions.Like(p.TitleEn, pattern)
   query = query.Where(p =>
       EF.Functions.Like(p.TitleEs, pattern) ||
       EF.Functions.Like(p.Slug, pattern));
   ```
2. Remove `TitleEn` parameter from `Create` method
3. Remove `TitleEn` assignment in `Create` method
4. Remove `TitleEn` parameter from `Update` method
5. Remove `TitleEn` assignment in `Update` method
6. Remove `DescriptionEn` parameter from `Create` method
7. Remove `DescriptionEn` assignment in `Create` method
8. Remove `DescriptionEn` parameter from `Update` method
9. Remove `DescriptionEn` assignment in `Update` method
10. Remove `ProcessNameEn` from `MapDetailAsync` method

**Acceptance Criteria:**
- [x] Search query updated (no TitleEn)
- [x] Create method updated (no TitleEn, DescriptionEn)
- [x] Update method updated (no TitleEn, DescriptionEn)
- [x] DTO mapping updated (no ProcessNameEn)
- [x] No compilation errors

**Status:** ✅ COMPLETED

### 2.4 Update AdminMaterialsController

**Files to modify:**
- `backend/Filamorfosis.API/Controllers/AdminMaterialsController.cs`

**Steps:**
1. Update all `db.CostParameters` to `db.ProcessesCosts`
2. Update all `CostParameter` type references to `ProcessCost`
3. Update variable names (optional): `costParams` → `processCosts`

**Acceptance Criteria:**
- [x] All `db.CostParameters` updated
- [x] All type references updated
- [x] No compilation errors

### 2.5 Add Material Stock Validation

**Files to modify:**
- `backend/Filamorfosis.API/Controllers/AdminProductsController.cs`

**Steps:**
1. Update `_validateMaterialUsages` method to check stock:
   ```csharp
   private async Task<IActionResult?> _validateMaterialUsages(Dictionary<string, decimal> usages)
   {
       foreach (var (materialIdStr, qty) in usages)
       {
           if (qty <= 0)
               return BadRequest(new ProblemDetails
               {
                   Type = "https://filamorfosis.com/errors/validation",
                   Title = "Validation error",
                   Status = 400,
                   Detail = "La cantidad debe ser mayor a 0."
               });

           if (!Guid.TryParse(materialIdStr, out var materialId))
               return BadRequest(new ProblemDetails
               {
                   Type = "https://filamorfosis.com/errors/validation",
                   Title = "Validation error",
                   Status = 400,
                   Detail = $"Material no encontrado: {materialIdStr}"
               });

           var material = await db.Materials.FindAsync(materialId);
           if (material == null)
               return BadRequest(new ProblemDetails
               {
                   Type = "https://filamorfosis.com/errors/validation",
                   Title = "Validation error",
                   Status = 400,
                   Detail = $"Material no encontrado: {materialIdStr}"
               });

           if (qty > material.StockQuantity)
               return BadRequest(new ProblemDetails
               {
                   Type = "https://filamorfosis.com/errors/validation",
                   Title = "Validation error",
                   Status = 400,
                   Detail = $"Cantidad solicitada ({qty}) excede stock disponible ({material.StockQuantity})."
               });
       }
       return null;
   }
   ```

**Acceptance Criteria:**
- [x] Stock validation added
- [x] Error message includes requested and available quantities
- [x] No compilation errors

### 2.6 Update Other Services and References

**Files to search and modify:**
- Search entire `backend/` directory for `CostParameter` references

**Steps:**
1. Search for `CostParameter` in all backend files
2. Update any remaining references to `ProcessCost`
3. Verify no broken references

**Acceptance Criteria:**
- [x] All `CostParameter` references updated (except test files and migrations)
- [x] AdminProcessesController updated (removed NameEn references)
- [x] MaterialDtos.cs updated (CostParameterId → ProcessCostId)
- [x] ProcessDto.cs updated (removed duplicate request classes)
- [x] Backend compiles successfully
- [x] No warnings related to renamed entities

**Status:** ✅ COMPLETED

### 2.7 Update Public Controllers (ProductsController, OrdersController, CartController)

**Files to modify:**
- `backend/Filamorfosis.API/Controllers/ProductsController.cs`
- `backend/Filamorfosis.API/Controllers/OrdersController.cs`
- `backend/Filamorfosis.API/Controllers/CartController.cs`

**Steps:**
1. **ProductsController.cs:**
   - Remove all `TitleEn` assignments in `ProductSummaryDto` mappings (2 locations in GetAll method)
   - Remove all `DescriptionEn` assignments in `ProductSummaryDto` mappings (2 locations in GetAll method)
   - Remove `TitleEn` and `DescriptionEn` from `ProductDetailDto` mapping in GetById method

2. **OrdersController.cs:**
   - Remove `ProductTitleEn` assignment in CreateOrder method (line ~62)
   - Remove `VariantLabelEn` assignment in CreateOrder method
   - Remove `ProductTitleEn` from OrderItemDto mapping in MapOrderDetail method
   - Remove `VariantLabelEn` from OrderItemDto mapping in MapOrderDetail method

3. **CartController.cs:**
   - Remove `ProductTitleEn` assignment in MapCart method (line ~235)
   - Remove `VariantLabelEn` assignment in MapCart method

**Acceptance Criteria:**
- [x] ProductsController: All TitleEn/DescriptionEn references removed
- [x] OrdersController: All ProductTitleEn/VariantLabelEn references removed
- [x] CartController: All ProductTitleEn/VariantLabelEn references removed
- [x] AdminOrdersController: All ProductTitleEn/VariantLabelEn references removed
- [x] No compilation errors in API project

**Status:** ✅ COMPLETED

## Phase 3: Frontend Admin UI Updates

### 3.1 Update admin-api.js

**Files to modify:**
- `assets/js/admin-api.js`

**Steps:**
1. Rename `adminGetCostParameters` to `adminGetProcessCosts`
2. Update endpoint: `/admin/cost-parameters` → `/admin/process-costs`
3. Rename `adminUpsertCostParameter` to `adminUpsertProcessCost`
4. Update endpoint: `/admin/cost-parameters/${processId}/${key}` → `/admin/process-costs/${processId}/${key}`

**Acceptance Criteria:**
- [x] Method renamed to `adminGetProcessCosts`
- [x] Method renamed to `adminUpsertProcessCost`
- [x] Endpoints updated
- [x] No JavaScript syntax errors
- [x] UTF-8 encoding preserved

**Status:** ✅ COMPLETED

### 3.2 Update admin-costs.js

**Files to modify:**
- `assets/js/admin-costs.js`

**Steps:**
1. Update `loadAll()` to call `adminApi.adminGetProcessCosts()`
2. Update `saveCostParameter()` to call `adminApi.adminUpsertProcessCost()`
3. Update variable names (optional):
   - `_costParams` → `_processCosts`
   - `costParameterId` → `processCostId`
4. Update comments referencing "cost parameters" to "process costs"

**Acceptance Criteria:**
- [ ] API calls updated
- [ ] Variable names updated (if changed)
- [ ] No JavaScript syntax errors
- [ ] UTF-8 encoding preserved
- [ ] Spanish characters (á, é, í, ó, ú, ñ) intact
- [ ] No replacement characters (�)

### 3.3 Update admin-products.js

**Files to modify:**
- `assets/js/admin-products.js`

**Steps:**
1. Search for references to `titleEn`, `descriptionEn`, `labelEn`
2. Remove any form fields or references to these properties
3. Verify material quantity validation exists
4. Verify material usage UI is functional

**Acceptance Criteria:**
- [ ] No references to `titleEn`, `descriptionEn`, `labelEn`
- [ ] Material quantity validation present
- [ ] No JavaScript syntax errors
- [ ] UTF-8 encoding preserved

### 3.4 Update admin.html

**Files to modify:**
- `admin.html`

**Steps:**
1. Search for input fields with IDs containing `titleEn`, `descriptionEn`, `labelEn`, `weightGrams`, `printType`
2. Remove any such fields from modals
3. Verify no hardcoded references to removed fields

**Acceptance Criteria:**
- [ ] No input fields for removed properties
- [ ] No hardcoded references to removed fields
- [ ] UTF-8 encoding preserved
- [ ] HTML validates correctly

## Phase 4: Verification and Testing

### 4.1 Verify No Product Category References

**Steps:**
1. Search entire codebase for `ProductCategory` (case-insensitive)
2. Search for `product_category` (table name)
3. Search for `CategoryId` in Product context (not Process context)
4. Verify all results are related to Process/manufacturing categories only

**Acceptance Criteria:**
- [ ] No `ProductCategory` class found
- [ ] No `product_category` table references
- [ ] No `CategoryId` in Product entity
- [ ] Only Process-related category references exist

### 4.2 Backend Compilation and Migration

**Steps:**
1. Run `dotnet build` in `backend/Filamorfosis.API`
2. Verify no compilation errors
3. Verify no warnings related to renamed entities
4. Run `dotnet ef database update` to apply migration
5. Verify migration applied successfully

**Acceptance Criteria:**
- [ ] Backend compiles without errors
- [ ] No warnings
- [ ] Migration applied successfully
- [ ] Database schema matches expected state

### 4.3 API Endpoint Testing

**Steps:**
1. Start backend: `dotnet run --project backend/Filamorfosis.API`
2. Test GET `/api/v1/admin/process-costs` (requires auth)
   - Should return grouped process costs by ProcessId
3. Test PUT `/api/v1/admin/process-costs/{processId}/{key}` (requires auth)
   - Should update cost parameter
   - Should recompute affected material costs
4. Test GET `/api/v1/admin/products?search=test`
   - Should search only TitleEs and Slug (not TitleEn)
5. Test POST `/api/v1/admin/products/{id}/variants` with materials
   - Should validate quantity > 0
   - Should validate quantity ≤ stock
   - Should reject if quantity exceeds stock

**Acceptance Criteria:**
- [ ] GET `/api/v1/admin/process-costs` returns data
- [ ] PUT `/api/v1/admin/process-costs/{processId}/{key}` updates cost
- [ ] Product search works without TitleEn
- [ ] Variant creation validates material quantities
- [ ] Stock validation rejects excessive quantities

### 4.4 Admin UI Functional Testing

**Steps:**
1. Open `admin.html` in browser
2. Login with admin credentials
3. **Materials Tab:**
   - Create a new material with multiple supply usages
   - Verify cost calculation (manual + supplies)
   - Verify stock quantity is saved
   - Edit material and change stock
   - Delete material (should fail if in use)
4. **Products Tab:**
   - Create a new product
   - Verify no English field inputs appear
   - Add a variant with multiple materials
   - Verify material quantity inputs appear
   - Verify production cost calculation
   - Try to add material quantity > stock → should show error
   - Save variant with valid quantities → should succeed
5. **Processes Tab:**
   - Edit a process
   - Verify no NameEn field appears
   - Update process costs
   - Verify costs save correctly
   - Verify affected materials recompute

**Acceptance Criteria:**
- [ ] Materials tab: create, edit, delete works
- [ ] Materials tab: cost calculation correct
- [ ] Materials tab: stock quantity persists
- [ ] Products tab: no English fields visible
- [ ] Products tab: variant creation works
- [ ] Products tab: material quantity inputs appear
- [ ] Products tab: stock validation works (rejects excess)
- [ ] Products tab: production cost calculates correctly
- [ ] Processes tab: no NameEn field
- [ ] Processes tab: cost updates work

### 4.5 UTF-8 Encoding Verification

**Steps:**
1. Open all modified JS files in text editor
2. Verify file encoding is UTF-8 without BOM
3. Search for replacement character (�)
4. Verify Spanish characters display correctly:
   - á, é, í, ó, ú, ñ, ¿, ¡
5. Verify emoji characters in badges render correctly:
   - 🔥, ✨, 🏷️, ⭐
6. Open admin.html in browser
7. Verify all text displays correctly (no garbled characters)

**Acceptance Criteria:**
- [ ] All JS files are UTF-8 without BOM
- [ ] No replacement characters (�) found
- [ ] Spanish characters display correctly in code
- [ ] Spanish characters display correctly in browser
- [ ] Emoji characters render correctly
- [ ] No encoding corruption detected

### 4.6 Regression Testing

**Steps:**
1. Test all existing admin functionality:
   - Orders tab: view, filter, search orders
   - Users tab: view, add, edit users
   - Global Parameters tab: update parameters
2. Verify no functionality broken by changes
3. Verify all modals open and close correctly
4. Verify all forms submit correctly
5. Verify all tables render correctly

**Acceptance Criteria:**
- [ ] Orders tab works correctly
- [ ] Users tab works correctly
- [ ] Global Parameters tab works correctly
- [ ] All modals functional
- [ ] All forms functional
- [ ] All tables render correctly
- [ ] No JavaScript console errors

## Phase 5: Documentation and Cleanup

### 5.1 Update API Documentation

**Files to modify:**
- `backend/Filamorfosis.API/Filamorfosis.API.http` (if exists)
- Any API documentation files

**Steps:**
1. Update endpoint references from `/admin/cost-parameters` to `/admin/process-costs`
2. Update request/response examples
3. Update entity names in documentation

**Acceptance Criteria:**
- [ ] API documentation updated
- [ ] Endpoint references correct
- [ ] Examples updated

### 5.2 Code Review Checklist

**Steps:**
1. Review all modified files for:
   - Consistent naming (ProcessCost vs CostParameter)
   - No leftover English field references
   - Proper UTF-8 encoding
   - No commented-out code
   - No debug console.log statements
2. Run code formatter on modified files
3. Verify no linting errors

**Acceptance Criteria:**
- [ ] Naming consistent throughout
- [ ] No English field references
- [ ] UTF-8 encoding correct
- [ ] No commented-out code
- [ ] No debug statements
- [ ] Code formatted
- [ ] No linting errors

### 5.3 Final Verification

**Steps:**
1. Run full backend test suite (if exists)
2. Run full frontend test suite (if exists)
3. Perform manual smoke test of all admin features
4. Verify database schema matches design
5. Verify all requirements from bugfix.md are met

**Acceptance Criteria:**
- [ ] All backend tests pass
- [ ] All frontend tests pass
- [ ] Manual smoke test passes
- [ ] Database schema correct
- [ ] All bugfix requirements satisfied

## Summary

**Total Tasks:** 24 main tasks across 5 phases

**Current Status:**
- ✅ Completed: 19 tasks (Phase 1: 5/5, Phase 2: 7/7, Phase 3: 4/4, Phase 4: 0/6, Phase 5: 0/3)
- ⚠️ In Progress: 0 tasks
- ❌ Not Started: 9 tasks (Phase 4: 6, Phase 5: 3)

**Estimated Remaining Effort:** 
- Phase 1 (Migration): ✅ COMPLETED
- Phase 2 (Backend): ✅ COMPLETED
- Phase 3 (Frontend UI): ✅ COMPLETED
- Phase 4 (Testing): 3-4 hours
- Phase 5 (Documentation): 1-2 hours
**Total Remaining:** 4-6 hours

**Next Immediate Steps:**
1. ✅ ~~Fix compilation errors~~ **COMPLETED**
2. ✅ ~~Create and apply EF migration (Task 1.5)~~ **COMPLETED**
3. ✅ ~~Update frontend JS files (admin-costs.js, admin-products.js)~~ **COMPLETED**
4. ✅ ~~Update admin.html to remove English field inputs~~ **COMPLETED**
5. **Test all admin functionality** (Phase 4 - Ready to start)

**Critical Path:**
1. ✅ ~~Fix compilation errors~~ → Migration (1.5) → Frontend updates (3.2-3.4) → Testing (4.1-4.6)

**Risk Areas:**
- Migration application (test on dev database first)
- UTF-8 encoding preservation (use proper text editor)
- Stock validation (ensure doesn't break existing workflows)
- API route change already done (coordinated backend/frontend deployment needed)
