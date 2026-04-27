# Implementation Plan: Store Product-First Redesign

## Overview

Transform the Filamorfosis® storefront from a brochure-first experience into a product-first e-commerce SPA. The implementation is entirely in vanilla JS / HTML / CSS, extending existing modules (`products.js`, `cart.js`, `api.js`, `main.js`) with no new build tooling. The SPA shell (navbar + footer) persists across all views; routing is hash-based via `hashchange`.

## Tasks

- [x] 1. Set up SPA shell structure and routing foundation
  - Restructure `index.html` to include a permanent `#spa-view` container between the navbar and footer
  - Add the `#spa-view` div as the sole content swap target; navbar and footer remain outside it
  - Extend `assets/js/main.js` with the `SPA_Router` object: listen to `hashchange` and `DOMContentLoaded`, implement `window._spaNavigate(hash)`, `window._spaGetCurrentView()`, and `window._spaScrollPositions` Map
  - Implement route matching logic: `''`/`#home` → home, `#product-{id}` → detail, `#services` → services, `#contact`/`#faq`/`#about` → static, unknown → home fallback
  - Implement scroll-position save/restore: save `window.scrollY` before leaving home view, restore after returning
  - _Requirements: 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.9, 0.10, 0.11_

  - [x] 1.1 Write property test for unknown-route fallback (Property 2)
    - **Property 2: Unknown routes fall back to home**
    - Generate arbitrary hash strings not matching known routes; assert router returns `'home'` view and never throws
    - **Validates: Requirements 0.11**

- [x] 2. Update Nav_Shell order, Cart_Icon enhancement, and Profile_Menu
  - Reorder navbar items in `index.html` to: Home | Personalized Services | Contact | FAQ | About | Cart_Icon | Profile_Menu | Language Selector
  - Apply `data-translate` attributes with keys `nav_home`, `nav_services`, `nav_contact`, `nav_faq`, `nav_about` to all nav links
  - Add `cart-icon--enhanced` CSS class to `#cart-nav-icon` in `index.html`; add corresponding styles in `assets/css/store.css` (larger icon, glowing badge)
  - Implement Profile_Menu as a `<div class="profile-dropdown">` with two items using `data-translate` keys `nav_profile_manage` and `nav_logout`
  - Hide cart badge when count is zero via CSS (`:empty` or JS class toggle)
  - Ensure navbar stays fixed at top with `backdrop-filter: blur(...)` on scroll — add scroll listener in `main.js` that toggles a CSS class
  - Implement hamburger menu collapse for viewports ≤ 992px including all nav items
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10_

- [x] 3. Add all new i18n keys to all 6 language files
  - Add keys to `assets/js/i18n/lang.es.js`, `lang.en.js`, `lang.de.js`, `lang.pt.js`, `lang.ja.js`, `lang.zh.js` following the `window.FilamorfosisI18n['{code}'] = { ... }` pattern
  - New keys include: `nav_home`, `nav_services`, `nav_contact`, `nav_faq`, `nav_about`, `nav_profile_manage`, `nav_logout`, `hero_headline`, `hero_subheadline`, `hero_cta_primary`, `hero_cta_secondary`, `trust_made_in_mexico`, `trust_min_order`, `trust_fast_shipping`, `badge_hot`, `badge_new`, `badge_promo`, `badge_popular`, `no_image`, `empty_text`, `error_load_products`, `load_more`, `ver_detalles`, `agregar_al_carrito`, `agotado`, `no_disponible`, `back_to_catalog`, `breadcrumb_home`, `wa_subtitle`, `footer_trademark`, `cart_empty_cta`, `promo_banner_text`
  - Implement `t(key)` fallback: if key is missing in active language, return Spanish value — never the raw key string
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

  - [x] 3.1 Write property test for i18n key fallback (Property 10)
    - **Property 10: i18n key fallback to Spanish**
    - Generate random key strings present in `es` but absent in target language; assert `t(key)` returns the Spanish value, not the raw key
    - **Validates: Requirements 9.6**

- [x] 4. Implement product-first Hero_Section
  - Replace the existing hero content in `index.html` with the product-first layout: headline (`data-translate="hero_headline"`), subheadline, primary CTA (scrolls to Category_Strip/Product_Grid), secondary CTA (scrolls to Services_Section), and trust bar with 3 value propositions using i18n keys
  - Preserve the existing crossfade video background loop mechanism
  - Add responsive styles in `assets/css/store.css`: CTA buttons stack vertically below 768px, trust bar wraps to two rows
  - Implement smooth scroll on primary CTA click via `scrollIntoView({ behavior: 'smooth' })`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 5. Implement Category Strip
  - Add `renderCategoryStrip()` function in `assets/js/products.js`
  - Fetch `GET /api/v1/categories` once on page load; cache result in `SPAState.categoryCache`
  - Render one card per category: `<img loading="lazy">` (or gradient placeholder when `imageUrl` is null), localized name via `nameEs`/`nameEn`, product count
  - Implement `filterByCategory(slug)` that re-fetches the Product_Grid with the selected `categoryId`; toggle `.cat-strip__card--active` on the active card
  - On language switch, re-render Category_Strip from cached data with updated name resolution — no extra API call
  - Add horizontal scroll-snap styles for mobile (≤ 768px) in `assets/css/store.css`
  - If `GET /api/v1/categories` fails, render Product_Grid without filtering and log error (dev only)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

  - [x] 5.1 Write property test for category filter count (Property 3)
    - **Property 3: Category filter reduces or preserves product count**
    - Generate random product arrays with random categoryId values; assert filtered count ≤ total count
    - **Validates: Requirements 2.4, 4.4**

  - [x] 5.2 Write property test for category name language resolution (Property 4)
    - **Property 4: Category names resolve from current language**
    - Generate random category objects and language codes; assert rendered name equals `nameEs` for `'es'`, `nameEn` otherwise
    - **Validates: Requirements 2.7, 9.2**

- [x] 6. Implement Featured Carousels (hot and new badges)
  - Add `renderFeaturedSection(badge, containerId)` in `assets/js/products.js`
  - Fetch `GET /api/v1/products?badge=hot` and `GET /api/v1/products?badge=new`; cache results in `SPAState.featuredHotCache` and `SPAState.featuredNewCache`
  - Initialize Swiper.js carousel for each section with `autoplay: { delay: 4000, pauseOnMouseEnter: true }`
  - If API returns zero items, set the section container to `display:none` (via CSS class toggle)
  - Featured cards display: product image, localized title, Effective_Price with strikethrough original when discounted, Badge label from i18n
  - On card click, call `_spaNavigate('#product-{id}')`
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x] 6.1 Write property test for empty badge section visibility (Property 5)
    - **Property 5: Empty badge sections are hidden**
    - Generate empty and non-empty product arrays; assert section visibility matches `array.length > 0`
    - **Validates: Requirements 3.3**

- [x] 7. Implement Full Product Grid with filtering, search, and pagination
  - Extend `renderGrid()` in `assets/js/products.js` to navigate to `/#product-{id}` on card click instead of opening the modal
  - Implement debounced search input (300ms) that fetches `GET /api/v1/products?search={query}`
  - Implement filter chips for `CURATED_FILTERS` (All, Popular, New, Gifts, Business, Budget, Premium, Decor, Drinkware); on chip click re-render grid without page reload
  - Implement skeleton loading cards that appear within 100ms of fetch initiation (use `setTimeout` guard + CSS class)
  - Implement "Load More" button: append next page results to existing grid when `currentPage * pageSize < totalCount`
  - Render error state card with retry button on fetch failure (i18n key `error_load_products`)
  - Render localized empty-state message using `empty_text` i18n key when filtered result is empty
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

  - [x] 7.1 Write property test for Load More button visibility (Property 7)
    - **Property 7: Load More button visibility matches pagination state**
    - Generate random totalCount/pageSize/currentPage combinations; assert Load More button visible iff `currentPage * pageSize < totalCount`
    - **Validates: Requirements 4.5**

- [x] 8. Implement Product Card design
  - Update Product_Card HTML template in `products.js` to include: image carousel with arrow navigation and dot indicators (multiple images), localized title, description excerpt (max 2 lines via CSS `-webkit-line-clamp`), category label, starting Effective_Price, and "Ver detalles" CTA button
  - Add `loading="lazy"` to all `<img>` elements in the card template
  - Render badge overlay using localized badge string from i18n when `badge` is non-null
  - Show strikethrough original price + Effective_Price when discounted; single price otherwise
  - Render "No disponible" state and disable CTA when no available variants exist
  - Render placeholder with 📦 emoji and `no_image` i18n key when `imageUrls` is empty
  - Implement 3-second auto-advance image carousel with pause on hover
  - Add hover state styles in `assets/css/store.css`: `translateY` lift + border glow via CSS class toggle
  - Format all prices as `$N MXN` (rounded integer) — no decimals
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

  - [x] 8.1 Write property test for product card required fields and lazy images (Property 8)
    - **Property 8: Product card renders all required fields with lazy-loaded images**
    - Generate random product objects; assert rendered card contains localized title, price display, CTA button, and all `<img>` have `loading="lazy"`
    - **Validates: Requirements 5.1, 11.1**

  - [x] 8.2 Write property test for discounted price display (Property 6)
    - **Property 6: Discounted price display always shows both prices**
    - Generate variant objects with random price/effectivePrice pairs; assert rendered HTML contains both prices when `effectivePrice < price`, single price otherwise
    - **Validates: Requirements 5.3, 6.12**

  - [x] 8.3 Write property test for price format invariant (Property 11)
    - **Property 11: Price format invariant**
    - Generate random numeric price values; assert rendered string matches `/^\$\d+ MXN$/`
    - **Validates: Requirements 5.7**

- [x] 9. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement Product Detail Page
  - Add `renderProductDetail(id)` function in `assets/js/products.js`
  - Fetch `GET /api/v1/products/{id}`; render into `#spa-view`
  - Render: full-width image gallery with thumbnail navigation, `<h1>` localized title, full localized description, variant selector rows (checkbox + label + price + quantity stepper), total price display, "Agregar al carrito" button (disabled until variant selected)
  - Render disabled/muted variant rows for `isAvailable=false` or `inStock=false` with "Agotado"/"No disponible" label
  - Show file upload input when selected variant has `acceptsDesignFile=true`
  - On "Agregar al carrito" click: call `POST /api/v1/cart/items` for each selected variant; on success update cart badge and show success toast; on failure show error toast; user stays on page
  - Render breadcrumb: Home > [Category Name] > [Product Title] as SPA_Router links
  - Include "Back to catalog" link that calls `_spaNavigate('#home')` and restores scroll position
  - Show strikethrough original + highlighted Effective_Price for discounted variants
  - All strings use i18n keys — no hardcoded text
  - Responsive layout: image gallery stacks above variant selector on mobile (≤ 768px)
  - On fetch error, render error card with "Back to catalog" link
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10, 6.11, 6.12, 6.13, 6.14_

  - [x] 10.1 Write property test for variant selection controlling add-to-cart button (Property 9)
    - **Property 9: Variant selection controls add-to-cart button state**
    - Generate random variant selection states with mixed availability; assert button enabled iff at least one available (`isAvailable=true` and `inStock=true`) variant is selected
    - **Validates: Requirements 6.5**

- [x] 11. Implement Services Section as secondary content
  - Move the Services_Section below the Product_Grid in `index.html`
  - Preserve all existing service panels (Laser Engraving, UV Printing, 3D Printing, Laser Cutting, 3D Scanning, Photo Printing) with their media grids
  - Add a CTA button per service panel linking to the Product_Grid filtered by the corresponding category (via `_spaNavigate` + `filterByCategory`)
  - Preserve the existing materials widget (PLA, PETG, TPU, ABS, PA+CF tabs) within the 3D Printing panel
  - Ensure all text uses `data-translate` attributes bound to existing i18n keys
  - Add responsive stacking styles for viewports ≤ 768px in `assets/css/store.css`
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [x] 12. Implement Trust Signals, Social Proof, and Promotional Banner
  - Preserve the existing client logo carousel below the Services_Section
  - Add "Made in Mexico" trust badge in the hero or immediately below it using i18n key `trust_made_in_mexico`
  - Preserve the contact section (form, email, phone, business hours) using existing i18n keys
  - Ensure WhatsApp FAB is present and shows tooltip with `wa_subtitle` i18n key on hover
  - Ensure footer displays trademark notice using `footer_trademark` i18n key
  - Wire `promo-banner.js` to render the promo banner above the navbar; implement dismiss handler that hides the banner and updates `--promo-banner-height` CSS custom property; offset navbar by banner height while visible
  - Promo banner text uses i18n key `promo_banner_text`
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 14.1, 14.2, 14.3, 14.4_

- [x] 13. Apply Typography and Visual Standards across all new components
  - Verify all CSS in `assets/css/store.css` uses only CSS custom properties from `design-system.css` — no hardcoded hex values outside `:root` definitions
  - Verify no font size is smaller than `1rem` in any new CSS rule or JS-injected HTML
  - Verify all dynamic appearance changes use `classList.add/remove/toggle` — no `style="..."` attributes or `$(el).css(...)` for persistent styles
  - Verify dark theme base (`--color-bg-primary: #0a0e1a`) is maintained throughout all new sections
  - Verify gradient accents use `--color-gradient-brand`, `--color-gradient-uv`, or `--color-gradient-warm` CSS custom properties
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

- [x] 14. Implement Performance and Accessibility requirements
  - Add `loading="lazy"` to all product and category `<img>` elements (audit all new templates)
  - Add `preload="none"` and `data-lazy` to showcase panel `<video>` elements; implement IntersectionObserver to load them when visible
  - Add visible focus indicators for all interactive elements in `assets/css/store.css`
  - Ensure Product_Detail_Page is keyboard-navigable (Tab order, no focus traps)
  - Add descriptive `alt` attributes to all content images — no empty `alt=""` on content images
  - Wrap Category_Strip in `<section aria-label="...">` and use `<ul>/<li>` for cards; wrap Product_Grid in `<section>` with ARIA label; use `<article>` for Product_Card
  - Audit all new JS for any `console.log`, `console.warn`, or `console.error` calls and remove them
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8_

- [x] 15. Implement Cart and Guest Experience enhancements
  - Verify guest cart token cookie flow works with new Product_Detail_Page add-to-cart calls
  - Implement cart badge scale-pulse animation in `assets/css/store.css` triggered by JS class toggle when count increases
  - Ensure Cart_Drawer displays localized product title, variant label, unit price, quantity controls, remove button, and Design_File filename when present
  - Ensure Cart_Drawer shows localized empty-state message and CTA scrolling to Product_Grid when cart is empty
  - Verify cart merge flow triggers on login
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8_

- [x] 16. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- All new strings must be added to all 6 i18n files before any component that uses them is implemented
- Property tests use [fast-check](https://github.com/dubzzz/fast-check) with a minimum of 100 iterations per property
- Each property test file must include a comment: `// Feature: store-product-first-redesign, Property N: <property_text>`
- No inline styles, no hardcoded strings, no font sizes below `1rem` — enforced by frontend-standards.md
- The SPA shell (navbar + footer) must never reload during any navigation event
