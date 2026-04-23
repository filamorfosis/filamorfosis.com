/**
 * admin-products.js — Products tab module for admin.html
 *
 * Responsibilities:
 *   - loadProducts(params)            paginated product list with search
 *   - renderProductsTable()           render #products-tbody rows
 *   - openEditProductModal(id)        fetch product, inject form, show modal
 *   - saveProductModal(event)         create or update product via API
 *   - deleteProduct(id)               confirm + delete product
 *   - openEditVariantModal(pid, vid)  populate variant form, load materials, show modal
 *   - saveVariantModal(event)         create or update variant via API
 *   - _loadMaterials(selectedId)      populate #vmod-materialId select
 *   - _onMaterialChange()             show/hide material info fields
 *   - _updatePricePreview()           compute (productionCost + profit) * 1.16
 *   - _renderSupplyInputs(categoryId) render dynamic supply cost inputs
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

  // ── Module state ──────────────────────────────────────────────────────────
  const state = {
    page: 1,
    pageSize: 20,
    search: '',
    total: 0,
    items: []
  };

  let _editingProductId = null;
  let _editingVariantId = null;
  let _editingVariantProductId = null;
  let _materials = [];
  let _categorySupplies = {};   // { [categoryId]: CostParameterDto[] }
  let _currentProduct = null;   // full product object while edit modal is open

  // ── Helpers ───────────────────────────────────────────────────────────────

  function esc(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function fmt(n) {
    return Number(n ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // ── Task 3.1 — loadProducts ───────────────────────────────────────────────

  async function loadProducts(params) {
    const tbody = document.getElementById('products-tbody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:#64748b">' +
        '<i class="fas fa-spinner fa-spin"></i> Cargando...</td></tr>';
    }
    try {
      const query = Object.assign({}, state, params);
      const result = await adminApi.adminGetProducts({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search || undefined
      });
      state.items = result.items || result || [];
      state.total = result.total ?? state.items.length;
      renderProductsTable();
      renderPagination('products-pagination', state, _goToPage);
    } catch (e) {
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="5" style="color:#f87171;text-align:center;padding:24px">' +
          '<i class="fas fa-exclamation-triangle"></i> Error al cargar productos</td></tr>';
      }
    }
  }

  function _goToPage(n) {
    state.page = n;
    loadProducts();
  }

  // ── Task 3.2 — renderProductsTable ───────────────────────────────────────

  function renderProductsTable() {
    const tbody = document.getElementById('products-tbody');
    if (!tbody) return;

    if (!state.items.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#64748b;padding:24px">Sin productos</td></tr>';
      return;
    }

    tbody.innerHTML = state.items.map(p => `
      <tr>
        <td style="font-weight:600;color:#e2e8f0">${esc(p.titleEs || p.title || '—')}</td>
        <td style="color:#94a3b8;font-size:1rem">${esc(p.categoryNameEs || p.categoryName || '—')}</td>
        <td>
          <span style="display:inline-block;padding:2px 10px;border-radius:999px;font-size:1rem;font-weight:600;
            background:${p.isActive ? 'rgba(34,197,94,0.15)' : 'rgba(100,116,139,0.15)'};
            color:${p.isActive ? '#22c55e' : '#64748b'};
            border:1px solid ${p.isActive ? 'rgba(34,197,94,0.4)' : 'rgba(100,116,139,0.4)'}">
            ${p.isActive ? 'Activo' : 'Inactivo'}
          </span>
        </td>
        <td style="color:#94a3b8;font-size:1rem">${p.variantCount ?? (p.variants ? p.variants.length : 0)}</td>
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
      </tr>`).join('');
  }

  // ── Task 3.3 — init ───────────────────────────────────────────────────────

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

  // ── Task 4.1 — openEditProductModal ──────────────────────────────────────

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
      { value: 'promo',   label: '🏷️ promo — Promo' },
      { value: 'popular', label: '⭐ popular — Popular' }
    ].map(b => `<option value="${esc(b.value)}" ${product && product.badge === b.value ? 'selected' : ''}>${esc(b.label)}</option>`).join('');

    const variants = product && product.variants ? product.variants : [];
    const variantsHtml = variants.length
      ? `<div style="margin-top:20px">
          <div style="font-size:1rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px">
            <i class="fas fa-cubes" style="color:#8b5cf6;margin-right:6px"></i>Variantes
          </div>
          <table class="admin-table" style="font-size:1rem">
            <thead><tr><th>Label (ES)</th><th>SKU</th><th>Stock</th><th>Precio</th><th>Acciones</th></tr></thead>
            <tbody>
              ${variants.map(v => `
                <tr>
                  <td>${esc(v.labelEs || v.label || '—')}</td>
                  <td style="font-family:monospace;font-size:1rem;color:#a5b4fc">${esc(v.sku || '—')}</td>
                  <td style="text-align:center">${v.stock ?? 0}</td>
                  <td style="text-align:right">$${fmt(v.price ?? 0)}</td>
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
                </tr>`).join('')}
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
          <label>Título (ES) <span class="req">*</span></label>
          <input type="text" id="pedit-titleEs" value="${esc(product ? product.titleEs || product.title || '' : '')}" required placeholder="Nombre en español">
        </div>
        <div class="form-field">
          <label>Categoría <span class="req">*</span></label>
          <select id="pedit-categoryId" required>
            <option value="">-- Seleccionar --</option>
            ${catOptions}
          </select>
        </div>
        <div class="form-field admin-form-full">
          <label>Descripción (ES)</label>
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
        <div class="form-actions admin-form-full">
          <button type="submit" class="btn-admin btn-admin-primary" id="pedit-save-btn">
            <i class="fas fa-save"></i> Guardar producto
          </button>
          <button type="button" class="btn-admin btn-admin-secondary" onclick="AdminProducts._closeProductModal()">
            Cancelar
          </button>
        </div>
      </form>
      ${variantsHtml}`;

    // Wire the form submit
    const form = document.getElementById('prod-edit-form');
    if (form) form.addEventListener('submit', saveProductModal);
  }

  // ── Task 4.2 — saveProductModal ───────────────────────────────────────────

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

  // ── Task 4.3 — deleteProduct ──────────────────────────────────────────────

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

  // ── Delete variant (helper used from product modal) ───────────────────────

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

  // ── Task 5.1 — _loadMaterials ─────────────────────────────────────────────

  async function _loadMaterials(selectedId) {
    const select = document.getElementById('vmod-materialId');
    if (!select) return;

    try {
      // Prefer cached materials from AdminCosts if available
      if (typeof AdminCosts !== 'undefined' && AdminCosts.getMaterials) {
        const cached = AdminCosts.getMaterials();
        if (cached && cached.length) {
          _materials = cached;
        } else {
          _materials = await adminApi.adminGetMaterials();
        }
      } else {
        _materials = await adminApi.adminGetMaterials();
      }
    } catch (e) {
      _materials = [];
    }

    select.innerHTML = '<option value="">-- Sin material --</option>' +
      _materials.map(m =>
        `<option value="${esc(m.id)}" ${selectedId && m.id === selectedId ? 'selected' : ''}>${esc(m.name)}${m.sizeLabel ? ' — ' + esc(m.sizeLabel) : ''}</option>`
      ).join('');

    // Trigger info display if a material is pre-selected
    if (selectedId) {
      _onMaterialChange();
    }
  }

  // ── Task 5.2 — _onMaterialChange ─────────────────────────────────────────

  function _onMaterialChange() {
    const select  = document.getElementById('vmod-materialId');
    const infoDiv = document.getElementById('vmod-mat-info');
    if (!select) return;

    const matId = select.value;
    const mat   = _materials.find(m => m.id === matId);

    if (mat && infoDiv) {
      infoDiv.style.display = '';
      _setVmodField('vmod-mat-sizeLabel', mat.sizeLabel || '');
      _setVmodField('vmod-mat-width',     mat.widthCm != null ? mat.widthCm : '');
      _setVmodField('vmod-mat-height',    mat.heightCm != null ? mat.heightCm : '');
      _setVmodField('vmod-mat-weight',    mat.weightGrams != null ? mat.weightGrams : '');
      _setVmodField('vmod-mat-baseCost',  mat.baseCost != null ? fmt(mat.baseCost) : '0.00');
    } else {
      if (infoDiv) infoDiv.style.display = 'none';
    }

    _updatePricePreview();
  }

  function _setVmodField(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
  }

  function _getVmodField(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  // ── Task 5.3 — _updatePricePreview ───────────────────────────────────────

  function _updatePricePreview() {
    const productionCostEl = document.getElementById('vmod-production-cost');
    const profitEl         = document.getElementById('vmod-profit');
    const previewEl        = document.getElementById('vmod-price-preview');
    if (!previewEl) return;

    // Gather material base cost
    const select = document.getElementById('vmod-materialId');
    const matId  = select ? select.value : '';
    const mat    = _materials.find(m => m.id === matId);
    const matCost = mat ? (mat.baseCost || 0) : 0;

    // Gather supply costs
    let supplyCost = 0;
    const supplyInputs = document.querySelectorAll('#vmod-supply-inputs input[type="number"]');
    supplyInputs.forEach(inp => {
      supplyCost += parseFloat(inp.value) || 0;
    });

    const productionCost = matCost + supplyCost;
    if (productionCostEl) productionCostEl.value = fmt(productionCost);

    const profit = parseFloat((profitEl || {}).value) || 0;
    const finalPrice = (productionCost + profit) * 1.16;

    previewEl.value = '$' + fmt(finalPrice);
  }

  // ── Task 5.4 — openEditVariantModal ──────────────────────────────────────

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
    _setVmodField('vmod-stock',   variant ? (variant.stock ?? 0) : 0);

    const availEl  = document.getElementById('vmod-avail');
    const designEl = document.getElementById('vmod-design');
    if (availEl)  availEl.checked  = variant ? (variant.isAvailable ?? true) : true;
    if (designEl) designEl.checked = variant ? (variant.acceptsDesignFile ?? false) : false;

    // Profit
    _setVmodField('vmod-profit', variant ? (variant.profit ?? 0) : 0);
    _setVmodField('vmod-manufactureTimeMinutes', variant ? (variant.manufactureTimeMinutes ?? 0) : 0);

    // Load materials and pre-select
    await _loadMaterials(variant ? variant.materialId : null);

    // Wire material change handler (once)
    const matSelect = document.getElementById('vmod-materialId');
    if (matSelect && !matSelect._wired) {
      matSelect._wired = true;
      matSelect.addEventListener('change', _onMaterialChange);
    }

    // Render supply inputs for the product's category
    const categoryId = _currentProduct ? _currentProduct.categoryId : null;
    if (categoryId) {
      await _renderSupplyInputs(categoryId, variant);
    }

    // Render discounts section
    _renderVariantDiscounts(productId, variantId, variant);

    // Update price preview
    _updatePricePreview();

    modal.style.display = 'flex';
  }

  // ── Task 5.5 — saveVariantModal ───────────────────────────────────────────

  async function saveVariantModal(event) {
    event.preventDefault();
    const errEl = document.getElementById('vmod-err');
    if (errEl) errEl.textContent = '';

    const labelEs = _getVmodField('vmod-labelEs');
    const sku     = _getVmodField('vmod-sku');
    const stock   = parseInt(_getVmodField('vmod-stock'), 10);

    if (!labelEs) {
      if (errEl) errEl.textContent = 'El label es requerido.';
      return;
    }
    if (!sku) {
      if (errEl) errEl.textContent = 'El SKU es requerido.';
      return;
    }
    if (isNaN(stock) || stock < 0) {
      if (errEl) errEl.textContent = 'El stock debe ser un número no negativo.';
      return;
    }

    const availEl  = document.getElementById('vmod-avail');
    const designEl = document.getElementById('vmod-design');
    const matSelect = document.getElementById('vmod-materialId');

    // Gather supply costs
    const supplyCosts = {};
    document.querySelectorAll('#vmod-supply-inputs input[type="number"]').forEach(inp => {
      if (inp.dataset.supplyId) {
        supplyCosts[inp.dataset.supplyId] = parseFloat(inp.value) || 0;
      }
    });

    const data = {
      labelEs,
      labelEn: labelEs,
      sku,
      stock,
      isAvailable:          availEl  ? availEl.checked  : true,
      acceptsDesignFile:    designEl ? designEl.checked : false,
      materialId:           matSelect && matSelect.value ? matSelect.value : null,
      profit:               parseFloat(_getVmodField('vmod-profit')) || 0,
      manufactureTimeMinutes: parseInt(_getVmodField('vmod-manufactureTimeMinutes'), 10) || 0,
      supplyCosts
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
      _closeVariantModal();
      // Refresh the product modal to show updated variants
      if (_editingVariantProductId) {
        await openEditProductModal(_editingVariantProductId);
      }
    } catch (err) {
      if (errEl) errEl.textContent = err.detail || 'Error al guardar la variante.';
      spin(btn, false);
    }
  }

  // ── Task 6.1 — _renderSupplyInputs ───────────────────────────────────────

  async function _renderSupplyInputs(categoryId, variant) {
    const container = document.getElementById('vmod-supply-inputs');
    if (!container) return;

    let supplies = _categorySupplies[categoryId];
    if (!supplies) {
      try {
        supplies = await adminApi.adminGetCategoryCostParameters(categoryId);
        _categorySupplies[categoryId] = supplies || [];
      } catch (e) {
        supplies = [];
        _categorySupplies[categoryId] = [];
      }
    }

    if (!supplies || !supplies.length) {
      container.innerHTML = '';
      return;
    }

    // Build supply cost map from variant if available
    const variantSupplyCosts = (variant && variant.supplyCosts) ? variant.supplyCosts : {};

    container.innerHTML = supplies.map(s => {
      const currentVal = variantSupplyCosts[s.id] != null ? variantSupplyCosts[s.id] : (s.value || 0);
      return `
        <div class="form-field" style="margin:0">
          <label style="font-size:1rem">${esc(s.label)} <span style="color:#64748b;font-weight:400">(${esc(s.unit || 'MXN')})</span></label>
          <input type="number" step="0.0001" min="0"
                 data-supply-id="${esc(s.id)}"
                 value="${Number(currentVal).toFixed(4)}"
                 oninput="AdminProducts._updatePricePreview()"
                 style="background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:6px 8px;border-radius:4px;width:100%">
        </div>`;
    }).join('');

    _updatePricePreview();
  }

  // ── Task 6.2 — _renderVariantDiscounts ───────────────────────────────────

  function _renderVariantDiscounts(productId, variantId, variant) {
    const container = document.getElementById('vmod-discounts-body');
    if (!container) return;

    const discounts = (variant && variant.discounts) ? variant.discounts : [];

    const discountRows = discounts.length
      ? discounts.map(d => `
          <tr>
            <td>${esc(d.discountType || '—')}</td>
            <td>${d.discountType === 'Percentage' ? esc(d.value) + '%' : '$' + fmt(d.value)}</td>
            <td style="color:#94a3b8;font-size:1rem">${d.startsAt ? new Date(d.startsAt).toLocaleDateString('es-MX') : '—'}</td>
            <td style="color:#94a3b8;font-size:1rem">${d.endsAt ? new Date(d.endsAt).toLocaleDateString('es-MX') : '—'}</td>
            <td>
              <button class="btn-admin btn-admin-danger btn-admin-sm"
                      onclick="AdminProducts._deleteVariantDiscount('${esc(productId)}','${esc(variantId)}','${esc(d.id)}')"
                      title="Eliminar descuento">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>`).join('')
      : '<tr><td colspan="5" style="color:#64748b;font-size:1rem;padding:8px 0">Sin descuentos.</td></tr>';

    container.innerHTML = `
      <hr style="border:none;border-top:1px solid rgba(139,92,246,0.15);margin:16px 0">
      <div style="font-size:1rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px">
        <i class="fas fa-tag" style="color:#8b5cf6;margin-right:6px"></i>Descuentos de Variante
      </div>
      <table class="admin-table" style="font-size:1rem;margin-bottom:12px">
        <thead><tr><th>Tipo</th><th>Valor</th><th>Desde</th><th>Hasta</th><th></th></tr></thead>
        <tbody>${discountRows}</tbody>
      </table>
      ${variantId ? `
      <form id="vmod-add-discount-form" class="admin-form"
            style="grid-template-columns:1fr 1fr 1fr 1fr auto;gap:8px;align-items:end"
            onsubmit="AdminProducts._addVariantDiscount(event,'${esc(productId)}','${esc(variantId)}')" novalidate>
        <div class="form-field" style="margin:0">
          <label style="font-size:1rem">Tipo</label>
          <select id="vmod-disc-type" style="background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:6px 8px;border-radius:4px;width:100%">
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
      </form>` : '<p style="color:#64748b;font-size:1rem">Guarda la variante primero para agregar descuentos.</p>'}`;
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
      }
    } catch (err) {
      toast(err.detail || 'Error al eliminar el descuento.', false);
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────

  window.AdminProducts = {
    // Core
    init,
    loadProducts,
    renderProductsTable,
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
    // Material helpers
    _loadMaterials,
    _onMaterialChange,
    _updatePricePreview,
    // Supply inputs
    _renderSupplyInputs,
    // Discounts
    _renderVariantDiscounts,
    _addVariantDiscount,
    _deleteVariantDiscount
  };

}(window));
