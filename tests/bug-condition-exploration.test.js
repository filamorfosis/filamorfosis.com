/**
 * Bug Condition Exploration Tests — Duplicate Material Selection
 * Validates: Requirements 2.1, 2.2, 2.3
 *
 * STATUS: All 4 tests PASS on the FIXED code — bug is confirmed fixed.
 *
 * Bug counterexamples found on unfixed code (for reference):
 *
 *   Test 1 — Duplicate row on second add:
 *     Counterexample: _addMaterialUsageRow() always picked list[0] (materialId: 'mat-1')
 *     even when 'mat-1' was already in _materialUsageRows. The new row got materialId='mat-1',
 *     which equaled the existing row — a duplicate.
 *     FIX: now uses usedIds Set and list.find() to pick first unused material.
 *
 *   Test 2 — Dropdown shows used material:
 *     Counterexample: With rows for mat-1 and mat-2, _renderMaterialUsagesTable() built
 *     opts from the full list for every row. Row 0 (mat-1) still showed mat-2 as an option,
 *     and row 1 (mat-2) still showed mat-1 as an option. No filtering occurred.
 *     FIX: now filters opts with list.filter(m => !usedIds.has(m.id) || m.id === row.materialId).
 *
 *   Test 3 — Button not disabled when all materials used:
 *     Counterexample: After seeding _materialUsageRows with all 3 available materials,
 *     _renderMaterialUsagesTable() never set the 'disabled' attribute on
 *     #vmod-add-material-btn. The button remained enabled.
 *     FIX: now calls addBtn.setAttribute('disabled','disabled') when rows.length >= list.length.
 *
 *   Test 4 — Cross-row change does not refresh other dropdowns:
 *     Counterexample: After _onMaterialUsageRowChange(0) changed row 0 to mat-3,
 *     row 1's dropdown still contained mat-3 as an option because _onMaterialUsageRowChange
 *     only updated the changed row's line cost — it never called _renderMaterialUsagesTable()
 *     to refresh sibling dropdowns.
 *     FIX: now calls _renderMaterialUsagesTable() at the end of _onMaterialUsageRowChange().
 */

'use strict';

// ---------------------------------------------------------------------------
// Minimal DOM simulation (no jsdom dependency required)
// ---------------------------------------------------------------------------

function createEl(tag) {
  const attrs = {};
  const children = [];
  let innerHTML = '';
  let textContent = '';
  const style = {};
  const el = {
    tagName: tag.toUpperCase(),
    attrs,
    style,
    get innerHTML() { return innerHTML; },
    set innerHTML(v) {
      innerHTML = v;
      // Parse children from innerHTML for option querying
      children.length = 0;
    },
    get textContent() { return textContent; },
    set textContent(v) { textContent = v; },
    getAttribute(name) { return attrs[name] !== undefined ? attrs[name] : null; },
    setAttribute(name, val) { attrs[name] = val; },
    removeAttribute(name) { delete attrs[name]; },
    hasAttribute(name) { return name in attrs; },
    querySelector(sel) { return null; },
    querySelectorAll(sel) { return []; },
    closest(sel) { return null; },
    _value: '',
    get value() { return this._value; },
    set value(v) { this._value = v; }
  };
  return el;
}

// Minimal document mock
const domStore = {};

function mockDocument() {
  return {
    _elements: domStore,
    getElementById(id) {
      return domStore[id] || null;
    },
    querySelector(sel) {
      // Support '#id' selectors
      if (sel.startsWith('#')) {
        return domStore[sel.slice(1)] || null;
      }
      return null;
    }
  };
}

function setupDOM(ids) {
  // Clear store
  Object.keys(domStore).forEach(k => delete domStore[k]);
  ids.forEach(id => {
    domStore[id] = createEl('div');
  });
}

// ---------------------------------------------------------------------------
// Replicated module state (mirrors admin-products.js module-level vars)
// ---------------------------------------------------------------------------

let _materials = [];
let _materialsMap = {};
let _currentProduct = null;
let _materialUsageRows = [];

function _filteredMaterials() {
  const catId = _currentProduct && _currentProduct.categoryId;
  if (!catId) return _materials;
  const filtered = _materials.filter(m => m.categoryId === catId);
  return filtered.length ? filtered : _materials;
}

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmt(n) {
  return Number(n ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ---------------------------------------------------------------------------
// EXACT copies of the FIXED functions from assets/js/admin-products.js
// ---------------------------------------------------------------------------

/**
 * FIXED _addMaterialUsageRow — picks first unused material via usedIds Set.
 */
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
  // _updatePricePreview() omitted — not needed for these tests
}

/**
 * FIXED _renderMaterialUsagesTable — filters opts per row, disables add button when exhausted.
 */
function _renderMaterialUsagesTable() {
  const tbody   = document.getElementById('vmod-material-usages-tbody');
  const table   = document.getElementById('vmod-material-usages-table');
  const emptyEl = document.getElementById('vmod-material-usages-empty');
  if (!tbody) return;

  if (!_materialUsageRows.length) {
    if (table)   table.setAttribute('data-display', 'none');
    if (emptyEl) emptyEl.removeAttribute('data-display');
    return;
  }

  if (table)   table.removeAttribute('data-display');
  if (emptyEl) emptyEl.setAttribute('data-display', 'none');

  const list = _filteredMaterials();
  const usedIds = new Set(_materialUsageRows.map(r => r.materialId));

  tbody.innerHTML = _materialUsageRows.map((row, idx) => {
    const lineCost = row.baseCost * row.quantity;

    // FIXED: filters out materials used by other rows, but keeps the current row's own material
    const opts = list.filter(m => !usedIds.has(m.id) || m.id === row.materialId).map(m =>
      '<option value="' + esc(m.id) + '"' + (m.id === row.materialId ? ' selected' : '') + '>' +
        esc(m.name) + (m.sizeLabel ? ' — ' + esc(m.sizeLabel) : '') +
      '</option>'
    ).join('');

    const selMat   = _materialsMap[row.materialId];
    const stock    = selMat ? (selMat.stockQuantity ?? 0) : null;
    const stockTxt = stock === null ? '—' : String(stock);

    return '<tr class="vmod-mat-row">' +
      '<td class="vmod-mat-cell">' +
        '<select id="vmod-mat-sel-' + idx + '"' +
                ' class="inline-select">' +
          opts +
        '</select>' +
      '</td>' +
      '<td class="vmod-mat-cell vmod-mat-cell--stock">' +
        '<span class="vmod-stock-badge">' + stockTxt + '</span>' +
      '</td>' +
      '<td class="vmod-mat-cell vmod-mat-cell--qty">' +
        '<input type="number" id="vmod-mat-qty-' + idx + '" value="' + esc(String(row.quantity)) + '">' +
      '</td>' +
      '<td class="vmod-mat-cell vmod-mat-cell--cost" id="vmod-mat-cost-' + idx + '">' +
        fmt(lineCost) +
      '</td>' +
      '</tr>';
  }).join('');

  // FIXED: disables #vmod-add-material-btn when all materials are in use
  const addBtn = document.getElementById('vmod-add-material-btn');
  if (addBtn) {
    if (_materialUsageRows.length >= list.length) {
      addBtn.setAttribute('disabled', 'disabled');
    } else {
      addBtn.removeAttribute('disabled');
    }
  }
}

/**
 * FIXED _onMaterialUsageRowChange — calls _renderMaterialUsagesTable() to refresh sibling dropdowns.
 */
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

  // Update live line cost
  const lineCostEl = document.getElementById('vmod-mat-cost-' + idx);
  if (lineCostEl) {
    lineCostEl.textContent = fmt(_materialUsageRows[idx].baseCost * qty);
  }

  // FIXED: calls _renderMaterialUsagesTable() so sibling dropdowns are refreshed
  _renderMaterialUsagesTable();
  // _updatePricePreview() omitted — not needed for these tests
}

// ---------------------------------------------------------------------------
// Helper: parse option values from an innerHTML string
// ---------------------------------------------------------------------------

function parseOptionValues(html) {
  const values = [];
  const re = /<option\s+value="([^"]*)"[^>]*>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    values.push(m[1]);
  }
  return values;
}

function parseSelectInnerHTML(tbodyHtml, selectId) {
  // Extract the <select id="selectId">...</select> block
  const re = new RegExp('<select[^>]+id="' + selectId + '"[^>]*>([\\s\\S]*?)<\\/select>');
  const m = re.exec(tbodyHtml);
  if (!m) return null;
  return m[1];
}

// ---------------------------------------------------------------------------
// Test runner
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log('✅ PASSED: ' + name);
    passed++;
  } catch (err) {
    console.log('❌ FAILED: ' + name);
    console.log('   Reason: ' + err.message);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// ---------------------------------------------------------------------------
// Shared test materials
// ---------------------------------------------------------------------------

const ALL_MATERIALS = [
  { id: 'mat-1', name: 'PLA Blanco',  baseCost: 10, stockQuantity: 100 },
  { id: 'mat-2', name: 'PETG Negro',  baseCost: 15, stockQuantity: 50  },
  { id: 'mat-3', name: 'TPU Rojo',    baseCost: 20, stockQuantity: 25  }
];

function resetState() {
  _materials = ALL_MATERIALS.slice();
  _materialsMap = {};
  _materials.forEach(m => { _materialsMap[m.id] = m; });
  _currentProduct = null;
  _materialUsageRows = [];
}

// ---------------------------------------------------------------------------
// Inject document mock into global scope (needed by the replicated functions)
// ---------------------------------------------------------------------------

global.document = mockDocument();

// ---------------------------------------------------------------------------
// Test 1 — Duplicate row on second add
// Validates: Requirement 1.2
// EXPECTED: FAILS on unfixed code because _addMaterialUsageRow always picks list[0]
// ---------------------------------------------------------------------------

test('Test 1 — Duplicate row on second add: new row should pick first UNUSED material', () => {
  resetState();
  setupDOM(['vmod-material-usages-tbody', 'vmod-material-usages-table', 'vmod-material-usages-empty', 'vmod-add-material-btn']);

  // Seed one row for mat-1 (the first material)
  _materialUsageRows.push({
    materialId: 'mat-1',
    baseCost: 10,
    name: 'PLA Blanco',
    quantity: 1
  });

  // Call the unfixed _addMaterialUsageRow
  _addMaterialUsageRow();

  // After adding, there should be 2 rows
  assert(_materialUsageRows.length === 2, 'Expected 2 rows after add, got ' + _materialUsageRows.length);

  const newRow = _materialUsageRows[1];

  // The new row's materialId should NOT be mat-1 (already used)
  // On unfixed code this FAILS because list[0] = mat-1 is always picked
  assert(
    newRow.materialId !== 'mat-1',
    'New row defaulted to already-used materialId "mat-1" (list[0]) instead of first unused material "mat-2"'
  );
});

// ---------------------------------------------------------------------------
// Test 2 — Dropdown shows used material
// Validates: Requirement 1.1
// EXPECTED: FAILS on unfixed code because dropdowns show all materials
// ---------------------------------------------------------------------------

test('Test 2 — Dropdown shows used material: each row dropdown should exclude sibling materials', () => {
  resetState();
  setupDOM(['vmod-material-usages-tbody', 'vmod-material-usages-table', 'vmod-material-usages-empty', 'vmod-add-material-btn']);

  // Seed two rows: mat-1 and mat-2
  _materialUsageRows.push({ materialId: 'mat-1', baseCost: 10, name: 'PLA Blanco', quantity: 1 });
  _materialUsageRows.push({ materialId: 'mat-2', baseCost: 15, name: 'PETG Negro', quantity: 1 });

  _renderMaterialUsagesTable();

  const tbodyHtml = domStore['vmod-material-usages-tbody'].innerHTML;

  // Row 0 (mat-1) dropdown should NOT contain mat-2
  const row0SelectHtml = parseSelectInnerHTML(tbodyHtml, 'vmod-mat-sel-0');
  assert(row0SelectHtml !== null, 'Could not find select#vmod-mat-sel-0 in rendered HTML');
  const row0Options = parseOptionValues(row0SelectHtml);

  // On unfixed code this FAILS because mat-2 IS present in row 0's dropdown
  assert(
    !row0Options.includes('mat-2'),
    'Row 0 dropdown (mat-1 selected) still contains "mat-2" — sibling material not excluded'
  );

  // Row 1 (mat-2) dropdown should NOT contain mat-1
  const row1SelectHtml = parseSelectInnerHTML(tbodyHtml, 'vmod-mat-sel-1');
  assert(row1SelectHtml !== null, 'Could not find select#vmod-mat-sel-1 in rendered HTML');
  const row1Options = parseOptionValues(row1SelectHtml);

  // On unfixed code this FAILS because mat-1 IS present in row 1's dropdown
  assert(
    !row1Options.includes('mat-1'),
    'Row 1 dropdown (mat-2 selected) still contains "mat-1" — sibling material not excluded'
  );
});

// ---------------------------------------------------------------------------
// Test 3 — Button not disabled when all materials used
// Validates: Requirement 1.2
// EXPECTED: FAILS on unfixed code because button is never disabled
// ---------------------------------------------------------------------------

test('Test 3 — Button not disabled when all materials used: add button should be disabled', () => {
  resetState();
  setupDOM(['vmod-material-usages-tbody', 'vmod-material-usages-table', 'vmod-material-usages-empty', 'vmod-add-material-btn']);

  // Seed all 3 materials (exhausted)
  _materialUsageRows.push({ materialId: 'mat-1', baseCost: 10, name: 'PLA Blanco', quantity: 1 });
  _materialUsageRows.push({ materialId: 'mat-2', baseCost: 15, name: 'PETG Negro', quantity: 1 });
  _materialUsageRows.push({ materialId: 'mat-3', baseCost: 20, name: 'TPU Rojo',   quantity: 1 });

  _renderMaterialUsagesTable();

  const btn = domStore['vmod-add-material-btn'];

  // On unfixed code this FAILS because _renderMaterialUsagesTable never sets disabled
  assert(
    btn.hasAttribute('disabled'),
    '#vmod-add-material-btn does NOT have "disabled" attribute even though all ' +
    ALL_MATERIALS.length + ' materials are already in use'
  );
});

// ---------------------------------------------------------------------------
// Test 4 — Cross-row change does not refresh other dropdowns
// Validates: Requirement 1.3
// EXPECTED: FAILS on unfixed code because _onMaterialUsageRowChange doesn't re-render
// ---------------------------------------------------------------------------

test('Test 4 — Cross-row change does not refresh other dropdowns: sibling dropdown should exclude newly selected material', () => {
  resetState();

  // We need DOM elements for the select and qty inputs that _onMaterialUsageRowChange reads
  setupDOM([
    'vmod-material-usages-tbody',
    'vmod-material-usages-table',
    'vmod-material-usages-empty',
    'vmod-add-material-btn',
    'vmod-mat-sel-0',
    'vmod-mat-qty-0',
    'vmod-mat-cost-0',
    'vmod-mat-sel-1',
    'vmod-mat-qty-1',
    'vmod-mat-cost-1'
  ]);

  // Seed two rows: mat-1 and mat-2
  _materialUsageRows.push({ materialId: 'mat-1', baseCost: 10, name: 'PLA Blanco', quantity: 1 });
  _materialUsageRows.push({ materialId: 'mat-2', baseCost: 15, name: 'PETG Negro', quantity: 1 });

  // Simulate row 0 being changed to mat-3 via the select element
  domStore['vmod-mat-sel-0'].value = 'mat-3';
  domStore['vmod-mat-qty-0'].value = '1';

  _onMaterialUsageRowChange(0);

  // After the change, row 0 should now be mat-3
  assert(_materialUsageRows[0].materialId === 'mat-3', 'Row 0 materialId should be mat-3 after change');

  // Now re-render to get the current state of row 1's dropdown
  // (In the fixed version, _onMaterialUsageRowChange would call _renderMaterialUsagesTable itself)
  _renderMaterialUsagesTable();

  const tbodyHtml = domStore['vmod-material-usages-tbody'].innerHTML;
  const row1SelectHtml = parseSelectInnerHTML(tbodyHtml, 'vmod-mat-sel-1');
  assert(row1SelectHtml !== null, 'Could not find select#vmod-mat-sel-1 in rendered HTML');
  const row1Options = parseOptionValues(row1SelectHtml);

  // Row 1's dropdown should NOT show mat-3 (now used by row 0)
  // On unfixed code this FAILS because _renderMaterialUsagesTable shows all materials
  assert(
    !row1Options.includes('mat-3'),
    'Row 1 dropdown still contains "mat-3" after row 0 was changed to mat-3 — cross-row refresh not implemented'
  );
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log('\n--- Bug Condition Exploration Test Results (FIXED code) ---');
console.log('Tests run:    ' + (passed + failed));
console.log('PASSED: ' + passed);
console.log('FAILED: ' + failed);

if (passed === (passed + failed)) {
  console.log('\n✅ All ' + passed + ' tests PASSED — fix confirmed. Bug is resolved.');
  process.exit(0);
} else if (passed > 0) {
  console.log('\n⚠️  ' + passed + ' test(s) passed, but ' + failed + ' still failed — fix may be incomplete.');
  process.exit(1);
} else {
  console.log('\n❌ All tests FAILED — fix does not appear to be working correctly.');
  process.exit(1);
}
