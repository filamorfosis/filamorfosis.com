# Design Document — UX Enhancements
## Component Designs

### Navbar

**HTML structure:**
```html
<nav class="navbar" id="main-navbar" role="navigation" aria-label="Navegación principal">
  <!-- Promo banner sits above this element -->
  <div class="navbar__inner container">
    <a href="index.html" class="navbar__brand" aria-label="Filamorfosis inicio">
      <img src="assets/img/Profile2.png" alt="Filamorfosis" class="navbar__logo" width="36" height="36">
      <span class="navbar__brand-name">Filamorfosis<sup>®</sup></span>
    </a>

    <!-- Desktop nav links -->
    <ul class="navbar__menu" role="list">
      <li><a href="index.html#services" data-t="nav_services">Servicios</a></li>
      <li><a href="products.html" data-t="nav.store">Tienda</a></li>
      <li><a href="index.html#contact" data-t="nav_contact">Contacto</a></li>
    </ul>

    <div class="navbar__actions">
      <!-- Language switcher (existing) -->
      <div class="lang-selector" id="navbar-lang"></div>
      <!-- Cart icon with badge -->
      <button class="navbar__cart" id="cart-nav-icon" aria-label="Ver carrito">
        <i class="fas fa-shopping-cart" aria-hidden="true"></i>
        <span id="cart-count" class="cart-badge" aria-live="polite">0</span>
      </button>
      <!-- Auth state -->
      <span data-auth="logged-in" style="display:none">
        <span id="navbar-user-name" class="navbar__username"></span>
        <a href="account.html" class="navbar__link" aria-label="Mi cuenta"><i class="fas fa-user" aria-hidden="true"></i></a>
        <a href="#" data-action="logout" class="navbar__link btn-ghost" aria-label="Cerrar sesión"><i class="fas fa-sign-out-alt" aria-hidden="true"></i></a>
      </span>
      <span data-auth="logged-out">
        <button data-action="show-login" class="btn-secondary btn-sm">Iniciar sesión</button>
      </span>
      <!-- Hamburger (mobile only) -->
      <button class="navbar__toggle" id="nav-hamburger" aria-label="Abrir menú" aria-expanded="false" aria-controls="nav-drawer">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
</nav>

<!-- Mobile drawer -->
<div id="nav-drawer" class="nav-drawer" role="dialog" aria-modal="true" aria-label="Menú de navegación" hidden>
  <div class="nav-drawer__backdrop"></div>
  <div class="nav-drawer__panel">
    <button class="nav-drawer__close" aria-label="Cerrar menú">&times;</button>
    <ul class="nav-drawer__links" role="list">
      <li><a href="index.html#services" data-t="nav_services">Servicios</a></li>
      <li><a href="products.html" data-t="nav.store">Tienda</a></li>
      <li><a href="index.html#contact" data-t="nav_contact">Contacto</a></li>
    </ul>
    <div class="nav-drawer__lang"><!-- language switcher clone --></div>
    <div class="nav-drawer__auth">
      <button data-action="show-login" class="btn-primary btn-block" data-auth="logged-out">Iniciar sesión</button>
      <a href="account.html" class="btn-secondary btn-block" data-auth="logged-in" style="display:none">Mi cuenta</a>
    </div>
    <div class="nav-drawer__cart-row">
      <button class="btn-ghost" onclick="FilamorfosisCart.openDrawer()">
        <i class="fas fa-shopping-cart"></i> Carrito
        <span id="cart-count-drawer" class="cart-badge">0</span>
      </button>
    </div>
  </div>
</div>
```

**CSS approach:** `.navbar` uses `position: fixed; top: 0; z-index: var(--z-navbar)`. On scroll > 80px, JS adds `.navbar--scrolled` which applies `backdrop-filter: blur(16px)` and `background: rgba(10,14,26,0.92)`. The drawer uses `transform: translateX(100%)` → `translateX(0)` transition. Backdrop is `rgba(0,0,0,0.6)`.

**JS behavior:** `main.js` handles scroll listener and hamburger toggle. Drawer open/close sets `aria-expanded` on the hamburger button and toggles `hidden` on the drawer. Body scroll is locked while drawer is open.

**Responsive:** Hamburger visible at `max-width: 768px`. Drawer is `width: 100vw` on mobile, `width: 320px` on tablet+.

---

### Toast Notification System (`assets/js/toast.js`)

**Architecture:** Singleton module. Injects a single `<div id="toast-region">` into `<body>` on first call. Maintains a FIFO queue; shows one toast at a time, auto-advances after dismiss.

**HTML structure (injected):**
```html
<div id="toast-region" role="status" aria-live="polite" aria-atomic="false"
     style="position:fixed; top:var(--space-lg); right:var(--space-lg); z-index:var(--z-toast);
            display:flex; flex-direction:column; gap:var(--space-sm); pointer-events:none;">
</div>
```

Each toast item:
```html
<div class="toast toast--success" role="alert" aria-live="assertive">
  <img class="toast__thumb" src="..." alt="" width="40" height="40">
  <div class="toast__body">
    <p class="toast__title">Producto agregado</p>
    <p class="toast__sub">PLA Blanco · 30cm</p>
  </div>
  <button class="toast__close" aria-label="Cerrar notificación">&times;</button>
</div>
```

**JS API:**
```js
window.FilamorfosisToast = {
  show({ title, subtitle, thumb, type = 'success', duration = 3000 }),
  dismiss(id),
  clear()
}
```

**CSS:** Toasts slide in from the right using `@keyframes toast-in`. On mobile (`max-width: 768px`) they appear top-center. Auto-dismiss uses `setTimeout`. Manual close calls `dismiss()`.

---

### Mini Cart Drawer

The existing `cart.js` drawer is enhanced with:

1. **Trust badge strip** above the checkout button: "🔒 Pago seguro", "⭐ Calidad garantizada", "💬 Soporte 24/7"
2. **Design upload indicator** per CartItem: if `item.acceptsDesignFile && !item.designFileName`, show `<div class="cart-item__design-warn">⚠ Sube tu diseño</div>`
3. **Auto-open on add:** `addItem()` calls `openDrawer()` then schedules `closeDrawer()` after 2000ms unless `_userInteracted` flag is set
4. **Empty state:** Illustrated SVG + "Tu carrito está vacío" + "Ver productos" CTA
5. **"Seguir comprando" link** at top of drawer panel

**Responsive:** `width: 100vw` on mobile, `width: 420px` on desktop (CSS `max-width`).

---

### Variant Selector

Enhanced inside the product detail modal in `products.js`:

```html
<div class="variant-selector" role="group" aria-labelledby="variant-label">
  <p id="variant-label" class="variant-selector__label">Elige tu variante</p>
  <div class="variant-selector__pills">
    <button class="variant-pill" data-variant="30cm × 20cm" data-price="299"
            aria-pressed="false" role="radio">
      30cm × 20cm
      <span class="variant-pill__price">$299</span>
    </button>
    <!-- more pills -->
  </div>
  <p class="variant-selector__price-display" aria-live="polite">
    Precio: <strong id="modal-price">Selecciona una variante</strong>
  </p>
</div>
```

**JS behavior:** On pill click, update `aria-pressed`, update `#modal-price` with the variant's price, enable the "Agregar al carrito" button. If no variant selected, button has `disabled` attribute and `aria-disabled="true"`.

---

### Design Upload Zone

Rendered inside the product detail modal when the selected variant has `acceptsDesignFile = true`:

```html
<div class="design-upload-zone" id="design-upload-zone" role="region" aria-label="Zona de carga de diseño">
  <div class="design-upload-zone__drop" id="design-drop-area"
       tabindex="0" role="button" aria-label="Arrastra tu diseño aquí o haz clic para seleccionar">
    <i class="fas fa-cloud-upload-alt" aria-hidden="true"></i>
    <p class="design-upload-zone__title">Sube tu diseño aquí</p>
    <p class="design-upload-zone__sub">Arrastra tu imagen o haz clic para seleccionar</p>
    <p class="design-upload-zone__formats">PNG, JPG, SVG, PDF · Máx. 20 MB</p>
    <input type="file" id="design-file-input" accept=".png,.jpg,.jpeg,.svg,.pdf"
           aria-label="Seleccionar archivo de diseño" style="display:none">
  </div>
  <!-- Preview (shown after file selection) -->
  <div class="design-upload-zone__preview" id="design-preview" hidden>
    <img id="design-preview-img" alt="Vista previa de tu diseño" width="120" height="120">
    <p id="design-preview-name"></p>
    <button class="btn-ghost btn-sm" id="design-remove-btn" aria-label="Eliminar diseño">
      <i class="fas fa-trash" aria-hidden="true"></i> Cambiar
    </button>
  </div>
  <!-- Error state -->
  <p class="design-upload-zone__error" id="design-upload-error" role="alert" hidden></p>
  <!-- Collapsible instructions -->
  <details class="design-upload-zone__help">
    <summary>▶ ¿Cómo funciona?</summary>
    <p>Sube una foto de tu diseño, logo, o imagen favorita. Nuestro equipo la usará para personalizar tu producto.</p>
  </details>
</div>
```

**JS behavior:** `dragover`/`drop` events on `#design-drop-area`. `FileReader.readAsDataURL()` for image preview within 200ms. File size check (> 20MB → error). MIME type check. Non-image files (SVG/PDF) show file icon + name instead of image preview.

---

### Product Card

Updated in `products.js` `renderGrid()`:

- Remove the `cat-card-cta--cart` button entirely from the card surface
- Add skeleton placeholder while loading: `<div class="cat-card skeleton-card">...</div>`
- Add urgency signal: if `variant.stockQuantity <= 5`, render `<span class="badge badge-warning">¡Solo quedan ${qty}!</span>`
- Add star rating badge: `<span class="cat-card-rating">★ 4.8</span>` (static per product)
- Keep single CTA: "Ver detalles" button only

**Skeleton HTML:**
```html
<div class="cat-card cat-card--skeleton">
  <div class="cat-card-img skeleton"></div>
  <div class="cat-card-body">
    <div class="skeleton" style="height:12px; width:60%; margin-bottom:8px"></div>
    <div class="skeleton" style="height:18px; width:80%; margin-bottom:8px"></div>
    <div class="skeleton" style="height:12px; width:100%; margin-bottom:4px"></div>
    <div class="skeleton" style="height:12px; width:70%"></div>
  </div>
</div>
```

---

### Product Detail Modal

Enhanced in `products.js` `renderModal()`:

1. **Gallery cross-fade:** Main image uses CSS `transition: opacity 200ms ease`. On thumb click, set `opacity: 0`, swap `src`, set `opacity: 1`.
2. **Social proof:** `<p class="modal-social-proof">🔥 47 personas han pedido esto este mes</p>` (static count per product)
3. **Urgency signal:** Rendered if lowest-stock variant ≤ 5
4. **Collapsed specs:** `<details class="modal-specs"><summary>Especificaciones técnicas</summary>...</details>`
5. **Related products:** Horizontal scroll strip of 3–4 cards from same category
6. **Share button:** `<button class="btn-ghost btn-sm" id="modal-share-btn"><i class="fas fa-share-alt"></i> Compartir</button>` — copies URL to clipboard, shows "¡Enlace copiado!" toast
7. **Secondary actions:** "¿Necesitas ayuda?" collapsible section with Cotizar + WhatsApp links
8. **Return policy badge:** `<a href="#return-policy" class="return-policy-badge">Política de devoluciones: satisfacción garantizada</a>`
9. **Video placeholder:** For products tagged `has-video`: `<video controls aria-label="Video del producto" poster="..."><source src=""></video>` with overlay

**Accessibility:** `role="dialog"`, `aria-modal="true"`, `aria-labelledby="modal-title"`. Focus trapped inside. Escape key closes. Focus returns to the triggering card button on close.

---

### Checkout Page

Enhanced `checkout.js` and `checkout.html`:

**Progress indicator:**
```html
<nav class="checkout-progress" aria-label="Progreso del pedido">
  <ol class="checkout-progress__steps">
    <li class="step step--done" aria-label="Carrito completado">
      <span class="step__icon"><i class="fas fa-check"></i></span>
      <span class="step__label">Carrito</span>
    </li>
    <li class="step step--active" aria-current="step">
      <span class="step__icon">2</span>
      <span class="step__label">Envío</span>
    </li>
    <li class="step">
      <span class="step__icon">3</span>
      <span class="step__label">Pago</span>
    </li>
  </ol>
</nav>
```

**Inline validation:** Each field gets `input` event listener. Valid state: green border + `<i class="fas fa-check-circle" style="color:var(--color-success)">`. Invalid state: descriptive hint text (not just "error"). All fields use `autocomplete` attributes per requirement 5.14.

**Coupon field:**
```html
<div class="coupon-field">
  <input type="text" id="coupon-input" placeholder="Código de descuento" aria-label="Código de descuento">
  <button class="btn-secondary btn-sm" id="coupon-apply-btn">Aplicar</button>
  <p id="coupon-msg" role="status" aria-live="polite"></p>
</div>
```

**"What happens next" panel:** Shown after clicking pay, before redirect:
```html
<div class="whats-next-panel" id="whats-next" hidden>
  <h3>¿Qué pasa ahora?</h3>
  <ol>
    <li>Serás redirigido a MercadoPago para pagar de forma segura.</li>
    <li>Recibirás un correo de confirmación.</li>
    <li>Tu pedido entrará en producción.</li>
  </ol>
</div>
```

**Trust badges row:**
```html
<div class="trust-badges" role="list">
  <div class="trust-badge" role="listitem"><i class="fas fa-lock"></i> Pago 100% seguro</div>
  <div class="trust-badge" role="listitem"><i class="fas fa-shield-alt"></i> Datos protegidos</div>
  <div class="trust-badge" role="listitem"><i class="fas fa-star"></i> Calidad garantizada</div>
</div>
```

**Payment logos:**
```html
<div class="payment-logos" aria-label="Métodos de pago aceptados">
  <img src="assets/img/mp-logo.svg" alt="MercadoPago" width="80">
  <img src="assets/img/visa-logo.svg" alt="Visa" width="40">
  <img src="assets/img/mc-logo.svg" alt="Mastercard" width="40">
  <img src="assets/img/oxxo-logo.svg" alt="OXXO" width="40">
</div>
```

**Estimated delivery:** Static range displayed in order summary: "Entrega estimada: 5–8 días hábiles" (all categories use same range in this phase).

**Guest checkout:** A "Continuar como invitado" button shown when user is not authenticated. On success, order-confirmation page shows soft upsell.

---

### Order Confirmation Page

**Success state:**
- Particles.js confetti burst (3s, then `particlesJS.fn.vendors.destroypJS()`)
- Full-viewport hero with `var(--color-gradient-brand)` overlay
- Large gradient-text heading: "¡Tu pedido está en camino! 🚀"
- Order summary card (`.card`)
- Rewards placeholder card: "¡Ganaste puntos! 🎉 Próximamente podrás canjearlos."
- Social share section: WhatsApp share link + copy-link button
- Two CTAs: "Ver mis pedidos" + "Seguir comprando"

**Failure state:** Error icon, explanation, "Reintentar pago" button, WhatsApp support link.

**Pending state:** Animated spinner, "Tu pago está siendo procesado" message.

**Guest upsell (when `guestCheckout=true` in URL params):**
```html
<div class="guest-upsell card">
  <p>¿Quieres guardar tu pedido? Crea una cuenta gratis.</p>
  <button class="btn-primary" data-action="show-register">Crear cuenta</button>
</div>
```

---

### User Profile / Account Page

**Animated canvas background:** A `<canvas id="account-bg-canvas">` in the page header. A vanilla JS animation draws slowly moving filament-like bezier curves in `rgba(139,92,246,0.15)` using `requestAnimationFrame`. No new library required — pure Canvas 2D API. The animation uses only `transform`-equivalent canvas operations (translate, rotate) and does not trigger layout.

**Floating-label inputs:**
```html
<div class="float-field">
  <input type="text" id="profile-first" class="float-field__input" placeholder=" " required>
  <label for="profile-first" class="float-field__label">Nombre</label>
  <span class="float-field__hint" role="alert"></span>
</div>
```
CSS: label starts at `top: 50%; transform: translateY(-50%)`. On `:focus` or `:not(:placeholder-shown)`, label transitions to `top: 4px; font-size: 0.75rem; color: var(--color-accent-purple)`.

**Order timeline (per expanded order card):**
```html
<ol class="order-timeline" aria-label="Estado del pedido">
  <li class="timeline-step timeline-step--done">
    <span class="timeline-step__icon"><i class="fas fa-check"></i></span>
    <span class="timeline-step__label">Pagado</span>
    <span class="timeline-step__time">12 ene 2025</span>
  </li>
  <li class="timeline-step timeline-step--done">...</li>
  <li class="timeline-step timeline-step--active" aria-current="step">...</li>
  <li class="timeline-step">...</li>
</ol>
```

**Order search/filter:** Search input filters `_orders` array client-side (no API call). Filter tabs ("Todos", "Activos", "Completados") re-render the list. Both use `renderOrderList()` which re-renders the DOM.

**Reorder button:** Calls `addToCart()` for each available variant. Skipped variants collected and shown in a single toast: "No pudimos agregar: [names]".

---

### Cookie Consent Banner (`assets/js/cookie-consent.js`)

**HTML (injected):**
```html
<div id="cookie-banner" class="cookie-banner" role="dialog" aria-modal="false"
     aria-label="Preferencias de cookies" aria-describedby="cookie-banner-desc">
  <div class="cookie-banner__inner">
    <p id="cookie-banner-desc" class="cookie-banner__text">
      Usamos cookies para mejorar tu experiencia. 
      <a href="#privacy-policy">Política de privacidad</a>
    </p>
    <div class="cookie-banner__actions">
      <button class="btn-primary btn-sm" id="cookie-accept-all">Aceptar todo</button>
      <button class="btn-secondary btn-sm" id="cookie-essential">Solo esenciales</button>
      <button class="btn-ghost btn-sm" id="cookie-customize">Personalizar</button>
    </div>
    <!-- Expanded customize panel -->
    <div class="cookie-banner__customize" id="cookie-customize-panel" hidden>
      <label class="cookie-toggle">
        <input type="checkbox" checked disabled aria-label="Cookies esenciales (siempre activas)">
        <span>Esenciales (siempre activas)</span>
      </label>
      <label class="cookie-toggle">
        <input type="checkbox" id="cookie-analytics" aria-label="Cookies analíticas">
        <span>Analíticas</span>
      </label>
      <label class="cookie-toggle">
        <input type="checkbox" id="cookie-marketing" aria-label="Cookies de marketing">
        <span>Marketing</span>
      </label>
      <button class="btn-primary btn-sm" id="cookie-save-prefs">Guardar preferencias</button>
    </div>
  </div>
</div>
```

**Storage key:** `filamorfosis_cookie_consent`  
**Storage value:** `{ essential: true, analytics: bool, marketing: bool, timestamp: ISO8601 }`

**Language:** Reads `window.currentLang || localStorage.getItem('preferredLanguage') || 'es'`. All 6 language strings bundled in the module.

**Focus trap:** On mount, `Tab` and `Shift+Tab` cycle only within `#cookie-banner`. On dismiss, focus returns to `document.body`.

**localStorage unavailability:** Wrapped in `try/catch`; if storage throws, banner shows on every load without error.

---

### WhatsApp FAB (`assets/js/whatsapp-fab.js`)

**HTML (injected):**
```html
<a id="whatsapp-fab" class="whatsapp-fab" href="https://wa.me/13152071586?text=..."
   target="_blank" rel="noopener noreferrer"
   aria-label="Contactar por WhatsApp">
  <i class="fab fa-whatsapp" aria-hidden="true"></i>
  <span class="whatsapp-fab__ring"></span>
</a>
```

**Pre-filled messages per language:**
```js
const WA_MESSAGES = {
  es: 'Hola, me gustaría obtener más información sobre sus productos.',
  en: 'Hello, I would like to get more information about your products.',
  de: 'Hallo, ich möchte mehr Informationen über Ihre Produkte erhalten.',
  pt: 'Olá, gostaria de obter mais informações sobre seus produtos.',
  ja: 'こんにちは、製品についてもっと情報を得たいです。',
  zh: '您好，我想了解更多关于您的产品的信息。'
};
```

**CSS:** `position: fixed; bottom: 24px; right: 24px; z-index: var(--z-fab)`. On mobile (`max-width: 768px`): `bottom: 80px`. The `.whatsapp-fab__ring` is an absolutely positioned pseudo-element with `@keyframes wa-pulse`.

---

### Search Autocomplete (`assets/js/search-autocomplete.js`)

**Architecture:** Attaches to `#catSearch` input. On `input` event (debounced 150ms), runs fuzzy match against `window.PRODUCTS` array. Renders dropdown below the input.

**Fuzzy match algorithm:** Levenshtein distance ≤ 2 for strings of length ≥ 4. Also checks `includes()` for substring match. Normalizes accents (`str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')`) before comparison.

**Dropdown HTML:**
```html
<ul id="search-autocomplete-list" class="search-autocomplete" role="listbox"
    aria-label="Sugerencias de búsqueda">
  <li class="search-autocomplete__item" role="option" tabindex="-1" data-product-id="...">
    <img src="..." alt="" width="32" height="32" loading="lazy">
    <div>
      <span class="search-autocomplete__name">Taza UV Personalizada</span>
      <span class="search-autocomplete__cat">Impresión UV</span>
    </div>
  </li>
</ul>
```

**Keyboard navigation:** `ArrowDown`/`ArrowUp` move focus between items. `Enter` on an item opens the product modal. `Escape` closes the dropdown. `aria-activedescendant` on the input tracks the focused item.

**No-results state:** Shows "¿Quisiste decir [suggestion]?" if Levenshtein distance ≤ 3, plus "Ver todos los productos" CTA and 4 best-seller cards.

---

### Promotional Banner (`assets/js/promo-banner.js`)

```html
<div id="promo-banner" class="promo-banner" role="banner" aria-label="Oferta especial">
  <p class="promo-banner__text">🚀 Envío gratis en pedidos mayores a $500 MXN</p>
  <button class="promo-banner__close" aria-label="Cerrar banner">&times;</button>
</div>
```

**CSS:** `position: fixed; top: 0; left: 0; right: 0; z-index: var(--z-promo-banner)`. Navbar gets `top: var(--promo-banner-height, 0)` when banner is visible.

**Dismiss:** Sets `sessionStorage.setItem('promo_dismissed', '1')`. On init, checks this key and skips rendering if set.

---

### Trust Badges Component

Reusable HTML snippet used in cart drawer, checkout, and product modal:

```html
<div class="trust-badges" role="list" aria-label="Garantías">
  <div class="trust-badge" role="listitem">
    <i class="fas fa-lock" aria-hidden="true"></i>
    <span data-t="trust.secure">Pago seguro</span>
  </div>
  <div class="trust-badge" role="listitem">
    <i class="fas fa-medal" aria-hidden="true"></i>
    <span data-t="trust.quality">Producción garantizada</span>
  </div>
  <div class="trust-badge" role="listitem">
    <i class="fab fa-whatsapp" aria-hidden="true"></i>
    <span data-t="trust.support">Soporte 24/7</span>
  </div>
</div>
```

---

### Brand Story / Reviews Section (homepage additions)

**Brand story section** added to `index.html` after the services section:
```html
<section id="brand-story" class="brand-story-section">
  <div class="container">
    <div class="brand-story__grid">
      <div class="brand-story__text">
        <h2 class="section-title">Sobre nosotros</h2>
        <p>Filamorfosis® nació de la pasión por transformar ideas en objetos reales...</p>
        <p class="brand-story__tagline">"Tus Ideas. Tu Realidad."</p>
        <a href="#brand-story" class="btn-ghost">Conoce nuestra historia</a>
      </div>
      <div class="brand-story__image">
        <img src="assets/img/lifestyle-1.jpg" alt="Equipo Filamorfosis trabajando" loading="lazy">
      </div>
    </div>
  </div>
</section>
```

**Reviews section:**
```html
<section id="reviews" class="reviews-section">
  <div class="container">
    <h2 class="section-title">Lo que dicen nuestros clientes</h2>
    <div class="reviews-grid">
      <div class="review-card card">
        <div class="review-card__stars" aria-label="5 de 5 estrellas">★★★★★</div>
        <p class="review-card__text">"Increíble calidad en la impresión UV..."</p>
        <p class="review-card__author">María G. — Taza UV Personalizada</p>
      </div>
      <!-- 2 more review cards -->
    </div>
  </div>
</section>
```

---

## Page-by-Page Integration Plan

### index.html

New components added:
- Promotional banner (above navbar, `promo-banner.js`)
- Navbar enhancements: scroll blur, hamburger drawer
- Brand story section (after services)
- Customer reviews section (after brand story)
- Trust badges / certifications section
- WhatsApp FAB (`whatsapp-fab.js`)
- Cookie consent banner (`cookie-consent.js`)

Modified files: `main.css` (token references), `main.js` (scroll handler, drawer)

Script load order: `design-system.css` → `main.css` → vendors → `api.js` → `auth.js` → `cart.js` → `store-i18n.js` → `toast.js` → `main.js` → `promo-banner.js` → `whatsapp-fab.js` → `cookie-consent.js`

---

### products.html

New components added:
- Promotional banner
- Breadcrumb nav (`<nav aria-label="Breadcrumb">`)
- Enhanced search with autocomplete (`search-autocomplete.js`)
- Skeleton loading cards
- Urgency signal badges
- Star rating badges on cards
- Product detail modal enhancements (social proof, related products, share, design upload zone, collapsed specs, video placeholder)
- WhatsApp FAB
- Cookie consent banner

Modified files: `products.css` (token references), `products.js` (card/modal enhancements)

Script load order: `design-system.css` → `main.css` → `products.css` → catalog data scripts → `api.js` → `auth.js` → `cart.js` → `store-i18n.js` → `toast.js` → `products.js` → `search-autocomplete.js` → `promo-banner.js` → `whatsapp-fab.js` → `cookie-consent.js`

---

### checkout.html

New components added:
- Progress indicator (3 steps)
- Inline field validation
- Coupon code field
- "What happens next" panel
- Trust badges row
- Payment method logos
- Return policy badge
- Estimated delivery display
- Guest checkout option
- WhatsApp FAB
- Cookie consent banner

Modified files: `store.css` (token references), `checkout.js` (all enhancements)

Script load order: `design-system.css` → `main.css` → `store.css` → `api.js` → `auth.js` → `cart.js` → `store-i18n.js` → `toast.js` → `checkout.js` → `whatsapp-fab.js` → `cookie-consent.js`

---

### order-confirmation.html

New components added:
- Particles.js confetti (success state)
- Rewards placeholder card
- Social share section
- Guest upsell prompt
- Failure/pending state UI
- WhatsApp FAB
- Cookie consent banner

Modified files: `store.css`, inline script in page

Script load order: `design-system.css` → `main.css` → `store.css` → particles.js vendor → `api.js` → `auth.js` → `store-i18n.js` → `toast.js` → `whatsapp-fab.js` → `cookie-consent.js` → inline confirmation script

---

### account.html

New components added:
- Animated canvas background in header
- Floating-label inputs
- Order timeline component
- Order search and filter controls
- Reorder button
- Invoice placeholder button
- Animated "Agregar dirección" inline form
- Breadcrumb nav
- WhatsApp FAB
- Cookie consent banner

Modified files: `store.css`, `account.html` inline script (full rewrite of order rendering)

Script load order: `design-system.css` → `main.css` → `store.css` → `api.js` → `auth.js` → `cart.js` → `store-i18n.js` → `toast.js` → `whatsapp-fab.js` → `cookie-consent.js` → inline account script

---

## Animation and Motion Design

All animations use only `transform` and `opacity` — no layout-triggering properties.

```css
/* ── Cart badge pulse ──────────────────────────── */
@keyframes badge-pulse {
  0%   { transform: scale(1); }
  40%  { transform: scale(1.4); }
  70%  { transform: scale(0.9); }
  100% { transform: scale(1); }
}
.cart-badge--pulse { animation: badge-pulse 0.3s ease; }

/* ── Toast slide-in ────────────────────────────── */
@keyframes toast-in {
  from { opacity: 0; transform: translateX(40px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes toast-out {
  from { opacity: 1; transform: translateX(0); }
  to   { opacity: 0; transform: translateX(40px); }
}
.toast { animation: toast-in 0.25s var(--transition-spring) both; }
.toast--leaving { animation: toast-out 0.2s ease both; }

/* Mobile: slide from top */
@media (max-width: 768px) {
  @keyframes toast-in {
    from { opacity: 0; transform: translateY(-20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
}

/* ── Drawer slide-in ───────────────────────────── */
@keyframes drawer-in {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}
.cart-drawer__panel { animation: drawer-in 0.3s var(--transition-spring) both; }

/* Nav drawer (from left on mobile) */
@keyframes nav-drawer-in {
  from { transform: translateX(-100%); }
  to   { transform: translateX(0); }
}

/* ── Skeleton shimmer (defined in design-system.css) ── */
/* See .skeleton class above */

/* ── Confetti / Particles.js celebration ──────── */
/* Configured via particlesJS() call with:
   - particles.number.value: 120
   - particles.color.value: ["#8b5cf6","#ec4899","#f97316","#10b981","#fbbf24"]
   - particles.shape.type: "circle"
   - particles.move.direction: "bottom"
   - particles.move.speed: 6
   - particles.opacity.anim.enable: true
   Auto-destroyed after 3000ms via setTimeout */

/* ── WhatsApp FAB pulse ring ───────────────────── */
@keyframes wa-pulse {
  0%   { transform: scale(1);   opacity: 0.7; }
  70%  { transform: scale(1.6); opacity: 0; }
  100% { transform: scale(1.6); opacity: 0; }
}
.whatsapp-fab__ring {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px solid #25d366;
  animation: wa-pulse 2s ease-out infinite;
  pointer-events: none;
}

/* ── Floating-label transition ─────────────────── */
.float-field__label {
  position: absolute;
  top: 50%;
  left: var(--space-md);
  transform: translateY(-50%);
  font-size: var(--font-size-base);
  color: var(--color-text-muted);
  pointer-events: none;
  transition: top 0.2s ease, font-size 0.2s ease, color 0.2s ease, transform 0.2s ease;
}
.float-field__input:focus ~ .float-field__label,
.float-field__input:not(:placeholder-shown) ~ .float-field__label {
  top: 6px;
  transform: translateY(0);
  font-size: var(--font-size-xs);
  color: var(--color-accent-purple);
}

/* ── Order timeline step fill ──────────────────── */
@keyframes timeline-fill {
  from { width: 0; }
  to   { width: 100%; }
}
.timeline-step--done .timeline-step__connector {
  animation: timeline-fill 0.4s ease both;
  background: var(--color-accent-purple);
}

/* ── Address form slide-down ───────────────────── */
@keyframes slide-down {
  from { opacity: 0; transform: translateY(-12px); max-height: 0; }
  to   { opacity: 1; transform: translateY(0);     max-height: 600px; }
}
.add-addr-form-body.open { animation: slide-down 0.3s ease both; }
```

### Canvas Animation (Account Page)

The `<canvas id="account-bg-canvas">` animation is implemented inline in `account.html`:

```js
(function() {
  const canvas = document.getElementById('account-bg-canvas');
  const ctx = canvas.getContext('2d');
  const lines = Array.from({ length: 8 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
    cp1x: Math.random() * canvas.width,
    cp1y: Math.random() * canvas.height,
  }));

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(139,92,246,0.12)';
    ctx.lineWidth = 1.5;
    lines.forEach(l => {
      ctx.beginPath();
      ctx.moveTo(l.x, l.y);
      ctx.bezierCurveTo(l.cp1x, l.cp1y, l.cp1x + 80, l.cp1y + 80, l.x + 200, l.y + 100);
      ctx.stroke();
      l.x += l.vx; l.y += l.vy;
      l.cp1x += l.vx * 0.5; l.cp1y += l.vy * 0.5;
      // Wrap around
      if (l.x < 0) l.x = canvas.width;
      if (l.x > canvas.width) l.x = 0;
      if (l.y < 0) l.y = canvas.height;
      if (l.y > canvas.height) l.y = 0;
    });
    requestAnimationFrame(draw);
  }
  draw();
})();
```

---

## i18n Integration

### New Translation Keys in `store-i18n.js`

The following keys are added to all 6 language objects (ES, EN, DE, PT, JA, ZH):

```js
// Toast / notifications
'toast.added':           'Producto agregado al carrito',
'toast.removed':         'Artículo eliminado',
'toast.profileSaved':    '✓ Perfil actualizado',
'toast.linkCopied':      '¡Enlace copiado!',
'toast.invoiceSoon':     'Facturas disponibles próximamente',
'toast.couponApplied':   'Código aplicado — descuento disponible próximamente',
'toast.cartEmpty':       'Tu carrito está vacío. Agrega productos primero.',
'toast.reorderSkipped':  'No pudimos agregar:',

// Mini cart
'cart.continueShopping': 'Seguir comprando',
'cart.designWarn':       '⚠ Sube tu diseño',
'cart.emptyTitle':       'Tu carrito está vacío',
'cart.emptyAction':      'Ver productos',

// Trust badges
'trust.secure':          'Pago seguro',
'trust.quality':         'Producción garantizada',
'trust.support':         'Soporte 24/7',
'trust.ssl':             'Datos protegidos por SSL',

// Checkout enhancements
'checkout.progress.cart':     'Carrito',
'checkout.progress.shipping': 'Envío',
'checkout.progress.payment':  'Pago',
'checkout.addressQuestion':   '¿A dónde enviamos tu pedido?',
'checkout.notesQuestion':     '¿Alguna nota para nosotros?',
'checkout.payBtn':            '¡Listo! Pagar con MercadoPago',
'checkout.coupon':            'Código de descuento',
'checkout.couponApply':       'Aplicar',
'checkout.whatsNext':         '¿Qué pasa ahora?',
'checkout.whatsNext1':        'Serás redirigido a MercadoPago para pagar de forma segura.',
'checkout.whatsNext2':        'Recibirás un correo de confirmación.',
'checkout.whatsNext3':        'Tu pedido entrará en producción.',
'checkout.estimatedDelivery': 'Entrega estimada: 5–8 días hábiles',
'checkout.guestBtn':          'Continuar como invitado',
'checkout.returnPolicy':      'Política de devoluciones',

// Order confirmation
'confirmation.rewards':       '¡Ganaste puntos por esta compra! 🎉 Próximamente podrás canjearlos por descuentos.',
'confirmation.share':         '¡Acabo de hacer un pedido en Filamorfosis®! 🚀',
'confirmation.shareBtn':      'Compartir',
'confirmation.copyLink':      'Copiar enlace',
'confirmation.guestUpsell':   '¿Quieres guardar tu pedido? Crea una cuenta gratis.',
'confirmation.createAccount': 'Crear cuenta',

// Account / orders
'account.logout':             'Cerrar sesión',
'account.reorder':            'Volver a pedir',
'account.invoice':            'Descargar factura',
'account.searchOrders':       'Buscar pedidos...',
'account.filterAll':          'Todos',
'account.filterActive':       'Activos',
'account.filterDone':         'Completados',
'account.noOrdersTitle':      'Aún no tienes pedidos — ¡empieza a comprar!',
'account.noOrdersFilter':     'No encontramos pedidos con ese criterio. Intenta con otro filtro.',
'account.noOrdersCta':        'Ver productos',
'account.estimatedDelivery':  'Entrega estimada:',
'account.addAddress':         'Agregar dirección',
'account.defaultBadge':       'Predeterminada',

// Order timeline
'timeline.paid':         'Pagado',
'timeline.inProduction': 'En producción',
'timeline.shipped':      'Enviado',
'timeline.delivered':    'Entregado',

// Cookie consent
'cookie.text':           'Usamos cookies para mejorar tu experiencia.',
'cookie.privacy':        'Política de privacidad',
'cookie.acceptAll':      'Aceptar todo',
'cookie.essential':      'Solo esenciales',
'cookie.customize':      'Personalizar',
'cookie.essentialLabel': 'Esenciales (siempre activas)',
'cookie.analytics':      'Analíticas',
'cookie.marketing':      'Marketing',
'cookie.save':           'Guardar preferencias',
'cookie.ariaLabel':      'Preferencias de cookies',

// WhatsApp FAB
'whatsapp.ariaLabel':    'Contactar por WhatsApp',
'whatsapp.message':      'Hola, me gustaría obtener más información sobre sus productos.',

// Promo banner
'promo.message':         '🚀 Envío gratis en pedidos mayores a $500 MXN',
'promo.close':           'Cerrar',

// Search autocomplete
'search.noResults':      'No encontramos resultados para',
'search.didYouMean':     '¿Quisiste decir',
'search.viewAll':        'Ver todos los productos',
'search.popular':        'Productos populares',

// Product modal enhancements
'modal.socialProof':     'personas han pedido esto este mes',
'modal.urgency':         '¡Solo quedan',
'modal.urgencyEnd':      'en stock!',
'modal.share':           'Compartir',
'modal.helpSection':     '¿Necesitas ayuda?',
'modal.relatedTitle':    'Clientes también compraron',
'modal.fbtTitle':        'Frecuentemente comprado junto con',
'modal.specsTitle':      'Especificaciones técnicas',
'modal.videoSoon':       'Video del producto próximamente',
'modal.returnPolicy':    'Política de devoluciones: satisfacción garantizada',

// Design upload
'design.title':          'Sube tu diseño aquí',
'design.sub':            'Arrastra tu imagen o haz clic para seleccionar',
'design.formats':        'PNG, JPG, SVG, PDF · Máx. 20 MB',
'design.howTitle':       '¿Cómo funciona?',
'design.howText':        'Sube una foto de tu diseño, logo, o imagen favorita. Nuestro equipo la usará para personalizar tu producto.',
'design.advisory':       'Recuerda subir tu diseño antes de finalizar tu compra',
'design.errorSize':      'El archivo es demasiado grande. Máximo 20 MB.',
'design.errorType':      'Formato no permitido. Usa PNG, JPG, SVG o PDF.',

// Brand story / reviews
'brandStory.title':      'Sobre nosotros',
'brandStory.learnMore':  'Conoce nuestra historia',
'reviews.title':         'Lo que dicen nuestros clientes',
```

### Cookie Consent Banner Translations

All 6 language strings are bundled inside `cookie-consent.js` as a `COOKIE_I18N` object, following the same structure as `storeKeys` in `store-i18n.js`. The module reads `window.currentLang || localStorage.getItem('preferredLanguage') || 'es'` on initialization.

### Language Detection Pattern

All new modules follow this pattern:
```js
function getLang() {
  return window.currentLang
    || localStorage.getItem('preferredLanguage')
    || document.documentElement.lang
    || 'es';
}
```

`window.currentLang` is set by `main.js` when the user switches language, and persisted to `localStorage.preferredLanguage`. New modules read it at render time (not at module load time) so they always use the current language.

---
## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

The property-based testing library for this frontend project is **fast-check** (JavaScript). Each property test runs a minimum of 100 iterations. Tests are tagged with the format: `Feature: ux-enhancements, Property N: <property_text>`.

### Property 1: Cart total rendering accuracy

*For any* cart state containing one or more items with arbitrary unit prices and quantities, the total amount rendered in the Mini Cart drawer SHALL equal the sum of `(unitPrice × quantity)` for all items in the cart.

**Validates: Requirements 4.12**

---

### Property 2: Toast queue FIFO ordering

*For any* sequence of N toast notifications enqueued in order, the toasts SHALL be displayed and dismissed in the same first-in, first-out order — the first toast enqueued SHALL be the first one shown, and each subsequent toast SHALL appear only after the previous one has been dismissed or auto-expired.

**Validates: Requirements 4.1, 4.2**

---

### Property 3: Cookie consent persistence round-trip

*For any* consent choice (accept-all, essential-only, or any custom combination of analytics and marketing toggles), storing the choice via the cookie consent module and then re-initializing the module SHALL result in the banner not being displayed, and the stored preference object SHALL exactly match the choice that was made.

**Validates: Requirements 13.3, 13.5, 13.6, 13.7**

---

### Property 4: Cart badge count accuracy

*For any* cart state, the number displayed in the cart badge SHALL equal the sum of `quantity` across all items in the cart. This property holds after every cart mutation (add, remove, update quantity).

**Validates: Requirements 4.11, 15.13**

---

### Property 5: Variant selector price update correctness

*For any* product with two or more variants having distinct prices, selecting each variant pill in the product detail modal SHALL update the displayed price to exactly match that variant's `price` field, and the displayed price SHALL never show a value from a different variant.

**Validates: Requirements 3.6**

---

### Property 6: Search autocomplete result relevance

*For any* search query of length ≥ 2 characters and any product catalog, every suggestion returned by the autocomplete SHALL either contain the normalized query string as a substring (case-insensitive, accent-normalized) or have a Levenshtein distance ≤ 2 from the query. The number of suggestions SHALL never exceed 8.

**Validates: Requirements 14.2, 14.3**

---

### Property 7: Order timeline step ordering

*For any* order with a known status from the set `{Paid, InProduction, Shipped, Delivered}`, the rendered Order Timeline SHALL mark all steps that precede the current status as completed (filled with `--color-accent-purple`), mark the current status step as active, and mark all subsequent steps as pending (muted). The step sequence SHALL always be `Paid → InProduction → Shipped → Delivered` regardless of the order's creation date or ID.

**Validates: Requirements 12.2, 7.15**

---

### Property 8: Cookie consent language follows active language

*For any* language in the set `{es, en, de, pt, ja, zh}`, when the cookie consent banner is initialized with that language active, every visible text string in the banner SHALL match the corresponding translation in the `COOKIE_I18N` object for that language. No string from a different language SHALL appear in the banner.

**Validates: Requirements 13.8**

---

### Property 9: Urgency signal threshold invariant

*For any* product variant, the urgency signal badge ("¡Solo quedan X en stock!") SHALL be displayed if and only if `stockQuantity` is in the range `[0, 5]` (inclusive). For any `stockQuantity > 5`, the badge SHALL NOT be displayed. This invariant holds on both the product card and the product detail modal.

**Validates: Requirements 10.2**

---

### Property 10: Reorder skips unavailable variants

*For any* completed order containing a mix of available (`isAvailable = true`) and unavailable (`isAvailable = false`) product variants, clicking the "Volver a pedir" button SHALL add exactly the available variants to the cart (one item per available variant, preserving original quantity), SHALL NOT add any unavailable variant, and SHALL display a toast listing the names of all skipped unavailable variants.

**Validates: Requirements 7.17, 12.8**

---

### Property Reflection

After reviewing all 10 properties:

- Properties 1 and 4 both relate to cart state rendering. Property 1 tests total calculation; Property 4 tests badge count. These are distinct computations (total vs. count) and both provide unique value — no redundancy.
- Properties 3 and 8 both relate to cookie consent. Property 3 tests persistence round-trip; Property 8 tests language rendering. These are orthogonal — no redundancy.
- Properties 6 covers both substring match and fuzzy match (Levenshtein), subsuming what would otherwise be two separate properties. Consolidated correctly.
- Properties 7 and 10 both involve order data but test different behaviors (timeline rendering vs. reorder logic) — no redundancy.

All 10 properties provide unique validation value and are retained.

---

## Error Handling

### Network Errors

All API calls in new modules follow the existing `apiFetch` pattern from `api.js`. On failure:
- `toast.js` is called with `type: 'error'` and a localized message from `store-i18n.js`
- The UI returns to its previous state (buttons re-enabled, spinners removed)
- Raw error objects are never shown to the user

### File Upload Errors

The Design Upload Zone handles:
- File size > 20MB: inline error message, input cleared
- Unsupported MIME type: inline error message, input cleared
- `FileReader` failure: inline error message

### localStorage Unavailability

`cookie-consent.js` and `promo-banner.js` wrap all `localStorage` and `sessionStorage` calls in `try/catch`. If storage is unavailable, the modules degrade gracefully: the banner shows on every load, the promo banner shows on every load.

### Empty States

Every list-rendering component has an explicit empty state:
- Mini Cart: illustrated empty state + "Ver productos" CTA
- Order list: illustrated empty state + "Ver productos" CTA (when no orders exist)
- Order list: "No encontramos pedidos con ese criterio" (when filter/search returns nothing)
- Search autocomplete: no-results state with suggestions and popular products

### Cart Empty on Checkout

If `checkout.html` loads with an empty cart, `checkout.js` redirects to `products.html` and shows a toast: "Tu carrito está vacío. Agrega productos primero."

---

## Testing Strategy

### Unit Tests (example-based)

- Design system token completeness: parse `design-system.css` and assert all required `--color-*`, `--font-size-*`, `--space-*`, `--radius-*`, and `--z-*` tokens are defined
- Toast auto-dismiss: verify toast disappears after 3000ms
- Cookie consent "Accept All" click: verify localStorage contains `{ essential: true, analytics: true, marketing: true }`
- Cookie consent "Essential Only" click: verify localStorage contains `{ essential: true, analytics: false, marketing: false }`
- Checkout redirect on empty cart: verify redirect to products.html when cart is empty
- Design upload file size error: verify error message shown for files > 20MB
- Design upload type error: verify error message shown for unsupported types
- Promo banner dismiss: verify banner hidden after close click and sessionStorage key set
- Search no-results state: verify alternatives shown when search returns zero results

### Property-Based Tests (fast-check)

Each of the 10 Correctness Properties above is implemented as a single property-based test with minimum 100 iterations. Tests are tagged with:

```
// Feature: ux-enhancements, Property 1: Cart total rendering accuracy
// Feature: ux-enhancements, Property 2: Toast queue FIFO ordering
// Feature: ux-enhancements, Property 3: Cookie consent persistence round-trip
// Feature: ux-enhancements, Property 4: Cart badge count accuracy
// Feature: ux-enhancements, Property 5: Variant selector price update correctness
// Feature: ux-enhancements, Property 6: Search autocomplete result relevance
// Feature: ux-enhancements, Property 7: Order timeline step ordering
// Feature: ux-enhancements, Property 8: Cookie consent language follows active language
// Feature: ux-enhancements, Property 9: Urgency signal threshold invariant
// Feature: ux-enhancements, Property 10: Reorder skips unavailable variants
```

### Integration Tests

- Navbar scroll blur: verify `.navbar--scrolled` class added after scrolling > 80px
- Mobile drawer: verify drawer opens/closes and body scroll is locked/unlocked
- Cart badge animation: verify `.cart-badge--pulse` class added when count increases
- WhatsApp FAB URL: verify correct `wa.me` URL with language-appropriate pre-filled message
- Order confirmation confetti: verify Particles.js is initialized on `status=success` and destroyed after 3s

### Accessibility Checks

- All interactive elements reachable via Tab in logical DOM order
- All modals have `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
- All toast notifications rendered inside `role="status"` live region
- All images have `alt` attributes
- All form inputs have associated `<label>` elements
- Focus indicators visible on all interactive elements (no bare `outline: none`)
