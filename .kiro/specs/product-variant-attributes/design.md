# Product Variant Attributes — Bugfix Design

## Overview

`ProductVariant` currently carries a hardcoded `Material TEXT NULL` column that was added via
migration `20260419233128_AddVariantMaterial`. This column can only represent one attribute type
and cannot accommodate the variety of attributes different products need (Size, Color, Finish,
Weight, etc.).

The fix replaces the `Material` column with a three-table catalog-driven attribute system:

- **AttributeDefinition** — a global catalog of named attributes (e.g. "Size", "Color", "Material").
- **ProductAttributeDefinition** — a join table declaring which attributes a given product uses.
- **VariantAttributeValue** — per-variant values for each declared attribute.

All code that reads or writes `Material` is removed and replaced by this flexible system. The
fix is purely additive on the domain model (new tables, new endpoints) plus a targeted removal
of the `Material` column and its associated DTO/controller surface.

---

## Glossary

- **Bug_Condition (C)**: The condition that triggers the defect — a `ProductVariant` that needs
  to represent more than one attribute dimension, or any attribute that is not "Material".
- **Property (P)**: The desired behavior when the bug condition holds — the variant's response
  body SHALL include an `attributes` array and SHALL NOT include a `material` field.
- **Preservation**: All existing variant core fields (`sku`, `labelEs`, `labelEn`, `price`,
  `stockQuantity`, `isAvailable`, `acceptsDesignFile`, `effectivePrice`, `discounts`) and all
  non-variant endpoints must remain unchanged by this fix.
- **AttributeDefinition**: Entity in `Filamorfosis.Domain.Entities` with `Id (Guid)`,
  `Name (string)`, `CreatedAt (DateTime)`. Stored in table `AttributeDefinitions`.
- **ProductAttributeDefinition**: Join entity with composite PK `(ProductId, AttributeDefinitionId)`.
  Stored in table `ProductAttributeDefinitions`.
- **VariantAttributeValue**: Entity with `Id (Guid)`, `VariantId (FK)`,
  `AttributeDefinitionId (FK)`, `Value (string)`. Stored in table `VariantAttributeValues`.
- **MapVariant**: The private static helper in `AdminProductsController` (and `ProductsController`)
  that projects a `ProductVariant` entity to `ProductVariantDto`.
- **isBugCondition(X)**: Pseudocode predicate — returns `true` when a variant is asked to carry
  attributes that the `Material` column cannot represent.

---

## Bug Details

### Bug Condition

The bug manifests whenever the system is asked to represent variant-level attributes. The
`Material` column on `ProductVariant` can only store a single free-text value, making it
impossible to record other attribute types on the same variant. The `CreateVariantRequest` /
`UpdateVariantRequest` DTOs accept only a `material` field, and `ProductVariantDto` exposes only
`material`, cementing the wrong schema at every layer.

**Formal Specification:**

```
FUNCTION isBugCondition(X)
  INPUT:  X of type ProductVariant (or a create/update request for one)
  OUTPUT: boolean

  RETURN X requires more than one attribute dimension
      OR X requires an attribute that is not "Material"
      OR caller expects response.attributes to exist
      OR caller expects response.material to NOT exist
END FUNCTION
```

### Examples

- **Bug**: Creating a UV-print variant that needs both "Material" (Glass) and "Size" (20cm) —
  the system can only store one of them; the other is silently dropped.
- **Bug**: `GET /api/v1/admin/products/{id}` returns `{ ..., "material": "Vidrio" }` on each
  variant; there is no `attributes` array, so the frontend cannot render multi-attribute variants.
- **Bug**: The variant edit modal in `admin.html` shows a hardcoded `<select id="vmod-material">`
  populated from `CategoryAttribute` records with `attributeType = "material"`, which is a misuse
  of the category-attribute table and does not scale.
- **Edge case**: A variant with no attributes at all — `material: null` — should map cleanly to
  `attributes: []` after the fix, with no data loss.

---

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**

- `GET /api/v1/products` (storefront) SHALL continue to return paginated product summaries with
  all existing fields (`id`, `slug`, `titles`, `descriptions`, `tags`, `imageUrls`, `badge`,
  `basePrice`, `isActive`, `categoryId`).
- Variant core fields (`sku`, `labelEs`, `labelEn`, `price`, `stockQuantity`, `isAvailable`,
  `acceptsDesignFile`, `effectivePrice`) SHALL be persisted and returned correctly, unaffected
  by the attribute system changes.
- `DELETE /api/v1/admin/products/{id}/variants/{variantId}` SHALL continue to return HTTP 409
  when the variant is referenced by an order or active cart, and HTTP 204 on successful deletion.
- Discount computation (`effectivePrice`) SHALL continue to work correctly alongside the new
  `attributes` array.
- The admin product table (variant count, active/inactive badge, all product-level fields) SHALL
  continue to render without regression.

**Scope:**

All inputs that do NOT involve the `material` field or the new attribute endpoints are completely
unaffected by this fix. This includes:

- All product CRUD operations (create, update, delete, list, get-by-id).
- All image upload/delete operations.
- All discount operations (product-level and variant-level).
- All order, user, and category endpoints.
- All storefront (non-admin) product and cart endpoints.

---

## Hypothesized Root Cause

1. **Wrong schema design at inception**: The `AddVariantMaterial` migration added a single
   `Material TEXT NULL` column directly to `ProductVariants` instead of introducing a
   catalog-driven attribute table. This is the root cause — the schema cannot represent
   multi-dimensional variant attributes.

2. **DTO mirrors the schema defect**: `ProductVariantDto.Material` and the `material` field in
   `CreateVariantRequest` / `UpdateVariantRequest` propagate the wrong shape all the way to the
   API surface and the frontend.

3. **Frontend hardcodes the attribute type**: `admin-products.js` renders a `<select>` for
   "Material" in both the add-variant form and the variant edit modal, and `MapVariant` in
   `AdminProductsController` sets `Material = v.Material`. There is no mechanism to add or
   display other attribute types.

4. **No attribute catalog exists**: There is no `AttributeDefinitions` table, no
   `ProductAttributeDefinitions` join table, and no `VariantAttributeValues` table. The entire
   attribute system must be created from scratch.

---

## Correctness Properties

Property 1: Bug Condition — Variant Attributes Replace Material Field

_For any_ create or update request where `isBugCondition` holds (i.e., the caller supplies an
`attributes` array and/or expects no `material` field in the response), the fixed
`CreateVariant` / `UpdateVariant` endpoints SHALL persist each `{ attributeDefinitionId, value }`
element as a `VariantAttributeValue` row and return a `ProductVariantDto` that contains
`attributes: [{ attributeDefinitionId, name, value }]` and does NOT contain a `material` field.

**Validates: Requirements 2.1, 2.2, 2.5, 2.6**

Property 2: Preservation — Core Variant Fields Unchanged

_For any_ create or update request where `isBugCondition` does NOT hold (i.e., the request only
touches core fields: `labelEs`, `labelEn`, `sku`, `price`, `stockQuantity`, `isAvailable`,
`acceptsDesignFile`), the fixed endpoints SHALL produce exactly the same core-field values in
the response as the original endpoints, preserving all existing variant behavior.

**Validates: Requirements 3.1, 3.2, 3.3, 3.5**

---

## Fix Implementation

### Data Model

```
AttributeDefinitions
  Id              GUID PK
  Name            TEXT NOT NULL
  CreatedAt       DATETIME NOT NULL

ProductAttributeDefinitions
  ProductId           GUID FK → Products.Id  (cascade delete)
  AttributeDefinitionId GUID FK → AttributeDefinitions.Id (cascade delete)
  PRIMARY KEY (ProductId, AttributeDefinitionId)

VariantAttributeValues
  Id                    GUID PK
  VariantId             GUID FK → ProductVariants.Id  (cascade delete)
  AttributeDefinitionId GUID FK → AttributeDefinitions.Id (cascade delete)
  Value                 TEXT NOT NULL
  UNIQUE (VariantId, AttributeDefinitionId)
```

### EF Core Migration: `AddAttributeSystem`

Timestamp: `20260420000000_AddAttributeSystem` (next after `20260419233128_AddVariantMaterial`).

**Up:**
1. Drop column `Material` from `ProductVariants`.
2. Create table `AttributeDefinitions` (`Id`, `Name`, `CreatedAt`).
3. Create table `ProductAttributeDefinitions` (`ProductId` FK, `AttributeDefinitionId` FK,
   composite PK).
4. Create table `VariantAttributeValues` (`Id`, `VariantId` FK, `AttributeDefinitionId` FK,
   `Value`, unique index on `(VariantId, AttributeDefinitionId)`).

**Down:** reverse — drop the three new tables, re-add `Material` column.

### Changes Required

**File: `backend/Filamorfosis.Domain/Entities/ProductVariant.cs`**
1. Remove `public string? Material { get; set; }` property.
2. Add navigation: `public ICollection<VariantAttributeValue> AttributeValues { get; set; } = new List<VariantAttributeValue>();`

**New files: `backend/Filamorfosis.Domain/Entities/`**
- `AttributeDefinition.cs` — `Id`, `Name`, `CreatedAt`.
- `ProductAttributeDefinition.cs` — `ProductId`, `AttributeDefinitionId`, nav properties.
- `VariantAttributeValue.cs` — `Id`, `VariantId`, `AttributeDefinitionId`, `Value`, nav properties.

**File: `backend/Filamorfosis.Infrastructure/Data/FilamorfosisDbContext.cs`**
1. Add `DbSet<AttributeDefinition>`, `DbSet<ProductAttributeDefinition>`,
   `DbSet<VariantAttributeValue>`.
2. Configure composite PK for `ProductAttributeDefinition`.
3. Configure FK relationships and cascade deletes for all three new entities.
4. Configure unique index on `VariantAttributeValues (VariantId, AttributeDefinitionId)`.
5. Update `Product` → `Variants` include to also include `VariantAttributeValues` where needed.

**File: `backend/Filamorfosis.Application/DTOs/ProductVariantDto.cs`**
1. Remove `public string? Material { get; set; }`.
2. Add `public List<VariantAttributeValueDto> Attributes { get; set; } = new();`

**New DTO file: `backend/Filamorfosis.Application/DTOs/AttributeDtos.cs`**
```csharp
public class VariantAttributeValueDto
{
    public Guid AttributeDefinitionId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
}

public class AttributeDefinitionDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class SetVariantAttributesRequest
{
    public List<VariantAttributeInput> Attributes { get; set; } = new();
}

public class VariantAttributeInput
{
    public Guid AttributeDefinitionId { get; set; }
    public string Value { get; set; } = string.Empty;
}

public class AddProductAttributeRequest
{
    public Guid AttributeDefinitionId { get; set; }
}

public class CreateAttributeDefinitionRequest
{
    public string Name { get; set; } = string.Empty;
}
```

**File: `backend/Filamorfosis.Application/DTOs/AdminProductDtos.cs`**
1. Remove `public string? Material { get; set; }` from `CreateVariantRequest`.
2. Remove `public string? Material { get; set; }` from `UpdateVariantRequest`.
3. Add `public List<VariantAttributeInput> Attributes { get; set; } = new();` to both.

**File: `backend/Filamorfosis.API/Controllers/AdminProductsController.cs`**
1. Update `CreateVariant`: after saving the variant, upsert `VariantAttributeValue` rows from
   `req.Attributes`. Remove `Material = req.Material`.
2. Update `UpdateVariant`: replace all existing `VariantAttributeValue` rows for the variant
   with the new set from `req.Attributes`. Remove `v.Material = req.Material`.
3. Update `MapVariant`: remove `Material = v.Material`; add
   `Attributes = v.AttributeValues.Select(a => new VariantAttributeValueDto { ... }).ToList()`.
4. Update `GetById` and `GetAll` includes to load `VariantAttributeValues` and their
   `AttributeDefinition` navigation.

**New file: `backend/Filamorfosis.API/Controllers/AdminAttributeDefinitionsController.cs`**

```
[Route("api/v1/admin/attribute-definitions")]
[Authorize(Roles = "Master,ProductManagement")]
[RequireMfa]

GET  /                          → list all AttributeDefinitions (ordered by Name)
POST /                          → create a new AttributeDefinition (returns 201)
POST /api/v1/admin/products/{id}/attributes
                                → add an AttributeDefinition to a product (201 or 409 if duplicate)
DELETE /api/v1/admin/products/{id}/attributes/{attributeDefinitionId}
                                → remove an AttributeDefinition from a product (204)
```

**File: `backend/Filamorfosis.API/Controllers/ProductsController.cs`** (storefront)
1. Update `MapVariant` (or equivalent) to remove `Material`, add `Attributes` array — same
   pattern as admin controller.
2. Update includes to load `VariantAttributeValues` + `AttributeDefinition`.

**File: `assets/js/admin-api.js`**

Add the following new functions and export them on `window.adminApi`:

```javascript
// GET /api/v1/admin/attribute-definitions
function adminGetAttributeDefinitions() { ... }

// POST /api/v1/admin/attribute-definitions
function adminCreateAttributeDefinition(data) { ... }

// POST /api/v1/admin/products/{productId}/attributes
function adminAddProductAttribute(productId, data) { ... }

// DELETE /api/v1/admin/products/{productId}/attributes/{attributeDefinitionId}
function adminRemoveProductAttribute(productId, attributeDefinitionId) { ... }

// PUT /api/v1/admin/products/{productId}/variants/{variantId}/attributes
// (replaces all attribute values for the variant in one call)
function adminSetVariantAttributes(productId, variantId, attributes) { ... }
```

**File: `assets/js/admin-products.js`**

1. **Product modal — Attributes section** (new section in `_renderProductModalBody`):
   - Renders the list of `AttributeDefinition` records declared on the product as removable
     chips/pills.
   - Provides a `<select>` populated from `adminGetAttributeDefinitions()` to add an existing
     definition, plus an inline "Create new" text input that calls
     `adminCreateAttributeDefinition` then `adminAddProductAttribute`.
   - Remove button calls `adminRemoveProductAttribute`.

2. **Variant edit modal** (`openEditVariantModal` / `saveVariantModal`):
   - Remove the hardcoded `<select id="vmod-material">` from `admin.html` and from the JS that
     populates it.
   - On open: fetch the parent product to get its declared attributes; render one `<input
     type="text">` per attribute, pre-populated with the variant's current value for that
     attribute (from `v.attributes`).
   - On save: collect `{ attributeDefinitionId, value }` pairs from those inputs and pass them
     as `attributes` in the `adminUpdateVariant` payload (which now calls the updated
     `PUT .../variants/{id}` endpoint that accepts `attributes`).

3. **Add-variant inline form** (inside `_renderProductModalBody`):
   - Remove the hardcoded `<select name="material">` and its population logic.
   - Render one `<input type="text">` per attribute declared on the product, same as the edit
     modal.
   - Pass `attributes` array in the `adminCreateVariant` payload.

4. **Variant table** (`_renderProductModalBody` variant rows):
   - Replace the `<th>Material</th>` column with `<th>Atributos</th>`.
   - Render attribute values as small pills (e.g. `Size: L · Color: White`) instead of the
     single material string.

**File: `admin.html`**

1. Remove the `<div class="form-field admin-form-full">` block containing
   `<select id="vmod-material">` from the variant edit modal markup.
2. The attributes inputs are injected dynamically by `openEditVariantModal`, so no static
   markup is needed for them.

---

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that
demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing
behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm
or refute the root cause analysis.

**Test Plan**: Write integration tests that call `POST .../variants` with an `attributes` array
and assert the response contains `attributes` (not `material`). Run on unfixed code to observe
failures and confirm the root cause.

**Test Cases**:
1. **Multi-attribute create**: `POST /api/v1/admin/products/{id}/variants` with
   `attributes: [{ attributeDefinitionId: X, value: "L" }, { attributeDefinitionId: Y, value: "White" }]`
   — will fail on unfixed code (field not accepted, response has `material` instead).
2. **Single non-material attribute**: `POST .../variants` with
   `attributes: [{ attributeDefinitionId: X, value: "Matte" }]` where X is a "Finish" definition
   — will fail on unfixed code.
3. **GET response shape**: `GET /api/v1/admin/products/{id}` — assert `variants[0].attributes`
   exists and `variants[0].material` does not — will fail on unfixed code.
4. **Attribute catalog endpoint**: `GET /api/v1/admin/attribute-definitions` — will return 404
   on unfixed code.

**Expected Counterexamples**:
- Response body contains `"material": null` instead of `"attributes": []`.
- `attributes` field in request body is silently ignored.
- `GET /api/v1/admin/attribute-definitions` returns HTTP 404.

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces
the expected behavior.

**Pseudocode:**
```
FOR ALL request WHERE isBugCondition(request) DO
  response := createOrUpdateVariant_fixed(request)
  ASSERT response.attributes IS ARRAY
  AND    response.attributes contains all submitted attribute values
  AND    response does NOT contain key "material"
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function
produces the same result as the original function.

**Pseudocode:**
```
FOR ALL request WHERE NOT isBugCondition(request) DO
  // coreFields = { sku, labelEs, labelEn, price, stockQuantity, isAvailable,
  //                acceptsDesignFile, effectivePrice }
  ASSERT createOrUpdateVariant_original(request).coreFields
       = createOrUpdateVariant_fixed(request).coreFields
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain.
- It catches edge cases that manual unit tests might miss.
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs.

**Test Plan**: Observe behavior on UNFIXED code first for core-field operations, then write
property-based tests capturing that behavior.

**Test Cases**:
1. **Core fields preservation**: Create a variant with only core fields (no `material`, no
   `attributes`) — verify response core fields are identical before and after fix.
2. **Discount preservation**: Apply a discount to a variant, verify `effectivePrice` is computed
   correctly alongside the new `attributes: []` array.
3. **Delete conflict preservation**: Attempt to delete a variant referenced by an order — verify
   HTTP 409 is still returned after fix.
4. **Storefront GET preservation**: `GET /api/v1/products` — verify all product-level fields
   are unchanged; variant objects now have `attributes` instead of `material` but all other
   fields are identical.

### Unit Tests

- Test `MapVariant` helper: given a `ProductVariant` with `AttributeValues` loaded, assert the
  resulting `ProductVariantDto` has the correct `Attributes` list and no `Material` property.
- Test `CreateVariant` endpoint: verify `VariantAttributeValue` rows are inserted correctly.
- Test `UpdateVariant` endpoint: verify existing `VariantAttributeValue` rows are replaced (not
  appended) when a new `attributes` array is submitted.
- Test `AdminAttributeDefinitionsController.Create`: verify duplicate names are handled
  gracefully (case-insensitive uniqueness check recommended).
- Test `POST /api/v1/admin/products/{id}/attributes`: verify 409 is returned when the same
  `AttributeDefinitionId` is added twice to the same product.

### Property-Based Tests

- Generate random sets of `{ attributeDefinitionId, value }` pairs and verify that
  `CreateVariant` followed by `GetById` returns exactly those pairs in `attributes`.
- Generate random core-field values and verify that `UpdateVariant` with an empty `attributes`
  array does not alter any core field.
- Generate random existing variants (with no attributes) and verify that adding attributes does
  not change `effectivePrice` or `discounts`.

### Integration Tests

- Full flow: create `AttributeDefinition` → add to product → create variant with attribute
  values → `GET` product → assert variant `attributes` array is correct.
- Switching attribute set: update a product's declared attributes (remove one, add another) →
  update variant → verify old attribute value is gone, new one is present.
- Storefront flow: `GET /api/v1/products/{slug}` after fix — verify `attributes` array is
  present on variants and `material` field is absent.
- Delete cascade: delete a `ProductAttributeDefinition` → verify corresponding
  `VariantAttributeValue` rows are cascade-deleted.
