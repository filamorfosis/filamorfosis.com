// Property 5: Variant selector price update correctness
// Validates: Requirements 3.6
//
// For any product with ≥ 2 variants with distinct prices, selecting each pill
// SHALL update the displayed price to exactly that variant's price.
//
// Since the existing data uses a pricing table (not per-variant prices),
// this test exercises the pure price-lookup logic extracted from renderModal:
// given a pricing rows array and a selected variant label, the resolved price
// must exactly match the row's `flat` value (or `relief` when flat is N/A).
//
// Runs in Node.js (no DOM). Tests the pure lookup function.

'use strict';

const fc = require('fast-check');

// ---------------------------------------------------------------------------
// Pure price-lookup function — mirrors the logic in renderModal's pill handler
// ---------------------------------------------------------------------------
/**
 * Given a pricing rows array and a selected variant label, return the price
 * that should be displayed.
 *
 * @param {Array<{variant: string, flat: string, relief: string}>} rows
 * @param {string} selectedVariant
 * @returns {string} price string
 */
function resolveVariantPrice(rows, selectedVariant) {
    const row = rows.find(r => r.variant === selectedVariant);
    if (!row) {
        // Fallback: lowest flat price across all rows
        const prices = rows
            .map(r => r.flat)
            .filter(p => p !== 'N/A' && p !== 'Cotizar')
            .map(p => parseInt(p.replace(/\D/g, '')))
            .filter(n => !isNaN(n));
        if (!prices.length) return 'Cotizar';
        return '$' + Math.min(...prices);
    }
    if (row.flat !== 'N/A' && row.flat !== 'Cotizar') return row.flat;
    if (row.relief !== 'N/A' && row.relief !== 'Cotizar') return row.relief;
    return 'Cotizar';
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

// A price string like "$1,200" or "N/A" or "Cotizar"
const priceArb = fc.oneof(
    fc.integer({ min: 100, max: 99999 }).map(n => '$' + n.toLocaleString('es-MX')),
    fc.constant('N/A'),
    fc.constant('Cotizar')
);

// A single pricing row
const rowArb = fc.record({
    variant: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
    flat:    priceArb,
    relief:  priceArb,
});

// A pricing rows array with ≥ 2 rows and distinct variant labels
const rowsArb = fc.array(rowArb, { minLength: 2, maxLength: 8 })
    .filter(rows => {
        const labels = rows.map(r => r.variant);
        return new Set(labels).size === labels.length; // all distinct
    });

// ---------------------------------------------------------------------------
// Property 5a: selecting a variant returns exactly that row's price
// ---------------------------------------------------------------------------
var p5aPass = false;
try {
    fc.assert(
        fc.property(
            rowsArb,
            fc.nat().map(n => n), // used to pick a row index
            function (rows, idx) {
                const row = rows[idx % rows.length];
                const result = resolveVariantPrice(rows, row.variant);

                // The result must be exactly the row's flat price (if valid),
                // or the relief price (if flat is N/A/Cotizar), or 'Cotizar'.
                if (row.flat !== 'N/A' && row.flat !== 'Cotizar') {
                    return result === row.flat;
                }
                if (row.relief !== 'N/A' && row.relief !== 'Cotizar') {
                    return result === row.relief;
                }
                return result === 'Cotizar';
            }
        ),
        { numRuns: 1000 }
    );
    p5aPass = true;
    console.log('✅ Property 5a PASSED: selecting a variant returns exactly that row\'s price');
} catch (err) {
    console.error('❌ Property 5a FAILED:', err.message);
}

// ---------------------------------------------------------------------------
// Property 5b: selecting different variants returns different prices
//              when the rows have distinct flat prices
// ---------------------------------------------------------------------------
var p5bPass = false;
try {
    // Build rows where every flat price is a distinct numeric value
    const distinctRowsArb = fc.array(
        fc.integer({ min: 100, max: 99999 }),
        { minLength: 2, maxLength: 6 }
    ).filter(prices => new Set(prices).size === prices.length)
     .chain(prices =>
        fc.tuple(...prices.map((price, i) =>
            fc.constant({ variant: `Variante ${i + 1}`, flat: '$' + price, relief: 'N/A' })
        ))
     ).map(rows => Array.from(rows));

    fc.assert(
        fc.property(
            distinctRowsArb,
            function (rows) {
                // For each pair of distinct variants, their resolved prices must differ
                for (let i = 0; i < rows.length; i++) {
                    for (let j = i + 1; j < rows.length; j++) {
                        const priceI = resolveVariantPrice(rows, rows[i].variant);
                        const priceJ = resolveVariantPrice(rows, rows[j].variant);
                        if (priceI === priceJ) return false;
                    }
                }
                return true;
            }
        ),
        { numRuns: 500 }
    );
    p5bPass = true;
    console.log('✅ Property 5b PASSED: distinct variant rows produce distinct prices');
} catch (err) {
    console.error('❌ Property 5b FAILED:', err.message);
}

// ---------------------------------------------------------------------------
// Property 5c: price lookup is deterministic — same variant always same price
// ---------------------------------------------------------------------------
var p5cPass = false;
try {
    fc.assert(
        fc.property(
            rowsArb,
            fc.nat(),
            function (rows, idx) {
                const row = rows[idx % rows.length];
                const first  = resolveVariantPrice(rows, row.variant);
                const second = resolveVariantPrice(rows, row.variant);
                return first === second;
            }
        ),
        { numRuns: 500 }
    );
    p5cPass = true;
    console.log('✅ Property 5c PASSED: price lookup is deterministic');
} catch (err) {
    console.error('❌ Property 5c FAILED:', err.message);
}

// ---------------------------------------------------------------------------
// Property 5d: unknown variant falls back to lowest flat price or 'Cotizar'
// ---------------------------------------------------------------------------
var p5dPass = false;
try {
    fc.assert(
        fc.property(
            rowsArb,
            function (rows) {
                const result = resolveVariantPrice(rows, '__nonexistent_variant__');
                // Must be either 'Cotizar' or a price string starting with '$'
                return result === 'Cotizar' || result.startsWith('$');
            }
        ),
        { numRuns: 500 }
    );
    p5dPass = true;
    console.log('✅ Property 5d PASSED: unknown variant falls back gracefully');
} catch (err) {
    console.error('❌ Property 5d FAILED:', err.message);
}

// ---------------------------------------------------------------------------
// Exit
// ---------------------------------------------------------------------------
if (p5aPass && p5bPass && p5cPass && p5dPass) {
    console.log('\n✅ All variant-price property tests passed.');
    process.exit(0);
} else {
    console.error('\n❌ One or more variant-price property tests failed.');
    process.exit(1);
}
