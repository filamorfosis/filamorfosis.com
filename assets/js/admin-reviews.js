/**
 * admin-reviews.js — Reviews tab module for admin.html
 *
 * Responsibilities:
 *   - loadReviews(params)       paginated review list with status/search filters
 *   - renderReviewsTable()      render #reviews-tbody rows
 *   - openReviewModal(id)       show full review detail + decision controls
 *   - approveReview(id)         approve with optional note
 *   - rejectReview(id)          reject with required note
 *   - deleteReview(id)          confirm + delete
 *   - init()                    wire all event listeners
 *
 * Depends on globals: adminApi, adminConfirm, toast, spin, renderPagination
 */

(function (window) {
  'use strict';

  // ── State ─────────────────────────────────────────────────────────────────
  const state = {
    page: 1,
    pageSize: 20,
    status: '',
    search: '',
    total: 0,
    items: []
  };

  let _currentReviewId = null;

  // ── Helpers ───────────────────────────────────────────────────────────────
  function esc(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function stars(rating) {
    const full = Math.round(rating || 0);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  }

  function statusBadge(status) {
    const map = {
      Pending:  { bg: 'rgba(234,179,8,0.15)',  color: '#eab308', border: 'rgba(234,179,8,0.4)',  label: 'Pendiente' },
      Approved: { bg: 'rgba(34,197,94,0.15)',  color: '#22c55e', border: 'rgba(34,197,94,0.4)',  label: 'Aprobada'  },
      Rejected: { bg: 'rgba(248,113,113,0.15)', color: '#f87171', border: 'rgba(248,113,113,0.4)', label: 'Rechazada' }
    };
    const s = map[status] || map.Pending;
    return `<span style="display:inline-block;padding:2px 10px;border-radius:999px;font-size:1rem;font-weight:600;background:${s.bg};color:${s.color};border:1px solid ${s.border}">${s.label}</span>`;
  }

  // ── Load ──────────────────────────────────────────────────────────────────
  async function loadReviews(params) {
    if (params) Object.assign(state, params);
    const tbody = document.getElementById('reviews-tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:#64748b"><i class="fas fa-spinner fa-spin"></i> Cargando...</td></tr>';

    try {
      const result = await adminApi.adminGetReviews({
        page: state.page,
        pageSize: state.pageSize,
        status: state.status || undefined,
        search: state.search || undefined
      });
      state.items = result.items || [];
      state.total = result.totalCount ?? state.items.length;
      renderReviewsTable();
      renderPagination('reviews-pagination', {
        page: state.page,
        pageSize: state.pageSize,
        total: state.total
      }, (n) => { state.page = n; loadReviews(); });
    } catch (e) {
      if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="color:#f87171;text-align:center;padding:24px"><i class="fas fa-exclamation-triangle"></i> Error al cargar reseñas</td></tr>';
    }
  }

  // ── Render table ──────────────────────────────────────────────────────────
  function renderReviewsTable() {
    const tbody = document.getElementById('reviews-tbody');
    if (!tbody) return;

    if (!state.items.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#64748b;padding:24px">Sin reseñas</td></tr>';
      return;
    }

    tbody.innerHTML = state.items.map(r => `
      <tr>
        <td style="color:#94a3b8;font-size:1rem">${formatDate(r.createdAt)}</td>
        <td style="font-weight:600;color:#e2e8f0">${esc(r.productTitle || '—')}</td>
        <td style="color:#e2e8f0">
          ${esc(r.authorName)}
          ${r.isVerifiedPurchase ? '<span style="display:inline-block;margin-left:6px;padding:2px 6px;background:rgba(34,197,94,0.2);color:#22c55e;border-radius:4px;font-size:1rem;font-weight:600" title="Compra verificada"><i class="fas fa-check-circle"></i></span>' : ''}
        </td>
        <td style="color:#eab308;letter-spacing:2px">${stars(r.rating)}</td>
        <td style="color:#94a3b8;font-size:1rem;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(r.body)}</td>
        <td>${statusBadge(r.status)}</td>
        <td style="white-space:nowrap">
          <button class="btn-admin btn-admin-secondary btn-admin-sm" onclick="AdminReviews.openReviewModal('${esc(r.id)}')" title="Ver detalle">
            <i class="fas fa-eye"></i>
          </button>
          ${r.status === 'Pending' ? `
          <button class="btn-admin btn-admin-primary btn-admin-sm" onclick="AdminReviews.approveReview('${esc(r.id)}')" title="Aprobar">
            <i class="fas fa-check"></i>
          </button>
          <button class="btn-admin btn-admin-danger btn-admin-sm" onclick="AdminReviews.rejectReview('${esc(r.id)}')" title="Rechazar">
            <i class="fas fa-times"></i>
          </button>` : ''}
          <button class="btn-admin btn-admin-danger btn-admin-sm" onclick="AdminReviews.deleteReview('${esc(r.id)}')" title="Eliminar">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>`).join('');
  }

  // ── Review detail modal ───────────────────────────────────────────────────
  async function openReviewModal(id) {
    _currentReviewId = id;
    const modal = document.getElementById('review-modal');
    const body  = document.getElementById('review-modal-body');
    if (!modal || !body) return;

    body.innerHTML = '<div style="text-align:center;padding:40px;color:#64748b"><i class="fas fa-spinner fa-spin fa-2x"></i></div>';
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    try {
      const r = await adminApi.adminGetReview(id);
      const imagesHtml = r.imageUrls && r.imageUrls.length
        ? `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px">
            ${r.imageUrls.map((url, i) => `
              <div style="position:relative;width:90px;height:90px;border-radius:8px;overflow:hidden;border:1px solid rgba(255,255,255,0.1)">
                <img src="${esc(url)}" alt="Imagen ${i+1}" style="width:100%;height:100%;object-fit:cover" loading="lazy">
                <button onclick="AdminReviews._deleteReviewImage('${esc(r.id)}','${esc(url)}')"
                        style="position:absolute;top:3px;right:3px;background:rgba(248,113,113,0.85);border:none;border-radius:50%;width:20px;height:20px;cursor:pointer;color:#fff;font-size:1rem;display:flex;align-items:center;justify-content:center;padding:0"
                        title="Eliminar imagen"><i class="fas fa-times"></i></button>
              </div>`).join('')}
           </div>`
        : '<span style="color:#64748b;font-size:1rem">Sin imágenes</span>';

      body.innerHTML = `
        <div style="display:grid;gap:14px">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
            <div>
              <span style="font-size:1.4rem;color:#eab308;letter-spacing:3px">${stars(r.rating)}</span>
              <span style="color:#64748b;font-size:1rem;margin-left:8px">${r.rating}/5</span>
            </div>
            ${statusBadge(r.status)}
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div>
              <div style="font-size:1rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px">Producto</div>
              <div style="color:#e2e8f0">${esc(r.productTitle || r.productId)}</div>
            </div>
            <div>
              <div style="font-size:1rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px">Autor</div>
              <div style="color:#e2e8f0;display:flex;align-items:center;gap:8px">
                ${esc(r.authorName)}
                ${r.isVerifiedPurchase ? '<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;background:rgba(34,197,94,0.2);color:#22c55e;border-radius:12px;font-size:1rem;font-weight:600" title="Compra verificada"><i class="fas fa-check-circle"></i> Verificado</span>' : ''}
              </div>
            </div>
            <div>
              <div style="font-size:1rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px">Fecha</div>
              <div style="color:#94a3b8">${formatDate(r.createdAt)}</div>
            </div>
            ${r.reviewedAt ? `<div>
              <div style="font-size:1rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px">Revisada</div>
              <div style="color:#94a3b8">${formatDate(r.reviewedAt)}</div>
            </div>` : ''}
          </div>
          <div>
            <div style="font-size:1rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">Reseña</div>
            <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:12px;color:#e2e8f0;font-size:1rem;line-height:1.6">${esc(r.body)}</div>
          </div>
          <div>
            <div style="font-size:1rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">Imágenes</div>
            ${imagesHtml}
          </div>
          ${r.adminNote ? `<div>
            <div style="font-size:1rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">Nota del admin</div>
            <div style="background:rgba(248,113,113,0.08);border:1px solid rgba(248,113,113,0.2);border-radius:8px;padding:10px;color:#fca5a5;font-size:1rem">${esc(r.adminNote)}</div>
          </div>` : ''}
          ${r.status === 'Pending' ? `
          <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:4px 0">
          <div>
            <div style="font-size:1rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">Decisión</div>
            <div style="display:flex;flex-direction:column;gap:8px">
              <textarea id="review-admin-note" rows="2" placeholder="Nota opcional (requerida al rechazar)..."
                style="background:#1e293b;border:1px solid #334155;color:#e2e8f0;border-radius:8px;padding:8px 12px;font-family:Poppins,sans-serif;font-size:1rem;resize:vertical"></textarea>
              <div style="display:flex;gap:8px">
                <button class="btn-admin btn-admin-primary" id="btn-approve-review" onclick="AdminReviews._decideFromModal('Approved')">
                  <i class="fas fa-check"></i> Aprobar
                </button>
                <button class="btn-admin btn-admin-danger" id="btn-reject-review" onclick="AdminReviews._decideFromModal('Rejected')">
                  <i class="fas fa-times"></i> Rechazar
                </button>
              </div>
              <div class="form-error" id="review-modal-err"></div>
            </div>
          </div>` : ''}
        </div>`;
    } catch (e) {
      body.innerHTML = '<div style="color:#f87171;text-align:center;padding:24px"><i class="fas fa-exclamation-triangle"></i> Error al cargar la reseña</div>';
    }
  }

  function _closeReviewModal() {
    const modal = document.getElementById('review-modal');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = '';
    _currentReviewId = null;
  }

  async function _decideFromModal(decision) {
    if (!_currentReviewId) return;
    const noteEl = document.getElementById('review-admin-note');
    const errEl  = document.getElementById('review-modal-err');
    const note   = noteEl ? noteEl.value.trim() : '';

    if (decision === 'Rejected' && !note) {
      if (errEl) errEl.textContent = 'La nota es requerida al rechazar una reseña.';
      return;
    }
    if (errEl) errEl.textContent = '';

    const btn = document.getElementById(decision === 'Approved' ? 'btn-approve-review' : 'btn-reject-review');
    spin(btn, true);
    try {
      await adminApi.adminDecideReview(_currentReviewId, decision, note || null);
      toast(decision === 'Approved' ? 'Reseña aprobada' : 'Reseña rechazada');
      _closeReviewModal();
      await loadReviews();
    } catch (e) {
      if (errEl) errEl.textContent = e.detail || 'Error al procesar la decisión.';
      spin(btn, false);
    }
  }

  // ── Quick actions from table ───────────────────────────────────────────────
  async function approveReview(id) {
    try {
      await adminApi.adminDecideReview(id, 'Approved', null);
      toast('Reseña aprobada');
      await loadReviews();
    } catch (e) {
      toast(e.detail || 'Error al aprobar la reseña.', false);
    }
  }

  async function rejectReview(id) {
    const note = window.prompt('Motivo del rechazo (requerido):');
    if (note === null) return; // cancelled
    if (!note.trim()) { toast('El motivo es requerido.', false); return; }
    try {
      await adminApi.adminDecideReview(id, 'Rejected', note.trim());
      toast('Reseña rechazada');
      await loadReviews();
    } catch (e) {
      toast(e.detail || 'Error al rechazar la reseña.', false);
    }
  }

  async function deleteReview(id) {
    if (!await adminConfirm('¿Eliminar esta reseña? Esta acción no se puede deshacer.', 'Eliminar Reseña')) return;
    try {
      await adminApi.adminDeleteReview(id);
      toast('Reseña eliminada');
      if (_currentReviewId === id) _closeReviewModal();
      await loadReviews();
    } catch (e) {
      toast(e.detail || 'Error al eliminar la reseña.', false);
    }
  }

  async function _deleteReviewImage(reviewId, imageUrl) {
    if (!await adminConfirm('¿Eliminar esta imagen?', 'Eliminar Imagen')) return;
    try {
      await adminApi.adminDeleteReviewImage(reviewId, imageUrl);
      toast('Imagen eliminada');
      await openReviewModal(reviewId); // refresh modal
    } catch (e) {
      toast(e.detail || 'Error al eliminar la imagen.', false);
    }
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  function init() {
    // Status filter
    const statusFilter = document.getElementById('reviews-status-filter');
    if (statusFilter && !statusFilter._wired) {
      statusFilter._wired = true;
      statusFilter.addEventListener('change', () => {
        state.status = statusFilter.value;
        state.page = 1;
        loadReviews();
      });
    }

    // Search
    const searchInput = document.getElementById('reviews-search');
    if (searchInput && !searchInput._wired) {
      searchInput._wired = true;
      let _debounce;
      searchInput.addEventListener('input', () => {
        clearTimeout(_debounce);
        _debounce = setTimeout(() => {
          state.search = searchInput.value.trim();
          state.page = 1;
          loadReviews();
        }, 350);
      });
    }

    // Modal close
    const modalClose = document.getElementById('review-modal-close');
    if (modalClose) modalClose.addEventListener('click', _closeReviewModal);
    const modal = document.getElementById('review-modal');
    if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) _closeReviewModal(); });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const m = document.getElementById('review-modal');
        if (m && m.style.display === 'flex') _closeReviewModal();
      }
    });
  }

  // ── Public API ────────────────────────────────────────────────────────────
  window.AdminReviews = {
    init,
    loadReviews,
    openReviewModal,
    approveReview,
    rejectReview,
    deleteReview,
    _decideFromModal,
    _deleteReviewImage,
    _closeReviewModal
  };

}(window));
