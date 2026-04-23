# Implementation Plan: Cost Management and Pricing

## Overview

Implement the cost management and pricing subsystem in a layered approach: domain entities and
EF Core migration first, then the backend services and controllers, then frontend modules, and
finally wiring everything together. Property-based tests use FsCheck + xUnit.

## Tasks

- [x] 1. Domain entities and EF Core migration
  - Add `Material`, `CostParameter`, and `GlobalParameter` entity classes to the Domain layer
  - Extend `ProductVariant` with `MaterialId`, `BaseCost`, `Profit`, `ManufactureTimeMinutes`, `FilamentGrams`, `PrintType`
  - Add `DbSet<Material>`, `DbSet<CostParameter>`, `DbSet<GlobalParameter>` to `FilamorfosisDbContext`
  - Configure entity mappings, unique indexes `(Category, Key)` on `CostParameters` and `Key` on `GlobalParameters`, and `ON DELETE SET NULL` FK from `ProductVariants.MaterialId` to `Materials.Id`
  - Create EF Core migration `AddCostManagement` covering all table and column changes
  - Add `HasData` seed for all default `CostParameter` rows (all five categories) and the `tax_rate` `GlobalParameter` (`"0.16"`)
  - _Requirements: 2.10, 3.5, 3.6, 3.7, 6.8, 7.5, 7.7_

- [x] 2. `PricingCalculatorService` — core logic
  - [x] 2.1 Define `IPricingCalculatorService` interface and `ComputeBaseCostRequest` record in the Application layer
    - Include `ComputeBaseCostAsync`, `ComputePriceAsync(decimal, decimal)`, and `ComputePrice(decimal, decimal, decimal)` signatures
    - _Requirements: 4.1, 4.2, 4.6_

  - [x] 2.2 Implement `PricingCalculatorService` with all five category formulas
    - UV Printing: `Material.BaseCost + (PrintArea × InkCostPerCm2) + (ManufactureTimeMinutes / 60 × ElectricCostPerHour)`
    - 3D Printing: `Material.BaseCost + (FilamentGrams × FilamentCostPerGram) + (ManufactureTimeMinutes / 60 × ElectricCostPerHour)`
    - Laser Engraving / Laser Cutting: `Material.BaseCost + (ManufactureTimeMinutes / 60 × ElectricCostPerHour)`
    - Photo Printing: `(PrintArea × PaperCostPerCm2) + (PrintArea × InkCostPerCm2) + (ManufactureTimeMinutes / 60 × ElectricCostPerHour)`
    - `ComputePriceAsync` reads `tax_rate` from `GlobalParameter` at call time (no caching)
    - Throw `ArgumentOutOfRangeException` for any negative `BaseCost`, `Profit`, or `TaxRate`
    - Register as `IPricingCalculatorService` with scoped lifetime in DI
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 7.8_

  - [x] 2.3 Write unit tests for `PricingCalculatorService` (concrete examples)
    - One example per category formula verifying exact numeric result
    - Edge cases: `ManufactureTimeMinutes = 0`, `FilamentGrams = 0`, `PrintArea = 0`, `Profit = 0`, `TaxRate = 0`
    - Error cases: negative `BaseCost`, `Profit`, `TaxRate` each throw `ArgumentOutOfRangeException`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 2.4 Write property test — Property 1: Price formula correctness
    - **Property 1: For any non-negative `b`, `p`, `t`: `ComputePrice(b, p, t)` = `(b + p) × (1 + t)`**
    - **Validates: Requirements 4.2, 4.7**

  - [x] 2.5 Write property test — Property 2: Zero-profit identity
    - **Property 2: For any non-negative `b`, `t`: `ComputePrice(b, 0, t)` = `b × (1 + t)`**
    - **Validates: Requirements 4.8**

  - [x] 2.6 Write property test — Property 3: Negative inputs throw
    - **Property 3: For any negative value as `BaseCost`, `Profit`, or `TaxRate`, service throws `ArgumentOutOfRangeException`**
    - **Validates: Requirements 4.3, 4.4, 4.5**

  - [x] 2.7 Write property test — Property 4: UV Printing BaseCost formula
    - **Property 4: UV formula holds for all non-negative inputs and `PrintType` ∈ `{"Flat", "Relief"}`**
    - **Validates: Requirements 4.1 (UV Printing)**

  - [x] 2.8 Write property test — Property 5: 3D Printing BaseCost formula
    - **Property 5: 3D formula holds for all non-negative inputs**
    - **Validates: Requirements 4.1 (3D Printing)**

  - [x] 2.9 Write property test — Property 6: Laser Engraving and Laser Cutting BaseCost formula
    - **Property 6: Laser formula holds for both categories with all non-negative inputs**
    - **Validates: Requirements 4.1 (Laser Engraving, Laser Cutting)**

  - [x] 2.10 Write property test — Property 7: Photo Printing BaseCost formula
    - **Property 7: Photo formula holds for all non-negative inputs (no `Material.BaseCost` added)**
    - **Validates: Requirements 4.1 (Photo Printing)**

- [x] 3. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. `AdminMaterialsController`
  - [x] 4.1 Create DTOs and request types: `MaterialDto`, `CreateMaterialRequest`, `UpdateMaterialRequest`
    - _Requirements: 2.10_

  - [x] 4.2 Implement `AdminMaterialsController` with `GET /`, `POST /`, `PUT /{id}`, `DELETE /{id}`
    - `GET` supports optional `?category=` filter and returns results ordered by `Name` ascending
    - `POST` returns 201 with created entity; validate blank `Name` → 400, `BaseCost < 0` → 400
    - `PUT` returns 200 or 404 if not found
    - `DELETE` returns 204; return 409 if material is referenced by any `ProductVariant`
    - Apply `[Authorize(Roles = "Master,PriceManagement")]` + `[RequireMfa]`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.11_

  - [x] 4.3 Write property test — Property 11: Material list ordering and category filter
    - **Property 11: `GET /admin/materials` returns records ordered by `Name` ascending; `?category=X` returns only matching records still ordered by `Name`**
    - **Validates: Requirements 2.1, 2.11**

- [x] 5. `AdminCostParametersController`
  - [x] 5.1 Create DTOs and request types: `CostParameterDto`, `UpsertCostParameterRequest`
    - _Requirements: 3.5_

  - [x] 5.2 Implement `AdminCostParametersController` with `GET /` and `PUT /{category}/{key}`
    - `GET` returns all parameters grouped by `Category`
    - `PUT` upserts the matching record; validate `Value < 0` → 400; return 200 with saved entity
    - Apply `[Authorize(Roles = "Master,PriceManagement")]` + `[RequireMfa]`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6_

- [x] 6. `AdminGlobalParametersController`
  - [x] 6.1 Create DTOs and request types: `GlobalParameterDto`, `UpdateGlobalParameterRequest`
    - _Requirements: 7.7_

  - [x] 6.2 Implement `AdminGlobalParametersController` with `GET /` and `PUT /{key}`
    - `GET` returns all global parameters
    - `PUT` updates by key; return 404 if key not found; validate `tax_rate` value is parseable decimal in `[0, 1]` → 400 otherwise
    - Apply `[Authorize(Roles = "Master,PriceManagement")]` + `[RequireMfa]`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.6_

  - [x] 6.3 Write property test — Property 8: TaxRate update propagates to price computation
    - **Property 8: For any `t` in `[0, 1]`, after updating `tax_rate` to `t`, `ComputePriceAsync(b, p)` returns `(b + p) × (1 + t)`**
    - **Validates: Requirements 7.8, 7.9**

- [x] 7. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Update `AdminUsersController` for multi-role support
  - [x] 8.1 Add `PriceManagement` to `ValidAdminRoles` and `ValidAssignableRoles`
    - _Requirements: 1.5_

  - [x] 8.2 Add `UpdateUserRolesRequest` record and `PUT /api/v1/admin/users/{userId}/roles` endpoint
    - Accept `List<string> Roles`; replace all current roles with the supplied list
    - Return 400 if list is empty; return 400 if any role string is invalid; return 403 on self-modification
    - Keep existing `PUT /role` endpoint unchanged
    - _Requirements: 1.2, 1.3, 1.4, 1.8_

  - [x] 8.3 Update `POST /api/v1/admin/users` to accept `List<string>? Roles` (default `["OrderManagement"]`)
    - _Requirements: 1.6_

  - [x] 8.4 Write property test — Property 10: Role assignment round-trip
    - **Property 10: For any non-empty subset of valid roles, assigning via `PUT /roles` then fetching via `GET /admin/users` returns exactly that subset**
    - **Validates: Requirements 1.2, 1.6**

- [x] 9. Update `AdminProductsController` for cost fields
  - [x] 9.1 Add new cost fields to `CreateVariantRequest`, `UpdateVariantRequest`, and `ProductVariantDto`
    - Fields: `MaterialId`, `Profit`, `ManufactureTimeMinutes`, `FilamentGrams`, `PrintType`
    - `ProductVariantDto` also includes `MaterialName`, `BaseCost`, `Price`
    - _Requirements: 6.8, 6.10_

  - [x] 9.2 Inject `IPricingCalculatorService` into `AdminProductsController`; call `ComputeBaseCostAsync` then `ComputePriceAsync` on create/update variant
    - Include `Material` navigation in queries that load variants
    - If `MaterialId` is null, set `BaseCost = 0` and compute `Price = Profit × (1 + TaxRate)`
    - _Requirements: 6.7, 6.11_

  - [x] 9.3 Update `MapVariant` to include all new cost fields in `ProductVariantDto`
    - _Requirements: 6.10_

  - [x] 9.4 Write property test — Property 9: Variant price persistence round-trip
    - **Property 9: For any variant with `MaterialId` set, saving then fetching returns `Price = (BaseCost + Profit) × (1 + TaxRate)`**
    - **Validates: Requirements 6.7, 6.12**

- [x] 10. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Frontend — `admin-api.js` additions
  - Add helper functions for all new endpoints:
    - `adminGetMaterials(params)`, `adminCreateMaterial(data)`, `adminUpdateMaterial(id, data)`, `adminDeleteMaterial(id)`
    - `adminGetCostParameters()`, `adminUpsertCostParameter(category, key, data)`
    - `adminGetGlobalParameters()`, `adminUpdateGlobalParameter(key, data)`
    - `adminUpdateUserRoles(userId, roles)`
  - _Requirements: 2.1, 2.2, 2.5, 2.7, 3.1, 3.2, 7.1, 7.2, 1.2_

- [x] 12. Frontend — `admin-costs.js` (new file — Costos tab)
  - [x] 12.1 Implement `AdminCosts.loadAll()` — fetch materials, cost parameters, and global parameters in parallel on tab activation
    - _Requirements: 5.2_

  - [x] 12.2 Implement `AdminCosts.renderMaterialsTable()` — render the materials table with columns Name, Category, Size, Width, Height, Weight, Base Cost, Actions
    - _Requirements: 5.3_

  - [x] 12.3 Implement `AdminCosts.openAddMaterialModal()` and `openEditMaterialModal(id)` — modal CRUD with inline validation (blank Name or blank Base Cost → show error, do not submit)
    - On successful add call `POST /admin/materials`, refresh table, show success toast
    - On successful edit call `PUT /admin/materials/{id}`, refresh table, show success toast
    - On delete show confirmation dialog; call `DELETE /admin/materials/{id}`; on 409 show specific error toast
    - _Requirements: 5.4, 5.5, 5.6, 5.7, 5.8, 5.9_

  - [x] 12.4 Implement `AdminCosts.renderCostParameters()` — render grouped parameter rows with inline save button per row; on save call `PUT /admin/cost-parameters/{category}/{key}` and show toast
    - _Requirements: 5.10, 5.11_

  - [x] 12.5 Implement `AdminCosts.renderGlobalParameters()` — render global parameter rows with inline save; on save call `PUT /admin/global-parameters/{key}` and show toast
    - _Requirements: 5.12, 5.13_

- [x] 13. Frontend — Costos tab visibility in `admin.html` and tab permissions
  - Add "Costos" tab button to the tab bar in `admin.html`
  - Add `PriceManagement` (and `Master`) to the `TAB_PERMISSIONS` map in the existing tab visibility logic so the tab is only shown to authorized roles
  - _Requirements: 5.1_

- [x] 14. Frontend — `admin-products.js` variant modal cost fields
  - [x] 14.1 Load materials list on variant modal open and populate the "Material Base" dropdown
    - _Requirements: 6.1_

  - [x] 14.2 On material selection, auto-populate Size Label, Width, Height, Weight, and Base Cost display fields; show/hide process-specific fields based on material `Category` (ManufactureTimeMinutes always, PrintType for UV only, FilamentGrams for 3D only)
    - On material clear, reset all auto-populated fields and set BaseCost to 0
    - _Requirements: 6.2, 6.3, 6.9_

  - [x] 14.3 Add "Profit" numeric input (default 0) and read-only "Price" display field; implement real-time price preview `(BaseCost + Profit) × (1 + TaxRate)` updating as Profit changes; fetch current `tax_rate` from `GET /admin/global-parameters` on modal open
    - _Requirements: 6.4, 6.5, 6.6_

  - [x] 14.4 Include all new cost fields (`MaterialId`, `Profit`, `ManufactureTimeMinutes`, `FilamentGrams`, `PrintType`) in create/update variant payloads
    - _Requirements: 6.7_

- [x] 15. Frontend — `admin-users.js` multi-role UI
  - Replace single-role `<select>` with a checkbox group (one checkbox per valid role) in the create/edit user modal
  - On submit, collect checked roles into an array and call `adminUpdateUserRoles`
  - Display all roles held by a user as individual badges in the admin users table
  - _Requirements: 1.1, 1.7_

- [x] 16. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use FsCheck (`FsCheck.Xunit` NuGet package), minimum 100 iterations each
- Tag format for property tests: `// Feature: cost-management-and-pricing, Property {N}: {property_text}`
- All error responses follow the existing RFC 7807 `ProblemDetails` format
