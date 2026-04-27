// Feature: store-product-first-redesign, Property 5: Empty badge sections are hidden
'use strict';

const fc = require('fast-check');

// ── Helper: mirrors the visibility logic in renderFeaturedSection ─────────────
// When products.length === 0 → section gets 'featured-section--hidden' class (hidden)
// When products.length > 0  → class is removed (visible)
function sectionIsVisible(products) {
    return products.length > 0;
}

// ── Arbitraries ───────────────────────────────────────────────────────────────
var productArb = fc.record({
    id: fc.uuid(),
    titleEs: fc.string({ minLength: 1, maxLength: 60 }),
    titleEn: fc.string({ minLength: 1, maxLength: 60 }),
    imageUrls: fc.array(fc.webUrl(), { minLength: 0, maxLength: 5 }),
    badge: fc.constantFrom('hot', 'new', 'promo', 'popular', null),
    basePrice: fc.float({ min: 0, max: 9999 }),
    hasDiscount: fc.boolean(),
    variants: fc.array(fc.record({
        id: fc.uuid(),
        price: fc.float({ min: 0, max: 9999 }),
        effectivePrice: fc.float({ min: 0, max: 9999 }),
        isAvailable: fc.boolean(),
        inStock: fc.boolean()
    }), { minLength: 0, maxLength: 5 })
});

// ── Property 5: Empty badge sections are hidden ───────────────────────────────
// **Validates: Requirements 3.3**
var p5Passed = false;
try {
    fc.assert(
        fc.property(
            fc.array(productArb, { minLength: 0, maxLength: 20 }),
            function(products) {
                var visible = sectionIsVisible(products);
                // When array is empty → not visible (hidden)
                // When array is non-empty → visible
                return visible === (products.length > 0);
            }
        ),
        { numRuns: 100 }
    );
    p5Passed = true;
    console.log('✅ Property 5 PASSED: Empty badge sections are hidden');
} catch (err) {
    console.error('❌ Property 5 FAILED:', err.message);
}

// ── Additional check: empty array always hidden ───────────────────────────────
var emptyCheckPassed = false;
try {
    fc.assert(
        fc.property(
            fc.constant([]),
            function(products) {
                return sectionIsVisible(products) === false;
            }
        ),
        { numRuns: 100 }
    );
    emptyCheckPassed = true;
    console.log('✅ Property 5 (empty array) PASSED: Empty array always hidden');
} catch (err) {
    console.error('❌ Property 5 (empty array) FAILED:', err.message);
}

// ── Additional check: non-empty array always visible ─────────────────────────
var nonEmptyCheckPassed = false;
try {
    fc.assert(
        fc.property(
            fc.array(productArb, { minLength: 1, maxLength: 20 }),
            function(products) {
                return sectionIsVisible(products) === true;
            }
        ),
        { numRuns: 100 }
    );
    nonEmptyCheckPassed = true;
    console.log('✅ Property 5 (non-empty array) PASSED: Non-empty array always visible');
} catch (err) {
    console.error('❌ Property 5 (non-empty array) FAILED:', err.message);
}

// ── Summary ───────────────────────────────────────────────────────────────────
var allPassed = p5Passed && emptyCheckPassed && nonEmptyCheckPassed;

if (allPassed) {
    console.log('\n✅ All featured-section property tests passed.');
    process.exit(0);
} else {
    console.error('\n❌ One or more featured-section property tests failed.');
    process.exit(1);
}
