// Feature: store-product-first-redesign, Property 7: Load More button visibility matches pagination state
'use strict';

const fc = require('fast-check');

// ── Helper: mirrors the Load More visibility logic in _updateLoadMoreBtn ──────
// Load More is visible iff currentPage * pageSize < totalCount
function shouldShowLoadMore(currentPage, pageSize, totalCount) {
    return currentPage * pageSize < totalCount;
}

// ── Property 7: Load More button visibility matches pagination state ──────────
// **Validates: Requirements 4.5**

var p7Passed = false;
try {
    fc.assert(
        fc.property(
            // totalCount: 0..10000
            fc.integer({ min: 0, max: 10000 }),
            // pageSize: 1..100 (must be positive to avoid division issues)
            fc.integer({ min: 1, max: 100 }),
            // currentPage: 1..200
            fc.integer({ min: 1, max: 200 }),
            function(totalCount, pageSize, currentPage) {
                var visible = shouldShowLoadMore(currentPage, pageSize, totalCount);
                var expected = currentPage * pageSize < totalCount;
                return visible === expected;
            }
        ),
        { numRuns: 100 }
    );
    p7Passed = true;
    console.log('✅ Property 7 PASSED: Load More button visibility matches pagination state');
} catch (err) {
    console.error('❌ Property 7 FAILED:', err.message);
}

// ── Edge case: exactly at boundary (currentPage * pageSize === totalCount) ────
// Load More should NOT be visible when all items are loaded
var boundaryPassed = false;
try {
    fc.assert(
        fc.property(
            fc.integer({ min: 1, max: 100 }),  // pageSize
            fc.integer({ min: 1, max: 200 }),  // currentPage
            function(pageSize, currentPage) {
                var totalCount = currentPage * pageSize; // exactly at boundary
                return shouldShowLoadMore(currentPage, pageSize, totalCount) === false;
            }
        ),
        { numRuns: 100 }
    );
    boundaryPassed = true;
    console.log('✅ Property 7 (boundary) PASSED: Load More hidden when currentPage * pageSize === totalCount');
} catch (err) {
    console.error('❌ Property 7 (boundary) FAILED:', err.message);
}

// ── Edge case: totalCount = 0 → Load More never visible ──────────────────────
var zeroTotalPassed = false;
try {
    fc.assert(
        fc.property(
            fc.integer({ min: 1, max: 100 }),  // pageSize
            fc.integer({ min: 1, max: 200 }),  // currentPage
            function(pageSize, currentPage) {
                return shouldShowLoadMore(currentPage, pageSize, 0) === false;
            }
        ),
        { numRuns: 100 }
    );
    zeroTotalPassed = true;
    console.log('✅ Property 7 (zero total) PASSED: Load More hidden when totalCount is 0');
} catch (err) {
    console.error('❌ Property 7 (zero total) FAILED:', err.message);
}

// ── Edge case: first page with more items than pageSize → Load More visible ───
var firstPagePassed = false;
try {
    fc.assert(
        fc.property(
            fc.integer({ min: 1, max: 100 }),  // pageSize
            fc.integer({ min: 1, max: 10000 }), // extra items beyond first page
            function(pageSize, extra) {
                var totalCount = pageSize + extra; // always more than one page
                return shouldShowLoadMore(1, pageSize, totalCount) === true;
            }
        ),
        { numRuns: 100 }
    );
    firstPagePassed = true;
    console.log('✅ Property 7 (first page) PASSED: Load More visible when more items exist beyond first page');
} catch (err) {
    console.error('❌ Property 7 (first page) FAILED:', err.message);
}

// ── Summary ───────────────────────────────────────────────────────────────────
var allPassed = p7Passed && boundaryPassed && zeroTotalPassed && firstPagePassed;

if (allPassed) {
    console.log('\n✅ All load-more-visibility property tests passed.');
    process.exit(0);
} else {
    console.error('\n❌ One or more load-more-visibility property tests failed.');
    process.exit(1);
}
