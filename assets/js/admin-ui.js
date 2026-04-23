/**
 * admin-ui.js — Shared UI helpers for admin.html
 *
 * Exports (globals):
 *   toast(msg, ok)
 *   spin(btn, on)
 *   adminConfirm(msg)
 *   renderPagination(containerId, state, onPageChange)
 *   statusBadge(status)
 */

// ── Toast ─────────────────────────────────────────────────────────────────────
// Displays a fixed bottom-right notification.
// ok=true → green success style, ok=false → red error style.
function toast(msg, ok = true) {
  const el = document.getElementById('admin-toast');
  if (!el) return;
  el.textContent = msg;
  el.className = 'show ' + (ok ? 'toast-ok' : 'toast-err');
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.className = ''; }, 3500);
}

// ── Spinner ───────────────────────────────────────────────────────────────────
// Toggles a loading spinner on a button and disables/re-enables it.
// Preserves the original innerHTML to restore after the operation completes.
function spin(btn, on) {
  if (!btn) return;
  if (on) {
    btn._txt = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    btn.disabled = true;
  } else {
    btn.innerHTML = btn._txt !== undefined ? btn._txt : btn.innerHTML;
    btn.disabled = false;
  }
}

// ── Confirm ───────────────────────────────────────────────────────────────────
// Custom modal-based confirmation. Returns a Promise<boolean>.
// Replaces window.confirm for all destructive actions.
function adminConfirm(msg, title) {
  return new Promise(function (resolve) {
    var modal = document.getElementById('confirm-modal');
    var titleEl = document.getElementById('confirm-modal-title-text');
    var messageEl = document.getElementById('confirm-modal-message');
    var confirmBtn = document.getElementById('confirm-modal-confirm');
    var cancelBtn = document.getElementById('confirm-modal-cancel');

    if (!modal) { resolve(window.confirm(msg)); return; }

    if (titleEl) titleEl.textContent = title || 'Confirmar acción';
    if (messageEl) messageEl.textContent = msg;
    modal.style.display = 'flex';

    function cleanup() {
      modal.style.display = 'none';
      confirmBtn.removeEventListener('click', onConfirm);
      cancelBtn.removeEventListener('click', onCancel);
      modal.removeEventListener('click', onBackdrop);
    }
    function onConfirm() { cleanup(); resolve(true); }
    function onCancel()  { cleanup(); resolve(false); }
    function onBackdrop(e) { if (e.target === modal) { cleanup(); resolve(false); } }

    confirmBtn.addEventListener('click', onConfirm);
    cancelBtn.addEventListener('click', onCancel);
    modal.addEventListener('click', onBackdrop);
  });
}

// ── Pagination ────────────────────────────────────────────────────────────────
// Renders Previous / Next / page-number controls.
// state  — object with { page, pageSize, total }
// onPageChange(newPage) — callback invoked when the user clicks a page control
function renderPagination(containerId, state, onPageChange) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const totalPages = Math.max(1, Math.ceil(state.total / state.pageSize));
  const isFirst = state.page <= 1;
  const isLast  = state.page >= totalPages;

  // Store callback on the container so inline onclick can reach it without
  // serialising the closure (which breaks references to outer variables).
  container._onPageChange = onPageChange;

  // Build page number buttons (show up to 5 around current page)
  let pageButtons = '';
  if (totalPages > 1) {
    const start = Math.max(1, state.page - 2);
    const end   = Math.min(totalPages, state.page + 2);
    for (let i = start; i <= end; i++) {
      const active = i === state.page;
      pageButtons += `<button
        class="btn-outline-sm${active ? ' active' : ''}"
        onclick="document.getElementById('${containerId}')._onPageChange(${i})"
        ${active ? 'disabled aria-current="page"' : ''}
        style="${active ? 'background:rgba(139,92,246,0.25);color:#c4b5fd;border-color:rgba(139,92,246,0.5);' : ''}"
      >${i}</button>`;
    }
  }

  container.innerHTML = `
    <div class="pagination-controls" style="display:flex;align-items:center;gap:8px;justify-content:flex-end;padding:10px 0;flex-wrap:wrap">
      <button
        class="btn-outline-sm"
        onclick="document.getElementById('${containerId}')._onPageChange(${state.page - 1})"
        ${isFirst ? 'disabled' : ''}
        aria-label="Página anterior"
      ><i class="fas fa-chevron-left"></i> Anterior</button>

      ${pageButtons}

      <button
        class="btn-outline-sm"
        onclick="document.getElementById('${containerId}')._onPageChange(${state.page + 1})"
        ${isLast ? 'disabled' : ''}
        aria-label="Página siguiente"
      >Siguiente <i class="fas fa-chevron-right"></i></button>

      <span style="color:#64748b;font-size:1rem;margin-left:4px">
        ${state.page}/${totalPages}
        <span style="color:#475569">(${state.total})</span>
      </span>
    </div>`;
}

// ── Status Badge ──────────────────────────────────────────────────────────────
// Returns color-coded badge HTML for all 8 OrderStatus values.
//
// Colors per requirements 5.13:
//   Pending        → gray
//   PendingPayment → yellow
//   Paid           → blue
//   Preparing      → orange
//   Shipped        → purple
//   Delivered      → green
//   Cancelled      → red
//   PaymentFailed  → red
const STATUS_BADGE_MAP = {
  Pending:        { label: 'Pendiente',         color: '#64748b' },
  PendingPayment: { label: 'Pago Pendiente',     color: '#f59e0b' },
  Paid:           { label: 'Pagado',             color: '#3b82f6' },
  Preparing:      { label: 'En Preparación',     color: '#f97316' },
  Shipped:        { label: 'Enviado',            color: '#a855f7' },
  Delivered:      { label: 'Entregado',          color: '#22c55e' },
  Cancelled:      { label: 'Cancelado',          color: '#ef4444' },
  PaymentFailed:  { label: 'Pago Fallido',       color: '#ef4444' },
};

function statusBadge(status) {
  const entry = STATUS_BADGE_MAP[status] || { label: status, color: '#64748b' };
  return `<span class="status-badge" style="
    display:inline-block;
    padding:2px 10px;
    border-radius:999px;
    font-size:1rem;
    font-weight:600;
    letter-spacing:0.02em;
    background:${entry.color}22;
    color:${entry.color};
    border:1px solid ${entry.color}55;
  ">${entry.label}</span>`;
}
