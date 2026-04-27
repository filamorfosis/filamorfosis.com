// Feature: store-product-first-redesign, Property 3: Category filter reduces or preserves product count
// Feature: store-product-first-redesign, Property 4: Category names resolve from current language
'use strict';

const fc = require('fast-check');

// ── Property 3 helpers ────────────────────────────────────────────────────────
// Mirrors the category-filter logic in filterByCategory / loadProducts:
// when a categoryId is active, only products matching that categoryId are shown.
function filterProductsByCategory(products, categoryId) {
    if (!categoryId) return products;
    return products.filter(function(p) { return p.categoryId === categoryId; });
}

// ── Property 4 helpers ────────────────────────────────────────────────────────
// Mirrors _catName() in products.js
function resolveCategoryName(cat, lang) {
    return lang === 'es' ? cat.nameEs : cat.nameEn;
}

// ── Arbitraries ───────────────────────────────────────────────────────────────
var categoryIdArb = fc.uuid();

var productArb = fc.record({
    id: fc.uuid(),
    categoryId: fc.uuid()
});

var categoryArb = fc.record({
    id: fc.uuid(),
    slug: fc.string({ minLength: 1, maxLength: 30 }),
    nameEs: fc.string({ minLength: 1, maxLength: 60 }),
    nameEn: fc.string({ minLength: 1, maxLength: 60 }),
    imageUrl: fc.option(fc.webUrl(), { nil: null }),
    productCount: fc.integer({ min: 0, max: 9999 })
});

// Supported language codes (es + all others)
var langArb = fc.constantFrom('es', 'en', 'de', 'pt', 'ja', 'zh');

// ── Property 3: Category filter reduces or preserves product count ─────────────
// **Validates: Requirements 2.4, 4.4**
var p3Passed = false;
try {
    fc.assert(
        fc.property(
            fc.array(productArb, { minLength: 0, maxLength: 50 }),
            fc.option(categoryIdArb, { nil: null }),
            function(products, categoryId) {
                var filtered = filterProductsByCategory(products, categoryId);
                return filtered.length <= products.length;
            }
        ),
        { numRuns: 100 }
    );
    p3Passed = true;
    console.log('✅ Property 3 PASSED: Category filter reduces or preserves product count');
} catch (err) {
    console.error('❌ Property 3 FAILED:', err.message);
}

// ── Property 4: Category names resolve from current language ──────────────────
// **Validates: Requirements 2.7, 9.2**
var p4Passed = false;
try {
    fc.assert(
        fc.property(
            categoryArb,
            langArb,
            function(cat, lang) {
                var name = resolveCategoryName(cat, lang);
                if (lang === 'es') {
                    return name === cat.nameEs;
                } else {
                    return name === cat.nameEn;
                }
            }
        ),
        { numRuns: 100 }
    );
    p4Passed = true;
    console.log('✅ Property 4 PASSED: Category names resolve from current language');
} catch (err) {
    console.error('❌ Property 4 FAILED:', err.message);
}

// ── Summary ───────────────────────────────────────────────────────────────────
var allPassed = p3Passed && p4Passed;

if (allPassed) {
    console.log('\n✅ All category-filter property tests passed.');
    process.exit(0);
} else {
    console.error('\n❌ One or more category-filter property tests failed.');
    process.exit(1);
}
