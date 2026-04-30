/**
 * admin-categories.js — Simplified Product Categories module for admin.html
 *
 * Manages two-level category structure: Categories → SubCategories
 * UI pattern similar to admin-costs.js (table view with modal for subcategories)
 *
 * Responsibilities:
 *   - loadCategories()           fetch categories from API and cache
 *   - getCategories()            return cached categories for other modules
 *   - renderCategoriesTable()    render categories table with CRUD actions
 *   - openAddCategoryModal()     open modal to create a category
 *   - openEditCategoryModal(id)  open modal to edit a category with subcategories
 *   - init()                     wire event listeners
 *
 * Depends on globals: adminApi, toast
 */

(function (window) {
  'use strict';

  // -- Module state ----------------------------------------------------------
  let _categories = [];
  let _editingCategoryId = null;
  let _subCategoryRows = []; // For managing subcategories in the modal

  // -- Helpers ---------------------------------------------------------------

  function esc(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // -- loadCategories --------------------------------------------------------

  /**
   * Fetch all product categories from the API and cache them.
   * Categories are returned with nested subcategories.
   * @returns {Promise<void>}
   */
  async function loadCategories() {
    try {
      const result = await adminApi.adminGetCategories();
      _categories = result || [];
      console.log('Product categories loaded:', _categories.length);
    } catch (e) {
      console.error('Error loading product categories:', e);
      if (typeof toast !== 'undefined') {
        toast('Error al cargar categorías de producto', false);
      }
      _categories = [];
    }
  }

  // -- getCategories ---------------------------------------------------------

  /**
   * Return cached categories for use by other modules (e.g., admin-products.js).
   * @returns {Array} Array of category objects with subcategories
   */
  function getCategories() {
    return _categories;
  }

  // -- renderCategoriesTable -------------------------------------------------

  /**
   * Render the categories table (similar to materials table in admin-costs.js).
   * Displays: Name, Icon, Subcategories count, Actions (Edit, Delete)
   */
  function renderCategoriesTable() {
    const tbody = document.getElementById('categories-tbody');
    if (!tbody) return;

    if (!_categories.length) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#64748b;padding:24px">Sin categorías</td></tr>';
      return;
    }

    tbody.innerHTML = _categories.map(cat => {
      const subCount = (cat.subCategories || []).length;
      return '<tr id="cat-row-' + esc(cat.id) + '">' +
        '<td style="font-size:1.5rem">' + esc(cat.icon || '📁') + '</td>' +
        '<td style="font-weight:600">' + esc(cat.name) + '</td>' +
        '<td style="color:#94a3b8">' + subCount + ' subcategorías</td>' +
        '<td style="white-space:nowrap">' +
          '<button class="btn-admin btn-admin-secondary btn-admin-sm"' +
                  ' onclick="AdminCategories.openEditCategoryModal(\'' + esc(cat.id) + '\')"' +
                  ' title="Editar categoría"><i class="fas fa-edit"></i> Editar</button> ' +
          '<button class="btn-admin btn-admin-danger btn-admin-sm"' +
                  ' onclick="AdminCategories.deleteCategory(\'' + esc(cat.id) + '\')"' +
                  ' id="cat-del-' + esc(cat.id) + '"' +
                  ' title="Eliminar categoría"><i class="fas fa-trash"></i></button>' +
        '</td>' +
        '</tr>';
    }).join('');
  }

  // -- Modal functions -------------------------------------------------------

  function _getCategoryModal() {
    return document.getElementById('category-modal');
  }

  function _getCategoryForm() {
    return document.getElementById('category-form');
  }

  function _clearCategoryForm() {
    const form = _getCategoryForm();
    if (!form) return;
    form.reset();
    const errEl = document.getElementById('category-form-err');
    if (errEl) errEl.textContent = '';
    _subCategoryRows = [];
    _renderSubCategoriesTable();
  }

  function openAddCategoryModal() {
    _editingCategoryId = null;
    _clearCategoryForm();
    const title = document.getElementById('category-modal-title');
    if (title) title.textContent = 'Nueva Categoría';
    const modal = _getCategoryModal();
    if (modal) modal.style.display = 'flex';
  }

  async function openEditCategoryModal(id) {
    const cat = _categories.find(c => c.id === id);
    if (!cat) return;
    _editingCategoryId = id;
    _clearCategoryForm();

    const title = document.getElementById('category-modal-title');
    if (title) title.textContent = 'Editar Categoría';

    _setField('cat-name', cat.name);
    _setField('cat-icon', cat.icon || '');
    _setField('cat-description', cat.description || '');

    // Load subcategories
    _subCategoryRows = (cat.subCategories || []).map(sc => ({
      id: sc.id,
      name: sc.name,
      icon: sc.icon || '',
      description: sc.description || '',
      isNew: false
    }));
    _renderSubCategoriesTable();

    const modal = _getCategoryModal();
    if (modal) modal.style.display = 'flex';
  }

  function closeCategoryModal() {
    const modal = _getCategoryModal();
    if (modal) modal.style.display = 'none';
    _editingCategoryId = null;
    _subCategoryRows = [];
  }

  function _setField(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
  }

  function _getField(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  // -- SubCategories management (similar to supply usages in admin-costs.js) --

  function _addSubCategoryRow() {
    _subCategoryRows.push({
      id: null,
      name: '',
      icon: '',
      description: '',
      isNew: true
    });
    _renderSubCategoriesTable();
  }

  function _removeSubCategoryRow(idx) {
    _subCategoryRows.splice(idx, 1);
    _renderSubCategoriesTable();
  }

  function _onSubCategoryFieldChange(idx, field, value) {
    if (_subCategoryRows[idx]) {
      _subCategoryRows[idx][field] = value;
    }
  }

  function _renderSubCategoriesTable() {
    const container = document.getElementById('subcategories-list');
    if (!container) return;

    if (!_subCategoryRows.length) {
      container.innerHTML = '<div style="color:#475569;font-size:1rem;padding:8px 0">' +
        'No hay subcategorías. Haz clic en "Agregar Subcategoría" para añadir una.' +
        '</div>';
      return;
    }

    container.innerHTML =
      '<table style="width:100%;border-collapse:collapse;font-size:1rem">' +
      '<thead><tr style="color:#94a3b8;font-size:1rem;text-transform:uppercase;letter-spacing:0.04em;border-bottom:1px solid #334155">' +
        '<th style="padding:6px 6px;text-align:left;width:40px">Icono</th>' +
        '<th style="padding:6px 6px;text-align:left">Nombre</th>' +
        '<th style="padding:6px 6px;text-align:left">Descripción</th>' +
        '<th style="padding:6px 6px;text-align:center;width:80px">Acción</th>' +
      '</tr></thead><tbody>' +
      _subCategoryRows.map((row, idx) => {
        return '<tr style="border-bottom:1px solid #1e293b">' +
          '<td style="padding:7px 6px">' +
            '<input type="text" value="' + esc(row.icon) + '"' +
                   ' oninput="AdminCategories._onSubCategoryFieldChange(' + idx + ', \'icon\', this.value)"' +
                   ' placeholder="🎁"' +
                   ' style="width:35px;background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:4px;border-radius:4px;text-align:center;font-size:1.2rem">' +
          '</td>' +
          '<td style="padding:7px 6px">' +
            '<input type="text" value="' + esc(row.name) + '"' +
                   ' oninput="AdminCategories._onSubCategoryFieldChange(' + idx + ', \'name\', this.value)"' +
                   ' placeholder="Nombre de subcategoría"' +
                   ' style="width:100%;background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:4px 8px;border-radius:4px">' +
          '</td>' +
          '<td style="padding:7px 6px">' +
            '<input type="text" value="' + esc(row.description || '') + '"' +
                   ' oninput="AdminCategories._onSubCategoryFieldChange(' + idx + ', \'description\', this.value)"' +
                   ' placeholder="Descripción (opcional)"' +
                   ' style="width:100%;background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:4px 8px;border-radius:4px">' +
          '</td>' +
          '<td style="padding:7px 6px;text-align:center">' +
            '<button class="btn-admin btn-admin-danger btn-admin-sm"' +
                    ' onclick="AdminCategories._removeSubCategoryRow(' + idx + ')"' +
                    ' title="Eliminar subcategoría"><i class="fas fa-trash"></i></button>' +
          '</td>' +
        '</tr>';
      }).join('') +
      '</tbody></table>';
  }

  // -- saveCategory ----------------------------------------------------------

  async function saveCategory(e) {
    e.preventDefault();
    const errEl = document.getElementById('category-form-err');
    if (errEl) errEl.textContent = '';

    const name = _getField('cat-name');
    const icon = _getField('cat-icon');
    const description = _getField('cat-description');

    if (!name) {
      if (errEl) errEl.textContent = 'El nombre es requerido.';
      return;
    }

    // Validate subcategories
    for (const row of _subCategoryRows) {
      if (!row.name) {
        if (errEl) errEl.textContent = 'Todas las subcategorías deben tener un nombre.';
        return;
      }
    }

    const btn = document.getElementById('category-save-btn');
    spin(btn, true);

    try {
      let savedCategory;

      if (_editingCategoryId) {
        // Update existing category
        const categoryData = { name, icon, description };
        savedCategory = await adminApi.adminUpdateCategory(_editingCategoryId, categoryData);

        // Handle subcategories: delete removed, update existing, create new
        const existingSubCats = _categories.find(c => c.id === _editingCategoryId)?.subCategories || [];
        const existingIds = new Set(existingSubCats.map(sc => sc.id));
        const currentIds = new Set(_subCategoryRows.filter(r => r.id).map(r => r.id));

        // Delete removed subcategories
        for (const existingSc of existingSubCats) {
          if (!currentIds.has(existingSc.id)) {
            await adminApi.adminDeleteSubCategory(existingSc.id);
          }
        }

        // Update or create subcategories
        for (const row of _subCategoryRows) {
          const subCatData = {
            name: row.name,
            icon: row.icon || null,
            description: row.description || null
          };

          if (row.id && existingIds.has(row.id)) {
            // Update existing
            await adminApi.adminUpdateSubCategory(row.id, subCatData);
          } else {
            // Create new
            await adminApi.adminCreateSubCategory(_editingCategoryId, subCatData);
          }
        }

        toast('Categoría actualizada');
      } else {
        // Create new category
        const categoryData = { name, icon, description };
        savedCategory = await adminApi.adminCreateCategory(categoryData);

        // Create subcategories
        for (const row of _subCategoryRows) {
          const subCatData = {
            name: row.name,
            icon: row.icon || null,
            description: row.description || null
          };
          await adminApi.adminCreateSubCategory(savedCategory.id, subCatData);
        }

        toast('Categoría creada');
      }

      spin(btn, false);
      closeCategoryModal();
      await loadCategories();
      renderCategoriesTable();
    } catch (err) {
      if (errEl) errEl.textContent = err.detail || 'Error al guardar la categoría.';
      spin(btn, false);
    }
  }

  async function deleteCategory(id) {
    if (!await adminConfirm('¿Eliminar esta categoría y todas sus subcategorías? Esta acción no se puede deshacer.', 'Eliminar Categoría')) return;
    const btn = document.getElementById('cat-del-' + id);
    spin(btn, true);
    try {
      await adminApi.adminDeleteCategory(id);
      toast('Categoría eliminada');
      await loadCategories();
      renderCategoriesTable();
    } catch (err) {
      toast(err.detail || 'Error al eliminar la categoría.', false);
      spin(btn, false);
    }
  }

  // -- init ------------------------------------------------------------------

  /**
   * Initialize the admin categories module.
   * Sets up event listeners and prepares the module for use.
   */
  function init() {
    console.log('AdminCategories module initialized');
  }

  // -- Public API ------------------------------------------------------------

  window.AdminCategories = {
    init,
    loadCategories,
    getCategories,
    renderCategoriesTable,
    openAddCategoryModal,
    openEditCategoryModal,
    closeCategoryModal,
    saveCategory,
    deleteCategory,
    // Subcategory management (exposed for inline event handlers)
    _addSubCategoryRow,
    _removeSubCategoryRow,
    _onSubCategoryFieldChange
  };

}(window));
