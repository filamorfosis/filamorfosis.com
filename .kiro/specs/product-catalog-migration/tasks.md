# Implementation Plan: Product Catalog Migration

## Overview

Migrate the Filamorfosis product catalog from hardcoded JS data files to the live database-backed REST API. Work is ordered so each step builds on the previous: backend entity/DTO/validation changes first, then seeding, then frontend rewrite, then cleanup, then property-based tests.

## Tasks

- [x] 1. API base URL localhost override in all HTML pages
  - Add the conditional `window.FILAMORFOSIS_API_BASE` inline script block immediately before the `api.js` `<script>` tag in each of the five pages: `products.html`, `index.html`, `checkout.html`, `account.html`, `order-confirmation.html`
  - Script must only set the variable when `location.hostname === 'localhost' || location.hostname === '127.0.0.1'`
  - Target URL: `http://localhost:5205/api/v1`
  - Skip `admin.html` — it already has this pattern
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Badge field on Product entity and EF Core migration
  - [x] 2.1 Add `public string? Badge { get; set; }` to `Filamorfosis.Domain/Entities/Product.cs`
    - _Requirements: 2.1_
  - [x] 2.2 Create EF Core migration `AddProductBadge` that adds a nullable `TEXT` column `Badge` to the `Products` table with default `null`
    - Run `dotnet ef migrations add AddProductBadge` in the API project, then review the generated migration file
    - _Requirements: 2.2_

- [x] 3. Badge field in DTOs and request models
  - [x] 3.1 Add `public string? Badge { get; set; }` to `ProductSummaryDto`
    - _Requirements: 2.3_
  - [x] 3.2 Add `public string? Badge { get; set; }` to `ProductDetailDto`
    - _Requirements: 2.4_
  - [x] 3.3 Add `public string? Badge { get; set; }` to `CreateProductRequest`
    - _Requirements: 2.5_
  - [x] 3.4 Add `public string? Badge { get; set; }` to `UpdateProductRequest`
    - _Requirements: 2.6_
  - [x] 3.5 Update `AdminProductsController` and `ProductsController` projection/mapping to include `Badge = p.Badge` in all `ProductSummaryDto` and `ProductDetailDto` constructions
    - _Requirements: 2.3, 2.4_

- [x] 4. BadgeValues validator, AdminProductsController validation, and ProductsController badge query param
  - [x] 4.1 Create `Filamorfosis.Application/Validation/BadgeValues.cs` with a static `BadgeValues` class containing `Allowed` (`HashSet<string>` with `"hot"`, `"new"`, `"promo"`, `"popular"`) and `IsValid(string? badge)` method
    - _Requirements: 2.1, 2.5, 2.6_
  - [x] 4.2 Add `BadgeValues.IsValid` guard in `AdminProductsController.Create` and `AdminProductsController.Update`; return HTTP 422 Problem Details with message `"Badge must be one of: hot, new, promo, popular, or null."` on failure
    - _Requirements: 2.7_
  - [x] 4.3 Write unit tests for `BadgeValues.IsValid` — cover each allowed value, `null`, empty string, and several invalid strings
    - _Requirements: 2.1_
  - [x] 4.4 Write unit tests for `AdminProductsController.Update` — verify 422 for invalid badge, 200 for valid badge
    - _Requirements: 2.7_
  - [x] 4.5 Add `[FromQuery] string? badge = null` parameter to `ProductsController.GetAll` and apply `query = query.Where(p => p.Badge == badge)` after existing filters when the param is non-null/non-whitespace
    - _Requirements: 6.2_
  - [x] 4.6 Write unit test for `ProductsController.GetAll` — verify `badge` query param filters results correctly using in-memory EF Core
    - _Requirements: 6.2_

- [x] 5. Checkpoint — ensure backend builds and unit tests pass
  - Run `dotnet build` and `dotnet test` in the backend solution; fix any compilation or test failures before proceeding.

- [x] 6. Admin panel badge dropdown in admin-products.js and admin.html
  - [x] 6.1 In `assets/js/admin-products.js`, add the badge `<select>` field (with options: `(ninguno)`, `hot`, `new`, `promo`, `popular`) and a `<span id="pedit-badge-preview-…">` inside the inline edit row template rendered by `renderProductsTable()`; pre-select the current `p.badge` value; attach a `change` listener that updates the preview span
    - _Requirements: 3.1, 3.4, 3.5_
  - [x] 6.2 In `assets/js/admin-products.js`, include `badge: document.getElementById('pedit-badge-' + id).value || null` in the `saveProductEdit` payload sent to `PUT /api/v1/admin/products/{id}`
    - _Requirements: 3.2, 3.3_
  - [x] 6.3 In `admin.html`, add the same badge dropdown (with the same five options) to the "Agregar Producto" form before the submit button
    - _Requirements: 3.1_

- [x] 7. DbSeeder product seed — UV and engraving products as C# inline data
  - [x] 7.1 In `DbSeeder` (or equivalent seeder class), add a `SeedProductsAsync` method that looks up category IDs by slug (`uv-printing` for UV products, `laser-cutting` for engraving products)
    - _Requirements: 4.1_
  - [x] 7.2 Implement the UV product definitions as C# inline data inside `SeedProductsAsync` — one entry per product from `Products_UV.js`, mapping `id→Slug`, `title→TitleEs/TitleEn`, `desc→DescriptionEs/DescriptionEn`, `tags→Tags`, `images→ImageUrls`, `badge→Badge`, `category→CategoryId`
    - _Requirements: 4.1_
  - [x] 7.3 Implement the laser-engraving product definitions as C# inline data inside `SeedProductsAsync` — one entry per product from `Products_Engrave.js` using the same field mapping
    - _Requirements: 4.1_
  - [x] 7.4 For each product definition, generate two `ProductVariant` rows per pricing row: `"{row.variant} — Flat"` (SKU `{slug}-{i}-F`) and `"{row.variant} — Relieve"` (SKU `{slug}-{i}-R`); set `AcceptsDesignFile = true` on all variants; parse price strings (strip `$`/`,`); set `Price = 0` and `IsAvailable = false` when value is `"Cotizar"` or `"N/A"`
    - _Requirements: 4.2, 4.3, 4.4_
  - [x] 7.5 Make the seeder idempotent: before inserting a product, check whether a `Product` with that `Slug` already exists; skip insertion if it does
    - _Requirements: 4.5_
  - [x] 7.6 Call `SeedProductsAsync` from the main `SeedAsync` method after categories are seeded
    - _Requirements: 4.1_
  - [x] 7.7 Write unit tests for `DbSeeder.SeedProductsAsync` against in-memory EF Core — verify total product count, variant count per product (2 × pricing rows), and `IsAvailable = false` / `Price = 0` for Cotizar rows
    - _Requirements: 4.2, 4.3, 4.4_
  - [x] 7.8 Write idempotence unit test — call `SeedAsync` twice against the same in-memory database; assert product count equals source product count (no duplicates)
    - _Requirements: 4.5_

- [x] 8. Checkpoint — ensure seed runs cleanly
  - Run `dotnet build` and `dotnet test`; apply the EF Core migration (`dotnet ef database update`); run the application once to trigger the seeder and verify products appear in `GET /api/v1/products`.

- [x] 9. Rewrite products.js to fetch from API
  - [x] 9.1 Add state variables at the top of `assets/js/products.js`: `activeCategory`, `activeFilter`, `searchQuery`, `currentPage`, `totalCount`, `pageSize`, `_searchDebounce`, `_loadedProducts`, and a `categorySlugToId` map
    - _Requirements: 5.1_
  - [x] 9.2 On init, call `GET /api/v1/categories` once and populate `categorySlugToId` (mapping short slug keys from `CATEGORIES` to API GUIDs); then trigger the initial product fetch
    - _Requirements: 5.1, 5.2_
  - [x] 9.3 Implement `fetchProducts(opts)` wrapper that builds query params (`categoryId`, `search`, `badge`, `page`, `pageSize`) and delegates to `window.getProducts(params)`
    - _Requirements: 5.1, 5.2, 5.3, 6.1_
  - [x] 9.4 Implement `loadProducts(reset)` — calls `renderSkeletons(8)` before the fetch; on success replaces or appends to `_loadedProducts`; updates `totalCount`; calls `renderGrid()`; shows/hides the "Cargar más" button based on `currentPage * pageSize < totalCount`; on error calls `renderError(retryFn)`; on empty shows `#catEmpty`
    - _Requirements: 5.4, 5.5, 5.6, 5.12_
  - [x] 9.5 Update category tab click handler to set `activeCategory` from `categorySlugToId`, reset `currentPage = 1` and `_loadedProducts = []`, then call `loadProducts(true)`
    - _Requirements: 5.2_
  - [x] 9.6 Update search input handler with 300 ms debounce: set `searchQuery`, reset pagination, call `loadProducts(true)`
    - _Requirements: 5.3_
  - [x] 9.7 Update curated filter chip click handler: for `popular` pass `badge: 'hot'` and for `new` pass `badge: 'new'` as API params; for all other filters (`gift`, `business`, `decor`, `drinkware`, `budget`, `premium`) apply client-side matching against `_loadedProducts` using existing `CURATED_FILTERS[].match` functions
    - _Requirements: 6.1, 6.3, 6.4_
  - [x] 9.8 Update `renderCard(product)` to map API fields: `imageUrls` → carousel slides, `badge` → badge chip, `tags` → tag chips, `basePrice` → "Desde $X" display, `id` (GUID) → `data-id`; update `pT()` to read `titleEs`/`titleEn` and `descriptionEs`/`descriptionEn` directly from the product object
    - _Requirements: 5.7, 5.8, 5.9, 5.13_
  - [x] 9.9 Update "Ver detalles" click handler to call `window.getProduct(id)` and render the detail modal using `ProductDetailDto`; replace the hardcoded pricing table with a variant list of `.modal-variant-item` elements showing `labelEs`, `price`, and availability; enable "Agregar al carrito" only when a variant radio is selected
    - _Requirements: 5.10, 5.11_
  - [x] 9.10 Implement `renderError(retryFn)` helper that injects an error card with a retry button into `#catGrid`
    - _Requirements: 5.6_
  - [x] 9.11 Add "Cargar más" button below `#catGrid`; on click increment `currentPage` and call `loadProducts(false)` to append next page without clearing the grid
    - _Requirements: 5.12_

- [x] 10. Script tag cleanup in products.html and delete static data files
  - [x] 10.1 Remove the `<script>` tags for `Products_UV.js` and `Products_Engrave.js` from `products.html`
    - _Requirements: 7.1, 4.7_
  - [x] 10.2 Delete `products/data/Products_UV.js` and `products/data/Products_Engrave.js` from the repository
    - _Requirements: 4.6_
  - [x] 10.3 Verify `products.html` retains the `<script>` tag for `products/data/catalog.js` and that `api.js` loads before `products.js`
    - _Requirements: 7.2, 7.3_

- [x] 11. Property-based tests — C# (FsCheck)
  - [x] 11.1 Write FsCheck property test for Property 1: generate arbitrary strings; assert `BadgeValues.IsValid` returns `true` iff value is in `{"hot","new","promo","popular"}` or is `null`
    - **Property 1: Badge validation rejects invalid values**
    - **Validates: Requirements 2.1, 2.5, 2.6, 2.7**
  - [x] 11.2 Write FsCheck property test for Property 2: generate `Product` with random `Badge` from allowed set (including `null`); map to `ProductSummaryDto` and `ProductDetailDto`; assert `dto.Badge == product.Badge`
    - **Property 2: Badge round-trip through DTOs**
    - **Validates: Requirements 2.3, 2.4**
  - [x] 11.3 Write FsCheck property test for Property 3: generate N in 1–5; call `SeedAsync` N times against the same in-memory database; assert product count equals source product count
    - **Property 3: Seed idempotence**
    - **Validates: Requirements 4.5**
  - [x] 11.4 Write FsCheck property test for Property 4: for each seeded product with N pricing rows, assert `variants.Count == 2 * N`
    - **Property 4: Seed variant count invariant**
    - **Validates: Requirements 4.2**
  - [x] 11.5 Write FsCheck property test for Property 5: for each seeded variant whose source row had `"Cotizar"` or `"N/A"`, assert `IsAvailable == false && Price == 0`
    - **Property 5: Unavailable variant pricing**
    - **Validates: Requirements 4.3, 4.4**
  - [x] 11.6 Write FsCheck property test for Property 6: generate badge value B from allowed set; seed products with mixed badges; call `GetAll(badge: B)` via in-memory EF Core; assert all returned products have `Badge == B`
    - **Property 6: Badge API filter**
    - **Validates: Requirements 6.2**

- [x] 12. Property-based tests — JavaScript (fast-check)
  - [x] 12.1 Write fast-check property test for Property 7: generate random category GUIDs; simulate tab click in the Catalog_Engine; assert `getProducts` was called with matching `categoryId`
    - **Property 7: Catalog engine API call includes active category**
    - **Validates: Requirements 5.1, 5.2**
  - [x] 12.2 Write fast-check property test for Property 8: for each badge-based filter id (`popular`, `new`); assert `getProducts` is called with the correct `badge` param and no client-side badge filtering is applied
    - **Property 8: Badge-based filter maps to API badge param**
    - **Validates: Requirements 6.1**
  - [x] 12.3 Write fast-check property test for Property 9: generate `ProductSummaryDto` with random `imageUrls` array (length 0–10); render card; assert `.cc-slide` count equals `imageUrls.length`
    - **Property 9: Card image carousel count matches imageUrls**
    - **Validates: Requirements 5.8**
  - [x] 12.4 Write fast-check property test for Property 10: generate `ProductDetailDto` with random `variants` array (length 0–20); render modal; assert `.modal-variant-item` count equals `variants.length`
    - **Property 10: Modal variant list count matches variants array**
    - **Validates: Requirements 5.11**
  - [x] 12.5 Write fast-check property test for Property 11: generate product with random `titleEs`/`titleEn`; for each lang in `{es, en}`; render card; assert displayed title matches the correct field
    - **Property 11: i18n title selection**
    - **Validates: Requirements 5.13**
  - [x] 12.6 Write fast-check property test for Property 12: generate product with random badge from allowed set (including `null`); render inline edit form; assert badge `<select>` value equals badge (or `""` when `null`)
    - **Property 12: Admin badge form pre-selection round-trip**
    - **Validates: Requirements 3.4**

- [x] 13. Final checkpoint — build passes and dotnet test passes
  - Run `dotnet build` in the backend solution; fix any compilation errors.
  - Run `dotnet test`; all unit tests and property-based tests must pass.
  - Verify `products.html` no longer references `Products_UV.js` or `Products_Engrave.js`.
  - Ensure all tasks pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints (tasks 5, 8, 13) ensure incremental validation at natural boundaries
- C# property tests use FsCheck; JS property tests use fast-check
- The seeder is the source of truth for product data — do not read the JS files at runtime
