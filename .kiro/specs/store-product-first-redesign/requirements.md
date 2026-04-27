# Requirements Document

## Introduction

Filamorfosis® is a Mexican 3D printing, UV printing, and laser cutting business. The current `index.html` page leads with a services/brochure experience — the hero section promotes personalized services, and the product catalog is a secondary section. This redesign inverts that priority: **products become the primary content** and services become supporting context.

The goal is a stunning, conversion-optimized online store homepage that:
- Puts the product catalog front and center, powered by the existing `/api/v1/products` and `/api/v1/categories` APIs
- Showcases categories (UV Printing, 3D Printing, Laser Cutting, Laser Engraving, Photo Printing) as visual entry points
- Preserves the existing dark neon aesthetic, hero video banners, multilingual support, and all cart/checkout/store functionality
- Delivers a desktop and mobile experience that drives add-to-cart actions from the very first scroll

The backend data model exposes: `Product` (titleEs/En, descriptionEs/En, imageUrls[], badge, tags[], variants[]), `ProductVariant` (labelEs, price, effectivePrice, discounts[], attributes[], isAvailable, inStock, acceptsDesignFile), `Category` (slug, nameEs/En, imageUrl, productCount), and `Cart` (guest + authenticated, merge on login).

---

## Glossary

- **Store**: The Filamorfosis® online storefront — the redesigned `index.html` (store/products) and `services.html` (personalized services) pages
- **SPA_Shell**: The persistent HTML wrapper containing the top navbar and footer, shared across all SPA views without reloading
- **SPA_Router**: The client-side routing mechanism that updates the browser URL hash and swaps visible content sections without full page reloads
- **Catalog_SPA**: The single-page application embedded in the page that fetches and renders products from the API
- **Hero_Section**: The full-viewport banner at the top of the page with video background
- **Category_Strip**: A horizontally scrollable row of category cards shown immediately below the hero
- **Product_Grid**: The responsive grid of product cards rendered by the Catalog_SPA
- **Product_Card**: A single card in the Product_Grid representing one product
- **Product_Detail_Page**: The full SPA view rendered at `/#product-{id}` showing complete product information, variant selection, and add-to-cart functionality within the persistent SPA shell
- **Product_Detail_Route**: The SPA hash route pattern `/#product-{id}` where `{id}` is the numeric or slug product identifier returned by the API
- **Services_Section**: The section showcasing Filamorfosis® service capabilities (3D printing, UV, laser, etc.)
- **Cart_Drawer**: The slide-in panel showing cart contents, accessible from the navbar cart icon
- **Badge**: A product label — one of `hot`, `new`, `promo`, `popular`, or null — returned by the API
- **Variant**: A purchasable configuration of a product (size, color, material) with its own price and stock
- **i18n_File**: A language-specific translation file at `assets/js/i18n/lang.{code}.js`
- **Design_File**: A user-uploaded file (artwork, logo) attached to a cart item when `acceptsDesignFile` is true
- **Effective_Price**: The final price after applying active discounts, computed by the API as `effectivePrice`
- **CDN_Base**: The `window.FILAMORFOSIS_CDN_BASE` constant used to resolve S3 image keys to full URLs
- **Nav_Shell**: The top navbar element that persists across all SPA views — never reloads or disappears during navigation
- **Profile_Menu**: The dropdown menu in the navbar containing the "Gestión de perfil" submenu item and "Cerrar sesión" logout item
- **Cart_Icon**: The visually enhanced cart icon in the navbar — larger and more prominent than the current icon, with a glowing badge — that opens the Cart_Drawer without changing add/remove/count functionality

---

## Requirements

### Requirement 0: SPA Architecture

**User Story:** As a user, I want the website to feel like a seamless app — navigating between the store and services without full page reloads — so that the experience is fast and the navbar and footer are always present.

#### Acceptance Criteria

1. THE Store SHALL be implemented as a Single Page Application: the store/products content SHALL reside in `index.html` and the personalized services content SHALL reside in `services.html`, with the SPA_Shell (navbar + footer) persisting across both
2. THE Nav_Shell and footer SHALL never reload or disappear during any navigation event — they are permanent shell elements rendered once on initial page load
3. WHEN a user navigates between views, THE SPA_Router SHALL load the target content section dynamically without triggering a full page reload
4. WHEN a user navigates to a view, THE SPA_Router SHALL update the browser URL hash to reflect the current view (e.g. `/#home`, `/#services`, `/#faq`, `/#contact`, `/#about`)
5. WHEN a user loads a deep link URL directly (e.g. navigating to `/#services` or `/#faq`), THE SPA_Router SHALL render the correct content section on initial load
6. THE SPA_Router SHALL support at minimum these named routes: `home` (store/products), `services` (personalized services), `contact`, `faq`, `about`
7. THE SPA_Router SHALL support the `product` route: WHEN a user navigates to `/#product-{id}`, THE SPA_Router SHALL fetch product details from `GET /api/v1/products/{id}` and render the Product_Detail_Page within the SPA shell (navbar and footer remain visible)
8. WHEN a user navigates to `/#product-{id}`, THE SPA_Router SHALL update the browser URL hash to `/#product-{id}` and render the Product_Detail_Page without a full page reload
9. WHEN a user navigates back (browser back button or a "Back to catalog" nav link), THE SPA_Router SHALL return to the previous view (e.g. `/#home`) and restore the Product_Grid scroll position
10. WHEN the browser back/forward buttons are used, THE SPA_Router SHALL navigate to the corresponding view by listening to the `hashchange` event
11. IF a user navigates to an unknown hash route, THEN THE SPA_Router SHALL fall back to the `home` (store/products) view

---

### Requirement 1: Product-First Hero Section

**User Story:** As a visitor, I want to see a visually stunning hero that immediately communicates what Filamorfosis® sells, so that I am motivated to browse and buy products right away.

#### Acceptance Criteria

1. THE Hero_Section SHALL display a full-viewport video background using the existing crossfade loop mechanism
2. WHEN the page loads, THE Hero_Section SHALL render a headline, a subheadline, and a primary CTA button that scrolls to the Product_Grid
3. THE Hero_Section SHALL include a secondary CTA button that scrolls to the Services_Section
4. THE Hero_Section SHALL display a trust bar below the CTA buttons showing at least 3 value propositions (e.g., "Hecho en México", "1 pieza mínima", "Envío rápido") using i18n keys
5. ALL text content in the Hero_Section SHALL use `data-translate` or `data-t` attributes — no hardcoded strings in HTML
6. THE Hero_Section SHALL be fully responsive: on viewports narrower than 768px, CTA buttons SHALL stack vertically and the trust bar SHALL wrap to two rows
7. WHEN a user clicks the primary CTA, THE Store SHALL scroll smoothly to the Category_Strip or Product_Grid section

---

### Requirement 2: Category Strip

**User Story:** As a shopper, I want to see all product categories at a glance right after the hero, so that I can immediately navigate to the type of product I want.

#### Acceptance Criteria

1. WHEN the page loads, THE Catalog_SPA SHALL fetch categories from `GET /api/v1/categories` and render the Category_Strip
2. THE Category_Strip SHALL display one card per active category, showing the category image (from `imageUrl`), the localized name (`nameEs` or `nameEn` based on current language), and the product count
3. WHEN a category has no `imageUrl`, THE Category_Strip SHALL display a gradient placeholder with the category icon
4. WHEN a user clicks a category card, THE Catalog_SPA SHALL filter the Product_Grid to show only products from that category
5. THE Category_Strip SHALL be horizontally scrollable on mobile viewports (max-width 768px) with scroll-snap behavior
6. THE active category card SHALL have a visually distinct highlighted state (border or glow accent)
7. ALL category name strings SHALL be resolved from the current language using `nameEs` / `nameEn` fields — no hardcoded category names in JS or HTML
8. IF the `GET /api/v1/categories` request fails, THEN THE Catalog_SPA SHALL display the Product_Grid without category filtering and log the error

---

### Requirement 3: Featured Products Showcase

**User Story:** As a shopper, I want to see highlighted products (new arrivals, popular items, promotions) prominently displayed before the full catalog, so that I can discover the best products without scrolling through everything.

#### Acceptance Criteria

1. WHEN the page loads, THE Catalog_SPA SHALL fetch products with `badge=hot` from `GET /api/v1/products` and render a "Featured" horizontal carousel
2. WHEN the page loads, THE Catalog_SPA SHALL fetch products with `badge=new` from `GET /api/v1/products` and render a "New Arrivals" row
3. WHEN a featured section returns zero products, THE Catalog_SPA SHALL hide that section entirely — no empty containers
4. THE featured carousel SHALL auto-scroll with a 4-second interval and pause on hover
5. WHEN a user clicks a featured product card, THE SPA_Router SHALL navigate to `/#product-{id}` and render the Product_Detail_Page
6. THE featured product cards SHALL display: product image, localized title, Effective_Price (with strikethrough original price when discounted), and the Badge label
7. ALL badge label strings (`badge_hot`, `badge_new`, `badge_promo`, `badge_popular`) SHALL be resolved from the active i18n_File

---

### Requirement 4: Full Product Grid with Filtering

**User Story:** As a shopper, I want to browse all available products with search and filter capabilities, so that I can find exactly what I need.

#### Acceptance Criteria

1. THE Catalog_SPA SHALL fetch products from `GET /api/v1/products` with pagination (`page`, `pageSize=20`) and render them in the Product_Grid
2. WHEN a user types in the search input, THE Catalog_SPA SHALL debounce the input by 300ms and then fetch from `GET /api/v1/products?search={query}`
3. THE Product_Grid SHALL support filter chips for: All, Popular (badge=hot), New (badge=new), Gifts, Business, Budget, Premium, Decor, Drinkware — using the existing `CURATED_FILTERS` configuration
4. WHEN a user selects a filter chip, THE Catalog_SPA SHALL apply the filter and re-render the Product_Grid without a full page reload
5. WHEN the total product count exceeds `pageSize`, THE Catalog_SPA SHALL display a "Load More" button that appends the next page to the existing grid
6. THE Product_Grid SHALL render skeleton loading cards while the API request is in flight
7. IF the `GET /api/v1/products` request fails, THEN THE Catalog_SPA SHALL display an error state with a retry button
8. WHEN the filtered result set is empty, THE Catalog_SPA SHALL display a localized empty-state message using the `empty_text` i18n key

---

### Requirement 5: Product Card Design

**User Story:** As a shopper, I want each product card to be visually compelling and informative, so that I can quickly assess whether a product interests me.

#### Acceptance Criteria

1. THE Product_Card SHALL display: product image carousel (with arrow navigation and dot indicators when multiple images exist), localized title, localized description excerpt (max 2 lines), category label, starting price (Effective_Price of the cheapest available Variant), and a "Ver detalles" CTA button that navigates to `/#product-{id}`
2. WHEN a product has a Badge, THE Product_Card SHALL display the badge as an overlay on the product image using the localized badge string
3. WHEN a product has an active discount, THE Product_Card SHALL display both the original price (struck through) and the Effective_Price
4. WHEN a product has no available variants, THE Product_Card SHALL display a "No disponible" state and disable the CTA button
5. WHEN a product has no images, THE Product_Card SHALL display a styled placeholder with the 📦 emoji and the `no_image` i18n key
6. THE Product_Card image carousel SHALL auto-advance every 3 seconds and pause on hover
7. ALL price values SHALL be displayed in MXN with the `$` prefix and rounded to the nearest integer
8. THE Product_Card SHALL have a hover state with a subtle lift animation (translateY) and border glow — implemented via CSS class toggle, no inline styles

---

### Requirement 6: Product Detail Page — Variant Selection and Add to Cart

**User Story:** As a shopper, I want to open a dedicated product page, select my desired variant(s), and add them to my cart, so that I can view full product details and purchase without losing the store context.

#### Acceptance Criteria

1. WHEN a user clicks a Product_Card, THE SPA_Router SHALL navigate to `/#product-{id}` and render the Product_Detail_Page — no modal overlay
2. THE Product_Detail_Page SHALL display within the SPA shell (navbar and footer always visible)
3. THE Product_Detail_Page SHALL display: full-width product image gallery with thumbnail navigation, localized title (h1), localized full description, all Variants with their labels, prices, and availability status, quantity selector, and "Agregar al carrito" button
4. WHEN a Variant has `isAvailable = false` or `inStock = false`, THE Product_Detail_Page SHALL render that Variant as disabled and visually distinct (muted color, "Agotado" or "No disponible" label)
5. WHEN a user selects one or more available Variants, THE Product_Detail_Page SHALL enable the "Agregar al carrito" button and display the total price
6. WHEN a Variant has `acceptsDesignFile = true` and the user selects it, THE Product_Detail_Page SHALL display a file upload input for the Design_File
7. WHEN a user clicks "Agregar al carrito", THE SPA SHALL call `POST /api/v1/cart/items` for each selected Variant with the specified quantity
8. WHEN the add-to-cart request succeeds, THE SPA SHALL update the cart badge count in the navbar and display a success toast notification — the user remains on the Product_Detail_Page
9. IF the add-to-cart request fails, THEN THE SPA SHALL display an error toast — the user remains on the Product_Detail_Page
10. THE Product_Detail_Page SHALL include a breadcrumb navigation: Home > [Category Name] > [Product Title], where each breadcrumb item is a SPA_Router link
11. THE Product_Detail_Page SHALL include a "Back to catalog" link that navigates to `/#home` and restores the Product_Grid scroll position
12. WHEN a Variant has an active discount, THE Product_Detail_Page SHALL display the original price struck through and the Effective_Price highlighted in the accent color
13. ALL strings on the Product_Detail_Page (button labels, status labels, section headers, breadcrumb labels) SHALL use i18n keys — no hardcoded strings
14. THE Product_Detail_Page SHALL be fully responsive: on mobile viewports (max-width 768px), the image gallery SHALL stack above the variant selector

---

### Requirement 7: Services Section (Secondary Content)

**User Story:** As a visitor who wants a custom job, I want to learn about Filamorfosis® services after seeing the products, so that I can request a personalized quote.

#### Acceptance Criteria

1. THE Services_Section SHALL appear below the Product_Grid in the page layout — not above it
2. THE Services_Section SHALL preserve the existing service showcase panels (Laser Engraving, UV Printing, 3D Printing, Laser Cutting, 3D Scanning, Photo Printing) with their media grids
3. THE Services_Section SHALL include a CTA button per service panel that links back to the Product_Grid filtered by the corresponding category
4. THE Services_Section SHALL preserve the existing materials widget (PLA, PETG, TPU, ABS, PA+CF tabs) within the 3D Printing panel
5. ALL text in the Services_Section SHALL use `data-translate` attributes bound to existing i18n keys — no new hardcoded strings
6. THE Services_Section SHALL be fully responsive: on viewports narrower than 768px, service panels SHALL stack vertically

---

### Requirement 8: Navigation and Page Structure

**User Story:** As a user, I want the navigation to reflect the product-first structure so that I can jump directly to products, services, or my cart from anywhere on the page.

#### Acceptance Criteria

1. THE Nav_Shell SHALL list navigation items in this exact left-to-right order: Home (Tienda) | Personalized Services (Servicios Personalizados) | Contact (Contáctanos) | FAQ (Preguntas Frecuentes) | About Us (Quiénes Somos) | Cart_Icon | Profile_Menu | Language Selector
2. WHEN a user clicks the "Home (Tienda)" nav link, THE SPA_Router SHALL navigate to the store/products view (index.html or `/#home`)
3. WHEN a user clicks the "Personalized Services" nav link, THE SPA_Router SHALL navigate to the services view (services.html or `/#services`) without a full page reload
4. THE Cart_Icon SHALL be visually enhanced — larger and more prominent than the standard icon — with a glowing badge that displays the current cart item count; the add/remove/count functionality SHALL remain unchanged
5. WHEN the cart count is zero, THE Cart_Icon badge SHALL be hidden
6. THE Profile_Menu SHALL be a dropdown containing two items: "Gestión de perfil" (profile management) and "Cerrar sesión" (logout); each item SHALL use a `data-translate` attribute with keys `nav_profile_manage` and `nav_logout` respectively
7. THE Language Selector SHALL remain the last item in the navbar, accessible in both desktop and mobile layouts
8. THE Nav_Shell SHALL remain fixed at the top of the viewport while scrolling, with a backdrop-blur effect on scroll
9. ON mobile viewports (max-width 992px), THE Nav_Shell SHALL collapse into a hamburger menu that includes all nav items: Home, Personalized Services, Contact, FAQ, About Us, Cart_Icon, Profile_Menu, and Language Selector
10. ALL nav link labels SHALL use `data-translate` attributes with i18n keys `nav_home`, `nav_services`, `nav_contact`, `nav_faq`, `nav_about`, `nav_profile`, `nav_logout`, and `nav_profile_manage` — no hardcoded text

---

### Requirement 9: Multilingual Support

**User Story:** As a non-Spanish-speaking visitor, I want the entire store to be available in my language, so that I can shop comfortably.

#### Acceptance Criteria

1. THE Store SHALL support 6 languages: Spanish (es), English (en), German (de), Portuguese (pt), Japanese (ja), Chinese (zh)
2. WHEN a user switches language, THE Store SHALL update all `data-translate` and `data-t` elements, re-render the Category_Strip with localized category names, and re-render the Product_Grid with localized product titles and descriptions
3. THE Store SHALL persist the selected language in `localStorage` under the key `preferredLanguage` and restore it on page load
4. EVERY new i18n key introduced by this redesign SHALL be added to all 6 i18n_Files (`lang.es.js`, `lang.en.js`, `lang.de.js`, `lang.pt.js`, `lang.ja.js`, `lang.zh.js`)
5. THE i18n_Files SHALL follow the existing pattern: `window.FilamorfosisI18n['{code}'] = { ... }` — no other pattern is acceptable
6. IF a translation key is missing in the active language, THE Store SHALL fall back to the Spanish (`es`) value
7. ALL user-visible strings introduced in new HTML, JS-rendered HTML, and CSS-generated content SHALL use i18n keys — no hardcoded text in any language

---

### Requirement 10: Typography and Visual Standards

**User Story:** As a user, I want the store to be visually polished and readable on all devices, so that I have a premium shopping experience.

#### Acceptance Criteria

1. THE Store SHALL use Poppins for headings and Roboto for body text, loaded from Google Fonts
2. NO font size in the Store SHALL be smaller than `1rem` (16px at default browser settings) — this applies to all CSS files, JS-injected HTML, and any dynamically generated content
3. THE Store SHALL use the design system color palette defined in `assets/css/design-system.css` — no hardcoded hex values outside of CSS custom property definitions
4. ALL styling SHALL reside in CSS files under `assets/css/` — no `style="..."` attributes in HTML, no `$(el).css(...)` calls for persistent styles in JS
5. THE Store SHALL use CSS class toggling (`classList.add/remove/toggle`) for all dynamic appearance changes
6. THE Store SHALL maintain the dark theme base (`--color-bg-primary: #0a0e1a`) throughout all sections
7. WHEN a section uses gradient accents, THE Store SHALL use the CSS custom properties `--color-gradient-brand`, `--color-gradient-uv`, or `--color-gradient-warm` — no inline gradient strings

---

### Requirement 11: Performance and Accessibility

**User Story:** As a user on a mobile device or slow connection, I want the store to load quickly and be usable with assistive technologies, so that I can shop without frustration.

#### Acceptance Criteria

1. THE Store SHALL lazy-load all product images using the `loading="lazy"` attribute on `<img>` elements
2. THE Store SHALL lazy-load showcase panel videos using `preload="none"` and a `data-lazy` attribute, loading them only when the panel becomes visible
3. THE Product_Grid skeleton loading state SHALL appear within 100ms of a fetch being initiated
4. ALL interactive elements (buttons, links, inputs) SHALL have visible focus indicators meeting WCAG 2.1 AA contrast requirements
5. THE Product_Detail_Page SHALL be keyboard-navigable: Tab cycles through interactive elements, and all interactive controls are reachable without a mouse
6. ALL images SHALL have descriptive `alt` attributes — no empty `alt=""` on content images
7. THE Category_Strip and Product_Grid SHALL use semantic HTML (`<section>`, `<article>`, `<ul>/<li>` where appropriate) with ARIA labels
8. THE Store SHALL not produce any `console.log`, `console.warn`, or `console.error` calls in production code

---

### Requirement 12: Cart and Guest Experience

**User Story:** As a guest shopper, I want to add products to my cart and have my cart preserved when I log in, so that I don't lose my selections.

#### Acceptance Criteria

1. THE Store SHALL support guest cart functionality using the `guest_cart_token` cookie managed by the backend
2. WHEN a guest user adds a product to the cart, THE Catalog_SPA SHALL call `POST /api/v1/cart/items` and update the cart badge count
3. WHEN a guest user logs in, THE Store SHALL trigger the cart merge flow so that guest cart items are transferred to the authenticated cart
4. THE Cart_Drawer SHALL display all cart items with product title (localized), variant label, unit price, quantity controls, and a remove button
5. WHEN a cart item has a Design_File attached, THE Cart_Drawer SHALL display the filename
6. THE Cart_Drawer SHALL display the cart total in MXN
7. WHEN the cart is empty, THE Cart_Drawer SHALL display a localized empty-state message and a CTA button that scrolls to the Product_Grid
8. THE cart item count badge SHALL animate (scale pulse) when the count increases

---

### Requirement 13: Social Proof and Trust Signals

**User Story:** As a first-time visitor, I want to see evidence that Filamorfosis® is a trustworthy business, so that I feel confident making a purchase.

#### Acceptance Criteria

1. THE Store SHALL display a clients/logos section below the Services_Section, preserving the existing client logo carousel
2. THE Store SHALL display a "Made in Mexico" / "Producción en México" trust badge in the hero or immediately below it
3. THE Store SHALL display a contact section with a form, email, phone, and business hours — using existing i18n keys
4. THE Store SHALL include a WhatsApp floating action button (FAB) that opens a pre-filled WhatsApp chat
5. WHEN a user hovers over the WhatsApp FAB, THE Store SHALL display a tooltip with the `wa_subtitle` i18n key
6. THE Store footer SHALL display the Filamorfosis® trademark notice using the `footer_trademark` i18n key

---

### Requirement 14: Promotional Banner

**User Story:** As a store operator, I want to display a dismissible promotional banner at the top of the page, so that I can communicate time-sensitive offers to visitors.

#### Acceptance Criteria

1. THE Store SHALL render a promo banner above the navbar using the existing `promo-banner.js` mechanism
2. WHEN a user dismisses the promo banner, THE Store SHALL hide it and adjust the navbar top offset via the `--promo-banner-height` CSS custom property
3. THE promo banner text SHALL use i18n keys — no hardcoded promotional copy in HTML
4. WHILE the promo banner is visible, THE navbar SHALL be offset downward by the banner height so content is not obscured
