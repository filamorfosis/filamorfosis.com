/**
 * Filamorfosis Checkout
 * Loads cart summary, address selection, order creation, and MP redirect.
 * UX Enhancements: progress indicator, inline validation, autofill,
 * guest checkout, coupon field, "what happens next" panel, payment logos,
 * estimated delivery, conversational labels, empty-cart redirect, beforeunload.
 */

(function () {
  'use strict';

  let _selectedAddressId = null;

  /* ── 14.1 Progress Indicator ─────────────────────────────────────────── */
  function initProgressIndicator() {
    const form = document.querySelector('.checkout-form-section') ||
                 document.querySelector('form') ||
                 document.getElementById('new-address-form');
    if (!form) return;

    const ol = document.createElement('ol');
    ol.className = 'checkout-progress';
    ol.setAttribute('aria-label', 'Progreso del pago');
    ol.innerHTML = `
      <li class="checkout-progress__step checkout-progress__step--done" aria-label="Carrito completado">
        <span class="checkout-progress__icon"><i class="fas fa-check"></i></span>
        <span class="checkout-progress__label">Carrito</span>
      </li>
      <li class="checkout-progress__step checkout-progress__step--active" aria-label="Envío - paso actual">
        <span class="checkout-progress__icon">2</span>
        <span class="checkout-progress__label">Envío</span>
      </li>
      <li class="checkout-progress__step" aria-label="Pago">
        <span class="checkout-progress__icon">3</span>
        <span class="checkout-progress__label">Pago</span>
      </li>
    `;

    const checkoutPage = document.querySelector('.checkout-page') ||
                         document.querySelector('.checkout-layout') ||
                         form.parentElement;
    if (checkoutPage) {
      checkoutPage.insertBefore(ol, checkoutPage.firstChild);
    } else {
      form.parentElement.insertBefore(ol, form);
    }
  }

  /* ── 14.2 Conversational labels + autocomplete ───────────────────────── */
  function updateFormLabels() {
    // Shipping address section heading
    const shippingHeadings = document.querySelectorAll('.checkout-form-section h2, .checkout-form-section h3');
    shippingHeadings.forEach(h => {
      if (/direcci[oó]n|envío|shipping/i.test(h.textContent)) {
        h.textContent = '¿A dónde enviamos tu pedido?';
      }
    });

    // Order notes label
    const notesLabel = document.querySelector('label[for="order-notes"]');
    if (notesLabel) notesLabel.textContent = '¿Alguna nota para nosotros?';

    // Pay button text
    const payBtn = document.getElementById('checkout-pay-btn') ||
                   document.getElementById('pay-btn') ||
                   document.querySelector('.checkout-summary__pay');
    if (payBtn && !payBtn.dataset.labelUpdated) {
      payBtn.innerHTML = '<i class="fab fa-mercado-pago"></i> ¡Listo! Pagar con MercadoPago';
      payBtn.dataset.labelUpdated = '1';
    }

    // Autocomplete attributes
    const autocompleteMap = {
      'addr-first-name': 'given-name',
      'addr-last-name':  'family-name',
      'addr-email':      'email',
      'addr-phone':      'tel',
      'addr-street':     'street-address',
      'addr-city':       'address-level2',
      'addr-state':      'address-level1',
      'addr-postal':     'postal-code',
      'addr-country':    'country-name',
    };
    Object.entries(autocompleteMap).forEach(([id, ac]) => {
      const el = document.getElementById(id);
      if (el) el.setAttribute('autocomplete', ac);
    });

    // Also apply to any inputs by name/type heuristic if IDs not found
    const fieldHints = [
      { selector: 'input[name="firstName"], input[name="first_name"]', ac: 'given-name' },
      { selector: 'input[name="lastName"],  input[name="last_name"]',  ac: 'family-name' },
      { selector: 'input[type="email"]',                               ac: 'email' },
      { selector: 'input[type="tel"]',                                 ac: 'tel' },
      { selector: 'input[name="street"]',                              ac: 'street-address' },
      { selector: 'input[name="city"]',                                ac: 'address-level2' },
      { selector: 'input[name="state"]',                               ac: 'address-level1' },
      { selector: 'input[name="postalCode"], input[name="postal"]',    ac: 'postal-code' },
      { selector: 'input[name="country"]',                             ac: 'country-name' },
    ];
    fieldHints.forEach(({ selector, ac }) => {
      document.querySelectorAll(selector).forEach(el => {
        if (!el.getAttribute('autocomplete')) el.setAttribute('autocomplete', ac);
      });
    });
  }

  /* ── 14.3 Inline field validation ───────────────────────────────────── */
  function initInlineValidation() {
    const fields = document.querySelectorAll(
      '.checkout-form-section input, .checkout-form-section textarea, ' +
      '#new-address-form input, #new-address-form textarea'
    );

    fields.forEach(field => {
      // Create hint span
      const hintId = 'hint-' + (field.id || field.name || Math.random().toString(36).slice(2));
      let hint = document.getElementById(hintId);
      if (!hint) {
        hint = document.createElement('span');
        hint.id = hintId;
        hint.className = 'form-field__hint form-field__hint--info';
        hint.setAttribute('aria-live', 'polite');
        field.parentElement.appendChild(hint);
      }
      field.setAttribute('aria-describedby', hintId);

      field.addEventListener('input', () => {
        const val = field.value.trim();
        const type = field.type;
        const name = (field.name || field.id || '').toLowerCase();

        if (type === 'email' || name.includes('email')) {
          const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (emailRe.test(val)) {
            hint.textContent = '✓ Correo válido';
            hint.className = 'form-field__hint form-field__hint--valid';
          } else {
            hint.textContent = val.length ? 'Ingresa un correo válido (ej. nombre@dominio.com)' : '';
            hint.className = 'form-field__hint form-field__hint--info';
          }
        } else if (type === 'tel' || name.includes('phone') || name.includes('tel')) {
          const digits = val.replace(/\D/g, '');
          if (digits.length >= 10) {
            hint.textContent = '✓ Teléfono válido';
            hint.className = 'form-field__hint form-field__hint--valid';
          } else {
            hint.textContent = digits.length ? 'Ingresa al menos 10 dígitos' : '';
            hint.className = 'form-field__hint form-field__hint--info';
          }
        } else {
          if (val.length > 0) {
            hint.textContent = '✓';
            hint.className = 'form-field__hint form-field__hint--valid';
          } else {
            hint.textContent = '';
            hint.className = 'form-field__hint form-field__hint--info';
          }
        }
      });
    });
  }

  /* ── 14.4 Estimated delivery ─────────────────────────────────────────── */
  function addEstimatedDelivery() {
    const totalEl = document.getElementById('checkout-total');
    if (!totalEl) return;
    if (document.getElementById('checkout-estimated-delivery')) return;

    const delivery = document.createElement('p');
    delivery.id = 'checkout-estimated-delivery';
    delivery.className = 'checkout-estimated-delivery';
    delivery.innerHTML = '<i class="fas fa-truck"></i> Entrega estimada: 5–8 días hábiles';
    totalEl.parentElement.insertAdjacentElement('afterend', delivery);
  }

  /* ── 14.5 Design thumbnails in order summary ─────────────────────────── */
  function renderCheckoutItems(items) {
    const itemsEl = document.getElementById('checkout-items');
    if (!itemsEl) return;

    itemsEl.innerHTML = items.map(i => {
      const thumb = i.designFileUrl
        ? `<img src="${_esc(i.designFileUrl)}" alt="Vista previa de tu diseño" class="checkout-item__design-thumb" style="width:40px;height:40px;border-radius:6px;object-fit:cover;flex-shrink:0;">`
        : '';
      return `
        <div class="checkout-item" style="display:flex;align-items:center;gap:8px;">
          ${thumb}
          <span class="checkout-item__name">${_esc(i.productTitleEs)}</span>
          <span class="checkout-item__variant">${_esc(i.variantLabelEs)}</span>
          <span class="checkout-item__qty">× ${i.quantity}</span>
          <span class="checkout-item__price">${(i.unitPrice * i.quantity).toFixed(2)}</span>
        </div>
      `;
    }).join('');
  }

  /* ── 14.6 Coupon code field ──────────────────────────────────────────── */
  function initCouponField() {
    const totalRow = document.querySelector('.checkout-summary__total');
    if (!totalRow) return;
    if (document.getElementById('coupon-input')) return;

    const couponDiv = document.createElement('div');
    couponDiv.className = 'checkout-coupon';
    couponDiv.innerHTML = `
      <input type="text" id="coupon-input" placeholder="Código de descuento" class="form-field__input" autocomplete="off">
      <button type="button" id="coupon-apply-btn" class="btn-secondary">Aplicar</button>
    `;
    totalRow.insertAdjacentElement('beforebegin', couponDiv);

    document.getElementById('coupon-apply-btn').addEventListener('click', () => {
      if (window.Toast) {
        window.Toast.show({
          message: 'Código aplicado — descuento disponible próximamente',
          type: 'info',
          duration: 3500,
        });
      }
    });
  }

  /* ── 14.7 "¿Qué pasa ahora?" panel ──────────────────────────────────── */
  function initWhatsNextPanel() {
    const payBtn = document.getElementById('checkout-pay-btn') ||
                   document.getElementById('pay-btn') ||
                   document.querySelector('.checkout-summary__pay');
    if (!payBtn || payBtn.dataset.whatsNextBound) return;
    payBtn.dataset.whatsNextBound = '1';

    payBtn.addEventListener('click', function _whatsNextHandler(e) {
      // Only intercept if not already processing
      if (payBtn.dataset.processing) return;
      payBtn.dataset.processing = '1';

      // Disable button + spinner
      payBtn.disabled = true;
      payBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';

      // Show panel
      let panel = document.getElementById('checkout-whats-next');
      if (!panel) {
        panel = document.createElement('div');
        panel.className = 'checkout-whats-next';
        panel.id = 'checkout-whats-next';
        panel.innerHTML = `
          <h3>¿Qué pasa ahora?</h3>
          <ol>
            <li>Serás redirigido a MercadoPago para pagar de forma segura.</li>
            <li>Recibirás un correo de confirmación.</li>
            <li>Tu pedido entrará en producción.</li>
          </ol>
        `;
        payBtn.insertAdjacentElement('beforebegin', panel);
      }
      panel.style.display = '';

      // After 1.5s, proceed with actual payment
      setTimeout(() => {
        _handlePay();
      }, 1500);
    }, { once: true });
  }

  /* ── 14.8 Trust badges + payment logos ──────────────────────────────── */
  function addTrustBadges() {
    const payBtn = document.getElementById('checkout-pay-btn') ||
                   document.getElementById('pay-btn') ||
                   document.querySelector('.checkout-summary__pay');
    if (!payBtn) return;
    if (document.querySelector('.checkout-trust')) return;

    const trust = document.createElement('div');
    trust.className = 'checkout-trust';
    trust.innerHTML = `
      <div class="checkout-trust__badges">
        <span><i class="fas fa-lock"></i> Pago 100% seguro</span>
        <span><i class="fas fa-shield-alt"></i> Datos protegidos</span>
        <span><i class="fas fa-star"></i> Calidad garantizada</span>
      </div>
      <div class="checkout-payment-logos">
        <img src="assets/img/mp-logo.png" alt="MercadoPago" onerror="this.style.display='none'">
        <span class="checkout-payment-text">Visa · Mastercard · OXXO · Transferencia</span>
      </div>
      <div class="checkout-return-policy">
        <a href="#return-policy"><i class="fas fa-shield-alt"></i> Política de devoluciones</a>
      </div>
    `;
    payBtn.insertAdjacentElement('afterend', trust);
  }

  /* ── 14.9 Guest checkout ─────────────────────────────────────────────── */
  function initGuestCheckout() {
    // Only show for unauthenticated users
    const isAuthenticated = !!(
      window.FilamorfosisAuth?.isLoggedIn?.() ||
      localStorage.getItem('auth_token') ||
      localStorage.getItem('filamorfosis_token')
    );
    if (isAuthenticated) return;

    const form = document.querySelector('.checkout-form-section') ||
                 document.querySelector('form');
    if (!form) return;
    if (document.getElementById('guest-checkout-btn')) return;

    const guestBtn = document.createElement('button');
    guestBtn.type = 'button';
    guestBtn.id = 'guest-checkout-btn';
    guestBtn.className = 'btn-secondary checkout-guest-btn';
    guestBtn.textContent = 'Continuar como invitado';

    form.insertAdjacentElement('beforebegin', guestBtn);

    guestBtn.addEventListener('click', () => {
      window._guestCheckout = true;
      guestBtn.style.display = 'none';
    });
  }

  /* ── 14.10 Empty cart redirect ───────────────────────────────────────── */
  function checkEmptyCartRedirect() {
    // Check cart via mock state in localStorage (key: _mockState)
    let isEmpty = false;

    try {
      const raw = localStorage.getItem('_mockState');
      if (raw) {
        const state = JSON.parse(raw);
        const items = (state.cart && state.cart.items) || [];
        isEmpty = items.length === 0;
      } else {
        // No mock state yet — don't redirect, let the cart load normally
        isEmpty = false;
      }
    } catch {
      isEmpty = false;
    }

    if (isEmpty) {
      if (window.Toast) {
        window.Toast.show({
          message: 'Tu carrito está vacío. Agrega productos primero.',
          type: 'info',
          duration: 4000,
        });
      }
      setTimeout(() => {
        window.location.href = 'index.html#catalog';
      }, 300);
      return true;
    }
    return false;
  }

  /* ── 14.11 beforeunload listener ─────────────────────────────────────── */
  function initBeforeUnload() {
    window.addEventListener('beforeunload', (e) => {
      let hasItems = false;

      if (window.FilamorfosisCart) {
        const items = window.FilamorfosisCart.getItems?.() || [];
        hasItems = items.length > 0;
      } else {
        try {
          const raw = localStorage.getItem('filamorfosis_cart') ||
                      localStorage.getItem('cart');
          if (raw) {
            const parsed = JSON.parse(raw);
            const items = Array.isArray(parsed) ? parsed : (parsed.items || []);
            hasItems = items.length > 0;
          }
        } catch {
          hasItems = false;
        }
      }

      if (hasItems) {
        e.preventDefault();
        e.returnValue = '¿Seguro que quieres salir? Tu carrito se guardará.';
        return e.returnValue;
      }
    });
  }

  /* ── Original cart loader (updated to use renderCheckoutItems) ────────── */
  async function _loadCart() {
    try {
      const cart = await getCart();
      const totalEl = document.getElementById('checkout-total');

      if (!cart?.items?.length) {
        const itemsEl = document.getElementById('checkout-items');
        if (itemsEl) itemsEl.innerHTML = '<p data-t="cart.empty">Tu carrito está vacío.</p>';
        const payBtn = document.getElementById('checkout-pay-btn') ||
                       document.getElementById('pay-btn') ||
                       document.querySelector('.checkout-summary__pay');
        if (payBtn) payBtn.disabled = true;
        return;
      }

      renderCheckoutItems(cart.items);

      if (totalEl) totalEl.textContent = `${(cart.total ?? 0).toFixed(2)} MXN`;

      // Add estimated delivery after total is set
      addEstimatedDelivery();
    } catch (err) {
      // cart load failed — UI remains empty
    }
  }

  async function _loadAddresses() {
    try {
      const profile = await getMe();
      const addresses = profile.addresses ?? [];
      const container = document.getElementById('saved-addresses');

      if (!addresses.length) {
        document.getElementById('new-address-details')?.setAttribute('open', '');
        return;
      }

      container.innerHTML = addresses.map((a, idx) => `
        <label class="address-option ${idx === 0 ? 'selected' : ''}">
          <input type="radio" name="shipping-address" value="${a.id}" ${idx === 0 ? 'checked' : ''}>
          <span>${_esc(a.street)}, ${_esc(a.city)}, ${_esc(a.state)} ${_esc(a.postalCode)}, ${_esc(a.country)}</span>
        </label>
      `).join('');

      _selectedAddressId = addresses[0].id;

      container.querySelectorAll('input[name="shipping-address"]').forEach(radio => {
        radio.addEventListener('change', e => {
          _selectedAddressId = e.target.value;
          container.querySelectorAll('.address-option').forEach(el => el.classList.remove('selected'));
          e.target.closest('.address-option')?.classList.add('selected');
        });
      });
    } catch (err) {
      // Not authenticated — show new address form for guest
      document.getElementById('new-address-details')?.setAttribute('open', '');
    }
  }

  async function _handleNewAddress(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true;
    try {
      const addr = await addAddress({
        street:     document.getElementById('addr-street').value.trim(),
        city:       document.getElementById('addr-city').value.trim(),
        state:      document.getElementById('addr-state').value.trim(),
        postalCode: document.getElementById('addr-postal').value.trim(),
        country:    document.getElementById('addr-country').value.trim()
      });
      _selectedAddressId = addr.id;
      await _loadAddresses();
      document.getElementById('new-address-details')?.removeAttribute('open');
    } catch (err) {
      // address save failed — button re-enabled, user can retry
    } finally {
      btn.disabled = false;
    }
  }

  async function _handlePay() {
    const errEl = document.getElementById('checkout-error');
    if (errEl) errEl.textContent = '';

    if (!_selectedAddressId && !window._guestCheckout) {
      if (errEl) errEl.textContent = 'Selecciona o agrega una dirección de envío.';
      const payBtn = document.getElementById('checkout-pay-btn') ||
                     document.getElementById('pay-btn') ||
                     document.querySelector('.checkout-summary__pay');
      if (payBtn) {
        payBtn.disabled = false;
        payBtn.innerHTML = '<i class="fab fa-mercado-pago"></i> ¡Listo! Pagar con MercadoPago';
        delete payBtn.dataset.processing;
      }
      return;
    }
    try {
      const notes = document.getElementById('order-notes')?.value.trim() || null;
      const order = await createOrder({ shippingAddressId: _selectedAddressId, notes });
      const payment = await createPayment(order.orderId);
      window.location.href = payment.checkoutUrl;
    } catch (err) {
      if (errEl) errEl.textContent = err.detail || 'Error al procesar el pago. Intenta de nuevo.';
      const payBtn = document.getElementById('checkout-pay-btn') ||
                     document.getElementById('pay-btn') ||
                     document.querySelector('.checkout-summary__pay');
      if (payBtn) {
        payBtn.disabled = false;
        payBtn.innerHTML = '<i class="fab fa-mercado-pago"></i> ¡Listo! Pagar con MercadoPago';
        delete payBtn.dataset.processing;
      }
    }
  }

  function _esc(str) {
    return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ── Main init ───────────────────────────────────────────────────────── */
  async function init() {
    // 14.10 — check empty cart first (before auth check for guest flow)
    if (checkEmptyCartRedirect()) return;

    // 14.11 — beforeunload
    initBeforeUnload();

    // 14.1 — progress indicator
    initProgressIndicator();

    // 14.9 — guest checkout (before auth redirect so guests see the button)
    initGuestCheckout();

    // Redirect if not authenticated (and not guest)
    if (!window._guestCheckout) {
      try {
        await getMe();
      } catch {
        // Not authenticated — auto-enable guest checkout instead of blocking
        window._guestCheckout = true;
        const guestBtn = document.getElementById('guest-checkout-btn');
        if (guestBtn) guestBtn.style.display = 'none';
      }
    }

    await Promise.all([_loadCart(), _loadAddresses()]);

    document.getElementById('new-address-form')?.addEventListener('submit', _handleNewAddress);

    // 14.2 — conversational labels + autocomplete
    updateFormLabels();

    // 14.3 — inline validation
    initInlineValidation();

    // 14.6 — coupon field
    initCouponField();

    // 14.7 — "what happens next" panel (binds to pay button)
    initWhatsNextPanel();

    // 14.8 — trust badges
    addTrustBadges();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ── Expose for testing ──────────────────────────────────────────────── */
  window._checkoutModule = {
    checkEmptyCartRedirect,
    initCouponField,
    initWhatsNextPanel,
    addTrustBadges,
    initProgressIndicator,
    updateFormLabels,
    initInlineValidation,
    addEstimatedDelivery,
    initGuestCheckout,
    initBeforeUnload,
    renderCheckoutItems,
  };

})();
