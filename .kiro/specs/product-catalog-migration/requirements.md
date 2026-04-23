# Requirements Document

## Introduction

This feature migrates the Filamorfosis product catalog from hardcoded JavaScript data files to the live database-backed REST API. It covers four areas: (1) pointing the frontend API client to localhost for local development, (2) seeding all hardcoded UV and laser-engraving products into the database and deleting the static data files, (3) adding a `Badge` field to the `Product` entity manageable from the admin panel, and (4) rewriting the frontend catalog engine (`products.js`) to fetch products from the API instead of reading from in-memory JS arrays, while preserving the existing card/modal UI.

## Glossary

- **API_Client**: The `assets/js/api.js` module that wraps all `fetch()` calls to the backend.
- **Catalog_Engine**: The `assets/js/products.js` module that renders the product grid, filter chips, tabs, and detail modal.
- **Admin_Panel**: The admin SPA (`admin.html` + `assets/js/admin-products.js`) used by store operators.
- **Badge**: A short promotional label attached to a product. Allowed values: `"hot"`, `"new"`, `"promo"`, `"popular"`, or `null`.
- **Product**: A `Product` entity stored in the database, returned by `GET /api/v1/products`.
- **ProductVariant**: A `ProductVariant` entity representing one purchasable option of a Product (e.g., "Vidrio 9cm — Flat").
- **Pricing_Row**: A single row in the hardcoded `pricing.rows` array, containing a `variant` label, a `flat` price, and a `relief` price.
- **Seed_Script**: A one-time C# migration or data-seeder that inserts the hardcoded products into the database.
- **ProductSummaryDto**: The DTO returned by `GET /api/v1/products` (paginated list).
- **ProductDetailDto**: The DTO returned by `GET /api/v1/products/{id}`.

---

## Requirements

### Requirement 1: Local Development API Base URL

**User Story:** As a developer, I want the frontend to point to `http://localhost:5000/api/v1` during local development, so that I can test changes against the local backend without modifying production configuration.

#### Acceptance Criteria

1. THE `API_Client` SHALL read the API base URL from `window.FILAMORFOSIS_API_BASE` when that variable is defined before `api.js` is loaded.
2. WHEN `window.FILAMORFOSIS_API_BASE` is not defined, THE `API_Client` SHALL fall back to `https://api.filamorfosis.com/api/v1`.
3. THE `products.html` page SHALL set `window.FILAMORFOSIS_API_BASE = 'http://localhost:5000/api/v1'` in a `<script>` block that appears before the `api.js` `<script>` tag, so that local development works without editing `api.js`.
4. IF the override variable is set to an empty string, THEN THE `API_Client` SHALL fall back to the production URL.

---

### Requirement 2: Badge Field on Product Entity

**User Story:** As a store operator, I want to assign a promotional badge to any product, so that I can highlight hot sellers, new arrivals, promotions, and popular items in the catalog.

#### Acceptance Criteria

1. THE `Product` entity SHALL include a `Badge` property of type `string?` that accepts the values `"hot"`, `"new"`, `"promo"`, `"popular"`, or `null`.
2. THE database schema SHALL be updated via an EF Core migration to add the `Badge` column to the `Products` table, with a default value of `null`.
3. THE `ProductSummaryDto` SHALL include a `badge` field (nullable string) populated from `Product.Badge`.
4. THE `ProductDetailDto` SHALL include a `badge` field (nullable string) populated from `Product.Badge`.
5. THE `CreateProductRequest` SHALL include an optional `Badge` field validated to only accept `"hot"`, `"new"`, `"promo"`, `"popular"`, or `null`.
6. THE `UpdateProductRequest` SHALL include an optional `Badge` field validated to only accept `"hot"`, `"new"`, `"promo"`, `"popular"`, or `null`.
7. WHEN a `CreateProductRequest` or `UpdateProductRequest` contains a `Badge` value outside the allowed set, THEN THE `AdminProductsController` SHALL return HTTP 422 with a Problem Details body describing the invalid value.

---

### Requirement 3: Badge Management in Admin Panel

**User Story:** As a store operator, I want to set or clear a product's badge from the admin panel, so that I can manage promotional labels without touching the database directly.

#### Acceptance Criteria

1. THE `Admin_Panel` product form SHALL display a dropdown field labeled "Badge" with options: `(none)`, `hot`, `new`, `promo`, `popular`.
2. WHEN a store operator saves a product with a badge selected, THE `Admin_Panel` SHALL send the badge value in the `UpdateProductRequest` body to `PUT /api/v1/admin/products/{id}`.
3. WHEN a store operator selects `(none)` and saves, THE `Admin_Panel` SHALL send `"badge": null` in the request body.
4. WHEN the admin product form loads an existing product, THE `Admin_Panel` SHALL pre-select the current badge value in the dropdown.
5. THE `Admin_Panel` SHALL display a visual preview of the badge label next to the dropdown so the operator can see how it will appear on the storefront.

---

### Requirement 4: Product Data Migration (Seed)

**User Story:** As a developer, I want all hardcoded UV and laser-engraving products seeded into the database, so that the catalog is driven by the API and the static JS data files can be deleted.

#### Acceptance Criteria

1. THE `Seed_Script` SHALL create one `Product` record per product object currently defined in `Products_UV.js` and `Products_Engrave.js`, preserving `id` (as `Slug`), `title` (as `TitleEs`), `desc` (as `DescriptionEs`), `tags`, `images` (as `ImageUrls`), `badge`, and `category` (mapped to the corresponding `CategoryId`).
2. THE `Seed_Script` SHALL create two `ProductVariant` records per `Pricing_Row` — one for the `flat` finish and one for the `relief` finish — using the label convention `"{row.variant} — Flat"` and `"{row.variant} — Relieve"` for `LabelEs`.
3. WHEN a `Pricing_Row` has `flat` equal to `"Cotizar"` or `"N/A"`, THE `Seed_Script` SHALL set `IsAvailable = false` and `Price = 0` for that variant.
4. WHEN a `Pricing_Row` has `relief` equal to `"Cotizar"` or `"N/A"`, THE `Seed_Script` SHALL set `IsAvailable = false` and `Price = 0` for that variant.
5. THE `Seed_Script` SHALL be idempotent: WHEN run more than once, THE `Seed_Script` SHALL not create duplicate products (checked by `Slug`).
6. AFTER the seed is verified in the target environment, THE `products/data/Products_UV.js` and `products/data/Products_Engrave.js` files SHALL be deleted from the repository.
7. THE `products.html` page SHALL remove the `<script>` tags that loaded `Products_UV.js` and `Products_Engrave.js` after those files are deleted.

---

### Requirement 5: Frontend Catalog Fetches Products from API

**User Story:** As a customer, I want the product catalog to load products from the live API, so that I always see up-to-date products, prices, and availability without a frontend deployment.

#### Acceptance Criteria

1. WHEN `products.html` loads, THE `Catalog_Engine` SHALL call `GET /api/v1/products` with the active `categoryId` filter and replace the hardcoded `PRODUCTS` array with the API response items.
2. WHEN the user switches category tabs, THE `Catalog_Engine` SHALL call `GET /api/v1/products?categoryId={id}` and re-render the grid with the returned products.
3. WHEN the user types in the search box, THE `Catalog_Engine` SHALL call `GET /api/v1/products?search={query}` (debounced by 300 ms) and re-render the grid.
4. WHILE the API request is in flight, THE `Catalog_Engine` SHALL display skeleton loading cards in the grid.
5. IF the API returns an empty `items` array, THEN THE `Catalog_Engine` SHALL display the existing empty-state element (`#catEmpty`).
6. IF the API call fails with a network error or HTTP 5xx, THEN THE `Catalog_Engine` SHALL display an error message in the grid area and a retry button.
7. THE `Catalog_Engine` SHALL map `ProductSummaryDto.badge` to the card badge display, rendering the same visual badges (`hot`, `new`, `promo`, `popular`) as the current hardcoded implementation.
8. THE `Catalog_Engine` SHALL map `ProductSummaryDto.imageUrls` to the card carousel, preserving the existing multi-image carousel behavior.
9. THE `Catalog_Engine` SHALL derive the "from price" displayed on each card from `ProductSummaryDto.basePrice` (the minimum available variant price returned by the API).
10. WHEN a customer clicks "Ver detalles" on a card, THE `Catalog_Engine` SHALL call `GET /api/v1/products/{id}` and render the detail modal using `ProductDetailDto`.
11. THE `Catalog_Engine` SHALL map `ProductDetailDto.variants` to the modal's option selector, replacing the hardcoded `pricing.rows` table with a variant list showing `LabelEs`, `Price`, and availability.
12. THE `Catalog_Engine` SHALL support pagination: WHEN the user scrolls to the bottom of the grid or clicks a "Load more" button, THE `Catalog_Engine` SHALL fetch the next page and append cards to the grid.
13. THE `Catalog_Engine` SHALL preserve all existing i18n behavior: product titles and descriptions SHALL use `TitleEs`/`TitleEn` and `DescriptionEs`/`DescriptionEn` based on `window.currentLang`.

---

### Requirement 6: Curated Filters Compatibility with API Data

**User Story:** As a customer, I want the filter chips (Popular, New, Gift, Business, etc.) to work correctly after the migration, so that I can still narrow down the catalog by category.

#### Acceptance Criteria

1. THE `Catalog_Engine` SHALL apply the `popular` and `new` curated filters by passing `badge=hot` or `badge=new` as query parameters to `GET /api/v1/products`, rather than filtering the local array.
2. THE `GET /api/v1/products` endpoint SHALL accept an optional `badge` query parameter and return only products whose `Badge` matches the given value.
3. THE `Catalog_Engine` SHALL apply the `gift`, `business`, `decor`, `drinkware`, `budget`, and `premium` curated filters client-side against the already-fetched page of products, using the same tag/description matching logic currently in `CURATED_FILTERS`.
4. WHEN a curated filter produces zero matching products in the current page, THE `Catalog_Engine` SHALL display the empty-state element.

---

### Requirement 7: products.html Script Tag Cleanup

**User Story:** As a developer, I want `products.html` to load only the scripts it needs after the migration, so that the page does not attempt to load deleted data files.

#### Acceptance Criteria

1. THE `products.html` page SHALL NOT contain `<script>` tags referencing `Products_UV.js` or `Products_Engrave.js` after those files are deleted.
2. THE `products.html` page SHALL retain the `<script>` tag for `products/data/catalog.js` because it provides `CATEGORIES`, `CURATED_FILTERS`, and `CAT_TRANSLATIONS`.
3. THE `products.html` page SHALL load `assets/js/api.js` before `assets/js/products.js` so that `window.getProducts` and `window.getProduct` are available when the catalog engine initializes.
