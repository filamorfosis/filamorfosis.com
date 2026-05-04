/**
 * Filamorfosis Cart Module
 * Cart drawer, state management, badge, add-to-cart animation, design file upload.
 */

(function () {
  'use strict';

  // ── State ──────────────────────────────────────────────────────────────────
  let _cart = { id: null, items: [], total: 0 };
  let _autoCloseTimer = null;

  // ── Drawer HTML ────────────────────────────────────────────────────────────
  const DRAWER_HTML = `
<div id="cart-drawer" class="cart-drawer" aria-label="Carrito de compras" role="complementary">
  <div class="cart-drawer__backdrop"></div>
  <div class="cart-drawer__panel card">
    <div class="cart-drawer__header">
      <a href="#" class="cart-drawer__continue" id="cart-continue-link" data-t="cart_continue_shopping" aria-label="Seguir comprando">
        <i class="fas fa-arrow-left"></i> <span data-t="cart_continue_shopping">Seguir comprando</span>
      </a>
      <h2 data-t="cart_title">Carrito</h2>
      <button class="cart-drawer__close" aria-label="Cerrar carrito">&times;</button>
    </div>
    <div class="cart-drawer__items" id="cart-items-list"></div>
    <div class="cart-drawer__footer" id="cart-footer">
      <div class="cart-drawer__total">
        <span data-t="cart_total">Total:</span>
        <strong id="cart-total-amount">$0 MXN</strong>
      </div>
      <p class="cart-drawer__shipping-note" data-t="cart_shipping_note">Envío calculado al confirmar</p>
      <div class="cart-trust-badges">
        <div class="cart-trust-badge"><i class="fas fa-lock"></i> <span data-t="cart_trust_secure">Pago seguro</span></div>
        <div class="cart-trust-badge"><i class="fas fa-star"></i> <span data-t="cart_trust_quality">Producción garantizada</span></div>
        <div class="cart-trust-badge"><i class="fas fa-headset"></i> <span data-t="cart_trust_support">Soporte 24/7</span></div>
      </div>
      <a href="/checkout" class="btn-primary cart-drawer__checkout" id="cart-checkout-btn" data-t="cart_checkout">
        Proceder al pago
      </a>
    </div>
  </div>
</div>
`;

  // ── Init ───────────────────────────────────────────────────────────────────
  function init() {
    document.body.insertAdjacentHTML('beforeend', DRAWER_HTML);
    _bindEvents();
    loadCart();

    // Listen for auth events to reload cart
    document.addEventListener('auth:login', () => loadCart());
    document.addEventListener('auth:restored', () => loadCart());
    document.addEventListener('auth:logout', () => {
      _cart = { id: null, items: [], total: 0 };
      _render();
    });

    // Show FAB on mobile — handled by mobile-cart-fab in index.html
  }

  function _cancelAutoClose() {
    if (_autoCloseTimer) {
      clearTimeout(_autoCloseTimer);
      _autoCloseTimer = null;
    }
  }

  function _bindEvents() {
    document.querySelector('.cart-drawer__close')?.addEventListener('click', closeDrawer);
    document.querySelector('.cart-drawer__backdrop')?.addEventListener('click', closeDrawer);

    // "Seguir comprando" link closes drawer without navigating
    document.getElementById('cart-continue-link')?.addEventListener('click', function (e) {
      e.preventDefault();
      closeDrawer();
    });

    // Cancel auto-close on any interaction with the drawer panel
    document.querySelector('.cart-drawer__panel')?.addEventListener('mouseenter', _cancelAutoClose);
    document.querySelector('.cart-drawer__panel')?.addEventListener('touchstart', _cancelAutoClose, { passive: true });
    document.querySelector('.cart-drawer__panel')?.addEventListener('click', _cancelAutoClose);

    // Delegated events on items list
    document.getElementById('cart-items-list')?.addEventListener('click', async e => {
      const btn = e.target.closest('[data-cart-action]');
      if (!btn) return;
      const action = btn.dataset.cartAction;
      const itemId = btn.dataset.itemId;

      if (action === 'remove') await removeItem(itemId);
      if (action === 'inc') {
        const item = _cart.items.find(i => i.id === itemId);
        if (item) await updateItem(itemId, item.quantity + 1);
      }
      if (action === 'dec') {
        const item = _cart.items.find(i => i.id === itemId);
        if (item) await updateItem(itemId, item.quantity - 1);
      }
    });

    // Design file upload
    document.getElementById('cart-items-list')?.addEventListener('change', async e => {
      if (e.target.matches('[data-design-upload]')) {
        const file = e.target.files[0];
        const itemId = e.target.dataset.itemId;
        if (file && itemId) await uploadDesignFile(itemId, file);
      }
    });
  }

  // ── Load & render ──────────────────────────────────────────────────────────
  async function loadCart() {
    try {
      _cart = await getCart();
      _render();
    } catch {
      // Not logged in or no cart yet — show empty
      _cart = { id: null, items: [], total: 0 };
      _render();
    }
  }

  function _render() {
    const list = document.getElementById('cart-items-list');
    const totalEl = document.getElementById('cart-total-amount');
    const count = _cart.items?.reduce((s, i) => s + i.quantity, 0) ?? 0;

    // Update badge
    document.querySelectorAll('#cart-count, #mobile-cart-count').forEach(el => {
      var prevCount = parseInt(el.textContent) || 0;
      if (count > prevCount) {
        el.classList.remove('cart-badge--pulse');
        void el.offsetWidth; // reflow
        el.classList.add('cart-badge--pulse');
        setTimeout(function() { el.classList.remove('cart-badge--pulse'); }, 300);
      }
      el.textContent = count;
      if (count === 0) {
        el.classList.add('cart-badge--hidden');
      } else {
        el.classList.remove('cart-badge--hidden');
      }
    });

    if (!list) return;

    // Empty state
    if (!_cart.items?.length) {
      list.innerHTML = `
        <div class="cart-empty-state">
          <i class="fas fa-shopping-cart" style="font-size:3rem;opacity:0.3;display:block;margin-bottom:16px"></i>
          <p data-t="cart_empty_message">Tu carrito está vacío</p>
          <button class="btn-secondary cart-empty-cta" onclick="window.FilamorfosisCart.closeDrawer();if(window._spaNavigate)window._spaNavigate('#catalog');else window.location.hash='#catalog';" data-t="cart_empty_cta">Ver productos</button>
        </div>`;
      if (totalEl) totalEl.textContent = '$0 MXN';
      // Hide footer checkout button when empty
      const footer = document.getElementById('cart-footer');
      if (footer) footer.style.display = 'none';
      return;
    }

    // Show footer when items exist
    const footer = document.getElementById('cart-footer');
    if (footer) footer.style.display = '';

    list.innerHTML = _cart.items.map(item => {
      const thumb = item.thumbnailUrl
        ? `<img src="${_esc(item.thumbnailUrl)}" alt="${_esc(item.productTitleEs)}" width="48" height="48" class="cart-item__thumb" loading="lazy">`
        : `<div class="cart-item__thumb cart-item__thumb--placeholder"><i class="fas fa-box"></i></div>`;

      const designWarn = (item.acceptsDesignFile === true && !item.designFileName)
        ? `<div class="cart-design-warn"><i class="fas fa-upload"></i> <span>⚠ Sube tu diseño</span></div>`
        : '';

      const designLabel = item.acceptsDesignFile ? `
        <label class="cart-item__design-label">
          <i class="fas fa-paperclip"></i>
          ${item.designFileName ? _esc(item.designFileName) : '<span data-t="cart_upload_design">Subir diseño</span>'}
          <input type="file" data-design-upload data-item-id="${item.id}"
            accept=".png,.jpg,.jpeg,.svg,.pdf" style="display:none">
        </label>
      ` : '';

      return `
      <div class="cart-item" data-item-id="${item.id}">
        ${thumb}
        <div class="cart-item__info">
          <p class="cart-item__title">${_esc(item.productTitleEs)}</p>
          <p class="cart-item__variant">${_esc(item.variantLabelEs)}</p>
          <p class="cart-item__price">${
            item.originalPrice && item.originalPrice > item.unitPrice
              ? `<span style="text-decoration:line-through;color:#64748b;font-size:1rem;margin-right:4px">${item.originalPrice.toFixed(2)}</span><span style="color:#fb923c;font-weight:700">${item.unitPrice.toFixed(2)} MXN</span>`
              : `${item.unitPrice.toFixed(2)} MXN`
          }</p>
          ${designLabel}
          ${designWarn}
        </div>
        <div class="cart-item__qty">
          <button class="qty-btn" data-cart-action="dec" data-item-id="${item.id}" aria-label="Reducir cantidad">−</button>
          <span>${item.quantity}</span>
          <button class="qty-btn" data-cart-action="inc" data-item-id="${item.id}" aria-label="Aumentar cantidad">+</button>
        </div>
        <button class="cart-item__remove" data-cart-action="remove" data-item-id="${item.id}" aria-label="Eliminar">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
    }).join('');

    if (totalEl) totalEl.textContent = `${(_cart.total ?? 0).toFixed(2)} MXN`;
  }

  // ── Cart operations ────────────────────────────────────────────────────────
  async function addItem(variantId, qty = 1, notes = null, productName = '', variantLabel = '', thumbnailUrl = '') {
    try {
      _cart = await addToCart({ productVariantId: variantId, quantity: qty, customizationNotes: notes });
      _render();
      _flyToCart();

      // Toast notification within 300ms of API response
      if (window.Toast && window.Toast.show) {
        window.Toast.show({
          message: 'Agregado: ' + (productName || 'Producto'),
          type: 'success',
          thumbnail: thumbnailUrl || null
        });
      }

      // Auto-open drawer for 2 seconds then auto-close
      openDrawer();
      _cancelAutoClose();
      _autoCloseTimer = setTimeout(function () {
        _autoCloseTimer = null;
        closeDrawer();
      }, 2000);

    } catch (err) {
      if (err.status === 401) window.FilamorfosisAuth?.showModal('login');
    }
  }

  async function updateItem(itemId, qty) {
    try {
      if (qty <= 0) {
        // Remove item and show toast
        _cart = await removeCartItem(itemId);
        _render();
        if (window.Toast && window.Toast.show) {
          const t = window.FilamorfosisI18n && window.FilamorfosisI18n[localStorage.getItem('preferredLanguage') || 'es']
            ? (key) => window.FilamorfosisI18n[localStorage.getItem('preferredLanguage') || 'es'][key] || key
            : (key) => key;
          window.Toast.show({ message: t('cart_item_removed'), type: 'info' });
        }
        return;
      }
      _cart = await updateCartItem(itemId, qty);
      _render();
    } catch (err) { /* update failed — UI unchanged */ }
  }

  async function removeItem(itemId) {
    try {
      _cart = await removeCartItem(itemId);
      _render();
    } catch (err) { /* remove failed — UI unchanged */ }
  }

  async function uploadDesignFile(itemId, file) {
    try {
      await uploadDesign(itemId, file);
      await loadCart();
    } catch (err) { /* upload failed silently */ }
  }

  // ── Drawer ─────────────────────────────────────────────────────────────────
  function openDrawer() {
    document.getElementById('cart-drawer')?.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    _cancelAutoClose();
    document.getElementById('cart-drawer')?.classList.remove('open');
    document.body.style.overflow = '';
  }

  // ── Add-to-cart animation ──────────────────────────────────────────────────
  function _flyToCart(sourceEl) {
    const cartIcon = document.querySelector('.cart-icon, #cart-nav-icon');
    if (!cartIcon || !sourceEl) return;

    const clone = sourceEl.cloneNode(true);
    const srcRect = sourceEl.getBoundingClientRect();
    const dstRect = cartIcon.getBoundingClientRect();

    Object.assign(clone.style, {
      position: 'fixed',
      top: srcRect.top + 'px',
      left: srcRect.left + 'px',
      width: '40px',
      height: '40px',
      objectFit: 'cover',
      borderRadius: '50%',
      zIndex: 9999,
      transition: 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      pointerEvents: 'none',
      opacity: '1'
    });

    document.body.appendChild(clone);
    requestAnimationFrame(() => {
      Object.assign(clone.style, {
        top: dstRect.top + 'px',
        left: dstRect.left + 'px',
        width: '10px',
        height: '10px',
        opacity: '0'
      });
    });
    setTimeout(() => clone.remove(), 700);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  function _esc(str) {
    return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  window.FilamorfosisCart = { init, loadCart, addItem, updateItem, removeItem, openDrawer, closeDrawer };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
