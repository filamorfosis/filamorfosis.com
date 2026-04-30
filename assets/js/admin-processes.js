/**
 * admin-processes.js — Manufacturing Processes module for admin.html
 *
 * Manages manufacturing processes (UV Printing, Laser Cutting, 3D Printing, etc.)
 * These are the production methods used in Filamorfosis.
 *
 * Responsibilities:
 *   - loadProcesses()            fetch processes from API and cache
 *   - getProcesses()             return cached processes for other modules
 *   - renderProcessesTable()     render processes table with CRUD actions
 *   - openAddProcessModal()      open modal to create a process
 *   - openEditProcessModal(id)   open modal to edit a process
 *   - init()                     wire event listeners
 *
 * Depends on globals: adminApi, toast, spin, adminConfirm
 */

(function (window) {
  'use strict';

  // -- Module state ----------------------------------------------------------
  let _processes = [];
  let _editingProcessId = null;
  let _costParameters = []; // Cost parameters for the process being edited

  // -- Helpers ---------------------------------------------------------------

  function esc(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // -- loadProcesses ---------------------------------------------------------

  /**
   * Fetch all manufacturing processes from the API and cache them.
   * @returns {Promise<void>}
   */
  async function loadProcesses() {
    try {
      const result = await adminApi.adminGetProcesses();
      _processes = result || [];
      console.log('Processes loaded:', _processes.length);
    } catch (e) {
      console.error('Error loading processes:', e);
      if (typeof toast !== 'undefined') {
        toast('Error al cargar procesos', false);
      }
      _processes = [];
    }
  }

  // -- getProcesses ----------------------------------------------------------

  /**
   * Return cached processes for use by other modules (e.g., admin-costs.js).
   * @returns {Array} Array of process objects
   */
  function getProcesses() {
    return _processes;
  }

  // -- renderProcessesTable --------------------------------------------------

  /**
   * Render the processes table.
   * Displays: Slug, Name, Actions (Edit, Delete)
   */
  function renderProcessesTable() {
    const tbody = document.getElementById('processes-tbody');
    if (!tbody) return;

    if (!_processes.length) {
      tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#64748b;padding:24px">Sin procesos</td></tr>';
      return;
    }

    tbody.innerHTML = _processes.map(proc => {
      return '<tr id="proc-row-' + esc(proc.id) + '">' +
        '<td style="font-family:monospace;color:#94a3b8">' + esc(proc.slug) + '</td>' +
        '<td style="font-weight:600">' + esc(proc.nameEs) + '</td>' +
        '<td style="white-space:nowrap">' +
          '<button class="btn-admin btn-admin-secondary btn-admin-sm"' +
                  ' onclick="AdminProcesses.openEditProcessModal(\'' + esc(proc.id) + '\')"' +
                  ' title="Editar proceso"><i class="fas fa-edit"></i> Editar</button> ' +
          '<button class="btn-admin btn-admin-danger btn-admin-sm"' +
                  ' onclick="AdminProcesses.deleteProcess(\'' + esc(proc.id) + '\')"' +
                  ' id="proc-del-' + esc(proc.id) + '"' +
                  ' title="Eliminar proceso"><i class="fas fa-trash"></i></button>' +
        '</td>' +
        '</tr>';
    }).join('');
  }

  // -- Modal functions -------------------------------------------------------

  function _getProcessModal() {
    return document.getElementById('process-modal');
  }

  function _getProcessForm() {
    return document.getElementById('process-modal-form');
  }

  function _clearProcessForm() {
    const form = _getProcessForm();
    if (!form) return;
    form.reset();
    const errEl = document.getElementById('process-modal-err');
    if (errEl) errEl.textContent = '';
    _costParameters = [];
    _renderProcessCostParameters();
  }

  function openAddProcessModal() {
    _editingProcessId = null;
    _clearProcessForm();
    const title = document.getElementById('process-modal-title');
    if (title) title.textContent = 'Nuevo Proceso';
    
    // Hide cost parameters section for new processes
    const section = document.getElementById('proc-modal-cost-section');
    if (section) section.style.display = 'none';
    
    const modal = _getProcessModal();
    if (modal) modal.style.display = 'flex';
  }

  async function openEditProcessModal(id) {
    const proc = _processes.find(p => p.id === id);
    if (!proc) return;
    _editingProcessId = id;
    _clearProcessForm();

    const title = document.getElementById('process-modal-title');
    if (title) title.textContent = 'Editar Proceso';

    _setField('proc-modal-nameEs', proc.nameEs);
    _setField('proc-modal-slug', proc.slug);
    _setField('proc-modal-imageUrl', proc.imageUrl || '');

    // Load cost parameters for this process
    await _loadProcessCostParameters(id);

    const modal = _getProcessModal();
    if (modal) modal.style.display = 'flex';
  }

  function closeProcessModal() {
    const modal = _getProcessModal();
    if (modal) modal.style.display = 'none';
    _editingProcessId = null;
  }

  function _setField(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
  }

  function _getField(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  // -- saveProcessModal ------------------------------------------------------

  async function saveProcessModal(e) {
    e.preventDefault();
    const errEl = document.getElementById('process-modal-err');
    if (errEl) errEl.textContent = '';

    const nameEs = _getField('proc-modal-nameEs');
    const slug = _getField('proc-modal-slug');
    const imageUrl = _getField('proc-modal-imageUrl');

    if (!nameEs) {
      if (errEl) errEl.textContent = 'El nombre es requerido.';
      return;
    }
    if (!slug) {
      if (errEl) errEl.textContent = 'El slug es requerido.';
      return;
    }

    const data = { nameEs, slug, imageUrl: imageUrl || null };

    const btn = document.getElementById('process-modal-save-btn');
    spin(btn, true);

    try {
      if (_editingProcessId) {
        await adminApi.adminUpdateProcess(_editingProcessId, data);
        toast('Proceso actualizado');
      } else {
        await adminApi.adminCreateProcess(data);
        toast('Proceso creado');
      }

      spin(btn, false);
      closeProcessModal();
      await loadProcesses();
      renderProcessesTable();
      
      // Reload materials to update process names
      if (typeof AdminCosts !== 'undefined' && AdminCosts.loadAll) {
        await AdminCosts.loadAll();
      }
    } catch (err) {
      if (errEl) errEl.textContent = err.detail || 'Error al guardar el proceso.';
      spin(btn, false);
    }
  }

  // -- Cost Parameters Management --------------------------------------------

  /**
   * Load cost parameters for a process and render them in the modal
   */
  async function _loadProcessCostParameters(processId) {
    const section = document.getElementById('proc-modal-cost-section');
    const list = document.getElementById('proc-modal-cost-list');
    
    if (!section || !list) return;
    
    // Show the cost parameters section
    section.style.display = 'block';
    
    // Show loading state
    list.innerHTML = '<div style="text-align:center;padding:12px;color:#64748b">' +
      '<i class="fas fa-spinner fa-spin"></i> Cargando...</div>';
    
    try {
      // Fetch all cost parameters grouped by process
      const allCostParams = await adminApi.adminGetProcessCosts();
      _costParameters = allCostParams[processId] || [];
      _renderProcessCostParameters();
    } catch (e) {
      list.innerHTML = '<p style="color:#f87171;padding:8px;font-size:1rem">Error al cargar parámetros.</p>';
    }
  }

  /**
   * Render the list of cost parameters in the modal
   */
  function _renderProcessCostParameters() {
    const list = document.getElementById('proc-modal-cost-list');
    const empty = document.getElementById('proc-modal-cost-empty');
    
    if (!list) return;
    
    if (!_costParameters.length) {
      list.innerHTML = '<div id="proc-modal-cost-empty" style="color:#475569;font-size:1rem;padding:10px 4px;text-align:center">' +
        'Sin parámetros de costo.</div>';
      return;
    }
    
    list.innerHTML = _costParameters.map(p => {
      return '<div id="cp-modal-row-' + esc(p.id) + '"' +
        ' style="display:grid;grid-template-columns:2fr 1fr 1fr auto;gap:6px;align-items:center;' +
        'padding:6px 4px;border-bottom:1px solid rgba(255,255,255,0.04)">' +
        '<input type="text" value="' + esc(p.label) + '" id="cp-modal-label-' + esc(p.id) + '"' +
        ' class="inline-input-category" placeholder="Nombre">' +
        '<input type="text" value="' + esc(p.unit || '') + '" id="cp-modal-unit-' + esc(p.id) + '"' +
        ' class="inline-input-category" placeholder="Unidad">' +
        '<input type="number" step="0.0001" min="0" value="' + Number(p.value).toFixed(4) + '"' +
        ' id="cp-modal-val-' + esc(p.id) + '" class="inline-input-category">' +
        '<div style="display:flex;gap:4px">' +
          '<button type="button" class="btn-admin btn-admin-primary btn-admin-sm"' +
          ' id="cp-modal-save-' + esc(p.id) + '" title="Guardar"' +
          ' onclick="AdminProcesses.saveProcessCostParameterRow(\'' + esc(p.id) + '\')">' +
          '<i class="fas fa-save"></i></button>' +
          '<button type="button" class="btn-admin btn-admin-danger btn-admin-sm" title="Eliminar"' +
          ' onclick="AdminProcesses.deleteProcessCostParameterRow(\'' + esc(p.id) + '\')">' +
          '<i class="fas fa-trash"></i></button>' +
        '</div>' +
        '</div>';
    }).join('');
  }

  /**
   * Add a new cost parameter row
   */
  async function addProcessCostParameterRow() {
    if (!_editingProcessId) return;
    
    const errEl = document.getElementById('proc-modal-cp-err');
    const labelEl = document.getElementById('proc-modal-cp-label');
    const unitEl = document.getElementById('proc-modal-cp-unit');
    const valEl = document.getElementById('proc-modal-cp-value');
    
    if (errEl) errEl.textContent = '';
    
    const label = labelEl ? labelEl.value.trim() : '';
    if (!label) {
      if (errEl) errEl.textContent = 'El nombre del suministro es requerido.';
      return;
    }
    
    const unit = unitEl ? unitEl.value : '';
    const value = valEl ? parseFloat(valEl.value) || 0 : 0;
    
    // Generate a key from the label (lowercase, replace spaces with hyphens)
    const key = label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    try {
      await adminApi.adminUpsertProcessCost(_editingProcessId, key, { label, unit, value });
      toast('Parámetro agregado');
      
      // Clear the input fields
      if (labelEl) labelEl.value = '';
      if (valEl) valEl.value = '0';
      
      // Reload the cost parameters list
      await _loadProcessCostParameters(_editingProcessId);
      
      // Reload materials to update cost calculations
      if (typeof AdminCosts !== 'undefined' && AdminCosts.loadAll) {
        await AdminCosts.loadAll();
      }
    } catch (err) {
      if (errEl) errEl.textContent = err.detail || 'Error al agregar parámetro.';
    }
  }

  /**
   * Save an existing cost parameter row
   */
  async function saveProcessCostParameterRow(paramId) {
    const label = document.getElementById('cp-modal-label-' + paramId)?.value.trim();
    const unit = document.getElementById('cp-modal-unit-' + paramId)?.value.trim();
    const val = parseFloat(document.getElementById('cp-modal-val-' + paramId)?.value);
    const btn = document.getElementById('cp-modal-save-' + paramId);
    
    if (!label) {
      toast('El nombre es requerido.', false);
      return;
    }
    if (isNaN(val) || val < 0) {
      toast('El valor debe ser un número no negativo.', false);
      return;
    }
    
    spin(btn, true);
    
    try {
      // Find the parameter to get its key
      const param = _costParameters.find(p => p.id === paramId);
      if (!param) {
        toast('Parámetro no encontrado.', false);
        spin(btn, false);
        return;
      }
      
      await adminApi.adminUpsertProcessCost(_editingProcessId, param.key, { label, unit, value: val });
      toast('Parámetro guardado');
      
      // Reload materials to update cost calculations
      if (typeof AdminCosts !== 'undefined' && AdminCosts.loadAll) {
        await AdminCosts.loadAll();
      }
    } catch (err) {
      toast(err.detail || 'Error al guardar.', false);
    }
    
    spin(btn, false);
  }

  /**
   * Delete a cost parameter row
   */
  async function deleteProcessCostParameterRow(paramId) {
    if (!await adminConfirm('¿Eliminar este parámetro de costo?', 'Eliminar Parámetro')) return;
    
    try {
      await adminApi.adminDeleteProcessCost(_editingProcessId, paramId);
      toast('Parámetro eliminado');
      
      // Reload the cost parameters list
      await _loadProcessCostParameters(_editingProcessId);
      
      // Reload materials to update cost calculations
      if (typeof AdminCosts !== 'undefined' && AdminCosts.loadAll) {
        await AdminCosts.loadAll();
      }
    } catch (err) {
      toast(err.detail || 'Error al eliminar el parámetro.', false);
    }
  }

  async function deleteProcess(id) {
    if (!await adminConfirm('¿Eliminar este proceso? Esta acción no se puede deshacer.', 'Eliminar Proceso')) return;
    const btn = document.getElementById('proc-del-' + id);
    spin(btn, true);
    try {
      await adminApi.adminDeleteProcess(id);
      toast('Proceso eliminado');
      await loadProcesses();
      renderProcessesTable();
      
      // Reload materials to update process filter
      if (typeof AdminCosts !== 'undefined' && AdminCosts.loadAll) {
        await AdminCosts.loadAll();
      }
    } catch (err) {
      toast(err.detail || 'Error al eliminar el proceso.', false);
      spin(btn, false);
    }
  }

  // -- init ------------------------------------------------------------------

  /**
   * Initialize the admin processes module.
   * Sets up event listeners and prepares the module for use.
   */
  function init() {
    console.log('AdminProcesses module initialized');
  }

  // -- Public API ------------------------------------------------------------

  window.AdminProcesses = {
    init,
    loadProcesses,
    getProcesses,
    renderProcessesTable,
    openAddProcessModal,
    openEditProcessModal,
    closeProcessModal,
    saveProcessModal,
    deleteProcess,
    // Cost parameters
    addProcessCostParameterRow,
    saveProcessCostParameterRow,
    deleteProcessCostParameterRow
  };

}(window));
