# Implementation Plan: UX Enhancements

## Overview

This plan converts the UX Enhancements design into incremental coding tasks. Each task builds on the previous one — foundational CSS tokens and shared modules first, then page-level components, then integration and testing. All tasks target the existing vanilla HTML/CSS/JS stack with no framework introduction.

The implementation language is **JavaScript (ES2020+)** for modules and **CSS3** for styles, consistent with the existing stack.

---

## Tasks

### Phase 1 — Foundation

- [x] 1. Create `assets/css/design-system.css` — design tokens and shared component classes
  - [x] 1.1 Define all CSS custom properties in `:root`: full color palette (`--color-bg-primary` through `--color-error`), brand gradients (`--color-gradient-brand`, `--color-gradient-uv`, `--color-gradient-warm`), typography scale (`--font-size-xs` through `--font-size-hero`), font-weight scale (`--font-weight-regular` through `--font-weight-extrabold`), line-height tokens, spacing scale (`--space-xs` through `--space-4xl`), border-radius tokens, shadow tokens (including glow variants), z-index scale (`--z-promo-banner` through `--z-dropdown`), transition tokens, and breakpoint reference variables
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1_
  - [x] 1.2 Write shared `.btn-primary`, `.btn-secondary`, and `.btn-ghost` component classes with consistent padding (`12px 24px`), border-radius (`var(--radius-md)`), font-weight (`var(--font-weight-semibold)`), hover/active transforms, and `:focus-visible` outlines using `--color-accent-purple`
    - _Requirements: 1.7, 11.2_
  - [x] 1.3 Write shared `.card` component class with `background: var(--color-bg-surface)`, `border: 1px solid var(--color-border)`, `border-radius: var(--radius-lg)`, and `padding: var(--space-lg)`
    - _Requirements: 1.8_
  - [x] 1.4 Write `.skeleton` shimmer animation class using `background-size: 200% 100%` and `@keyframes skeleton-shimmer` (no layout-triggering properties)
    - _Requirements: 3.10_
  - [x] 1.5 Write `.badge` base class and semantic variants: `.badge-success`, `.badge-warning`, `.badge-error`, `.badge-purple`, `.badge-hot`, `.badge-new`
    - _Requirements: 10.6_
  - [x] 1.6 Write all animation keyframes: `badge-pulse`, `toast-in`, `toast-out` (desktop and mobile variants), `drawer-in`, `nav-drawer-in`, `wa-pulse`, `timeline-fill`, `slide-down`; all animations MUST use only `transform` and `opacity`
    - _Requirements: 4.11, 4.1, 2.2, 9.5, 7.15_
  - [x] 1.7 Write unit test: parse `design-system.css` and assert all required token groups (`--color-*`, `--font-size-*`, `--space-*`, `--radius-*`, `--z-*`) are defined and non-empty
    - _Requirements: 1.9, 1.10_

- [x] 2. Create `assets/js/toast.js` — singleton toast notification module
  - [x] 2.1 Implement the toast container: inject a `<div role="status" aria-live="polite" aria-atomic="false">` ARIA live region into `<body>` on first call; position it `fixed` top-right on desktop and top-center on mobile using `--z-toast`
    - _Requirements: 4.1, 4.2, 11.6_
  - [x] 2.2 Implement `Toast.show({ message, type, thumbnail, duration })`: create a toast element with product name, optional thumbnail, type class (`toast--success`, `toast--error`, `toast--info`), and a close button (×); apply `toast-in` animation on entry
    - _Requirements: 4.1, 4.2_
  - [x] 2.3 Implement auto-dismiss after `duration` ms (default 3000ms) using `setTimeout`; apply `toast--leaving` animation before removal; implement manual close button that triggers the same exit animation
    - _Requirements: 4.2_
  - [x] 2.4 Implement FIFO queue: if a toast is already visible, enqueue subsequent toasts and show each one only after the previous has been dismissed or expired; expose `Toast.show()` as the public API
    - _Requirements: 4.1, 4.2_
  - [x] 2.5 Write property test for Property 2: Toast queue FIFO ordering — for any sequence of N toasts enqueued in order, assert display and dismissal order matches enqueue order
    - **Property 2: Toast queue FIFO ordering**
    - **Validates: Requirements 4.1, 4.2**

- [x] 3. Create `assets/js/whatsapp-fab.js` — shared WhatsApp FAB module
  - [x] 3.1 Implement `initWhatsAppFAB()`: inject the FAB HTML into `<body>` — circular button (56×56px), green background (`#25d366`), FontAwesome `fa-whatsapp` icon, `.whatsapp-fab__ring` pulse element, `aria-label` in current language, `position: fixed; bottom: 24px; right: 24px; z-index: var(--z-fab)`
    - _Requirements: 9.1, 9.2, 9.3, 9.6, 9.8_
  - [x] 3.2 Implement `getLang()` helper (reads `window.currentLang` → `localStorage.preferredLanguage` → `document.documentElement.lang` → `'es'`); build the `wa.me/13152071586` URL with the pre-filled message in the detected language for all 6 languages (ES, EN, DE, PT, JA, ZH); open in new tab on click
    - _Requirements: 9.4_
  - [x] 3.3 Apply mobile override: on viewports ≤ 768px set `bottom: 80px` via a CSS media query inside the injected `<style>` block or via `design-system.css`
    - _Requirements: 9.7_
  - [x] 3.4 Write unit test: verify FAB is injected into DOM, `aria-label` matches current language, and click opens correct `wa.me` URL with language-appropriate message
    - _Requirements: 9.4, 9.8_

- [x] 4. Create `assets/js/cookie-consent.js` — cookie consent banner module
  - [x] 4.1 Implement `initCookieConsent()`: on load, read `localStorage.filamorfosis_cookie_consent`; if a stored choice exists, skip rendering; if unavailable (private browsing), catch the exception and render the banner on every load without throwing
    - _Requirements: 13.1, 13.3, 13.14_
  - [x] 4.2 Inject banner HTML: `role="dialog"`, `aria-modal="false"`, `aria-label` in current language, full-width on mobile / centered card (max-width 720px) on desktop, `position: fixed; bottom: 0; z-index` above all content except modals; style with `background: rgba(10,14,26,0.97)`, `border-top: 1px solid rgba(255,255,255,0.1)`, buttons using `.btn-primary` / `.btn-secondary`
    - _Requirements: 13.2, 13.10, 13.11_
  - [x] 4.3 Implement "Aceptar todo" button: store `{ essential: true, analytics: true, marketing: true, timestamp: ISO8601 }` to `localStorage.filamorfosis_cookie_consent` and remove banner from DOM
    - _Requirements: 13.4, 13.5_
  - [x] 4.4 Implement "Solo esenciales" button: store `{ essential: true, analytics: false, marketing: false, timestamp: ISO8601 }` and remove banner
    - _Requirements: 13.4, 13.6_
  - [x] 4.5 Implement "Personalizar" panel: expand inline toggle panel with three switches — "Esenciales" (permanently checked, non-interactive), "Analíticas", "Marketing"; "Guardar preferencias" button stores the resulting object and removes banner
    - _Requirements: 13.7_
  - [x] 4.6 Bundle `COOKIE_I18N` object with all 6 language strings (ES, EN, DE, PT, JA, ZH) inside the module; render all visible text from this object based on `getLang()`; include "Política de privacidad" link to `#privacy-policy`
    - _Requirements: 13.8, 13.9_
  - [x] 4.7 Implement keyboard focus trap: while banner is visible, Tab and Shift+Tab cycle only within banner interactive elements; all buttons are keyboard-focusable and operable via Enter and Space; visible focus indicators meet WCAG AA contrast
    - _Requirements: 13.4, 13.12, 13.13_
  - [x] 4.8 Write property test for Property 3: Cookie consent persistence round-trip — for any consent choice, storing then re-initializing the module SHALL result in banner not shown and stored object exactly matching the choice
    - **Property 3: Cookie consent persistence round-trip**
    - **Validates: Requirements 13.3, 13.5, 13.6, 13.7**
  - [x] 4.9 Write property test for Property 8: Cookie consent language follows active language — for any language in `{es, en, de, pt, ja, zh}`, every visible banner string SHALL match `COOKIE_I18N[lang]` with no cross-language leakage
    - **Property 8: Cookie consent language follows active language**
    - **Validates: Requirements 13.8**

- [x] 5. Create `assets/js/promo-banner.js` — dismissible promotional banner module
  - [x] 5.1 Implement `initPromoBanner()`: check `sessionStorage.promo_dismissed`; if set, skip rendering; inject banner HTML with `role="banner"`, `aria-label`, `position: fixed; top: 0; z-index: var(--z-promo-banner)`, configurable message text from i18n key `promo.message`
    - _Requirements: 10.5_
  - [x] 5.2 Implement close button: on click, set `sessionStorage.promo_dismissed = '1'`, animate banner out, remove from DOM; update `--promo-banner-height` CSS variable on `<html>` so the navbar shifts down correctly when banner is visible
    - _Requirements: 10.5_
  - [x] 5.3 Write unit test: verify banner is not rendered when `sessionStorage.promo_dismissed` is set; verify sessionStorage key is set and banner removed after close click
    - _Requirements: 10.5_


- [x] 6. Checkpoint — Foundation complete
  - Ensure `design-system.css` loads without errors on all pages, `toast.js` queues correctly, `whatsapp-fab.js` injects on all pages, `cookie-consent.js` persists choices, and `promo-banner.js` dismisses correctly. Ask the user if questions arise.

---

### Phase 2 — Navigation and Layout

- [x] 7. Navbar responsive redesign — sticky, scroll blur, hamburger drawer, cart badge animation
  - [x] 7.1 Update `main.css` to add `@import 'design-system.css'` as the first line; replace all hard-coded color values (`#0a0e1a`, `#94a3b8`, `rgba(255,255,255,0.07)`, etc.) in navbar rules with the corresponding design tokens
    - _Requirements: 1.9, 2.4_
  - [x] 7.2 Make the navbar `position: sticky; top: 0; z-index: var(--z-navbar)`; when `--promo-banner-height` is set, adjust `top` accordingly; ensure it appears above all page content
    - _Requirements: 2.4_
  - [x] 7.3 Add scroll listener in `main.js`: after 80px scroll, add `.navbar--scrolled` class that applies `backdrop-filter: blur(12px)` and increased background opacity; remove class when scrolled back to top
    - _Requirements: 2.6_
  - [x] 7.4 Add hamburger menu button (visible on ≤ 768px): clicking it injects/shows a full-height side drawer (`nav-drawer`) from the left containing all nav links, language switcher, cart icon with badge, and login/logout action; apply `nav-drawer-in` animation
    - _Requirements: 2.2_
  - [x] 7.5 Implement drawer backdrop: semi-transparent overlay behind the drawer; clicking backdrop closes the drawer; while drawer is open, set `document.body.style.overflow = 'hidden'` to prevent body scroll; restore on close
    - _Requirements: 2.3_
  - [x] 7.6 Implement cart badge pulse: in `cart.js`, after every cart item count increase, add `.cart-badge--pulse` class to the badge element, then remove it after 300ms to trigger the `badge-pulse` keyframe; ensure badge always shows current count (even 0)
    - _Requirements: 4.11, 15.13_
  - [x] 7.7 Write integration test: verify `.navbar--scrolled` class is added after simulated scroll > 80px; verify drawer opens/closes and `overflow: hidden` is toggled on body; verify `.cart-badge--pulse` is added when count increases
    - _Requirements: 2.2, 2.3, 2.6, 4.11_

- [x] 8. Responsive breakpoint audit and fixes across all pages
  - [x] 8.1 Audit `main.css`, `products.css`, and `store.css` for any `max-width` media queries that conflict with the mobile-first approach; convert to `min-width` queries where needed; ensure all new media queries reference `--bp-mobile` (480px), `--bp-tablet` (768px), `--bp-desktop` (1024px) values
    - _Requirements: 2.1, 2.7_
  - [x] 8.2 Fix product catalog grid in `products.css`: use `display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr))` with overrides — 1 column on ≤ 480px, 2 columns on 481–768px, 3–4 columns on ≥ 769px
    - _Requirements: 2.8_
  - [x] 8.3 Fix checkout layout in `store.css`: stack order summary below shipping form on mobile; apply 60/40 side-by-side split on desktop using CSS Grid or Flexbox
    - _Requirements: 2.9_
  - [x] 8.4 Fix cart drawer width: `width: 100%` on mobile (≤ 768px), `width: 420px` on desktop
    - _Requirements: 2.10_
  - [x] 8.5 Audit all interactive elements across all pages: ensure minimum tap target size of 44×44px on touch devices; add `min-height: 44px; min-width: 44px` to buttons, links, and form controls where needed
    - _Requirements: 2.11_
  - [x] 8.6 Test all pages at 320px, 480px, 768px, and 1280px viewport widths; fix any horizontal overflow (no horizontal scrollbars at any breakpoint)
    - _Requirements: 2.12_


---

### Phase 3 — Product Catalog

- [x] 9. Product card redesign — remove add-to-cart, skeleton, badges, lazy image
  - [x] 9.1 In `products.js`, update the card render function: remove the "Agregar al carrito" button from the card surface; replace it with a single "Ver detalles" `btn-secondary` button that opens the product detail modal
    - _Requirements: 3.1, 3.2_
  - [x] 9.2 Add skeleton loading: while product data is being fetched, render N skeleton card placeholders using the `.skeleton` class for the image area, title, and button; replace with real cards once data resolves
    - _Requirements: 3.10_
  - [x] 9.3 Add "Agotado" badge and "Notificarme" button: when all variants have `isAvailable = false`, render a `.badge-error` "Agotado" badge on the card and replace "Ver detalles" with a disabled "Notificarme" button (no backend action)
    - _Requirements: 3.11_
  - [x] 9.4 Add lazy image loading: set `loading="lazy"` on all product card images; when no image URL is available, render a branded placeholder `<div>` with the product emoji and category accent color
    - _Requirements: 3.12, 11.7_
  - [x] 9.5 Add "Más vendido" (`.badge-hot`) badge on products tagged `hot` and "Nuevo" (`.badge-new`) badge on products tagged `new`; add star rating badge showing average rating, or "Nuevo" text if no rating exists
    - _Requirements: 10.6, 15.4_
  - [x] 9.6 Add urgency signal: when `stockQuantity ≤ 5`, render a `.badge-warning` "¡Solo quedan X en stock!" badge on the card using `--color-warning`
    - _Requirements: 10.2_
  - [x] 9.7 Write property test for Property 9: Urgency signal threshold invariant — for any `stockQuantity` value, assert badge is shown iff `stockQuantity ∈ [0, 5]` and never shown when `stockQuantity > 5`
    - **Property 9: Urgency signal threshold invariant**
    - **Validates: Requirements 10.2**

- [x] 10. Product detail modal redesign — gallery, variant selector, design upload zone, social proof, related products, share button, collapsed specs
  - [x] 10.1 Implement image gallery: render a large main image and a thumbnail strip below it; on thumbnail click, update the main image with a 200ms CSS cross-fade (`transition: opacity 0.2s`); add `loading="lazy"` on all gallery images; display 3–5 images per product
    - _Requirements: 3.7, 14.12_
  - [x] 10.2 Implement Variant Selector: render pill-shaped toggle buttons (one per variant) showing variant label; on selection, apply highlighted border and background using `--color-accent-purple`; disable "Agregar al carrito" button until a variant is selected
    - _Requirements: 3.4, 3.5_
  - [x] 10.3 Implement real-time price update: on variant pill selection, update the displayed price to exactly match `variant.price`; never show a price from a different variant
    - _Requirements: 3.6_
  - [x] 10.4 Implement Design Upload Zone (shown when selected variant accepts a design file): dashed-border drop area, upload icon, "Sube tu diseño aquí" bold label, "Arrastra tu imagen o haz clic para seleccionar" sub-label, format/size info ("PNG, JPG, SVG, PDF · Máx. 20 MB"); support drag-and-drop and click-to-browse
    - _Requirements: 8.1, 8.2, 8.3_
  - [x] 10.5 Implement design file preview: on valid PNG/JPG selection, use `FileReader` API to render a 120×120px thumbnail within 200ms (no server round-trip); for SVG/PDF, show a file icon with the file name; for files > 20MB or unsupported types, show inline error and clear the input
    - _Requirements: 8.4, 8.5, 8.6_
  - [x] 10.6 Add advisory message below "Agregar al carrito" when a design-accepting variant is selected but no file has been uploaded: "Recuerda subir tu diseño antes de finalizar tu compra" (non-blocking, does not disable the button)
    - _Requirements: 8.7_
  - [x] 10.7 Add social proof indicator below product title: "🔥 X personas han pedido esto este mes" using static or API-driven count; add star rating summary (average + review count, static per product)
    - _Requirements: 10.1, 15.3_
  - [x] 10.8 Add urgency signal badge in modal: same threshold logic as card (stockQuantity ≤ 5 → show badge); add "¿Necesitas ayuda?" collapsible section below primary CTA containing WhatsApp and quote links (remove these as standalone CTAs)
    - _Requirements: 3.3, 10.2_
  - [x] 10.9 Add "Clientes también compraron" related products strip: 3–4 product cards from the same category rendered as a horizontal scroll strip; clicking a card opens that product's modal
    - _Requirements: 3.3, 10.3, 14.16_
  - [x] 10.10 Add "Compartir" button: on click, copy the product URL to clipboard and show a "¡Enlace copiado!" Toast using `toast.js`
    - _Requirements: 10.11_
  - [x] 10.11 Add collapsed specs section: wrap all technical specification rows in a `<details>` element labeled "Especificaciones técnicas"; collapsed by default; add Return Policy Badge with link to `#return-policy`; add video placeholder `<video>` element for products tagged `has-video` (no autoplay, with `controls` and `aria-label`)
    - _Requirements: 14.13, 14.14, 14.15_
  - [x] 10.12 Implement modal accessibility: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to modal title; trap keyboard focus within modal while open; close on Escape key press
    - _Requirements: 3.9, 11.5_
  - [x] 10.13 Write property test for Property 5: Variant selector price update correctness — for any product with ≥ 2 variants with distinct prices, selecting each pill SHALL update displayed price to exactly that variant's price
    - **Property 5: Variant selector price update correctness**
    - **Validates: Requirements 3.6**

- [x] 11. Create `assets/js/search-autocomplete.js` — fuzzy-match search autocomplete
  - [x] 11.1 Attach to `#catSearch` input on `products.html`; on `input` event (debounced 150ms), run fuzzy match against `window.PRODUCTS`; normalize accents using `str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')` before comparison; match via `includes()` for substring and Levenshtein distance ≤ 2 for strings of length ≥ 4
    - _Requirements: 14.2, 14.3_
  - [x] 11.2 Render dropdown `<ul role="listbox">` below the search input with up to 8 `<li role="option">` items, each showing product thumbnail (32×32px, `loading="lazy"`), product name, and category label; apply `--z-dropdown` z-index
    - _Requirements: 14.2_
  - [x] 11.3 Implement keyboard navigation: `ArrowDown`/`ArrowUp` move focus between items; `Enter` on an item opens the product modal; `Escape` closes the dropdown; update `aria-activedescendant` on the input to track focused item
    - _Requirements: 14.2, 11.1_
  - [x] 11.4 Implement no-results state: show "No encontramos resultados para '[term]'" message; if Levenshtein distance ≤ 3 to any product name, show "¿Quisiste decir [suggestion]?" correction link; show "Ver todos los productos" CTA and 4 best-seller product cards
    - _Requirements: 14.4_
  - [x] 11.5 Style the search bar with `border: 2px solid var(--color-accent-purple)`, `min-width: 280px` on desktop; ensure it is the first focusable element in the catalog section
    - _Requirements: 14.1_
  - [x] 11.6 Write property test for Property 6: Search autocomplete result relevance — for any query of length ≥ 2 and any catalog, every suggestion SHALL contain the normalized query as substring OR have Levenshtein distance ≤ 2; result count SHALL never exceed 8
    - **Property 6: Search autocomplete result relevance**
    - **Validates: Requirements 14.2, 14.3**


- [x] 12. Checkpoint — Product catalog complete
  - Ensure product cards render skeletons, badges, and lazy images correctly; variant selector updates price; design upload zone previews files; search autocomplete returns relevant results. Ask the user if questions arise.

---

### Phase 4 — Cart Experience

- [x] 13. Mini Cart drawer redesign — slide-out, quantity stepper, trust badges, design upload indicator, empty state
  - [x] 13.1 In `cart.js`, update the Mini Cart drawer HTML: apply `drawer-in` slide animation; render each CartItem with product thumbnail, product name, variant label, unit price, quantity stepper (− / count / +), and a trash icon remove button; use `.card` class for the drawer panel
    - _Requirements: 4.4_
  - [x] 13.2 Implement quantity stepper logic: clicking + increments quantity and calls the cart update API; clicking − decrements; when quantity reaches 0, remove the item from the cart and show a "Artículo eliminado" Toast via `toast.js`
    - _Requirements: 4.7, 4.12_
  - [x] 13.3 Implement auto-open-on-add behavior: when a variant is added to cart, open the Mini Cart drawer for 2 seconds then auto-close; if the user interacts with the drawer during those 2 seconds, cancel the auto-close and keep it open until manually closed
    - _Requirements: 4.3_
  - [x] 13.4 Add "Seguir comprando" link at the top of the drawer that closes it without navigating away; add cart subtotal row, shipping note ("Calculado al confirmar"), and full-width "Proceder al pago" `.btn-primary` button at the bottom
    - _Requirements: 4.5, 4.8_
  - [x] 13.5 Add Trust Badge strip above the "Proceder al pago" button: "Pago seguro", "Producción garantizada", "Soporte 24/7" as small icon+label pairs using the trust-badges component HTML
    - _Requirements: 15.9_
  - [x] 13.6 Add design upload indicator: for CartItems where the variant accepts a design file and no file has been uploaded, show a highlighted "⚠ Sube tu diseño" prompt with an upload icon next to that item
    - _Requirements: 4.13, 8.8_
  - [x] 13.7 Implement empty state: when cart has no items, show an illustrated empty state with "Tu carrito está vacío" message and a "Ver productos" `.btn-secondary` CTA button
    - _Requirements: 4.6_
  - [x] 13.8 Implement add-to-cart Toast: within 300ms of API response, call `Toast.show()` with product name, variant label, and thumbnail; position top-right on desktop, top-center on mobile
    - _Requirements: 4.1, 4.2_
  - [x] 13.9 Write property test for Property 1: Cart total rendering accuracy — for any cart state with arbitrary unit prices and quantities, assert rendered total equals `Σ(unitPrice × quantity)` for all items
    - **Property 1: Cart total rendering accuracy**
    - **Validates: Requirements 4.12**
  - [x] 13.10 Write property test for Property 4: Cart badge count accuracy — for any cart state, assert badge number equals `Σ quantity` across all items; assert this holds after every add/remove/update mutation
    - **Property 4: Cart badge count accuracy**
    - **Validates: Requirements 4.11, 15.13**


---

### Phase 5 — Checkout

- [x] 14. Checkout page redesign — progress indicator, inline validation, autofill, guest checkout, coupon field, "what happens next" panel, payment logos, estimated delivery, conversational labels
  - [x] 14.1 Add Progress Indicator at the top of `checkout.html`: three steps "Carrito → Envío → Pago"; highlight current step; show checkmark on completed steps; implement as a `<ol>` with CSS step connector lines
    - _Requirements: 5.1_
  - [x] 14.2 Update all form field labels to conversational text: "¿A dónde enviamos tu pedido?" (shipping address), "¿Alguna nota para nosotros?" (order notes), "¡Listo! Pagar con MercadoPago" (pay button); add `autocomplete` attributes: `given-name`, `family-name`, `email`, `tel`, `street-address`, `address-level2`, `address-level1`, `postal-code`, `country-name`
    - _Requirements: 5.14, 5.19_
  - [x] 14.3 Implement inline field validation: on each field's `input` event, validate the value and show a green checkmark (✓) when valid or a descriptive hint when incomplete; do NOT wait for form submission; associate each hint with its field via `aria-describedby`
    - _Requirements: 5.13_
  - [x] 14.4 Add order summary panel: each CartItem with thumbnail, name, variant label, quantity, and line total; subtotal row; shipping row ("Calculado al confirmar"); grand total in larger font; estimated delivery date range ("Entrega estimada: 5–8 días hábiles") as a static range
    - _Requirements: 5.2, 5.17_
  - [x] 14.5 Add Design Preview: for CartItems with an associated Design_File, show the design thumbnail next to the item and a composite preview labeled "Vista previa de tu diseño"; for items with a design-accepting variant but no file uploaded, show the Design Upload Zone inline
    - _Requirements: 5.3, 5.4, 5.9_
  - [x] 14.6 Add Coupon Code field below the subtotal: text input + "Aplicar" button; on click, show Toast "Código aplicado — descuento disponible próximamente" without any API call
    - _Requirements: 5.18_
  - [x] 14.7 Implement "¿Qué pasa ahora?" panel: when the pay button is clicked, show a panel listing the 3 steps before the MercadoPago redirect; disable the button and show "Procesando..." spinner during this phase to prevent double submission
    - _Requirements: 5.9, 5.15_
  - [x] 14.8 Add Trust Badges below the payment button: "Pago 100% seguro" (lock icon), "Datos protegidos" (shield icon), "Calidad garantizada" (star icon); add payment method logos (MercadoPago, Visa, Mastercard, OXXO, bank transfer) as small badge icons with `alt` attributes; add Return Policy Badge linking to `#return-policy`
    - _Requirements: 5.11, 5.20, 5.21, 15.7_
  - [x] 14.9 Implement Guest Checkout option: show "Continuar como invitado" button for unauthenticated users; allow checkout completion without account creation
    - _Requirements: 5.16_
  - [x] 14.10 Implement empty cart redirect: if `checkout.html` loads with an empty cart, redirect to `products.html` and show a Toast "Tu carrito está vacío. Agrega productos primero."
    - _Requirements: 5.10_
  - [x] 14.11 Add `beforeunload` listener on `checkout.html`: if cart has items and user attempts to navigate away, show browser confirmation dialog "¿Seguro que quieres salir? Tu carrito se guardará."
    - _Requirements: 10.8_
  - [x] 14.12 Write unit test: verify redirect to `products.html` when cart is empty on checkout load; verify "Procesando..." spinner appears and button is disabled on pay click; verify coupon Toast shown without API call
    - _Requirements: 5.9, 5.10, 5.18_


- [x] 15. Checkpoint — Cart and Checkout complete
  - Ensure Mini Cart renders correctly with trust badges and design indicators; checkout progress indicator, inline validation, and payment flow work end-to-end. Ask the user if questions arise.

---

### Phase 6 — Order Confirmation

- [x] 16. Order confirmation page redesign — confetti, rewards placeholder, social share, guest upsell, failure/pending states
  - [x] 16.1 Implement success state: when `status=success`, initialize Particles.js with confetti config (120 particles, brand colors, downward direction, 3s duration); destroy after 3000ms via `setTimeout`; render full-viewport hero background with brand gradient overlay
    - _Requirements: 6.1, 6.10_
  - [x] 16.2 Render success heading with gradient text effect (matching brand gradient), congratulatory message in current language, and order ID; render order summary card with each OrderItem (thumbnail, name, variant, quantity, line total), shipping address, and grand total
    - _Requirements: 6.2, 6.3_
  - [x] 16.3 Add design thumbnail next to OrderItems that have an associated Design_File
    - _Requirements: 6.4_
  - [x] 16.4 Add Rewards Placeholder card: "¡Ganaste puntos por esta compra! 🎉 Próximamente podrás canjearlos por descuentos." styled as a highlighted `.card` with a star/trophy icon; no backend integration
    - _Requirements: 6.5_
  - [x] 16.5 Add two CTA buttons: "Ver mis pedidos" (linking to `account.html#orders`) and "Seguir comprando" (linking to catalog)
    - _Requirements: 6.6_
  - [x] 16.6 Add social sharing section: pre-filled share text "¡Acabo de hacer un pedido en Filamorfosis®! 🚀"; WhatsApp share button (opens `wa.me` with pre-filled text); copy-link button (copies current URL to clipboard and shows "¡Enlace copiado!" Toast)
    - _Requirements: 6.9_
  - [x] 16.7 Implement failure state: when `status=failure`, render error heading, clear explanation, "Reintentar pago" button that re-initiates the payment flow for the same order, and a WhatsApp support link
    - _Requirements: 6.7_
  - [x] 16.8 Implement pending state: when `status=pending`, render animated spinner, explanation that payment is being processed, and estimated confirmation time
    - _Requirements: 6.8_
  - [x] 16.9 Add guest upsell prompt for guest checkouts: "¿Quieres guardar tu pedido? Crea una cuenta gratis." with a "Crear cuenta" CTA button
    - _Requirements: 5.16_

---

### Phase 7 — User Profile and Orders

- [x] 17. Account page redesign — animated canvas background, floating-label inputs, avatar, tab redesign
  - [x] 17.1 Add `<canvas id="account-bg-canvas">` to the `account.html` header area; implement the inline canvas animation (8 bezier curve lines, `rgba(139,92,246,0.12)` stroke, `requestAnimationFrame` loop, wrap-around boundary) without any new JS library
    - _Requirements: 7.1_
  - [x] 17.2 Render profile header: user's full name in a large gradient-text heading, email in muted text, circular avatar placeholder with user's initials rendered in the brand gradient; add "Cerrar sesión" ghost button in the top-right of the header area
    - _Requirements: 7.2, 7.11_
  - [x] 17.3 Implement three-tab layout ("Perfil", "Direcciones", "Mis pedidos") using the same tab component style as the admin panel: active tab underline in `--color-accent-purple`; add breadcrumb `<nav aria-label="Breadcrumb">` with `<ol>` markup above the tabs
    - _Requirements: 7.3, 11.13_
  - [x] 17.4 Convert profile form fields (first name, last name, phone) to floating-label inputs: label animates upward and shrinks on focus or when field has a value; label uses `--color-accent-purple` on focus; implement via CSS `.float-field__input` / `.float-field__label` pattern
    - _Requirements: 7.4_
  - [x] 17.5 Add inline validation on profile form fields: show green checkmark or red error message next to each field as the user types; on successful form submission, call `Toast.show()` with "✓ Perfil actualizado" instead of plain text
    - _Requirements: 7.5, 7.6_
  - [x] 17.6 Implement addresses tab: render each saved address as a `.card` with location pin icon, full address text, "Predeterminada" badge for default address, and delete button; add "Agregar dirección" button that triggers a `slide-down` animated inline form (300ms) rather than a `<details>` element
    - _Requirements: 7.7, 7.8_
  - [x] 17.7 Implement unauthenticated redirect: if `account.html` loads without a valid auth token, show the login modal immediately and redirect to the profile page after successful authentication
    - _Requirements: 7.12_

- [x] 18. Enhanced order history — timeline, search/filter, reorder, invoice placeholder, expandable cards, estimated delivery
  - [x] 18.1 Render orders tab: each order as an expandable `.card` showing truncated order ID, creation date formatted in user's locale, grand total in MXN, color-coded status badge, and expand/collapse toggle; show loading skeleton (animated shimmer rows) while fetching; show illustrated empty state with "Aún no tienes pedidos" and "Ver productos" CTA when no orders exist
    - _Requirements: 7.9, 7.10, 12.1, 12.10, 12.11_
  - [x] 18.2 Implement Order Timeline inside expanded card: horizontal step sequence `Paid → InProduction → Shipped → Delivered`; completed steps filled with `--color-accent-purple` and `timeline-fill` animation; current step active; future steps muted; show timestamp for each completed step if available from API
    - _Requirements: 7.15, 12.2_
  - [x] 18.3 Render expanded card detail: each OrderItem with product thumbnail, product name, variant label, quantity, and line total; visually separate active orders from completed orders with a labeled section divider (active first)
    - _Requirements: 7.16, 12.3, 12.6_
  - [x] 18.4 Add search input at the top of the orders tab: filter displayed orders when user types ≥ 2 characters, matching order ID or any OrderItem product name (case-insensitive); update list without page reload; show "No encontramos pedidos con ese criterio" when filter/search returns nothing
    - _Requirements: 7.13, 12.4, 12.12_
  - [x] 18.5 Add status filter tabs/dropdown: "Todos", "Activos" (Pending, PendingPayment, Paid, InProduction, Shipped), "Completados" (Delivered, Cancelled, PaymentFailed); update list without page reload; visually distinguish active vs. completed using labeled section divider
    - _Requirements: 7.14, 12.5, 12.6_
  - [x] 18.6 Add estimated delivery display: for orders with status `InProduction` or `Shipped`, show "Entrega estimada: [date range]" next to the status badge using a static 5–8 business day range from order creation date
    - _Requirements: 7.19, 12.7_
  - [x] 18.7 Implement "Volver a pedir" button on `Delivered` order cards: add all available OrderItems to cart and open Mini Cart drawer; skip unavailable variants (`isAvailable = false`) and show a Toast listing skipped product names
    - _Requirements: 7.17, 12.8_
  - [x] 18.8 Add "Descargar factura" placeholder button on `Paid`/`Shipped`/`Delivered` order cards: on click, show Toast "Facturas disponibles próximamente — te avisaremos cuando estén listas." without any API call
    - _Requirements: 7.18, 12.9_
  - [x] 18.9 Write property test for Property 7: Order timeline step ordering — for any order status in `{Paid, InProduction, Shipped, Delivered}`, assert all preceding steps are marked completed, current step is active, subsequent steps are muted, and sequence is always `Paid → InProduction → Shipped → Delivered`
    - **Property 7: Order timeline step ordering**
    - **Validates: Requirements 12.2, 7.15**
  - [x] 18.10 Write property test for Property 10: Reorder skips unavailable variants — for any completed order with a mix of available and unavailable variants, assert exactly the available variants are added to cart (preserving quantity), no unavailable variant is added, and a Toast lists all skipped names
    - **Property 10: Reorder skips unavailable variants**
    - **Validates: Requirements 7.17, 12.8**

- [x] 19. Checkpoint — Profile and Orders complete
  - Ensure canvas animation renders, floating-label inputs animate correctly, order timeline fills in the right order, search/filter updates without page reload, and reorder skips unavailable variants. Ask the user if questions arise.


---

### Phase 8 — Homepage Enhancements

- [x] 20. Homepage marketing additions — brand story, reviews, trust badges, certifications, promo banner, hero CTA enhancements
  - [x] 20.1 Add `<link rel="stylesheet" href="assets/css/design-system.css">` as the first stylesheet in `index.html`; add script tags for `promo-banner.js`, `whatsapp-fab.js`, and `cookie-consent.js` in the correct load order (after `store-i18n.js`, deferred)
    - _Requirements: 1.9, 9.1, 13.1_
  - [x] 20.2 Add Brand Story section to `index.html` after the services section: two-column grid with narrative text (Filamorfosis® founding, mission, services), brand tagline "Tus Ideas. Tu Realidad.", "Conoce nuestra historia" `.btn-ghost` link scrolling to the section, and a Lifestyle_Image with descriptive `alt` text
    - _Requirements: 15.1, 15.11_
  - [x] 20.3 Add Customer Reviews section: at least 3 `.review-card.card` elements each with star rating (`aria-label="X de 5 estrellas"`), review text, reviewer first name + initial, and product reviewed; data is static
    - _Requirements: 15.2_
  - [x] 20.4 Add certifications and badges section: "Producción en México" badge, "Materiales certificados" badge, "Satisfacción garantizada" badge — each with a FontAwesome icon and short label; add "Mencionados en" placeholder section with 3–5 grayscale logo slots and "Próximamente" overlay
    - _Requirements: 15.5, 15.6_
  - [x] 20.5 Enhance hero section: add live or static product count counter ("Más de 50 productos disponibles"), "Comprar ahora" CTA button linking to catalog, and brand storytelling tagline; ensure hero carousel is replaced with a manually-scrollable strip on mobile (≤ 768px)
    - _Requirements: 10.9, 14.10, 14.11_
  - [x] 20.6 Add multi-channel customer service links to the site footer: WhatsApp link, `mailto:` email link, and Instagram external link — each with a FontAwesome icon, label, and `aria-label`
    - _Requirements: 15.8_
  - [x] 20.7 Add unique `<meta name="description">` and `<title>` tags to `index.html`, `products.html`, `checkout.html`, `order-confirmation.html`, and `account.html` following the pattern "[Page Name] — Filamorfosis® | Impresión 3D, UV y Láser en México"
    - _Requirements: 10.10_
  - [x] 20.8 Add `products.html` enhancements: breadcrumb `<nav aria-label="Breadcrumb">` with `<ol>` markup; category description paragraph below the category tab strip; "Más vendidos" and "Nuevos" curated collection tabs; "Recientemente visto" horizontal strip at the bottom (last 4 viewed products from `sessionStorage`); add promo banner, WhatsApp FAB, cookie consent, and `search-autocomplete.js` script tags
    - _Requirements: 10.7, 11.13, 14.7, 14.8, 14.12_

---

### Phase 9 — i18n and Translation Keys

- [x] 21. Add all new translation keys to `store-i18n.js` for all 6 languages
  - [x] 21.1 Add Toast/notification keys to all 6 language objects: `toast.added`, `toast.removed`, `toast.profileSaved`, `toast.linkCopied`, `toast.invoiceSoon`, `toast.couponApplied`, `toast.cartEmpty`, `toast.reorderSkipped`
    - _Requirements: 4.1, 4.7, 7.6, 10.11, 7.18, 5.18, 5.10, 7.17_
  - [x] 21.2 Add Mini Cart keys: `cart.continueShopping`, `cart.designWarn`, `cart.emptyTitle`, `cart.emptyAction`; add Trust Badge keys: `trust.secure`, `trust.quality`, `trust.support`, `trust.ssl`
    - _Requirements: 4.5, 4.6, 4.8, 4.13, 15.9_
  - [x] 21.3 Add Checkout enhancement keys: `checkout.progress.cart`, `checkout.progress.shipping`, `checkout.progress.payment`, `checkout.addressQuestion`, `checkout.notesQuestion`, `checkout.payBtn`, `checkout.coupon`, `checkout.couponApply`, `checkout.whatsNext`, `checkout.whatsNext1`, `checkout.whatsNext2`, `checkout.whatsNext3`, `checkout.estimatedDelivery`, `checkout.guestBtn`, `checkout.returnPolicy`
    - _Requirements: 5.1, 5.14, 5.15, 5.17, 5.18, 5.19, 5.21_
  - [x] 21.4 Add Order Confirmation keys: `confirmation.rewards`, `confirmation.share`, `confirmation.shareBtn`, `confirmation.copyLink`, `confirmation.guestUpsell`, `confirmation.createAccount`
    - _Requirements: 6.5, 6.9, 5.16_
  - [x] 21.5 Add Account/Orders keys: `account.logout`, `account.reorder`, `account.invoice`, `account.searchOrders`, `account.filterAll`, `account.filterActive`, `account.filterDone`, `account.noOrdersTitle`, `account.noOrdersFilter`, `account.noOrdersCta`, `account.estimatedDelivery`, `account.addAddress`, `account.defaultBadge`; add Order Timeline keys: `timeline.paid`, `timeline.inProduction`, `timeline.shipped`, `timeline.delivered`
    - _Requirements: 7.11, 7.13, 7.17, 7.18, 7.19, 12.7, 12.8, 12.9, 12.11, 12.12_
  - [x] 21.6 Add WhatsApp FAB keys: `whatsapp.ariaLabel`, `whatsapp.message` (for all 6 languages); add Promo Banner keys: `promo.message`, `promo.close`; add Search Autocomplete keys: `search.noResults`, `search.didYouMean`, `search.viewAll`, `search.popular`
    - _Requirements: 9.4, 9.8, 10.5, 14.4_
  - [x] 21.7 Add Product Modal enhancement keys: `modal.socialProof`, `modal.urgency`, `modal.urgencyEnd`, `modal.share`, `modal.helpSection`, `modal.relatedTitle`, `modal.fbtTitle`, `modal.specsTitle`, `modal.videoSoon`, `modal.returnPolicy`; add Design Upload keys: `design.title`, `design.sub`, `design.formats`, `design.howTitle`, `design.howText`, `design.advisory`, `design.errorSize`, `design.errorType`
    - _Requirements: 8.2, 8.6, 10.1, 10.2, 10.3, 10.11, 14.13, 14.14, 14.15_
  - [x] 21.8 Add Brand Story and Reviews keys: `brandStory.title`, `brandStory.learnMore`, `reviews.title`; verify all `data-t` attributes in new HTML snippets reference a key that exists in all 6 language objects
    - _Requirements: 15.1, 15.2_


---

### Phase 10 — Testing

- [x] 22. Property-based tests for all 10 correctness properties (fast-check)
  - [x] 22.1 Write property test for Property 1: Cart total rendering accuracy — generate arbitrary arrays of `{ unitPrice: number, quantity: number }` items; assert rendered total equals `Σ(unitPrice × quantity)`
    - **Property 1: Cart total rendering accuracy**
    - **Validates: Requirements 4.12**
  - [x] 22.2 Write property test for Property 2: Toast queue FIFO ordering — generate arbitrary sequences of N toast messages; assert display and dismissal order matches enqueue order
    - **Property 2: Toast queue FIFO ordering**
    - **Validates: Requirements 4.1, 4.2**
  - [x] 22.3 Write property test for Property 3: Cookie consent persistence round-trip — generate arbitrary consent combinations; assert re-initialization skips banner and stored object exactly matches the choice
    - **Property 3: Cookie consent persistence round-trip**
    - **Validates: Requirements 13.3, 13.5, 13.6, 13.7**
  - [x] 22.4 Write property test for Property 4: Cart badge count accuracy — generate arbitrary cart states; assert badge number equals `Σ quantity` after every mutation
    - **Property 4: Cart badge count accuracy**
    - **Validates: Requirements 4.11, 15.13**
  - [x] 22.5 Write property test for Property 5: Variant selector price update correctness — generate products with ≥ 2 variants with distinct prices; assert selecting each pill updates displayed price to exactly that variant's price
    - **Property 5: Variant selector price update correctness**
    - **Validates: Requirements 3.6**
  - [x] 22.6 Write property test for Property 6: Search autocomplete result relevance — generate arbitrary queries and catalogs; assert every suggestion matches substring or Levenshtein ≤ 2; assert count ≤ 8
    - **Property 6: Search autocomplete result relevance**
    - **Validates: Requirements 14.2, 14.3**
  - [x] 22.7 Write property test for Property 7: Order timeline step ordering — generate arbitrary order statuses from `{Paid, InProduction, Shipped, Delivered}`; assert preceding steps are completed, current is active, subsequent are muted, sequence is always `Paid → InProduction → Shipped → Delivered`
    - **Property 7: Order timeline step ordering**
    - **Validates: Requirements 12.2, 7.15**
  - [x] 22.8 Write property test for Property 8: Cookie consent language follows active language — for each language in `{es, en, de, pt, ja, zh}`, assert every visible banner string matches `COOKIE_I18N[lang]` with no cross-language leakage
    - **Property 8: Cookie consent language follows active language**
    - **Validates: Requirements 13.8**
  - [x] 22.9 Write property test for Property 9: Urgency signal threshold invariant — generate arbitrary `stockQuantity` values; assert badge shown iff `stockQuantity ∈ [0, 5]` on both card and modal
    - **Property 9: Urgency signal threshold invariant**
    - **Validates: Requirements 10.2**
  - [x] 22.10 Write property test for Property 10: Reorder skips unavailable variants — generate orders with mixed available/unavailable variants; assert exactly available variants added (preserving quantity), no unavailable variant added, Toast lists all skipped names
    - **Property 10: Reorder skips unavailable variants**
    - **Validates: Requirements 7.17, 12.8**

- [x] 23. Accessibility audit and fixes
  - [x] 23.1 Audit all pages for keyboard Tab navigation: ensure all interactive elements (buttons, links, form fields, modal close buttons, variant pills, drawer close buttons) are reachable in logical DOM order; fix any elements that are unreachable or out of order
    - _Requirements: 11.1_
  - [x] 23.2 Audit all interactive elements for visible focus indicators: ensure no bare `outline: none` without a custom equivalent; add `outline: 2px solid var(--color-accent-purple); outline-offset: 3px` to any element missing a focus style
    - _Requirements: 11.2_
  - [x] 23.3 Audit all images across all pages: add descriptive `alt` attributes to informational images; set `alt=""` on decorative images; fix any missing `alt` attributes on product thumbnails, gallery images, and payment logos
    - _Requirements: 11.3_
  - [x] 23.4 Audit all form inputs: ensure every input has an associated `<label>` (explicit `for`/`id` pairing or `aria-label`); fix any unlabeled inputs in checkout, profile, address, and search forms
    - _Requirements: 11.4_
  - [x] 23.5 Audit all modal dialogs: ensure `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` pointing to the modal title are present on the product detail modal, login modal, and any other dialog; verify focus trap and Escape key close work correctly
    - _Requirements: 11.5, 3.9_
  - [x] 23.6 Add `<meta name="viewport" content="width=device-width, initial-scale=1.0">` to any page missing it; verify all 5 HTML pages have this tag
    - _Requirements: 11.14_

- [x] 24. Performance audit and fixes
  - [x] 24.1 Add `loading="lazy"` to all product images, gallery images, and review images that are below the fold; set `loading="eager"` on above-the-fold images (hero, navbar logo)
    - _Requirements: 11.7_
  - [x] 24.2 Add `<picture>` elements with `<source type="image/webp">` for all product images and uploaded design thumbnails, falling back to JPEG/PNG; update image render functions in `products.js` and `cart.js` to use `<picture>` markup
    - _Requirements: 11.8_
  - [x] 24.3 Inline critical above-the-fold CSS (navbar and hero styles) in a `<style>` block in the `<head>` of each page to eliminate render-blocking CSS for the initial viewport
    - _Requirements: 11.9_
  - [x] 24.4 Verify all non-critical JS files use the `defer` attribute in all 5 HTML pages; fix any missing `defer` attributes on `api.js`, `auth.js`, `cart.js`, `store-i18n.js`, `toast.js`, and all new modules
    - _Requirements: 11.10_
  - [x] 24.5 Add `<link rel="preconnect" href="https://fonts.googleapis.com">`, `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`, and `<link rel="preconnect">` for the API base URL to the `<head>` of all 5 HTML pages
    - _Requirements: 11.12_
  - [x] 24.6 Add network error handling to all API calls in new modules: on timeout or server error, call `Toast.show()` with `type: 'error'` and a localized message from `store-i18n.js`; re-enable buttons and remove spinners; never show raw error objects
    - _Requirements: 11.15_

- [x] 25. Final checkpoint — All tests pass
  - Ensure all property-based tests pass with minimum 100 iterations each, all accessibility audit items are resolved, all pages load without horizontal scrollbars at all three breakpoints, and all `defer` attributes and `preconnect` hints are in place. Ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at the end of each phase
- Property tests (tagged `Feature: ux-enhancements, Property N`) validate universal correctness properties using **fast-check** with minimum 100 iterations each
- Unit tests validate specific examples and edge cases
- All animations MUST use only `transform` and `opacity` — no layout-triggering properties
- All new components MUST use design tokens exclusively — no new hard-coded colors, font families, or pixel-based spacing values
- The `getLang()` helper pattern MUST be used in all new JS modules for consistent language detection
