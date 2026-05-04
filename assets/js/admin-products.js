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
    pageSize: 500,   // fetch all — category filtering is client-side
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
  let _currentProductAssignedCategories = []; // Stores assigned categories for the category modal
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

  // -- Task 3.1 — loadProducts -----------------------------------------------

  async function loadProducts(params) {
    const tbody = document.getElementById('products-tbody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:#64748b">' +
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
      // Populate the add-product dropdown in case it's visible
      _populateAddProductCategoryDropdown();
    } catch (e) {
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="7" style="color:#f87171;text-align:center;padding:24px">' +
          '<i class="fas fa-exclamation-triangle"></i> Error al cargar productos</td></tr>';
      }
    }
  }

  function _applyFilter() {
    if (state.categoryId) {
      state.filtered = state.items.filter(p => p.processId === state.categoryId);
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

  // -- Task 3.2 — renderProductsTable ---------------------------------------

  function renderProductsTable() {
    const tbody = document.getElementById('products-tbody');
    if (!tbody) return;

    const total = state.filtered.length;
    const start = (state.viewPage - 1) * state.viewPageSize;
    const items = state.filtered.slice(start, start + state.viewPageSize);

    if (!total) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#64748b;padding:24px">Sin productos</td></tr>';
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
      
      // Format categories display - show only unique parent categories with icons
      const categories = p.categoryAssignments || [];
      let categoriesDisplay;
      if (categories.length === 0) {
        categoriesDisplay = '<span class="category-none" data-translate="admin_no_categories">Sin categorías</span>';
      } else {
        // Extract unique parent categories
        const uniqueParents = {};
        categories.forEach(c => {
          const catId = c.categoryId || c.CategoryId;
          const catName = c.categoryName || c.CategoryName;
          const catIcon = c.categoryIcon || c.CategoryIcon || '📁';
          if (catId && !uniqueParents[catId]) {
            uniqueParents[catId] = { name: catName, icon: catIcon };
          }
        });
        
        const parentCategories = Object.values(uniqueParents);
        
        if (parentCategories.length <= 3) {
          const chips = parentCategories.map(cat => 
            '<span class="table-category-chip">' +
              '<span class="table-category-icon">' + esc(cat.icon) + '</span>' +
              '<span class="table-category-name">' + esc(cat.name || '—') + '</span>' +
            '</span>'
          ).join('');
          categoriesDisplay = '<div style="display:flex;flex-wrap:wrap;gap:4px">' + chips + '</div>';
        } else {
          const firstThree = parentCategories.slice(0, 3).map(cat => 
            '<span class="table-category-chip">' +
              '<span class="table-category-icon">' + esc(cat.icon) + '</span>' +
              '<span class="table-category-name">' + esc(cat.name || '—') + '</span>' +
            '</span>'
          ).join('');
          const remaining = parentCategories.length - 3;
          categoriesDisplay = '<div style="display:flex;flex-wrap:wrap;gap:4px;align-items:center">' + 
            firstThree + 
            '<span class="category-more">+' + remaining + ' <span data-translate="admin_more_categories">más</span></span>' +
            '</div>';
        }
      }
      
      return `
      <tr>
        <td style="font-weight:600;color:#e2e8f0">${esc(p.titleEs || p.title || '—')}</td>
        <td style="color:#94a3b8;font-size:1rem">${esc(p.processNameEs || '—')}</td>
        <td style="color:#94a3b8;font-size:1rem">${categoriesDisplay}</td>
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
      countMap[p.processId] = (countMap[p.processId] || 0) + 1;
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
          ${esc(c.name)} <span class="prod-cat-filter-count">${count}</span>
        </button>`;
    }).join('');

    container.innerHTML = allBtn + catBtns;
  }

  function _filterByCategory(categoryId) {
    state.categoryId = categoryId || null;
    _applyFilter();
    renderCategoryFilterButtons();
  }

  // -- Helper to populate add-product category dropdown ---------------------

  function _populateAddProductCategoryDropdown() {
    const select = document.getElementById('add-product-category');
    if (!select) return;

    const categories = (typeof AdminCategories !== 'undefined' && AdminCategories.getCategories)
      ? AdminCategories.getCategories()
      : [];

    const currentValue = select.value;
    select.innerHTML = '<option value="">-- Seleccionar --</option>' +
      categories.map(c => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');
    
    // Restore previous selection if it still exists
    if (currentValue && categories.some(c => c.id === currentValue)) {
      select.value = currentValue;
    }
  }

  // -- Task 3.3 — init -------------------------------------------------------

  function init() {
    // Add-product button opens modal
    const addProductBtn = document.getElementById('btn-add-product');
    if (addProductBtn) {
      addProductBtn.addEventListener('click', () => {
        openEditProductModal(null);
      });
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

    // Ensure processes are loaded before rendering the modal
    if (typeof AdminProcesses !== 'undefined' && AdminProcesses.getProcesses) {
      const processes = AdminProcesses.getProcesses();
      if (!processes || processes.length === 0) {
        console.log('Processes not loaded, loading now...');
        await AdminProcesses.loadProcesses();
      }
    }

    let product = null;
    if (id) {
      try {
        console.log('[AdminProducts] Fetching product data from server for ID:', id);
        // Always bust cache to ensure we get fresh data (especially after material cost updates)
        product = await adminApi.adminGetProduct(id, true);
        _currentProduct = product;
        console.log('[AdminProducts] Product data fetched:', {
          id: product.id,
          title: product.titleEs,
          variantCount: product.variants?.length,
          variants: product.variants?.map(v => ({
            id: v.id,
            label: v.labelEs,
            baseCost: v.baseCost,
            price: v.price
          }))
        });
      } catch (e) {
        body.innerHTML = '<div style="color:#f87171;text-align:center;padding:24px">' +
          '<i class="fas fa-exclamation-triangle"></i> ' +
          esc(e.detail || 'Error al cargar el producto') + '</div>';
        return;
      }
    }

    const categories = (typeof AdminProcesses !== 'undefined' && AdminProcesses.getProcesses)
      ? AdminProcesses.getProcesses()
      : [];

    const catOptions = categories.map(c =>
      `<option value="${esc(c.id)}" ${product && product.processId === c.id ? 'selected' : ''}>${esc(c.nameEs)}</option>`
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
                
                // Row highlight based on pricing alert
                const rowBg = v.pricingAlert === 'loss'      ? 'rgba(248,113,113,0.08)'
                            : v.pricingAlert === 'breakeven' ? 'rgba(234,179,8,0.08)'
                            : '';
                
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
                const alertIcon = v.pricingAlert === 'loss'
                  ? ' <i class="fas fa-exclamation-circle" style="color:#f87171;margin-left:4px" title="Precio por debajo del costo — variante desactivada"></i>'
                  : v.pricingAlert === 'breakeven'
                  ? ' <i class="fas fa-exclamation-triangle" style="color:#eab308;margin-left:4px" title="Precio por debajo del punto de equilibrio — variante desactivada"></i>'
                  : '';
                const discountCell = hasDiscount
                  ? `<span style="color:#fb923c;font-weight:700">$${fmt(effectivePrice)}</span>
                     <span style="color:#64748b;font-size:1rem;text-decoration:line-through;margin-left:4px">$${fmt(v.price)}</span>` + alertIcon
                  : `<span style="color:#e2e8f0">$${fmt(v.price ?? 0)}</span>` + alertIcon;
                return `<tr style="background:${rowBg}">
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
          : `<div style="margin-top:20px;padding:16px;border-radius:8px;background:rgba(139,92,246,0.08);border:1px solid rgba(139,92,246,0.2)">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
                <i class="fas fa-info-circle" style="color:#a78bfa;font-size:1.2rem"></i>
                <span style="font-size:1rem;font-weight:600;color:#c4b5fd">Variantes del Producto</span>
              </div>
              <p style="color:#94a3b8;font-size:1rem;margin:0">
                Para agregar variantes, primero debes guardar el producto. Una vez guardado, podrás agregar y configurar las variantes con sus materiales, precios y atributos.
              </p>
            </div>`);

    body.innerHTML = `
      <form id="prod-edit-form" class="admin-form" novalidate>
        <div class="form-field">
          <label>TÍTULO (ES) <span class="req">*</span></label>
          <input type="text" id="pedit-titleEs" value="${esc(product ? product.titleEs || product.title || '' : '')}" required placeholder="Nombre en español">
        </div>
        <div class="form-field">
          <label>SLUG <span class="req">*</span> <span style="color:#64748b;font-weight:400;font-size:1rem">(URL amigable)</span></label>
          <div style="display:flex;align-items:center;gap:8px">
            <input type="text" id="pedit-slug"
                   value="${esc(product ? product.slug || '' : '')}"
                   required
                   placeholder="mi-producto-ejemplo"
                   pattern="[a-z0-9\\-]+"
                   title="Solo letras minúsculas, números y guiones"
                   style="flex:1">
            ${!product ? `<button type="button" id="pedit-slug-auto" class="btn-admin btn-admin-secondary btn-admin-sm" title="Generar desde título">
              <i class="fas fa-magic"></i> Auto
            </button>` : ''}
          </div>
          <span style="color:#64748b;font-size:1rem">Ejemplo: <code style="color:#a78bfa">/producto/taza-personalizada-uv</code></span>
        </div>
        <div class="form-field">
          <label>PROCESAMIENTO ${product ? '' : '<span class="req">*</span>'}</label>
          ${product
            ? `<div style="padding:8px 12px;border-radius:6px;background:rgba(255,255,255,0.04);
                           border:1px solid rgba(255,255,255,0.08);color:#e2e8f0;font-size:1rem;
                           display:flex;align-items:center;gap:8px">
                 <i class="fas fa-lock" style="color:#475569;font-size:1rem"></i>
                 ${esc(product.processNameEs || '—')}
               </div>
               <input type="hidden" id="pedit-categoryId" value="${esc(product.processId)}">`
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
      
      <!-- Category Assignment Section -->
      <div class="admin-form-full category-assignment-section">
        <div class="category-assignment-header" style="display:flex;justify-content:space-between;align-items:center">
          <div style="display:flex;align-items:center;gap:8px">
            <i class="fas fa-tags"></i>
            <span>Categorías</span>
          </div>
          <button type="button" class="btn-admin btn-admin-secondary btn-admin-sm" 
                  onclick="AdminProducts._openCategoryAssignmentModal()">
            <i class="fas fa-edit"></i> Asignar categorías
          </button>
        </div>
        <div id="product-categories-summary" class="category-assignment-summary" style="padding:12px;background:rgba(139,92,246,0.05);border-radius:6px;min-height:40px">
          <span style="color:#64748b;font-size:1rem">Cargando...</span>
        </div>
      </div>
      
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

    // Auto-slug: generate from title on button click or on title input (new products only)
    const titleInput = document.getElementById('pedit-titleEs');
    const slugInput  = document.getElementById('pedit-slug');
    const autoBtn    = document.getElementById('pedit-slug-auto');

    function _titleToSlug(title) {
      return title.trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip accents
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    }

    if (autoBtn && slugInput && titleInput) {
      autoBtn.addEventListener('click', () => {
        slugInput.value = _titleToSlug(titleInput.value);
      });
    }
    // For new products: auto-fill slug as user types title (only if slug is still empty or was auto-filled)
    if (!product && titleInput && slugInput) {
      let _slugManuallyEdited = false;
      slugInput.addEventListener('input', () => { _slugManuallyEdited = true; });
      titleInput.addEventListener('input', () => {
        if (!_slugManuallyEdited) {
          slugInput.value = _titleToSlug(titleInput.value);
        }
      });
    }

    // Render product-level discounts
    if (product) _renderProductDiscounts(product);

    // Render category assignment UI (Task 12.2)
    await _renderCategoryAssignmentUI(product);
  }

  // -- Task 12.2 — _renderCategoryAssignmentUI ---------------------------------

  /**
   * Render the category assignment UI in the product editor modal.
   * Now shows a summary in the product modal and provides a button to open
   * a separate modal for full category assignment.
   * 
   * @param {Object} product - Product object (null for new products)
   */
  async function _renderCategoryAssignmentUI(product) {
    const summaryContainer = document.getElementById('product-categories-summary');
    if (!summaryContainer) return;

    // Show loading state
    summaryContainer.innerHTML = '<span style="color:#64748b;font-size:1rem">' +
      '<i class="fas fa-spinner fa-spin"></i> Cargando categorías...</span>';

    try {
      // Fetch currently assigned categories for this product (if editing)
      let assignedCategories = [];
      if (product && product.id) {
        try {
          assignedCategories = await adminApi.adminGetProductCategories(product.id);
        } catch (e) {
          console.error('Error loading assigned categories:', e);
        }
      }

      // Store assigned categories for the modal
      _currentProductAssignedCategories = assignedCategories;

      // Render summary
      if (!assignedCategories.length) {
        summaryContainer.innerHTML = '<span style="color:#64748b;font-size:1rem">' +
          '<i class="fas fa-folder-open"></i> Sin categorías asignadas</span>';
      } else {
        // Group by parent category for elegant hierarchical display
        const grouped = {};
        assignedCategories.forEach(c => {
          const catId = c.categoryId || c.CategoryId;
          const catName = c.categoryName || c.CategoryName;
          const catIcon = c.categoryIcon || c.CategoryIcon || '📁';
          const subName = c.subCategoryName || c.SubCategoryName || c.name || c.Name;
          const subIcon = c.subCategoryIcon || c.SubCategoryIcon || c.icon || c.Icon || '📄';
          
          if (!grouped[catId]) {
            grouped[catId] = {
              name: catName,
              icon: catIcon,
              subcategories: []
            };
          }
          grouped[catId].subcategories.push({ name: subName, icon: subIcon });
        });
        
        // Render hierarchical chips
        const hierarchicalChips = Object.values(grouped).map(cat => {
          const subChips = cat.subcategories.map(sub => 
            '<span class="category-subchip">' +
              '<span class="category-subchip-icon">' + esc(sub.icon) + '</span>' +
              '<span class="category-subchip-name">' + esc(sub.name) + '</span>' +
            '</span>'
          ).join('');
          
          return '<div class="category-group-chip">' +
            '<div class="category-parent-chip">' +
              '<span class="category-parent-icon">' + esc(cat.icon) + '</span>' +
              '<span class="category-parent-name">' + esc(cat.name) + '</span>' +
            '</div>' +
            '<div class="category-subchips-container">' + subChips + '</div>' +
          '</div>';
        }).join('');
        
        summaryContainer.innerHTML = '<div class="category-hierarchy-display">' + hierarchicalChips + '</div>';
      }
    } catch (e) {
      console.error('Error rendering category summary:', e);
      summaryContainer.innerHTML = '<span style="color:#f87171;font-size:1rem">' +
        '<i class="fas fa-exclamation-triangle"></i> Error al cargar categorías</span>';
    }
  }

  /**
   * Render simplified two-level category structure.
   * Shows categories with their subcategories as checkboxes.
   * @param {Array} categories - Array of category objects
   * @param {Array} assignedIds - Array of currently assigned category IDs
   * @returns {string} HTML string for the category tree
   */
  function _renderSimplifiedCategoryTree(categories, assignedIds) {
    if (!categories || !categories.length) return '';

    return '<div class="simplified-category-tree" style="display:flex;flex-direction:column;gap:16px">' +
      categories.map(category => {
        const icon = category.icon || '📁';
        const name = category.name || '(Sin nombre)';
        const subcategories = category.subCategories || [];

        let html = '<div class="category-group" style="border:1px solid rgba(139,92,246,0.2);border-radius:8px;padding:12px;background:rgba(139,92,246,0.05)">';
        
        // Category header
        html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:' + (subcategories.length ? '12px' : '0') + '">' +
          '<span style="font-size:1.2rem">' + esc(icon) + '</span>' +
          '<span style="color:#e2e8f0;font-size:1rem;font-weight:600">' + esc(name) + '</span>' +
          '</div>';

        // Subcategories as checkboxes
        if (subcategories.length) {
          html += '<div style="display:flex;flex-direction:column;gap:8px;padding-left:32px">';
          subcategories.forEach(sub => {
            const isChecked = assignedIds.includes(sub.id);
            const subIcon = sub.icon || '📄';
            const subName = sub.name || '(Sin nombre)';
            
            html += '<label style="display:flex;align-items:center;gap:8px;cursor:pointer">' +
              '<input type="checkbox" ' +
              'class="category-assignment-checkbox" ' +
              'data-category-id="' + esc(sub.id) + '" ' +
              'data-parent-category-id="' + esc(category.id) + '" ' +
              (isChecked ? 'checked ' : '') +
              'style="width:16px;height:16px;cursor:pointer">' +
              '<span style="font-size:1rem">' + esc(subIcon) + '</span>' +
              '<span style="color:#e2e8f0;font-size:1rem">' + esc(subName) + '</span>' +
              '</label>';
          });
          html += '</div>';
        } else {
          html += '<div style="color:#64748b;font-size:1rem;padding-left:32px">Sin subcategorías</div>';
        }

        html += '</div>';
        return html;
      }).join('') +
      '</div>';
  }

  // -- Category Assignment Modal (separate modal on top of product modal) ---

  /**
   * Open the category assignment modal.
   * This modal stacks on top of the product modal for better UX.
   */
  function _openCategoryAssignmentModal() {
    console.log('Opening category assignment modal...');
    
    let modal = document.getElementById('category-assignment-modal');
    if (!modal) {
      console.log('Modal not found, creating it...');
      _createCategoryAssignmentModal();
      modal = document.getElementById('category-assignment-modal');
    }
    
    if (!modal) {
      console.error('Failed to create category assignment modal');
      return;
    }
    
    console.log('Modal found, displaying it...');
    modal.style.display = 'flex';
    _renderCategoryAssignmentModalContent();
  }

  /**
   * Close the category assignment modal and refresh the summary in the product modal.
   */
  function _closeCategoryAssignmentModal() {
    const modal = document.getElementById('category-assignment-modal');
    if (modal) modal.style.display = 'none';
    
    // Refresh the summary in the product modal
    const product = _editingProductId ? { id: _editingProductId } : null;
    _renderCategoryAssignmentUI(product);
  }

  /**
   * Create the category assignment modal HTML and append to body.
   */
  function _createCategoryAssignmentModal() {
    const modalHtml = `
      <div id="category-assignment-modal" class="admin-modal-overlay" 
           style="display:none;position:fixed;inset:0;z-index:10650;align-items:center;justify-content:center;background:rgba(0,0,0,0.75);backdrop-filter:blur(4px)">
        <div class="admin-modal-box" style="max-width:600px">
          <button class="admin-modal-close" onclick="AdminProducts._closeCategoryAssignmentModal()" aria-label="Cerrar">
            <i class="fas fa-times"></i>
          </button>
          <div class="admin-modal-title">
            <i class="fas fa-tags" style="margin-right:8px"></i>
            Asignar Categorías
          </div>
          <div class="admin-modal-subtitle" style="display:flex;justify-content:space-between;align-items:center">
            <span>Selecciona las categorías para este producto</span>
            <button type="button" class="btn-admin btn-admin-danger btn-admin-sm" 
                    onclick="AdminProducts._clearAllCategories()"
                    title="Desmarcar todas las categorías">
              <i class="fas fa-times-circle"></i> Limpiar todo
            </button>
          </div>
          
          <div id="category-assignment-modal-content" style="max-height:500px;overflow-y:auto;padding:12px 0">
            <div style="text-align:center;padding:24px;color:#64748b">
              <i class="fas fa-spinner fa-spin"></i> Cargando...
            </div>
          </div>
          
          <div class="modal-error" id="category-assignment-modal-err"></div>
          <div style="display:flex;gap:10px;margin-top:18px">
            <button type="button" class="btn-modal-ghost" style="flex:1" onclick="AdminProducts._closeCategoryAssignmentModal()">
              <i class="fas fa-times"></i>&nbsp; Cancelar
            </button>
            <button type="button" class="btn-modal-primary" style="flex:1" onclick="AdminProducts._saveCategoryAssignmentModal()">
              <i class="fas fa-save"></i>&nbsp; Guardar
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    console.log('Category assignment modal created and appended to body');
  }

  /**
   * Render the collapsible category tree in the assignment modal.
   */
  async function _renderCategoryAssignmentModalContent() {
    const container = document.getElementById('category-assignment-modal-content');
    if (!container) return;

    container.innerHTML = '<div style="text-align:center;padding:24px;color:#64748b">' +
      '<i class="fas fa-spinner fa-spin"></i> Cargando categorías...</div>';

    try {
      // Ensure categories are loaded before rendering
      if (typeof AdminCategories !== 'undefined' && AdminCategories.loadCategories) {
        const categories = AdminCategories.getCategories();
        if (!categories || categories.length === 0) {
          console.log('[AdminProducts] Categories not loaded, loading now...');
          await AdminCategories.loadCategories();
        }
      }
      
      // Fetch all categories
      const allCategories = (typeof AdminCategories !== 'undefined' && AdminCategories.getCategories)
        ? AdminCategories.getCategories()
        : [];

      // Get assigned category/subcategory pairs
      // _currentProductAssignedCategories now contains {categoryId, subCategoryId, ...}
      const assignedIds = _currentProductAssignedCategories;

      if (!allCategories.length) {
        container.innerHTML = '<div style="text-align:center;color:#64748b;padding:24px;font-size:1rem">' +
          '<i class="fas fa-folder-open" style="font-size:1.5rem;margin-bottom:8px;display:block;opacity:0.5"></i>' +
          'No hay categorías disponibles' +
          '</div>';
        return;
      }

      // Render collapsible category tree
      container.innerHTML = _renderCollapsibleCategoryTree(allCategories, assignedIds);
    } catch (e) {
      console.error('Error rendering category assignment modal:', e);
      container.innerHTML = '<div style="color:#f87171;text-align:center;padding:24px;font-size:1rem">' +
        '<i class="fas fa-exclamation-triangle"></i> Error al cargar categorías' +
        '</div>';
    }
  }

  /**
   * Render collapsible category tree with expand/collapse functionality.
   * @param {Array} categories - Array of category objects
   * @param {Array} assignedIds - Array of currently assigned category IDs
   * @returns {string} HTML string for the collapsible tree
   */
  function _renderCollapsibleCategoryTree(categories, assignedIds) {
    if (!categories || !categories.length) return '';

    return '<div class="collapsible-category-tree" style="display:flex;flex-direction:column;gap:8px">' +
      categories.map((category, idx) => {
        const icon = category.icon || '📁';
        const name = category.name || '(Sin nombre)';
        const subcategories = category.subCategories || [];
        const hasSubcategories = subcategories.length > 0;

        let html = '<div class="category-collapsible-group" style="border:1px solid rgba(139,92,246,0.2);border-radius:8px;overflow:hidden">';
        
        // Category header (clickable to expand/collapse)
        html += '<div class="category-collapsible-header" ' +
          'onclick="AdminProducts._toggleCategoryCollapse(\'cat-' + idx + '\')" ' +
          'style="display:flex;align-items:center;justify-content:space-between;padding:12px;background:rgba(139,92,246,0.08);cursor:pointer;user-select:none">' +
          '<div style="display:flex;align-items:center;gap:8px">' +
            '<i class="fas fa-chevron-right category-collapse-icon" id="cat-icon-' + idx + '" ' +
            'style="color:#8b5cf6;font-size:1rem;transition:transform 0.2s"></i>' +
            '<span style="font-size:1.2rem">' + esc(icon) + '</span>' +
            '<span style="color:#e2e8f0;font-size:1rem;font-weight:600">' + esc(name) + '</span>' +
          '</div>' +
          '<span style="color:#64748b;font-size:1rem">' + subcategories.length + ' subcategorías</span>' +
          '</div>';

        // Subcategories (collapsible)
        if (hasSubcategories) {
          html += '<div id="cat-' + idx + '" class="category-collapsible-content" style="display:none;padding:12px;background:rgba(139,92,246,0.03)">';
          html += '<div style="display:flex;flex-direction:column;gap:8px">';
          
          subcategories.forEach(sub => {
            // Check if this specific subcategory is assigned (not just the parent category)
            const isChecked = assignedIds.some(a => 
              a.categoryId === category.id && a.subCategoryId === sub.id
            );
            const subIcon = sub.icon || '📄';
            const subName = sub.name || '(Sin nombre)';
            
            html += '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:6px;border-radius:4px;transition:background 0.2s" ' +
              'onmouseover="this.style.background=\'rgba(139,92,246,0.1)\'" ' +
              'onmouseout="this.style.background=\'\'">' +
              '<input type="checkbox" ' +
              'class="category-assignment-checkbox" ' +
              'data-category-id="' + esc(sub.id) + '" ' +
              'data-parent-category-id="' + esc(category.id) + '" ' +
              (isChecked ? 'checked ' : '') +
              'style="width:18px;height:18px;cursor:pointer;accent-color:#8b5cf6">' +
              '<span style="font-size:1rem">' + esc(subIcon) + '</span>' +
              '<span style="color:#e2e8f0;font-size:1rem">' + esc(subName) + '</span>' +
              '</label>';
          });
          
          html += '</div></div>';
        } else {
          html += '<div id="cat-' + idx + '" class="category-collapsible-content" style="display:none;padding:12px;background:rgba(139,92,246,0.03)">' +
            '<div style="color:#64748b;font-size:1rem;text-align:center">Sin subcategorías</div>' +
            '</div>';
        }

        html += '</div>';
        return html;
      }).join('') +
      '</div>';
  }

  /**
   * Toggle collapse/expand for a category.
   * @param {string} categoryId - Category element ID
   */
  function _toggleCategoryCollapse(categoryId) {
    const content = document.getElementById(categoryId);
    const icon = document.getElementById(categoryId.replace('cat-', 'cat-icon-'));
    
    if (!content) return;
    
    if (content.style.display === 'none') {
      content.style.display = 'block';
      if (icon) icon.style.transform = 'rotate(90deg)';
    } else {
      content.style.display = 'none';
      if (icon) icon.style.transform = 'rotate(0deg)';
    }
  }

  /**
   * Save category assignments from the modal.
   */
  async function _saveCategoryAssignmentModal() {
    if (!_editingProductId) {
      toast('Debes guardar el producto primero antes de asignar categorías.', false);
      return;
    }

    const errEl = document.getElementById('category-assignment-modal-err');
    if (errEl) errEl.textContent = '';

    try {
      const selectedIds = _getSelectedCategoryIds();
      await _saveCategoryAssignments(_editingProductId, selectedIds);
      toast('Categorías guardadas');
      _closeCategoryAssignmentModal();
    } catch (err) {
      if (errEl) errEl.textContent = err.message || 'Error al guardar categorías.';
    }
  }

  /**
   * Clear all category selections in the assignment modal.
   */
  function _clearAllCategories() {
    const checkboxes = document.querySelectorAll('.category-assignment-checkbox:checked');
    checkboxes.forEach(cb => {
      cb.checked = false;
    });
    toast('Todas las categorías desmarcadas', true);
  }

  /**
   * Get selected category IDs from the category assignment checkboxes.
   * Returns an array of objects with categoryId and subCategoryId.
   * @returns {Array} Array of {categoryId, subCategoryId} objects
   */
  function _getSelectedCategoryIds() {
    const checkboxes = document.querySelectorAll('.category-assignment-checkbox:checked');
    return Array.from(checkboxes).map(cb => ({
      categoryId: cb.dataset.parentCategoryId,
      subCategoryId: cb.dataset.categoryId
    }));
  }

  // -- Task 12.3 — _saveCategoryAssignments ----------------------------------

  /**
   * Save category assignments for a product.
   * Collects checked category IDs from checkbox tree and calls PUT /api/v1/admin/products/{id}/categories.
   * Handles validation errors gracefully.
   * 
   * @param {string} productId - Product ID
   * @param {Array} selectedCategoryIds - Array of selected category IDs
   * @returns {Promise<void>}
   * Requirements: 5.4, 5.5, 5.6
   */
  async function _saveCategoryAssignments(productId, selectedCategoryIds) {
    if (!productId) {
      throw new Error('Product ID is required to save category assignments');
    }

    try {
      await adminApi.adminUpdateProductCategories(productId, selectedCategoryIds);
    } catch (err) {
      // Re-throw with user-friendly message
      const errorMessage = err.detail || 'Error al guardar las categorías del producto.';
      throw new Error(errorMessage);
    }
  }

  // -- Task 4.2 — saveProductModal -------------------------------------------

  async function saveProductModal(event) {
    event.preventDefault();
    const errEl = document.getElementById('pedit-err');
    if (errEl) errEl.textContent = '';

    const titleEs = (document.getElementById('pedit-titleEs') || {}).value?.trim();
    const slugRaw = (document.getElementById('pedit-slug') || {}).value?.trim();
    const categoryId = (document.getElementById('pedit-categoryId') || {}).value;
    const descriptionEs = (document.getElementById('pedit-descriptionEs') || {}).value?.trim();
    const tagsRaw = (document.getElementById('pedit-tags') || {}).value?.trim();
    const badge = (document.getElementById('pedit-badge') || {}).value;
    const isActive = !!(document.getElementById('pedit-isActive') || {}).checked;

    if (!titleEs) {
      if (errEl) errEl.textContent = 'El título es requerido.';
      return;
    }
    if (!slugRaw) {
      if (errEl) errEl.textContent = 'El slug es requerido.';
      return;
    }
    const slug = slugRaw.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (!slug) {
      if (errEl) errEl.textContent = 'El slug solo puede contener letras minúsculas, números y guiones.';
      return;
    }
    if (!categoryId) {
      if (errEl) errEl.textContent = 'El procesamiento es requerido.';
      return;
    }
    if (!descriptionEs) {
      if (errEl) errEl.textContent = 'La descripción es requerida.';
      return;
    }

    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];

    const data = {
      titleEs,
      slug,
      processId: categoryId,
      descriptionEs,
      tags,
      badge: badge || null,
      isActive
    };

    const btn = document.getElementById('pedit-save-btn');
    spin(btn, true);

    try {
      let savedProductId;
      if (_editingProductId) {
        await adminApi.adminUpdateProduct(_editingProductId, data);
        savedProductId = _editingProductId;
        toast('Producto actualizado');
      } else {
        const result = await adminApi.adminCreateProduct(data);
        savedProductId = result.id;
        toast('Producto creado');
      }

      // Save category assignments for existing products only (Task 12.3)
      if (_editingProductId) {
        try {
          const selectedCategoryIds = _getSelectedCategoryIds();
          await _saveCategoryAssignments(savedProductId, selectedCategoryIds);
        } catch (categoryErr) {
          // Don't close modal if category assignment fails - allow user to retry
          if (errEl) errEl.textContent = categoryErr.message || 'Error al guardar las categorías del producto.';
          spin(btn, false);
          return;
        }
      }

      spin(btn, false);
      _closeProductModal();
      await loadProducts();
    } catch (err) {
      if (errEl) errEl.textContent = err.detail || 'Error al guardar el producto.';
      spin(btn, false);
    }
  }

  // -- Task 4.3 — deleteProduct ----------------------------------------------

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

  // -- Task 12.1 — _loadMaterialsCache --------------------------------------

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
    const catId = _currentProduct && _currentProduct.processId;
    if (!catId) return _materials;
    const filtered = _materials.filter(m => m.processId === catId);
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

  // -- Task 12.1 — _removeMaterialUsageRow ----------------------------------

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

  function _checkStockAndUpdateAvailability() {
    const availEl = document.getElementById('vmod-avail');
    if (!availEl) return;

    // Check if any material has zero stock
    let hasZeroStock = false;
    for (const row of _materialUsageRows) {
      const mat = _materialsMap[row.materialId];
      if (mat && (mat.stockQuantity ?? 0) <= 0) {
        hasZeroStock = true;
        break;
      }
    }

    if (hasZeroStock) {
      availEl.checked = false;
      availEl.disabled = true;
      availEl.title = 'No se puede marcar como disponible: uno o más materiales sin stock';
    } else {
      availEl.disabled = false;
      availEl.title = '';
    }
  }

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
      _checkStockAndUpdateAvailability();
      return;
    }

    if (table)   table.style.display = '';
    if (emptyEl) emptyEl.style.display = 'none';

    const list = _filteredMaterials();
    const usedIds = new Set(_materialUsageRows.map(r => r.materialId));

    tbody.innerHTML = _materialUsageRows.map((row, idx) => {
      const lineCost = row.baseCost * row.quantity;

      const opts = list.filter(m => !usedIds.has(m.id) || m.id === row.materialId).map(m => {
        return '<option value="' + esc(m.id) + '"' + (m.id === row.materialId ? ' selected' : '') + '>' +
          esc(m.name) +
        '</option>';
      }).join('');

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

      // Stock warning message
      const stockWarning = stock !== null && stock <= 0 
        ? '<div style="color:#f87171;font-size:1rem;margin-top:4px"><i class="fas fa-exclamation-triangle"></i> Sin stock disponible</div>'
        : stock !== null && stock <= 5
        ? '<div style="color:#eab308;font-size:1rem;margin-top:4px"><i class="fas fa-exclamation-triangle"></i> Stock bajo</div>'
        : '';

      return '<tr class="vmod-mat-row">' +
        '<td class="vmod-mat-cell" style="padding:6px 8px">' +
          '<select id="vmod-mat-sel-' + idx + '"' +
                  ' onchange="AdminProducts._onMaterialUsageRowChange(' + idx + ')"' +
                  ' style="width:100%;background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:6px 10px;border-radius:6px;font-size:1rem;font-family:Poppins,sans-serif">' +
            opts +
          '</select>' +
          stockWarning +
        '</td>' +
        '<td class="vmod-mat-cell vmod-mat-cell--stock" style="padding:6px 8px;text-align:center">' +
          '<span class="vmod-stock-badge" style="color:' + stockClr + ';background:' + stockBg + ';padding:4px 10px;border-radius:999px;font-weight:600;font-size:0.875rem;display:inline-block;white-space:nowrap">' +
            stockTxt +
          '</span>' +
        '</td>' +
        '<td class="vmod-mat-cell vmod-mat-cell--qty" style="padding:6px 8px;text-align:right">' +
          '<input type="number" step="0.01" min="0.01"' +
                 ' id="vmod-mat-qty-' + idx + '"' +
                 ' value="' + esc(String(row.quantity)) + '"' +
                 ' onchange="AdminProducts._onMaterialUsageRowChange(' + idx + ')"' +
                 ' style="width:90px;background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:6px 10px;border-radius:6px;font-size:1rem;text-align:right">' +
        '</td>' +
        '<td class="vmod-mat-cell vmod-mat-cell--cost" id="vmod-mat-cost-' + idx + '" style="padding:6px 8px;text-align:right;color:#94a3b8;font-weight:600;font-size:1rem">' +
          '$' + fmt(lineCost) +
        '</td>' +
        '<td class="vmod-mat-cell vmod-mat-cell--del" style="padding:6px 8px;text-align:center">' +
          '<button type="button"' +
                  ' onclick="AdminProducts._removeMaterialUsageRow(' + idx + ')"' +
                  ' title="Eliminar fila"' +
                  ' class="btn-admin btn-admin-danger btn-admin-sm">' +
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

    _checkStockAndUpdateAvailability();
  }

    // -- Task 5.3 — _updatePricePreview ---------------------------------------

  function _updatePricePreview() {
    const productionCostEl = document.getElementById('vmod-production-cost');
    const profitEl         = document.getElementById('vmod-profit');
    const previewEl        = document.getElementById('vmod-price-preview');
    const discountEl       = document.getElementById('vmod-discount-preview');
    if (!previewEl) return;

    // Sum material usages: S(baseCost — quantity)
    const matCost = _materialUsageRows.reduce((sum, row) => sum + (row.baseCost * row.quantity), 0);

    // Manufacture time — electric cost per hour
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
    const breakeven = productionCost * 1.16;
    const belowBreakeven = effectivePrice < breakeven;

    // Price preview colour: red if below break-even, orange if discounted, default otherwise
    previewEl.value = '$' + fmt(effectivePrice);
    previewEl.style.color = belowBreakeven ? '#f87171' : hasDiscount ? '#fb923c' : '';

    // Warning + save button state
    const warningEl = document.getElementById('vmod-price-warning');
    const saveBtn   = document.getElementById('var-edit-modal-save');
    if (warningEl) warningEl.style.display = belowBreakeven ? '' : 'none';
    if (saveBtn)   saveBtn.disabled = belowBreakeven;

    // Break-even field
    const breakevenEl = document.getElementById('vmod-breakeven-preview');
    if (breakevenEl) {
      breakevenEl.value = '$' + fmt(breakeven);
      breakevenEl.style.color = belowBreakeven ? '#f87171' : '#64748b';
    }

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
  // -- Task 5.4 — openEditVariantModal --------------------------------------

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

    // Render images section
    _renderVariantImages(productId, variantId, variant);

    // Show hint for new variants (no discount form until saved)
    const newVariantHint = document.getElementById('vmod-new-variant-hint');
    if (newVariantHint) newVariantHint.style.display = variantId ? 'none' : '';

    // Update price preview
    _updatePricePreview();

    modal.style.display = 'flex';
  }

  // -- Task 5.5 — saveVariantModal -------------------------------------------

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

  // -- Variant images -------------------------------------------------------

  /**
   * Resolve a stored image value to a displayable URL.
   * In dev the backend returns full http://localhost:5205/uploads/... URLs.
   * Older entries may have raw S3 keys (no protocol) — leave them as-is;
   * the browser will show a broken image which is acceptable for stale dev data.
   */
  function _resolveImageUrl(url) {
    if (!url) return '';
    // Already a full URL
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    // Raw S3 key — derive the uploads URL from the API base
    const apiBase = (typeof adminApi !== 'undefined' && adminApi.apiFetch)
      ? window.FILAMORFOSIS_API_BASE || 'http://localhost:5205/api/v1'
      : 'http://localhost:5205/api/v1';
    const origin = apiBase.replace(/\/api\/v1\/?$/, '');
    return `${origin}/uploads/${url.replace(/^\//, '')}`;
  }

  /**
   * Render the variant images section below the form.
   * Shows existing images with delete buttons and an upload control.
   * Only shown when editing an existing variant (variantId is set).
   */
  function _renderVariantImages(productId, variantId, variant) {
    const container = document.getElementById('vmod-images-body');
    if (!container) return;

    const imageUrls = (variant && variant.imageUrls) ? variant.imageUrls : [];

    const thumbsHtml = imageUrls.length
      ? imageUrls.map((url, idx) => {
          const displayUrl = _resolveImageUrl(url);
          return `<div class="vmod-img-thumb" id="vmod-img-${idx}">
            <img src="${esc(displayUrl)}" alt="Imagen ${idx + 1}" loading="lazy">
            <button type="button"
                    class="vmod-img-delete"
                    onclick="AdminProducts._deleteVariantImage('${esc(productId)}','${esc(variantId)}','${esc(url)}')"
                    title="Eliminar imagen">
              <i class="fas fa-times"></i>
            </button>
          </div>`;
        }).join('')
      : '<span class="vmod-img-empty">Sin imágenes. Sube una imagen para esta variante.</span>';

    container.innerHTML = `
      <hr class="vmod-section-divider">
      <div class="vmod-section-label">
        <i class="fas fa-images"></i> Imágenes de Variante
      </div>
      <div class="vmod-img-grid">${thumbsHtml}</div>
      ${variantId ? `
      <div class="vmod-img-upload-row">
        <label class="btn-admin btn-admin-secondary btn-admin-sm vmod-img-upload-label" for="vmod-img-file-input">
          <i class="fas fa-upload"></i> Subir imagen
        </label>
        <input type="file" id="vmod-img-file-input" accept="image/png,image/jpeg"
               onchange="AdminProducts._uploadVariantImage('${esc(productId)}','${esc(variantId)}',this)">
        <span class="vmod-img-upload-hint">PNG o JPG, máx. 10 MB</span>
        <div class="form-error" id="vmod-img-err"></div>
      </div>` : `
      <p class="vmod-img-save-hint">Guarda la variante primero para poder subir imágenes.</p>`}`;
  }

  /**
   * Upload an image for a variant.
   * @param {string} productId
   * @param {string} variantId
   * @param {HTMLInputElement} input
   */
  async function _uploadVariantImage(productId, variantId, input) {
    const errEl = document.getElementById('vmod-img-err');
    if (errEl) errEl.textContent = '';

    const file = input.files && input.files[0];
    if (!file) return;

    // Reset input so the same file can be re-selected after deletion
    input.value = '';

    const label = document.querySelector('.vmod-img-upload-label');
    if (label) {
      label.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subiendo...';
      label.setAttribute('disabled', 'disabled');
    }

    try {
      const result = await adminApi.adminUploadVariantImage(productId, variantId, file);
      toast('Imagen subida');
      // Refresh variant data and re-render images
      if (_currentProduct) {
        const updated = await adminApi.adminGetProduct(_currentProduct.id, true);
        _currentProduct = updated;
        const updatedVariant = updated.variants ? updated.variants.find(v => v.id === variantId) : null;
        _renderVariantImages(productId, variantId, updatedVariant);
      }
    } catch (err) {
      if (errEl) errEl.textContent = err.detail || 'Error al subir la imagen.';
    } finally {
      if (label) {
        label.innerHTML = '<i class="fas fa-upload"></i> Subir imagen';
        label.removeAttribute('disabled');
      }
    }
  }

  /**
   * Delete an image from a variant.
   * @param {string} productId
   * @param {string} variantId
   * @param {string} imageUrl
   */
  async function _deleteVariantImage(productId, variantId, imageUrl) {
    if (!await adminConfirm('¿Eliminar esta imagen?', 'Eliminar Imagen')) return;
    try {
      await adminApi.adminDeleteVariantImage(productId, variantId, imageUrl);
      toast('Imagen eliminada');
      if (_currentProduct) {
        const updated = await adminApi.adminGetProduct(_currentProduct.id, true);
        _currentProduct = updated;
        const updatedVariant = updated.variants ? updated.variants.find(v => v.id === variantId) : null;
        _renderVariantImages(productId, variantId, updatedVariant);
      }
    } catch (err) {
      toast(err.detail || 'Error al eliminar la imagen.', false);
    }
  }

  // -- Task 6.2 — _renderVariantDiscounts -----------------------------------

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
    _deleteProductDiscount,
    // Variant images
    _renderVariantImages,
    _resolveImageUrl,
    _uploadVariantImage,
    _deleteVariantImage,
    // Category assignment (Task 12.2)
    _renderCategoryAssignmentUI,
    _getSelectedCategoryIds,
    // Category assignment modal
    _openCategoryAssignmentModal,
    _closeCategoryAssignmentModal,
    _toggleCategoryCollapse,
    _saveCategoryAssignmentModal,
    _clearAllCategories,
    // Expose editing state for external modules
    get _editingProductId() { return _editingProductId; }
  };

}(window));
