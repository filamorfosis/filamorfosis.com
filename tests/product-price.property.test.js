// Feature: online-store, Property 4 (frontend): Minimum variant price display
// Validates: Requirements 1.7
//
// For any product with one or more available variants, the price displayed as
// "Desde $X" must equal the minimum Price across all variants where isAvailable = true.

'use strict';

const fc = require('fast-check');

// ---------------------------------------------------------------------------
// The function under test — mirrors the logic in products.js / cart.js that
// computes the "Desde $X" label shown on every product card.
// ---------------------------------------------------------------------------

/**
 * getMinAvailablePrice(variants) → number | null
 *
 * Returns the minimum price among variants where isAvailable === true,
 * or null when no available variant exists.
 *
 * @param {{ price: number, isAvailable: boolean }[]} variants
 * @returns {number | null}
 */
function getMinAvailablePrice(variants) {
    const available = variants.filter(v => v.isAvailable);
    if (available.length === 0) return null;
    return Math.min(...available.map(v => v.price));
}

/**
 * formatDesdeLabel(minPrice) → string
 *
 * Formats the "Desde $X" label shown on product cards.
 * Mirrors the frontend rendering logic.
 *
 * @param {number | null} minPrice
 * @returns {string}
 */
function formatDesdeLabel(minPrice) {
    if (minPrice === null) return '';
    return `Desde $${minPrice.toFixed(2)}`;
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** A single product variant with a positive price and an availability flag. */
const variantArb = fc.record({
    price:       fc.float({ min: 0.01, max: 99999.99, noNaN: true }),
    isAvailable: fc.boolean(),
});

/** A product with 1–10 variants (at least one guaranteed available). */
const productWithAvailableVariantArb = fc
    .tuple(
        fc.array(variantArb, { minLength: 1, maxLength: 9 }),
        variantArb,
    )
    .map(([extras, guaranteed]) => {
        // Ensure at least one available variant exists
        const anchor = { ...guaranteed, isAvailable: true };
        return { variants: [...extras, anchor] };
    });

/** A product whose ALL variants are unavailable. */
const productAllUnavailableArb = fc
    .array(
        fc.record({
            price:       fc.float({ min: 0.01, max: 99999.99, noNaN: true }),
            isAvailable: fc.constant(false),
        }),
        { minLength: 1, maxLength: 10 },
    )
    .map(variants => ({ variants }));

// ---------------------------------------------------------------------------
// Property 4 (frontend): "Desde $X" equals minimum available variant price
// ---------------------------------------------------------------------------

let p4Passed = false;
try {
    fc.assert(
        fc.property(
            productWithAvailableVariantArb,
            (product) => {
                const minPrice = getMinAvailablePrice(product.variants);

                // Must be a positive number when at least one variant is available
                if (typeof minPrice !== 'number' || minPrice <= 0) return false;

                // Must equal the true minimum of available prices
                const availablePrices = product.variants
                    .filter(v => v.isAvailable)
                    .map(v => v.price);
                const trueMin = Math.min(...availablePrices);

                // Allow for floating-point epsilon
                if (Math.abs(minPrice - trueMin) > 1e-9) return false;

                // Label must start with "Desde $" and contain the formatted price
                const label = formatDesdeLabel(minPrice);
                if (!label.startsWith('Desde $')) return false;

                // The numeric value embedded in the label must match
                const labelValue = parseFloat(label.replace('Desde $', ''));
                return Math.abs(labelValue - trueMin) < 0.005; // within rounding
            }
        ),
        { numRuns: 500 }
    );
    p4Passed = true;
    console.log('✅ Property 4 (frontend) PASSED: "Desde $X" label equals minimum available variant price');
} catch (err) {
    console.error('❌ Property 4 (frontend) FAILED: "Desde $X" label minimum price invariant');
    console.error(err.message);
}

// ---------------------------------------------------------------------------
// Edge case: all variants unavailable → no label rendered
// ---------------------------------------------------------------------------

let edgePassed = false;
try {
    fc.assert(
        fc.property(
            productAllUnavailableArb,
            (product) => {
                const minPrice = getMinAvailablePrice(product.variants);
                const label    = formatDesdeLabel(minPrice);
                // When no variant is available, minPrice is null and label is empty
                return minPrice === null && label === '';
            }
        ),
        { numRuns: 200 }
    );
    edgePassed = true;
    console.log('✅ Property 4 edge case PASSED: no label when all variants unavailable');
} catch (err) {
    console.error('❌ Property 4 edge case FAILED');
    console.error(err.message);
}

// ---------------------------------------------------------------------------
// Exit
// ---------------------------------------------------------------------------
if (p4Passed && edgePassed) {
    console.log('\n✅ All product price property tests passed.');
    process.exit(0);
} else {
    console.error('\n❌ One or more product price property tests failed.');
    process.exit(1);
}
