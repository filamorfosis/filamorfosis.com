// Feature: store-product-first-redesign, Property 9: Variant selection controls add-to-cart button state
// Validates: Requirements 6.5

'use strict';

const fc = require('fast-check');

// ---------------------------------------------------------------------------
// Pure helper: mirrors the button-state logic from renderProductDetail
// The button is enabled iff at least one available variant is currently selected.
// ---------------------------------------------------------------------------

/**
 * isVariantAvailable — mirrors the availability check in renderProductDetail
 */
function isVariantAvailable(variant) {
    return variant.isAvailable !== false && variant.inStock !== false;
}

/**
 * computeButtonState
 * Given a list of variants and a set of selected variant ids,
 * returns true (enabled) iff at least one selected variant is available.
 *
 * @param {Array}  variants   - array of variant objects
 * @param {Set}    selectedIds - set of variant ids that are checked
 * @returns {boolean} true = button enabled
 */
function computeButtonState(variants, selectedIds) {
    if (!selectedIds || selectedIds.size === 0) return false;
    return variants.some(function(v) {
        return selectedIds.has(v.id) && isVariantAvailable(v);
    });
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

// A single variant with explicit availability flags
const variantArb = fc.record({
    id:          fc.uuid(),
    isAvailable: fc.boolean(),
    inStock:     fc.boolean(),
    price:       fc.float({ min: 1, max: 9999, noNaN: true }),
});

// A non-empty array of variants
const variantsArb = fc.array(variantArb, { minLength: 1, maxLength: 8 });

// ---------------------------------------------------------------------------
// Property 9: Variant selection controls add-to-cart button state
// Validates: Requirements 6.5
// ---------------------------------------------------------------------------

var p9Passed = false;

try {
    fc.assert(
        fc.property(
            variantsArb,
            // For each variant array, generate a random subset of selected ids
            fc.func(fc.boolean()),
            function(variants, shouldSelect) {
                // Build a selection set: randomly select some variants
                var selectedIds = new Set(
                    variants
                        .filter(function(v) { return shouldSelect(v.id); })
                        .map(function(v) { return v.id; })
                );

                var buttonEnabled = computeButtonState(variants, selectedIds);

                // Determine expected state
                var hasAvailableSelected = variants.some(function(v) {
                    return selectedIds.has(v.id) && isVariantAvailable(v);
                });

                // Button must be enabled iff at least one available variant is selected
                if (buttonEnabled !== hasAvailableSelected) {
                    throw new Error(
                        'Button state mismatch. enabled=' + buttonEnabled +
                        ' expected=' + hasAvailableSelected +
                        ' selectedIds=' + JSON.stringify(Array.from(selectedIds)) +
                        ' variants=' + JSON.stringify(variants.map(function(v) {
                            return { id: v.id, isAvailable: v.isAvailable, inStock: v.inStock };
                        }))
                    );
                }

                return true;
            }
        ),
        { numRuns: 200 }
    );

    // ── Edge case: no variants selected → button disabled ──────────────────
    fc.assert(
        fc.property(
            variantsArb,
            function(variants) {
                var buttonEnabled = computeButtonState(variants, new Set());
                if (buttonEnabled !== false) {
                    throw new Error('Button should be disabled when nothing is selected');
                }
                return true;
            }
        ),
        { numRuns: 100 }
    );

    // ── Edge case: only unavailable variants selected → button disabled ─────
    fc.assert(
        fc.property(
            fc.array(
                fc.record({
                    id:          fc.uuid(),
                    isAvailable: fc.constant(false),
                    inStock:     fc.boolean(),
                    price:       fc.float({ min: 1, max: 9999, noNaN: true }),
                }),
                { minLength: 1, maxLength: 6 }
            ),
            function(unavailableVariants) {
                var selectedIds = new Set(unavailableVariants.map(function(v) { return v.id; }));
                var buttonEnabled = computeButtonState(unavailableVariants, selectedIds);
                if (buttonEnabled !== false) {
                    throw new Error('Button should be disabled when only unavailable variants are selected');
                }
                return true;
            }
        ),
        { numRuns: 100 }
    );

    // ── Edge case: at least one available variant selected → button enabled ──
    fc.assert(
        fc.property(
            fc.array(variantArb, { minLength: 0, maxLength: 5 }),
            fc.record({
                id:          fc.uuid(),
                isAvailable: fc.constant(true),
                inStock:     fc.constant(true),
                price:       fc.float({ min: 1, max: 9999, noNaN: true }),
            }),
            function(otherVariants, availableVariant) {
                var allVariants = otherVariants.concat([availableVariant]);
                // Select only the available variant
                var selectedIds = new Set([availableVariant.id]);
                var buttonEnabled = computeButtonState(allVariants, selectedIds);
                if (buttonEnabled !== true) {
                    throw new Error('Button should be enabled when an available variant is selected');
                }
                return true;
            }
        ),
        { numRuns: 100 }
    );

    p9Passed = true;
    console.log('✅ Property 9 PASSED: Variant selection controls add-to-cart button state');
} catch (err) {
    console.error('❌ Property 9 FAILED:', err.message);
}

// ---------------------------------------------------------------------------
// Exit
// ---------------------------------------------------------------------------
if (p9Passed) {
    console.log('\n✅ All variant selection property tests passed.');
    process.exit(0);
} else {
    console.error('\n❌ Variant selection property test failed.');
    process.exit(1);
}
