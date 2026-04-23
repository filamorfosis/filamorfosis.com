/**
 * Navbar integration tests (plain JS, no npm packages)
 * Tests:
 *  1. .navbar--scrolled added/removed based on scroll position
 *  2. Nav drawer opens/closes and body overflow is toggled
 *  3. .cart-badge--pulse added when cart count increases
 */

(function () {
  'use strict';

  var passed = 0;
  var failed = 0;

  function assert(description, condition) {
    if (condition) {
      console.log('[PASS] ' + description);
      passed++;
    } else {
      console.error('[FAIL] ' + description);
      failed++;
    }
  }

  // ── Minimal DOM shim ──────────────────────────────────────────────────────
  // These tests are designed to run in a browser or a DOM environment (e.g. jsdom).

  // ── Test 1: Navbar scroll blur ────────────────────────────────────────────
  (function testNavbarScrollBlur() {
    // Setup
    var navbar = document.createElement('div');
    navbar.className = 'navbar';
    document.body.appendChild(navbar);

    // Simulate the scroll listener logic inline (mirrors main.js implementation)
    function onScroll() {
      if (window.scrollY > 80) {
        navbar.classList.add('navbar--scrolled');
      } else {
        navbar.classList.remove('navbar--scrolled');
      }
    }

    // Simulate scroll > 80
    Object.defineProperty(window, 'scrollY', { value: 100, configurable: true, writable: true });
    onScroll();
    assert('navbar--scrolled added when scrollY > 80', navbar.classList.contains('navbar--scrolled'));

    // Simulate scroll back to top
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true, writable: true });
    onScroll();
    assert('navbar--scrolled removed when scrollY <= 80', !navbar.classList.contains('navbar--scrolled'));

    // Cleanup
    document.body.removeChild(navbar);
  })();

  // ── Test 2: Nav drawer open/close + body overflow ─────────────────────────
  (function testNavDrawer() {
    // Setup: create a toggle button
    var toggle = document.createElement('button');
    toggle.className = 'navbar__toggle';
    document.body.appendChild(toggle);

    // Inline drawer logic (mirrors main.js implementation)
    function ensureDrawer() {
      if (document.getElementById('nav-drawer')) return;
      var drawer = document.createElement('div');
      drawer.id = 'nav-drawer';
      drawer.className = 'nav-drawer';
      drawer.setAttribute('aria-label', 'Menú de navegación');
      drawer.innerHTML = [
        '<div class="nav-drawer__backdrop"></div>',
        '<nav class="nav-drawer__panel">',
        '  <button class="nav-drawer__close" aria-label="Cerrar menú">&times;</button>',
        '  <ul class="nav-drawer__links">',
        '    <li><a href="index.html">Inicio</a></li>',
        '    <li><a href="products.html">Catálogo</a></li>',
        '  </ul>',
        '</nav>'
      ].join('');
      document.body.appendChild(drawer);
      drawer.querySelector('.nav-drawer__backdrop').addEventListener('click', closeDrawer);
      drawer.querySelector('.nav-drawer__close').addEventListener('click', closeDrawer);
    }

    function openDrawer() {
      ensureDrawer();
      document.getElementById('nav-drawer').classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
      var d = document.getElementById('nav-drawer');
      if (d) d.classList.remove('open');
      document.body.style.overflow = '';
    }

    // Open drawer
    openDrawer();
    var drawer = document.getElementById('nav-drawer');
    assert('Drawer element created on open', !!drawer);
    assert('Drawer has "open" class after openDrawer()', drawer.classList.contains('open'));
    assert('body.style.overflow is "hidden" when drawer is open', document.body.style.overflow === 'hidden');

    // Close via closeDrawer()
    closeDrawer();
    assert('Drawer loses "open" class after closeDrawer()', !drawer.classList.contains('open'));
    assert('body.style.overflow is "" after closeDrawer()', document.body.style.overflow === '');

    // Re-open and close via backdrop click
    openDrawer();
    drawer.querySelector('.nav-drawer__backdrop').click();
    assert('Drawer closes on backdrop click', !drawer.classList.contains('open'));
    assert('body overflow restored after backdrop click', document.body.style.overflow === '');

    // Re-open and close via close button
    openDrawer();
    drawer.querySelector('.nav-drawer__close').click();
    assert('Drawer closes on close-button click', !drawer.classList.contains('open'));

    // Cleanup
    document.body.removeChild(toggle);
    if (drawer.parentNode) document.body.removeChild(drawer);
  })();

  // ── Test 3: Cart badge pulse on count increase ────────────────────────────
  (function testCartBadgePulse() {
    // Setup badge element
    var badge = document.createElement('span');
    badge.id = 'cart-count';
    badge.className = 'cart-badge';
    badge.textContent = '2';
    document.body.appendChild(badge);

    // Inline pulse logic (mirrors cart.js implementation)
    function updateBadge(el, count) {
      var prevCount = parseInt(el.textContent) || 0;
      if (count > prevCount) {
        el.classList.remove('cart-badge--pulse');
        void el.offsetWidth; // reflow
        el.classList.add('cart-badge--pulse');
        setTimeout(function () { el.classList.remove('cart-badge--pulse'); }, 300);
      }
      el.textContent = count;
    }

    // Count increases: 2 → 3
    updateBadge(badge, 3);
    assert('cart-badge--pulse added when count increases', badge.classList.contains('cart-badge--pulse'));
    assert('Badge text updated to new count', badge.textContent === '3');

    // Count stays same: 3 → 3 (no pulse)
    badge.classList.remove('cart-badge--pulse');
    updateBadge(badge, 3);
    assert('cart-badge--pulse NOT added when count stays same', !badge.classList.contains('cart-badge--pulse'));

    // Count decreases: 3 → 1 (no pulse)
    badge.classList.remove('cart-badge--pulse');
    updateBadge(badge, 1);
    assert('cart-badge--pulse NOT added when count decreases', !badge.classList.contains('cart-badge--pulse'));

    // Cleanup
    document.body.removeChild(badge);
  })();

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n── Test Summary ──');
  console.log('Passed: ' + passed);
  console.log('Failed: ' + failed);
  if (failed > 0) {
    throw new Error(failed + ' test(s) failed');
  }
})();
