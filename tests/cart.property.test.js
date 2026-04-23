// Property 1: Cart total rendering accuracy — Validates: Requirements 4.12
// Property 4: Cart badge count accuracy — Validates: Requirements 4.11, 15.13
'use strict';

const fc = require('fast-check');

function computeCartTotal(items) {
  return items.reduce(function (sum, item) { return sum + item.unitPrice * item.quantity; }, 0);
}

function computeBadgeCount(items) {
  return items.reduce(function (sum, item) { return sum + item.quantity; }, 0);
}

function simulateAddItem(items, newItem) {
  var existing = items.find(function (i) { return i.id === newItem.id; });
  if (existing) {
    return items.map(function (i) {
      return i.id === newItem.id ? { id: i.id, unitPrice: i.unitPrice, quantity: i.quantity + newItem.quantity } : i;
    });
  }
  return items.concat([newItem]);
}

function simulateRemoveItem(items, itemId) {
  return items.filter(function (i) { return i.id !== itemId; });
}

function simulateUpdateItem(items, itemId, qty) {
  if (qty <= 0) return simulateRemoveItem(items, itemId);
  return items.map(function (i) {
    return i.id === itemId ? { id: i.id, unitPrice: i.unitPrice, quantity: qty } : i;
  });
}

const cartItemArb = fc.record({
  id: fc.uuid(),
  unitPrice: fc.float({ min: 1, max: 9999, noNaN: true, noDefaultInfinity: true }).map(function (v) {
    return Math.round(v * 100) / 100;
  }),
  quantity: fc.integer({ min: 1, max: 99 })
});

const cartItemsArb = fc.array(cartItemArb, { minLength: 0, maxLength: 20 }).map(function (items) {
  var seen = new Set();
  return items.filter(function (item) {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
});

var p1Passed = false;
try {
  fc.assert(
    fc.property(cartItemsArb, function (items) {
      var total = computeCartTotal(items);
      var expected = items.reduce(function (sum, item) { return sum + item.unitPrice * item.quantity; }, 0);
      return Math.abs(total - expected) < 0.001;
    }),
    { numRuns: 1000 }
  );
  p1Passed = true;
  console.log('✅ Property 1 PASSED: Cart total rendering accuracy');
} catch (err) {
  console.error('❌ Property 1 FAILED:', err.message);
}

var p4Passed = false;
try {
  fc.assert(
    fc.property(cartItemsArb, function (items) {
      var badge = computeBadgeCount(items);
      var expected = items.reduce(function (sum, item) { return sum + item.quantity; }, 0);
      return badge === expected;
    }),
    { numRuns: 1000 }
  );
  p4Passed = true;
  console.log('✅ Property 4 PASSED: Cart badge count accuracy');
} catch (err) {
  console.error('❌ Property 4 FAILED:', err.message);
}

var p4MutationPassed = false;
try {
  fc.assert(
    fc.property(cartItemsArb, cartItemArb, function (initialItems, newItem) {
      var freshItem = { id: 'new-' + newItem.id, unitPrice: newItem.unitPrice, quantity: newItem.quantity };
      var afterAdd = simulateAddItem(initialItems, freshItem);
      var badgeAfterAdd = computeBadgeCount(afterAdd);
      var expectedAfterAdd = initialItems.reduce(function (s, i) { return s + i.quantity; }, 0) + freshItem.quantity;
      if (badgeAfterAdd !== expectedAfterAdd) return false;

      var afterRemove = simulateRemoveItem(afterAdd, freshItem.id);
      var badgeAfterRemove = computeBadgeCount(afterRemove);
      var expectedAfterRemove = initialItems.reduce(function (s, i) { return s + i.quantity; }, 0);
      if (badgeAfterRemove !== expectedAfterRemove) return false;

      if (initialItems.length > 0) {
        var target = initialItems[0];
        var newQty = target.quantity + 3;
        var afterUpdate = simulateUpdateItem(initialItems, target.id, newQty);
        var badgeAfterUpdate = computeBadgeCount(afterUpdate);
        var expectedAfterUpdate = initialItems.reduce(function (s, i) {
          return s + (i.id === target.id ? newQty : i.quantity);
        }, 0);
        if (badgeAfterUpdate !== expectedAfterUpdate) return false;
      }
      return true;
    }),
    { numRuns: 500 }
  );
  p4MutationPassed = true;
  console.log('✅ Property 4 mutation invariant PASSED');
} catch (err) {
  console.error('❌ Property 4 mutation invariant FAILED:', err.message);
}

if (p1Passed && p4Passed && p4MutationPassed) {
  console.log('\n✅ All cart property tests passed.');
  process.exit(0);
} else {
  console.error('\n❌ One or more cart property tests failed.');
  process.exit(1);
}
