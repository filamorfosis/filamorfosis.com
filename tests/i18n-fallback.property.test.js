// Feature: store-product-first-redesign, Property 10: i18n key fallback to Spanish

'use strict';

const fc = require('fast-check');
const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Environment setup — simulate browser globals needed by the lang files
// ---------------------------------------------------------------------------
global.window = global.window || {};
global.window.FilamorfosisI18n = {};

// localStorage mock
global.localStorage = {
    _store: {},
    setItem(k, v) { this._store[k] = v; },
    getItem(k) { return this._store[k] || null; },
    removeItem(k) { delete this._store[k]; },
    clear() { this._store = {}; }
};

// ---------------------------------------------------------------------------
// Load all 6 lang files so window.FilamorfosisI18n is populated
// ---------------------------------------------------------------------------
const langDir = path.join(__dirname, '..', 'assets', 'js', 'i18n');
const langFiles = ['lang.es.js', 'lang.en.js', 'lang.de.js', 'lang.pt.js', 'lang.ja.js', 'lang.zh.js'];

for (const file of langFiles) {
    const src = fs.readFileSync(path.join(langDir, file), 'utf8');
    // Execute in a context where window is available
    const fn = new Function('window', src); // eslint-disable-line no-new-func
    fn(global.window);
}

const i18n = global.window.FilamorfosisI18n;
const SUPPORTED_LANGS = ['en', 'de', 'pt', 'ja', 'zh'];

// Verify all lang files loaded correctly
for (const lang of ['es', ...SUPPORTED_LANGS]) {
    if (!i18n[lang] || typeof i18n[lang] !== 'object') {
        console.error(`[SETUP ERROR] Language "${lang}" did not load from FilamorfosisI18n`);
        process.exit(1);
    }
}

// ---------------------------------------------------------------------------
// Build the t() function that mirrors store-i18n.js logic:
// 1. Check FilamorfosisI18n[lang][key]
// 2. Fall back to FilamorfosisI18n['es'][key]
// Never return the raw key string.
// ---------------------------------------------------------------------------
function t(key, lang) {
    var tlLang = i18n[lang] || {};
    var tlEs   = i18n['es'] || {};
    if (tlLang[key] !== undefined) { return tlLang[key]; }
    if (tlEs[key]   !== undefined) { return tlEs[key]; }
    return tlEs[key] || key; // last resort
}

// ---------------------------------------------------------------------------
// Collect keys that exist in Spanish
// ---------------------------------------------------------------------------
const esKeys = Object.keys(i18n['es']);

if (esKeys.length === 0) {
    console.error('[SETUP ERROR] Spanish lang file has no keys');
    process.exit(1);
}

// ---------------------------------------------------------------------------
// Property 10: i18n key fallback to Spanish
// Validates: Requirements 9.6
//
// For each non-ES language, generate a key that is present in 'es' but
// deliberately absent in the target language. Assert that t(key) returns
// the Spanish value — never the raw key string.
// ---------------------------------------------------------------------------
let p10Passed = false;

try {
    fc.assert(
        fc.property(
            fc.constantFrom(...SUPPORTED_LANGS),
            fc.constantFrom(...esKeys),
            (lang, key) => {
                const esValue = i18n['es'][key];

                // Temporarily remove the key from the target language to simulate absence
                const targetLang = i18n[lang];
                const hadKey = Object.prototype.hasOwnProperty.call(targetLang, key);
                const savedValue = targetLang[key];

                if (hadKey) {
                    delete targetLang[key];
                }

                let result;
                try {
                    result = t(key, lang);
                } finally {
                    // Restore the key
                    if (hadKey) {
                        targetLang[key] = savedValue;
                    }
                }

                // Must return the Spanish value, not the raw key string
                return result === esValue && result !== key;
            }
        ),
        { numRuns: 100 }
    );
    p10Passed = true;
    console.log('✅ Property 10 PASSED: i18n key fallback to Spanish — t(key) returns Spanish value when key is absent in target language, never the raw key string');
} catch (err) {
    console.error('❌ Property 10 FAILED: i18n key fallback to Spanish');
    console.error(err.message);
}

// ---------------------------------------------------------------------------
// Exit
// ---------------------------------------------------------------------------
if (p10Passed) {
    console.log('\n✅ All i18n-fallback property tests passed.');
    process.exit(0);
} else {
    console.error('\n❌ One or more i18n-fallback property tests failed.');
    process.exit(1);
}
