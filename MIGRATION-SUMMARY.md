# Services Migration Summary

## Overview
Successfully moved all services-related sections from `index.html` to `services.html`.

## Sections Moved to services.html

### 1. Services Section (id="services")
- Complete showcase section with all service panels:
  - Laser Engraving (engrave)
  - UV Printing (uv)
  - 3D Printing (3d) - including materials widget
  - Laser Cutting (laser)
  - 3D Scanning (scan)
  - Photo Printing (photo)
- Service sidebar navigation
- MOQ banner
- **Change:** Removed `style="display:none"` so the section is visible by default

### 2. Video Strips
- First video strip (Filamorfosis.mp4)
- Second video strip (Alquimia.mp4)

### 3. Bring to Life Section (id="bring-to-life")
- Complete "From Sketch to Reality" section
- Before/After comparison
- Features list
- CTA button

### 4. Modals
- Material Modal (id="materialModal") - for 3D printing materials
- Technical Details Modal (id="technicalModal") - for material specifications

### 5. Clients Section (id="clients")
- Client logos marquee
- Dynamically populated from clients.js

### 6. Brand Story Section (id="brand-story")
- Company story and mission
- Brand image placeholder

## Sections Remaining in index.html

### Kept in index.html:
1. **Promo Banner Slider** (id="promo-slider") - Product promotions
2. **Catalog Section** (id="catalog") - Product catalog SPA
3. **Contact Form** (id="contact") - Contact form with Web3Forms integration
4. **WhatsApp Modal** - WhatsApp chat popup
5. **Reviews Section** - Customer testimonials
6. **Certifications Section** - Quality badges
7. **Footer** - Site footer with links

## Navigation Updates

### index.html navbar:
- Added "Clientes" link pointing to `services.html#clients`
- Kept "Tienda" (home), "Servicios Personalizados", and "Contacto" links

### services.html navbar:
- "Tienda" → `index.html`
- "Servicios Personalizados" → `services.html` (active)
- "Clientes" → `#clients` (same page)
- "Contacto" → `index.html#contact`

## Scripts Added to services.html

Added the following scripts to support the moved sections:
- `jquery-3.7.1.min.js` - Required for main.js functionality
- `Resources/Clients/clients.js` - Client logos data
- `assets/js/i18n/lang.*.js` (all 6 languages) - Translation files
- Existing scripts: api.js, auth.js, main.js, store-i18n.js, promo-banner.js, whatsapp-fab.js, cookie-consent.js

## File Structure

```
index.html          → Store/catalog page (promo slider + catalog + contact)
services.html       → Services showcase page (all services + clients + brand story)
```

## Testing Checklist

- [ ] Verify services.html displays all service panels correctly
- [ ] Verify services section is visible (no display:none)
- [ ] Test service sidebar navigation between panels
- [ ] Test materials widget (3D printing section)
- [ ] Test material modals (click "Saber más" and "Ver detalles técnicos")
- [ ] Verify clients marquee animation works
- [ ] Test language switcher on both pages
- [ ] Verify all data-translate attributes work
- [ ] Test navigation between index.html and services.html
- [ ] Verify #clients anchor link works from index.html
- [ ] Verify #contact anchor link works from services.html
- [ ] Test mobile responsiveness on both pages
- [ ] Verify all video lazy loading works
- [ ] Test cart functionality on both pages

## Notes

- All `data-translate` attributes preserved for i18n support
- All CSS classes intact
- No inline styles added (following frontend standards)
- UTF-8 encoding maintained
- All sections maintain their original functionality
