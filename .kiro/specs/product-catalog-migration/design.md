# Design Document — Product Catalog Migration

## Overview

This migration moves the Filamorfosis product catalog from hardcoded JavaScript data files to the live database-backed REST API. The work spans six areas:

1. **API base URL** — inline `window.FILAMORFOSIS_API_BASE` override in HTML pages so local dev points to `http://localhost:5205/api/v1` without touching `api.js`.
2. **Badge field** — add `string? Badge` to the `Product` entity, EF Core migration, DTO updates, validation, and `?badge=` query param on the public endpoint.
3. **Admin badge management** — badge dropdown in the existing inline-edit form in `admin-products.js` / `admin.html`.
4. **Product seed** — idempotent C# seeder that converts all `Products_UV.js` and `Products_Engrave.js` entries into `Product` + `ProductVariant` rows; each pricing row becomes two variants (Flat + Relieve).
5. **Frontend catalog rewrite** — `products.js` fetches from the API instead of reading in-memory arrays, preserving the existing card/modal HTML structure.
6. **Script tag cleanup** — remove the static data file `<script>` tags and delete the files.

The backend is .NET 10 / ASP.NET Core / EF Core / SQLite (dev) / PostgreSQL (prod). The frontend is vanilla JS with no framework.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser                                                        │
│                                                                 │
│  products.html                                                  │
│  ├── <script> window.FILAMORFOSIS_API_BASE = 'http://…'        │
│  ├── products/data/catalog.js  (CATEGORIES, CURATED_FILTERS)   │
│  ├── assets/js/api.js          (window.getProducts, etc.)      │
│  └── assets/js/products.js     (Catalog_Engine — rewritten)    │
│                                                                 │
│  admin.html                                                     │
│  ├── <script> window.FILAMORFOSIS_API_BASE (already present)   │
│  └── assets/js/admin-products.js  (badge dropdown added)       │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP / fetch
┌──────────────────────────▼──────────────────────────────────────┐
│  ASP.NET Core API  (port 5205 local)                            │
│                                                                 │
│  GET  /api/v1/products?categoryId=&search=&badge=&page=        │
│  GET  /api/v1/products/{id}                                     │
│  PUT  /api/v1/admin/products/{id}   (badge in body)            │
│  POST /api/v1/admin/products        (badge in body)            │
└──────────────────────────┬──────────────────────────────────────┘
                           │ EF Core
┌──────────────────────────▼──────────────────────────────────────┐
│  SQLite (dev) / PostgreSQL (prod)                               │
│  Products table  — Badge column (TEXT, nullable)               │
│  ProductVariants table                                          │
└─────────────────────────────────────────────────────────────────┘
```

The `api.js` module already reads `window.FILAMORFOSIS_API_BASE` before falling back to the production URL. No changes to `api.js` are needed for the URL override — only the HTML pages need the inline script.

---

## Components and Interfaces

### 1. API Base URL Override (HTML pages)

Each HTML page that loads `api.js` needs the override script **before** the `api.js` `<script>` tag:

```html
<script>
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    window.FILAMORFOSIS_API_BASE = 'http://localhost:5205/api/v1';
  }
</script>
<script src="assets/js/api.js"></script>
```

Pages that need this: `products.html`, `index.html`, `checkout.html`, `account.html`, `order-confirmation.html`.

`admin.html` already has this pattern — no change needed there.

### 2. Badge Field — Backend

#### 2a. Domain Entity

```csharp
// Filamorfosis.Domain/Entities/Product.cs  — add one property
public string? Badge { get; set; }
```

#### 2b. EF Core Migration

A new migration `AddProductBadge` adds the column:

```csharp
migrationBuilder.AddColumn<string>(
    name: "Badge",
    table: "Products",
    type: "TEXT",
    nullable: true,
    defaultValue: null);
```

#### 2c. DTOs

`ProductSummaryDto` and `ProductDetailDto` both gain:

```csharp
public string? Badge { get; set; }
```

`CreateProductRequest` and `UpdateProductRequest` both gain:

```csharp
public string? Badge { get; set; }
```

#### 2d. Validation

A shared constant and validator:

```csharp
// Filamorfosis.Application/Validation/BadgeValidator.cs
public static class BadgeValues
{
    public static readonly HashSet<string> Allowed =
        new(StringComparer.OrdinalIgnoreCase) { "hot", "new", "promo", "popular" };

    public static bool IsValid(string? badge) =>
        badge is null || Allowed.Contains(badge);
}
```

`AdminProductsController.Create` and `Update` call `BadgeValues.IsValid(req.Badge)` and return HTTP 422 on failure.

#### 2e. ProductsController — badge query param

```csharp
[HttpGet]
public async Task<IActionResult> GetAll(
    [FromQuery] int page = 1,
    [FromQuery] int pageSize = 20,
    [FromQuery] Guid? categoryId = null,
    [FromQuery] string? search = null,
    [FromQuery] string? badge = null)   // ← new
```

Filter applied after existing filters:

```csharp
if (!string.IsNullOrWhiteSpace(badge))
    query = query.Where(p => p.Badge == badge);
```

#### 2f. Mapping in controllers

`AdminProductsController.MapDetail` and `ProductsController` projection both include `Badge = p.Badge`.

### 3. Admin Badge Management

#### 3a. admin-products.js — inline edit form

In `renderProductsTable()`, the inline edit row template gains a badge field after the Tags field:

```html
<div class="form-field">
  <label>Badge</label>
  <div style="display:flex;align-items:center;gap:10px">
    <select id="pedit-badge-${esc(p.id)}">
      <option value="">(ninguno)</option>
      <option value="hot"   ${p.badge==='hot'    ? 'selected':''}>🔥 hot — Más vendido</option>
      <option value="new"   ${p.badge==='new'    ? 'selected':''}>✨ new — Nuevo</option>
      <option value="promo" ${p.badge==='promo'  ? 'selected':''}>🏷️ promo — Promo</option>
      <option value="popular" ${p.badge==='popular'? 'selected':''}>⭐ popular — Popular</option>
    </select>
    <span id="pedit-badge-preview-${esc(p.id)}" class="badge-preview"></span>
  </div>
</div>
```

A small `change` listener on the select updates the preview span with the badge label.

#### 3b. saveProductEdit — include badge

```js
badge: document.getElementById('pedit-badge-' + id).value || null,
```

#### 3c. admin.html — add-product form

The "Agregar Producto" form in `admin.html` gains the same badge dropdown before the submit button.

### 4. Product Seed

`DbSeeder.SeedAsync` is extended with a new method `SeedProductsAsync` called after categories are seeded. The seeder:

1. Looks up the four category IDs by slug (`uv-printing`, `laser-cutting`, etc.).
2. For each product definition (hardcoded C# data, not reading JS files), checks if a `Product` with that `Slug` already exists.
3. If not, inserts the `Product` and its `ProductVariant` rows.

Category slug → `CategoryId` mapping:

| JS `category` | DB `Slug` |
|---|---|
| `uv` | `uv-printing` |
| `engrave` | `laser-cutting` |

Variant naming convention:

- Flat variant: `LabelEs = "{row.variant} — Flat"`, `LabelEn = "{row.variant} — Flat"`
- Relief variant: `LabelEs = "{row.variant} — Relieve"`, `LabelEn = "{row.variant} — Relief"`

Price parsing: strip `$` and `,`, parse as `decimal`. If value is `"Cotizar"` or `"N/A"`, set `Price = 0m`, `IsAvailable = false`.

SKU convention: `{SLUG}-{ROW_INDEX}-F` / `{SLUG}-{ROW_INDEX}-R` (e.g., `uv-coaster-0-F`).

`AcceptsDesignFile = true` for all variants (customers upload their artwork).

### 5. Frontend Catalog Engine Rewrite (products.js)

The rewrite replaces all `PRODUCTS` array reads with API calls while keeping the existing DOM structure, CSS classes, and i18n bridge intact.

#### 5a. State

```js
let activeCategory  = null;   // Guid from CATEGORIES map
let activeFilter    = 'all';
let searchQuery     = '';
let currentPage     = 1;
let totalCount      = 0;
let pageSize        = 20;
let _searchDebounce = null;
let _loadedProducts = [];     // accumulated across "load more" pages
```

`CATEGORIES` in `catalog.js` uses short ids (`uv`, `3d`, etc.). The engine maps these to API `categoryId` GUIDs by calling `GET /api/v1/categories` once on init and building a `slug → id` map.

#### 5b. API call wrapper

```js
async function fetchProducts(opts = {}) {
  const params = {};
  if (opts.categoryId) params.categoryId = opts.categoryId;
  if (opts.search)     params.search     = opts.search;
  if (opts.badge)      params.badge      = opts.badge;
  if (opts.page)       params.page       = opts.page;
  params.pageSize = pageSize;
  return window.getProducts(params);
}
```

#### 5c. Filter resolution

Badge-based curated filters (`popular` → `badge=hot`, `new` → `badge=new`) are sent as API params. All other filters (`gift`, `business`, `decor`, `drinkware`, `budget`, `premium`) are applied client-side against `_loadedProducts` using the existing `CURATED_FILTERS[].match` functions.

#### 5d. Field mapping

| API field | Card/modal usage |
|---|---|
| `titleEs` / `titleEn` | title (via `pT()`) |
| `descriptionEs` / `descriptionEn` | description (via `pT()`) |
| `imageUrls` | carousel slides |
| `badge` | badge chip |
| `tags` | tag chips |
| `basePrice` | "Desde $X" price display |
| `variants[].labelEs` | modal variant list label |
| `variants[].price` | modal variant list price |
| `variants[].isAvailable` | variant availability state |
| `id` (Guid) | `data-id` on card, passed to `getProduct()` |

The `pT()` function is updated to read `titleEs`/`titleEn` and `descriptionEs`/`descriptionEn` directly from the API response object (no more `PRODUCT_I18N` lookup).

#### 5e. Modal variant selector

The flat/relief pricing table is replaced with a simple variant list:

```html
<div class="modal-variants-section">
  <div class="modal-variants-title">Opciones disponibles</div>
  <div class="modal-variants-list" id="modalVariantsList">
    <!-- one item per variant -->
    <label class="modal-variant-item ${!v.isAvailable ? 'unavailable' : ''}">
      <input type="radio" name="variant" value="${v.id}" ${!v.isAvailable ? 'disabled' : ''}>
      <span class="modal-variant-label">${v.labelEs}</span>
      <span class="modal-variant-price">$${v.price} MXN</span>
      ${!v.isAvailable ? '<span class="badge badge-red">No disponible</span>' : ''}
    </label>
  </div>
</div>
```

The "Agregar al carrito" button is enabled when a variant radio is selected.

#### 5f. Pagination

A "Cargar más" button is appended below the grid when `currentPage * pageSize < totalCount`. Clicking it increments `currentPage`, fetches the next page, and appends the new cards without clearing the grid.

#### 5g. Loading / error states

- **Loading**: `renderSkeletons(8)` is called immediately before the fetch.
- **Empty**: `#catEmpty` shown when `items.length === 0`.
- **Error**: A new `renderError(retryFn)` helper injects an error card with a retry button into `#catGrid`.

### 6. Script Tag Cleanup

After the seed is verified:

- Delete `products/data/Products_UV.js` and `products/data/Products_Engrave.js`.
- Remove their `<script>` tags from `products.html`.
- Keep `products/data/catalog.js` (provides `CATEGORIES`, `CURATED_FILTERS`, `CAT_TRANSLATIONS`).
- Ensure `api.js` loads before `products.js` in `products.html`.

---

## Data Models

### Product entity (updated)

```csharp
public class Product
{
    public Guid Id { get; set; }
    public Guid CategoryId { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string TitleEs { get; set; } = string.Empty;
    public string TitleEn { get; set; } = string.Empty;
    public string DescriptionEs { get; set; } = string.Empty;
    public string DescriptionEn { get; set; } = string.Empty;
    public string[] Tags { get; set; } = [];
    public string[] ImageUrls { get; set; } = [];
    public string? Badge { get; set; }          // ← new
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public Category Category { get; set; } = null!;
    public ICollection<ProductVariant> Variants { get; set; } = new List<ProductVariant>();
}
```

### ProductSummaryDto (updated)

```csharp
public class ProductSummaryDto
{
    public Guid Id { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string TitleEs { get; set; } = string.Empty;
    public string TitleEn { get; set; } = string.Empty;
    public string DescriptionEs { get; set; } = string.Empty;
    public string DescriptionEn { get; set; } = string.Empty;
    public string[] Tags { get; set; } = [];
    public string[] ImageUrls { get; set; } = [];
    public string? Badge { get; set; }          // ← new
    public bool IsActive { get; set; }
    public Guid CategoryId { get; set; }
    public decimal BasePrice { get; set; }
    public List<ProductVariantDto> Variants { get; set; } = new();
}
```

### ProductDetailDto (updated)

```csharp
public class ProductDetailDto
{
    public Guid Id { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string TitleEs { get; set; } = string.Empty;
    public string TitleEn { get; set; } = string.Empty;
    public string DescriptionEs { get; set; } = string.Empty;
    public string DescriptionEn { get; set; } = string.Empty;
    public string[] Tags { get; set; } = [];
    public string[] ImageUrls { get; set; } = [];
    public string? Badge { get; set; }          // ← new
    public bool IsActive { get; set; }
    public Guid CategoryId { get; set; }
    public List<ProductVariantDto> Variants { get; set; } = new();
}
```

### CreateProductRequest / UpdateProductRequest (updated)

Both gain `public string? Badge { get; set; }` with the allowed-values constraint enforced in the controller.

### Seeded product shape (C# inline data)

Each source JS product maps to:

```
Product {
  Slug        = js.id                          // e.g. "uv-coaster"
  TitleEs     = js.title
  TitleEn     = js.title                       // same until translations are added
  DescriptionEs = js.desc
  DescriptionEn = js.desc
  Tags        = js.tags
  ImageUrls   = js.images
  Badge       = js.badge                       // "hot" | "new" | "promo" | null
  CategoryId  = lookup(js.category)
  IsActive    = true
  CreatedAt   = DateTime.UtcNow
}

// Per pricing row r at index i:
ProductVariant {
  Sku         = $"{slug}-{i}-F"
  LabelEs     = $"{r.variant} — Flat"
  LabelEn     = $"{r.variant} — Flat"
  Price       = parse(r.flat)   // 0 if "Cotizar"/"N/A"
  IsAvailable = r.flat != "Cotizar" && r.flat != "N/A"
  AcceptsDesignFile = true
}
ProductVariant {
  Sku         = $"{slug}-{i}-R"
  LabelEs     = $"{r.variant} — Relieve"
  LabelEn     = $"{r.variant} — Relief"
  Price       = parse(r.relief) // 0 if "Cotizar"/"N/A"
  IsAvailable = r.relief != "Cotizar" && r.relief != "N/A"
  AcceptsDesignFile = true
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Badge validation rejects invalid values

*For any* string value that is not in `{"hot", "new", "promo", "popular"}` and is not `null`, submitting it as the `badge` field in a `CreateProductRequest` or `UpdateProductRequest` SHALL result in an HTTP 422 response, and submitting any value in the allowed set (or `null`) SHALL result in a 2xx response.

**Validates: Requirements 2.1, 2.5, 2.6, 2.7**

---

### Property 2: Badge round-trip through DTOs

*For any* `Product` entity with a `Badge` value in the allowed set (including `null`), mapping it to `ProductSummaryDto` and `ProductDetailDto` SHALL produce a `badge` field equal to `Product.Badge`.

**Validates: Requirements 2.3, 2.4**

---

### Property 3: Seed idempotence

*For any* number of times `DbSeeder.SeedAsync` is called against the same database, the count of `Product` rows whose `Slug` matches a source product slug SHALL equal exactly the number of distinct source product slugs (no duplicates created on repeated runs).

**Validates: Requirements 4.5**

---

### Property 4: Seed variant count invariant

*For any* seeded product with N pricing rows in its source definition, the number of `ProductVariant` rows associated with that product in the database SHALL equal `2 * N`.

**Validates: Requirements 4.2**

---

### Property 5: Unavailable variant pricing

*For any* pricing row where the `flat` or `relief` value is `"Cotizar"` or `"N/A"`, the corresponding seeded `ProductVariant` SHALL have `IsAvailable = false` and `Price = 0`.

**Validates: Requirements 4.3, 4.4**

---

### Property 6: Badge API filter

*For any* badge value `B` in the allowed set, `GET /api/v1/products?badge=B` SHALL return only products where `Product.Badge == B`. No product with a different badge value SHALL appear in the response.

**Validates: Requirements 6.2**

---

### Property 7: Catalog engine API call includes active category

*For any* category tab selection (mapped to a `categoryId` GUID), the `getProducts` call issued by the Catalog_Engine SHALL include `categoryId` equal to that GUID as a query parameter.

**Validates: Requirements 5.1, 5.2**

---

### Property 8: Badge-based filter maps to API badge param

*For any* badge-based curated filter (`popular` → `"hot"`, `new` → `"new"`), activating that filter SHALL result in a `getProducts` call that includes `badge` equal to the mapped value, and SHALL NOT apply client-side badge filtering on top of the API results.

**Validates: Requirements 6.1**

---

### Property 9: Card image carousel count matches imageUrls

*For any* product returned by the API with an `imageUrls` array of length N > 0, the rendered card HTML SHALL contain exactly N `.cc-slide` elements.

**Validates: Requirements 5.8**

---

### Property 10: Modal variant list count matches variants array

*For any* product detail response with a `variants` array of length N, the rendered modal SHALL contain exactly N `.modal-variant-item` elements.

**Validates: Requirements 5.11**

---

### Property 11: i18n title selection

*For any* product and any language setting `lang` in `{es, en}`, the title rendered in the card and modal SHALL equal `product.titleEs` when `lang === 'es'` and `product.titleEn` when `lang === 'en'`.

**Validates: Requirements 5.13**

---

### Property 12: Admin badge form pre-selection round-trip

*For any* product with badge value `B` (including `null`), rendering the inline edit form for that product SHALL result in the badge `<select>` element having `value === B` (or `""` when `B` is `null`).

**Validates: Requirements 3.4**

---

## Error Handling

### Backend

| Scenario | Response |
|---|---|
| `Badge` value not in allowed set | HTTP 422 Problem Details: `"Badge must be one of: hot, new, promo, popular, or null."` |
| Product not found | HTTP 404 Problem Details (existing behavior) |
| Seed category not found | `InvalidOperationException` logged; seeder skips that product and logs a warning |
| Price parse failure in seeder | Defaults to `Price = 0`, `IsAvailable = false`; logs a warning |

### Frontend

| Scenario | Behavior |
|---|---|
| API network error | `renderError()` shows error card with retry button in `#catGrid` |
| API 5xx | Same as network error |
| API 404 on product detail | Modal shows "Producto no encontrado" message |
| Empty `items` array | `#catEmpty` shown |
| Image load failure | Existing `onerror` handler replaces broken `<img>` with emoji placeholder |
| `window.FILAMORFOSIS_API_BASE` is empty string | `api.js` IIFE falls back to production URL (falsy check) |

---

## Testing Strategy

### Unit Tests (xUnit + Moq)

- `BadgeValues.IsValid` — example-based tests for each allowed value, null, and several invalid strings.
- `AdminProductsController.Update` — verify 422 returned for invalid badge, 200 for valid badge.
- `ProductsController.GetAll` — verify `badge` query param filters results correctly (in-memory EF Core).
- `DbSeeder.SeedProductsAsync` — run against in-memory EF Core; verify product count, variant count per product, and `IsAvailable`/`Price` for Cotizar rows.
- `DbSeeder` idempotence — call `SeedAsync` twice; verify no duplicate products.

### Property-Based Tests (FsCheck / CsCheck for C#; fast-check for JS)

Each property test runs a minimum of 100 iterations.

**C# (FsCheck):**

- **Property 1** — `Arb.Generate<string>()` produces random badge strings; verify `BadgeValues.IsValid` returns true iff value is in allowed set or null.
  Tag: `Feature: product-catalog-migration, Property 1: Badge validation rejects invalid values`

- **Property 2** — Generate `Product` with random `Badge` from allowed set; map to both DTOs; assert `dto.Badge == product.Badge`.
  Tag: `Feature: product-catalog-migration, Property 2: Badge round-trip through DTOs`

- **Property 3** — Run seeder N times (N generated 1–5); assert product count equals source count.
  Tag: `Feature: product-catalog-migration, Property 3: Seed idempotence`

- **Property 4** — For each seeded product, assert `variants.Count == 2 * pricingRows.Count`.
  Tag: `Feature: product-catalog-migration, Property 4: Seed variant count invariant`

- **Property 5** — For each seeded variant whose source row had "Cotizar"/"N/A", assert `IsAvailable == false && Price == 0`.
  Tag: `Feature: product-catalog-migration, Property 5: Unavailable variant pricing`

- **Property 6** — Generate random badge value B; seed products with mixed badges; call `GetAll(badge: B)`; assert all returned products have `Badge == B`.
  Tag: `Feature: product-catalog-migration, Property 6: Badge API filter`

**JavaScript (fast-check):**

- **Property 7** — Generate random category GUIDs; simulate tab click; assert `getProducts` was called with matching `categoryId`.
  Tag: `Feature: product-catalog-migration, Property 7: Catalog engine API call includes active category`

- **Property 8** — For each badge-based filter id; assert `getProducts` called with correct `badge` param.
  Tag: `Feature: product-catalog-migration, Property 8: Badge-based filter maps to API badge param`

- **Property 9** — Generate `ProductSummaryDto` with random `imageUrls` array (length 0–10); render card; assert `.cc-slide` count equals `imageUrls.length`.
  Tag: `Feature: product-catalog-migration, Property 9: Card image carousel count matches imageUrls`

- **Property 10** — Generate `ProductDetailDto` with random `variants` array (length 0–20); render modal; assert `.modal-variant-item` count equals `variants.length`.
  Tag: `Feature: product-catalog-migration, Property 10: Modal variant list count matches variants array`

- **Property 11** — Generate product with random `titleEs`/`titleEn`; for each lang in `{es, en}`; render card; assert displayed title matches the correct field.
  Tag: `Feature: product-catalog-migration, Property 11: i18n title selection`

- **Property 12** — Generate product with random badge from allowed set; render edit form; assert select value equals badge.
  Tag: `Feature: product-catalog-migration, Property 12: Admin badge form pre-selection round-trip`

### Integration Tests

- `GET /api/v1/products?badge=hot` against a real (test) database with seeded data — verify only `Badge == "hot"` products returned.
- `PUT /api/v1/admin/products/{id}` with `badge: "invalid"` — verify HTTP 422.
- Full seed run against a fresh SQLite database — verify all 30 UV products and 6 engraving products are present with correct variant counts.

### Smoke Tests

- `products.html` DOM: verify `window.FILAMORFOSIS_API_BASE` script appears before `api.js` script tag.
- EF Core migration: verify `Badge` column exists in `Products` table after migration.
- File deletion: verify `Products_UV.js` and `Products_Engrave.js` do not exist after cleanup.
