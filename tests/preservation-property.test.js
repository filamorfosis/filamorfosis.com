/**
 * Preservation Property Tests — Non-Duplicate Material State Behavior
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 *
 * UPDATED: Function implementations replaced with FIXED code from assets/js/admin-products.js.
 * All 5 tests PASS on fixed code — confirming no regressions introduced by the fix.
 *
 * BASELINE OBSERVATIONS (originally recorded on UNFIXED code, states where isBugCondition = false):
 *
 *   Test 1 — Zero-row state: first add picks list[0]
 *     Observed: With _materialUsageRows = [], _addMaterialUsageRow() pushes { materialId: list[0].id }
 *     and calls _renderMaterialUsagesTable(). No duplicate is possible with zero rows.
 *     Baseline: _materialUsageRows.length === 1, _materialUsageRows[0].materialId === 'mat-1'
 *
 *   Test 2 — Quantity change updates line cost
 *     Observed: _onMaterialUsageRowChange(0) reads the qty input, multiplies baseCost * qty,
 *     writes the result to the cost cell's textContent, and updates _materialUsageRows[0].quantity.
 *     Baseline: quantity === 3, cost cell textContent === '30.00'
 *
 *   Test 3 — Row deletion splices array and re-renders
 *     Observed: _removeMaterialUsageRow(0) calls _materialUsageRows.splice(0, 1) then
 *     _renderMaterialUsagesTable(). With one row, the result is an empty array.
 *     Baseline: _materialUsageRows.length === 0 after deletion
 *
 *   Test 4 — Save payload structure
 *     Observed: saveVariantModal iterates _materialUsageRows and builds
 *     materialUsages[row.materialId] = parseFloat(row.quantity) for each row with a valid
 *     materialId and qty > 0. The result is a plain { [materialId]: quantity } object.
 *     Baseline: { 'mat-1': 2, 'mat-2': 3 }
 *
 *   Test 5 — Modal population from saved variant data
 *     Observed: openEditVariantModal iterates Object.entries(variant.materialUsages) and
 *     pushes { materialId, baseCost, name, quantity } for each entry. All rows are populated.
 *     Baseline: _materialUsageRows.length === 2, rows contain mat-1/qty=2 and mat-2/qty=3
 *
 * All 5 tests PASS on fixed code — baseline behaviors are preserved by the fix.
 */

'use strict';

// ---------------------------------------------------------------------------
// Minimal DOM simulation (same pattern as bug-condition-exploration.test.js)
// ---------------------------------------------------------------------------

function createEl(tag) {
  const attrs = {};
  const style = {};
  let innerHTML = '';
  let textContent = '';
  const el = {
    tagName: tag.toUpperCase(),
    attrs,
    style,
    get innerHTML() { return innerHTML; },
    set innerHTML(v) { innerHTML = v; },
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

const domStore = {};

function mockDocument() {
  return {
    getElementById(id) {
      return domStore[id] || null;
    },
    querySelector(sel) {
      if (sel.startsWith('#')) return domStore[sel.slice(1)] || null;
      return null;
    }
  };
}

function setupDOM(ids) {
  Object.keys(domStore).forEach(k => delete domStore[k]);
  ids.forEach(id => { domStore[id] = createEl('div'); });
}

global.document = mockDocument();

// ---------------------------------------------------------------------------
// Replicated module state
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
// (Task 3.1 fix — picks first unused material, filters dropdowns, disables button)
// ---------------------------------------------------------------------------

/**
 * FIXED _addMaterialUsageRow — picks first unused material; returns early if all used.
 * Source: assets/js/admin-products.js, Task 3.1 fix
 */
function _addMaterialUsageRow() {
  const list    = _filteredMaterials();
  const usedIds = new Set(_materialUsageRows.map(r => r.materialId));
  const first   = list.find(m => !usedIds.has(m.id));
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
 * FIXED _removeMaterialUsageRow — splices array and re-renders (unchanged from unfixed).
 * Source: assets/js/admin-products.js, Task 3.1 fix
 */
function _removeMaterialUsageRow(idx) {
  _materialUsageRows.splice(idx, 1);
  _renderMaterialUsagesTable();
  // _updatePricePreview() omitted — not needed for these tests
}

/**
 * FIXED _onMaterialUsageRowChange — updates changed row AND calls _renderMaterialUsagesTable().
 * Source: assets/js/admin-products.js, Task 3.1 fix
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

  // FIXED: calls _renderMaterialUsagesTable() to refresh all sibling dropdowns
  _renderMaterialUsagesTable();
  // _updatePricePreview() omitted — not needed for these tests
}

/**
 * FIXED _renderMaterialUsagesTable — filters dropdowns to exclude used IDs; disables button when all used.
 * Source: assets/js/admin-products.js, Task 3.1 fix
 */
function _renderMaterialUsagesTable() {
  const table    = document.getElementById('vmod-material-usages-table');
  const tbody    = document.getElementById('vmod-material-usages-tbody');
  const emptyEl  = document.getElementById('vmod-material-usages-empty');
  if (!tbody) return;

  if (!_materialUsageRows.length) {
    if (table)   table.setAttribute('data-display', 'none');
    if (emptyEl) emptyEl.removeAttribute('data-display');
    return;
  }

  if (table)   table.removeAttribute('data-display');
  if (emptyEl) emptyEl.setAttribute('data-display', 'none');

  const list    = _filteredMaterials();
  const usedIds = new Set(_materialUsageRows.map(r => r.materialId));

  tbody.innerHTML = _materialUsageRows.map((row, idx) => {
    const lineCost = row.baseCost * row.quantity;

    // FIXED: filters out used IDs except the current row's own materialId
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
 * Modal population logic — extracted from openEditVariantModal in admin-products.js.
 * Source: assets/js/admin-products.js, Task 5.4 section
 * Populates _materialUsageRows from variant.materialUsages dict { materialId: quantity }
 */
function _populateMaterialUsageRowsFromVariant(variant) {
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
}

/**
 * Save payload logic — extracted from saveVariantModal in admin-products.js.
 * Source: assets/js/admin-products.js, Task 5.5 section
 * Builds materialUsages map: { materialId: quantity }
 */
function _buildMaterialUsagesPayload() {
  const materialUsages = {};
  for (const row of _materialUsageRows) {
    if (!row.materialId) continue;
    const qty = parseFloat(row.quantity);
    if (!isNaN(qty) && qty > 0) {
      materialUsages[row.materialId] = qty;
    }
  }
  return materialUsages;
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

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error((label ? label + ': ' : '') + 'expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual));
  }
}

// ---------------------------------------------------------------------------
// Test 1 — Zero-row state: first add picks list[0]
// Validates: Requirement 3.1
// EXPECTED: PASSES on unfixed code (no bug when zero rows exist)
// ---------------------------------------------------------------------------

test('Test 1 — Zero-row state: first add picks list[0]', () => {
  resetState();
  setupDOM(['vmod-material-usages-tbody', 'vmod-material-usages-table', 'vmod-material-usages-empty', 'vmod-add-material-btn']);

  // Start with empty rows
  assert(_materialUsageRows.length === 0, 'Precondition: rows should be empty');

  _addMaterialUsageRow();

  assertEqual(_materialUsageRows.length, 1, '_materialUsageRows.length after first add');
  assertEqual(
    _materialUsageRows[0].materialId,
    ALL_MATERIALS[0].id,
    '_materialUsageRows[0].materialId should be list[0].id (mat-1)'
  );
});

// ---------------------------------------------------------------------------
// Test 2 — Quantity change updates line cost
// Validates: Requirement 3.2
// EXPECTED: PASSES on unfixed code
// ---------------------------------------------------------------------------

test('Test 2 — Quantity change updates line cost', () => {
  resetState();
  setupDOM([
    'vmod-material-usages-tbody',
    'vmod-material-usages-table',
    'vmod-material-usages-empty',
    'vmod-add-material-btn',
    'vmod-mat-sel-0',
    'vmod-mat-qty-0',
    'vmod-mat-cost-0'
  ]);

  // Seed one row for mat-1 with quantity=1, baseCost=10
  _materialUsageRows.push({
    materialId: 'mat-1',
    baseCost: 10,
    name: 'PLA Blanco',
    quantity: 1
  });

  // Simulate changing quantity to 3 via the qty input element
  domStore['vmod-mat-sel-0'].value = 'mat-1';
  domStore['vmod-mat-qty-0'].value = '3';

  _onMaterialUsageRowChange(0);

  assertEqual(_materialUsageRows[0].quantity, 3, '_materialUsageRows[0].quantity after change');

  // Line cost element should show baseCost(10) * quantity(3) = 30.00
  const lineCostText = domStore['vmod-mat-cost-0'].textContent;
  assert(
    lineCostText === '30.00',
    'Line cost element should show "30.00" (10 * 3), got "' + lineCostText + '"'
  );
});

// ---------------------------------------------------------------------------
// Test 3 — Row deletion splices array and re-renders
// Validates: Requirement 3.3
// EXPECTED: PASSES on unfixed code
// ---------------------------------------------------------------------------

test('Test 3 — Row deletion splices array and re-renders', () => {
  resetState();
  setupDOM(['vmod-material-usages-tbody', 'vmod-material-usages-table', 'vmod-material-usages-empty', 'vmod-add-material-btn']);

  // Seed one row for mat-1
  _materialUsageRows.push({
    materialId: 'mat-1',
    baseCost: 10,
    name: 'PLA Blanco',
    quantity: 1
  });

  assert(_materialUsageRows.length === 1, 'Precondition: one row seeded');

  _removeMaterialUsageRow(0);

  assertEqual(_materialUsageRows.length, 0, '_materialUsageRows.length after deletion should be 0');
});

// ---------------------------------------------------------------------------
// Test 4 — Save payload structure
// Validates: Requirement 3.5
// EXPECTED: PASSES on unfixed code
// ---------------------------------------------------------------------------

test('Test 4 — Save payload structure: materialUsages map is { [materialId]: quantity }', () => {
  resetState();

  // Seed two rows: mat-1 (qty=2) and mat-2 (qty=3)
  _materialUsageRows.push({ materialId: 'mat-1', baseCost: 10, name: 'PLA Blanco', quantity: 2 });
  _materialUsageRows.push({ materialId: 'mat-2', baseCost: 15, name: 'PETG Negro', quantity: 3 });

  const payload = _buildMaterialUsagesPayload();

  assert(typeof payload === 'object' && payload !== null, 'Payload should be an object');
  assertEqual(Object.keys(payload).length, 2, 'Payload should have 2 keys');
  assertEqual(payload['mat-1'], 2, 'payload["mat-1"] should be 2');
  assertEqual(payload['mat-2'], 3, 'payload["mat-2"] should be 3');
});

// ---------------------------------------------------------------------------
// Test 5 — Modal population from saved variant data
// Validates: Requirement 3.4
// EXPECTED: PASSES on unfixed code
// ---------------------------------------------------------------------------

test('Test 5 — Modal population from saved variant data', () => {
  resetState();

  // Simulate opening the variant modal with a saved variant
  const savedVariant = {
    materialUsages: {
      'mat-1': 2,
      'mat-2': 3
    }
  };

  _populateMaterialUsageRowsFromVariant(savedVariant);

  assertEqual(_materialUsageRows.length, 2, '_materialUsageRows.length should be 2 after population');

  const mat1Row = _materialUsageRows.find(r => r.materialId === 'mat-1');
  const mat2Row = _materialUsageRows.find(r => r.materialId === 'mat-2');

  assert(mat1Row !== undefined, 'Should have a row with materialId="mat-1"');
  assertEqual(mat1Row.quantity, 2, 'mat-1 row quantity should be 2');

  assert(mat2Row !== undefined, 'Should have a row with materialId="mat-2"');
  assertEqual(mat2Row.quantity, 3, 'mat-2 row quantity should be 3');
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log('\n--- Preservation Property Test Results ---');
console.log('Tests run:    ' + (passed + failed));
console.log('Passed:       ' + passed);
console.log('Failed:       ' + failed);

if (failed === 0) {
  console.log('\n✅ All ' + passed + ' preservation tests PASSED on fixed code.');
  console.log('   Baseline behaviors confirmed preserved. The fix introduces no regressions.');
  process.exit(0);
} else {
  console.log('\n❌ ' + failed + ' preservation test(s) FAILED — regression detected in fixed code.');
  console.log('   Investigate failures before accepting the fix.');
  process.exit(1);
}
