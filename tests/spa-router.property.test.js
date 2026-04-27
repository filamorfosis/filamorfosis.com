// Feature: store-product-first-redesign, Property 2: Unknown routes fall back to home
// Validates: Requirements 0.11
'use strict';

const fc = require('fast-check');

// ── Route matching logic (mirrors SPA_Router in main.js) ─────────────────────
var STATIC_ROUTES = { home: true, services: true, contact: true, faq: true, about: true };
var PRODUCT_RE = /^#product-(.+)$/;

function resolveView(hash) {
    var h = (hash || '').trim();
    if (!h || h === '#home') return 'home';
    if (PRODUCT_RE.test(h)) {
        var id = h.match(PRODUCT_RE)[1];
        return 'product-' + id;
    }
    var name = h.replace(/^#/, '');
    if (STATIC_ROUTES[name]) return name;
    // Unknown route → home fallback
    return 'home';
}

// ── Arbitrary: hash strings that do NOT match any known route ─────────────────
// Known patterns to exclude: '', '#home', '#services', '#contact', '#faq',
// '#about', '#product-{anything}'
function isKnownRoute(h) {
    if (!h || h === '#home') return true;
    if (PRODUCT_RE.test(h)) return true;
    var name = h.replace(/^#/, '');
    return !!STATIC_ROUTES[name];
}

// Generate arbitrary strings that are not known routes
var unknownHashArb = fc.string({ minLength: 0, maxLength: 80 }).filter(function(s) {
    return !isKnownRoute(s);
});

// ── Property 2 ────────────────────────────────────────────────────────────────
var p2Passed = false;
try {
    fc.assert(
        fc.property(unknownHashArb, function(hash) {
            var view = resolveView(hash);
            return view === 'home';
        }),
        { numRuns: 100 }
    );
    p2Passed = true;
    console.log('✅ Property 2 PASSED: Unknown routes fall back to home');
} catch (err) {
    console.error('❌ Property 2 FAILED:', err.message);
}

// ── Summary ───────────────────────────────────────────────────────────────────
if (p2Passed) {
    console.log('\n✅ All spa-router property tests passed.');
    process.exit(0);
} else {
    console.error('\n❌ One or more spa-router property tests failed.');
    process.exit(1);
}
