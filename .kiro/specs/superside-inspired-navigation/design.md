# Design Document: Superside-Inspired Navigation

## Overview

This document describes the technical design for replacing Filamorfosis's existing navbar with a Superside-inspired mega menu navigation system. The implementation clones Superside's structural layout, interaction patterns, and animation behaviors while applying Filamorfosis brand identity (dark theme `#0a0e1a`, purple/pink gradients, Poppins font, vibrant neon accents).

The navigation introduces two new files — `assets/css/navigation.css` and `assets/js/navigation.js` — and modifies `index.html` and all six i18n language files. It integrates with the existing `window.FilamorfosisI18n` translation system, the existing `apiFetch` API client, and the existing FontAwesome icon library without introducing new dependencies.

### Key Design Decisions

- **Vanilla JS only**: No new framework dependencies. The module is an IIFE that exposes a minimal public API on `window.FilamorfosisNav`.
- **CSS-class-driven state**: All visual state changes (open/closed, loading, active) are driven by toggling CSS classes. No inline styles are ever set from JavaScript.
- **Single API fetch with in-memory cache**: Categories are fetched once on first Store_Menu open and cached in a module-level variable. Subsequent opens read from cache.
- **Separate files**: `navigation.css` and `navigation.js` are loaded after the existing CSS/JS to avoid conflicts. The existing `main.js` navbar toggle code is superseded by `navigation.js`.
- **Backward-compatible i18n**: New translation keys are added to all six language files. The existing `switchLanguage` function in `main.js` already iterates `[data-translate]` elements globally, so the new nav keys are picked up automatically.

---

## Architecture

The navigation system is organized as a single self-contained JavaScript module (`FilamorfosisNav`) with four internal sub-controllers:

```
FilamorfosisNav (window global)
├── MegaMenuController   — open/close/keyboard logic for desktop mega menus
├── MobileMenuController — hamburger open/close/accordion logic
├── CategoryService      — API fetch, cache, and render for Store_Menu
└── LangSwitcherNav      — integrates with existing window.switchLanguage
```

The CSS is organized in `navigation.css` with clearly delimited sections matching the component hierarchy.

### Component Hierarchy

```
<nav class="site-nav">                          ← fixed, z-index: var(--z-navbar)
  <div class="site-nav__inner">
    <a class="site-nav__logo">                  ← logo + brand name
    <ul class="site-nav__menu">                 ← desktop menu items
      <li class="site-nav__item site-nav__item--has-mega">
        <button class="site-nav__trigger">      ← Tienda / Servicios / Conócenos
        <div class="mega-menu">                 ← dropdown panel
          <div class="mega-menu__inner">
            <div class="mega-menu__col">        ← multi-column layout
    <div class="site-nav__actions">             ← lang switcher + cart + account
  <div class="site-nav__backdrop">              ← full-viewport overlay

<div class="mobile-nav">                        ← off-canvas panel (slide from left)
  <div class="mobile-nav__header">
  <ul class="mobile-nav__menu">
    <li class="mobile-nav__item mobile-nav__item--has-sub">
      <button class="mobile-nav__trigger">
      <ul class="mobile-nav__sub">              ← accordion submenu
  <div class="mobile-nav__footer">              ← lang switcher
<div class="mobile-nav__overlay">               ← tap-outside-to-close overlay
```

---

## Components and Interfaces

### 1. `<nav class="site-nav">` — Desktop Navigation Bar

The top-level `<nav>` element is always visible on desktop (≥768px). It contains three regions:

| Region | Selector | Content |
|---|---|---|
| Logo | `.site-nav__logo` | Circular logo image + "Filamorfosis" brand text |
| Menu | `.site-nav__menu` | 5 nav items: Tienda (mega), Servicios (mega), Conócenos (mega), FAQ (link), Contacto (link) |
| Actions | `.site-nav__actions` | Language switcher, cart icon with badge, account icon |

**Scroll behavior**: JavaScript adds `.site-nav--scrolled` when `window.scrollY > 50`, which triggers a CSS backdrop-filter blur and slightly reduced height.

### 2. Mega Menu Panels

Each mega menu is a `<div class="mega-menu">` child of its trigger `<li>`. The panel is hidden by default (`opacity: 0; pointer-events: none; transform: translateY(-8px)`) and becomes visible when the parent `<li>` receives the `.is-open` class.

**Tienda Mega Menu** — 3-column dynamic layout:
- Column 1: "Explorar Tienda" header + category list rendered from API
- Column 2: Featured subcategories (rendered from API data)
- Column 3: Static promotional card ("Desde 1 pieza")

**Servicios Mega Menu** — 2-column grid:
- 5 service cards, each with FontAwesome icon, title (data-translate), and description (data-translate)
- Services: Impresión 3D, Impresión UV, Corte Láser, Escaneo 3D, Impresión Fotográfica

**Conócenos Mega Menu** — 2-column layout:
- Column 1: Company links (Quiénes Somos, Misión y Valores, Nuestro Proceso, Blog)
- Column 2: Social proof card with client count and a testimonial snippet

### 3. `MegaMenuController`

```javascript
// Public interface
FilamorfosisNav.MegaMenuController = {
  open(triggerEl),    // opens the mega menu associated with triggerEl
  close(triggerEl),   // closes it
  closeAll(),         // closes all open mega menus
  init()              // attaches all event listeners
};
```

**Open/close logic**:
1. `open(triggerEl)`: adds `.is-open` to the parent `<li>`, sets `aria-expanded="true"` on the trigger button, shows the backdrop (`.site-nav__backdrop--visible`).
2. `close(triggerEl)`: removes `.is-open`, sets `aria-expanded="false"`, hides backdrop if no other menus are open.
3. `closeAll()`: iterates all `.site-nav__item--has-mega` and closes each.

**Hover intent**: A 100ms delay timer prevents accidental opens when the cursor passes through the nav bar. The timer is cleared on `mouseenter` and the menu opens only if the cursor dwells.

**Keyboard**: `Enter`/`Space` on a trigger opens the menu. `Escape` closes the active menu and returns focus to the trigger. `Tab` out of the last item in a mega menu closes it.

### 4. `MobileMenuController`

```javascript
FilamorfosisNav.MobileMenuController = {
  open(),    // slides in mobile panel, locks body scroll
  close(),   // slides out, restores scroll
  toggle(),  // used by hamburger button
  init()     // attaches event listeners
};
```

**Body scroll lock**: `open()` adds `.no-scroll` to `<body>` (CSS: `overflow: hidden`). `close()` removes it.

**Accordion**: Each `.mobile-nav__item--has-sub` trigger toggles `.is-expanded` on its parent `<li>`. CSS `max-height` transition animates the submenu open/close. Only one submenu can be open at a time (opening one closes others).

### 5. `CategoryService`

```javascript
FilamorfosisNav.CategoryService = {
  _cache: null,                    // null = not fetched, [] = empty, [...] = data
  _fetchPromise: null,             // deduplicates concurrent fetches
  async load(),                    // fetches or returns cache
  renderIntoMenu(categories),      // builds DOM nodes for Tienda mega menu
  buildCategoryUrl(slug)           // returns '/store.html?category={slug}'
};
```

**API endpoint**: `GET /api/v1/categories` (public endpoint — no auth required for reading categories).

**Cache strategy**: On first call to `load()`, a `fetch` is initiated and the promise is stored in `_fetchPromise`. Subsequent calls while the fetch is in-flight return the same promise. On resolution, `_cache` is populated. All future calls return `_cache` directly without a network request.

**Loading state**: While fetching, the Tienda mega menu shows a skeleton shimmer (`.skeleton` class from design-system.css). On success, the skeleton is replaced with rendered category nodes. On error, a fallback message with a retry button is shown.

**Timeout**: A `Promise.race` with a 3-second `setTimeout` rejection handles slow responses (Requirement 9.7).

### 6. `LangSwitcherNav`

The desktop language switcher inside `.site-nav__actions` reuses the same `window.switchLanguage` function from `main.js`. The nav's language button triggers `switchLanguage(lang)` which already handles updating all `[data-translate]` elements globally — including the new nav elements.

The mobile nav footer contains a compact language selector that calls the same function.

---

## Data Models

### Category API Response

`GET /api/v1/categories` returns an array of `CategoryDto` objects:

```typescript
interface CategoryDto {
  id: string;           // UUID
  name: string;         // Display name (e.g. "Impresión UV")
  slug: string;         // URL slug (e.g. "impresion-uv")
  description: string | null;
  icon: string | null;  // Emoji or FontAwesome class (e.g. "☕" or "fa-print")
  subCategories: SubCategoryDto[];
}

interface SubCategoryDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  parentCategoryId: string;
}
```

### Navigation State Model

The module maintains a lightweight state object:

```javascript
const _state = {
  activeMenu: null,        // Element | null — currently open mega menu trigger
  mobileOpen: false,       // boolean
  categoriesLoaded: false, // boolean — true after first successful API fetch
  lang: 'es'               // string — mirrors window.currentLang
};
```

### Translation Keys (new keys added to all 6 language files)

| Key | ES | EN |
|---|---|---|
| `nav_tienda` | `Tienda` | `Store` |
| `nav_servicios` | `Servicios` | `Services` |
| `nav_conocenos` | `Conócenos` | `About Us` |
| `nav_faq` | `Preguntas Frecuentes` | `FAQ` |
| `nav_contacto` | `Contacto` | `Contact` |
| `nav_mega_store_heading` | `Explorar Tienda` | `Explore Store` |
| `nav_mega_store_promo_title` | `Desde 1 pieza` | `From 1 piece` |
| `nav_mega_store_promo_desc` | `Sin mínimos. Sin excusas.` | `No minimums. No excuses.` |
| `nav_mega_store_cta` | `Ver todos los productos` | `View all products` |
| `nav_mega_store_loading` | `Cargando categorías...` | `Loading categories...` |
| `nav_mega_store_error` | `Error al cargar categorías` | `Error loading categories` |
| `nav_mega_store_retry` | `Reintentar` | `Retry` |
| `nav_mega_store_timeout` | `La carga tardó demasiado. Intenta de nuevo.` | `Loading took too long. Please retry.` |
| `nav_mega_services_heading` | `Nuestros Servicios` | `Our Services` |
| `nav_mega_svc_3d_title` | `Impresión 3D` | `3D Printing` |
| `nav_mega_svc_3d_desc` | `Multicolor y multimaterial` | `Multicolor and multimaterial` |
| `nav_mega_svc_uv_title` | `Impresión UV` | `UV Printing` |
| `nav_mega_svc_uv_desc` | `En tazas, madera, metal y más` | `On mugs, wood, metal and more` |
| `nav_mega_svc_laser_title` | `Corte Láser` | `Laser Cutting` |
| `nav_mega_svc_laser_desc` | `Precisión quirúrgica` | `Surgical precision` |
| `nav_mega_svc_scan_title` | `Escaneo 3D` | `3D Scanning` |
| `nav_mega_svc_scan_desc` | `Digitaliza cualquier objeto` | `Digitize any object` |
| `nav_mega_svc_photo_title` | `Impresión Fotográfica` | `Photo Printing` |
| `nav_mega_svc_photo_desc` | `Calidad profesional` | `Professional quality` |
| `nav_mega_about_heading` | `Conócenos` | `About Us` |
| `nav_mega_about_who` | `Quiénes Somos` | `Who We Are` |
| `nav_mega_about_mission` | `Misión y Valores` | `Mission & Values` |
| `nav_mega_about_process` | `Nuestro Proceso` | `Our Process` |
| `nav_mega_about_blog` | `Blog` | `Blog` |
| `nav_mega_about_clients_label` | `Clientes satisfechos` | `Happy clients` |
| `nav_mega_about_testimonial` | `"Calidad increíble y entrega rápida"` | `"Incredible quality and fast delivery"` |
| `nav_cart_label` | `Carrito` | `Cart` |
| `nav_account_label` | `Mi cuenta` | `My account` |
| `nav_open_menu` | `Abrir menú` | `Open menu` |
| `nav_close_menu` | `Cerrar menú` | `Close menu` |
| `nav_lang_label` | `Idioma` | `Language` |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

Before writing properties, redundancy is eliminated:

- Requirements 3.6 and 4.7 both test "translation system updates all menu text for any language" — these are combined into a single comprehensive translation property (Property 2).
- Requirements 8.1 and 8.2 both relate to the translation system — 8.1 (data-translate attributes exist) is a precondition for 8.2 (switching language updates text). They are kept separate because they test different things: structural presence vs. behavioral correctness.
- Requirements 2.3, 2.4, and 2.5 all test the category rendering function with different aspects. They can be combined into one comprehensive rendering property (Property 1).
- Requirements 6.7 (body scroll lock) and 9.3 (API cache) are independent universal properties and are kept separate.

### Property 1: Category rendering is complete and faithful

*For any* array of category objects (each with a name, icon, and array of subcategories), calling the `CategoryService.renderIntoMenu` function should produce HTML that contains every category name, every category icon, and every subcategory name, with each subcategory appearing within its parent category's container element.

**Validates: Requirements 2.3, 2.4, 2.5**

### Property 2: Language switching updates all navigation text

*For any* language code in the set `{es, en, de, pt, ja, zh}`, after calling `window.switchLanguage(lang)`, every element inside `.site-nav` and `.mobile-nav` that has a `data-translate` attribute should display the text value corresponding to that attribute's key in `window.FilamorfosisI18n[lang]`.

**Validates: Requirements 3.6, 4.7, 8.2**

### Property 3: All interactive nav elements have accessible names

*For any* interactive element (button or anchor) within `.site-nav` or `.mobile-nav`, the element should have a non-empty accessible name — either via `aria-label`, `aria-labelledby`, or non-whitespace text content.

**Validates: Requirements 7.4**

### Property 4: All static nav text elements carry data-translate attributes

*For any* element within `.site-nav` or `.mobile-nav` that renders user-visible static text (i.e., is not dynamically injected from the API), the element should have a `data-translate` or `data-t` attribute.

**Validates: Requirements 8.1**

### Property 5: Category API is fetched at most once

*For any* sequence of Store_Menu open/close operations (of length ≥ 1), the `fetch` function should be called exactly once for the categories endpoint, regardless of how many times the menu is opened after the first successful load.

**Validates: Requirements 9.3**

### Property 6: Body scroll is locked when and only when mobile menu is open

*For any* sequence of mobile menu open/close operations, `document.body` should have the `.no-scroll` class if and only if the mobile menu is currently open (i.e., `.mobile-nav` has the `.is-open` class).

**Validates: Requirements 6.7**

---

## Error Handling

### Category API Failures

| Scenario | Behavior |
|---|---|
| Network error / fetch rejects | Show `.mega-menu__error` message with retry button; log error to console (dev only — removed in production per coding standards) |
| HTTP error (non-2xx) | Same as network error |
| Timeout (>3 seconds) | `Promise.race` resolves with timeout error; show timeout-specific message with retry button |
| Empty array response | Render a "No hay categorías disponibles" message in the menu column |
| Retry | Clicking retry clears `_cache` and `_fetchPromise`, then calls `load()` again |

### Mega Menu Edge Cases

| Scenario | Behavior |
|---|---|
| Multiple menus triggered rapidly | `closeAll()` is called before opening a new menu; only one menu is ever open at a time |
| Hover leaves nav entirely | `mouseleave` on `.site-nav` calls `closeAll()` after a 150ms delay |
| Resize from mobile to desktop while mobile menu is open | `ResizeObserver` (or `resize` event) calls `MobileMenuController.close()` when viewport exceeds 768px |
| Escape key with no menu open | No-op |
| Tab past last mega menu item | Menu closes, focus moves to next element in document order |

### Translation Fallback

If a translation key is missing in the current language, the existing `switchLanguage` function in `main.js` already falls back to the Spanish value. The navigation module relies on this existing behavior.

---

## Testing Strategy

### Unit Tests (Example-Based)

Located in `assets/js/tests/navigation.test.js`. Use the existing test infrastructure.

- **Structural tests**: Assert logo, menu items, actions region exist in correct DOM order.
- **Menu item order**: Assert the 5 nav items appear in the specified sequence.
- **Mega menu open/close**: Simulate hover/click, assert `.is-open` class toggled and `aria-expanded` updated.
- **Backdrop visibility**: Open a mega menu, assert backdrop has `.site-nav__backdrop--visible`.
- **Mobile hamburger**: Simulate click, assert `.mobile-nav` has `.is-open`.
- **Mobile accordion**: Simulate tap on submenu trigger, assert submenu expands.
- **Escape key**: Open menu, dispatch `keydown` Escape, assert menu closes.
- **API loading state**: Mock fetch to delay, open Store_Menu, assert skeleton is visible.
- **API error state**: Mock fetch to reject, open Store_Menu, assert error message visible.
- **API timeout**: Mock fetch to never resolve, open Store_Menu, assert timeout message after 3s.
- **Retry**: After error, click retry, assert fetch called again.
- **Animation timing**: Assert CSS `transition-duration` on `.mega-menu` is `≤ 300ms`.
- **Responsive breakpoint**: Set `window.innerWidth = 600`, assert hamburger visible and desktop menu hidden.

### Property-Based Tests

Located in `assets/js/tests/property-tests/navigation.property.test.js`. Use **fast-check** (already the PBT library of choice for this project's JS tests).

Each property test runs a minimum of **100 iterations**.

**Property 1 — Category rendering completeness**
```
Tag: Feature: superside-inspired-navigation, Property 1: Category rendering is complete and faithful
```
Generator: `fc.array(fc.record({ name: fc.string(), icon: fc.string(), slug: fc.string(), subCategories: fc.array(fc.record({ name: fc.string(), icon: fc.string(), slug: fc.string() })) }))`
Assertion: For each generated categories array, call `CategoryService.renderIntoMenu(categories)`, get the resulting HTML string, and assert every `category.name`, `category.icon`, and every `sub.name` appears in the output.

**Property 2 — Language switching updates all nav text**
```
Tag: Feature: superside-inspired-navigation, Property 2: Language switching updates all navigation text
```
Generator: `fc.constantFrom('es', 'en', 'de', 'pt', 'ja', 'zh')`
Assertion: For each language code, call `window.switchLanguage(lang)`, then query all `[data-translate]` elements inside `.site-nav` and `.mobile-nav`, and for each assert that `element.textContent.trim() === window.FilamorfosisI18n[lang][element.dataset.translate]`.

**Property 3 — All interactive elements have accessible names**
```
Tag: Feature: superside-inspired-navigation, Property 3: All interactive nav elements have accessible names
```
Generator: No random input needed — this is a structural invariant. Run once against the rendered DOM.
Assertion: Query all `button, a` inside `.site-nav, .mobile-nav`. For each, assert `aria-label || aria-labelledby || element.textContent.trim()` is non-empty.
Note: While this is technically a single-example test, it is written as a property to document the invariant formally and to be re-run after any DOM change.

**Property 4 — All static text elements carry data-translate**
```
Tag: Feature: superside-inspired-navigation, Property 4: All static nav text elements carry data-translate attributes
```
Generator: No random input — structural invariant.
Assertion: Query all elements inside `.site-nav, .mobile-nav` that have non-empty `textContent` and are not dynamically injected (identified by absence of `.nav-category-item` class). Assert each has `data-translate` or `data-t` attribute.

**Property 5 — Category API fetched at most once**
```
Tag: Feature: superside-inspired-navigation, Property 5: Category API is fetched at most once
```
Generator: `fc.integer({ min: 1, max: 20 })` — number of times to open/close the Store_Menu after initial load.
Assertion: Mock `fetch`. Call `CategoryService.load()` once (populates cache). Then call `CategoryService.load()` N more times. Assert `fetch` was called exactly once total.

**Property 6 — Body scroll locked iff mobile menu open**
```
Tag: Feature: superside-inspired-navigation, Property 6: Body scroll is locked when and only when mobile menu is open
```
Generator: `fc.array(fc.constantFrom('open', 'close'), { minLength: 1, maxLength: 30 })` — sequence of operations.
Assertion: For each operation sequence, simulate open/close calls on `MobileMenuController`. After each operation, assert `document.body.classList.contains('no-scroll') === _state.mobileOpen`.
