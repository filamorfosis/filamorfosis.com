/**
 * account.js — Account/Profile management page
 * Handles profile editing, addresses, and orders display
 */

(function () {
  'use strict';

  /* ── Canvas animated background ─────────────────────────────────────── */
  function initAccountCanvas() {
    const canvas = document.getElementById('account-bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
      canvas.width  = canvas.offsetWidth  || canvas.parentElement.offsetWidth;
      canvas.height = canvas.offsetHeight || canvas.parentElement.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // 8 bezier curve lines
    const lines = Array.from({ length: 8 }, (_, i) => ({
      x1: Math.random() * 1200,
      y1: Math.random() * 200,
      cx1: Math.random() * 1200,
      cy1: Math.random() * 200,
      cx2: Math.random() * 1200,
      cy2: Math.random() * 200,
      x2: Math.random() * 1200,
      y2: Math.random() * 200,
      dx1: (Math.random() - 0.5) * 0.6,
      dy1: (Math.random() - 0.5) * 0.4,
      dcx1: (Math.random() - 0.5) * 0.8,
      dcy1: (Math.random() - 0.5) * 0.5,
      dcx2: (Math.random() - 0.5) * 0.8,
      dcy2: (Math.random() - 0.5) * 0.5,
      dx2: (Math.random() - 0.5) * 0.6,
      dy2: (Math.random() - 0.5) * 0.4,
    }));

    function wrap(v, max) {
      if (v < 0) return v + max;
      if (v > max) return v - max;
      return v;
    }

    let raf;
    function draw() {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(139,92,246,0.12)';
      ctx.lineWidth = 1.5;

      lines.forEach(l => {
        // animate
        l.x1  = wrap(l.x1  + l.dx1,  w);
        l.y1  = wrap(l.y1  + l.dy1,  h);
        l.cx1 = wrap(l.cx1 + l.dcx1, w);
        l.cy1 = wrap(l.cy1 + l.dcy1, h);
        l.cx2 = wrap(l.cx2 + l.dcx2, w);
        l.cy2 = wrap(l.cy2 + l.dcy2, h);
        l.x2  = wrap(l.x2  + l.dx2,  w);
        l.y2  = wrap(l.y2  + l.dy2,  h);

        ctx.beginPath();
        ctx.moveTo(l.x1, l.y1);
        ctx.bezierCurveTo(l.cx1, l.cy1, l.cx2, l.cy2, l.x2, l.y2);
        ctx.stroke();
      });

      raf = requestAnimationFrame(draw);
    }
    draw();

    // Stop animation when tab is hidden to save resources
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { cancelAnimationFrame(raf); }
      else { draw(); }
    });
  }

  /* ── Shared state ───────────────────────────────────────────────────── */
  const STATUS_COLORS = {
    Pending: '#f59e0b', PendingPayment: '#f59e0b', Paid: '#10b981',
    InProduction: '#f97316', Preparing: '#f97316', Shipped: '#8b5cf6', Delivered: '#10b981',
    Cancelled: '#ef4444', PaymentFailed: '#ef4444'
  };

  let _ordersPage = 1;

  /* ── Init ───────────────────────────────────────────────────────────── */
  async function init() {
    // Unauthenticated redirect
    try { await getMe(); } catch {
      window.FilamorfosisAuth?.showModal('login');
      document.addEventListener('auth:login', () => {
        // Reload account page after login
        if (window.FilamorfosisRouter) {
          window.FilamorfosisRouter.navigate('/account');
        }
      });
      return;
    }

    initAccountCanvas();

    // Logout button
    document.getElementById('account-logout-btn')?.addEventListener('click', () => {
      window.FilamorfosisAuth?.logout?.();
    });

    // Tab switching
    document.querySelectorAll('.account-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.account-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.account-panel').forEach(p => p.style.display = 'none');
        document.getElementById(`tab-${btn.dataset.tab}`).style.display = '';
        if (btn.dataset.tab === 'orders') {
          _loadOrders();
          _initOrdersControls();
        }
        if (btn.dataset.tab === 'addresses') _loadAddresses();
      });
    });

    await _loadProfile();

    // Inline validation
    _attachValidation('profile-first', 'hint-first', v => v.trim().length >= 1 ? null : 'Ingresa tu nombre');
    _attachValidation('profile-last',  'hint-last',  v => v.trim().length >= 1 ? null : 'Ingresa tu apellido');
    _attachValidation('profile-phone', 'hint-phone', v => !v || /^[\d\s\+\-\(\)]{7,}$/.test(v) ? null : 'Teléfono inválido');

    document.getElementById('profile-form')?.addEventListener('submit', _handleProfileSave);

    // Add address toggle
    const toggleBtn  = document.getElementById('toggle-add-addr-btn');
    const addrPanel  = document.getElementById('add-addr-panel');
    toggleBtn?.addEventListener('click', () => {
      const isOpen = addrPanel.classList.contains('open');
      addrPanel.classList.toggle('open', !isOpen);
      toggleBtn.innerHTML = isOpen
        ? '<i class="fas fa-plus"></i> Agregar dirección'
        : '<i class="fas fa-times"></i> Cancelar';
    });

    document.getElementById('add-addr-form')?.addEventListener('submit', _handleAddAddress);
  }

  /* ── Load profile ───────────────────────────────────────────────────── */
  async function _loadProfile() {
    const user = await getMe();
    document.getElementById('profile-first').value = user.firstName ?? '';
    document.getElementById('profile-last').value  = user.lastName  ?? '';
    document.getElementById('profile-phone').value = user.phoneNumber ?? '';
    document.getElementById('profile-email').value = user.email ?? '';

    // Header name + email
    const nameEl   = document.getElementById('account-header-name');
    const emailEl  = document.getElementById('account-header-email');
    const avatarEl = document.getElementById('account-avatar');

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'Usuario';
    nameEl.textContent = fullName;
    nameEl.className   = 'account-gradient-name';

    if (emailEl) emailEl.textContent = user.email ?? '';

    // Initials
    const initials = [user.firstName, user.lastName]
      .filter(Boolean)
      .map(n => n[0].toUpperCase())
      .join('') || '?';
    if (avatarEl) avatarEl.textContent = initials;
  }

  /* ── Inline validation helper ───────────────────────────────────────── */
  function _attachValidation(inputId, hintId, validate) {
    const input = document.getElementById(inputId);
    const hint  = document.getElementById(hintId);
    if (!input || !hint) return;
    input.addEventListener('input', () => {
      const err = validate(input.value);
      if (err) {
        hint.textContent = err;
        hint.className   = 'float-field__hint float-field__hint--error';
      } else if (input.value) {
        hint.textContent = '✓';
        hint.className   = 'float-field__hint float-field__hint--valid';
      } else {
        hint.textContent = '';
        hint.className   = 'float-field__hint';
      }
    });
  }

  /* ── Save profile ───────────────────────────────────────────────────── */
  async function _handleProfileSave(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true;
    try {
      await updateMe({
        firstName:   document.getElementById('profile-first').value.trim(),
        lastName:    document.getElementById('profile-last').value.trim(),
        phoneNumber: document.getElementById('profile-phone').value.trim() || null
      });
      if (window.Toast) {
        window.Toast.show({ message: '✓ Perfil actualizado', type: 'success' });
      }
      // Refresh header name/avatar
      await _loadProfile();
    } catch (err) {
      alert(err.detail || 'Error al guardar.');
    } finally {
      btn.disabled = false;
    }
  }

  /* ── Load addresses ─────────────────────────────────────────────────── */
  async function _loadAddresses() {
    const profile = await getMe();
    const list    = document.getElementById('addresses-list');
    if (!profile.addresses?.length) {
      list.innerHTML = '<p style="color:#64748b">No tienes direcciones guardadas.</p>';
      return;
    }
    list.innerHTML = profile.addresses.map((a, idx) => `
      <div class="card address-card ${idx === 0 ? 'address-card--default' : ''}" style="display:flex;align-items:flex-start;gap:1rem;margin-bottom:0.75rem">
        <i class="fas fa-map-marker-alt" style="color:#a78bfa;margin-top:2px;flex-shrink:0"></i>
        <div style="flex:1">
          <span>${_esc(a.street)}, ${_esc(a.city)}, ${_esc(a.state)} ${_esc(a.postalCode)}, ${_esc(a.country)}</span>
          ${idx === 0 ? '<span class="address-card__badge"><i class="fas fa-star" style="font-size: 1rem"></i> Predeterminada</span>' : ''}
        </div>
        <button class="btn-danger btn-sm" onclick="deleteAddress('${a.id}').then(() => window._accountLoadAddresses())">
          <i class="fas fa-trash"></i>
        </button>
      </div>`).join('');
  }

  /* ── Add address ────────────────────────────────────────────────────── */
  async function _handleAddAddress(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true;
    try {
      await addAddress({
        street:     document.getElementById('new-street').value.trim(),
        city:       document.getElementById('new-city').value.trim(),
        state:      document.getElementById('new-state').value.trim(),
        postalCode: document.getElementById('new-postal').value.trim(),
        country:    document.getElementById('new-country').value.trim()
      });
      e.target.reset();
      // Close the slide-down form
      const panel   = document.getElementById('add-addr-panel');
      const togBtn  = document.getElementById('toggle-add-addr-btn');
      panel.classList.remove('open');
      if (togBtn) togBtn.innerHTML = '<i class="fas fa-plus"></i> Agregar dirección';
      await _loadAddresses();
    } catch (err) {
      alert(err.detail || 'Error al guardar dirección.');
    } finally {
      btn.disabled = false;
    }
  }

  /* ── Orders state ───────────────────────────────────────────────────── */
  const ACTIVE_STATUSES    = new Set(['Pending','PendingPayment','Paid','Preparing','Shipped']);
  const COMPLETED_STATUSES = new Set(['Delivered','Cancelled','PaymentFailed']);
  const TIMELINE_STEPS     = ['Paid','Preparing','Shipped','Delivered'];

  let _allOrders      = [];
  let _ordersFilter   = 'all';
  let _ordersSearch   = '';

  /* ── Timeline helper ────────────────────────────────────────────────── */
  function _renderTimeline(status) {
    const currentIdx = TIMELINE_STEPS.indexOf(status);
    function tl(key, fallback) {
      return (window.t && window.t('timeline.' + key)) || fallback;
    }
    return `<div class="order-timeline">
      ${TIMELINE_STEPS.map((step, idx) => {
        let cls = 'muted';
        if (currentIdx !== -1) {
          if (idx < currentIdx)       cls = 'done';
          else if (idx === currentIdx) cls = 'active';
        }
        const labels = {
          Paid:      tl('paid',      'Pagado'),
          Preparing: tl('preparing', 'En Preparación'),
          Shipped:   tl('shipped',   'Enviado'),
          Delivered: tl('delivered', 'Entregado')
        };
        return `<div class="order-timeline__step order-timeline__step--${cls}">
          <div class="order-timeline__dot"></div>
          <span class="order-timeline__label">${labels[step]}</span>
        </div>
        ${idx < TIMELINE_STEPS.length - 1 ? `<div class="order-timeline__line order-timeline__line--${cls === 'done' ? 'done' : 'muted'}"></div>` : ''}`;
      }).join('')}
    </div>`;
  }

  /* ── Estimated delivery helper ──────────────────────────────────────── */
  function _renderEstimatedDelivery(order) {
    if (!['Preparing','Shipped'].includes(order.status)) return '';
    const base = new Date(order.createdAt);
    function addBusinessDays(date, days) {
      const d = new Date(date);
      let added = 0;
      while (added < days) {
        d.setDate(d.getDate() + 1);
        const dow = d.getDay();
        if (dow !== 0 && dow !== 6) added++;
      }
      return d;
    }
    const from = addBusinessDays(base, 5);
    const to   = addBusinessDays(base, 8);
    const fmt  = d => d.toLocaleDateString('es-MX', { day:'numeric', month:'short' });
    return `<span class="order-estimated-delivery"><i class="fas fa-truck"></i> Entrega estimada: ${fmt(from)} – ${fmt(to)}</span>`;
  }

  /* ── Order items detail renderer ────────────────────────────────────── */
  function _renderOrderItems(items) {
    return items.map(i => {
      const thumb = i.productImageUrl
        ? `<img src="${_esc(i.productImageUrl)}" alt="${_esc(i.productTitleEs)}" width="40" height="40" style="border-radius:6px;object-fit:cover;flex-shrink:0" loading="lazy">`
        : `<div style="width:40px;height:40px;border-radius:6px;background:rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#475569"><i class="fas fa-box"></i></div>`;
      return `<div class="order-item" style="display:flex;align-items:center;gap:0.75rem">
        ${thumb}
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;font-size: 1rem">${_esc(i.productTitleEs)}</div>
          <div style="color:#94a3b8;font-size: 1rem">${_esc(i.variantLabelEs)}</div>
        </div>
        <div style="text-align:right;font-size: 1rem;white-space:nowrap">
          <span style="color:#94a3b8">× ${i.quantity}</span>
          <span style="color:#a78bfa;font-weight:600;margin-left:0.5rem">${(i.unitPrice * i.quantity).toFixed(2)} MXN</span>
        </div>
      </div>`;
    }).join('');
  }

  /* ── Render a single order card ─────────────────────────────────────── */
  function _renderOrderCard(o) {
    const isDelivered = o.status === 'Delivered';
    const showInvoice = ['Paid','Shipped','Delivered'].includes(o.status);
    const estDelivery = _renderEstimatedDelivery(o);
    return `<div class="card order-card" data-order-id="${o.id}" style="margin-bottom:0.75rem">
      <div class="order-card__header" style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap">
        <span class="order-row__id">#${_esc(o.id.slice(0,8))}…</span>
        <span class="order-row__date">${new Date(o.createdAt).toLocaleDateString('es-MX')}</span>
        <span class="order-row__total">${(o.total ?? 0).toFixed(2)} MXN</span>
        <span class="order-status-badge" style="background:${STATUS_COLORS[o.status]||'#888'}">${(window.t && window.t('status.' + o.status)) || _esc(o.status)}</span>
        ${estDelivery}
        <button class="btn-sm btn-outline order-card__toggle" data-order-id="${o.id}" aria-expanded="false" style="margin-left:auto">
          <i class="fas fa-chevron-down"></i>
        </button>
      </div>
      <div class="order-card__detail" id="order-detail-${o.id}" style="display:none;margin-top:0.75rem;padding-top:0.75rem;border-top:1px solid rgba(255,255,255,0.06)">
        <div class="order-card__loading" style="color:#64748b;font-size: 1rem"><i class="fas fa-spinner fa-spin"></i> Cargando…</div>
      </div>
      <div class="order-card__actions" style="display:flex;gap:0.5rem;margin-top:0.75rem;flex-wrap:wrap">
        ${isDelivered ? `<button class="btn-sm btn-secondary order-reorder-btn" data-order-id="${o.id}"><i class="fas fa-redo"></i> Volver a pedir</button>` : ''}
        ${showInvoice ? `<button class="btn-sm btn-outline order-invoice-btn" data-order-id="${o.id}"><i class="fas fa-file-invoice"></i> Descargar factura</button>` : ''}
      </div>
    </div>`;
  }

  /* ── Render orders list from filtered set ───────────────────────────── */
  function _renderOrdersList(orders) {
    const list = document.getElementById('orders-list');
    if (!orders.length) {
      const isFiltered = _ordersFilter !== 'all' || _ordersSearch.length >= 2;
      list.innerHTML = isFiltered
        ? `<div class="orders-empty-state"><i class="fas fa-search" style="font-size:2rem;color:#64748b"></i><p style="color:#64748b;margin-top:0.75rem">No encontramos pedidos con ese criterio</p></div>`
        : `<div class="orders-empty-state"><i class="fas fa-box-open" style="font-size:3rem;color:#64748b"></i><p style="margin-top:0.75rem">Aún no tienes pedidos — ¡empieza a comprar!</p><a href="/tienda" class="btn-secondary" style="margin-top:0.75rem">Ver productos</a></div>`;
      return;
    }

    const active    = orders.filter(o => ACTIVE_STATUSES.has(o.status));
    const completed = orders.filter(o => COMPLETED_STATUSES.has(o.status));
    const other     = orders.filter(o => !ACTIVE_STATUSES.has(o.status) && !COMPLETED_STATUSES.has(o.status));

    let html = '';
    if (active.length) {
      html += `<div class="orders-section-label">Activos</div>`;
      html += active.map(_renderOrderCard).join('');
    }
    if (completed.length) {
      html += `<div class="orders-section-label" style="margin-top:1rem">Completados</div>`;
      html += completed.map(_renderOrderCard).join('');
    }
    if (other.length) {
      html += other.map(_renderOrderCard).join('');
    }
    list.innerHTML = html;

    // Expand/collapse
    list.querySelectorAll('.order-card__toggle').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id     = btn.dataset.orderId;
        const detail = document.getElementById(`order-detail-${id}`);
        const isOpen = detail.style.display !== 'none';
        if (isOpen) {
          detail.style.display = 'none';
          btn.setAttribute('aria-expanded','false');
          btn.querySelector('i').className = 'fas fa-chevron-down';
        } else {
          detail.style.display = '';
          btn.setAttribute('aria-expanded','true');
          btn.querySelector('i').className = 'fas fa-chevron-up';
          if (detail.querySelector('.order-card__loading')) {
            try {
              const order = await getOrder(id);
              detail.innerHTML = _renderTimeline(order.status) + _renderOrderItems(order.items || []);
            } catch {
              detail.innerHTML = '<p style="color:#f87171;font-size: 1rem">Error al cargar detalles.</p>';
            }
          }
        }
      });
    });

    // Reorder buttons
    list.querySelectorAll('.order-reorder-btn').forEach(btn => {
      btn.addEventListener('click', () => _handleReorder(btn.dataset.orderId));
    });

    // Invoice buttons
    list.querySelectorAll('.order-invoice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (window.Toast) window.Toast.show({ message: 'Facturas disponibles próximamente — te avisaremos cuando estén listas.', type: 'info' });
      });
    });
  }

  /* ── Apply current filter + search ──────────────────────────────────── */
  function _applyOrdersFilter() {
    let orders = _allOrders.slice();

    // Status filter
    if (_ordersFilter === 'active') {
      orders = orders.filter(o => ACTIVE_STATUSES.has(o.status));
    } else if (_ordersFilter === 'done') {
      orders = orders.filter(o => COMPLETED_STATUSES.has(o.status));
    }

    // Search filter (≥ 2 chars)
    if (_ordersSearch.length >= 2) {
      const q = _ordersSearch.toLowerCase();
      orders = orders.filter(o => {
        if (o.id.toLowerCase().includes(q)) return true;
        if (o.items?.some(i =>
          (i.productTitleEs || '').toLowerCase().includes(q) ||
          (i.productTitleEn || '').toLowerCase().includes(q)
        )) return true;
        return false;
      });
    }

    _renderOrdersList(orders);
  }

  /* ── Reorder handler ────────────────────────────────────────────────── */
  async function _handleReorder(orderId) {
    const order = _allOrders.find(o => o.id === orderId);
    if (!order) return;
    let fullOrder;
    try { fullOrder = await getOrder(orderId); } catch { return; }

    const items    = fullOrder.items || [];
    const skipped  = items.filter(i => i.isAvailable === false);
    const toAdd    = items.filter(i => i.isAvailable !== false);

    for (const item of toAdd) {
      try {
        await window.FilamorfosisCart?.addItem?.(item.variantId, item.quantity);
      } catch { /* skip on error */ }
    }

    if (skipped.length) {
      const names = skipped.map(i => i.productTitleEs || i.variantLabelEs || 'Producto').join(', ');
      if (window.Toast) window.Toast.show({ message: `Algunos productos no están disponibles y fueron omitidos: ${names}`, type: 'info' });
    }

    window.FilamorfosisCart?.openDrawer?.();
  }

  /* ── Load orders ────────────────────────────────────────────────────── */
  async function _loadOrders(page = 1) {
    _ordersPage = page;
    const list = document.getElementById('orders-list');

    // Loading skeleton
    list.innerHTML = [1,2,3].map(() => `
      <div class="card" style="margin-bottom:0.75rem;display:flex;flex-direction:column;gap:0.75rem">
        <div class="skeleton" style="height:18px;width:60%;border-radius:6px"></div>
        <div class="skeleton" style="height:14px;width:40%;border-radius:6px"></div>
        <div class="skeleton" style="height:14px;width:80%;border-radius:6px"></div>
      </div>`).join('');

    try {
      const result = await getOrders({ page, pageSize: 50 });
      _allOrders = result.items || [];

      if (!_allOrders.length) {
        _renderOrdersList([]);
        document.getElementById('orders-pagination').innerHTML = '';
        return;
      }

      _applyOrdersFilter();

      // Pagination (based on full result)
      const pages = Math.ceil((result.totalCount || _allOrders.length) / 10);
      const pag   = document.getElementById('orders-pagination');
      pag.innerHTML = pages > 1 ? Array.from({ length: pages }, (_, i) => `
        <button class="page-btn ${i + 1 === page ? 'active' : ''}" onclick="window._accountLoadOrders(${i + 1})">${i + 1}</button>
      `).join('') : '';
    } catch (err) {
      list.innerHTML = `<p style="color:#f87171">Error al cargar pedidos.</p>`;
    }
  }

  function _esc(str) {
    return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ── Init orders search/filter controls ─────────────────────────────── */
  function _initOrdersControls() {
    const searchInput = document.getElementById('orders-search');
    if (searchInput && !searchInput.dataset.bound) {
      searchInput.dataset.bound = '1';
      searchInput.addEventListener('input', () => {
        _ordersSearch = searchInput.value;
        _applyOrdersFilter();
      });
    }

    document.querySelectorAll('.orders-filter-tab').forEach(tab => {
      if (!tab.dataset.bound) {
        tab.dataset.bound = '1';
        tab.addEventListener('click', () => {
          document.querySelectorAll('.orders-filter-tab').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          _ordersFilter = tab.dataset.filter;
          _applyOrdersFilter();
        });
      }
    });
  }

  // Expose functions for global access
  window._accountLoadOrders = _loadOrders;
  window._accountLoadAddresses = _loadAddresses;
  window._initAccountPage = init;

  // Auto-init only if we're on the standalone account.html page
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      // Only auto-init if we're NOT in the SPA (no #app-view element)
      if (!document.getElementById('app-view')) {
        init();
      }
    });
  } else {
    if (!document.getElementById('app-view')) {
      init();
    }
  }

})();
