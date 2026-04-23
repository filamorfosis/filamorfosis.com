# Requirements Document

## Introduction

This feature adds a Cost Management and Pricing system to the Filamorfosis admin panel.
It covers four areas:

1. **Multi-role admin users** — admin users can hold multiple roles simultaneously (checkboxes
   instead of a single dropdown), and a new `PriceManagement` role is introduced.
2. **Materials catalog** — a catalog of physical materials scoped to a printing category, with
   dimensions, weight, and base cost per unit.
3. **Cost parameters per category** — per-category machine and consumable cost parameters
   (ink, filament, electric cost, etc.) used in the pricing formulas.
4. **Global parameters** — system-wide settings such as the IVA tax rate, editable by
   authorized admins.
5. **Pricing calculator service** — a backend service that computes `BaseCost`, `TotalCost`,
   and `Price` (tax-inclusive) from material, process, profit, and tax inputs.
6. **Cost Management admin tab** — a dedicated "Costos" tab in the admin SPA for managing
   materials, cost parameters, and global parameters.
7. **Variant-level cost fields** — product variants reference a material and carry process-
   specific fields; `Price` is always the tax-inclusive final cost; only `Profit` is editable.

---

## Glossary

- **Admin_Panel**: The Filamorfosis admin SPA served at `admin.html`.
- **Admin_User**: A `User` entity that holds at least one admin role.
- **Role**: An ASP.NET Core Identity role string. Valid values: `Master`, `OrderManagement`,
  `ProductManagement`, `UserManagement`, `PriceManagement`.
- **PriceManagement**: The admin role that grants access to the Cost Management tab and all
  pricing-related endpoints.
- **Material**: A catalog entity scoped to a `Category` with fields `Id`, `Name`, `Category`,
  `SizeLabel`, `WidthCm`, `HeightCm`, `WeightGrams`, `BaseCost`, `CreatedAt`.
- **PrintArea**: Derived value `WidthCm × HeightCm` (cm²), used in UV and Photo formulas.
- **CostParameter**: A per-category configuration entity with fields `Id`, `Category`, `Key`,
  `Label`, `Value` (decimal), `UpdatedAt`.
- **GlobalParameter**: A system-wide key/value configuration entity with fields `Id`, `Key`,
  `Label`, `Value` (string), `UpdatedAt`. The key `tax_rate` stores the IVA rate as a decimal
  string (e.g. `"0.16"`).
- **TaxRate**: The IVA rate read from `GlobalParameter` with key `tax_rate`; default `0.16`
  (16 %).
- **BaseCost**: The computed production cost for a variant — material cost plus process cost
  (ink, filament, electric, etc.). Formula varies by category (see Requirement 4).
- **Profit**: A decimal amount entered by the admin on a variant representing the desired
  margin. Replaces the former "AggregatedCost" field.
- **TotalCost**: `BaseCost + Profit`.
- **Price**: `TotalCost + TotalCost × TaxRate` = `(BaseCost + Profit) × (1 + TaxRate)`.
  This is the tax-inclusive price stored on the variant and shown to the client. Shipping is
  added at checkout and is not part of `Price`.
- **FinalCostForClient**: `Price + Shipping`; computed at checkout, not stored on the variant.
- **PricingCalculatorService**: The backend service (`IPricingCalculatorService`) that
  implements all pricing formulas.
- **Cost_Management_Tab**: The admin tab labelled "Costos", visible only to `Master` and
  `PriceManagement` users.
- **Materials_Table**: The UI table inside the Cost Management tab listing all `Material`
  records with CRUD actions.
- **Cost_Parameters_Section**: The UI section showing editable `CostParameter` records grouped
  by printing category.
- **Global_Parameters_Section**: The UI section showing editable `GlobalParameter` records
  (e.g. TaxRate).
- **Variant_Edit_Modal**: The existing modal in the Products tab used to create or edit a
  `ProductVariant`.

---

## Requirements

### Requirement 1: Multi-Role Admin Users

**User Story:** As a Master admin, I want to assign multiple roles to an admin user at the same
time, so that one person can manage both products and pricing without needing two accounts.

#### Acceptance Criteria

1. THE `Admin_Panel` SHALL render role selection as a group of checkboxes (one per role) instead
   of a single-select dropdown when creating or editing an `Admin_User`.
2. WHEN a Master admin submits a role update for an `Admin_User`, THE `AdminUsersController`
   SHALL accept a list of one or more role strings and replace the user's current roles with
   that list.
3. IF the submitted roles list is empty, THEN THE `AdminUsersController` SHALL return HTTP 400
   with a descriptive error message.
4. IF any submitted role string is not one of `Master`, `OrderManagement`, `ProductManagement`,
   `UserManagement`, or `PriceManagement`, THEN THE `AdminUsersController` SHALL return HTTP 400
   with a descriptive error message.
5. THE `AdminUsersController` SHALL include `PriceManagement` as a valid assignable role in all
   role-validation logic.
6. WHEN a Master admin creates a new `Admin_User`, THE `AdminUsersController` SHALL accept a
   list of roles (defaulting to `["OrderManagement"]` when omitted) and assign all listed roles.
7. THE `Admin_Panel` SHALL display all roles held by an `Admin_User` as individual badges in the
   admin users table.
8. IF a Master admin attempts to modify their own roles, THEN THE `AdminUsersController` SHALL
   return HTTP 403 (self-modification protection is preserved from existing behavior).

---

### Requirement 2: Materials Catalog

**User Story:** As a PriceManagement admin, I want to manage a catalog of materials scoped to a
printing category, with physical dimensions, weight, and base cost, so that product variants can
reference accurate cost data and print-area calculations are automatic.

#### Acceptance Criteria

1. THE `MaterialsController` SHALL expose `GET /api/v1/admin/materials` returning a paginated
   list of all `Material` records ordered by `Name` ascending.
2. WHEN a valid create request is submitted to `POST /api/v1/admin/materials`, THE
   `MaterialsController` SHALL persist a new `Material` record and return HTTP 201 with the
   created entity.
3. IF a create request is submitted with a blank `Name`, THEN THE `MaterialsController` SHALL
   return HTTP 400 with a descriptive error.
4. IF a create request is submitted with a `BaseCost` less than zero, THEN THE
   `MaterialsController` SHALL return HTTP 400 with a descriptive error.
5. WHEN a valid update request is submitted to `PUT /api/v1/admin/materials/{id}`, THE
   `MaterialsController` SHALL update the `Material` record and return HTTP 200 with the updated
   entity.
6. IF `PUT /api/v1/admin/materials/{id}` is called with an `id` that does not exist, THEN THE
   `MaterialsController` SHALL return HTTP 404.
7. WHEN `DELETE /api/v1/admin/materials/{id}` is called for a `Material` not referenced by any
   `ProductVariant`, THE `MaterialsController` SHALL delete the record and return HTTP 204.
8. IF `DELETE /api/v1/admin/materials/{id}` is called for a `Material` referenced by one or
   more `ProductVariant` records, THEN THE `MaterialsController` SHALL return HTTP 409 with a
   descriptive error.
9. THE `MaterialsController` SHALL require the caller to hold the `Master` or `PriceManagement`
   role.
10. THE `Material` entity SHALL store: `Id` (Guid), `Name` (string), `Category` (string),
    `SizeLabel` (string, nullable), `WidthCm` (decimal, nullable), `HeightCm` (decimal,
    nullable), `WeightGrams` (int, nullable), `BaseCost` (decimal, MXN), `CreatedAt` (DateTime).
11. WHEN `GET /api/v1/admin/materials` is called with a `category` query parameter, THE
    `MaterialsController` SHALL return only `Material` records whose `Category` matches the
    supplied value.

---

### Requirement 3: Cost Parameters per Category

**User Story:** As a PriceManagement admin, I want to configure machine and consumable cost
parameters per printing category, so that pricing formulas reflect real operational costs for
each production process.

#### Acceptance Criteria

1. THE `CostParametersController` SHALL expose `GET /api/v1/admin/cost-parameters` returning
   all `CostParameter` records grouped by `Category`.
2. WHEN a valid upsert request is submitted to
   `PUT /api/v1/admin/cost-parameters/{category}/{key}`, THE `CostParametersController` SHALL
   create or update the matching `CostParameter` record and return HTTP 200 with the saved
   entity.
3. IF the `Value` field in an upsert request is negative, THEN THE `CostParametersController`
   SHALL return HTTP 400 with a descriptive error.
4. THE `CostParametersController` SHALL require the `Master` or `PriceManagement` role.
5. THE `CostParameter` entity SHALL store: `Id` (Guid), `Category` (string), `Key` (string),
   `Label` (string), `Value` (decimal), `UpdatedAt` (DateTime).
6. THE `CostParameter` table SHALL enforce a unique constraint on `(Category, Key)`.
7. THE `CostParametersController` SHALL seed the following default parameters on first run if
   none exist for a given category:

   **Category `UV Printing`**
   - `electric_cost_per_hour` — Electric cost per hour (MXN/hr)
   - `ink_cost_flat_per_cm2` — Ink cost per cm² for flat print (MXN/cm²)
   - `ink_cost_relief_per_cm2` — Ink cost per cm² for relief print (MXN/cm²)

   **Category `3D Printing`**
   - `filament_cost_per_gram` — Filament cost per gram (MXN/g)
   - `electric_cost_per_hour` — Electric cost per hour (MXN/hr)

   **Category `Laser Engraving`**
   - `electric_cost_per_hour` — Electric cost per hour (MXN/hr)

   **Category `Laser Cutting`**
   - `electric_cost_per_hour` — Electric cost per hour (MXN/hr)

   **Category `Photo Printing`**
   - `paper_cost_per_cm2` — Paper cost per cm² (MXN/cm²)
   - `ink_cost_per_cm2` — Ink cost per cm² (MXN/cm²)
   - `electric_cost_per_hour` — Electric cost per hour (MXN/hr)

---

### Requirement 4: Pricing Calculator Service

**User Story:** As a PriceManagement admin, I want a pricing calculator that computes BaseCost,
TotalCost, and the tax-inclusive Price from material, process, profit, and tax inputs, so that
variant prices are derived consistently across all printing categories.

#### Acceptance Criteria

1. THE `PricingCalculatorService` SHALL implement the following `BaseCost` formulas by category:

   **UV Printing**
   ```
   BaseCost = Material.BaseCost
            + (PrintArea × InkCostPerCm2)
            + (ManufactureTimeMinutes / 60 × ElectricCostPerHour)
   ```
   Where `InkCostPerCm2` is `ink_cost_flat_per_cm2` when `PrintType = "Flat"` and
   `ink_cost_relief_per_cm2` when `PrintType = "Relief"`.
   `PrintArea = Material.WidthCm × Material.HeightCm`.

   **3D Printing**
   ```
   BaseCost = Material.BaseCost
            + (FilamentGrams × FilamentCostPerGram)
            + (PrintTimeHours × ElectricCostPerHour)
   ```
   Where `PrintTimeHours = ManufactureTimeMinutes / 60`.

   **Laser Engraving**
   ```
   BaseCost = Material.BaseCost
            + (ManufactureTimeMinutes / 60 × ElectricCostPerHour)
   ```

   **Laser Cutting**
   ```
   BaseCost = Material.BaseCost
            + (ManufactureTimeMinutes / 60 × ElectricCostPerHour)
   ```

   **Photo Printing**
   ```
   BaseCost = (PrintArea × PaperCostPerCm2)
            + (PrintArea × InkCostPerCm2)
            + (ManufactureTimeMinutes / 60 × ElectricCostPerHour)
   ```
   Note: `Material.BaseCost` is 0 for photo printing because the paper cost is already
   captured via `PaperCostPerCm2`. `PrintArea = Material.WidthCm × Material.HeightCm`.

2. THE `PricingCalculatorService` SHALL compute `Price` as:
   ```
   TotalCost = BaseCost + Profit
   Price     = TotalCost × (1 + TaxRate)
   ```
   Where `TaxRate` is read from `GlobalParameter` with key `tax_rate`.

3. IF `BaseCost` is negative, THEN THE `PricingCalculatorService` SHALL throw an
   `ArgumentOutOfRangeException`.
4. IF `Profit` is negative, THEN THE `PricingCalculatorService` SHALL throw an
   `ArgumentOutOfRangeException`.
5. IF `TaxRate` is negative, THEN THE `PricingCalculatorService` SHALL throw an
   `ArgumentOutOfRangeException`.
6. THE `PricingCalculatorService` SHALL be registered in the DI container as
   `IPricingCalculatorService` with a scoped lifetime.
7. FOR ALL non-negative `BaseCost` values `b`, `Profit` values `p`, and `TaxRate` value `t`,
   `Price` SHALL equal `(b + p) × (1 + t)` (formula round-trip: compute then verify).
8. FOR ALL non-negative `BaseCost` values `b` and `TaxRate` value `t`,
   `ComputePrice(b, profit: 0, t)` SHALL equal `b × (1 + t)` (zero-profit identity).

---

### Requirement 5: Cost Management Admin Tab

**User Story:** As a PriceManagement admin, I want a dedicated "Costos" tab in the admin panel
that shows materials, cost parameters, and global parameters, so that I can manage all pricing
data in one place.

#### Acceptance Criteria

1. THE `Admin_Panel` SHALL render a "Costos" tab button in the tab bar WHEN the authenticated
   user holds the `Master` or `PriceManagement` role.
2. WHILE the "Costos" tab is active, THE `Admin_Panel` SHALL display the `Materials_Table`,
   the `Cost_Parameters_Section`, and the `Global_Parameters_Section`.
3. THE `Materials_Table` SHALL display columns: Name, Category, Size, Width (cm), Height (cm),
   Weight (g), Base Cost (MXN), and Actions (Edit / Delete).
4. WHEN the admin clicks "Agregar Material", THE `Admin_Panel` SHALL open a modal form with
   fields: Name (required), Category (required, dropdown of printing categories), Size Label
   (optional), Width cm (optional, decimal), Height cm (optional, decimal), Weight in grams
   (optional, integer), Base Cost in MXN (required, decimal).
5. WHEN the admin submits the add-material form with valid data, THE `Admin_Panel` SHALL call
   `POST /api/v1/admin/materials`, refresh the `Materials_Table`, and show a success toast.
6. IF the add-material form is submitted with a blank Name or blank Base Cost, THE `Admin_Panel`
   SHALL display an inline validation error and SHALL NOT submit the request.
7. WHEN the admin clicks the Edit action on a material row, THE `Admin_Panel` SHALL open a
   pre-populated edit modal and, on save, call `PUT /api/v1/admin/materials/{id}`.
8. WHEN the admin clicks the Delete action on a material row, THE `Admin_Panel` SHALL show a
   confirmation dialog and, on confirm, call `DELETE /api/v1/admin/materials/{id}`.
9. IF the delete call returns HTTP 409, THE `Admin_Panel` SHALL display an error toast
   explaining the material is in use and cannot be deleted.
10. THE `Cost_Parameters_Section` SHALL render one editable row per `CostParameter`, grouped
    under their `Category` heading, with an inline save button per row.
11. WHEN the admin edits a cost parameter value and clicks save, THE `Admin_Panel` SHALL call
    `PUT /api/v1/admin/cost-parameters/{category}/{key}` and show a success toast on HTTP 200.
12. THE `Global_Parameters_Section` SHALL render one editable row per `GlobalParameter`
    (including the `tax_rate` row labelled "IVA (%)"), with an inline save button per row.
13. WHEN the admin edits the `tax_rate` value and clicks save, THE `Admin_Panel` SHALL call
    `PUT /api/v1/admin/global-parameters/tax_rate` and show a success toast on HTTP 200.

---

### Requirement 6: Variant Material Selection and Cost Fields

**User Story:** As a ProductManagement admin, I want to select a base material for a product
variant and enter process-specific fields so that BaseCost is computed automatically and Price
always reflects the tax-inclusive final cost.

#### Acceptance Criteria

1. THE `Variant_Edit_Modal` SHALL include a "Material Base" dropdown populated from
   `GET /api/v1/admin/materials`.
2. WHEN the admin selects a material from the dropdown, THE `Variant_Edit_Modal` SHALL
   auto-populate the Size Label, Width, Height, Weight, and Base Cost display fields from the
   selected `Material` record.
3. THE `Variant_Edit_Modal` SHALL display the following process-specific input fields, shown
   conditionally based on the selected material's `Category`:
   - All categories: `ManufactureTimeMinutes` (integer, nullable)
   - UV Printing only: `PrintType` (dropdown: "Flat" / "Relief")
   - 3D Printing only: `FilamentGrams` (decimal, nullable)
4. THE `Variant_Edit_Modal` SHALL include a "Profit" numeric input (MXN, decimal, default 0)
   representing the admin's desired margin.
5. THE `Variant_Edit_Modal` SHALL include a read-only "Price" field that displays
   `(BaseCost + Profit) × (1 + TaxRate)` and updates in real time as `Profit` changes.
6. THE `Variant_Edit_Modal` SHALL NOT allow the admin to directly edit the `Price` field.
7. WHEN the admin saves the variant, THE `AdminProductsController` SHALL compute `BaseCost`
   via `PricingCalculatorService`, persist `MaterialId`, `Profit`, `BaseCost`,
   `ManufactureTimeMinutes`, `FilamentGrams`, `PrintType`, and set `Price` equal to
   `(BaseCost + Profit) × (1 + TaxRate)`.
8. THE `ProductVariant` entity SHALL store: `MaterialId` (Guid, nullable FK to `Material`),
   `Profit` (decimal, default 0), `BaseCost` (decimal, default 0),
   `ManufactureTimeMinutes` (int, nullable), `FilamentGrams` (decimal, nullable),
   `PrintType` (string, nullable — "Flat" or "Relief").
9. IF the admin clears the material selection, THEN THE `Variant_Edit_Modal` SHALL clear all
   auto-populated fields and set `BaseCost` to 0, recalculating `Price` as
   `Profit × (1 + TaxRate)`.
10. WHEN `GET /api/v1/admin/products/{id}` is called, THE `AdminProductsController` SHALL
    include `materialId`, `materialName`, `baseCost`, `profit`, `manufactureTimeMinutes`,
    `filamentGrams`, `printType`, and `price` in each `ProductVariantDto`.
11. IF a variant has no `MaterialId`, THEN THE `AdminProductsController` SHALL return
    `materialId: null`, `materialName: null`, `baseCost: 0`, and `price` equal to
    `Profit × (1 + TaxRate)`.
12. FOR ALL variants where `MaterialId` is set, the persisted `Price` SHALL equal
    `(BaseCost + Profit) × (1 + TaxRate)` (round-trip property: save then fetch returns the
    same computed value).

---

### Requirement 7: Global Parameters (TaxRate)

**User Story:** As a Master admin, I want to store and edit system-wide parameters such as the
IVA tax rate, so that pricing calculations across all variants automatically reflect the current
tax rate without requiring code changes.

#### Acceptance Criteria

1. THE `GlobalParametersController` SHALL expose
   `GET /api/v1/admin/global-parameters` returning all `GlobalParameter` records.
2. WHEN a valid update request is submitted to
   `PUT /api/v1/admin/global-parameters/{key}`, THE `GlobalParametersController` SHALL update
   the matching `GlobalParameter` record and return HTTP 200 with the updated entity.
3. IF `PUT /api/v1/admin/global-parameters/{key}` is called with a `key` that does not exist,
   THEN THE `GlobalParametersController` SHALL return HTTP 404.
4. IF the `Value` submitted for `tax_rate` cannot be parsed as a decimal in the range
   `[0, 1]`, THEN THE `GlobalParametersController` SHALL return HTTP 400 with a descriptive
   error.
5. THE `GlobalParametersController` SHALL seed a `GlobalParameter` record with
   `Key = "tax_rate"`, `Label = "IVA (%)"`, and `Value = "0.16"` on first run if it does not
   exist.
6. THE `GlobalParametersController` SHALL require the `Master` or `PriceManagement` role.
7. THE `GlobalParameter` entity SHALL store: `Id` (Guid), `Key` (string, unique), `Label`
   (string), `Value` (string), `UpdatedAt` (DateTime).
8. WHEN `PricingCalculatorService` computes a `Price`, THE `PricingCalculatorService` SHALL
   read `TaxRate` from the `GlobalParameter` record with `Key = "tax_rate"` at computation
   time, so that any update to `tax_rate` is reflected in all subsequent price calculations
   without restarting the application.
9. FOR ALL `tax_rate` values `t` in `[0, 1]`, updating `tax_rate` to `t` and then computing
   `Price` for a variant with `BaseCost = b` and `Profit = p` SHALL yield
   `(b + p) × (1 + t)` (round-trip property: update parameter then verify formula).
