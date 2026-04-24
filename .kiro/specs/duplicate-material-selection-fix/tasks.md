# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Duplicate Material Selection Bug
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior — it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists in `_addMaterialUsageRow()`, `_renderMaterialUsagesTable()`, and `_onMaterialUsageRowChange()`
  - **Scoped PBT Approach**: Scope the property to concrete failing cases — seed `_materialUsageRows` with one or more rows and assert the invariant holds
  - Test case 1 — Duplicate row on second add: seed `_materialUsageRows` with one row for material A, call `_addMaterialUsageRow()`, assert the new row's `materialId` is NOT equal to A (i.e., it picks the first unused material)
  - Test case 2 — Dropdown shows used material: seed two rows (A, B), call `_renderMaterialUsagesTable()`, assert row A's dropdown does NOT contain option B and row B's dropdown does NOT contain option A
  - Test case 3 — Button not disabled when all materials used: seed `_materialUsageRows` with all N available materials, call `_renderMaterialUsagesTable()`, assert `#vmod-add-material-btn` has the `disabled` attribute
  - Test case 4 — Cross-row change does not refresh other dropdowns: seed two rows (A, B), simulate changing row 0 to material C via `_onMaterialUsageRowChange(0)`, assert row 1's dropdown does NOT show material C as an option
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests FAIL (this is correct — it proves the bug exists)
  - Document counterexamples found (e.g., "new row defaults to already-used materialId", "dropdown option list includes sibling row's selected material")
  - Mark task complete when tests are written, run, and failures are documented
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Non-Duplicate Material State Behavior
  - **IMPORTANT**: Follow observation-first methodology — observe behavior on UNFIXED code for states where `isBugCondition` returns false
  - Observe: with zero rows, `_addMaterialUsageRow()` appends a row with `materialId = list[0].id`
  - Observe: with one row, changing the quantity input updates line cost and triggers `_updatePricePreview()` correctly
  - Observe: with one row, calling `_removeMaterialUsageRow(0)` splices the array and re-renders with zero rows
  - Observe: `saveVariantModal` builds `materialUsages` as `{ [materialId]: quantity }` — structure unchanged
  - Observe: opening the variant modal for a saved variant with distinct material usages populates all rows correctly
  - Write property-based tests: for all states with zero or one row (where no duplicate is possible), assert `_addMaterialUsageRow()` behavior, quantity/cost calculation, row deletion, and save payload are identical to observed baseline
  - Verify tests PASS on UNFIXED code (confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3. Fix duplicate material selection in variant editor

  - [x] 3.1 Implement the fix in `assets/js/admin-products.js`
    - In `_renderMaterialUsagesTable()`: compute `usedIds = new Set(_materialUsageRows.map(r => r.materialId))` before building rows; when building `opts` for each row, exclude any material whose `id` is in `usedIds` AND whose `id` is not the current row's own `materialId`; after rendering, disable `#vmod-add-material-btn` if `_materialUsageRows.length >= list.length`, otherwise remove the `disabled` attribute
    - In `_addMaterialUsageRow()`: compute `usedIds = new Set(_materialUsageRows.map(r => r.materialId))`; pick the first material in `list` whose `id` is NOT in `usedIds`; if no unused material exists, return early without appending a row
    - In `_onMaterialUsageRowChange(idx)`: after updating `_materialUsageRows[idx]` and the live line cost, call `_renderMaterialUsagesTable()` to refresh all rows' dropdowns so the newly selected material is excluded from sibling rows and the previously selected material becomes available again
    - _Bug_Condition: `isBugCondition(rows, allMaterials)` — a used materialId appears in another row's dropdown, OR a new row defaults to an already-used materialId, OR the "Agregar material" button remains enabled when all materials are in use_
    - _Expected_Behavior: every dropdown shows only materials not selected in any other row; `_addMaterialUsageRow()` picks the first unused material; button is disabled when `rows.length >= allMaterials.length`_
    - _Preservation: quantity editing, line-cost calculation, row deletion, price preview, modal population from saved data, and API save payload (`{ materialId: quantity }`) are all unchanged_
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Duplicate Material Selection Bug
    - **IMPORTANT**: Re-run the SAME tests from task 1 — do NOT write new tests
    - The tests from task 1 encode the expected behavior; when they pass, the fix is confirmed
    - Run all four bug condition test cases from step 1 against the fixed code
    - **EXPECTED OUTCOME**: All four tests PASS (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Non-Duplicate Material State Behavior
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run all preservation property tests from step 2 against the fixed code
    - **EXPECTED OUTCOME**: All preservation tests PASS (confirms no regressions)
    - Confirm quantity editing, cost calculation, row deletion, save payload, and modal population all behave identically to the observed baseline

- [x] 4. Checkpoint — Ensure all tests pass
  - Run the full test suite (exploration + preservation tests)
  - Ensure all tests pass; ask the user if any questions arise
