# Filamorfosis — Project Context

## Business Overview

Filamorfosis is a Mexican printing business offering:
- **3D Printing** — multicolor/multimaterial FDM printing (PLA, PETG, TPU, ABS, PA+CF)
- **UV Printing** — direct UV printing on drinkware, wood, metal, acrylic, ceramics, and more
- **Laser Cutting** — precision cutting and engraving on wood, acrylic, leather
- **3D Scanning** — object digitization for replication or 3D printing
- **Photo Printing** — professional photo and canvas printing

## Brand Identity

- Brand name: **Filamorfosis®**
- Tagline: "Tus Ideas. Tu Realidad." (Your Ideas. Your Reality.)
- Logo: circular logo with transparent background
- Primary market: Mexico (prices in MXN), multilingual site (ES, EN, DE, PT, JA, ZH)

## UI/UX Principles

- **Catchy, colorful, modern** — vibrant gradients, bold typography, animated elements
- **Buying-action-first** — every page section should promote a purchase or quote action
- CTAs must be prominent and repeated throughout the page (not just at the bottom)
- Dark theme base (`#0a0e1a` background) with neon/vibrant accent colors
- Smooth animations, particle effects, and visual polish are expected
- Mobile-first responsive design
- FontAwesome icons, Poppins + Roboto fonts, Bootstrap grid

## Existing Frontend Stack

- Vanilla HTML5, CSS3, JavaScript (no framework)
- jQuery (bundled vendor)
- Bootstrap grid only (no full Bootstrap)
- Swiper.js for carousels
- Particles.js for hero background
- Vegas.js, YTPlayer, flat-surface-shader for visual effects
- Multilingual i18n via `data-translate` / `data-t` attributes + JS translation objects

## Existing File Structure

```
index.html              — Main landing page (hero, services, materials, gallery, clients, contact)
products.html           — Product catalog SPA (tabs, filters, grid, modal)
assets/css/main.css     — Main stylesheet
assets/css/products.css — Catalog stylesheet
assets/js/main.js       — Main JS (lang switcher, animations, SPA router for catalog)
assets/js/products.js   — Catalog engine (render tabs, grid, modal)
Resources/Products/catalog.js       — Catalog core (translations, categories, filters)
Resources/Products/Products_UV.js   — UV product data
Resources/Products/Products_UV_lang.js — UV product i18n
Resources/Clients/clients.js        — Client logos data
```

## Conversion Goal

Transform the existing brochure/catalog site into a **full e-commerce store** while preserving the existing visual identity and multilingual support.
