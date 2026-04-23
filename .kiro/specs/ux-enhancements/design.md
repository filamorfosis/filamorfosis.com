# Design Document — UX Enhancements

## Overview

This document describes the frontend-only UX overhaul of the Filamorfosis® online store. The initiative transforms the existing functional-but-rough experience into a polished, conversion-optimized storefront while preserving the existing vanilla HTML/CSS/JS stack, dark theme (`#0a0e1a`), Poppins + Roboto typography, FontAwesome 6, Bootstrap grid, Particles.js, Swiper.js, and the multilingual i18n system.

No backend changes are required. All new components call the existing API endpoints documented in the online-store design. No JavaScript framework is introduced. The approach is additive: a new `design-system.css` token layer is introduced, existing CSS files are progressively updated to reference the new tokens, and new JS modules are added alongside the existing ones.

The eleven requirement areas addressed are: design system and typography, responsive navigation, product cards and detail modal, cart experience, checkout experience, order confirmation, user profile, custom design upload, WhatsApp FAB, marketing and conversion, accessibility and performance, enhanced order history, cookie consent, and product discovery.

---

## Architecture and File Structure

### New Files

| Path | Purpose |
|---|---|
| `assets/css/design-system.css` | Single source of truth for all CSS custom properties (tokens) and shared component classes |
| `assets/js/toast.js` | Singleton toast notification system with ARIA live region |
| `assets/js/whatsapp-fab.js` | Shared WhatsApp FAB module injected on every page |
| `assets/js/cookie-consent.js` | Cookie consent banner with 6-language support and localStorage persistence |
| `assets/js/promo-banner.js` | Dismissible promotional banner (sessionStorage) |
| `assets/js/search-autocomplete.js` | Fuzzy-match search autocomplete for the catalog |

### Modified Existing Files

| File | Changes |
|---|---|
| `assets/css/main.css` | Add `@import` of `design-system.css`; update navbar, button, and card rules to reference design tokens |
| `assets/css/products.css` | Update card, modal, chip, and tab rules to reference design tokens |
| `assets/css/store.css` | Update cart drawer, checkout, account, and order styles to reference design tokens |
| `assets/js/cart.js` | Integrate toast.js; add mini-cart trust badges; add design-upload indicator; add auto-open-on-add behavior; add badge pulse trigger |
| `assets/js/products.js` | Remove add-to-cart button from card; add skeleton loading; add variant price update; add social proof; add urgency signal; add related products; add share button; add design upload zone |
| `assets/js/checkout.js` | Add progress indicator; add inline validation; add coupon field; add "what happens next" panel; add guest checkout; add trust badges; add estimated delivery |
| `assets/js/auth.js` | No structural changes; toast.js replaces plain text success messages |
| `assets/js/store-i18n.js` | Add new translation keys for all new UI strings |
| `index.html` | Add `design-system.css` link; add promo banner; add brand story section; add reviews section; add trust badges; add `whatsapp-fab.js`; add `cookie-consent.js` |
| `products.html` | Add `design-system.css` link; add promo banner; add breadcrumb; add `whatsapp-fab.js`; add `cookie-consent.js`; add `search-autocomplete.js` |
| `checkout.html` | Add `design-system.css` link; add `whatsapp-fab.js`; add `cookie-consent.js` |
| `order-confirmation.html` | Add `design-system.css` link; add `whatsapp-fab.js`; add `cookie-consent.js` |
| `account.html` | Add `design-system.css` link; add `whatsapp-fab.js`; add `cookie-consent.js` |

### File Dependency Graph

```
design-system.css
  └── consumed by: main.css, products.css, store.css (via CSS custom properties)

api.js
  └── consumed by: cart.js, checkout.js, auth.js, products.js, account page inline script

auth.js
  └── depends on: api.js
  └── consumed by: all pages

cart.js
  └── depends on: api.js, toast.js
  └── consumed by: all store pages

toast.js
  └── standalone singleton
  └── consumed by: cart.js, checkout.js, products.js, account page inline script

whatsapp-fab.js
  └── depends on: window.currentLang (set by main.js or store-i18n.js)
  └── consumed by: all pages

cookie-consent.js
  └── depends on: window.currentLang
  └── consumed by: all pages (loaded early, before analytics)

search-autocomplete.js
  └── depends on: window.PRODUCTS (catalog data), store-i18n.js
  └── consumed by: products.html only

promo-banner.js
  └── depends on: window.currentLang
  └── consumed by: index.html, products.html
```

### Script Load Order Per Page Type

**index.html**
```html
<link rel="stylesheet" href="assets/css/design-system.css">
<link rel="stylesheet" href="assets/css/main.css">
<!-- vendor scripts (particles, swiper, vegas, etc.) -->
<script src="assets/js/api.js" defer></script>
<script src="assets/js/mock-api.js" defer></script>
<script src="assets/js/auth.js" defer></script>
<script src="assets/js/cart.js" defer></script>
<script src="assets/js/store-i18n.js" defer></script>
<script src="assets/js/toast.js" defer></script>
<script src="assets/js/main.js" defer></script>
<script src="assets/js/promo-banner.js" defer></script>
<script src="assets/js/whatsapp-fab.js" defer></script>
<script src="assets/js/cookie-consent.js" defer></script>
```

**products.html**
```html
<link rel="stylesheet" href="assets/css/design-system.css">
<link rel="stylesheet" href="assets/css/main.css">
<link rel="stylesheet" href="assets/css/products.css">
<!-- catalog data scripts (catalog.js, Products_UV.js, etc.) -->
<script src="assets/js/api.js" defer></script>
<script src="assets/js/mock-api.js" defer></script>
<script src="assets/js/auth.js" defer></script>
<script src="assets/js/cart.js" defer></script>
<script src="assets/js/store-i18n.js" defer></script>
<script src="assets/js/toast.js" defer></script>
<script src="assets/js/products.js" defer></script>
<script src="assets/js/search-autocomplete.js" defer></script>
<script src="assets/js/promo-banner.js" defer></script>
<script src="assets/js/whatsapp-fab.js" defer></script>
<script src="assets/js/cookie-consent.js" defer></script>
```

**checkout.html / account.html / order-confirmation.html**
```html
<link rel="stylesheet" href="assets/css/design-system.css">
<link rel="stylesheet" href="assets/css/main.css">
<link rel="stylesheet" href="assets/css/store.css">
<script src="assets/js/api.js" defer></script>
<script src="assets/js/mock-api.js" defer></script>
<script src="assets/js/auth.js" defer></script>
<script src="assets/js/cart.js" defer></script>
<script src="assets/js/store-i18n.js" defer></script>
<script src="assets/js/toast.js" defer></script>
<script src="assets/js/checkout.js" defer></script>  <!-- or account/confirmation inline -->
<script src="assets/js/whatsapp-fab.js" defer></script>
<script src="assets/js/cookie-consent.js" defer></script>
```

---

## Design System (`assets/css/design-system.css`)

### CSS Custom Property Definitions

```css
/* ═══════════════════════════════════════════════
   FILAMORFOSIS® DESIGN SYSTEM
   assets/css/design-system.css
   Load this file FIRST on every page.
   ═══════════════════════════════════════════════ */

:root {
  /* ── Color Palette ─────────────────────────────── */
  --color-bg-primary:    #0a0e1a;
  --color-bg-secondary:  #0f172a;
  --color-bg-surface:    rgba(255, 255, 255, 0.04);
  --color-bg-elevated:   #131929;
  --color-border:        rgba(255, 255, 255, 0.07);
  --color-border-strong: rgba(255, 255, 255, 0.12);

  --color-text-primary:  #e2e8f0;
  --color-text-secondary:#cbd5e1;
  --color-text-muted:    #94a3b8;
  --color-text-disabled: #475569;

  --color-accent-purple: #8b5cf6;
  --color-accent-pink:   #ec4899;
  --color-accent-indigo: #6366f1;
  --color-accent-orange: #f97316;
  --color-accent-cyan:   #06b6d4;

  --color-success:       #10b981;
  --color-warning:       #f59e0b;
  --color-error:         #ef4444;
  --color-info:          #3b82f6;

  --color-gradient-brand: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%);
  --color-gradient-uv:    linear-gradient(135deg, #f97316, #ec4899);
  --color-gradient-warm:  linear-gradient(135deg, #f59e0b, #f97316);

  /* ── Typography Scale ──────────────────────────── */
  --font-family-heading: 'Poppins', sans-serif;
  --font-family-body:    'Roboto', sans-serif;

  --font-size-xs:   0.75rem;   /* 12px */
  --font-size-sm:   0.875rem;  /* 14px */
  --font-size-base: 1rem;      /* 16px */
  --font-size-md:   1.125rem;  /* 18px */
  --font-size-lg:   1.25rem;   /* 20px */
  --font-size-xl:   1.5rem;    /* 24px */
  --font-size-2xl:  2rem;      /* 32px */
  --font-size-3xl:  2.5rem;    /* 40px */
  --font-size-hero: clamp(2.5rem, 5vw, 4rem);

  --font-weight-regular:   400;
  --font-weight-medium:    500;
  --font-weight-semibold:  600;
  --font-weight-bold:      700;
  --font-weight-extrabold: 800;

  --line-height-tight:  1.2;
  --line-height-normal: 1.6;
  --line-height-loose:  1.8;

  /* ── Spacing Scale (4px base unit) ────────────── */
  --space-xs:   4px;
  --space-sm:   8px;
  --space-md:   12px;
  --space-base: 16px;
  --space-lg:   24px;
  --space-xl:   32px;
  --space-2xl:  48px;
  --space-3xl:  64px;
  --space-4xl:  96px;

  /* ── Border Radius ─────────────────────────────── */
  --radius-sm:   6px;
  --radius-md:   8px;
  --radius-lg:   14px;
  --radius-xl:   18px;
  --radius-2xl:  24px;
  --radius-full: 9999px;

  /* ── Shadows ───────────────────────────────────── */
  --shadow-sm:  0 2px 8px rgba(0, 0, 0, 0.3);
  --shadow-md:  0 8px 24px rgba(0, 0, 0, 0.4);
  --shadow-lg:  0 16px 48px rgba(0, 0, 0, 0.5);
  --shadow-glow-purple: 0 0 20px rgba(139, 92, 246, 0.35);
  --shadow-glow-pink:   0 0 20px rgba(236, 72, 153, 0.35);

  /* ── Breakpoints (reference only — use in media queries) */
  --bp-mobile:  480px;
  --bp-tablet:  768px;
  --bp-desktop: 1024px;

  /* ── Z-index Scale ─────────────────────────────── */
  --z-promo-banner: 1100;
  --z-navbar:       1000;
  --z-drawer:        900;
  --z-modal:         800;
  --z-toast:         700;
  --z-fab:           600;
  --z-dropdown:      500;

  /* ── Transitions ───────────────────────────────── */
  --transition-fast:   0.15s ease;
  --transition-base:   0.25s ease;
  --transition-slow:   0.4s ease;
  --transition-spring: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
```

### Shared Component Classes

```css
/* ── Buttons ───────────────────────────────────── */
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: 12px 24px;
  border-radius: var(--radius-md);
  font-family: var(--font-family-heading);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  background: var(--color-gradient-brand);
  color: #fff;
  border: none;
  cursor: pointer;
  transition: opacity var(--transition-fast), transform var(--transition-fast);
  text-decoration: none;
}
.btn-primary:hover  { opacity: 0.88; transform: translateY(-1px); }
.btn-primary:active { transform: translateY(0); }
.btn-primary:focus-visible {
  outline: 2px solid var(--color-accent-purple);
  outline-offset: 3px;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: 12px 24px;
  border-radius: var(--radius-md);
  font-family: var(--font-family-heading);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  background: transparent;
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-strong);
  cursor: pointer;
  transition: border-color var(--transition-fast), background var(--transition-fast), transform var(--transition-fast);
  text-decoration: none;
}
.btn-secondary:hover {
  border-color: var(--color-accent-purple);
  background: rgba(139, 92, 246, 0.08);
  transform: translateY(-1px);
}
.btn-secondary:focus-visible {
  outline: 2px solid var(--color-accent-purple);
  outline-offset: 3px;
}

.btn-ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: 12px 24px;
  border-radius: var(--radius-md);
  font-family: var(--font-family-heading);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  background: transparent;
  color: var(--color-accent-purple);
  border: none;
  cursor: pointer;
  transition: background var(--transition-fast);
  text-decoration: none;
}
.btn-ghost:hover { background: rgba(139, 92, 246, 0.1); }
.btn-ghost:focus-visible {
  outline: 2px solid var(--color-accent-purple);
  outline-offset: 3px;
}

/* ── Card ──────────────────────────────────────── */
.card {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
}

/* ── Skeleton shimmer ──────────────────────────── */
.skeleton {
  background: linear-gradient(
    90deg,
    rgba(255,255,255,0.04) 25%,
    rgba(255,255,255,0.09) 50%,
    rgba(255,255,255,0.04) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
}
@keyframes skeleton-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── Badge ─────────────────────────────────────── */
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.04em;
}
.badge-success { background: rgba(16,185,129,0.15); color: #34d399; border: 1px solid rgba(16,185,129,0.3); }
.badge-warning { background: rgba(245,158,11,0.15); color: #fbbf24; border: 1px solid rgba(245,158,11,0.3); }
.badge-error   { background: rgba(239,68,68,0.15);  color: #f87171; border: 1px solid rgba(239,68,68,0.3); }
.badge-purple  { background: rgba(139,92,246,0.15); color: #c4b5fd; border: 1px solid rgba(139,92,246,0.3); }
.badge-hot     { background: var(--color-gradient-uv); color: #fff; }
.badge-new     { background: linear-gradient(135deg,#22c55e,#16a34a); color: #fff; }
```

### Migration Strategy

The migration is **additive and progressive**:

1. `design-system.css` is added as the first stylesheet on every page — it defines all tokens but does not override any existing rules.
2. Existing rules in `main.css` and `products.css` that use hard-coded values (e.g., `#0a0e1a`, `#94a3b8`, `rgba(255,255,255,0.07)`) are updated to reference the corresponding token (e.g., `var(--color-bg-primary)`, `var(--color-text-muted)`, `var(--color-border)`).
3. New components are written exclusively using tokens — no new hard-coded colors, font families, or pixel-based spacing values.
4. Existing components are updated incrementally as they are touched during feature implementation; no big-bang refactor is required.

---
