# Requirements Document

## Introduction

This feature migrates the supply cost model in Filamorfosis from the product-variant level to the base-material level, and replaces the single-material dropdown on product variants with a multi-material usage list. The result is a cascading cost chain:

**Category → Cost Parameters (per category) → Materials (with supply quantities) → Product → Variant → Base Materials (with quantities)**

Currently, `VariantSupplyUsage` records which cost parameters a variant consumes directly. After this change, supply quantities are defined on the material itself (`MaterialSupplyUsage`), and variants reference one or more materials with a quantity multiplier (`VariantMaterialUsage`). The variant's `BaseCost` is then derived automatically from the materials it uses.

The domain entities `MaterialSupplyUsage` and `VariantMaterialUsage` already exist in the codebase but are not yet wired into the DB context, migrations, API controllers, or frontend. This feature completes that wiring and removes the now-redundant `VariantSupplyUsage` and single `MaterialId` FK on `ProductVariant`.

---

## Glossary

- **Category**: A top-level grouping (e.g., "UV Printing", "Laser Cutting") that owns a set of Cost Parameters.
- **Cost_Parameter**: A unit-cost value scoped to a Category (e.g., `ink_cost_per_cm2 = 0.05 MXN/cm²`). Defined in `CostParameters` table.
- **Material**: A physical base item (e.g., "Ceramic Coaster 10cm") that belongs to a Category and carries a list of Supply Usages.
- **Material_Supply_Usage**: A record linking a Material to a Cost_Parameter with a specific quantity (e.g., "Ceramic Coaster uses 78.5 cm² of ink"). Stored in `MaterialSupplyUsages` table.
- **Material_Base_Cost**: The cached sum `Σ(Cost_Parameter.Value × Material_Supply_Usage.Quantity)` for a given Material. Recomputed and stored on every save.
- **Variant_Material_Usage**: A record linking a Product_Variant to a Material with a quantity multiplier (e.g., "Variant uses 1 unit of Ceramic Coaster"). Stored in `VariantMaterialUsages` table.
- **Product_Variant**: A purchasable SKU belonging to a Product. Its `BaseCost` is derived from its Variant_Material_Usages.
- **Variant_Base_Cost**: The sum `Σ(Material_Base_Cost × Variant_Material_Usage.Quantity)` across all materials used by a variant, plus electricity cost.
- **Pricing_Calculator**: The service that computes `BaseCost` and `Price = (BaseCost + Profit) × (1 + IVA)`.
- **Admin_UI**: The admin panel frontend (vanilla JS/HTML) used by Filamorfosis staff to manage materials, products, and costs.
- **VariantSupplyUsage**: The legacy table that directly linked variants to cost parameters. Removed by this feature.
- **Stock_Service**: The service responsible for evaluating material and variant stock status based on `Materials.StockQuantity` values.

---

## Requirements

### Requirement 1: Material Supply Usage Persistence

**User Story:** As a pricing manager, I want to define which cost parameters a material consumes and in what quantity, so that the material's cost is automatically derived from its category's cost parameters.

#### Acceptance Criteria

1. THE `MaterialSupplyUsages` table SHALL exist in the database with columns: `Id` (UUID PK), `MaterialId` (FK → Materials), `CostParameterId` (FK → CostParameters), `Quantity` (decimal, > 0), with a unique index on `(MaterialId, CostParameterId)`.
2. WHEN a Material is created or updated with a `SupplyUsages` map `{ costParameterId → quantity }`, THE `Material_API` SHALL persist the corresponding `MaterialSupplyUsage` rows, replacing any previous usages for that material.
3. IF a `SupplyUsages` entry references a `CostParameterId` that does not exist, THEN THE `Material_API` SHALL return HTTP 400 with a descriptive error.
4. IF a `SupplyUsages` entry has a quantity ≤ 0, THEN THE `Material_API` SHALL return HTTP 400 with a descriptive error.
5. WHEN a Material is deleted, THE `Material_API` SHALL cascade-delete all associated `MaterialSupplyUsage` rows.
6. IF a Material is referenced by one or more `VariantMaterialUsage` rows, THEN THE `Material_API` SHALL reject deletion with HTTP 409.

---

### Requirement 2: Material Base Cost Computation

**User Story:** As a pricing manager, I want the material's base cost to be automatically computed from its supply usages, so that I never have to enter a cost figure manually.

#### Acceptance Criteria

1. WHEN a Material's supply usages are saved, THE `Pricing_Calculator` SHALL compute `Material_Base_Cost = Σ(Cost_Parameter.Value × Material_Supply_Usage.Quantity)` and store it in `Materials.BaseCost`.
2. WHEN a Cost_Parameter's value is updated, THE `Material_API` SHALL recompute and persist `Material_Base_Cost` for every Material that references that Cost_Parameter.
3. THE `Material_API` SHALL return the computed `BaseCost` in the material response payload alongside the `SupplyUsages` list.
4. IF a Material has no supply usages, THEN THE `Pricing_Calculator` SHALL set `Material_Base_Cost` to 0.
5. FOR ALL valid sets of supply usages, computing `Material_Base_Cost`, then updating no cost parameters, then re-fetching the material SHALL return the same `BaseCost` value (idempotence property).

---

### Requirement 3: Variant Multi-Material Usage Persistence

**User Story:** As a product manager, I want to assign one or more base materials with quantities to a product variant, so that the variant's cost reflects all the physical materials it requires.

#### Acceptance Criteria

1. THE `VariantMaterialUsages` table SHALL exist in the database with columns: `Id` (UUID PK), `VariantId` (FK → ProductVariants), `MaterialId` (FK → Materials), `Quantity` (decimal, > 0), with a unique index on `(VariantId, MaterialId)`.
2. WHEN a Product_Variant is created or updated with a `MaterialUsages` map `{ materialId → quantity }`, THE `Product_API` SHALL persist the corresponding `VariantMaterialUsage` rows, replacing any previous usages for that variant.
3. IF a `MaterialUsages` entry references a `MaterialId` that does not exist, THEN THE `Product_API` SHALL return HTTP 400 with a descriptive error.
4. IF a `MaterialUsages` entry has a quantity ≤ 0, THEN THE `Product_API` SHALL return HTTP 400 with a descriptive error.
5. WHEN a Product_Variant is deleted, THE `Product_API` SHALL cascade-delete all associated `VariantMaterialUsage` rows.
6. THE `Product_API` SHALL return the `MaterialUsages` map `{ materialId → quantity }` in the variant response payload.

---

### Requirement 4: Variant Base Cost Computation

**User Story:** As a pricing manager, I want the variant's base cost to be automatically derived from its material usages, so that pricing is always consistent with the material cost model.

#### Acceptance Criteria

1. WHEN a Product_Variant is saved with a `MaterialUsages` map, THE `Pricing_Calculator` SHALL compute `Variant_Base_Cost = Σ(Material_Base_Cost × Variant_Material_Usage.Quantity) + (ManufactureTimeMinutes / 60 × electric_cost_per_hour)`.
2. THE `Product_API` SHALL store the computed `Variant_Base_Cost` in `ProductVariants.BaseCost` and compute `Price = (BaseCost + Profit) × (1 + IVA)`.
3. IF a Product_Variant has no material usages and no manufacture time, THEN THE `Pricing_Calculator` SHALL set `Variant_Base_Cost` to 0.
4. FOR ALL valid `MaterialUsages` inputs with non-negative quantities and profit, the computed `Price` SHALL equal `(Σ(Material_Base_Cost × quantity) + (minutes/60 × electricRate) + Profit) × (1 + IVA)`.
5. WHEN a Material's `BaseCost` changes (due to a Cost_Parameter update), THE `Product_API` SHALL expose an endpoint to trigger recomputation of `BaseCost` and `Price` for all variants that reference that material.

---

### Requirement 5: Legacy VariantSupplyUsage Removal

**User Story:** As a developer, I want the legacy direct variant-to-supply-usage link removed, so that the codebase has a single, consistent cost model.

#### Acceptance Criteria

1. THE database migration SHALL drop the `VariantSupplyUsages` table after migrating any existing data to `MaterialSupplyUsages`.
2. THE `ProductVariants` table SHALL have the `MaterialId` (single FK) column removed after migrating existing single-material references to `VariantMaterialUsages` rows with `Quantity = 1`.
3. THE `Product_API` SHALL no longer accept or return a `SupplyUsages` field on variant create/update requests.
4. THE `Product_API` SHALL no longer accept or return a `MaterialId` (single) field on variant create/update requests.
5. WHEN the migration runs, THE `Migration_Tool` SHALL create one `VariantMaterialUsage` row (Quantity = 1) for each existing `ProductVariant` that had a non-null `MaterialId`.
6. WHEN the migration runs, THE `Migration_Tool` SHALL create one `MaterialSupplyUsage` row for each existing `VariantSupplyUsage` row, associating the supply with the variant's former material, IF the variant had a non-null `MaterialId`.

---

### Requirement 6: Admin UI — Material Supply Usages Editor

**User Story:** As a pricing manager, I want to add, edit, and remove supply usages directly on the material form in the admin panel, so that I can configure material costs without leaving the material modal.

#### Acceptance Criteria

1. WHEN the admin opens the material create or edit modal, THE `Admin_UI` SHALL display a supply usages section listing all current supply usages for that material, showing the cost parameter label, unit, quantity, and computed line cost.
2. THE `Admin_UI` SHALL populate the supply usage cost parameter selector with only the Cost_Parameters belonging to the material's selected Category.
3. WHEN the admin changes the Category of a material, THE `Admin_UI` SHALL clear the existing supply usages list and repopulate the cost parameter selector with the new category's parameters.
4. THE `Admin_UI` SHALL allow the admin to add a new supply usage row by selecting a cost parameter and entering a quantity.
5. THE `Admin_UI` SHALL allow the admin to remove an existing supply usage row.
6. WHEN the admin saves the material, THE `Admin_UI` SHALL submit the `SupplyUsages` map to the `Material_API` and display the returned `BaseCost` in the material list.
7. IF the `Material_API` returns a validation error, THEN THE `Admin_UI` SHALL display the error message without closing the modal.

---

### Requirement 7: Admin UI — Variant Multi-Material Editor

**User Story:** As a product manager, I want to assign multiple base materials with quantities to a variant in the admin panel, so that I can model complex products that use more than one material.

#### Acceptance Criteria

1. WHEN the admin opens the variant create or edit form, THE `Admin_UI` SHALL display a material usages section replacing the former single-material dropdown.
2. THE `Admin_UI` SHALL allow the admin to add one or more material usage rows, each with a material selector and a quantity input.
3. THE `Admin_UI` SHALL populate the material selector with all available materials, optionally filtered by the product's category.
4. THE `Admin_UI` SHALL allow the admin to remove a material usage row.
5. WHEN the admin saves the variant, THE `Admin_UI` SHALL submit the `MaterialUsages` map to the `Product_API`.
6. WHEN the `Product_API` responds successfully, THE `Admin_UI` SHALL display the updated `BaseCost` and `Price` for the variant.
7. IF the `Product_API` returns a validation error, THEN THE `Admin_UI` SHALL display the error message without closing the form.

---

### Requirement 8: API — Material Supply Usages Endpoints

**User Story:** As a developer, I want dedicated API endpoints to read and manage material supply usages, so that the admin UI and future integrations can interact with the cost model programmatically.

#### Acceptance Criteria

1. THE `Material_API` SHALL expose `GET /api/v1/admin/materials` returning each material with its `SupplyUsages` list (costParameterId, label, unit, unitCost, quantity, totalCost) and computed `BaseCost`.
2. THE `Material_API` SHALL expose `GET /api/v1/admin/materials/{id}` returning the full material detail including `SupplyUsages`.
3. THE `Material_API` SHALL expose `POST /api/v1/admin/materials` accepting a `SupplyUsages` map `{ costParameterId → quantity }` in the request body.
4. THE `Material_API` SHALL expose `PUT /api/v1/admin/materials/{id}` accepting an optional `SupplyUsages` map; WHEN provided, THE `Material_API` SHALL replace all existing supply usages for that material.
5. WHEN `GET /api/v1/admin/materials` is called, THE `Material_API` SHALL return all materials ordered by name, each including the full `SupplyUsages` detail.

---

### Requirement 9: API — Variant Material Usages Endpoints

**User Story:** As a developer, I want the variant create/update endpoints to accept a multi-material usages map, so that the cost model is correctly applied when variants are saved.

#### Acceptance Criteria

1. THE `Product_API` SHALL expose `POST /api/v1/admin/products/{id}/variants` accepting a `MaterialUsages` map `{ materialId → quantity }` in the request body.
2. THE `Product_API` SHALL expose `PUT /api/v1/admin/products/{id}/variants/{variantId}` accepting an optional `MaterialUsages` map; WHEN provided, THE `Product_API` SHALL replace all existing material usages for that variant.
3. WHEN a variant is fetched via `GET /api/v1/admin/products/{id}`, THE `Product_API` SHALL include the `MaterialUsages` map `{ materialId → quantity }` in each variant's response.
4. THE `Product_API` SHALL expose `POST /api/v1/admin/materials/{id}/recompute-variants` that recomputes `BaseCost` and `Price` for all variants referencing the given material.

---

### Requirement 10: Data Integrity and Cascade Rules

**User Story:** As a developer, I want referential integrity enforced at the database level, so that orphaned cost records cannot exist.

#### Acceptance Criteria

1. THE database SHALL enforce a foreign key from `MaterialSupplyUsages.MaterialId` to `Materials.Id` with `ON DELETE CASCADE`.
2. THE database SHALL enforce a foreign key from `MaterialSupplyUsages.CostParameterId` to `CostParameters.Id` with `ON DELETE CASCADE`.
3. THE database SHALL enforce a foreign key from `VariantMaterialUsages.VariantId` to `ProductVariants.Id` with `ON DELETE CASCADE`.
4. THE database SHALL enforce a foreign key from `VariantMaterialUsages.MaterialId` to `Materials.Id` with `ON DELETE RESTRICT`.
5. IF a Material is referenced by any `VariantMaterialUsage`, THEN THE `Material_API` SHALL return HTTP 409 when a delete is attempted, with a message indicating which variants reference it.
6. THE database SHALL enforce a unique constraint on `(MaterialId, CostParameterId)` in `MaterialSupplyUsages`.
7. THE database SHALL enforce a unique constraint on `(VariantId, MaterialId)` in `VariantMaterialUsages`.

---

### Requirement 11: Stock Tracking via Base Materials

**User Story:** As a store manager, I want stock availability to be tracked at the base material level, so that product variants automatically reflect out-of-stock status when any of their required materials are unavailable.

#### Acceptance Criteria

1. THE `Materials` table SHALL include a `StockQuantity` column (integer, ≥ 0, default 0).
2. WHEN a Material's `StockQuantity` is greater than 0, THE `Stock_Service` SHALL consider that material as "in stock".
3. WHEN a Material's `StockQuantity` equals 0, THE `Stock_Service` SHALL consider that material as "out of stock".
4. WHEN a Product_Variant is evaluated for stock status, THE `Stock_Service` SHALL compute the variant as "in stock" only if ALL of its associated base materials have `StockQuantity` > 0.
5. IF ANY base material referenced by a Product_Variant has `StockQuantity` = 0, THEN THE `Stock_Service` SHALL mark that variant as "out of stock".
6. WHEN `GET /api/v1/admin/products/{id}` is called, THE `Product_API` SHALL include an `inStock` boolean field on each variant response, derived from the variant's material stock statuses.
7. WHEN `GET /api/v1/products/{id}` (storefront) is called, THE `Product_API` SHALL include an `inStock` boolean field on each variant response so the storefront can reflect availability.
8. WHEN the admin views the product/variant grid table, THE `Admin_UI` SHALL display a clear in-stock or out-of-stock indicator for each variant, derived from the variant's material stock statuses.
9. WHEN the admin views the materials list, THE `Admin_UI` SHALL display the `StockQuantity` for each material and allow the admin to edit it inline or via the material edit modal.
10. WHEN the admin saves a material with an updated `StockQuantity`, THE `Material_API` SHALL persist the new value and return it in the material response payload.
11. IF a `StockQuantity` value submitted to the `Material_API` is negative, THEN THE `Material_API` SHALL return HTTP 400 with a descriptive error.
12. WHEN a Product_Variant is out of stock on the storefront, THE `Admin_UI` SHALL prevent customers from adding that variant to the cart and display an "out of stock" label in place of the add-to-cart button.
