# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Variant Attributes Replace Material Field
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior — it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to the concrete failing cases below for reproducibility
  - Create a new test file `backend/Filamorfosis.Tests/VariantAttributeBugConditionTests.cs`
  - Test case 1 — GET response shape: seed a product+variant, call `GET /api/v1/admin/products/{id}`, assert `variants[0].attributes` exists (is an array) and `variants[0].material` does NOT exist
  - Test case 2 — POST with attributes array: call `POST /api/v1/admin/products/{id}/variants` with body `{ ..., attributes: [{ attributeDefinitionId, value }] }`, assert response contains `attributes` array and no `material` field
  - Test case 3 — Attribute catalog endpoint: call `GET /api/v1/admin/attribute-definitions`, assert HTTP 200 (not 404)
  - The test assertions match the Expected Behavior from design (Property 1: `response.attributes IS ARRAY` AND `response does NOT contain key "material"`)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Tests FAIL (this is correct — it proves the bug exists)
  - Document counterexamples found (e.g. `"material": null` in response instead of `"attributes": []`, `GET /attribute-definitions` returns 404)
  - Mark task complete when tests are written, run, and failures are documented
  - _Requirements: 1.1, 1.4, 1.5, 2.1, 2.5, 2.6, 2.8_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Core Variant Fields Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Create a new test file `backend/Filamorfosis.Tests/VariantAttributePreservationTests.cs`
  - Observe on UNFIXED code: `POST /api/v1/admin/products/{id}/variants` with only core fields (`labelEs`, `labelEn`, `sku`, `price`, `stockQuantity`, `isAvailable`, `acceptsDesignFile`) returns those same fields correctly
  - Observe on UNFIXED code: `DELETE /api/v1/admin/products/{id}/variants/{variantId}` on a variant referenced by an order returns HTTP 409
  - Observe on UNFIXED code: `DELETE .../variants/{variantId}` on an unreferenced variant returns HTTP 204
  - Observe on UNFIXED code: `GET /api/v1/products` returns paginated product summaries with all existing product-level fields intact
  - Write property-based test: for all randomly generated core-field values (sku, labelEs, price, stockQuantity, isAvailable, acceptsDesignFile), `CreateVariant` followed by `GetById` returns exactly those core-field values unchanged (from Preservation Requirements in design)
  - Write property-based test: for any variant referenced by an order, DELETE returns 409 (reuse pattern from `AdminProductPropertyTests.VariantDelete_ReferencedByOrderItem_Returns409`)
  - Verify all tests PASS on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3. Fix: Replace Material column with catalog-driven attribute system

  - [x] 3.1 Add new domain entities
    - Create `backend/Filamorfosis.Domain/Entities/AttributeDefinition.cs` with properties: `Id (Guid)`, `Name (string)`, `CreatedAt (DateTime)`
    - Create `backend/Filamorfosis.Domain/Entities/ProductAttributeDefinition.cs` with properties: `ProductId (Guid)`, `AttributeDefinitionId (Guid)`, nav properties `Product` and `AttributeDefinition`
    - Create `backend/Filamorfosis.Domain/Entities/VariantAttributeValue.cs` with properties: `Id (Guid)`, `VariantId (Guid)`, `AttributeDefinitionId (Guid)`, `Value (string)`, nav properties `Variant` and `AttributeDefinition`
    - Update `backend/Filamorfosis.Domain/Entities/ProductVariant.cs`: remove `public string? Material { get; set; }`, add `public ICollection<VariantAttributeValue> AttributeValues { get; set; } = new List<VariantAttributeValue>();`
    - _Bug_Condition: isBugCondition(X) — X requires attributes beyond the single Material column_
    - _Expected_Behavior: variant.AttributeValues navigation holds zero or more VariantAttributeValue rows_
    - _Preservation: ProductVariant core fields (Sku, LabelEs, LabelEn, Price, StockQuantity, IsAvailable, AcceptsDesignFile) are untouched_
    - _Requirements: 2.1, 2.2_

  - [x] 3.2 Update DbContext (DbSets, FK config, cascade deletes, unique index)
    - In `backend/Filamorfosis.Infrastructure/Data/FilamorfosisDbContext.cs`:
    - Add `DbSet<AttributeDefinition>`, `DbSet<ProductAttributeDefinition>`, `DbSet<VariantAttributeValue>`
    - Configure composite PK for `ProductAttributeDefinition`: `(ProductId, AttributeDefinitionId)`
    - Configure FK `ProductAttributeDefinition.ProductId → Products.Id` with `OnDelete(DeleteBehavior.Cascade)`
    - Configure FK `ProductAttributeDefinition.AttributeDefinitionId → AttributeDefinitions.Id` with `OnDelete(DeleteBehavior.Cascade)`
    - Configure FK `VariantAttributeValue.VariantId → ProductVariants.Id` with `OnDelete(DeleteBehavior.Cascade)`
    - Configure FK `VariantAttributeValue.AttributeDefinitionId → AttributeDefinitions.Id` with `OnDelete(DeleteBehavior.Cascade)`
    - Add unique index on `VariantAttributeValues (VariantId, AttributeDefinitionId)`
    - _Requirements: 2.1, 2.2_

  - [x] 3.3 Create EF Core migration AddAttributeSystem
    - Run `dotnet ef migrations add AddAttributeSystem` in `backend/Filamorfosis.API`
    - Verify the generated migration `Up()` method: drops `Material` column from `ProductVariants`, creates `AttributeDefinitions` table, creates `ProductAttributeDefinitions` table with composite PK, creates `VariantAttributeValues` table with unique index on `(VariantId, AttributeDefinitionId)`
    - Verify the generated migration `Down()` method reverses all changes (drops the three new tables, re-adds `Material` column)
    - Apply migration: `dotnet ef database update`
    - _Requirements: 2.1_

  - [x] 3.4 Add new DTOs in AttributeDtos.cs
    - Create `backend/Filamorfosis.Application/DTOs/AttributeDtos.cs` with the following classes:
    - `VariantAttributeValueDto` — `AttributeDefinitionId (Guid)`, `Name (string)`, `Value (string)`
    - `AttributeDefinitionDto` — `Id (Guid)`, `Name (string)`, `CreatedAt (DateTime)`
    - `VariantAttributeInput` — `AttributeDefinitionId (Guid)`, `Value (string)`
    - `SetVariantAttributesRequest` — `Attributes (List<VariantAttributeInput>)`
    - `AddProductAttributeRequest` — `AttributeDefinitionId (Guid)`
    - `CreateAttributeDefinitionRequest` — `Name (string)`
    - _Requirements: 2.5, 2.6, 2.7, 2.8_

  - [x] 3.5 Update ProductVariantDto and AdminProductDtos
    - In `backend/Filamorfosis.Application/DTOs/ProductVariantDto.cs`: remove `public string? Material { get; set; }`, add `public List<VariantAttributeValueDto> Attributes { get; set; } = new();`
    - In `backend/Filamorfosis.Application/DTOs/AdminProductDtos.cs`: remove `public string? Material { get; set; }` from `CreateVariantRequest`, remove `public string? Material { get; set; }` from `UpdateVariantRequest`, add `public List<VariantAttributeInput> Attributes { get; set; } = new();` to both
    - _Bug_Condition: isBugCondition(X) — response.material field must not exist; response.attributes must exist_
    - _Expected_Behavior: ProductVariantDto.Attributes is a List<VariantAttributeValueDto>; no Material property_
    - _Preservation: all other DTO properties (Id, Sku, LabelEs, LabelEn, Price, EffectivePrice, IsAvailable, AcceptsDesignFile, StockQuantity, Discounts) are unchanged_
    - _Requirements: 2.5, 2.6, 3.1_

  - [x] 3.6 Create AdminAttributeDefinitionsController
    - Create `backend/Filamorfosis.API/Controllers/AdminAttributeDefinitionsController.cs`
    - Route: `[Route("api/v1/admin/attribute-definitions")]`, `[Authorize(Roles = "Master,ProductManagement")]`, `[RequireMfa]`
    - `GET /` — return all `AttributeDefinition` records ordered by `Name` as `List<AttributeDefinitionDto>` (HTTP 200)
    - `POST /` — create a new `AttributeDefinition` from `CreateAttributeDefinitionRequest`; return HTTP 201 with `AttributeDefinitionDto`
    - Route: `[Route("api/v1/admin/products")]` sub-actions on the same controller (or add to `AdminProductsController`):
    - `POST /api/v1/admin/products/{id}/attributes` — add an `AttributeDefinition` to a product via `AddProductAttributeRequest`; return 201 or 409 if the `(ProductId, AttributeDefinitionId)` pair already exists
    - `DELETE /api/v1/admin/products/{id}/attributes/{attributeDefinitionId}` — remove a `ProductAttributeDefinition` row; return 204 or 404
    - _Requirements: 2.7, 2.8_

  - [x] 3.7 Update AdminProductsController (CreateVariant, UpdateVariant, MapVariant, includes)
    - In `CreateVariant`: remove `Material = req.Material`; after `db.SaveChangesAsync()`, insert `VariantAttributeValue` rows for each element in `req.Attributes` (upsert pattern: add only, since variant is new)
    - In `UpdateVariant`: remove `v.Material = req.Material`; replace all existing `VariantAttributeValue` rows for the variant with the new set from `req.Attributes` (delete-then-insert pattern)
    - In `MapVariant`: remove `Material = v.Material`; add `Attributes = v.AttributeValues.Select(a => new VariantAttributeValueDto { AttributeDefinitionId = a.AttributeDefinitionId, Name = a.AttributeDefinition.Name, Value = a.Value }).ToList()`
    - In `GetAll` and `GetById`: update `.ThenInclude(v => v.Discounts)` chain to also include `.ThenInclude(v => v.AttributeValues).ThenInclude(av => av.AttributeDefinition)`
    - _Bug_Condition: isBugCondition(X) — CreateVariant/UpdateVariant must persist attributes, not material_
    - _Expected_Behavior: expectedBehavior — response.attributes contains all submitted { attributeDefinitionId, name, value } entries; no material field_
    - _Preservation: DeleteVariant 409/204 logic, discount computation, all other variant fields unchanged_
    - _Requirements: 2.1, 2.2, 2.5, 2.6, 3.1, 3.2, 3.3, 3.5_

  - [x] 3.8 Update ProductsController storefront (MapVariant, includes)
    - In `GetAll` and `GetById` in `backend/Filamorfosis.API/Controllers/ProductsController.cs`: update `.Include(p => p.Variants)` to also include `.ThenInclude(v => v.AttributeValues).ThenInclude(av => av.AttributeDefinition)`
    - Update the inline `ProductVariantDto` projections in both actions: remove `Material` assignment (already gone from DTO), add `Attributes = v.AttributeValues.Select(a => new VariantAttributeValueDto { AttributeDefinitionId = a.AttributeDefinitionId, Name = a.AttributeDefinition.Name, Value = a.Value }).ToList()`
    - _Preservation: all product-level fields (id, slug, titles, descriptions, tags, imageUrls, badge, basePrice, isActive, categoryId) unchanged; effectivePrice unchanged_
    - _Requirements: 2.5, 3.4, 3.5_

  - [x] 3.9 Add new adminApi.js functions
    - In `assets/js/admin-api.js`, add the following functions and export them on `window.adminApi` (and `window` directly):
    - `adminGetAttributeDefinitions()` — `GET /api/v1/admin/attribute-definitions`
    - `adminCreateAttributeDefinition(data)` — `POST /api/v1/admin/attribute-definitions`
    - `adminAddProductAttribute(productId, data)` — `POST /api/v1/admin/products/{productId}/attributes`
    - `adminRemoveProductAttribute(productId, attributeDefinitionId)` — `DELETE /api/v1/admin/products/{productId}/attributes/{attributeDefinitionId}`
    - `adminSetVariantAttributes(productId, variantId, attributes)` — `PUT /api/v1/admin/products/{productId}/variants/{variantId}` (reuses `adminUpdateVariant` with `{ attributes }` payload, or a dedicated call)
    - _Requirements: 2.7, 2.8_

  - [x] 3.10 Update admin-products.js (product modal attributes section, variant modal dynamic inputs, add-variant form, variant table column)
    - **Product modal — Attributes section** (`_renderProductModalBody`):
      - Add a new `<div class="prod-modal-section">` for "Atributos del producto" after the edit form
      - Render declared `AttributeDefinition` records as removable chips (call `adminRemoveProductAttribute` on remove)
      - Render a `<select>` populated from `adminGetAttributeDefinitions()` to add an existing definition (call `adminAddProductAttribute` on confirm)
      - Render an inline text input + button to create a new definition (call `adminCreateAttributeDefinition` then `adminAddProductAttribute`)
      - After any add/remove, call `_refreshModalDetail()` to re-render
    - **Variant edit modal** (`openEditVariantModal` / `saveVariantModal`):
      - Remove all code that reads/writes `vmod-material` (the `<select id="vmod-material">` is removed from HTML in task 3.11)
      - On open: fetch the parent product to get its declared attributes (`product.attributes` or re-fetch); render one `<input type="text" data-attr-id="...">` per declared attribute, pre-populated with the variant's current value from `v.attributes`; inject these inputs into a new `<div id="vmod-attributes-wrap">` inside the variant modal form
      - On save (`saveVariantModal`): collect `{ attributeDefinitionId, value }` pairs from `[data-attr-id]` inputs; include as `attributes` array in the `adminUpdateVariant` payload (replacing `material`)
    - **Add-variant inline form** (`_renderProductModalBody` add-variant section):
      - Remove the hardcoded `<select name="material">` and its population logic from the rendered HTML string
      - Render one `<input type="text" name="attr-{attributeDefinitionId}">` per attribute declared on the product (from `product.attributes`)
      - In `submitAddVariant`: collect those inputs into an `attributes` array; replace `material: fd.get('material')` with `attributes: [...]` in the payload
    - **Variant table** (`_renderProductModalBody` variant rows):
      - Replace `<th>Material</th>` with `<th>Atributos</th>` in the table header
      - Replace `v.material` cell with attribute pills: `(v.attributes || []).map(a => \`<span ...>${esc(a.name)}: ${esc(a.value)}</span>\`).join(' · ')` or `'—'` if empty
      - Update the `data-search` attribute on each row to include attribute values instead of `v.material`
    - _Bug_Condition: isBugCondition(X) — admin UI must not show hardcoded Material field; must show dynamic attribute inputs_
    - _Expected_Behavior: variant modal shows one input per declared product attribute; add-variant form sends attributes array_
    - _Requirements: 2.3, 2.4, 2.6_

  - [x] 3.11 Update admin.html (remove hardcoded vmod-material select)
    - In `admin.html`, remove the entire `<div class="form-field admin-form-full">` block containing `<label>Material</label>` and `<select id="vmod-material">` from the variant edit modal (`#var-edit-modal`)
    - Add an empty `<div id="vmod-attributes-wrap"></div>` in its place so `openEditVariantModal` has a container to inject dynamic attribute inputs into
    - _Bug_Condition: isBugCondition(X) — hardcoded Material select cannot represent other attribute types_
    - _Requirements: 2.4_

  - [x] 3.12 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Variant Attributes Replace Material Field
    - **IMPORTANT**: Re-run the SAME tests from task 1 — do NOT write new tests
    - The tests from task 1 encode the expected behavior (response has `attributes` array, no `material` field, `GET /attribute-definitions` returns 200)
    - When these tests pass, it confirms the expected behavior is satisfied
    - Run `VariantAttributeBugConditionTests` from step 1
    - **EXPECTED OUTCOME**: Tests PASS (confirms bug is fixed)
    - _Requirements: 2.1, 2.5, 2.6, 2.8_

  - [x] 3.13 Verify preservation tests still pass
    - **Property 2: Preservation** - Core Variant Fields Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run `VariantAttributePreservationTests` from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions in core variant fields, delete conflict behavior, and storefront product listing)
    - Confirm all tests still pass after fix (no regressions)

- [x] 4. Checkpoint — Ensure all tests pass
  - Run the full test suite: `dotnet test backend/Filamorfosis.Tests/Filamorfosis.Tests.csproj`
  - Ensure all pre-existing tests still pass (AdminProductPropertyTests, DiscountEffectivePricePropertyTests, OrderPropertyTests, etc.)
  - Ensure `VariantAttributeBugConditionTests` passes (bug is fixed)
  - Ensure `VariantAttributePreservationTests` passes (no regressions)
  - Ask the user if any questions arise
