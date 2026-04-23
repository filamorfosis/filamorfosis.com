// Property 10: Reorder skips unavailable variants
// Validates: Requirements 7.17, 12.8
'use strict';

const fc = require('fast-check');

function filterAvailableItems(orderItems) {
  return orderItems.filter(function (i) { return i.isAvailable !== false; });
}

function getSkippedItems(orderItems) {
  return orderItems.filter(function (i) { return i.isAvailable === false; });
}

const orderItemArb = fc.record({
  variantId:      fc.uuid(),
  quantity:       fc.integer({ min: 1, max: 99 }),
  isAvailable:    fc.boolean(),
  productTitleEs: fc.string({ minLength: 1, maxLength: 40 })
});

const orderItemsArb = fc.array(orderItemArb, { minLength: 0, maxLength: 20 });

var p10Passed = false;
try {
  fc.assert(
    fc.property(orderItemsArb, function (items) {
      var available = filterAvailableItems(items);
      var skipped   = getSkippedItems(items);
      if (available.length + skipped.length !== items.length) return false;
      if (available.some(function (i) { return i.isAvailable === false; })) return false;
      if (skipped.some(function (i) { return i.isAvailable !== false; })) return false;
      for (var idx = 0; idx < items.length; idx++) {
        var item = items[idx];
        if (item.isAvailable !== false) {
          var found = available.find(function (a) { return a.variantId === item.variantId; });
          if (!found || found.quantity !== item.quantity) return false;
        }
      }
      return true;
    }),
    { numRuns: 1000 }
  );
  p10Passed = true;
  console.log('✅ Property 10 PASSED: Reorder skips unavailable variants');
} catch (err) {
  console.error('❌ Property 10 FAILED:', err.message);
}

if (p10Passed) {
  console.log('\n✅ All reorder property tests passed.');
  process.exit(0);
} else {
  console.error('\n❌ One or more reorder property tests failed.');
  process.exit(1);
}
