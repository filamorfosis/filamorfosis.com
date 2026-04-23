/**
 * admin-orders.js — Orders tab module for admin.html
 *
 * Responsibilities:
 *   - Paginated, filterable order list (by status and search)
 *   - Order detail modal with items, address, customer info
 *   - Status advancement control (state machine: Paid → Preparing → Shipped → Delivered)
 *   - Design files viewer (opens presigned S3 URLs in new tabs)
 *
 * Depends on globals: adminApi, toast, spin, renderPagination, statusBadge
 *                     (from admin-ui.js and admin-api.js)
 *
 * Requirements: 5.1, 5.2, 5.9, 5.10, 5.11, 5.12, 5.13, 5.14, 5.15, 7.11
 */

(function (window) {
  'use strict';

  // ── HTML escape helper ────────────────────────────────────────────────────
  function esc(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── Module state ──────────────────────────────────────────────────────────
  const state = {
    page: 1,
    pageSize: 20,
    status: '',
    search: '',
    total: 0,
    items: []
  };

  // ── Status advancement map ────────────────────────────────────────────────
  // Mirrors the AllowedTransitions state machine on the backend.
  const NEXT_STATUS = {
    Paid:      { next: 'Preparing', label: 'Marcar como Preparando' },
    Preparing: { next: 'Shipped',   label: 'Marcar como Enviado'    },
    Shipped:   { next: 'Delivered', label: 'Marcar como Entregado'  }
  };

  // ── Format helpers ────────────────────────────────────────────────────────
  function truncateId(id) {
    return id ? id.substring(0, 8).toUpperCase() + '…' : '—';
  }

  function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-MX', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount ?? 0);
  }

  // ── Load orders ───────────────────────────────────────────────────────────
  async function loadOrders() {
    const tbody = document.getElementById('orders-tbody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:#64748b">' +
        '<i class="fas fa-spinner fa-spin"></i> Cargando...</td></tr>';
    }
    try {
      const params = { page: state.page, pageSize: state.pageSize };
      if (state.status) params.status = state.status;
      if (state.search) params.search = state.search;

      const result = await adminApi.adminGetOrders(params);
      state.items = result.items || result || [];
      state.total = result.total ?? state.items.length;
      renderOrdersTable();
      renderPagination('orders-pagination', state, goToPage);
    } catch (e) {
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="6" style="color:#f87171;text-align:center;padding:24px">' +
          '<i class="fas fa-exclamation-triangle"></i> Error al cargar pedidos</td></tr>';
      }
    }
  }

  // ── Render orders table ───────────────────────────────────────────────────
  function renderOrdersTable() {
    const tbody = document.getElementById('orders-tbody');
    if (!tbody) return;

    // Wire status filter (once)
    const statusFilter = document.getElementById('orders-status-filter');
    if (statusFilter && !statusFilter._wired) {
      statusFilter._wired = true;
      statusFilter.addEventListener('change', () => {
        state.status = statusFilter.value;
        state.page = 1;
        loadOrders();
      });
    }

    // Wire search input (once)
    const searchInput = document.getElementById('orders-search');
    if (searchInput && !searchInput._wired) {
      searchInput._wired = true;
      let _debounce;
      searchInput.addEventListener('input', () => {
        clearTimeout(_debounce);
        _debounce = setTimeout(() => {
          state.search = searchInput.value.trim();
          state.page = 1;
          loadOrders();
        }, 350);
      });
    }

    if (!state.items.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#64748b;padding:24px">Sin pedidos</td></tr>';
      return;
    }

    tbody.innerHTML = state.items.map(order => `
      <tr>
        <td style="font-family:monospace;font-size:1rem;color:#a5b4fc" title="${esc(order.id)}">
          ${esc(truncateId(order.id))}
        </td>
        <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(order.userEmail)}">
          ${esc(order.userEmail || '—')}
        </td>
        <td style="font-weight:600">${formatCurrency(order.total)}</td>
        <td id="order-badge-${esc(order.id)}">${statusBadge(order.status)}</td>
        <td style="color:#94a3b8;font-size:1rem">${formatDate(order.createdAt)}</td>
        <td>
          <button class="btn-admin btn-admin-secondary btn-admin-sm"
                  onclick="AdminOrders.openOrderDetail('${esc(order.id)}')"
                  title="Ver detalle del pedido">
            <i class="fas fa-eye"></i> Ver detalle
          </button>
        </td>
      </tr>`).join('');
  }

  // ── Pagination ────────────────────────────────────────────────────────────
  function goToPage(n) {
    state.page = n;
    loadOrders();
  }

  // ── Order detail modal ────────────────────────────────────────────────────
  async function openOrderDetail(orderId) {
    const modal = document.getElementById('order-detail-modal');
    const body  = document.getElementById('order-detail-body');
    if (!modal || !body) return;

    // Show modal with loading state
    body.innerHTML = '<div style="text-align:center;padding:40px;color:#64748b">' +
      '<i class="fas fa-spinner fa-spin" style="font-size:1.5rem"></i></div>';
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    try {
      const order = await adminApi.adminGetOrder(orderId);
      renderOrderDetail(order);
    } catch (e) {
      body.innerHTML = '<div style="color:#f87171;text-align:center;padding:24px">' +
        '<i class="fas fa-exclamation-triangle"></i> ' +
        esc(e.detail || 'Error al cargar el pedido') + '</div>';
    }
  }

  function closeOrderDetail() {
    const modal = document.getElementById('order-detail-modal');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = '';
  }

  function renderOrderDetail(order) {
    const body = document.getElementById('order-detail-body');
    if (!body) return;

    const advancement = NEXT_STATUS[order.status];
    const advanceBtnHtml = advancement
      ? `<button class="btn-admin btn-admin-primary"
                 id="btn-advance-status"
                 onclick="AdminOrders.advanceOrderStatus('${esc(order.id)}', '${esc(advancement.next)}')">
           <i class="fas fa-arrow-right"></i> ${esc(advancement.label)}
         </button>`
      : `<button class="btn-admin btn-admin-secondary" disabled title="No hay más avances posibles">
           <i class="fas fa-check-circle"></i> Estado final
         </button>`;

    const designFilesBtn = (order.designFileCount > 0)
      ? `<button class="btn-admin btn-admin-secondary"
                 onclick="AdminOrders.openDesignFiles('${esc(order.id)}')"
                 style="margin-left:8px">
           <i class="fas fa-file-image"></i> Ver archivos de diseño (${order.designFileCount})
         </button>`
      : '';

    const itemsHtml = (order.items || []).map(item => `
      <tr>
        <td>${esc(item.productTitleEs || item.productTitle || '—')}</td>
        <td>${esc(item.variantLabelEs || item.variantLabel || '—')}</td>
        <td style="text-align:center">${esc(item.quantity)}</td>
        <td style="text-align:right">${formatCurrency(item.unitPrice)}</td>
        <td style="text-align:right;font-weight:600">${formatCurrency((item.unitPrice || 0) * (item.quantity || 1))}</td>
      </tr>`).join('');

    const addr = order.shippingAddress || {};
    const addrHtml = addr.street
      ? `${esc(addr.street)}, ${esc(addr.city)}, ${esc(addr.state)} ${esc(addr.postalCode)}, ${esc(addr.country)}`
      : '<span style="color:#64748b">—</span>';

    body.innerHTML = `
      <!-- Header info -->
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;margin-bottom:24px">
        <div>
          <div style="font-size:1rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">ID Pedido</div>
          <div style="font-family:monospace;color:#a5b4fc;font-size:1rem" title="${esc(order.id)}">${esc(order.id)}</div>
        </div>
        <div>
          <div style="font-size:1rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Cliente</div>
          <div style="color:#e2e8f0;font-size:1rem">${esc(order.userEmail || '—')}</div>
        </div>
        <div>
          <div style="font-size:1rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Estado</div>
          <div id="order-detail-badge">${statusBadge(order.status)}</div>
        </div>
        <div>
          <div style="font-size:1rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Pago</div>
          <div style="color:#e2e8f0;font-size:1rem">${esc(order.paymentStatus || '—')}</div>
        </div>
        <div>
          <div style="font-size:1rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Fecha</div>
          <div style="color:#94a3b8;font-size:1rem">${formatDate(order.createdAt)}</div>
        </div>
        <div>
          <div style="font-size:1rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Total</div>
          <div style="color:#e2e8f0;font-size:1rem;font-weight:700">${formatCurrency(order.total)}</div>
        </div>
      </div>

      <!-- Shipping address -->
      <div style="margin-bottom:20px">
        <div style="font-size:1rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">
          <i class="fas fa-map-marker-alt" style="color:#8b5cf6;margin-right:6px"></i>Dirección de envío
        </div>
        <div style="font-size:1rem;color:#cbd5e1;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:10px 14px">
          ${addrHtml}
        </div>
      </div>

      <!-- Order items -->
      <div style="margin-bottom:24px">
        <div style="font-size:1rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px">
          <i class="fas fa-shopping-cart" style="color:#8b5cf6;margin-right:6px"></i>Artículos
        </div>
        <div style="overflow-x:auto">
          <table class="admin-table" style="font-size:1rem">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Variante</th>
                <th style="text-align:center">Cant.</th>
                <th style="text-align:right">Precio unit.</th>
                <th style="text-align:right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml || '<tr><td colspan="5" style="text-align:center;color:#64748b">Sin artículos</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Status advancement + design files -->
      <div style="display:flex;align-items:center;flex-wrap:wrap;gap:10px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.07)">
        <div id="advance-status-wrap">
          ${advanceBtnHtml}
        </div>
        ${designFilesBtn}
        <div id="order-detail-err" style="color:#f87171;font-size:1rem;width:100%;min-height:18px"></div>
      </div>`;
  }

  // ── Status advancement ────────────────────────────────────────────────────
  async function advanceOrderStatus(orderId, newStatus) {
    const btn = document.getElementById('btn-advance-status');
    spin(btn, true);
    const errEl = document.getElementById('order-detail-err');
    if (errEl) errEl.textContent = '';

    try {
      await adminApi.adminUpdateOrderStatus(orderId, newStatus);

      // Update badge in the detail modal
      const detailBadge = document.getElementById('order-detail-badge');
      if (detailBadge) detailBadge.innerHTML = statusBadge(newStatus);

      // Update badge in the orders table row (if visible)
      const tableBadge = document.getElementById(`order-badge-${orderId}`);
      if (tableBadge) tableBadge.innerHTML = statusBadge(newStatus);

      // Update the advancement control
      const wrap = document.getElementById('advance-status-wrap');
      if (wrap) {
        const next = NEXT_STATUS[newStatus];
        wrap.innerHTML = next
          ? `<button class="btn-admin btn-admin-primary"
                     id="btn-advance-status"
                     onclick="AdminOrders.advanceOrderStatus('${esc(orderId)}', '${esc(next.next)}')">
               <i class="fas fa-arrow-right"></i> ${esc(next.label)}
             </button>`
          : `<button class="btn-admin btn-admin-secondary" disabled>
               <i class="fas fa-check-circle"></i> Estado final
             </button>`;
      }

      toast('Estado actualizado correctamente', true);
    } catch (e) {
      if (errEl) errEl.textContent = e.detail || 'Error al actualizar el estado';
      spin(btn, false);
    }
  }

  // ── Design files ──────────────────────────────────────────────────────────
  async function openDesignFiles(orderId) {
    try {
      const files = await adminApi.adminGetDesignFiles(orderId);
      if (!files || !files.length) {
        toast('No se encontraron archivos de diseño', false);
        return;
      }
      files.forEach(f => window.open(f.presignedUrl, '_blank', 'noopener'));
    } catch (e) {
      toast(e.detail || 'Error al obtener archivos de diseño', false);
    }
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  function init() {
    // Close modal on overlay click
    const modal = document.getElementById('order-detail-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeOrderDetail();
      });
    }

    // Close modal button
    const closeBtn = document.getElementById('btn-close-order-detail');
    if (closeBtn) closeBtn.addEventListener('click', closeOrderDetail);

    // Escape key closes modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeOrderDetail();
    });
  }

  // ── Public API ────────────────────────────────────────────────────────────
  window.AdminOrders = {
    loadOrders,
    openOrderDetail,
    closeOrderDetail,
    advanceOrderStatus,
    openDesignFiles,
    init
  };

}(window));
