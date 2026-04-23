# Requirements Document — UX Enhancements

## Introduction

This document defines the requirements for a comprehensive UX overhaul of the Filamorfosis® online store. The initiative covers eleven areas: design system and typography, responsive navigation, product cards and detail modal, cart experience, checkout experience, order confirmation, user profile, custom design upload flow, WhatsApp floating button, marketing and conversion, and accessibility and performance.

The existing stack (vanilla HTML/CSS/JS, dark theme `#0a0e1a`, Poppins + Roboto, FontAwesome, Bootstrap grid, Swiper.js, Particles.js) is preserved. No JavaScript framework is introduced. All changes must be backward-compatible with the existing multilingual i18n system (`data-t` attributes, `window.translations`).

The goal is to transform the current functional-but-rough experience into a polished, emotionally engaging, conversion-optimized storefront that rivals top-tier e-commerce sites — while staying true to the Filamorfosis® brand identity of vibrant gradients, bold typography, and a dark futuristic aesthetic.

---

## Glossary

- **Design_System**: The shared set of CSS custom properties, typography scales, spacing tokens, and component styles applied consistently across all pages.
- **Toast**: A non-blocking, auto-dismissing notification overlay that appears briefly to confirm an action.
- **Mini_Cart**: A slide-out drawer panel showing current cart contents, totals, and a checkout CTA, accessible from the navbar without navigating away.
- **Variant_Selector**: A UI component inside the product detail modal that allows the user to choose a specific product option (size, material, finish) before adding to cart.
- **Design_Upload_Zone**: A visually prominent drag-and-drop area with instructions for uploading a custom design image.
- **Design_Preview**: A live thumbnail rendering of the uploaded design image shown to the user before and during checkout.
- **Order_Confirmation_Page**: The post-payment page (`order-confirmation.html`) shown after a successful, failed, or pending MercadoPago transaction.
- **Profile_Page**: The authenticated user account page (`account.html`) containing profile, addresses, and order history tabs.
- **WhatsApp_FAB**: The floating action button linking to the Filamorfosis WhatsApp chat, present on all pages.
- **Animated_Background**: A CSS/canvas animation themed around 3D printing, UV printing, or laser cutting, used as a decorative background on the Profile_Page.
- **Trust_Badge**: A small visual element (icon + label) communicating a trust signal such as secure payment, free returns, or production guarantee.
- **Social_Proof**: User-generated or system-generated content (reviews, ratings, purchase counts) displayed near products to reduce purchase hesitation.
- **Urgency_Signal**: A time-limited or stock-limited indicator (e.g., "Solo quedan 3 en stock") displayed near a product to encourage faster purchase decisions.
- **Core_Web_Vitals**: Google's set of performance metrics: Largest Contentful Paint (LCP), Interaction to Next Paint (INP), and Cumulative Layout Shift (CLS).
- **WCAG_AA**: Web Content Accessibility Guidelines 2.1 Level AA — the minimum accessibility standard targeted by this initiative.
- **Breadcrumb**: A secondary navigation aid showing the user's current location within the site hierarchy.
- **Progress_Indicator**: A step-by-step visual tracker shown during checkout (e.g., Cart → Shipping → Payment → Confirmation).
- **Rewards_Placeholder**: A UI element on the Order_Confirmation_Page that communicates the future rewards/points system without implementing backend logic.
- **Cookie_Consent_Banner**: A fixed UI overlay displayed on first visit that informs the user of cookie usage and collects their consent preference, persisted in `localStorage`.
- **Guest_Checkout**: A checkout flow that allows a visitor to complete a purchase without creating an account, with an optional post-purchase prompt to register.
- **Order_Timeline**: A visual step-by-step tracker displayed within an order detail view showing the progression of an order through statuses (Paid → InProduction → Shipped → Delivered).
- **Coupon_Code**: A user-entered alphanumeric code applied at checkout to receive a discount; the input field is present in the UI as a placeholder — backend validation is not required in this phase.
- **Return_Policy_Badge**: A compact UI element displayed on product pages and at checkout communicating the store's return and satisfaction policy.
- **Search_Autocomplete**: A dropdown suggestion list that appears below the search input as the user types, showing matching product names and categories in real time.
- **Lifestyle_Image**: A photograph or illustration showing a Filamorfosis® product in a real-world context (e.g., a printed figurine on a desk, a UV-printed mug in use) used to communicate brand identity and product quality.

---

## Requirements

### Requirement 1: Design System and Typography

**User Story:** As a visitor, I want all text across the site to be legible and visually consistent, so that I can read product information comfortably and trust the brand's professionalism.

#### Acceptance Criteria

1. THE Design_System SHALL define a CSS custom-property typography scale with the following minimum sizes: body text `1rem` (16px), small/caption text `0.875rem` (14px), section headings `1.5rem` (24px), page headings `2rem` (32px), hero headings `2.5rem` (40px) — all measured at the base `16px` root font size.
2. THE Design_System SHALL enforce Poppins as the heading font family and Roboto as the body font family across all pages via a single shared CSS rule set; no page SHALL override these families with a different font.
3. THE Design_System SHALL define a font-weight scale: `400` for body copy, `500` for labels and secondary headings, `600` for card titles and sub-headings, `700` for primary headings and CTAs.
4. THE Design_System SHALL define a spacing scale using CSS custom properties (`--space-xs` through `--space-2xl`) based on a 4px base unit, and all padding and margin declarations in new components SHALL reference these tokens rather than hard-coded pixel values.
5. THE Design_System SHALL define a color palette of CSS custom properties including `--color-bg-primary` (`#0a0e1a`), `--color-bg-surface` (`rgba(255,255,255,0.04)`), `--color-text-primary` (`#e2e8f0`), `--color-text-muted` (`#94a3b8`), `--color-accent-purple` (`#8b5cf6`), `--color-accent-pink` (`#ec4899`), `--color-accent-indigo` (`#6366f1`), `--color-success` (`#10b981`), `--color-warning` (`#f59e0b`), `--color-error` (`#ef4444`).
6. WHEN the Design_System is applied, THE Store SHALL render body text at a minimum contrast ratio of 4.5:1 against its background color on all pages, measured per WCAG_AA Success Criterion 1.4.3.
7. THE Design_System SHALL define a shared button component style for three variants — `btn-primary` (gradient fill), `btn-secondary` (outlined), `btn-ghost` (text-only) — with consistent padding (`12px 24px`), border-radius (`8px`), font-weight (`600`), and hover/focus/active states across all pages.
8. THE Design_System SHALL define a shared card component style with `background: var(--color-bg-surface)`, `border: 1px solid rgba(255,255,255,0.07)`, `border-radius: 14px`, and a consistent inner padding of `var(--space-lg)` applied to all product cards, profile panels, and checkout summary cards.
9. THE Design_System SHALL be delivered as a single importable CSS file (`assets/css/design-system.css`) that is loaded before all other stylesheets on every page.
10. WHEN a new page or component is added to the Store, THE Design_System SHALL provide sufficient tokens and component classes that no new hard-coded color, font-family, or pixel-based spacing value needs to be introduced.

---

### Requirement 2: Responsive Design and Navigation

**User Story:** As a mobile user, I want the navigation and layout to work flawlessly on my phone, so that I can browse and buy without pinching, zooming, or fighting with broken layouts.

#### Acceptance Criteria

1. THE Store SHALL define three responsive breakpoints as CSS custom properties: `--bp-mobile` (≤ 480px), `--bp-tablet` (481px – 768px), `--bp-desktop` (≥ 769px); all media queries in new and updated components SHALL reference these breakpoints.
2. THE Navbar SHALL display a hamburger menu icon on viewports ≤ 768px; WHEN the hamburger is tapped, THE Navbar SHALL slide in a full-height side drawer containing all navigation links, the language switcher, the cart icon with badge, and the login/logout action.
3. WHILE the mobile navigation drawer is open, THE Store SHALL prevent body scroll and display a semi-transparent backdrop behind the drawer; WHEN the backdrop is tapped, THE Store SHALL close the drawer.
4. THE Navbar SHALL remain sticky at the top of the viewport on all pages and all breakpoints, with a `z-index` high enough to appear above all page content including modals and drawers.
5. THE Navbar SHALL display the Filamorfosis® logo, the cart icon with live badge, and the user's first name (when logged in) on all breakpoints; additional nav links SHALL be hidden behind the hamburger on mobile.
6. WHEN the page is scrolled more than 80px from the top, THE Navbar SHALL apply a backdrop-blur and increased background opacity to remain legible over page content.
7. THE Store SHALL apply a mobile-first CSS approach: base styles target mobile, and `min-width` media queries progressively enhance for tablet and desktop.
8. THE product catalog grid SHALL display 1 column on mobile (≤ 480px), 2 columns on tablet (481px – 768px), and 3–4 columns on desktop (≥ 769px), using CSS Grid with `auto-fill` and `minmax`.
9. THE checkout page layout SHALL stack the order summary below the shipping form on mobile, and display them side-by-side (60/40 split) on desktop.
10. THE cart drawer panel SHALL occupy 100% of the viewport width on mobile and a fixed `420px` width on desktop.
11. IF a touch device is detected, THE Store SHALL increase all interactive tap targets to a minimum of 44×44px per WCAG_AA Success Criterion 2.5.5.
12. THE Store SHALL not display horizontal scrollbars on any page at any of the three defined breakpoints.

---

### Requirement 3: Product Cards and Detail Modal

**User Story:** As a shopper, I want clean product cards that lead me into a rich detail view where I can choose my options and add to cart, so that I make informed purchase decisions without confusion.

#### Acceptance Criteria

1. THE product card SHALL display only a "Ver detalles" (Show Details) button; THE product card SHALL NOT display an "Agregar al carrito" button directly on the card surface.
2. WHEN the "Ver detalles" button is clicked, THE Store SHALL open the product detail modal for that product.
3. THE product detail modal SHALL display a single primary CTA button labeled "Agregar al carrito"; THE modal SHALL NOT display a "Cotizar ahora" button or a "WhatsApp" button as separate CTAs alongside the add-to-cart action — those secondary actions SHALL be moved to a collapsible "¿Necesitas ayuda?" section below the primary CTA.
4. WHEN a product has one or more Variants, THE product detail modal SHALL display a Variant_Selector component before the "Agregar al carrito" button; THE "Agregar al carrito" button SHALL be disabled until a Variant is selected.
5. THE Variant_Selector SHALL render as a group of pill-shaped toggle buttons, one per Variant, showing the variant label (e.g., "30cm × 20cm", "PLA Blanco", "Madera Natural"); WHEN a pill is selected, it SHALL receive a highlighted border and background using `--color-accent-purple`.
6. WHEN a product has Variants with different prices, THE Variant_Selector SHALL update the displayed price in real time as the user selects each Variant pill.
7. THE product detail modal SHALL display a product image gallery with a large main image and thumbnail strip; WHEN a thumbnail is clicked, THE main image SHALL transition with a 200ms cross-fade animation.
8. THE product detail modal SHALL display the product title, category label, description, feature list, and pricing information in a scrollable panel that does not obscure the image gallery on desktop.
9. WHEN the product detail modal is open, THE Store SHALL trap keyboard focus within the modal and close it when the Escape key is pressed, per WCAG_AA Success Criterion 2.1.2.
10. THE product card SHALL display a skeleton loading placeholder (animated shimmer) while product data is being fetched from the API, replacing the empty card state.
11. WHEN a product is out of stock (all Variants have `isAvailable = false`), THE product card SHALL display an "Agotado" badge and THE "Ver detalles" button SHALL be replaced with a "Notificarme" button (placeholder — no backend action required in this phase).
12. THE product card image SHALL use `loading="lazy"` and display a branded placeholder with the product emoji and category color when no image is available.

---

### Requirement 4: Cart Experience

**User Story:** As a shopper, I want immediate, satisfying feedback when I add something to my cart, and I want to be able to preview and manage my cart without leaving the page I'm on, so that my shopping flow is never interrupted.

#### Acceptance Criteria

1. WHEN a product Variant is added to the cart, THE Store SHALL display a Toast notification within 300ms of the API response confirming the item was added; THE Toast SHALL show the product name, variant label, and a thumbnail image.
2. THE Toast SHALL auto-dismiss after 3 seconds and SHALL include a manual close button (×); THE Toast SHALL be positioned in the top-right corner on desktop and top-center on mobile.
3. WHEN a product Variant is added to the cart, THE Store SHALL simultaneously open the Mini_Cart drawer for 2 seconds then close it automatically, unless the user interacts with the drawer (in which case it remains open until manually closed).
4. THE Mini_Cart SHALL display each CartItem with: product thumbnail, product name, variant label, unit price, quantity stepper (− / count / +), and a remove button (trash icon).
5. THE Mini_Cart SHALL display the cart subtotal, a note about shipping calculated at checkout, and a full-width "Proceder al pago" button at the bottom of the drawer.
6. THE Mini_Cart SHALL display an empty state illustration with a "Tu carrito está vacío" message and a "Ver productos" CTA button when the cart has no items.
7. WHEN the quantity stepper in the Mini_Cart is used to reduce a CartItem quantity to zero, THE Store SHALL remove the item from the cart and display a brief "Artículo eliminado" Toast.
8. THE Mini_Cart SHALL display a "Seguir comprando" (Continue Shopping) link at the top of the drawer that closes the drawer without navigating away.
9. THE Store SHALL persist the cart state across page navigations and browser refreshes for authenticated users via the API, and for guests via the existing guest session cookie mechanism.
10. WHEN the user navigates to `checkout.html` from the Mini_Cart, THE Store SHALL preserve the scroll position of the previous page so that the back button returns the user to the same position.
11. THE cart badge in the Navbar SHALL animate (scale pulse, 300ms) each time the item count increases.
12. WHEN the cart is updated (item added, removed, or quantity changed), THE Store SHALL re-render the Mini_Cart contents and totals without a full page reload.
13. THE Mini_Cart SHALL display a design file upload indicator for CartItems that accept custom designs, showing the uploaded file name and a thumbnail if a design has been attached.

---

### Requirement 5: Checkout Experience

**User Story:** As a buyer, I want a clear, guided checkout process where I can see exactly what I'm buying, manage my shipping address, and feel confident before paying, so that I complete my purchase without second-guessing.

#### Acceptance Criteria

1. THE checkout page SHALL display a Progress_Indicator at the top showing three steps: "Carrito", "Envío", "Pago"; THE current step SHALL be visually highlighted; THE completed steps SHALL show a checkmark.
2. THE checkout page SHALL display an order summary panel containing: each CartItem's product thumbnail, product name, variant label, quantity, and line total; a subtotal row; a shipping row (showing "Calculado al confirmar" if not yet determined); and a grand total row in a larger font.
3. WHEN a CartItem in the order summary has an associated Design_File, THE checkout page SHALL display a thumbnail of the uploaded design image next to that CartItem.
4. WHEN a CartItem in the order summary has an associated Design_File, THE checkout page SHALL display a composite preview showing the product image with the uploaded design overlaid or placed adjacent, labeled "Vista previa de tu diseño".
5. THE checkout page SHALL allow the user to select a previously saved shipping address via radio buttons; WHEN no saved addresses exist, THE checkout page SHALL automatically expand the new address form.
6. THE checkout page SHALL allow the user to add a new shipping address inline without navigating away; WHEN the new address is saved, it SHALL appear in the address selector and be pre-selected.
7. THE checkout page SHALL display a "Volver al carrito" (Back to Cart) link that opens the Mini_Cart drawer without losing the checkout form state.
8. THE checkout page SHALL display a "Notas del pedido" (Order Notes) textarea for optional customization instructions.
9. WHEN the "Pagar con MercadoPago" button is clicked, THE Store SHALL disable the button and show a spinner with "Procesando..." text to prevent double submission.
10. IF the cart is empty when the user navigates to `checkout.html`, THE Store SHALL redirect the user to the catalog page and display a Toast explaining the cart is empty.
11. THE checkout page SHALL display Trust_Badges below the payment button: "Pago seguro con MercadoPago", "Producción garantizada", and "Soporte por WhatsApp".
12. THE checkout page SHALL be fully functional on mobile with all form fields, address selectors, and the payment button accessible without horizontal scrolling.
13. THE checkout page SHALL display inline field validation hints as the user types in each form field (name, email, phone, address), showing a green checkmark when the value is valid and a descriptive hint (not just an error) when the value is incomplete; THE Store SHALL NOT wait for form submission to show these hints.
14. THE checkout page SHALL use autofill-friendly `autocomplete` attribute values on all form fields: `given-name`, `family-name`, `email`, `tel`, `street-address`, `address-level2`, `address-level1`, `postal-code`, and `country-name`.
15. WHEN the user clicks "Pagar con MercadoPago", THE checkout page SHALL display a "¿Qué pasa ahora?" (What happens next?) explanation panel listing the three steps: "1. Serás redirigido a MercadoPago para pagar de forma segura. 2. Recibirás un correo de confirmación. 3. Tu pedido entrará en producción." — this panel SHALL appear before the redirect occurs.
16. THE checkout page SHALL display a Guest_Checkout option allowing a visitor to complete a purchase without creating an account; WHEN a guest completes checkout, THE Store SHALL display a soft upsell prompt ("¿Quieres guardar tu pedido? Crea una cuenta gratis") on the Order_Confirmation_Page.
17. THE checkout page SHALL display an estimated delivery date range (e.g., "Entrega estimada: 5–8 días hábiles") in the order summary panel before the user clicks the payment button; this estimate SHALL be a static range based on product category and SHALL NOT require a backend calculation in this phase.
18. THE checkout page SHALL display a Coupon_Code input field with an "Aplicar" button below the order subtotal; WHEN a code is entered and "Aplicar" is clicked, THE Store SHALL display a placeholder message "Código aplicado — descuento disponible próximamente" without making any API call.
19. THE checkout page SHALL use conversational, warm label text throughout: "¿A dónde enviamos tu pedido?" instead of "Dirección de envío", "¿Alguna nota para nosotros?" instead of "Notas del pedido", and "¡Listo! Pagar con MercadoPago" instead of "Pagar con MercadoPago".
20. THE checkout page SHALL display the logos of all supported payment methods (MercadoPago, Visa, Mastercard, OXXO, bank transfer) as small badge icons below the payment button, even if only MercadoPago is active; each logo SHALL include an `alt` attribute with the payment method name.
21. THE checkout page SHALL display a Return_Policy_Badge below the payment method logos with the text "Política de devoluciones" linking to a placeholder `#return-policy` anchor.

---

### Requirement 6: Order Confirmation Page

**User Story:** As a customer who just completed a purchase, I want to feel celebrated and proud of my order, so that I leave with a positive emotional connection to the brand and am motivated to return.

#### Acceptance Criteria

1. WHEN the Order_Confirmation_Page loads with `status=success`, THE Store SHALL display a full-screen celebratory animation (confetti burst or particle explosion using the existing Particles.js library) lasting 3 seconds.
2. THE Order_Confirmation_Page SHALL display a large success heading with a gradient text effect (matching the brand gradient), a congratulatory message in the user's selected language, and the order ID.
3. THE Order_Confirmation_Page SHALL display an order summary card containing: each OrderItem's product thumbnail, product name, variant label, quantity, and line total; the shipping address; and the grand total.
4. WHEN an OrderItem has an associated Design_File, THE Order_Confirmation_Page SHALL display the design thumbnail next to that OrderItem.
5. THE Order_Confirmation_Page SHALL display a Rewards_Placeholder section with a message such as "¡Ganaste puntos por esta compra! 🎉 Próximamente podrás canjearlos por descuentos." styled as a highlighted card with a star/trophy icon — no backend integration is required in this phase.
6. THE Order_Confirmation_Page SHALL display two CTA buttons: "Ver mis pedidos" (linking to `account.html#orders`) and "Seguir comprando" (linking to the catalog).
7. WHEN the Order_Confirmation_Page loads with `status=failure`, THE Store SHALL display an error state with a clear explanation, a "Reintentar pago" button that re-initiates the payment flow for the same order, and a WhatsApp support link.
8. WHEN the Order_Confirmation_Page loads with `status=pending`, THE Store SHALL display a pending state with an animated spinner, an explanation that the payment is being processed, and an estimated confirmation time.
9. THE Order_Confirmation_Page SHALL display a social sharing section with pre-filled share text ("¡Acabo de hacer un pedido en Filamorfosis®! 🚀") and buttons for WhatsApp share and copy-link.
10. THE Order_Confirmation_Page SHALL be visually distinct from all other pages — it SHALL use a full-viewport hero background with the brand gradient overlay and the Particles.js animation to create a premium, celebratory feel.

---

### Requirement 7: User Profile Section

**User Story:** As a registered user, I want my account page to feel as polished and exciting as the rest of the site, so that managing my profile and reviewing my orders is a pleasure rather than a chore.

#### Acceptance Criteria

1. THE Profile_Page SHALL display an Animated_Background in the page header area using a CSS/canvas animation themed around the Filamorfosis® services (e.g., animated filament extrusion lines, UV light sweep, or laser cutting sparks) implemented without any new JavaScript library.
2. THE Profile_Page header SHALL display the user's full name in a large gradient-text heading, their email address in muted text, and a circular avatar placeholder with the user's initials rendered in the brand gradient.
3. THE Profile_Page SHALL organize content into three tabs — "Perfil", "Direcciones", "Mis pedidos" — using the same tab component style as the admin panel (active tab underline in `--color-accent-purple`).
4. THE profile form fields (first name, last name, phone) SHALL use floating-label inputs: the label SHALL animate upward and shrink when the field is focused or has a value, styled with the brand accent color on focus.
5. THE profile form SHALL display inline validation feedback (green checkmark or red error message) next to each field as the user types, without waiting for form submission.
6. WHEN the profile form is submitted successfully, THE Store SHALL display a Toast notification "✓ Perfil actualizado" instead of the current plain text success message.
7. THE addresses tab SHALL display each saved address as a styled card with a location pin icon, the full address text, a "Predeterminada" badge for the default address, and a delete button.
8. THE addresses tab SHALL display an "Agregar dirección" button that expands an animated inline form (slide-down animation, 300ms) rather than using a `<details>` element.
9. THE orders tab SHALL display each order as an expandable card showing: order ID (truncated), date, total, and a color-coded status badge; WHEN expanded, the card SHALL reveal the OrderItems with product names, variant labels, quantities, and prices.
10. THE orders tab SHALL display a loading skeleton while orders are being fetched, and an illustrated empty state ("Aún no tienes pedidos — ¡empieza a comprar!") with a CTA to the catalog when no orders exist.
11. THE Profile_Page SHALL display a "Cerrar sesión" button in a clearly accessible location (top-right of the header area) styled as a ghost button with a logout icon.
12. IF the user is not authenticated when `account.html` loads, THE Store SHALL display the login modal immediately and redirect to the profile page after successful authentication.
13. THE orders tab SHALL display a search input and filter controls allowing the user to search orders by order ID or product name, and filter by status (All, Active, Completed); WHEN a filter is applied, THE Store SHALL update the displayed order list without a full page reload.
14. THE orders tab SHALL visually distinguish active orders (statuses: `Pending`, `PendingPayment`, `Paid`, `InProduction`, `Shipped`) from completed orders (statuses: `Delivered`, `Cancelled`, `PaymentFailed`) using separate labeled sections or a visual divider.
15. WHEN an order card in the orders tab is expanded, THE Store SHALL display an Order_Timeline showing each status the order has passed through as a horizontal or vertical step sequence with timestamps; completed steps SHALL be filled with `--color-accent-purple` and future steps SHALL be rendered in muted color.
16. WHEN an order card is expanded, THE Store SHALL display product thumbnail images next to each OrderItem in the detail view.
17. THE orders tab SHALL display a "Volver a pedir" (Reorder) button on each completed order card; WHEN clicked, THE Store SHALL add all OrderItems from that order back to the current cart and open the Mini_Cart drawer; IF a Variant is no longer available, THE Store SHALL skip that item and display a Toast listing the skipped items.
18. THE orders tab SHALL display a "Descargar factura" (Download Invoice) placeholder button on each paid order card; WHEN clicked, THE Store SHALL display a Toast "Facturas disponibles próximamente" — no backend action is required in this phase.
19. THE orders tab SHALL display the estimated delivery date range next to the order status badge for orders in `InProduction` or `Shipped` status, using the same static range logic as the checkout page.

---

### Requirement 8: Custom Design Upload Flow

**User Story:** As a customer ordering a personalized product, I want to clearly understand that I need to upload my design, see a preview of it, and feel confident it will be used correctly, so that I don't accidentally place an order without my customization.

#### Acceptance Criteria

1. WHEN a product Variant that accepts a Design_File is selected in the product detail modal, THE Store SHALL display a Design_Upload_Zone below the Variant_Selector and above the "Agregar al carrito" button.
2. THE Design_Upload_Zone SHALL display: a dashed-border drop area with an upload icon, the text "Sube tu diseño aquí" in bold, a sub-label "Arrastra tu imagen o haz clic para seleccionar" in muted text, and accepted format/size information ("PNG, JPG, SVG, PDF · Máx. 20 MB").
3. THE Design_Upload_Zone SHALL support both drag-and-drop and click-to-browse file selection.
4. WHEN a valid image file (PNG or JPG) is dropped or selected, THE Store SHALL display a live Design_Preview thumbnail (max 120×120px) inside the Design_Upload_Zone within 200ms, using `FileReader` API — no server round-trip is required for the preview.
5. WHEN a non-image file (SVG or PDF) is selected, THE Store SHALL display a file icon with the file name instead of an image thumbnail.
6. IF a file exceeding 20 MB or with an unsupported format is selected, THE Store SHALL display an inline error message within the Design_Upload_Zone and clear the selection.
7. THE "Agregar al carrito" button SHALL remain enabled when a design-accepting Variant is selected, even if no Design_File has been uploaded yet; THE Store SHALL display a non-blocking advisory message "Recuerda subir tu diseño antes de finalizar tu compra" below the button.
8. WHEN a CartItem with a design-accepting Variant is in the cart and no Design_File has been uploaded, THE Mini_Cart SHALL display a highlighted "⚠ Sube tu diseño" prompt with an upload icon next to that CartItem.
9. THE checkout page SHALL display the Design_Upload_Zone for any CartItem that accepts a Design_File and has not yet had a file uploaded, with the same styling as the modal upload zone.
10. WHEN a Design_File has been successfully uploaded to the API and associated with a CartItem, THE checkout page SHALL display the Design_Preview thumbnail and the file name, with an option to replace the file.
11. THE Design_Upload_Zone SHALL include a brief instructional note: "¿No sabes qué subir? Sube una foto de tu diseño, logo, o imagen favorita. Nuestro equipo la usará para personalizar tu producto." styled as a collapsible info panel (▶ "¿Cómo funciona?").

---

### Requirement 9: WhatsApp Floating Button

**User Story:** As a visitor on any page of the site, I want quick access to WhatsApp support, so that I can ask questions or request a quote without hunting for contact information.

#### Acceptance Criteria

1. THE WhatsApp_FAB SHALL be rendered on every page of the Store including `index.html`, `products.html`, `account.html`, `checkout.html`, and `order-confirmation.html`.
2. THE WhatsApp_FAB SHALL be positioned `fixed` at `bottom: 24px; right: 24px` with a `z-index` above all page content except modals and drawers.
3. THE WhatsApp_FAB SHALL display the FontAwesome WhatsApp brand icon (`fa-whatsapp`) on a green background (`#25d366`) with a circular shape (56×56px), a subtle box-shadow, and a scale-up hover animation (1.1× scale, 200ms ease).
4. WHEN the WhatsApp_FAB is clicked, THE Store SHALL open `https://wa.me/13152071586` with a pre-filled message in the user's current language (e.g., ES: "Hola, me gustaría obtener más información sobre sus productos.") in a new browser tab.
5. THE WhatsApp_FAB SHALL display a pulsing green ring animation (CSS keyframe, 2s infinite) to draw attention without being intrusive.
6. THE WhatsApp_FAB SHALL be implemented as a shared HTML snippet injected by a single JS module (`assets/js/whatsapp-fab.js`) so that it is maintained in one place and automatically present on all pages that include the script.
7. ON mobile viewports (≤ 768px), THE WhatsApp_FAB SHALL be positioned at `bottom: 80px` to avoid overlapping the mobile cart FAB.
8. THE WhatsApp_FAB SHALL include an `aria-label` attribute in the current language (e.g., "Contactar por WhatsApp") for screen reader accessibility.

---

### Requirement 10: Marketing and Conversion Optimization

**User Story:** As the business owner, I want the store to actively drive conversions through social proof, urgency signals, cross-sell opportunities, and trust-building elements, so that more visitors become paying customers.

#### Acceptance Criteria

1. THE product detail modal SHALL display a Social_Proof indicator below the product title showing a simulated or real order count (e.g., "🔥 47 personas han pedido esto este mes") using a static or API-driven count.
2. WHEN a ProductVariant has a `stockQuantity` of 5 or fewer units, THE product card and product detail modal SHALL display an Urgency_Signal badge ("¡Solo quedan X en stock!") styled in `--color-warning` to encourage faster purchase decisions.
3. THE product detail modal SHALL display a "Clientes también compraron" (Customers also bought) section showing 3–4 related product cards from the same category, rendered as a horizontal scroll strip.
4. THE checkout page order summary SHALL display Trust_Badges: a lock icon with "Pago 100% seguro", a shield icon with "Datos protegidos", and a star icon with "Calidad garantizada".
5. THE Store SHALL display a sticky promotional banner at the very top of the page (above the Navbar) on `index.html` and `products.html` with a configurable message (e.g., "🚀 Envío gratis en pedidos mayores a $500 MXN") and a close button; THE banner SHALL be dismissible and SHALL NOT reappear in the same session after dismissal.
6. THE product catalog grid SHALL display a "Más vendido" (Best Seller) badge on products tagged with `hot` and a "Nuevo" badge on products tagged with `new`, using distinct gradient pill styles.
7. THE Store SHALL display a "Recientemente visto" (Recently Viewed) horizontal strip at the bottom of the product catalog page showing the last 4 products the user viewed in the current session, stored in `sessionStorage`.
8. WHEN a user attempts to navigate away from `checkout.html` with items in the cart (via the browser back button or closing the tab), THE Store SHALL display a browser `beforeunload` confirmation dialog with the message "¿Seguro que quieres salir? Tu carrito se guardará." to reduce cart abandonment.
9. THE `index.html` hero section SHALL display a live or static counter showing total products available (e.g., "Más de 50 productos disponibles") and a "Comprar ahora" CTA button linking to the catalog.
10. EACH page SHALL include a `<meta name="description">` tag with a unique, keyword-rich description in Spanish, and a `<title>` tag following the pattern "[Page Name] — Filamorfosis® | Impresión 3D, UV y Láser en México".
11. THE Store SHALL display a "Comparte con un amigo" (Share with a Friend) button on the product detail modal that copies the product URL to the clipboard and shows a "¡Enlace copiado!" Toast.
12. THE product catalog page SHALL display a category description paragraph below the category tab strip, explaining what the category offers, to improve SEO and help users understand the product range.

---

### Requirement 11: Accessibility and Performance

**User Story:** As a user with accessibility needs or a slow internet connection, I want the store to be usable and fast, so that I am not excluded from the shopping experience.

#### Acceptance Criteria

1. THE Store SHALL ensure all interactive elements (buttons, links, form fields, modal close buttons, variant pills) are reachable and operable via keyboard Tab navigation in a logical DOM order.
2. THE Store SHALL ensure all interactive elements display a visible focus indicator (outline or box-shadow using `--color-accent-purple`) when focused via keyboard; THE Store SHALL NOT use `outline: none` without providing an equivalent custom focus style.
3. THE Store SHALL ensure all images include descriptive `alt` attributes; decorative images SHALL use `alt=""` to be ignored by screen readers.
4. THE Store SHALL ensure all form inputs have associated `<label>` elements (either explicit `for`/`id` pairing or `aria-label`) so that screen readers announce the field purpose.
5. THE Store SHALL ensure all modal dialogs include `role="dialog"`, `aria-modal="true"`, and `aria-label` or `aria-labelledby` attributes pointing to the modal title.
6. THE Store SHALL ensure all Toast notifications are announced to screen readers by rendering them inside a `role="status"` or `role="alert"` live region.
7. THE Store SHALL lazy-load all product images and gallery images using the native `loading="lazy"` attribute; images above the fold SHALL use `loading="eager"`.
8. THE Store SHALL serve all product images and uploaded design thumbnails in WebP format where the browser supports it, falling back to JPEG/PNG, to reduce image payload size.
9. THE Store SHALL inline critical CSS (above-the-fold styles for the Navbar and hero section) in a `<style>` block in the `<head>` of each page to eliminate render-blocking CSS for the initial viewport.
10. THE Store SHALL defer all non-critical JavaScript files using the `defer` attribute to prevent render-blocking during initial page load.
11. THE Store SHALL target the following Core_Web_Vitals thresholds on a simulated 4G mobile connection: LCP ≤ 2.5 seconds, INP ≤ 200 milliseconds, CLS ≤ 0.1.
12. THE Store SHALL include `<link rel="preconnect">` tags for `fonts.googleapis.com`, `fonts.gstatic.com`, and the API base URL to reduce DNS and TCP handshake latency.
13. THE Store SHALL display a Breadcrumb navigation component on `products.html` and `account.html` showing the path from Home to the current page/section, implemented as a `<nav aria-label="Breadcrumb">` with structured `<ol>` markup.
14. THE Store SHALL include `<meta name="viewport" content="width=device-width, initial-scale=1.0">` on every page to ensure correct mobile rendering.
15. IF a network request to the API fails due to a timeout or server error, THE Store SHALL display a user-friendly error Toast in the current language rather than a raw error object or blank state.

---

### Requirement 12: Enhanced Order History and Tracking

**User Story:** As a registered user, I want my order history to be rich, informative, and easy to navigate, so that I can track my purchases, reorder favorites, and feel in control of my relationship with Filamorfosis®.

#### Acceptance Criteria

1. THE orders tab SHALL display each order as a card with: a truncated order ID, the order creation date formatted in the user's locale, the grand total in MXN, a color-coded status badge, and an expand/collapse toggle.
2. WHEN an order card is expanded, THE Store SHALL display an Order_Timeline as a horizontal step sequence showing the statuses `Paid → InProduction → Shipped → Delivered`; each step SHALL display its label, a checkmark icon when completed, and the timestamp when that status was reached (if available from the API).
3. WHEN an order card is expanded, THE Store SHALL display each OrderItem with: a product thumbnail image, the product name, the variant label, the quantity, and the line total.
4. THE orders tab SHALL display a search input at the top of the section; WHEN the user types at least 2 characters, THE Store SHALL filter the displayed order list to show only orders whose order ID or any OrderItem product name contains the search string (case-insensitive), without a full page reload.
5. THE orders tab SHALL display filter tabs or a dropdown for order status groups: "Todos", "Activos" (Pending, PendingPayment, Paid, InProduction, Shipped), and "Completados" (Delivered, Cancelled, PaymentFailed); WHEN a filter is selected, THE Store SHALL update the list without a full page reload.
6. THE orders tab SHALL visually separate active orders from completed orders using a labeled section divider; active orders SHALL appear first.
7. WHEN an order has status `InProduction` or `Shipped`, THE Store SHALL display an estimated delivery date range ("Entrega estimada: [date range]") next to the status badge using a static range of 5–8 business days from the order creation date.
8. THE orders tab SHALL display a "Volver a pedir" button on each order card in `Delivered` status; WHEN clicked, THE Store SHALL add all available OrderItems to the current cart and open the Mini_Cart drawer; IF any Variant is no longer available (`isAvailable = false`), THE Store SHALL skip that item and display a Toast listing the skipped product names.
9. THE orders tab SHALL display a "Descargar factura" button on each order card with status `Paid`, `Shipped`, or `Delivered`; WHEN clicked, THE Store SHALL display a Toast notification "Facturas disponibles próximamente — te avisaremos cuando estén listas." without making any API call.
10. THE orders tab SHALL display a loading skeleton (animated shimmer rows) while the order list is being fetched from the API.
11. WHEN the order list is empty and no filter is active, THE Store SHALL display an illustrated empty state with the message "Aún no tienes pedidos — ¡empieza a comprar!" and a "Ver productos" CTA button linking to the catalog.
12. WHEN the order list is empty because a search or filter returned no results, THE Store SHALL display the message "No encontramos pedidos con ese criterio. Intenta con otro filtro." without the CTA button.

---

### Requirement 13: Cookies Consent Banner

**User Story:** As a visitor, I want to be informed about cookie usage and choose my privacy preferences, so that I can browse the site with confidence that my data is handled according to my wishes.

#### Acceptance Criteria

1. THE Cookie_Consent_Banner SHALL be displayed on every page of the Store on the user's first visit, before any non-essential cookies or tracking scripts are initialized.
2. THE Cookie_Consent_Banner SHALL be implemented as a shared JavaScript module at `assets/js/cookie-consent.js` that is included on every page; THE module SHALL inject the banner HTML into the DOM and manage all consent logic.
3. WHEN the user has previously made a consent choice, THE Cookie_Consent_Banner SHALL NOT be displayed on subsequent page loads; THE module SHALL read the stored choice from `localStorage` key `filamorfosis_cookie_consent` on initialization.
4. THE Cookie_Consent_Banner SHALL display three action buttons: "Aceptar todo" (Accept All), "Solo esenciales" (Essential Only), and "Personalizar" (Customize); each button SHALL be keyboard-focusable and operable via the Enter and Space keys.
5. WHEN "Aceptar todo" is clicked, THE Cookie_Consent_Banner SHALL store the value `{ "essential": true, "analytics": true, "marketing": true, "timestamp": "<ISO8601>" }` in `localStorage` key `filamorfosis_cookie_consent` and remove the banner from the DOM.
6. WHEN "Solo esenciales" is clicked, THE Cookie_Consent_Banner SHALL store the value `{ "essential": true, "analytics": false, "marketing": false, "timestamp": "<ISO8601>" }` in `localStorage` key `filamorfosis_cookie_consent` and remove the banner from the DOM.
7. WHEN "Personalizar" is clicked, THE Cookie_Consent_Banner SHALL expand an inline panel showing three toggle switches labeled "Esenciales (siempre activas)", "Analíticas", and "Marketing"; THE "Esenciales" toggle SHALL be permanently checked and non-interactive; WHEN the user confirms their selection via a "Guardar preferencias" button, THE Store SHALL store the resulting preference object in `localStorage` and remove the banner.
8. THE Cookie_Consent_Banner SHALL display the text in the currently selected language (ES, EN, DE, PT, JA, ZH) by reading `window.currentLang` or the `localStorage` language key; all six language translations SHALL be bundled within `cookie-consent.js`.
9. THE Cookie_Consent_Banner SHALL include a link labeled "Política de privacidad" (or its translation) that navigates to `#privacy-policy` as a placeholder anchor.
10. THE Cookie_Consent_Banner SHALL be styled to match the dark theme: background `var(--color-bg-surface)` or `rgba(10,14,26,0.97)`, border-top `1px solid rgba(255,255,255,0.1)`, text in `--color-text-primary`, and buttons using the existing `btn-primary` and `btn-secondary` component styles.
11. THE Cookie_Consent_Banner SHALL be positioned `fixed` at the bottom of the viewport with `z-index` above all page content except modals; it SHALL span the full viewport width on mobile and display as a centered card (max-width `720px`) on desktop.
12. THE Cookie_Consent_Banner SHALL include `role="dialog"`, `aria-modal="false"`, `aria-label` in the current language (e.g., "Preferencias de cookies"), and SHALL trap keyboard focus within the banner while it is visible so that Tab navigation does not reach page content behind it.
13. THE Cookie_Consent_Banner SHALL include a visible focus indicator on all interactive elements meeting WCAG_AA contrast requirements.
14. IF `localStorage` is unavailable (e.g., private browsing with storage blocked), THE Cookie_Consent_Banner SHALL display on every page load without throwing a JavaScript error; THE module SHALL catch the storage exception and degrade gracefully.

---

### Requirement 14: Product Discovery and Search Enhancement

**User Story:** As a shopper, I want powerful search and filtering tools that help me find exactly what I need quickly, so that I never leave the store empty-handed due to a failed search.

#### Acceptance Criteria

1. THE product catalog search bar SHALL be prominently displayed at the top of `products.html` with a bold border using `--color-accent-purple` and a minimum width of 280px on desktop; it SHALL be the first focusable element in the catalog section.
2. WHEN the user types at least 2 characters into the search bar, THE Store SHALL display a Search_Autocomplete dropdown within 300ms showing up to 8 matching product names and category names; each suggestion SHALL display the product name, category label, and a small thumbnail.
3. THE Search_Autocomplete SHALL apply error correction for common misspellings (e.g., "impresion" matching "impresión") using a client-side fuzzy match algorithm; no server round-trip is required for autocomplete suggestions.
4. WHEN a search returns zero results, THE Store SHALL display a "No encontramos resultados para '[term]'" message followed by: a "¿Quisiste decir [suggestion]?" correction link (if a close match exists), a "Ver todos los productos" CTA, and a curated "Productos populares" strip showing 4 best-seller products — THE Store SHALL NEVER display an empty grid without alternatives.
5. THE product catalog SHALL display a filter panel with checkbox-style filters (not dropdowns) for: material/finish attributes, price range (slider or min/max inputs in MXN), and product tags; WHEN a filter is applied, THE Store SHALL update the grid without a full page reload.
6. THE product catalog SHALL display a sort control with options: "Relevancia", "Precio: menor a mayor", "Precio: mayor a menor", "Más vendidos", "Más nuevos"; WHEN a sort option is selected, THE Store SHALL re-render the grid without a full page reload.
7. THE product catalog SHALL display a "Más vendidos" curated collection tab and a "Nuevos" curated collection tab alongside the existing category tabs; "Más vendidos" SHALL show products tagged `hot` and "Nuevos" SHALL show products tagged `new`.
8. THE product catalog navigation SHALL display a maximum of 10 category tabs; IF more than 10 categories exist, THE Store SHALL group the excess into a "Más categorías" dropdown.
9. THE Navbar on `index.html` SHALL display a maximum of 10 navigation links; any additional links SHALL be grouped into a "Más" dropdown menu.
10. THE homepage (`index.html`) SHALL feature products from at least 40% of the available product categories in its featured products or services section; the selection SHALL be updated by changing product tags in the catalog data without code changes.
11. THE homepage SHALL NOT display auto-rotating carousels on mobile viewports (≤ 768px); on mobile, carousels SHALL be replaced with a horizontally scrollable strip that the user controls manually.
12. THE product detail modal SHALL display 3 to 5 high-quality product images in the gallery; WHEN more than one image is available, THE Store SHALL display a thumbnail strip below the main image; WHEN a thumbnail is clicked, THE main image SHALL update with a 200ms cross-fade.
13. THE product detail modal SHALL include a placeholder `<video>` element with a "Video del producto próximamente" overlay for products tagged `has-video`; the element SHALL NOT autoplay and SHALL include `controls` and `aria-label` attributes.
14. THE product detail modal SHALL display all technical specification rows (dimensions, materials, finishes, turnaround time) in a vertically collapsed `<details>` section labeled "Especificaciones técnicas" that the user can expand; the section SHALL be collapsed by default.
15. THE product detail modal SHALL display a Return_Policy_Badge with the text "Política de devoluciones: satisfacción garantizada" and a link to `#return-policy`; the badge SHALL be visible without scrolling on desktop.
16. THE product detail modal SHALL display a "Frecuentemente comprado junto con" (Frequently Bought Together) section showing 2–3 related products from the same category as a horizontal card strip; clicking a card SHALL open that product's detail modal.

---

### Requirement 15: Trust, Social Proof, and Brand Storytelling

**User Story:** As a first-time visitor, I want to feel confident that Filamorfosis® is a legitimate, high-quality business with real customers and a compelling story, so that I trust the brand enough to make a purchase.

#### Acceptance Criteria

1. THE homepage (`index.html`) SHALL display a "Sobre nosotros" (About Us / Brand Story) section with a short narrative about Filamorfosis®, its founding, mission, and the types of products it creates; the section SHALL include at least one Lifestyle_Image and the brand tagline "Tus Ideas. Tu Realidad."
2. THE homepage SHALL display a customer reviews section showing at least 3 review cards, each containing: a star rating (1–5 rendered as filled/empty star icons), the reviewer's first name and initial, the review text, and the product reviewed; the data SHALL be static in this phase.
3. THE product detail modal SHALL display a star rating summary (average rating and review count) below the product title; the data SHALL be static per product in this phase.
4. THE product catalog grid SHALL display a star rating badge on each product card showing the average rating; products with no rating SHALL display "Nuevo" instead.
5. THE homepage SHALL display a "Mencionados en" (Press / As Seen In) section as a placeholder with 3–5 logo slots styled as grayscale images with a "Próximamente" overlay; the section SHALL be visually consistent with the dark theme.
6. THE homepage SHALL display a certifications and badges section showing: a "Producción en México" badge, a "Materiales certificados" badge, and a "Satisfacción garantizada" badge; each badge SHALL use a FontAwesome icon and a short label.
7. THE checkout page and product detail modal SHALL display secure payment badges: MercadoPago logo, a padlock icon with "Pago 100% seguro", and a shield icon with "Datos protegidos por SSL".
8. THE Store SHALL display multi-channel customer service links in the site footer and on the checkout page: WhatsApp (linking to the WhatsApp_FAB target), email (`mailto:` link), and Instagram (external link); each link SHALL include a FontAwesome icon and a label.
9. THE cart drawer (Mini_Cart) SHALL display a cart-level Trust_Badge strip showing "Pago seguro", "Producción garantizada", and "Soporte 24/7" as small icon+label pairs above the "Proceder al pago" button.
10. THE Store SHALL use a consistent tone of voice across all pages: warm, direct, and encouraging; all system-generated messages (Toasts, empty states, error messages, confirmation messages) SHALL use first-person plural ("Nosotros") or second-person singular ("tú") phrasing in Spanish, and equivalent natural phrasing in other supported languages.
11. THE homepage hero section SHALL display a brand storytelling tagline and a "Conoce nuestra historia" (Learn Our Story) link that scrolls to the "Sobre nosotros" section; the link SHALL be styled as a `btn-ghost` button.
12. WHILE a user is browsing `products.html` on a mobile viewport (≤ 768px), THE Store SHALL display text category links alongside category thumbnail images in the category tab strip, so that the category name is always visible without relying solely on the image.
13. THE cart icon in the Navbar SHALL always display the current item count badge, even when the count is zero (displaying "0"); the badge SHALL be visible on all pages and all scroll positions.
14. THE Store SHALL NOT display an auto-popup live chat widget or any overlay that blocks the main content on mobile viewports; customer service access SHALL be provided exclusively through the WhatsApp_FAB and the footer links.
