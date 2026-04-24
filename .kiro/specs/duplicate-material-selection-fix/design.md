# Duplicate Material Selection Fix — Bugfix Design

## Overview

When editing a product variant in the admin panel, the material usage editor allows the same
material to be added multiple times. The `_addMaterialUsageRow()` function always appends a
new row defaulting to the first available material without checking whether it is already in
use, and `_renderMaterialUsagesTable()` renders every dropdown with the full unfiltered
material list, making it trivially easy to select a duplicate. The fix adds duplicate-aware
filtering to both the "add row" path and the dropdown rendering path, and disables the
"Agregar material" button when all materials are already in use.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug — a material that is already
  present in `_materialUsageRows` appears as a selectable option in any dropdown, or a new
  row is appended that defaults to an already-used material.
- **Property (P)**: The desired behavior — every dropdown in the material usages table shows
  only materials that are not currently used in another row; the "Agregar material" button is
  disabled when no unused materials remain.
- **Preservation**: All existing behaviors of the material usage editor that must remain
  unchanged by the fix: quantity editing, line-cost calculation, row deletion, price preview,
  loading saved usages, and saving the `materialUsages` map to the API.
- **`_materialUsageRows`**: The module-level array in `assets/js/admin-products.js` that
  holds the in-memory state of the material rows currently shown in the editor.
  Each entry is `{ materialId, baseCost, name, quantity }`.
- **`_filteredMaterials()`**: Helper that returns the subset of `_materials` relevant to the
  current product's category (or all materials if no category match).
- **`_renderMaterialUsagesTable()`**: Renders the `#vmod-material-usages-tbody` rows from
  `_materialUsageRows`. Currently passes the full `_filteredMaterials()` list to every
  dropdown without excluding already-used IDs.
- **`_addMaterialUsageRow()`**: Appends a new entry to `_materialUsageRows` using the first
  material in `_filteredMaterials()` without checking for duplicates.
- **`usedIds`**: The set of `materialId` values currently present in `_materialUsageRows`,
  computed at render time to drive duplicate exclusion.

## Bug Details

### Bug Condition

The bug manifests when at least one material is already present in the variant's material
usage list. `_renderMaterialUsagesTable()` builds each dropdown's `<option>` list from the
full `_filteredMaterials()` array without excluding materials that are already selected in
other rows. Likewise, `_addMaterialUsageRow()` always picks `list[0]` as the default for the
new row, which is already in use whenever any row exists.

**Formal Specification:**
```
FUNCTION isBugCondition(materialUsageRows, allMaterials)
  INPUT: materialUsageRows — current list of { materialId, ... } objects
         allMaterials      — full list of available materials for this product
  OUTPUT: boolean

  usedIds ← SET { row.materialId | row IN materialUsageRows }

  // Duplicate row: same materialId appears more than once
  hasDuplicateRow ← EXISTS id IN usedIds
                    WHERE COUNT(row IN materialUsageRows WHERE row.materialId = id) > 1

  // Dropdown pollution: a used material still appears as an option in another row's dropdown
  hasDropdownPollution ← EXISTS row IN materialUsageRows
                         WHERE EXISTS m IN allMaterials
                               WHERE m.id IN usedIds
                               AND m.id ≠ row.materialId

  RETURN hasDuplicateRow OR hasDropdownPollution
END FUNCTION
```

### Examples

- **Two rows, same material**: User adds "PLA Blanco", then clicks "Agregar material" again.
  The new row defaults to "PLA Blanco" (first in list). Result: two rows with identical
  `materialId`, producing doubled cost and an ambiguous save payload.
- **Dropdown shows used material**: User has rows for "PLA Blanco" and "PETG Negro". The
  "PLA Blanco" dropdown still shows "PETG Negro" as an option and vice versa, so the user
  can change either row to match the other, creating a duplicate.
- **All materials used, button still active**: User adds all N available materials. The
  "Agregar material" button remains enabled; clicking it appends a row that duplicates the
  first material.
- **Single row (no bug)**: Only one material row exists. No duplicate is possible regardless
  of which material is selected — `isBugCondition` returns false.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Changing a row's quantity input must continue to update the line cost and trigger
  `_updatePricePreview()` exactly as before.
- Clicking the delete (×) button on a row must continue to call `_removeMaterialUsageRow(idx)`
  and recalculate the price preview.
- Opening the variant edit modal for an existing variant must continue to populate
  `_materialUsageRows` from `variant.materialUsages` and render all saved rows correctly.
- Saving the variant form must continue to build and submit the `materialUsages` map
  (`{ materialId: quantity }`) to the API without any change to the payload structure.
- When a material is removed from the list, it must become available again in the remaining
  rows' dropdowns.
- When the variant edit modal is opened with no existing material usages, the first click of
  "Agregar material" must add a row with the first available material as before.

**Scope:**
All inputs that do NOT involve the material selection dropdowns or the "Agregar material"
button are completely unaffected by this fix. This includes quantity inputs, the profit
field, manufacture time, the availability checkbox, the design-file checkbox, and the
discounts section.

## Hypothesized Root Cause

Based on code inspection of `assets/js/admin-products.js`:

1. **`_renderMaterialUsagesTable()` — unfiltered option list**: The `opts` string is built
   from `list.map(m => ...)` where `list = _filteredMaterials()`. There is no exclusion of
   IDs already present in other rows. Every dropdown therefore always shows every material.

2. **`_addMaterialUsageRow()` — no availability check**: The function pushes `list[0]` as
   the default material for the new row without checking whether `list[0].id` is already in
   `_materialUsageRows`. When at least one row exists, this always creates a duplicate.

3. **No "button disabled" guard**: `_addMaterialUsageRow()` and `_renderMaterialUsagesTable()`
   never inspect whether `_materialUsageRows.length >= _filteredMaterials().length`. The
   "Agregar material" button (`#vmod-add-material-btn`) is never disabled.

4. **`_onMaterialUsageRowChange()` — no cross-row refresh**: When the user changes the
   material selected in one row, only that row's line cost and stock badge are updated. The
   other rows' dropdowns are not re-rendered, so a material that was just "taken" by this row
   still appears as available in the other rows.

## Correctness Properties

Property 1: Bug Condition — No Duplicate Material in Dropdowns or Rows

_For any_ variant state where `isBugCondition` returns true (i.e., at least one material is
already present in `_materialUsageRows`), the fixed `_renderMaterialUsagesTable` SHALL render
each row's dropdown containing only materials that are not currently selected in any other
row, and the fixed `_addMaterialUsageRow` SHALL only append a row whose default `materialId`
is not already present in `_materialUsageRows`. Additionally, the "Agregar material" button
SHALL be disabled when `_materialUsageRows.length >= _filteredMaterials().length`.

**Validates: Requirements 2.1, 2.2**

Property 2: Preservation — Non-Duplicate Inputs Unchanged

_For any_ variant state where `isBugCondition` returns false (i.e., all material rows have
distinct `materialId` values and no dropdown contains a used material), the fixed
`_renderMaterialUsagesTable`, `_addMaterialUsageRow`, `_removeMaterialUsageRow`, and
`_onMaterialUsageRowChange` SHALL produce the same observable behavior as the original
functions, preserving quantity editing, line-cost calculation, row deletion, price preview,
modal population from saved data, and the API save payload.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

**File**: `assets/js/admin-products.js`

**Function 1**: `_renderMaterialUsagesTable()`

**Specific Changes**:
1. **Compute `usedIds` set before building rows**: Before the `tbody.innerHTML = ...` line,
   collect all `materialId` values currently in `_materialUsageRows` into a `Set`.
2. **Filter options per row**: When building the `opts` string for each row, exclude any
   material whose `id` is in `usedIds` AND whose `id` is not the current row's own
   `materialId` (the current row's own material must remain selected and visible).
3. **Disable "Agregar material" button when exhausted**: After rendering, check whether
   `_materialUsageRows.length >= list.length`. If so, set `#vmod-add-material-btn`'s
   `disabled` attribute; otherwise remove it.

**Function 2**: `_addMaterialUsageRow()`

**Specific Changes**:
4. **Find first unused material**: Instead of always using `list[0]`, compute
   `usedIds = new Set(_materialUsageRows.map(r => r.materialId))` and pick the first
   material in `list` whose `id` is not in `usedIds`. If no unused material exists, return
   early without appending a row (the button should already be disabled, but this is a
   safety guard).

**Function 3**: `_onMaterialUsageRowChange(idx)`

**Specific Changes**:
5. **Re-render all dropdowns after a selection change**: After updating
   `_materialUsageRows[idx]` and the live line cost, call `_renderMaterialUsagesTable()` to
   refresh every row's dropdown so that the newly selected material is excluded from all
   other rows and the previously selected material becomes available again.
   (The full re-render is safe because `_renderMaterialUsagesTable` rebuilds `tbody.innerHTML`
   from `_materialUsageRows` state, which has already been updated.)

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that
demonstrate the bug on the unfixed code, then verify the fix works correctly and preserves
existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix.
Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write unit tests that directly exercise `_addMaterialUsageRow()` and
`_renderMaterialUsagesTable()` with a pre-populated `_materialUsageRows` state. Assert that
the rendered dropdowns contain duplicate options and that new rows default to already-used
materials. Run these tests against the UNFIXED code to observe failures and confirm the root
cause.

**Test Cases**:
1. **Duplicate row on second add**: Seed `_materialUsageRows` with one row for material A,
   call `_addMaterialUsageRow()`, assert the new row's `materialId` equals A — confirming
   the default-to-first-material bug. (will fail on unfixed code = bug confirmed)
2. **Dropdown shows used material**: Seed two rows (A, B), call `_renderMaterialUsagesTable()`,
   assert row A's dropdown contains option B and row B's dropdown contains option A.
   (will fail on unfixed code = bug confirmed)
3. **Button not disabled when all materials used**: Seed `_materialUsageRows` with all N
   available materials, call `_renderMaterialUsagesTable()`, assert `#vmod-add-material-btn`
   does NOT have `disabled` attribute. (will fail on unfixed code = bug confirmed)
4. **Cross-row change does not refresh other dropdowns**: Seed two rows (A, B), simulate
   changing row 0 to material C via `_onMaterialUsageRowChange(0)`, assert row 1's dropdown
   still shows material C as an option. (will fail on unfixed code = bug confirmed)

**Expected Counterexamples**:
- New rows default to an already-used `materialId`.
- Dropdown `<option>` lists include materials already selected in sibling rows.
- The "Agregar material" button remains enabled after all materials are consumed.

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed functions
produce the expected behavior.

**Pseudocode:**
```
FOR ALL state WHERE isBugCondition(state.rows, state.allMaterials) DO
  result ← _renderMaterialUsagesTable_fixed(state)
  ASSERT FOR ALL rowIdx IN [0..state.rows.length-1]:
    result.dropdowns[rowIdx].options = allMaterials
      MINUS { m | m.id IN usedIds AND m.id ≠ state.rows[rowIdx].materialId }
  ASSERT _addMaterialUsageRow_fixed() appends row with materialId NOT IN usedIds
  ASSERT IF usedIds.size >= allMaterials.length THEN button.disabled = true
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed
functions produce the same result as the original functions.

**Pseudocode:**
```
FOR ALL state WHERE NOT isBugCondition(state.rows, state.allMaterials) DO
  ASSERT _renderMaterialUsagesTable_original(state) = _renderMaterialUsagesTable_fixed(state)
  ASSERT _addMaterialUsageRow_original() = _addMaterialUsageRow_fixed()
  ASSERT _onMaterialUsageRowChange_original(idx) = _onMaterialUsageRowChange_fixed(idx)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many random variant states automatically across the input domain.
- It catches edge cases (zero rows, one row, all rows filled) that manual tests might miss.
- It provides strong guarantees that quantity editing, cost calculation, and save payload
  behavior are unchanged for all non-buggy inputs.

**Test Plan**: Observe behavior on UNFIXED code first for single-row and zero-row states
(where no duplicate is possible), then write property-based tests capturing that behavior.

**Test Cases**:
1. **Zero-row state preservation**: With no rows, `_addMaterialUsageRow()` must add a row
   with `materialId = list[0].id` — same as original behavior.
2. **Quantity change preservation**: With one row, changing the quantity input must still
   update line cost and price preview identically to the original.
3. **Row deletion preservation**: Deleting a row must still splice `_materialUsageRows` and
   re-render, with the deleted material becoming available again.
4. **Save payload preservation**: The `materialUsages` map built in `saveVariantModal` must
   remain `{ [materialId]: quantity }` with no structural change.
5. **Modal population preservation**: Opening the variant modal for a saved variant with
   distinct material usages must still populate all rows correctly.

### Unit Tests

- Test `_addMaterialUsageRow()` with 0, 1, and N-1 existing rows to verify the chosen
  default is always the first unused material.
- Test `_renderMaterialUsagesTable()` with various row counts to verify each dropdown
  excludes all other rows' selected materials.
- Test that `#vmod-add-material-btn` is disabled exactly when `rows.length >= materials.length`.
- Test `_onMaterialUsageRowChange(idx)` triggers a full re-render so sibling dropdowns
  reflect the updated selection.
- Test edge cases: only one material available (button disabled after first add), all
  materials added then one removed (button re-enabled, freed material appears in dropdowns).

### Property-Based Tests

- Generate random subsets of the available material list as `_materialUsageRows` (all with
  distinct IDs) and verify that after `_renderMaterialUsagesTable()`, no dropdown contains
  an option already selected in another row.
- Generate random `_materialUsageRows` states and verify that `_addMaterialUsageRow()` always
  appends a row with a `materialId` not already present in the existing rows.
- Generate random quantity values for existing rows and verify that `_updatePricePreview()`
  produces the same result before and after the fix (preservation of cost calculation).

### Integration Tests

- Open the variant edit modal for a product with multiple available materials, add all
  materials one by one, and verify the button becomes disabled after the last one.
- Add two materials, change the first row's selection to the second row's material, and
  verify the second row's dropdown no longer shows that material.
- Remove a material row and verify the freed material reappears in the remaining row's
  dropdown.
- Save a variant with two distinct material usages and verify the API receives the correct
  `materialUsages` map.
