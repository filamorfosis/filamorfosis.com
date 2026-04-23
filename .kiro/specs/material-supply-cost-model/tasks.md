# Implementation Plan: Material Supply Cost Model

## Overview

Migrate the cost model from variant-level supply usages to material-level supply usages, wire the two existing-but-unwired domain entities (`MaterialSupplyUsage`, `VariantMaterialUsage`) into the DB context and API, run the 6-step data migration, update all affected controllers and DTOs, add `StockQuantity` to `Material`, implement `IStockService`, write the 10 FsCheck property tests, and update both the admin UI and storefront UI.

## Tasks

- [x] 1. Wire domain entities and EF Core configuration
  - Add `StockQuantity` property (`int`, default `0`) to `Material` entity in `backend/Filamorfosis.Domain/Entities/Material.cs`
  - Remove `MaterialId` nullable FK and `Material` navigation from `ProductVariant` entity; remove `SupplyUsages` collection (keep `MaterialUsages`)
  - Remove `VariantSupplyUsage` entity file (after migration is written — keep it until Step 2 is done)
  - Add `DbSet<MaterialSupplyUsage>` and `DbSet<VariantMaterialUsage>` to `FilamorfosisDbContext`
  - Remove `DbSet<VariantSupplyUsage>` from `FilamorfosisDbContext`
  - In `OnModelCreating`: add FK/cascade/unique-index config for `MaterialSupplyUsage` (cascade on Material and CostParameter, unique on `(MaterialId, CostParameterId)`)
  - In `OnModelCreating`: add FK/cascade/unique-index config for `VariantMaterialUsage` (cascade on Variant, restrict on Material, unique on `(VariantId, MaterialId)`)
  - In `OnModelCreating`: add `HasDefaultValue(0)` for `Material.StockQuantity`
  - Remove the `ProductVariant → Material` FK configuration block and the `VariantSupplyUsage` configuration block from `OnModelCreating`
  - _Requirements: 1.1, 3.1, 5.2, 10.1, 10.2, 10.3, 10.4, 10.6, 10.7, 11.1_

- [x] 2. Write and apply the EF Core data migration
  - Create a new EF Core migration class in `backend/Filamorfosis.Infrastructure/Migrations/` named `AddMaterialSupplyCostModel`
  - Step 1 — `Up()`: create `MaterialSupplyUsages` table with all FK constraints and unique index; create `VariantMaterialUsages` table with all FK constraints and unique index
  - Step 2 — `Up()`: `ALTER TABLE "Materials" ADD COLUMN "StockQuantity" INTEGER NOT NULL DEFAULT 0`
  - Step 3 — `Up()`: migrate `VariantSupplyUsages` → `MaterialSupplyUsages` using the INSERT/SELECT/GROUP BY/ON CONFLICT SQL from the design
  - Step 4 — `Up()`: migrate `ProductVariants.MaterialId` → `VariantMaterialUsages` (one row per non-null `MaterialId`, `Quantity = 1`)
  - Step 5 — `Up()`: recompute `Materials.BaseCost` via UPDATE/COALESCE/SUM SQL
  - Step 6 — `Up()`: `ALTER TABLE "ProductVariants" DROP COLUMN "MaterialId"` and `DROP TABLE "VariantSupplyUsages"`
  - Implement `Down()` to restore the dropped column and table (backup snapshot approach)
  - _Requirements: 5.1, 5.2, 5.5, 5.6_

- [x] 3. Implement application-layer service changes
  - [x] 3.1 Add `ComputeMaterialBaseCost` and `ComputeVariantBaseCost` methods to `IPricingCalculatorService` interface
    - `ComputeMaterialBaseCost(IEnumerable<(decimal unitCost, decimal quantity)> usages) → decimal`
    - `ComputeVariantBaseCost(IEnumerable<(decimal materialBaseCost, decimal quantity)> materialUsages, int? manufactureTimeMinutes, decimal electricCostPerHour) → decimal`
    - _Requirements: 2.1, 2.4, 4.1, 4.3_

  - [x] 3.2 Implement both new methods in `PricingCalculatorService`
    - `ComputeMaterialBaseCost`: return `usages.Sum(u => u.unitCost * u.quantity)`, return `0` for empty
    - `ComputeVariantBaseCost`: return `Σ(materialBaseCost × quantity) + (minutes/60 × electricRate)`, return `0` for empty with no manufacture time
    - Retain existing `ComputeBaseCostAsync` and `ComputePriceAsync` for backward compatibility
    - _Requirements: 2.1, 2.4, 4.1, 4.3_

  - [x] 3.3 Create `IStockService` interface and `StockService` implementation
    - Create `backend/Filamorfosis.Application/Services/IStockService.cs` with `bool IsVariantInStock(IEnumerable<int> materialStockQuantities)`
    - Create `backend/Filamorfosis.Infrastructure/Services/StockService.cs` implementing the pure stateless logic: empty list → `true`; all > 0 → `true`; any == 0 → `false`
    - Register `IStockService` / `StockService` in `Program.cs` DI container
    - _Requirements: 11.2, 11.3, 11.4, 11.5_

  - [x] 3.4 Update DTOs in `MaterialDtos.cs`
    - Add `StockQuantity` (`int`) field to `MaterialDto`
    - Add `StockQuantity` (`int`) field to `CreateMaterialRequest` record
    - Add `StockQuantity` (`int?`) field to `UpdateMaterialRequest` record
    - _Requirements: 8.1, 8.2, 11.9, 11.10_

  - [x] 3.5 Update DTOs in `ProductVariantDto.cs` and `AdminProductDtos.cs`
    - Add `InStock` (`bool`) field to `ProductVariantDto`
    - Remove `MaterialId`, `MaterialName`, `SupplyUsages` fields from `ProductVariantDto` (already absent — verify and clean up any remnants)
    - Remove `MaterialId` and `SupplyUsages` fields from `CreateVariantRequest` and `UpdateVariantRequest` (already absent — verify)
    - _Requirements: 3.6, 5.3, 5.4, 9.3, 11.6, 11.7_

- [x] 4. Update `AdminMaterialsController`
  - [x] 4.1 Update `GetAll` to include `SupplyUsages` and `StockQuantity` in response
    - Add `.Include(m => m.SupplyUsages).ThenInclude(u => u.CostParameter)` to the query
    - Map `SupplyUsages` to `List<MaterialSupplyUsageDto>` (label, unit, unitCost, quantity, totalCost)
    - Map `StockQuantity` to `MaterialDto`
    - _Requirements: 8.1, 8.5_

  - [x] 4.2 Add `GET /api/v1/admin/materials/{id}` endpoint
    - Load material with `SupplyUsages` + `CostParameter` includes
    - Return 404 with ProblemDetails if not found
    - Return full `MaterialDto` including `SupplyUsages` and `StockQuantity`
    - _Requirements: 8.2_

  - [x] 4.3 Update `Create` to persist `SupplyUsages` and `StockQuantity`, compute `BaseCost`
    - Validate `StockQuantity >= 0`; return 400 ProblemDetails if negative
    - Validate each `SupplyUsages` entry: quantity > 0 (400), `CostParameterId` exists (400)
    - Persist `MaterialSupplyUsage` rows (replace-all: delete existing, insert new)
    - Call `ComputeMaterialBaseCost` and store result in `material.BaseCost`
    - Return 201 with full `MaterialDto` including `SupplyUsages` and `StockQuantity`
    - _Requirements: 1.2, 1.3, 1.4, 2.1, 2.3, 2.4, 8.3, 11.10, 11.11_

  - [x] 4.4 Update `Update` (PUT) to persist `SupplyUsages` and `StockQuantity`, recompute `BaseCost`
    - Validate `StockQuantity >= 0` when provided; return 400 if negative
    - When `SupplyUsages` is provided: validate entries, delete existing rows, insert new rows
    - Recompute and store `BaseCost` after any supply usage or cost change
    - Return 200 with full `MaterialDto`
    - _Requirements: 1.2, 1.3, 1.4, 2.1, 2.3, 8.4, 11.10, 11.11_

  - [x] 4.5 Update `Delete` to check `VariantMaterialUsage` references (not `ProductVariants.MaterialId`)
    - Replace the existing `ProductVariants.AnyAsync(v => v.MaterialId == id)` check with `VariantMaterialUsages.AnyAsync(u => u.MaterialId == id)`
    - Return 409 ProblemDetails if any `VariantMaterialUsage` references this material
    - Cascade delete of `MaterialSupplyUsage` rows is handled by DB FK
    - _Requirements: 1.5, 1.6, 10.5_

  - [x] 4.6 Add `POST /api/v1/admin/materials/{id}/recompute-variants` endpoint
    - Load all `VariantMaterialUsage` rows referencing the given material, grouped by `VariantId`
    - For each variant: load its full `MaterialUsages` with `Material.BaseCost`, call `ComputeVariantBaseCost`, load `electric_cost_per_hour` from `GlobalParameters`, recompute `Price` via `ComputePriceAsync`, persist
    - Return `{ "recomputedCount": N }`
    - Return 404 if material not found
    - _Requirements: 4.5, 9.4_

- [x] 5. Update `AdminProductsController`
  - [x] 5.1 Update `CreateVariant` to use `VariantMaterialUsage` instead of `VariantSupplyUsage`
    - Remove `_saveSupplyUsages` call and `MaterialId` assignment
    - Validate each `MaterialUsages` entry: quantity > 0 (400), `MaterialId` exists (400)
    - Persist `VariantMaterialUsage` rows (replace-all semantics)
    - Load `electric_cost_per_hour` from `GlobalParameters`; load `Material.BaseCost` for each referenced material
    - Call `ComputeVariantBaseCost` and `ComputePriceAsync`; store results
    - Compute `InStock` via `IStockService.IsVariantInStock` using the material stock quantities
    - Return 201 with `ProductVariantDto` including `MaterialUsages`, `BaseCost`, `Price`, `InStock`
    - _Requirements: 3.2, 3.3, 3.4, 4.1, 4.2, 9.1, 11.6_

  - [x] 5.2 Update `UpdateVariant` to use `VariantMaterialUsage` instead of `VariantSupplyUsage`
    - Remove `VariantSupplyUsages.RemoveRange` and `_saveSupplyUsages` calls; remove `MaterialId` update
    - When `MaterialUsages` is provided: validate, delete existing `VariantMaterialUsage` rows, insert new rows
    - Recompute `BaseCost`, `Price`, and `InStock` after any material usage change
    - Return 200 with updated `ProductVariantDto`
    - _Requirements: 3.2, 3.3, 3.4, 4.1, 4.2, 9.2, 11.6_

  - [x] 5.3 Update `GetById` and `GetAll` to include `MaterialUsages` and `InStock` in variant responses
    - Add `.Include(v => v.MaterialUsages).ThenInclude(u => u.Material)` to all variant queries
    - Remove `.Include(v => v.Material)` and `.Include(v => v.SupplyUsages)` includes
    - Update `MapVariant` to populate `MaterialUsages` dict and compute `InStock` via `IStockService`
    - Remove `MaterialId`, `MaterialName`, `SupplyUsages` from `MapVariant` output
    - _Requirements: 3.6, 5.3, 5.4, 9.3, 11.6_

  - [x] 5.4 Remove the private `_saveSupplyUsages` and `_computeCost` helper methods
    - Delete `_saveSupplyUsages` method entirely
    - Replace `_computeCost` with inline logic using the new `ComputeVariantBaseCost` path
    - _Requirements: 5.3, 5.4_

- [x] 6. Update `AdminCostParametersController`
  - After a successful upsert of a `CostParameter`, load all `MaterialSupplyUsage` rows referencing that parameter's `Id`
  - For each distinct `MaterialId` found: reload the material's full supply usages with `CostParameter.Value`, call `ComputeMaterialBaseCost`, persist updated `BaseCost`
  - Perform this recomputation inside the same request/transaction before returning the response
  - _Requirements: 2.2_

- [x] 7. Update storefront `ProductsController`
  - Add `.Include(v => v.MaterialUsages).ThenInclude(u => u.Material)` to both `GetAll` and `GetById` variant queries
  - Inject `IStockService` into the controller
  - Compute `InStock` per variant using `IStockService.IsVariantInStock` and include it in `ProductVariantDto`
  - Omit `BaseCost`, `Profit`, and `MaterialUsages` detail from storefront responses (only `InStock` is needed)
  - _Requirements: 11.7_

- [x] 8. Checkpoint — ensure all tests pass
  - Ensure all existing tests pass after the domain/EF/service/controller changes above
  - Ask the user if any questions arise before proceeding to property tests

- [x] 9. Implement property-based tests (FsCheck)
  - [x] 9.1 Write property test for Property 1: Material base cost equals sum of supply usage products
    - Create `backend/Filamorfosis.Tests/MaterialSupplyCostModelPropertyTests.cs`
    - Generator: random list of `(unitCost, quantity)` pairs with non-negative decimals; also test empty list
    - Assert `ComputeMaterialBaseCost(usages) == Σ(unitCost × quantity)` and empty → 0
    - Tag: `// Feature: material-supply-cost-model, Property 1: Material base cost equals sum of supply usage products`
    - **Validates: Requirements 2.1, 2.4**

  - [x] 9.2 Write property test for Property 2: Material base cost response is consistent with returned supply usages
    - Integration test using `FilamorfosisWebFactory` + seeded `CostParameter`
    - POST a material with random `SupplyUsages`, assert `response.BaseCost == Σ(supplyUsage.unitCost × supplyUsage.quantity)` from the response body
    - Tag: `// Feature: material-supply-cost-model, Property 2: Material base cost response is consistent with returned supply usages`
    - **Validates: Requirements 2.3, 2.5**

  - [x] 9.3 Write property test for Property 3: Full price formula holds for any valid variant inputs
    - Generator: random lists of `(materialBaseCost, quantity)` pairs, random `manufactureTimeMinutes`, `profit`, `taxRate` (all non-negative)
    - Assert `ComputeVariantBaseCost + ComputePrice == (Σ(baseCost × qty) + (minutes/60 × electricRate) + profit) × (1 + taxRate)`
    - Tag: `// Feature: material-supply-cost-model, Property 3: Full price formula holds for any valid variant inputs`
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

  - [x] 9.4 Write property test for Property 4: Replace-all semantics for usage persistence
    - Integration test: seed material with usage map A, PUT with map B, assert DB contains exactly map B rows
    - Run for both `MaterialSupplyUsages` and `VariantMaterialUsages`
    - Tag: `// Feature: material-supply-cost-model, Property 4: Replace-all semantics for usage persistence`
    - **Validates: Requirements 1.2, 3.2**

  - [x] 9.5 Write property test for Property 5: Non-positive quantities are always rejected
    - Generator: random decimal ≤ 0 (including 0, negative integers, negative fractions)
    - POST material with a `SupplyUsages` entry having that quantity; assert HTTP 400
    - POST variant with a `MaterialUsages` entry having that quantity; assert HTTP 400
    - Tag: `// Feature: material-supply-cost-model, Property 5: Non-positive quantities are always rejected`
    - **Validates: Requirements 1.4, 3.4**

  - [x] 9.6 Write property test for Property 6: Unknown reference IDs are always rejected
    - Generator: random `Guid` guaranteed not present in the test DB
    - POST material with that `CostParameterId`; assert HTTP 400
    - POST variant with that `MaterialId`; assert HTTP 400
    - Tag: `// Feature: material-supply-cost-model, Property 6: Unknown reference IDs are always rejected`
    - **Validates: Requirements 1.3, 3.3**

  - [x] 9.7 Write property test for Property 7: Cascade delete removes all child usage rows
    - Generator: random count N (0..10) of `MaterialSupplyUsage` rows; insert, delete material, assert count == 0
    - Same for `VariantMaterialUsage` rows on variant delete
    - Tag: `// Feature: material-supply-cost-model, Property 7: Cascade delete removes all child usage rows`
    - **Validates: Requirements 1.5, 3.5**

  - [x] 9.8 Write property test for Property 8: Variant stock is in-stock iff all material stock quantities are positive
    - Generator: random `List<int>` of non-negative integers (including empty list, all-positive, at-least-one-zero)
    - Assert `IsVariantInStock(quantities) == quantities.All(q => q > 0)` (empty → true)
    - Tag: `// Feature: material-supply-cost-model, Property 8: Variant stock is in-stock iff all material stock quantities are positive`
    - **Validates: Requirements 11.2, 11.3, 11.4, 11.5**

  - [x] 9.9 Write property test for Property 9: CostParameter update propagates to all referencing materials
    - Integration test: seed N materials (1..5) all referencing the same `CostParameter`, PUT new value, assert each material's `BaseCost` reflects the new value
    - Tag: `// Feature: material-supply-cost-model, Property 9: CostParameter update propagates to all referencing materials`
    - **Validates: Requirement 2.2**

  - [x] 9.10 Write property test for Property 10: Deleting a material referenced by a variant is always rejected
    - Integration test: seed N variants (1..5) all referencing the same material, attempt DELETE material, assert HTTP 409
    - Tag: `// Feature: material-supply-cost-model, Property 10: Deleting a material referenced by a variant is always rejected`
    - **Validates: Requirements 1.6, 10.5**

- [ ] 10. Checkpoint — ensure all tests pass
  - Run the full test suite; ensure all property tests and existing tests pass
  - Ask the user if any questions arise before proceeding to UI changes

- [x] 11. Admin UI — material modal supply usages editor
  - [x] 11.1 Add supply usages section to the material create/edit modal in `assets/js/admin-products.js` (or the relevant admin materials JS file)
    - Render a table with columns: Parámetro de costo (select), Unidad (read-only), Cantidad (number input), Costo (computed), remove button
    - Populate the cost parameter `<select>` with only parameters belonging to the material's selected category (from the existing `AdminCosts` cache / `GET /api/v1/admin/cost-parameters`)
    - When category changes, clear the supply usages list and repopulate the selector
    - Compute and display live line cost (`unitCost × quantity`) and total `BaseCost` preview on every quantity change
    - Add "+ Agregar uso" button to append a new empty row
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 11.2 Add `StockQuantity` numeric input to the material form
    - Integer input, `min="0"`, label "Stock disponible"
    - Include in the POST/PUT payload sent to the API
    - _Requirements: 11.9_

  - [x] 11.3 Update material save logic to submit `supplyUsages` map and display returned `BaseCost`
    - Build `{ costParameterId: quantity }` map from the supply usages table rows
    - Include `stockQuantity` in the request body
    - On success: update the material row in the list with the returned `baseCost` and `stockQuantity`
    - On API validation error: display the error message inline without closing the modal
    - _Requirements: 6.6, 6.7_

  - [x] 11.4 Add `Stock` column to the materials list table
    - Display `stockQuantity` value for each material row
    - _Requirements: 11.9_

- [x] 12. Admin UI — variant form multi-material editor
  - [x] 12.1 Replace the single material `<select>` with a multi-material usages section in the variant form
    - Render a table with columns: Material (select), Cantidad (number input), Costo (computed), remove button
    - Populate the material `<select>` with all available materials from `GET /api/v1/admin/materials`
    - Each row shows live line cost (`material.baseCost × quantity`)
    - Add "+ Agregar material" button to append a new empty row
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 12.2 Update variant save logic to submit `materialUsages` map and display returned cost fields
    - Build `{ materialId: quantity }` map from the material usages table rows
    - On success: display updated `baseCost` and `price` for the variant
    - On API validation error: display the error message inline without closing the form
    - _Requirements: 7.5, 7.6, 7.7_

- [ ] 13. Admin UI — product/variant grid stock indicator
  - In the variant table within the product edit modal, add an "En stock" / "Agotado" badge column driven by the `inStock` field from the variant response
  - Green badge for `inStock = true`, red badge for `inStock = false`
  - _Requirements: 11.8_

- [ ] 14. Storefront UI — out-of-stock handling
  - In `assets/js/products.js` (and/or `assets/js/store.js`), update variant rendering to check the `inStock` field
  - When `inStock = false`: render `<span class="out-of-stock-label">Agotado</span>` in place of the add-to-cart button
  - Visually indicate unavailable variants in the variant selector (greyed-out option or disabled state)
  - _Requirements: 11.12_

- [ ] 15. Final checkpoint — ensure all tests pass
  - Run the full test suite; ensure all tests pass end-to-end
  - Ask the user if any questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- The migration (Task 2) must be applied before any controller changes are tested against a real DB
- `VariantSupplyUsage` entity and `DbSet` must remain in place until the migration class is written (Task 2), then removed as part of Task 1
- `StockService` is pure/stateless — the controller is responsible for loading `Material.StockQuantity` values and passing them in
- Replace-all semantics: always delete existing rows then insert new ones — no partial updates
- All errors use RFC 7807 `ProblemDetails` format consistent with the rest of the API
- Property tests 9.1, 9.3, 9.5, 9.8 are pure unit tests (no DB); the rest are integration tests using `FilamorfosisWebFactory`
