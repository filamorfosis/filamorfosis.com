// Property 6: Search autocomplete result relevance
// Validates: Requirements 14.2, 14.3
'use strict';

const fc = require('fast-check');
const { levenshtein, normalizeStr, getMatches } = require('../assets/js/search-autocomplete.js');

const productArb = fc.record({
  id:       fc.integer({ min: 1, max: 9999 }),
  name:     fc.string({ minLength: 2, maxLength: 40 }).filter(s => s.trim().length >= 2),
  category: fc.string({ minLength: 1, maxLength: 20 }),
});

const catalogArb = fc.array(productArb, { minLength: 0, maxLength: 30 });
const queryArb = fc.string({ minLength: 2, maxLength: 20 }).filter(s => s.trim().length >= 2);

var p6aPass = false;
try {
  fc.assert(
    fc.property(queryArb, catalogArb, function (query, catalog) {
      var q = normalizeStr(query);
      var results = getMatches(query, catalog);
      for (var i = 0; i < results.length; i++) {
        var name = normalizeStr(results[i].name || '');
        var substringMatch = name.includes(q);
        var levMatch = levenshtein(q, name) <= 2;
        var wordMatch = false;
        if (q.length >= 4) {
          var words = name.split(/\s+/);
          for (var w = 0; w < words.length; w++) {
            if (words[w].length >= 4 && levenshtein(q, words[w]) <= 2) { wordMatch = true; break; }
          }
        }
        if (!substringMatch && !levMatch && !wordMatch) return false;
      }
      return true;
    }),
    { numRuns: 1000 }
  );
  p6aPass = true;
  console.log('✅ Property 6a PASSED: every suggestion is relevant');
} catch (err) {
  console.error('❌ Property 6a FAILED:', err.message);
}

var p6bPass = false;
try {
  fc.assert(
    fc.property(queryArb, catalogArb, function (query, catalog) {
      return getMatches(query, catalog).length <= 8;
    }),
    { numRuns: 1000 }
  );
  p6bPass = true;
  console.log('✅ Property 6b PASSED: result count never exceeds 8');
} catch (err) {
  console.error('❌ Property 6b FAILED:', err.message);
}

var p6cPass = false;
try {
  fc.assert(
    fc.property(fc.string({ minLength: 0, maxLength: 1 }), catalogArb, function (query, catalog) {
      return getMatches(query, catalog).length === 0;
    }),
    { numRuns: 500 }
  );
  p6cPass = true;
  console.log('✅ Property 6c PASSED: short queries return empty results');
} catch (err) {
  console.error('❌ Property 6c FAILED:', err.message);
}

if (p6aPass && p6bPass && p6cPass) {
  console.log('\n✅ All search-autocomplete property tests passed.');
  process.exit(0);
} else {
  console.error('\n❌ One or more search-autocomplete property tests failed.');
  process.exit(1);
}
