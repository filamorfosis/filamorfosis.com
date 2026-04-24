/**
 * admin-products.js ï¿½ Products tab module for admin.html
 *
 * Responsibilities:
 *   - loadProducts(params)            paginated product list with search
 *   - renderProductsTable()           render #products-tbody rows
 *   - openEditProductModal(id)        fetch product, inject form, show modal
 *   - saveProductModal(event)         create or update product via API
 *   - deleteProduct(id)               confirm + delete product
 *   - openEditVariantModal(pid, vid)  populate variant form, load materials, show modal
 *   - saveVariantModal(event)         create or update variant via API
 *   - _loadMaterialsCache()           load materials into _materials cache
 *   - _addMaterialUsageRow()          append a new empty material usage row
 *   - _removeMaterialUsageRow(idx)    remove a material usage row
 *   - _onMaterialUsageRowChange(idx)  update row when material select or quantity changes
 *   - _renderMaterialUsagesTable()    render the material usages table
 *   - _updatePricePreview()           compute (productionCost + profit) * 1.16
 *   - init()                          wire all event listeners
 *
 * Depends on globals: adminApi, adminConfirm, toast, spin, renderPagination
 *                     AdminCategories (for getCategories())
 *                     AdminCosts (for getMaterials() cache)
 *
 * Fixes: Bug 2 (empty material dropdown) and Bug 3 (TypeError on init/saveProductModal)
 */

(function (window) {
  'use strict';

  // -- Module state ----------------------------------------------------------
  const state = {
    page: 1,
    pageSize: 500,   // fetch all ï¿½ category filtering is client-side
    viewPage: 1,
    viewPageSize: 20,
    search: '',
    categoryId: null,
    total: 0,
    items: [],       // all fetched items
    filtered: []     // items after category filter
  };

  let _editingProductId = null;
  let _editingVariantId = null;
  let _editingVariantProductId = null;
  let _materials = [];
  let _materialsMap = {};      // { materialId: material } for quick lookup
  let _currentProduct = null;   // full product object while edit modal is open
  let _materialUsageRows = [];  // [{ materialId, baseCost, name, quantity }]

  // -- Helpers ---------------------------------------------------------------

  function esc(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function fmt(n) {
    return Number(n ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // -- Task 3.1 ï¿½ loadProducts -----------------------------------------------

  async function loadProducts(params) {
    const tbody = document.getElementById('products-tbody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:#64748b">' +
        '<i class="fas fa-spinner fa-spin"></i> Cargando...</td></tr>';
    }
    if (params) Object.assign(state, params);
    try {
      // Load materials first to check stock levels
      await _loadMaterialsCache();
      
      const result = await adminApi.adminGetProducts({
        page: 1,
        pageSize: state.pageSize,
        search: state.search || undefined
      });
      state.items = result.items || result || [];
      state.total = state.items.length;
      _applyFilter();
      renderCategoryFilterButtons();
    } catch (e) {
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="5" style="color:#f87171;text-align:center;padding:24px">' +
          '<i class="fas fa-exclamation-triangle"></i> Error al cargar productos</td></tr>';
      }
    }
  }

  function _applyFilter() {
    if (state.categoryId) {
      state.filtered = state.items.filter(p => p.categoryId === state.categoryId);
    } else {
      state.filtered = state.items.slice();
    }
    state.viewPage = 1;
    renderProductsTable();
  }

  function _goToViewPage(n) {
    state.viewPage = n;
    renderProductsTable();
  }

  function _goToPage(n) {
    state.page = n;
    loadProducts();
  }

  // -- Task 3.2 ï¿½ renderProductsTable ---------------------------------------

  function renderProductsTable() {
    const tbody = document.getElementById('products-tbody');
    if (!tbody) return;

    const total = state.filtered.length;
    const start = (state.viewPage - 1) * state.viewPageSize;
    const items = state.filtered.slice(start, start + state.viewPageSize);

    if (!total) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#64748b;padding:24px">Sin productos</td></tr>';
      document.getElementById('products-pagination').innerHTML = '';
      return;
    }

    tbody.innerHTML = items.map(p => {
      const variants = p.variants || [];
      // Show "Revisar" if ANY variant is unavailable or out of stock
      const needsReview = variants.length > 0 && variants.some(v =>
        !v.isAvailable || v.inStock === false
      );
      let statusBg, statusColor, statusBorder, statusLabel;
      if (needsReview) {
        statusBg     = 'rgba(234,179,8,0.15)';
        statusColor  = '#eab308';
        statusBorder = 'rgba(234,179,8,0.4)';
        statusLabel  = '<i class="fas fa-exclamation-triangle" style="margin-right:4px;font-size:1rem"></i>Revisar';
      } else if (p.isActive) {
        statusBg     = 'rgba(34,197,94,0.15)';
        statusColor  = '#22c55e';
        statusBorder = 'rgba(34,197,94,0.4)';
        statusLabel  = 'Activo';
      } else {
        statusBg     = 'rgba(100,116,139,0.15)';
        statusColor  = '#64748b';
        statusBorder = 'rgba(100,116,139,0.4)';
        statusLabel  = 'Inactivo';
      }
      return `
      <tr>
        <td style="font-weight:600;color:#e2e8f0">${esc(p.titleEs || p.title || '—')}</td>
        <td style="color:#94a3b8;font-size:1rem">${esc(p.categoryNameEs || p.categoryName || '—')}</td>
        <td>
          <span style="display:inline-block;padding:2px 10px;border-radius:999px;font-size:1rem;font-weight:600;
            background:${statusBg};color:${statusColor};border:1px solid ${statusBorder}">
            ${statusLabel}
          </span>
        </td>
        <td style="color:#94a3b8;font-size:1rem">${p.variantCount ?? variants.length}</td>
        <td style="white-space:nowrap">
          <button class="btn-admin btn-admin-secondary btn-admin-sm"
                  onclick="AdminProducts.openEditProductModal('${esc(p.id)}')"
                  title="Editar producto">
            <i class="fas fa-edit"></i> Editar
          </button>
          <button class="btn-admin btn-admin-danger btn-admin-sm"
                  onclick="AdminProducts.deleteProduct('${esc(p.id)}')"
                  id="prod-del-${esc(p.id)}"
                  title="Eliminar producto">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>`;
    }).join('');

    renderPagination('products-pagination', {
      page: state.viewPage,
      pageSize: state.viewPageSize,
      total
    }, _goToViewPage);
  }

  // -- Category filter buttons -----------------------------------------------

  function renderCategoryFilterButtons() {
    const container = document.getElementById('products-category-filters');
    if (!container) return;

    const categories = (typeof AdminCategories !== 'undefined' && AdminCategories.getCategories)
      ? AdminCategories.getCategories()
      : [];

    // Build count map
    const countMap = {};
    state.items.forEach(p => {
      countMap[p.categoryId] = (countMap[p.categoryId] || 0) + 1;
    });

    const allBtn = `
      <button class="prod-cat-filter-btn ${!state.categoryId ? 'active' : ''}"
              onclick="AdminProducts._filterByCategory(null)">
        Todos <span class="prod-cat-filter-count">${state.items.length}</span>
      </button>`;

    const catBtns = categories.map(c => {
      const count = countMap[c.id] || 0;
      return `
        <button class="prod-cat-filter-btn ${state.categoryId === c.id ? 'active' : ''}"
                onclick="AdminProducts._filterByCategory('${esc(c.id)}')">
          ${esc(c.nameEs)} <span class="prod-cat-filter-count">${count}</span>
        </button>`;
    }).join('');

    container.innerHTML = allBtn + catBtns;
  }

  function _filterByCategory(categoryId) {
    state.categoryId = categoryId || null;
    _applyFilter();
    renderCategoryFilterButtons();
  }

  // -- Task 3.3 ï¿½ init -------------------------------------------------------

  function init() {
    // Add-product form toggle
    const toggleBtn = document.getElementById('toggle-add-product');
    const formWrap  = document.getElementById('add-product-form-wrap');
    const cancelBtn = document.getElementById('cancel-add-product');
    const addForm   = document.getElementById('add-product-form');

    if (toggleBtn && formWrap) {
      toggleBtn.addEventListener('click', () => formWrap.classList.toggle('open'));
    }
    if (cancelBtn && formWrap && addForm) {
      cancelBtn.addEventListener('click', () => {
        formWrap.classList.remove('open');
        addForm.reset();
        const errEl = document.getElementById('add-product-err');
        if (errEl) errEl.textContent = '';
      });
    }
    if (addForm) {
      addForm.addEventListener('submit', saveProductModal);
    }

    // Product edit modal close
    const prodModalClose = document.getElementById('prod-edit-modal-close');
    if (prodModalClose) {
      prodModalClose.addEventListener('click', _closeProductModal);
    }
    const prodModal = document.getElementById('prod-edit-modal');
    if (prodModal) {
      prodModal.addEventListener('click', (e) => {
        if (e.target === prodModal) _closeProductModal();
      });
    }

    // Variant edit modal close / cancel
    const varModalClose  = document.getElementById('var-edit-modal-close');
    const varModalCancel = document.getElementById('var-edit-modal-cancel');
    if (varModalClose)  varModalClose.addEventListener('click', _closeVariantModal);
    if (varModalCancel) varModalCancel.addEventListener('click', _closeVariantModal);
    const varModal = document.getElementById('var-edit-modal');
    if (varModal) {
      varModal.addEventListener('click', (e) => {
        if (e.target === varModal) _closeVariantModal();
      });
    }

    // Variant form submit
    const varForm = document.getElementById('var-edit-modal-form');
    if (varForm) varForm.addEventListener('submit', saveVariantModal);

    // Search input with debounce
    const searchInput = document.getElementById('products-search');
    if (searchInput && !searchInput._wired) {
      searchInput._wired = true;
      let _debounce;
      searchInput.addEventListener('input', () => {
        clearTimeout(_debounce);
        _debounce = setTimeout(() => {
          state.search = searchInput.value.trim();
          state.page = 1;
          state.viewPage = 1;
          loadProducts();
        }, 350);
      });
    }

    // Escape key closes modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const varModal = document.getElementById('var-edit-modal');
        if (varModal && varModal.style.display === 'flex') {
          _closeVariantModal();
          return;
        }
        const prodModal = document.getElementById('prod-edit-modal');
        if (prodModal && prodModal.style.display === 'flex') {
          _closeProductModal();
        }
      }
    });
  }

  function _closeProductModal() {
    const modal = document.getElementById('prod-edit-modal');
    if (modal) modal.style.display = 'none';
    _editingProductId = null;
    _currentProduct = null;
    document.body.style.overflow = '';
  }

  function _closeVariantModal() {
    const modal = document.getElementById('var-edit-modal');
    if (modal) modal.style.display = 'none';
    _editingVariantId = null;
    _editingVariantProductId = null;
  }

  // -- Task 4.1 — openEditProductModal --------------------------------------

  async function openEditProductModal(id) {
    const modal = document.getElementById('prod-edit-modal');
    const body  = document.getElementById('prod-edit-modal-body');
    const title = document.getElementById('prod-edit-modal-title');
    if (!modal || !body) return;

    _editingProductId = id || null;
    if (title) title.textContent = id ? 'Editar Producto' : 'Nuevo Producto';

    body.innerHTML = '<div style="text-align:center;padding:40px;color:#64748b">' +
      '<i class="fas fa-spinner fa-spin" style="font-size:1.5rem"></i></div>';
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    let product = null;
    if (id) {
      try {
        product = await adminApi.adminGetProduct(id);
        _currentProduct = product;
      } catch (e) {
        body.innerHTML = '<div style="color:#f87171;text-align:center;padding:24px">' +
          '<i class="fas fa-exclamation-triangle"></i> ' +
          esc(e.detail || 'Error al cargar el producto') + '</div>';
        return;
      }
    }

    const categories = (typeof AdminCategories !== 'undefined' && AdminCategories.getCategories)
      ? AdminCategories.getCategories()
      : [];

    const catOptions = categories.map(c =>
      `<option value="${esc(c.id)}" ${product && product.categoryId === c.id ? 'selected' : ''}>${esc(c.nameEs)}</option>`
    ).join('');

    const badgeOptions = [
      { value: '',        label: '(ninguno)' },
      { value: 'hot',     label: '🔥 hot — Más vendido' },
      { value: 'new',     label: '✨ new — Nuevo' },
      { value: 'promo',   label: '🎁 promo — Promo' },
      { value: 'popular', label: '⭐ popular — Popular' }
    ].map(b => `<option value="${esc(b.value)}" ${product && product.badge === b.value ? 'selected' : ''}>${esc(b.label)}</option>`).join('');

    const variants = product && product.variants ? product.variants : [];
    const variantsHtml = variants.length
      ? `<div style="margin-top:20px">
          <div style="font-size:1rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px">
            <i class="fas fa-cubes" style="color:#8b5cf6;margin-right:6px"></i>Variantes
          </div>
          <table class="admin-table" style="font-size:1rem">
            <thead><tr><th>Label (ES)</th><th>SKU</th><th>Activo</th><th>Stock</th><th>Costo</th><th>Precio</th><th>Descuento</th><th>Acciones</th></tr></thead>
            <tbody>
              ${variants.map(v => {
                const aC = v.isAvailable ? '#22c55e' : '#f87171';
                const aB = v.isAvailable ? 'rgba(34,197,94,0.12)' : 'rgba(248,113,113,0.12)';
                const aD = v.isAvailable ? 'rgba(34,197,94,0.35)' : 'rgba(248,113,113,0.35)';
                
                // Stock status — use server-computed inStock flag
                let stockStatus, stockColor, stockBg, stockBorder;
                if (v.inStock === true) {
                  stockStatus = 'Sí';
                  stockColor  = '#22c55e';
                  stockBg     = 'rgba(34,197,94,0.12)';
                  stockBorder = 'rgba(34,197,94,0.35)';
                } else if (v.inStock === false) {
                  stockStatus = 'No';
                  stockColor  = '#f87171';
                  stockBg     = 'rgba(248,113,113,0.12)';
                  stockBorder = 'rgba(248,113,113,0.35)';
                } else {
                  stockStatus = 'N/A';
                  stockColor  = '#64748b';
                  stockBg     = 'rgba(100,116,139,0.12)';
                  stockBorder = 'rgba(100,116,139,0.35)';
                }
                
                // Compute effective price from variant + product discounts
                const now = new Date();
                let effectivePrice = v.price ?? 0;
                const allDiscounts = (v.discounts || []).concat(product.discounts || []);
                allDiscounts.forEach(function(d) {
                  const starts = d.startsAt ? new Date(d.startsAt) : null;
                  const ends   = d.endsAt   ? new Date(d.endsAt)   : null;
                  const active = (!starts || starts <= now) && (!ends || ends >= now);
                  if (!active) return;
                  if (d.discountType === 'Percentage') effectivePrice = effectivePrice * (1 - d.value / 100);
                  else effectivePrice = Math.max(0, effectivePrice - d.value);
                });
                const hasDiscount = effectivePrice < (v.price ?? 0);
                const discountCell = hasDiscount
                  ? `<span style="color:#fb923c;font-weight:700">$${fmt(effectivePrice)}</span>
                     <span style="color:#64748b;font-size:1rem;text-decoration:line-through;margin-left:4px">$${fmt(v.price)}</span>`
                  : `<span style="color:#e2e8f0">$${fmt(v.price ?? 0)}</span>`;
                return `<tr>
                  <td>${esc(v.labelEs || v.label || '—')}</td>
                  <td style="font-family:monospace;font-size:1rem;color:#a5b4fc">${esc(v.sku || '—')}</td>
                  <td style="text-align:center"><span style="display:inline-block;padding:2px 10px;border-radius:999px;font-size:1rem;font-weight:600;background:${aB};color:${aC};border:1px solid ${aD}">${v.isAvailable ? 'Sí' : 'No'}</span></td>
                  <td style="text-align:center"><span style="display:inline-block;padding:2px 10px;border-radius:999px;font-size:1rem;font-weight:600;background:${stockBg};color:${stockColor};border:1px solid ${stockBorder}">${stockStatus}</span></td>
                  <td style="text-align:right;color:#94a3b8">$${fmt(v.baseCost ?? 0)}</td>
                  <td style="text-align:right;color:#e2e8f0">$${fmt(v.price ?? 0)}</td>
                  <td style="text-align:right">${discountCell}</td>
                  <td style="white-space:nowrap">
                    <button class="btn-admin btn-admin-secondary btn-admin-sm"
                            onclick="AdminProducts.openEditVariantModal('${esc(product.id)}','${esc(v.id)}')"
                            title="Editar variante">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-admin btn-admin-danger btn-admin-sm"
                            onclick="AdminProducts._deleteVariant('${esc(product.id)}','${esc(v.id)}')"
                            title="Eliminar variante">
                      <i class="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
          <button class="btn-admin btn-admin-primary btn-admin-sm" style="margin-top:10px"
                  onclick="AdminProducts.openEditVariantModal('${esc(product.id)}', null)">
            <i class="fas fa-plus"></i> Agregar variante
          </button>
        </div>`
      : (product
          ? `<div style="margin-top:16px">
              <button class="btn-admin btn-admin-primary btn-admin-sm"
                      onclick="AdminProducts.openEditVariantModal('${esc(product.id)}', null)">
                <i class="fas fa-plus"></i> Agregar variante
              </button>
            </div>`
          : '');

    body.innerHTML = `
      <form id="prod-edit-form" class="admin-form" novalidate>
        <div class="form-field">
          <label>TÍTULO (ES) <span class="req">*</span></label>
          <input type="text" id="pedit-titleEs" value="${esc(product ? product.titleEs || product.title || '' : '')}" required placeholder="Nombre en español">
        </div>
        <div class="form-field">
          <label>CATEGORÍA ${product ? '' : '<span class="req">*</span>'}</label>
          ${product
            ? `<div style="padding:8px 12px;border-radius:6px;background:rgba(255,255,255,0.04);
                           border:1px solid rgba(255,255,255,0.08);color:#e2e8f0;font-size:1rem;
                           display:flex;align-items:center;gap:8px">
                 <i class="fas fa-lock" style="color:#475569;font-size:1rem"></i>
                 ${esc(product.categoryNameEs || '—')}
               </div>
               <input type="hidden" id="pedit-categoryId" value="${esc(product.categoryId)}">`
            : `<select id="pedit-categoryId" required>
                 <option value="">-- Seleccionar --</option>
                 ${catOptions}
               </select>`
          }
        </div>
        <div class="form-field admin-form-full">
          <label>DESCRIPCIÓN (ES)</label>
          <textarea id="pedit-descriptionEs" rows="3" placeholder="Descripción en español">${esc(product ? product.descriptionEs || product.description || '' : '')}</textarea>
        </div>
        <div class="form-field">
          <label>Tags <span style="color:#64748b;font-weight:400">(separados por coma)</span></label>
          <input type="text" id="pedit-tags" value="${esc(product && product.tags ? (Array.isArray(product.tags) ? product.tags.join(', ') : product.tags) : '')}" placeholder="uv, madera, personalizado">
        </div>
        <div class="form-field">
          <label>Badge</label>
          <select id="pedit-badge">${badgeOptions}</select>
        </div>
        <div class="form-field-check">
          <input type="checkbox" id="pedit-isActive" ${!product || product.isActive ? 'checked' : ''}>
          <label for="pedit-isActive">Activo</label>
        </div>
        <div class="form-error admin-form-full" id="pedit-err"></div>
      </form>
      ${variantsHtml}
      ${product ? `<div id="prod-discounts-body"></div>` : ''}
      <div class="form-actions" style="margin-top:20px">
        <button type="submit" form="prod-edit-form" class="btn-admin btn-admin-primary" id="pedit-save-btn">
          <i class="fas fa-save"></i> Guardar producto
        </button>
        <button type="button" class="btn-admin btn-admin-secondary" onclick="AdminProducts._closeProductModal()">
          Cancelar
        </button>
      </div>`;

    // Wire the form submit
    const form = document.getElementById('prod-edit-form');
    if (form) form.addEventListener('submit', saveProductModal);

    // Render product-level discounts
    if (product) _renderProductDiscounts(product);
  }

  // -- Task 4.2 — saveProductModal -------------------------------------------

  async function saveProductModal(event) {
    event.preventDefault();
    const errEl = document.getElementById('pedit-err') || document.getElementById('add-product-err');
    if (errEl) errEl.textContent = '';

    // Determine which form is active
    const isEditModal = !!document.getElementById('pedit-titleEs');
    const titleEs     = isEditModal
      ? (document.getElementById('pedit-titleEs') || {}).value?.trim()
      : (event.target.querySelector('[name="titleEs"]') || {}).value?.trim();
    const categoryId  = isEditModal
      ? (document.getElementById('pedit-categoryId') || {}).value
      : (event.target.querySelector('[name="categoryId"]') || {}).value;
    const descriptionEs = isEditModal
      ? (document.getElementById('pedit-descriptionEs') || {}).value?.trim()
      : (event.target.querySelector('[name="descriptionEs"]') || {}).value?.trim();
    const tagsRaw     = isEditModal
      ? (document.getElementById('pedit-tags') || {}).value?.trim()
      : (event.target.querySelector('[name="tags"]') || {}).value?.trim();
    const badge       = isEditModal
      ? (document.getElementById('pedit-badge') || {}).value
      : (event.target.querySelector('[name="badge"]') || {}).value;
    const isActive    = isEditModal
      ? !!(document.getElementById('pedit-isActive') || {}).checked
      : !!(event.target.querySelector('[name="isActive"]') || {}).checked;

    if (!titleEs) {
      if (errEl) errEl.textContent = 'El título es requerido.';
      return;
    }
    if (!categoryId) {
      if (errEl) errEl.textContent = 'La categoría es requerida.';
      return;
    }

    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];

    const data = {
      titleEs,
      titleEn: titleEs,
      categoryId,
      descriptionEs: descriptionEs || null,
      descriptionEn: descriptionEs || null,
      tags,
      badge: badge || null,
      isActive
    };

    const btn = document.getElementById('pedit-save-btn') ||
                event.target.querySelector('button[type="submit"]');
    spin(btn, true);

    try {
      if (_editingProductId) {
        await adminApi.adminUpdateProduct(_editingProductId, data);
        toast('Producto actualizado');
      } else {
        await adminApi.adminCreateProduct(data);
        toast('Producto creado');
      }
      spin(btn, false);
      _closeProductModal();
      // Also close add-product form if it was open
      const formWrap = document.getElementById('add-product-form-wrap');
      if (formWrap) formWrap.classList.remove('open');
      const addForm = document.getElementById('add-product-form');
      if (addForm) addForm.reset();
      await loadProducts();
    } catch (err) {
      if (errEl) errEl.textContent = err.detail || 'Error al guardar el producto.';
      spin(btn, false);
    }
  }

  // -- Task 4.3 ï¿½ deleteProduct ----------------------------------------------

  async function deleteProduct(id) {
    if (!await adminConfirm('¿Eliminar este producto? Esta acción no se puede deshacer.', 'Eliminar Producto')) return;
    const btn = document.getElementById('prod-del-' + id);
    spin(btn, true);
    try {
      await adminApi.adminDeleteProduct(id);
      toast('Producto eliminado');
      await loadProducts();
    } catch (err) {
      if (err.status === 409) {
        toast(err.detail || 'No se puede eliminar: el producto tiene pedidos activos.', false);
      } else {
        toast(err.detail || 'Error al eliminar el producto.', false);
      }
      spin(btn, false);
    }
  }

  // -- Delete variant (helper used from product modal) -----------------------

  async function _deleteVariant(productId, variantId) {
    if (!await adminConfirm('¿Eliminar esta variante?', 'Eliminar Variante')) return;
    try {
      await adminApi.adminDeleteVariant(productId, variantId);
      toast('Variante eliminada');
      await openEditProductModal(productId);
    } catch (err) {
      toast(err.detail || 'Error al eliminar la variante.', false);
    }
  }

  // -- Task 12.1 ï¿½ _loadMaterialsCache --------------------------------------

  async function _loadMaterialsCache() {
    try {
      if (typeof AdminCosts !== 'undefined' && AdminCosts.getMaterials) {
        const cached = AdminCosts.getMaterials();
        if (cached && cached.length) {
          _materials = cached;
          // Build materials map for quick lookup
          _materialsMap = {};
          _materials.forEach(m => {
            _materialsMap[m.id] = m;
          });
          return;
        }
      }
      _materials = await adminApi.adminGetMaterials();
      // Build materials map for quick lookup
      _materialsMap = {};
      _materials.forEach(m => {
        _materialsMap[m.id] = m;
      });
    } catch (e) {
      _materials = [];
      _materialsMap = {};
    }
  }

  // Returns materials filtered to the current product's category (or all if no category match)
  function _filteredMaterials() {
    const catId = _currentProduct && _currentProduct.categoryId;
    if (!catId) return _materials;
    const filtered = _materials.filter(m => m.categoryId === catId);
    return filtered.length ? filtered : _materials;
  }

  // -- Task 12.1 — _addMaterialUsageRow -------------------------------------

  function _addMaterialUsageRow() {
    const list  = _filteredMaterials();
    const usedIds = new Set(_materialUsageRows.map(r => r.materialId));
    const first = list.find(m => !usedIds.has(m.id));
    if (!first) return; // all materials already in use — safety guard
    _materialUsageRows.push({
      materialId: first ? first.id : '',
      baseCost:   first ? (first.baseCost || 0) : 0,
      name:       first ? first.name : '',
      quantity:   1
    });
    _renderMaterialUsagesTable();
    _updatePricePreview();
  }

  // -- Task 12.1 ï¿½ _removeMaterialUsageRow ----------------------------------

  function _removeMaterialUsageRow(idx) {
    _materialUsageRows.splice(idx, 1);
    _renderMaterialUsagesTable();
    _updatePricePreview();
  }

  // -- Task 12.1 — _onMaterialUsageRowChange --------------------------------

  function _onMaterialUsageRowChange(idx) {
    const matSelect = document.getElementById('vmod-mat-sel-' + idx);
    const qtyInput  = document.getElementById('vmod-mat-qty-' + idx);
    if (!matSelect || !qtyInput) return;

    const matId = matSelect.value;
    const mat   = _materials.find(m => m.id === matId);
    const qty   = parseFloat(qtyInput.value) || 0;

    _materialUsageRows[idx].materialId = matId;
    _materialUsageRows[idx].baseCost   = mat ? (mat.baseCost || 0) : 0;
    _materialUsageRows[idx].name       = mat ? mat.name : '';
    _materialUsageRows[idx].quantity   = qty;

    _renderMaterialUsagesTable();
    _updatePricePreview();
  }

    // -- Task 12.1 — _renderMaterialUsagesTable -------------------------------

  function _renderMaterialUsagesTable() {
    const table    = document.getElementById('vmod-material-usages-table');
    const tbody    = document.getElementById('vmod-material-usages-tbody');
    const emptyEl  = document.getElementById('vmod-material-usages-empty');
    if (!tbody) return;

    const addBtn = document.getElementById('vmod-add-material-btn');
    if (!_materialUsageRows.length) {
      if (table)   table.style.display = 'none';
      if (emptyEl) emptyEl.style.display = '';
      if (addBtn)  addBtn.removeAttribute('disabled');
      return;
    }

    if (table)   table.style.display = '';
    if (emptyEl) emptyEl.style.display = 'none';

    const list = _filteredMaterials();
    const usedIds = new Set(_materialUsageRows.map(r => r.materialId));

    tbody.innerHTML = _materialUsageRows.map((row, idx) => {
      const lineCost = row.baseCost * row.quantity;

      const opts = list.filter(m => !usedIds.has(m.id) || m.id === row.materialId).map(m =>
        '<option value="' + esc(m.id) + '"' + (m.id === row.materialId ? ' selected' : '') + '>' +
          esc(m.name) + (m.sizeLabel ? ' — ' + esc(m.sizeLabel) : '') +
        '</option>'
      ).join('');

      const selMat   = _materialsMap[row.materialId];
      const stock    = selMat ? (selMat.stockQuantity ?? 0) : null;
      const stockTxt = stock === null ? '—' : String(stock);
      const stockClr = stock === null ? '#64748b'
                     : stock <= 0    ? '#f87171'
                     : stock <= 5    ? '#eab308'
                     :                 '#22c55e';
      const stockBg  = stock === null ? 'rgba(100,116,139,0.12)'
                     : stock <= 0    ? 'rgba(248,113,113,0.12)'
                     : stock <= 5    ? 'rgba(234,179,8,0.12)'
                     :                 'rgba(34,197,94,0.12)';

      return '<tr class="vmod-mat-row">' +
        '<td class="vmod-mat-cell">' +
          '<select id="vmod-mat-sel-' + idx + '"' +
                  ' onchange="AdminProducts._onMaterialUsageRowChange(' + idx + ')"' +
                  ' class="inline-select">' +
            opts +
          '</select>' +
        '</td>' +
        '<td class="vmod-mat-cell vmod-mat-cell--stock">' +
          '<span class="vmod-stock-badge" style="color:' + stockClr + ';background:' + stockBg + '">' +
            stockTxt +
          '</span>' +
        '</td>' +
        '<td class="vmod-mat-cell vmod-mat-cell--qty">' +
          '<input type="number" step="0.001" min="0.001"' +
                 ' id="vmod-mat-qty-' + idx + '"' +
                 ' value="' + esc(String(row.quantity)) + '"' +
                 ' onchange="AdminProducts._onMaterialUsageRowChange(' + idx + ')"' +
                 ' oninput="AdminProducts._onMaterialUsageRowChange(' + idx + ')"' +
                 ' class="inline-input-sm">' +
        '</td>' +
        '<td class="vmod-mat-cell vmod-mat-cell--cost" id="vmod-mat-cost-' + idx + '">' +
          '$' + fmt(lineCost) +
        '</td>' +
        '<td class="vmod-mat-cell vmod-mat-cell--del">' +
          '<button type="button"' +
                  ' onclick="AdminProducts._removeMaterialUsageRow(' + idx + ')"' +
                  ' title="Eliminar fila"' +
                  ' class="vmod-mat-del-btn">' +
            '<i class="fas fa-times"></i>' +
          '</button>' +
        '</td>' +
        '</tr>';
    }).join('');

    if (addBtn) {
      if (_materialUsageRows.length >= list.length) {
        addBtn.setAttribute('disabled', 'disabled');
      } else {
        addBtn.removeAttribute('disabled');
      }
    }
  }

    // -- Task 5.3 ï¿½ _updatePricePreview ---------------------------------------

  function _updatePricePreview() {
    const productionCostEl = document.getElementById('vmod-production-cost');
    const profitEl         = document.getElementById('vmod-profit');
    const previewEl        = document.getElementById('vmod-price-preview');
    const discountEl       = document.getElementById('vmod-discount-preview');
    if (!previewEl) return;

    // Sum material usages: S(baseCost ï¿½ quantity)
    const matCost = _materialUsageRows.reduce((sum, row) => sum + (row.baseCost * row.quantity), 0);

    // Manufacture time ï¿½ electric cost per hour
    const minutes = parseFloat((document.getElementById('vmod-manufactureTimeMinutes') || {}).value) || 0;
    const globalParams = (typeof AdminCosts !== 'undefined' && AdminCosts.getGlobalParams)
      ? AdminCosts.getGlobalParams() : [];
    const electricParam = globalParams.find(p => p.key === 'electric_cost_per_hour');
    const electricPerHour = electricParam ? (parseFloat(electricParam.value) || 0) : 0;
    const electricCost = (minutes / 60) * electricPerHour;

    const productionCost = matCost + electricCost;
    if (productionCostEl) productionCostEl.value = fmt(productionCost);

    const profit = parseFloat((profitEl || {}).value) || 0;
    const basePrice = (productionCost + profit) * 1.16;

    // Apply active discounts from the current variant
    const now = new Date();
    let effectivePrice = basePrice;
    if (_editingVariantId && _currentProduct && _currentProduct.variants) {
      const variant = _currentProduct.variants.find(v => v.id === _editingVariantId);
      const discounts = (variant && variant.discounts) ? variant.discounts : [];
      discounts.forEach(function(d) {
        const starts = d.startsAt ? new Date(d.startsAt) : null;
        const ends   = d.endsAt   ? new Date(d.endsAt)   : null;
        const active = (!starts || starts <= now) && (!ends || ends >= now);
        if (!active) return;
        if (d.discountType === 'Percentage') {
          effectivePrice = effectivePrice * (1 - d.value / 100);
        } else if (d.discountType === 'Fixed' || d.discountType === 'FixedAmount') {
          effectivePrice = Math.max(0, effectivePrice - d.value);
        }
      });
    }

    const hasDiscount = effectivePrice < basePrice;
    previewEl.value = '$' + fmt(effectivePrice);
    previewEl.style.color = hasDiscount ? '#fb923c' : '';

    // Show/hide discount line
    if (discountEl) {
      if (hasDiscount) {
        discountEl.textContent = 'Sin descuento: $' + fmt(basePrice);
        discountEl.style.display = '';
      } else {
        discountEl.style.display = 'none';
      }
    }
  }

  function _setVmodField(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
  }

  function _getVmodField(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }
  // -- Task 5.4 ï¿½ openEditVariantModal --------------------------------------

  async function openEditVariantModal(productId, variantId) {
    const modal = document.getElementById('var-edit-modal');
    if (!modal) return;

    _editingVariantId = variantId || null;
    _editingVariantProductId = productId;

    // Reset form
    const form = document.getElementById('var-edit-modal-form');
    if (form) form.reset();
    const errEl = document.getElementById('vmod-err');
    if (errEl) errEl.textContent = '';

    let variant = null;

    if (variantId && _currentProduct && _currentProduct.variants) {
      variant = _currentProduct.variants.find(v => v.id === variantId) || null;
    }

    // Populate identity fields
    _setVmodField('vmod-labelEs', variant ? (variant.labelEs || variant.label || '') : '');
    _setVmodField('vmod-sku',     variant ? (variant.sku || '') : '');

    const availEl  = document.getElementById('vmod-avail');
    const designEl = document.getElementById('vmod-design');
    if (availEl)  availEl.checked  = variant ? (variant.isAvailable ?? true) : true;
    if (designEl) designEl.checked = variant ? (variant.acceptsDesignFile ?? false) : false;

    // Profit
    _setVmodField('vmod-profit', variant ? (variant.profit ?? 0) : 0);
    _setVmodField('vmod-manufactureTimeMinutes', variant ? (variant.manufactureTimeMinutes ?? 0) : 0);

    // Load materials cache
    await _loadMaterialsCache();

    // Populate _materialUsageRows from variant.materialUsages dict { materialId: quantity }
    _materialUsageRows = [];
    if (variant && variant.materialUsages && Object.keys(variant.materialUsages).length) {
      for (const [matId, qty] of Object.entries(variant.materialUsages)) {
        const mat = _materials.find(m => m.id === matId);
        _materialUsageRows.push({
          materialId: matId,
          baseCost:   mat ? (mat.baseCost || 0) : 0,
          name:       mat ? mat.name : matId,
          quantity:   qty
        });
      }
    }
    _renderMaterialUsagesTable();

    // Render discounts section
    _renderVariantDiscounts(productId, variantId, variant);

    // Show hint for new variants (no discount form until saved)
    const newVariantHint = document.getElementById('vmod-new-variant-hint');
    if (newVariantHint) newVariantHint.style.display = variantId ? 'none' : '';

    // Update price preview
    _updatePricePreview();

    modal.style.display = 'flex';
  }

  // -- Task 5.5 ï¿½ saveVariantModal -------------------------------------------

  async function saveVariantModal(event) {
    event.preventDefault();
    const errEl = document.getElementById('vmod-err');
    if (errEl) errEl.textContent = '';

    const labelEs = _getVmodField('vmod-labelEs');
    const sku     = _getVmodField('vmod-sku');

    if (!labelEs) {
      if (errEl) errEl.textContent = 'El label es requerido.';
      return;
    }
    if (!sku) {
      if (errEl) errEl.textContent = 'El SKU es requerido.';
      return;
    }

    const availEl  = document.getElementById('vmod-avail');
    const designEl = document.getElementById('vmod-design');

    // Build materialUsages map: { materialId: quantity }
    const materialUsages = {};
    for (const row of _materialUsageRows) {
      if (!row.materialId) continue;
      const qty = parseFloat(row.quantity);
      if (!isNaN(qty) && qty > 0) {
        materialUsages[row.materialId] = qty;
      }
    }

    const data = {
      labelEs,
      sku,
      isAvailable:          availEl  ? availEl.checked  : true,
      acceptsDesignFile:    designEl ? designEl.checked : false,
      profit:               parseFloat(_getVmodField('vmod-profit')) || 0,
      manufactureTimeMinutes: parseInt(_getVmodField('vmod-manufactureTimeMinutes'), 10) || 0,
      materialUsages
    };

    const btn = event.target.querySelector('button[type="submit"]');
    spin(btn, true);

    try {
      if (_editingVariantId) {
        await adminApi.adminUpdateVariant(_editingVariantProductId, _editingVariantId, data);
        toast('Variante actualizada');
      } else {
        await adminApi.adminCreateVariant(_editingVariantProductId, data);
        toast('Variante creada');
      }
      spin(btn, false);
      // Capture the product ID before closing (close nulls it out)
      const productIdToRefresh = _editingVariantProductId;
      _closeVariantModal();
      // Refresh the product modal to show updated variants
      if (productIdToRefresh) {
        await openEditProductModal(productIdToRefresh);
      }
      // Refresh the products table in the background to update status badges
      await loadProducts();
    } catch (err) {
      if (errEl) errEl.textContent = err.detail || 'Error al guardar la variante.';
      spin(btn, false);
    }
  }

  // -- Task 6.2 ï¿½ _renderVariantDiscounts -----------------------------------

  function _renderVariantDiscounts(productId, variantId, variant) {
    const container = document.getElementById('vmod-discounts-body');
    if (!container) return;

    const discounts = (variant && variant.discounts) ? variant.discounts : [];

    const discountRows = discounts.length
      ? discounts.map(d => {
          // Check if discount is active (Vigente) or expired (Expirado)
          const now = new Date();
          const starts = d.startsAt ? new Date(d.startsAt) : null;
          const ends = d.endsAt ? new Date(d.endsAt) : null;
          const isActive = (!starts || starts <= now) && (!ends || ends >= now);
          
          const statusLabel = isActive ? 'Vigente' : 'Expirado';
          const statusColor = isActive ? '#22c55e' : '#f87171';
          const statusBg = isActive ? 'rgba(34,197,94,0.12)' : 'rgba(248,113,113,0.12)';
          const statusBorder = isActive ? 'rgba(34,197,94,0.35)' : 'rgba(248,113,113,0.35)';
          
          return `
          <tr>
            <td>${esc(d.discountType || '—')}</td>
            <td>${d.discountType === 'Percentage' ? esc(d.value) + '%' : '$' + fmt(d.value)}</td>
            <td style="color:#94a3b8;font-size:1rem">${d.startsAt ? new Date(d.startsAt).toLocaleDateString('es-MX') : '—'}</td>
            <td style="color:#94a3b8;font-size:1rem">${d.endsAt ? new Date(d.endsAt).toLocaleDateString('es-MX') : '—'}</td>
            <td style="text-align:center">
              <span style="display:inline-block;padding:2px 10px;border-radius:999px;font-size:1rem;font-weight:600;background:${statusBg};color:${statusColor};border:1px solid ${statusBorder}">
                ${statusLabel}
              </span>
            </td>
            <td>
              <button class="btn-admin btn-admin-danger btn-admin-sm"
                      onclick="AdminProducts._deleteVariantDiscount('${esc(productId)}','${esc(variantId)}','${esc(d.id)}')"
                      title="Eliminar descuento">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>`;
        }).join('')
      : '<tr><td colspan="6" style="color:#64748b;font-size:1rem;padding:8px 0">Sin descuentos.</td></tr>';

    container.innerHTML = `
      <hr style="border:none;border-top:1px solid rgba(139,92,246,0.15);margin:16px 0">
      <div style="font-size:1rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px">
        <i class="fas fa-tag" style="color:#8b5cf6;margin-right:6px"></i>Descuentos de Variante
      </div>
      <table class="admin-table" style="font-size:1rem;margin-bottom:12px">
        <thead><tr><th>Tipo</th><th>Valor</th><th>Desde</th><th>Hasta</th><th>Estado</th><th></th></tr></thead>
        <tbody>${discountRows}</tbody>
      </table>
      ${variantId ? `
      <form id="vmod-add-discount-form" class="admin-form"
            style="grid-template-columns:1fr 1fr 1fr 1fr auto;gap:8px;align-items:end"
            onsubmit="AdminProducts._addVariantDiscount(event,'${esc(productId)}','${esc(variantId)}')" novalidate>
        <div class="form-field" style="margin:0">
          <label style="font-size:1rem">Tipo</label>
          <select id="vmod-disc-type" class="inline-input">
            <option value="Percentage">Porcentaje (%)</option>
            <option value="Fixed">Fijo (MXN)</option>
          </select>
        </div>
        <div class="form-field" style="margin:0">
          <label style="font-size:1rem">Valor</label>
          <input type="number" step="0.01" min="0" id="vmod-disc-value" value="0" class="inline-input">
        </div>
        <div class="form-field" style="margin:0">
          <label style="font-size:1rem">Desde</label>
          <input type="date" id="vmod-disc-starts" class="inline-input">
        </div>
        <div class="form-field" style="margin:0">
          <label style="font-size:1rem">Hasta</label>
          <input type="date" id="vmod-disc-ends" class="inline-input">
        </div>
        <button type="submit" class="btn-admin btn-admin-primary btn-admin-sm" style="margin-bottom:0">
          <i class="fas fa-plus"></i> Agregar
        </button>
        <div class="form-error admin-form-full" id="vmod-disc-err"></div>
      </form>` : ''}`;
  }

  async function _addVariantDiscount(event, productId, variantId) {
    event.preventDefault();
    const errEl = document.getElementById('vmod-disc-err');
    if (errEl) errEl.textContent = '';

    const discountType = (document.getElementById('vmod-disc-type') || {}).value;
    const value        = parseFloat((document.getElementById('vmod-disc-value') || {}).value);
    const startsAt     = (document.getElementById('vmod-disc-starts') || {}).value || null;
    const endsAt       = (document.getElementById('vmod-disc-ends') || {}).value || null;

    if (isNaN(value) || value < 0) {
      if (errEl) errEl.textContent = 'El valor debe ser un número no negativo.';
      return;
    }

    const btn = event.target.querySelector('button[type="submit"]');
    spin(btn, true);
    try {
      await adminApi.adminCreateVariantDiscount(productId, variantId, { discountType, value, startsAt, endsAt });
      toast('Descuento agregado');
      // Refresh variant in product and re-render discounts
      if (_currentProduct) {
        const updated = await adminApi.adminGetProduct(_currentProduct.id);
        _currentProduct = updated;
        const updatedVariant = updated.variants ? updated.variants.find(v => v.id === variantId) : null;
        _renderVariantDiscounts(productId, variantId, updatedVariant);
        _updatePricePreview();
      }
    } catch (err) {
      if (errEl) errEl.textContent = err.detail || 'Error al agregar el descuento.';
    }
    spin(btn, false);
  }

  async function _deleteVariantDiscount(productId, variantId, discountId) {
    if (!await adminConfirm('¿Eliminar este descuento?', 'Eliminar Descuento')) return;
    try {
      await adminApi.adminDeleteDiscount(discountId);
      toast('Descuento eliminado');
      if (_currentProduct) {
        const updated = await adminApi.adminGetProduct(_currentProduct.id);
        _currentProduct = updated;
        const updatedVariant = updated.variants ? updated.variants.find(v => v.id === variantId) : null;
        _renderVariantDiscounts(productId, variantId, updatedVariant);
        _updatePricePreview();
      }
    } catch (err) {
      toast(err.detail || 'Error al eliminar el descuento.', false);
    }
  }

  // -- Product-level discounts -----------------------------------------------

  function _renderProductDiscounts(product) {
    const container = document.getElementById('prod-discounts-body');
    if (!container) return;

    const discounts = (product && product.discounts) ? product.discounts : [];

    const discountRows = discounts.length
      ? discounts.map(d => {
          const now = new Date();
          const starts = d.startsAt ? new Date(d.startsAt) : null;
          const ends = d.endsAt ? new Date(d.endsAt) : null;
          const isActive = (!starts || starts <= now) && (!ends || ends >= now);
          
          const statusLabel = isActive ? 'Vigente' : 'Expirado';
          const statusColor = isActive ? '#22c55e' : '#f87171';
          const statusBg = isActive ? 'rgba(34,197,94,0.12)' : 'rgba(248,113,113,0.12)';
          const statusBorder = isActive ? 'rgba(34,197,94,0.35)' : 'rgba(248,113,113,0.35)';
          
          return `
          <tr>
            <td>${esc(d.discountType || '—')}</td>
            <td>${d.discountType === 'Percentage' ? esc(d.value) + '%' : '$' + fmt(d.value)}</td>
            <td style="color:#94a3b8;font-size:1rem">${d.startsAt ? new Date(d.startsAt).toLocaleDateString('es-MX') : '—'}</td>
            <td style="color:#94a3b8;font-size:1rem">${d.endsAt ? new Date(d.endsAt).toLocaleDateString('es-MX') : '—'}</td>
            <td style="text-align:center">
              <span style="display:inline-block;padding:2px 10px;border-radius:999px;font-size:1rem;font-weight:600;background:${statusBg};color:${statusColor};border:1px solid ${statusBorder}">
                ${statusLabel}
              </span>
            </td>
            <td>
              <button class="btn-admin btn-admin-danger btn-admin-sm"
                      onclick="AdminProducts._deleteProductDiscount('${esc(product.id)}','${esc(d.id)}')"
                      title="Eliminar descuento">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>`;
        }).join('')
      : '<tr><td colspan="6" style="color:#64748b;font-size:1rem;padding:8px 0">Sin descuentos de producto.</td></tr>';

    container.innerHTML = `
      <hr style="border:none;border-top:1px solid rgba(139,92,246,0.15);margin:16px 0">
      <div style="font-size:1rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px">
        <i class="fas fa-tag" style="color:#8b5cf6;margin-right:6px"></i>Descuentos de Producto
      </div>
      <table class="admin-table" style="font-size:1rem;margin-bottom:12px">
        <thead><tr><th>Tipo</th><th>Valor</th><th>Desde</th><th>Hasta</th><th>Estado</th><th></th></tr></thead>
        <tbody>${discountRows}</tbody>
      </table>
      <form id="prod-add-discount-form" class="admin-form"
            style="grid-template-columns:1fr 1fr 1fr 1fr auto;gap:8px;align-items:end"
            onsubmit="AdminProducts._addProductDiscount(event,'${esc(product.id)}')" novalidate>
        <div class="form-field" style="margin:0">
          <label style="font-size:1rem">Tipo</label>
          <select id="prod-disc-type" class="inline-input">
            <option value="Percentage">Porcentaje (%)</option>
            <option value="Fixed">Fijo (MXN)</option>
          </select>
        </div>
        <div class="form-field" style="margin:0">
          <label style="font-size:1rem">Valor</label>
          <input type="number" step="0.01" min="0" id="prod-disc-value" value="0" class="inline-input">
        </div>
        <div class="form-field" style="margin:0">
          <label style="font-size:1rem">Desde</label>
          <input type="date" id="prod-disc-starts" class="inline-input">
        </div>
        <div class="form-field" style="margin:0">
          <label style="font-size:1rem">Hasta</label>
          <input type="date" id="prod-disc-ends" class="inline-input">
        </div>
        <button type="submit" class="btn-admin btn-admin-primary btn-admin-sm" style="margin-bottom:0">
          <i class="fas fa-plus"></i> Agregar
        </button>
        <div class="form-error admin-form-full" id="prod-disc-err"></div>
      </form>`;
  }

  async function _addProductDiscount(event, productId) {
    event.preventDefault();
    const errEl = document.getElementById('prod-disc-err');
    if (errEl) errEl.textContent = '';

    const discountType = (document.getElementById('prod-disc-type') || {}).value;
    const value        = parseFloat((document.getElementById('prod-disc-value') || {}).value);
    const startsAt     = (document.getElementById('prod-disc-starts') || {}).value || null;
    const endsAt       = (document.getElementById('prod-disc-ends') || {}).value || null;

    if (isNaN(value) || value < 0) {
      if (errEl) errEl.textContent = 'El valor debe ser un número no negativo.';
      return;
    }

    const btn = event.target.querySelector('button[type="submit"]');
    spin(btn, true);
    try {
      await adminApi.adminCreateProductDiscount(productId, { discountType, value, startsAt, endsAt });
      toast('Descuento de producto agregado');
      await openEditProductModal(productId);
    } catch (err) {
      if (errEl) errEl.textContent = err.detail || 'Error al agregar el descuento.';
      spin(btn, false);
    }
  }

  async function _deleteProductDiscount(productId, discountId) {
    if (!await adminConfirm('¿Eliminar este descuento de producto?', 'Eliminar Descuento')) return;
    try {
      await adminApi.adminDeleteDiscount(discountId);
      toast('Descuento de producto eliminado');
      await openEditProductModal(productId);
    } catch (err) {
      toast(err.detail || 'Error al eliminar el descuento.', false);
    }
  }

  // -- Public API ------------------------------------------------------------

  window.AdminProducts = {
    // Core
    init,
    loadProducts,
    renderProductsTable,
    renderCategoryFilterButtons,
    _filterByCategory,
    // Product CRUD
    openEditProductModal,
    saveProductModal,
    deleteProduct,
    _closeProductModal,
    _deleteVariant,
    // Variant CRUD
    openEditVariantModal,
    saveVariantModal,
    _closeVariantModal,
    // Material usages editor
    _loadMaterialsCache,
    _addMaterialUsageRow,
    _removeMaterialUsageRow,
    _onMaterialUsageRowChange,
    _renderMaterialUsagesTable,
    _updatePricePreview,
    // Discounts
    _renderVariantDiscounts,
    _addVariantDiscount,
    _deleteVariantDiscount,
    _renderProductDiscounts,
    _addProductDiscount,
    _deleteProductDiscount
  };

}(window));
