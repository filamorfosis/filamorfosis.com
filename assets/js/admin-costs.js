/**
 * admin-costs.js — Costos tab module for admin.html
 *
 * Responsibilities:
 *   - loadAll()                  fetch materials, cost parameters, global parameters in parallel
 *   - renderMaterialsTable()     render materials table with CRUD actions
 *   - openAddMaterialModal()     open modal to create a material
 *   - openEditMaterialModal(id)  open modal to edit a material
 *   - renderCostParameters()     render grouped cost parameter rows with inline save
 *   - renderGlobalParameters()   render global parameter rows with inline save
 *   - _onMatCategoryChange()     clear supply usages and repopulate selector on category change
 *   - _addSupplyUsageRow()       append a new empty supply usage row
 *   - _removeSupplyUsageRow(idx) remove a supply usage row
 *   - _updateBaseCostPreview()   recompute and display live BaseCost preview
 *
 * Requirements: 5.1–5.13, 6.1–6.7
 */

(function (window) {
  'use strict';

  // ── Module state ──────────────────────────────────────────────────────────
  let _materials = [];
  let _costParams = {};   // { [categoryNameEs]: CostParameterDto[] }
  let _globalParams = []; // GlobalParameterDto[]
  let _editingMaterialId = null;

  // Supply usages editor state: array of { costParameterId, unitCost, unit, label, quantity }
  let _supplyUsageRows = [];

  // Flat list of cost parameters for the currently selected category
  let _currentCategoryParams = [];

  // ── Helpers ───────────────────────────────────────────────────────────────

  function esc(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function fmt(n) {
    return Number(n ?? 0).toFixed(2);
  }

  function fmtCurrency(n) {
    return '$' + Number(n ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // ── 12.1 loadAll ─────────────────────────────────────────────────────────

  async function loadAll() {
    try {
      const [materials, costParams, globalParams] = await Promise.all([
        adminApi.adminGetMaterials(),
        adminApi.adminGetCostParameters(),
        adminApi.adminGetGlobalParameters()
      ]);
      _materials = materials || [];
      _costParams = costParams || {};
      _globalParams = globalParams || [];
      renderMaterialsTable();
      renderCostParameters();
      renderGlobalParameters();
    } catch (e) {
      toast('Error al cargar datos de costos', false);
    }
  }

  // ── 12.2 renderMaterialsTable ─────────────────────────────────────────────

  function renderMaterialsTable() {
    const tbody = document.getElementById('materials-tbody');
    if (!tbody) return;

    if (!_materials.length) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:#64748b;padding:24px">Sin materiales</td></tr>';
      return;
    }

    tbody.innerHTML = _materials.map(m => {
      const stock = m.stockQuantity ?? 0;
      const sC = stock > 0 ? '#22c55e' : '#f87171';
      const sB = stock > 0 ? 'rgba(34,197,94,0.12)' : 'rgba(248,113,113,0.12)';
      const sD = stock > 0 ? 'rgba(34,197,94,0.35)' : 'rgba(248,113,113,0.35)';
      return '<tr id="mat-row-' + esc(m.id) + '">' +
        '<td>' + esc(m.name) + '</td>' +
        '<td>' + esc(m.categoryNameEs || m.category || '—') + '</td>' +
        '<td>' + esc(m.sizeLabel || '—') + '</td>' +
        '<td>' + (m.widthCm != null ? fmt(m.widthCm) : '—') + '</td>' +
        '<td>' + (m.heightCm != null ? fmt(m.heightCm) : '—') + '</td>' +
        '<td>' + (m.weightGrams != null ? m.weightGrams : '—') + '</td>' +
        '<td>' + fmt(m.baseCost) + '</td>' +
        '<td style="text-align:center">' +
          '<span style="display:inline-block;padding:2px 10px;border-radius:999px;font-size:1rem;font-weight:700;' +
                'background:' + sB + ';color:' + sC + ';border:1px solid ' + sD + '">' + stock + '</span>' +
        '</td>' +
        '<td style="white-space:nowrap">' +
          '<button class="btn-admin btn-admin-secondary btn-admin-sm"' +
                  ' onclick="AdminCosts.openEditMaterialModal(\'' + esc(m.id) + '\')"' +
                  ' title="Editar material"><i class="fas fa-edit"></i></button> ' +
          '<button class="btn-admin btn-admin-danger btn-admin-sm"' +
                  ' onclick="AdminCosts.deleteMaterial(\'' + esc(m.id) + '\')"' +
                  ' id="mat-del-' + esc(m.id) + '"' +
                  ' title="Eliminar material"><i class="fas fa-trash"></i></button>' +
        '</td>' +
        '</tr>';
    }).join('');
  }

  // ── 12.3 Material modal (add / edit) ─────────────────────────────────────

  function _getMaterialModal() {
    return document.getElementById('material-modal');
  }

  function _getMaterialForm() {
    return document.getElementById('material-form');
  }

  function _clearMaterialForm() {
    const form = _getMaterialForm();
    if (!form) return;
    form.reset();
    const errEl = document.getElementById('material-form-err');
    if (errEl) errEl.textContent = '';
    _supplyUsageRows = [];
    _currentCategoryParams = [];
    _renderSupplyCheckboxes();
    _updateTotalCostPreview();
  }

  function _populateCategorySelect(selectedId) {
    const select = document.getElementById('mat-category');
    if (!select) return;
    const categories = (typeof AdminCategories !== 'undefined' && AdminCategories.getCategories)
      ? AdminCategories.getCategories()
      : [];
    select.innerHTML = '<option value="">-- Seleccionar --</option>' +
      categories.map(c =>
        '<option value="' + esc(c.id) + '"' + (c.id === selectedId ? ' selected' : '') + '>' + esc(c.nameEs) + '</option>'
      ).join('');
  }

  function openAddMaterialModal() {
    _editingMaterialId = null;
    _clearMaterialForm();
    const title = document.getElementById('material-modal-title');
    if (title) title.textContent = 'Agregar Material';
    _populateCategorySelect(null);
    const modal = _getMaterialModal();
    if (modal) modal.style.display = 'flex';
  }

  function openEditMaterialModal(id) {
    const mat = _materials.find(m => m.id === id);
    if (!mat) return;
    _editingMaterialId = id;
    _clearMaterialForm();

    const title = document.getElementById('material-modal-title');
    if (title) title.textContent = 'Editar Material';

    _populateCategorySelect(mat.categoryId);
    _setField('mat-name', mat.name);
    _setField('mat-sizeLabel', mat.sizeLabel || '');
    _setField('mat-widthCm', mat.widthCm != null ? mat.widthCm : '');
    _setField('mat-heightCm', mat.heightCm != null ? mat.heightCm : '');
    _setField('mat-depthCm', mat.depthCm != null ? mat.depthCm : '');
    _setField('mat-weightGrams', mat.weightGrams != null ? mat.weightGrams : '');
    _setField('mat-stockQuantity', mat.stockQuantity != null ? mat.stockQuantity : 0);
    _setField('mat-baseCostManual', mat.manualBaseCost != null ? fmt(mat.manualBaseCost) : '0');

    // Load supply usages for this category and populate rows
    _loadCategoryParamsAndPopulateUsages(mat.categoryId, mat.supplyUsages || []);

    const modal = _getMaterialModal();
    if (modal) modal.style.display = 'flex';
  }

  function closeMaterialModal() {
    const modal = _getMaterialModal();
    if (modal) modal.style.display = 'none';
    _editingMaterialId = null;
    _supplyUsageRows = [];
    _currentCategoryParams = [];
  }

  function _setField(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
  }

  function _getField(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  // ── Supply Usages Editor ──────────────────────────────────────────────────

  function _getParamsForCategory(categoryId) {
    if (!categoryId) return [];
    return _costParams[categoryId] || [];
  }

  // Called when category select changes — re-render checkbox list, clear quantities
  function _onMatCategoryChange() {
    const categoryId = _getField('mat-category');
    _currentCategoryParams = _getParamsForCategory(categoryId);
    _supplyUsageRows = [];
    _renderSupplyCheckboxes();
    _updateTotalCostPreview();
  }

  // Populate checkbox list from existing supplyUsages (edit mode)
  function _loadCategoryParamsAndPopulateUsages(categoryId, supplyUsages) {
    _currentCategoryParams = _getParamsForCategory(categoryId);
    // Build a lookup of saved quantities keyed by costParameterId
    const saved = {};
    (supplyUsages || []).forEach(u => { saved[u.costParameterId] = u.quantity; });
    _supplyUsageRows = _currentCategoryParams.map(p => ({
      costParameterId: p.id,
      unitCost: p.value,
      unit: p.unit || '',
      label: p.label || p.key,
      checked: saved[p.id] != null,
      quantity: saved[p.id] != null ? saved[p.id] : 1
    }));
    _renderSupplyCheckboxes();
    _updateTotalCostPreview();
  }

  // Toggle a checkbox row on/off
  function _onSupplyCheckboxChange(idx) {
    const cb = document.getElementById('mat-cb-' + idx);
    if (!cb) return;
    _supplyUsageRows[idx].checked = cb.checked;

    const row = document.getElementById('mat-cb-row-' + idx);
    const wrap = document.getElementById('mat-cb-qty-wrap-' + idx);
    const lineCostEl = document.getElementById('mat-cb-linecost-' + idx);
    const nameEl = row ? row.cells[1] : null;
    const unitEl = row ? row.cells[2] : null;
    const priceEl = row ? row.cells[3] : null;

    if (cb.checked) {
      if (row) { row.style.background = 'rgba(139,92,246,0.12)'; row.style.opacity = '1'; }
      if (nameEl)  nameEl.style.color  = '#ffffff';
      if (unitEl)  unitEl.style.color  = '#cbd5e1';
      if (priceEl) priceEl.style.color = '#e2e8f0';
      if (wrap)    { wrap.style.opacity = '1'; wrap.style.pointerEvents = ''; }
      if (lineCostEl) {
        lineCostEl.style.color = '#c4b5fd';
        const qty = parseFloat(document.getElementById('mat-cb-qty-' + idx)?.value) || 0;
        lineCostEl.textContent = fmtCurrency(_supplyUsageRows[idx].unitCost * qty);
      }
    } else {
      if (row) { row.style.background = ''; row.style.opacity = '0.4'; }
      if (nameEl)  nameEl.style.color  = '#94a3b8';
      if (unitEl)  unitEl.style.color  = '#64748b';
      if (priceEl) priceEl.style.color = '#64748b';
      if (wrap)    { wrap.style.opacity = '0.4'; wrap.style.pointerEvents = 'none'; }
      if (lineCostEl) { lineCostEl.style.color = '#475569'; lineCostEl.textContent = '—'; }
    }

    _updateTotalCostPreview();
  }

  // Update quantity for a checkbox row
  function _onSupplyQtyChange(idx) {
    const input = document.getElementById('mat-cb-qty-' + idx);
    if (!input) return;
    const qty = parseFloat(input.value) || 0;
    _supplyUsageRows[idx].quantity = qty;
    const lineCostEl = document.getElementById('mat-cb-linecost-' + idx);
    if (lineCostEl) lineCostEl.textContent = fmtCurrency(_supplyUsageRows[idx].unitCost * qty);
    _updateTotalCostPreview();
  }

  // Render the checkbox list into #mat-supply-usages-list
  function _renderSupplyCheckboxes() {
    const container = document.getElementById('mat-supply-usages-list');
    if (!container) return;

    if (!_currentCategoryParams.length) {
      container.innerHTML = '<div id="mat-supply-usages-empty" style="color:#475569;font-size:1rem;padding:8px 0">' +
        (_getField('mat-category') ? 'Este procesamiento no tiene parámetros de costo.' : 'Selecciona un procesamiento para ver los parámetros disponibles.') +
        '</div>';
      return;
    }

    // Sync _supplyUsageRows with current params if not already done
    if (_supplyUsageRows.length !== _currentCategoryParams.length) {
      const existing = {};
      _supplyUsageRows.forEach(r => { existing[r.costParameterId] = r; });
      _supplyUsageRows = _currentCategoryParams.map(p => existing[p.id] || {
        costParameterId: p.id,
        unitCost: p.value,
        unit: p.unit || '',
        label: p.label || p.key,
        checked: false,
        quantity: 1
      });
    }

    container.innerHTML =
      '<table style="width:100%;border-collapse:collapse;font-size:1rem">' +
      '<thead><tr style="color:#94a3b8;font-size:1rem;text-transform:uppercase;letter-spacing:0.04em;border-bottom:1px solid #334155">' +
        '<th style="padding:6px 6px;text-align:left;width:24px"></th>' +
        '<th style="padding:6px 6px;text-align:left">Parámetro</th>' +
        '<th style="padding:6px 6px;text-align:left;width:60px">Unidad</th>' +
        '<th style="padding:6px 6px;text-align:right;width:70px">Precio/u</th>' +
        '<th style="padding:6px 6px;text-align:right;width:90px">Cantidad</th>' +
        '<th style="padding:6px 6px;text-align:right;width:90px">Subtotal</th>' +
      '</tr></thead><tbody>' +
      _supplyUsageRows.map((row, idx) => {
        const lineCost = row.checked ? row.unitCost * row.quantity : 0;
        const rowStyle = row.checked
          ? 'border-bottom:1px solid #1e293b;background:rgba(139,92,246,0.12)'
          : 'border-bottom:1px solid #1e293b;opacity:0.4';
        const nameColor  = row.checked ? '#ffffff' : '#94a3b8';
        const unitColor  = row.checked ? '#cbd5e1' : '#64748b';
        const priceColor = row.checked ? '#e2e8f0' : '#64748b';
        const totalColor = row.checked ? '#c4b5fd' : '#475569';
        return '<tr id="mat-cb-row-' + idx + '" style="' + rowStyle + '">' +
          '<td style="padding:7px 6px">' +
            '<input type="checkbox" id="mat-cb-' + idx + '"' +
                   (row.checked ? ' checked' : '') +
                   ' onchange="AdminCosts._onSupplyCheckboxChange(' + idx + ')"' +
                   ' style="width:15px;height:15px;accent-color:#8b5cf6;cursor:pointer">' +
          '</td>' +
          '<td style="padding:7px 6px;color:' + nameColor + ';font-weight:500">' + esc(row.label) + '</td>' +
          '<td style="padding:7px 6px;color:' + unitColor + ';font-size:1rem">' + esc(row.unit || '—') + '</td>' +
          '<td style="padding:7px 6px;text-align:right;color:' + priceColor + ';font-family:monospace;font-size:1rem">' +
            fmtCurrency(row.unitCost) +
          '</td>' +
          '<td style="padding:7px 6px;text-align:right">' +
            '<div id="mat-cb-qty-wrap-' + idx + '" style="' + (row.checked ? '' : 'pointer-events:none') + '">' +
              '<input type="number" step="0.001" min="0.001"' +
                     ' id="mat-cb-qty-' + idx + '"' +
                     ' value="' + esc(String(row.quantity)) + '"' +
                     ' oninput="AdminCosts._onSupplyQtyChange(' + idx + ')"' +
                     ' class="inline-input-sm" style="width:75px">' +
            '</div>' +
          '</td>' +
          '<td style="padding:7px 6px;text-align:right;color:' + totalColor + ';font-family:monospace;font-size:1rem;font-weight:600"' +
              ' id="mat-cb-linecost-' + idx + '">' +
            (row.checked ? fmtCurrency(lineCost) : '—') +
          '</td>' +
        '</tr>';
      }).join('') +
      '</tbody></table>';
  }

  // Update the three cost summary lines: base + supplies + total
  function _updateTotalCostPreview() {
    const manualBase = parseFloat(document.getElementById('mat-baseCostManual')?.value) || 0;
    const suppliesCost = _supplyUsageRows
      .filter(r => r.checked)
      .reduce((sum, r) => sum + r.unitCost * r.quantity, 0);
    const total = manualBase + suppliesCost;

    const baseEl = document.getElementById('mat-basecost-preview');
    const supEl  = document.getElementById('mat-suppliescost-preview');
    const totEl  = document.getElementById('mat-totalcost-preview');
    if (baseEl) baseEl.textContent = fmtCurrency(manualBase);
    if (supEl)  supEl.textContent  = fmtCurrency(suppliesCost);
    if (totEl)  totEl.textContent  = fmtCurrency(total);
  }

  // Keep old name as alias so existing callers don't break
  function _updateBaseCostPreview() { _updateTotalCostPreview(); }

  // ── saveMaterial ──────────────────────────────────────────────────────────

  async function saveMaterial(e) {
    e.preventDefault();
    const errEl = document.getElementById('material-form-err');
    if (errEl) errEl.textContent = '';

    const name = _getField('mat-name');
    const categoryId = _getField('mat-category');
    const stockQtyStr = _getField('mat-stockQuantity');

    if (!name) {
      if (errEl) errEl.textContent = 'El nombre es requerido.';
      return;
    }
    if (!categoryId) {
      if (errEl) errEl.textContent = 'El procesamiento es requerido.';
      return;
    }

    // Build supplyUsages map { costParameterId: quantity } — only checked rows
    const supplyUsages = {};
    for (const row of _supplyUsageRows) {
      if (!row.checked || !row.costParameterId) continue;
      const qty = parseFloat(row.quantity);
      if (isNaN(qty) || qty <= 0) {
        if (errEl) errEl.textContent = 'Todas las cantidades de insumos deben ser mayores a 0.';
        return;
      }
      supplyUsages[row.costParameterId] = qty;
    }

    const manualBaseCostStr = _getField('mat-baseCostManual');
    const manualBaseCost = manualBaseCostStr !== '' ? parseFloat(manualBaseCostStr) : 0;
    if (isNaN(manualBaseCost) || manualBaseCost < 0) {
      if (errEl) errEl.textContent = 'El costo base no puede ser negativo.';
      return;
    }

    const data = {
      name,
      categoryId,
      sizeLabel: _getField('mat-sizeLabel') || null,
      widthCm: _getField('mat-widthCm') !== '' ? parseFloat(_getField('mat-widthCm')) : null,
      heightCm: _getField('mat-heightCm') !== '' ? parseFloat(_getField('mat-heightCm')) : null,
      depthCm: _getField('mat-depthCm') !== '' ? parseFloat(_getField('mat-depthCm')) : null,
      weightGrams: _getField('mat-weightGrams') !== '' ? parseInt(_getField('mat-weightGrams'), 10) : null,
      stockQuantity: stockQtyStr !== '' ? parseInt(stockQtyStr, 10) : 0,
      baseCost: manualBaseCost,
      supplyUsages
    };

    const btn = document.getElementById('material-save-btn');
    spin(btn, true);
    try {
      let saved;
      if (_editingMaterialId) {
        saved = await adminApi.adminUpdateMaterial(_editingMaterialId, data);
        toast('Material actualizado');
      } else {
        saved = await adminApi.adminCreateMaterial(data);
        toast('Material creado');
      }
      spin(btn, false);
      closeMaterialModal();
      await loadAll();
      // Refresh products table to update stock status badges
      if (typeof AdminProducts !== 'undefined' && AdminProducts.loadProducts) {
        await AdminProducts.loadProducts();
      }
    } catch (err) {
      if (errEl) errEl.textContent = err.detail || 'Error al guardar el material.';
      spin(btn, false);
    }
  }

  async function deleteMaterial(id) {
    if (!await adminConfirm('¿Eliminar este material? Esta acción no se puede deshacer.', 'Eliminar Material')) return;
    const btn = document.getElementById('mat-del-' + id);
    spin(btn, true);
    try {
      await adminApi.adminDeleteMaterial(id);
      toast('Material eliminado');
      await loadAll();
      // Refresh products table to update stock status badges
      if (typeof AdminProducts !== 'undefined' && AdminProducts.loadProducts) {
        await AdminProducts.loadProducts();
      }
    } catch (err) {
      if (err.status === 409) {
        toast(err.detail || 'No se puede eliminar: el material está en uso por variantes de productos.', false);
      } else {
        toast(err.detail || 'Error al eliminar el material.', false);
      }
      spin(btn, false);
    }
  }

  // ── Category name translations ────────────────────────────────────────────
  const CAT_ES = {
    'UV Printing':    'Impresión UV',
    '3D Printing':    'Impresión 3D',
    'Laser Engraving':'Grabado Láser',
    'Laser Cutting':  'Corte Láser',
    'Photo Printing': 'Impresión de Fotos'
  };

  function catEs(cat) {
    return CAT_ES[cat] || cat;
  }

  // ── 12.4 renderCostParameters ─────────────────────────────────────────────

  function renderCostParameters() {
    const container = document.getElementById('cost-params-container');
    if (!container) return;

    const categories = Object.keys(_costParams);
    if (!categories.length) {
      container.innerHTML = '<p style="color:#64748b">Sin parámetros de costo.</p>';
      return;
    }

    const catList = (typeof AdminCategories !== 'undefined' && AdminCategories.getCategories)
      ? AdminCategories.getCategories() : [];
    const catById = {};
    catList.forEach(c => { catById[c.id] = c; });

    container.innerHTML = categories.map(cat => {
      const params = _costParams[cat];
      const catObj = catById[cat];
      const displayName = catObj ? catObj.nameEs : cat;

      const rows = params.map(p =>
        '<tr>' +
          '<td>' + esc(p.label || p.key) + '</td>' +
          '<td style="color:#64748b;font-size:1rem">' + esc(p.unit || '—') + '</td>' +
          '<td>' +
            '<input type="number" step="0.0001" min="0"' +
                   ' id="cp-val-' + esc(p.id) + '"' +
                   ' value="' + esc(fmt(p.value)) + '"' +
                   ' style="width:120px;background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:4px 8px;border-radius:4px">' +
          '</td>' +
          '<td>' +
            '<button class="btn-admin btn-admin-primary btn-admin-sm"' +
                    ' id="cp-save-' + esc(p.id) + '"' +
                    ' onclick="AdminCosts.saveCostParameter(\'' + esc(p.categoryId) + '\',\'' + esc(p.key) + '\',\'' + esc(p.id) + '\',\'' + esc(p.label || p.key) + '\')">' +
              '<i class="fas fa-save"></i> Guardar' +
            '</button>' +
          '</td>' +
        '</tr>'
      ).join('');

      return '<div class="cost-param-group" style="margin-bottom:24px">' +
        '<h4 style="color:#c4b5fd;margin-bottom:8px;font-size:1rem;text-transform:uppercase;letter-spacing:0.05em">' + esc(displayName) + '</h4>' +
        '<table class="admin-table" style="width:100%">' +
          '<thead><tr><th>Parámetro</th><th>Unidad</th><th>Valor</th><th>Acción</th></tr></thead>' +
          '<tbody>' + rows + '</tbody>' +
        '</table>' +
        '</div>';
    }).join('');
  }

  async function saveCostParameter(categoryId, key, id, label) {
    const input = document.getElementById('cp-val-' + id);
    const btn = document.getElementById('cp-save-' + id);
    if (!input) return;
    const value = parseFloat(input.value);
    if (isNaN(value) || value < 0) {
      toast('El valor debe ser un número no negativo.', false);
      return;
    }
    spin(btn, true);
    try {
      const unitInput = document.getElementById('cp-unit-' + id);
      const unit = unitInput ? unitInput.value.trim() : (
        // Preserve existing unit from cached params
        Object.values(_costParams).flat().find(p => p.id === id)?.unit || ''
      );
      await adminApi.adminUpsertCostParameter(categoryId, key, { label, unit, value });
      toast('Parámetro guardado');
      await loadAll();
    } catch (err) {
      toast(err.detail || err.message || 'Error al guardar el parámetro.', false);
      spin(btn, false);
    }
  }

  // ── 12.5 renderGlobalParameters ───────────────────────────────────────────

  function renderGlobalParameters() {
    const container = document.getElementById('global-params-container');
    if (!container) return;

    if (!_globalParams.length) {
      container.innerHTML = '<p style="color:#64748b">Sin parámetros globales.</p>';
      return;
    }

    const rows = _globalParams.map(p =>
      '<tr>' +
        '<td>' + esc(p.label || p.key) + '</td>' +
        '<td>' +
          '<input type="text"' +
                 ' id="gp-val-' + esc(p.id) + '"' +
                 ' value="' + esc(p.value) + '"' +
                 ' style="width:120px;background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:4px 8px;border-radius:4px">' +
        '</td>' +
        '<td>' +
          '<button class="btn-admin btn-admin-primary btn-admin-sm"' +
                  ' id="gp-save-' + esc(p.id) + '"' +
                  ' onclick="AdminCosts.saveGlobalParameter(\'' + esc(p.key) + '\',\'' + esc(p.id) + '\',\'' + esc(p.label || p.key) + '\')">' +
            '<i class="fas fa-save"></i> Guardar' +
          '</button>' +
        '</td>' +
      '</tr>'
    ).join('');

    container.innerHTML =
      '<p style="color:#94a3b8;font-size:1rem;margin-bottom:12px">' +
        '<i class="fas fa-info-circle" style="color:#a78bfa;margin-right:6px"></i>' +
        'El costo eléctrico aplica a todos los procesamientos (se asume 100W por máquina).' +
      '</p>' +
      '<table class="admin-table" style="width:100%">' +
        '<thead><tr><th>Parámetro</th><th>Valor</th><th>Acción</th></tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table>';
  }

  async function saveGlobalParameter(key, id, label) {
    const input = document.getElementById('gp-val-' + id);
    const btn = document.getElementById('gp-save-' + id);
    if (!input) return;
    const value = input.value.trim();
    spin(btn, true);
    try {
      await adminApi.adminUpdateGlobalParameter(key, { label, value });
      toast('Parámetro global guardado');
    } catch (err) {
      toast(err.detail || 'Error al guardar el parámetro global.', false);
    }
    spin(btn, false);
  }

  // ── Public API ────────────────────────────────────────────────────────────

  window.AdminCosts = {
    loadAll,
    renderMaterialsTable,
    openAddMaterialModal,
    openEditMaterialModal,
    closeMaterialModal,
    saveMaterial,
    deleteMaterial,
    renderCostParameters,
    saveCostParameter,
    renderGlobalParameters,
    saveGlobalParameter,
    // Supply usages editor
    _onMatCategoryChange,
    _onSupplyCheckboxChange,
    _onSupplyQtyChange,
    _updateTotalCostPreview,
    _updateBaseCostPreview,
    // Caches
    getMaterials: () => _materials,
    getGlobalParams: () => _globalParams,
    getCostParams: () => _costParams
  };

}(window));
