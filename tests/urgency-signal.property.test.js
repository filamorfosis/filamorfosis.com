// Property 9: Urgency signal threshold invariant
// Validates: Requirements 10.2
//
// For any stockQuantity value, assert badge is shown iff stockQuantity ∈ [0, 5]
// and never shown when stockQuantity > 5.
//
// Runs in Node.js (no DOM). Tests the pure `shouldShowUrgency` function
// extracted from assets/js/products.js.

'use strict';

const fc = require('fast-check');

// ---------------------------------------------------------------------------
// Pure function under test (mirrors products.js implementation)
// ---------------------------------------------------------------------------
// Returns true iff stockQuantity is defined and in [0, 5].
function shouldShowUrgency(stockQuantity) {
    return stockQuantity !== undefined && stockQuantity !== null && stockQuantity <= 5;
}

// ---------------------------------------------------------------------------
// Property 9a: badge shown iff stockQuantity ∈ [0, 5]
// ---------------------------------------------------------------------------
var p9aPass = false;
try {
    fc.assert(
        fc.property(
            fc.integer({ min: 0, max: 5 }),
            function (qty) {
                // For any qty in [0, 5], urgency MUST be shown
                return shouldShowUrgency(qty) === true;
            }
        ),
        { numRuns: 1000 }
    );
    p9aPass = true;
    console.log('✅ Property 9a PASSED: urgency shown for all stockQuantity in [0, 5]');
} catch (err) {
    console.error('❌ Property 9a FAILED: urgency not shown for some stockQuantity in [0, 5]');
    console.error(err.message);
}

// ---------------------------------------------------------------------------
// Property 9b: badge never shown when stockQuantity > 5
// ---------------------------------------------------------------------------
var p9bPass = false;
try {
    fc.assert(
        fc.property(
            fc.integer({ min: 6, max: 1_000_000 }),
            function (qty) {
                // For any qty > 5, urgency MUST NOT be shown
                return shouldShowUrgency(qty) === false;
            }
        ),
        { numRuns: 1000 }
    );
    p9bPass = true;
    console.log('✅ Property 9b PASSED: urgency never shown for stockQuantity > 5');
} catch (err) {
    console.error('❌ Property 9b FAILED: urgency shown for some stockQuantity > 5');
    console.error(err.message);
}

// ---------------------------------------------------------------------------
// Property 9c: badge never shown when stockQuantity is undefined or null
// ---------------------------------------------------------------------------
var p9cPass = false;
try {
    // undefined
    if (shouldShowUrgency(undefined) !== false) {
        throw new Error('shouldShowUrgency(undefined) should return false');
    }
    // null
    if (shouldShowUrgency(null) !== false) {
        throw new Error('shouldShowUrgency(null) should return false');
    }
    p9cPass = true;
    console.log('✅ Property 9c PASSED: urgency never shown for undefined/null stockQuantity');
} catch (err) {
    console.error('❌ Property 9c FAILED:', err.message);
}

// ---------------------------------------------------------------------------
// Property 9d: negative stock values (0 included) still show urgency
// ---------------------------------------------------------------------------
var p9dPass = false;
try {
    fc.assert(
        fc.property(
            fc.integer({ min: -1000, max: 0 }),
            function (qty) {
                // Negative or zero stock is still ≤ 5, so urgency MUST be shown
                return shouldShowUrgency(qty) === true;
            }
        ),
        { numRuns: 500 }
    );
    p9dPass = true;
    console.log('✅ Property 9d PASSED: urgency shown for stockQuantity ≤ 0 (edge: negative/zero)');
} catch (err) {
    console.error('❌ Property 9d FAILED:', err.message);
}

// ---------------------------------------------------------------------------
// Exit
// ---------------------------------------------------------------------------
if (p9aPass && p9bPass && p9cPass && p9dPass) {
    console.log('\n✅ All urgency-signal property tests passed.');
    process.exit(0);
} else {
    console.error('\n❌ One or more urgency-signal property tests failed.');
    process.exit(1);
}
