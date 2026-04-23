/**
 * admin-categories.js ï¿½ Categories tab module for admin.html
 *
 * Uses a modal (#category-modal) matching the material modal style for
 * add/edit operations. Cost parameters are managed inline within the modal.
 */

(function (window) {
  'use strict';

  let _categories = [];
  let _editingId   = null; // null = add mode, string = edit mode

  function esc(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // -- Load ------------------------------------------------------------------

  async function loadCategories() {
    try {
      _categories = await adminApi.adminGetCategories();
      renderCategoriesTable();
      _populateCategoryDropdowns();
    } catch (e) {
      const tbody = document.getElementById('categories-tbody');
      if (tbody) tbody.innerHTML = `<tr><td colspan="3" style="color:#f87171;text-align:center">
        <i class="fas fa-exclamation-triangle"></i> Error al cargar categorï¿½as</td></tr>`;
    }
  }

  function getCategories() { return _categories; }

  function _populateCategoryDropdowns() {
    document.querySelectorAll('[data-category-select]').forEach(sel => {
      const current = sel.value;
      sel.innerHTML = '<option value="">-- Seleccionar --</option>' +
        _categories.map(c => `<option value="${esc(c.id)}">${esc(c.nameEs)}</option>`).join('');
      if (current) sel.value = current;
    });
  }

  // -- Render table ----------------------------------------------------------

  function renderCategoriesTable() {
    const tbody = document.getElementById('categories-tbody');
    if (!tbody) return;

    if (!_categories.length) {
      tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:#64748b;padding:24px">Sin categorï¿½as</td></tr>`;
      return;
    }

    tbody.innerHTML = _categories.map(c => `
      <tr id="cat-row-${esc(c.id)}">
        <td>${esc(c.slug)}</td>
        <td>${esc(c.nameEs)}</td>
        <td style="white-space:nowrap">
          <button class="btn-admin btn-admin-secondary btn-admin-sm"
                  onclick="AdminCategories.openEditCategoryModal('${esc(c.id)}')"
                  title="Editar categorï¿½a">
            <i class="fas fa-edit"></i> Editar
          </button>
          <button class="btn-admin btn-admin-danger btn-admin-sm"
                  onclick="AdminCategories.deleteCategory('${esc(c.id)}')"
                  id="cat-del-${esc(c.id)}"
                  title="Eliminar categorï¿½a">
            <i class="fas fa-trash"></i>
          </button>
          <div class="form-error" id="cat-del-err-${esc(c.id)}" style="margin-top:4px"></div>
        </td>
      </tr>`).join('');
  }

  // -- Modal open/close ------------------------------------------------------

  function _openModal() {
    const overlay = document.getElementById('category-modal');
    if (!overlay) return;
    overlay.style.display = 'flex';
    // clear errors
    document.getElementById('category-modal-err').textContent = '';
    document.getElementById('cat-modal-cp-err').textContent   = '';
  }

  function closeCategoryModal() {
    const overlay = document.getElementById('category-modal');
    if (overlay) overlay.style.display = 'none';
    _editingId = null;
  }

  function openAddCategoryModal() {
    _editingId = null;
    document.getElementById('category-modal-title').textContent    = 'Nueva Categorï¿½a';
    document.getElementById('category-modal-subtitle').textContent = 'Completa los datos de la nueva categorï¿½a';
    document.getElementById('cat-modal-nameEs').value   = '';
    document.getElementById('cat-modal-nameEn').value   = '';
    document.getElementById('cat-modal-slug').value     = '';
    document.getElementById('cat-modal-imageUrl').value = '';
    document.getElementById('cat-modal-cost-section').style.display = 'none';
    _openModal();
    document.getElementById('cat-modal-nameEs').focus();
  }

  async function openEditCategoryModal(id) {
    const cat = _categories.find(c => c.id == id);
    if (!cat) return;
    _editingId = id;

    document.getElementById('category-modal-title').textContent    = 'Editar Categorï¿½a';
    document.getElementById('category-modal-subtitle').textContent = `Editando: ${cat.nameEs}`;
    document.getElementById('cat-modal-nameEs').value   = cat.nameEs   || '';
    document.getElementById('cat-modal-nameEn').value   = cat.nameEn   || '';
    document.getElementById('cat-modal-slug').value     = cat.slug     || '';
    document.getElementById('cat-modal-imageUrl').value = cat.imageUrl || '';

    document.getElementById('cat-modal-cost-section').style.display = '';
    _openModal();
    await _loadCostParamsList(id);
  }

  // -- Save (add or edit) ----------------------------------------------------

  async function saveCategoryModal(e) {
    e.preventDefault();
    const errEl = document.getElementById('category-modal-err');
    const btn   = document.getElementById('category-modal-save-btn');
    errEl.textContent = '';

    const nameEs   = document.getElementById('cat-modal-nameEs').value.trim();
    const nameEn   = document.getElementById('cat-modal-nameEn').value.trim();
    const slug     = document.getElementById('cat-modal-slug').value.trim();
    const imageUrl = document.getElementById('cat-modal-imageUrl').value.trim() || null;

    if (!nameEs || !nameEn || !slug) {
      errEl.textContent = 'Nombre ES, Nombre EN y Slug son requeridos.';
      return;
    }

    const data = { slug, nameEs, nameEn, imageUrl };
    spin(btn, true);
    try {
      if (_editingId) {
        await adminApi.adminUpdateCategory(_editingId, data);
        toast('Categorï¿½a actualizada');
      } else {
        await adminApi.adminCreateCategory(data);
        toast('Categorï¿½a creada');
      }
      closeCategoryModal();
      await loadCategories();
    } catch (err) {
      errEl.textContent = err.detail || 'Error al guardar la categorï¿½a.';
      spin(btn, false);
    }
  }

  // -- Delete ----------------------------------------------------------------

  async function deleteCategory(id) {
    if (!await adminConfirm('ï¿½Eliminar esta categorï¿½a? Esta acciï¿½n no se puede deshacer.', 'Eliminar Categorï¿½a')) return;
    const btn   = document.getElementById('cat-del-' + id);
    const errEl = document.getElementById('cat-del-err-' + id);
    spin(btn, true);
    errEl.textContent = '';
    try {
      await adminApi.adminDeleteCategory(id);
      toast('Categorï¿½a eliminada');
      await loadCategories();
    } catch (err) {
      if (err.status === 409) {
        errEl.textContent = err.detail || 'No se puede eliminar: tiene productos activos.';
      } else {
        toast(err.detail || 'Error al eliminar', false);
      }
      spin(btn, false);
    }
  }

  // -- Cost Parameters (inside modal) ----------------------------------------

  async function _loadCostParamsList(categoryId) {
    const list  = document.getElementById('cat-modal-cost-list');
    const empty = document.getElementById('cat-modal-cost-empty');
    if (!list) return;

    list.innerHTML = `<div style="text-align:center;padding:12px;color:#64748b">
      <i class="fas fa-spinner fa-spin"></i> Cargando...</div>`;

    try {
      const params = await adminApi.adminGetCategoryCostParameters(categoryId);
      _renderCostParamRows(categoryId, params);
    } catch (e) {
      list.innerHTML = `<p style="color:#f87171;padding:8px;font-size:1rem">Error al cargar parï¿½metros.</p>`;
    }
  }

  function _renderCostParamRows(categoryId, params) {
    const list = document.getElementById('cat-modal-cost-list');
    if (!list) return;

    if (!params.length) {
      list.innerHTML = `<div id="cat-modal-cost-empty" style="color:#475569;font-size:1rem;padding:10px 4px;text-align:center">
        Sin parï¿½metros de costo.</div>`;
      return;
    }

    list.innerHTML = params.map(p => `
      <div id="cp-modal-row-${esc(p.id)}"
           style="display:grid;grid-template-columns:2fr 1fr 1fr auto;gap:6px;align-items:center;
                  padding:6px 4px;border-bottom:1px solid rgba(255,255,255,0.04)">
        <input type="text" value="${esc(p.label)}" id="cp-modal-label-${esc(p.id)}"
               class="inline-input-category"
               placeholder="Nombre">
        <input type="text" value="${esc(p.unit || '')}" id="cp-modal-unit-${esc(p.id)}"
               class="inline-input-category"
               placeholder="Unidad">
        <input type="number" step="0.0001" min="0" value="${Number(p.value).toFixed(4)}"
               id="cp-modal-val-${esc(p.id)}"
               class="inline-input-category">
        <div style="display:flex;gap:4px">
          <button type="button" class="btn-admin btn-admin-primary btn-admin-sm"
                  id="cp-modal-save-${esc(p.id)}"
                  title="Guardar"
                  onclick="AdminCategories.saveCostParameterRow('${esc(categoryId)}','${esc(p.id)}')">
            <i class="fas fa-save"></i>
          </button>
          <button type="button" class="btn-admin btn-admin-danger btn-admin-sm"
                  title="Eliminar"
                  onclick="AdminCategories.deleteCostParameterRow('${esc(categoryId)}','${esc(p.id)}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>`).join('');
  }

  async function saveCostParameterRow(categoryId, paramId) {
    const label = document.getElementById('cp-modal-label-' + paramId)?.value.trim();
    const unit  = document.getElementById('cp-modal-unit-'  + paramId)?.value.trim();
    const val   = parseFloat(document.getElementById('cp-modal-val-' + paramId)?.value);
    const btn   = document.getElementById('cp-modal-save-' + paramId);

    if (!label) { toast('El nombre es requerido.', false); return; }
    if (isNaN(val) || val < 0) { toast('El valor debe ser un nï¿½mero no negativo.', false); return; }

    spin(btn, true);
    try {
      await adminApi.adminUpdateCategoryCostParameter(categoryId, paramId, { label, unit, value: val });
      toast('Parï¿½metro guardado');
      // Refresh materials table so BaseCost reflects the new cost parameter value
      if (typeof AdminCosts !== 'undefined' && AdminCosts.loadAll) {
        await AdminCosts.loadAll();
      }
    } catch (err) {
      toast(err.detail || 'Error al guardar.', false);
    }
    spin(btn, false);
  }

  async function deleteCostParameterRow(categoryId, paramId) {
    if (!await adminConfirm('ï¿½Eliminar este parï¿½metro de costo?', 'Eliminar Parï¿½metro')) return;
    try {
      await adminApi.adminDeleteCategoryCostParameter(categoryId, paramId);
      toast('Parï¿½metro eliminado');
      await _loadCostParamsList(categoryId);
    } catch (err) {
      toast(err.detail || 'Error al eliminar.', false);
    }
  }

  async function addCostParameterRow() {
    if (!_editingId) return;
    const errEl  = document.getElementById('cat-modal-cp-err');
    const labelEl = document.getElementById('cat-modal-cp-label');
    const unitEl  = document.getElementById('cat-modal-cp-unit');
    const valEl   = document.getElementById('cat-modal-cp-value');
    errEl.textContent = '';

    const label = labelEl.value.trim();
    if (!label) { errEl.textContent = 'El nombre del suministro es requerido.'; return; }

    try {
      await adminApi.adminAddCategoryCostParameter(_editingId, {
        label,
        unit:  unitEl.value || '',
        value: parseFloat(valEl.value) || 0,
      });
      toast('Parï¿½metro agregado');
      labelEl.value = '';
      valEl.value   = '0';
      await _loadCostParamsList(_editingId);
    } catch (err) {
      errEl.textContent = err.detail || 'Error al agregar parï¿½metro.';
    }
  }

  // -- Legacy: keep initAddCategoryForm as no-op so init() call doesn't break -

  function initAddCategoryForm() {
    // Replaced by modal ï¿½ nothing to wire up here.
  }

  // -- Public API ------------------------------------------------------------

  window.AdminCategories = {
    loadCategories,
    getCategories,
    initAddCategoryForm,
    // modal
    openAddCategoryModal,
    openEditCategoryModal,
    closeCategoryModal,
    saveCategoryModal,
    // cost params
    saveCostParameterRow,
    deleteCostParameterRow,
    addCostParameterRow,
    // delete row
    deleteCategory,
  };

}(window));
