# Design Document — Store Product-First Redesign

## Overview

This redesign transforms the Filamorfosis® storefront from a brochure-first experience into a product-first e-commerce SPA. The existing `index.html` becomes the store shell; the hero, category strip, featured carousels, and full product grid are the primary content. Services are demoted to a secondary section below the fold.

The implementation is entirely in vanilla JS / HTML / CSS — no framework. It extends the existing `products.js` catalog engine, `cart.js` drawer, `api.js` fetch wrapper, and `main.js` i18n system. No new build tooling is introduced.

Key design decisions:
- **SPA routing via `hashchange`** — zero full-page reloads; navbar and footer are permanent shell elements.
- **Product_Detail_Page replaces the modal** — navigating to `/#product-{id}` renders a full-page detail view inside the SPA shell instead of the current `catModal` overlay.
- **Category Strip is API-driven** — fetched from `GET /api/v1/categories`, not hardcoded.
- **Featured carousels are badge-filtered API calls** — `badge=hot` and `badge=new` queries.
- **All new strings go into all 6 i18n files** — following the existing `window.FilamorfosisI18n` pattern.

---

## Architecture

### SPA Shell Model

```
┌─────────────────────────────────────────────────────────┐
│  Nav_Shell  (navbar — permanent, never reloads)         │
├─────────────────────────────────────────────────────────┤
│  Promo Banner  (above navbar, dismissible)              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  #spa-view  ← SPA_Router swaps content here            │
│  ┌───────────────────────────────────────────────────┐  │
│  │  view: home  (Hero + Category Strip + Featured    │  │
│  │              + Product Grid + Services + Clients  │  │
│  │              + Contact)                           │  │
│  ├───────────────────────────────────────────────────┤  │
│  │  view: product-{id}  (Product_Detail_Page)        │  │
│  ├───────────────────────────────────────────────────┤  │
│  │  view: services  (services.html content)          │  │
│  ├───────────────────────────────────────────────────┤  │
│  │  view: contact / faq / about                      │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  Footer  (permanent)                                    │
└─────────────────────────────────────────────────────────┘
```

### Routing Flow

```
URL hash change
      │
      ▼
SPA_Router.navigate(hash)
      │
      ├─ /#home  ──────────────► renderHomeView()
      │                           (Hero + CategoryStrip + Featured + Grid + Services)
      │
      ├─ /#product-{id}  ──────► renderProductDetail(id)
      │                           (fetch /products/{id}, render detail page)
      │
      ├─ /#services  ──────────► renderServicesView()
      │
      ├─ /#contact|faq|about  ─► renderStaticView(name)
      │
      └─ unknown  ─────────────► renderHomeView()  (fallback)
```

### Module Responsibilities

| Module | File | Responsibility |
|---|---|---|
| `SPA_Router` | `assets/js/main.js` (extended) | Hash routing, view swapping, scroll-position restore |
| `Catalog_SPA` | `assets/js/products.js` (extended) | Category strip, featured carousels, product grid, filters |
| `ProductDetail` | `assets/js/products.js` (new section) | Product detail page render, variant selection, add-to-cart |
| `Cart` | `assets/js/cart.js` (unchanged) | Cart drawer, badge, add/remove/update |
| `API` | `assets/js/api.js` (unchanged) | All fetch calls |
| `i18n` | `assets/js/i18n/lang.*.js` + `store-i18n.js` | All translation strings |
| `Styles` | `assets/css/store.css` (new/extended) | Store-specific styles |

---

## Components and Interfaces

### SPA_Router

Implemented as a module-level object in `main.js`. Listens to `hashchange` and `DOMContentLoaded`.

```js
// Public interface
window._spaNavigate(hash)          // programmatic navigation
window._spaGetCurrentView()        // returns current view name
window._spaScrollPositions         // Map<viewName, scrollY> for restore
```

**Route matching logic:**
- `''` or `'#home'` → home view
- `'#product-{id}'` → product detail (id extracted via regex `/^#product-(.+)$/`)
- `'#services'` → services view
- `'#contact'`, `'#faq'`, `'#about'` → static section views
- anything else → home view (fallback)

**Scroll position restore:** Before leaving the home view, `window.scrollY` is saved to `_spaScrollPositions.home`. On return, `window.scrollTo` restores it after the view renders.

### Category Strip

Rendered by `renderCategoryStrip()` in `products.js`. Fetches `GET /api/v1/categories` once on page load and caches the result. On language switch, re-renders using cached data with updated `nameEs`/`nameEn` resolution.

```
CategoryStrip
  ├─ category card × N
  │    ├─ <img> (imageUrl or gradient placeholder)
  │    ├─ <span> localized name
  │    ├─ <span> product count
  │    └─ click → filterByCategory(slug)
  └─ active card has .cat-strip__card--active class
```

### Featured Carousels

Two independent carousels rendered by `renderFeaturedSection(badge, containerId)`:
- `badge=hot` → "🔥 Popular" section
- `badge=new` → "✨ Nuevo" section

Each carousel uses Swiper.js (already bundled) with `autoplay: { delay: 4000, pauseOnMouseEnter: true }`. If the API returns zero items, the section's container element gets `display:none`.

### Product Grid

Existing `renderGrid()` in `products.js` — extended to:
- Navigate to `/#product-{id}` on card click (instead of opening the modal)
- Display the `Ver detalles` CTA as a link-style button

### Product_Detail_Page

New function `renderProductDetail(id)` in `products.js`. Fetches `GET /api/v1/products/{id}` and renders into `#spa-view`.

```
ProductDetailPage
  ├─ Breadcrumb: Home > [Category] > [Title]
  ├─ Image gallery (main image + thumbnails)
  ├─ Product info (h1 title, full description)
  ├─ Variant selector
  │    └─ variant row × N
  │         ├─ checkbox + label + price
  │         ├─ quantity stepper (shown when checked)
  │         ├─ design file upload (when acceptsDesignFile=true)
  │         └─ disabled state (isAvailable=false or inStock=false)
  ├─ Total price display (updates on variant selection)
  ├─ "Agregar al carrito" button (disabled until variant selected)
  └─ "Back to catalog" link → _spaNavigate('#home')
```

### Cart_Icon Enhancement

The existing `#cart-nav-icon` element gets a new CSS class `cart-icon--enhanced` applied in `store.css`. The badge element uses the existing `#cart-count` id — no JS changes needed, only CSS.

### Nav_Shell

The navbar order is enforced in HTML: Home | Personalized Services | Contact | FAQ | About | Cart_Icon | Profile_Menu | Language Selector. The Profile_Menu dropdown is a `<div class="profile-dropdown">` with two items using `data-translate` attributes.

---

## Data Models

These are the API response shapes the frontend consumes. No backend changes are required.

### Product (from `GET /api/v1/products`)

```ts
interface Product {
  id: string;
  titleEs: string;
  titleEn: string;
  descriptionEs: string;
  descriptionEn: string;
  imageUrls: string[];       // S3 keys, resolved via CDN_Base
  badge: 'hot' | 'new' | 'promo' | 'popular' | null;
  tags: string[];
  categoryId: string;
  basePrice: number;         // cheapest available variant price
  hasDiscount: boolean;
  variants: ProductVariant[];
}
```

### ProductVariant

```ts
interface ProductVariant {
  id: string;
  labelEs: string;
  labelEn: string;
  price: number;
  effectivePrice: number;    // server-computed after discounts
  discounts: Discount[];
  isAvailable: boolean;
  inStock: boolean;
  acceptsDesignFile: boolean;
  attributes: VariantAttribute[];
}
```

### Category (from `GET /api/v1/categories`)

```ts
interface Category {
  id: string;
  slug: string;
  nameEs: string;
  nameEn: string;
  imageUrl: string | null;
  productCount: number;
}
```

### Cart (from `GET /api/v1/cart`)

Already handled by `cart.js` — no changes to the data model.

### SPA State (client-side only)

```ts
interface SPAState {
  currentView: string;           // 'home' | 'product-{id}' | 'services' | ...
  scrollPositions: Map<string, number>;
  categoryCache: Category[];     // fetched once, reused on lang switch
  featuredHotCache: Product[];   // fetched once per session
  featuredNewCache: Product[];   // fetched once per session
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: SPA navigation never triggers a full page reload

*For any* sequence of `_spaNavigate` calls with valid route hashes, the `window.location.reload` function SHALL never be called and the `#spa-view` container SHALL always remain in the DOM.

**Validates: Requirements 0.3, 0.8**

### Property 2: Unknown routes fall back to home

*For any* hash string that does not match a known route pattern (`home`, `services`, `contact`, `faq`, `about`, `product-{id}`), the SPA_Router SHALL render the home view and set the active view to `'home'`.

**Validates: Requirements 0.11**

### Property 3: Category filter reduces or preserves product count

*For any* array of products and any category selection, the number of products remaining after applying the category filter SHALL be less than or equal to the total unfiltered count.

**Validates: Requirements 2.4, 4.4**

### Property 4: Category names resolve from current language

*For any* category object and any supported language code, the rendered category name SHALL equal `nameEs` when the language is `'es'` and `nameEn` for all other languages — never a hardcoded string.

**Validates: Requirements 2.7, 9.2**

### Property 5: Empty badge sections are hidden

*For any* badge value (`hot`, `new`) where the API returns an empty product array, the corresponding featured section container SHALL not be visible; when the array is non-empty, the section SHALL be visible.

**Validates: Requirements 3.3**

### Property 6: Discounted price display always shows both prices

*For any* product or variant where `effectivePrice < price`, the rendered HTML SHALL contain both the original price (in a struck-through element) and the effective price — never only one of them. When there is no discount (`effectivePrice >= price`), only the single price SHALL be shown.

**Validates: Requirements 5.3, 6.12**

### Property 7: Load More button visibility matches pagination state

*For any* combination of `totalCount` and `pageSize` values, the Load More button SHALL be visible if and only if `currentPage * pageSize < totalCount`.

**Validates: Requirements 4.5**

### Property 8: Product card renders all required fields with lazy-loaded images

*For any* product object, the rendered Product_Card HTML SHALL contain: a localized title, a price display, a CTA button, and all `<img>` elements SHALL have the `loading="lazy"` attribute.

**Validates: Requirements 5.1, 11.1**

### Property 9: Variant selection controls add-to-cart button state

*For any* set of product variants with mixed availability, the "Agregar al carrito" button SHALL be enabled if and only if at least one available (`isAvailable=true` and `inStock=true`) variant is currently selected.

**Validates: Requirements 6.5**

### Property 10: i18n key fallback to Spanish

*For any* translation key that exists in the Spanish (`es`) i18n map but is absent in the active language map, the `t(key)` function SHALL return the Spanish value — never the raw key string.

**Validates: Requirements 9.6**

### Property 11: Price format invariant

*For any* numeric price value, the rendered price string SHALL match the pattern `$N MXN` where `N` is the price rounded to the nearest integer — never a decimal, never a different currency symbol.

**Validates: Requirements 5.7**

---

## Error Handling

### API Failures

| Scenario | Behavior |
|---|---|
| `GET /api/v1/categories` fails | Product grid renders without category filtering; error logged (dev only); no visible error to user |
| `GET /api/v1/products` fails | Error state card rendered in grid with retry button; i18n key `error_load_products` |
| `GET /api/v1/products/{id}` fails | Product detail page shows error state with "Back to catalog" link |
| `POST /api/v1/cart/items` fails | Error toast shown; user stays on Product_Detail_Page |
| `POST /api/v1/cart/items` returns 401 | Auth modal shown (existing `FilamorfosisAuth.showModal('login')`) |
| Featured carousel API fails | Section hidden silently (same as zero-results behavior) |

### Image Failures

All `<img>` elements in the product grid and detail page have an `onerror` handler (via delegated event listener) that replaces the broken image with the `_IMG_PLACEHOLDER` SVG. This is already implemented in `products.js` and is reused.

### SPA Navigation Errors

If `renderProductDetail(id)` throws (e.g., network error), the `#spa-view` renders an error card with a "Back to catalog" link that calls `_spaNavigate('#home')`.

### i18n Missing Keys

The `t(key)` bridge function already falls back to Spanish. New keys introduced by this redesign are added to all 6 language files to prevent fallback in production.

---

## Testing Strategy

### Unit Tests

Unit tests cover pure functions and rendering helpers that have no DOM or network dependencies:

- `shouldShowUrgency(stockQuantity)` — already tested; no changes needed
- `resolveImageUrl(url)` — test CDN prefix logic, placeholder fallback, passthrough for full URLs
- `_applyClientFilter(products, filter)` — test each filter type (all, popular, new, tag-based, curated)
- `t(key)` fallback — test missing key returns Spanish value, not raw key
- `pT(product, field)` — test language resolution for `titleEs`/`titleEn`, `descriptionEs`/`descriptionEn`
- Price display logic — test strikethrough+effective price when `effectivePrice < price`, plain price otherwise
- SPA route matching — test each route pattern including unknown-route fallback

### Property-Based Tests

Property-based testing is appropriate here because the feature involves data transformation logic (filtering, price display, i18n fallback, route matching) where input variation meaningfully reveals edge cases.

**Library:** [fast-check](https://github.com/dubzzz/fast-check) (JavaScript PBT library)

**Minimum iterations:** 100 per property

Each test is tagged with a comment referencing the design property:
```js
// Feature: store-product-first-redesign, Property N: <property_text>
```

**Property test implementations:**

- **Property 2** — Generate arbitrary hash strings not matching known routes; assert router returns `'home'` view and never throws
- **Property 3** — Generate random product arrays with random categoryId values; assert filtered count ≤ total count
- **Property 4** — Generate random category objects and language codes; assert rendered name equals `nameEs` for `'es'`, `nameEn` otherwise
- **Property 5** — Generate empty and non-empty product arrays; assert section visibility matches `array.length > 0`
- **Property 6** — Generate variant objects with random price/effectivePrice pairs; assert rendered HTML contains both prices when `effectivePrice < price`, single price otherwise
- **Property 7** — Generate random totalCount/pageSize/currentPage combinations; assert Load More button visibility matches `currentPage * pageSize < totalCount`
- **Property 8** — Generate random product objects; assert rendered card contains title, price, CTA button, and all `<img>` have `loading="lazy"`
- **Property 9** — Generate random variant selection states with mixed availability; assert button enabled iff at least one available variant is selected
- **Property 10** — Generate random key strings present in `es` but absent in target language; assert `t(key)` returns the Spanish value, not the raw key
- **Property 11** — Generate random numeric price values; assert rendered string matches `/^\$\d+ MXN$/`

### Integration Tests

Integration tests verify the wiring between the SPA router, catalog engine, and cart module using a real DOM (jsdom or browser):

- Navigate to `/#product-{id}` → verify Product_Detail_Page renders with correct product title
- Navigate back to `/#home` → verify Product_Grid is visible and scroll position is restored
- Add to cart from Product_Detail_Page → verify cart badge increments and toast appears
- Language switch → verify Category_Strip re-renders with localized names
- Category filter click → verify Product_Grid re-fetches with correct `categoryId` param

### Manual / Visual Checks

- Hero video crossfade loop on mobile and desktop
- Category_Strip horizontal scroll-snap on mobile (max-width 768px)
- Featured carousel auto-scroll pause on hover
- Cart drawer animation and auto-close behavior
- WhatsApp FAB tooltip on hover
- Promo banner dismiss and navbar offset adjustment
- All 6 languages render without garbled characters or raw keys
