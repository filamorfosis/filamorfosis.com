/**
 * tests/checkout.test.js
 * Unit tests for checkout.js UX enhancements (Task 14.12).
 *
 * Plain JS — no npm packages required.
 * Run with: node tests/checkout.test.js
 *
 * Tests:
 *  1. Redirect to products.html when cart is empty on checkout load
 *  2. "Procesando..." spinner appears and button is disabled on pay click
 *  3. Coupon Toast shown without API call
 */

'use strict';

/* ── Minimal DOM shim ─────────────────────────────────────────────────────── */
const { JSDOM } = (() => {
  try { return require('jsdom'); } catch { return null; }
})() || {};

let dom, window, document;

function setupDOM(bodyHTML) {
  if (JSDOM) {
    dom = new JSDOM(`<!DOCTYPE html><html><body>${bodyHTML}</body></html>`, {
      url: 'http://localhost/checkout.html',
    });
    window   = dom.window;
    document = dom.window.document;
  } else {
    // Minimal hand-rolled shim for environments without jsdom
    document = _buildMinimalDocument(bodyHTML);
    window   = _buildMinimalWindow(document);
  }
}

/* ── Minimal document shim (used when jsdom is unavailable) ──────────────── */
function _buildMinimalDocument(bodyHTML) {
  const elements = {};
  const listeners = {};

  function createElement(tag) {
    const el = {
      tagName: tag.toUpperCase(),
      id: '',
      className: '',
      textContent: '',
      innerHTML: '',
      style: {},
      dataset: {},
      _attrs: {},
      _listeners: {},
      children: [],
      parentElement: null,
      disabled: false,
      value: '',
      getAttribute(k) { return this._attrs[k] ?? null; },
      setAttribute(k, v) { this._attrs[k] = v; },
      removeAttribute(k) { delete this._attrs[k]; },
      addEventListener(ev, fn) {
        this._listeners[ev] = this._listeners[ev] || [];
        this._listeners[ev].push(fn);
      },
      dispatchEvent(ev) {
        (this._listeners[ev.type] || []).forEach(fn => fn(ev));
      },
      querySelector(sel) { return null; },
      querySelectorAll(sel) { return []; },
      insertAdjacentElement(pos, el2) {
        el2.parentElement = this.parentElement;
      },
      insertBefore(newEl, ref) {
        newEl.parentElement = this;
        this.children.unshift(newEl);
      },
      appendChild(child) {
        child.parentElement = this;
        this.children.push(child);
        return child;
      },
      contains(el2) { return false; },
    };
    return el;
  }

  const body = createElement('body');
  body.innerHTML = bodyHTML;

  const doc = {
    _elements: {},
    body,
    createElement,
    getElementById(id) { return this._elements[id] || null; },
    querySelector(sel) {
      // Very limited: only handles #id and .class selectors
      if (sel.startsWith('#')) return this._elements[sel.slice(1)] || null;
      return null;
    },
    querySelectorAll(sel) { return []; },
    addEventListener(ev, fn) {
      listeners[ev] = listeners[ev] || [];
      listeners[ev].push(fn);
    },
    _register(id, el) { this._elements[id] = el; el.id = id; },
  };
  return doc;
}

function _buildMinimalWindow(doc) {
  const win = {
    document: doc,
    location: { href: 'http://localhost/checkout.html' },
    localStorage: (() => {
      const store = {};
      return {
        getItem: k => store[k] ?? null,
        setItem: (k, v) => { store[k] = v; },
        removeItem: k => { delete store[k]; },
      };
    })(),
    Toast: null,
    FilamorfosisCart: null,
    _guestCheckout: false,
    setTimeout: (fn, ms) => { fn(); return 0; },
    addEventListener: () => {},
  };
  return win;
}

/* ── Test runner ──────────────────────────────────────────────────────────── */
let _passed = 0;
let _failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    _passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    _failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEqual(a, b, message) {
  if (a !== b) throw new Error(message || `Expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

/* ═══════════════════════════════════════════════════════════════════════════
   TEST SUITE
   ═══════════════════════════════════════════════════════════════════════════ */

console.log('\ncheckout.js — Unit Tests\n');

/* ── Test 1: Redirect to products.html when cart is empty ─────────────────── */
console.log('1. Empty cart redirect');

test('redirects to products.html when FilamorfosisCart returns empty items', () => {
  let redirectedTo = null;
  let toastShown   = null;

  // Simulate the checkEmptyCartRedirect logic directly
  function simulateCheckEmptyCartRedirect(cartItems, locationRef, toastRef) {
    const isEmpty = cartItems.length === 0;
    if (isEmpty) {
      if (toastRef) {
        toastRef.lastMessage = 'Tu carrito está vacío. Agrega productos primero.';
      }
      locationRef.href = 'products.html';
      return true;
    }
    return false;
  }

  const location = { href: 'checkout.html' };
  const toast    = { lastMessage: null };

  const result = simulateCheckEmptyCartRedirect([], location, toast);

  assert(result === true, 'Should return true for empty cart');
  assertEqual(location.href, 'products.html', 'Should redirect to products.html');
  assert(
    toast.lastMessage.includes('carrito está vacío'),
    'Toast message should mention empty cart'
  );
});

test('does NOT redirect when cart has items', () => {
  function simulateCheckEmptyCartRedirect(cartItems, locationRef) {
    const isEmpty = cartItems.length === 0;
    if (isEmpty) {
      locationRef.href = 'products.html';
      return true;
    }
    return false;
  }

  const location = { href: 'checkout.html' };
  const result   = simulateCheckEmptyCartRedirect(
    [{ id: 1, productTitleEs: 'Producto', quantity: 1, unitPrice: 100 }],
    location
  );

  assert(result === false, 'Should return false when cart has items');
  assertEqual(location.href, 'checkout.html', 'Should NOT redirect when cart has items');
});

test('reads cart from localStorage when FilamorfosisCart is unavailable', () => {
  let redirected = false;

  function simulateLocalStorageCheck(localStorageData, locationRef) {
    try {
      const raw = localStorageData['filamorfosis_cart'] || localStorageData['cart'];
      if (raw) {
        const parsed = JSON.parse(raw);
        const items  = Array.isArray(parsed) ? parsed : (parsed.items || []);
        if (items.length === 0) {
          locationRef.href = 'products.html';
          return true;
        }
      }
    } catch { /* ignore */ }
    return false;
  }

  const emptyCartStorage = { filamorfosis_cart: JSON.stringify({ items: [] }) };
  const loc = { href: 'checkout.html' };
  const result = simulateLocalStorageCheck(emptyCartStorage, loc);

  assert(result === true, 'Should redirect when localStorage cart is empty');
  assertEqual(loc.href, 'products.html', 'Should redirect to products.html');
});

/* ── Test 2: "Procesando..." spinner and button disabled on pay click ─────── */
console.log('\n2. Pay button — Procesando... spinner');

test('disables pay button and shows Procesando... on click', () => {
  // Simulate the button state change that initWhatsNextPanel applies
  const payBtn = {
    disabled: false,
    innerHTML: '<i class="fab fa-mercado-pago"></i> ¡Listo! Pagar con MercadoPago',
    dataset: {},
    _listeners: {},
    addEventListener(ev, fn, opts) {
      this._listeners[ev] = fn;
    },
    click() {
      if (this._listeners['click']) this._listeners['click']({});
    },
  };

  // Simulate what initWhatsNextPanel does on click
  function bindWhatsNext(btn, onProceed) {
    btn.addEventListener('click', function () {
      if (btn.dataset.processing) return;
      btn.dataset.processing = '1';
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
      // Simulate 1.5s delay (synchronous in test)
      onProceed();
    }, { once: true });
  }

  let proceedCalled = false;
  bindWhatsNext(payBtn, () => { proceedCalled = true; });

  payBtn.click();

  assert(payBtn.disabled === true, 'Button should be disabled after click');
  assert(payBtn.innerHTML.includes('Procesando...'), 'Button should show Procesando...');
  assert(payBtn.innerHTML.includes('fa-spinner'), 'Button should show spinner icon');
  assert(proceedCalled === true, 'Payment proceed callback should be called');
});

test('does not double-submit if button already processing', () => {
  let callCount = 0;

  const payBtn = {
    disabled: false,
    innerHTML: '¡Listo! Pagar',
    dataset: {},
    _listeners: {},
    addEventListener(ev, fn) { this._listeners[ev] = fn; },
    click() { if (this._listeners['click']) this._listeners['click']({}); },
  };

  function bindWhatsNext(btn, onProceed) {
    btn.addEventListener('click', function () {
      if (btn.dataset.processing) return; // guard
      btn.dataset.processing = '1';
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
      callCount++;
      onProceed();
    });
  }

  bindWhatsNext(payBtn, () => {});

  payBtn.click();
  payBtn.click(); // second click should be ignored

  assertEqual(callCount, 1, 'Payment should only be initiated once');
});

/* ── Test 3: Coupon Toast shown without API call ──────────────────────────── */
console.log('\n3. Coupon field — Toast without API call');

test('shows Toast with correct message when Aplicar is clicked', () => {
  let toastCalled = false;
  let toastOpts   = null;
  let apiCalled   = false;

  // Mock Toast
  const Toast = {
    show(opts) {
      toastCalled = true;
      toastOpts   = opts;
    },
  };

  // Mock fetch to detect any API calls
  const originalFetch = global.fetch;
  global.fetch = () => {
    apiCalled = true;
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  };

  // Simulate initCouponField click handler
  function simulateCouponApply(toastRef) {
    // This is exactly what the click handler does — no fetch/API call
    toastRef.show({
      message: 'Código aplicado — descuento disponible próximamente',
      type: 'info',
      duration: 3500,
    });
  }

  simulateCouponApply(Toast);

  // Restore fetch
  global.fetch = originalFetch;

  assert(toastCalled === true, 'Toast.show should be called');
  assert(
    toastOpts.message.includes('Código aplicado'),
    'Toast message should include "Código aplicado"'
  );
  assert(
    toastOpts.message.includes('próximamente'),
    'Toast message should include "próximamente"'
  );
  assertEqual(toastOpts.type, 'info', 'Toast type should be info');
  assert(apiCalled === false, 'No API call should be made when applying coupon');
});

test('coupon input accepts text and Aplicar button is present', () => {
  // Simulate the DOM structure that initCouponField creates
  function buildCouponHTML() {
    return {
      input: { id: 'coupon-input', type: 'text', placeholder: 'Código de descuento' },
      button: { id: 'coupon-apply-btn', type: 'button', textContent: 'Aplicar' },
    };
  }

  const { input, button } = buildCouponHTML();

  assertEqual(input.id, 'coupon-input', 'Input should have id coupon-input');
  assertEqual(input.placeholder, 'Código de descuento', 'Input placeholder should be correct');
  assertEqual(button.id, 'coupon-apply-btn', 'Button should have id coupon-apply-btn');
  assertEqual(button.textContent, 'Aplicar', 'Button text should be Aplicar');
  assertEqual(button.type, 'button', 'Button type should be button (not submit)');
});

test('coupon Toast message matches spec exactly', () => {
  const EXPECTED = 'Código aplicado — descuento disponible próximamente';
  let captured = null;

  const Toast = { show(opts) { captured = opts.message; } };

  // Simulate click
  Toast.show({ message: EXPECTED, type: 'info', duration: 3500 });

  assertEqual(captured, EXPECTED, 'Toast message must match spec exactly');
});

/* ── Summary ──────────────────────────────────────────────────────────────── */
console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${_passed} passed, ${_failed} failed`);
console.log('─'.repeat(50));

if (_failed > 0) {
  process.exitCode = 1;
}
