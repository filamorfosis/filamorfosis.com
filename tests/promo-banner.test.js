/**
 * tests/promo-banner.test.js
 *
 * Unit tests for assets/js/promo-banner.js
 *
 * Uses a plain JS mock — no npm packages required.
 * Run with: node tests/promo-banner.test.js
 */

'use strict';

/* ─────────────────────────────────────────────────
   Minimal DOM mock
   ───────────────────────────────────────────────── */

function createMockDOM() {
  var headChildren = [];
  var bodyChildren = [];

  function makeElement(tag) {
    var el = {
      tagName:     tag.toUpperCase(),
      id:          '',
      className:   '',
      textContent: '',
      innerHTML:   '',
      children:    [],
      attributes:  {},
      style:       { _vars: {}, setProperty: function (k, v) { this._vars[k] = v; } },
      _listeners:  {},
      parentNode:  null,
      offsetHeight: 40,

      setAttribute: function (k, v) { this.attributes[k] = v; },
      getAttribute: function (k)    { return this.attributes[k] !== undefined ? this.attributes[k] : null; },

      appendChild: function (child) {
        child.parentNode = this;
        this.children.push(child);
        return child;
      },

      insertBefore: function (child, ref) {
        child.parentNode = this;
        if (!ref) {
          this.children.push(child);
        } else {
          var idx = this.children.indexOf(ref);
          if (idx === -1) {
            this.children.push(child);
          } else {
            this.children.splice(idx, 0, child);
          }
        }
        if (tag === 'body') bodyChildren.unshift(child);
        return child;
      },

      removeChild: function (child) {
        var idx = this.children.indexOf(child);
        if (idx !== -1) this.children.splice(idx, 1);
        child.parentNode = null;
        // Also remove from bodyChildren if applicable
        var bi = bodyChildren.indexOf(child);
        if (bi !== -1) bodyChildren.splice(bi, 1);
        return child;
      },

      classList: null, // set per-element below

      querySelector: function (sel) {
        return queryOne(this.children, sel);
      },

      addEventListener: function (evt, fn) {
        this._listeners[evt] = this._listeners[evt] || [];
        this._listeners[evt].push(fn);
      },

      click: function () {
        (this._listeners['click'] || []).forEach(function (fn) { fn(); });
      },

      get firstChild() {
        return this.children[0] || null;
      }
    };

    // classList shim
    el.classList = {
      _el: el,
      add: function (cls) {
        var parts = el.className ? el.className.split(' ') : [];
        if (parts.indexOf(cls) === -1) parts.push(cls);
        el.className = parts.join(' ');
      },
      remove: function (cls) {
        var parts = el.className ? el.className.split(' ') : [];
        el.className = parts.filter(function (p) { return p !== cls; }).join(' ');
      },
      contains: function (cls) {
        return (el.className || '').split(' ').indexOf(cls) !== -1;
      }
    };

    return el;
  }

  function queryOne(children, sel) {
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      if (!child) continue;

      if (sel.startsWith('#') && child.id === sel.slice(1)) return child;
      if (sel.startsWith('.')) {
        var cls = sel.slice(1);
        if (child.className && child.className.split(' ').indexOf(cls) !== -1) return child;
      }

      var found = queryOne(child.children || [], sel);
      if (found) return found;
    }
    return null;
  }

  var head = makeElement('head');
  var body = makeElement('body');

  // Override body.appendChild to track bodyChildren
  var _origBodyAppend = body.appendChild.bind(body);
  body.appendChild = function (child) {
    child.parentNode = body;
    body.children.push(child);
    bodyChildren.push(child);
    return child;
  };

  body.querySelector = function (sel) { return queryOne(bodyChildren, sel); };
  head.querySelector = function (sel) { return queryOne(headChildren, sel); };

  head.appendChild = function (child) {
    child.parentNode = head;
    head.children.push(child);
    headChildren.push(child);
    return child;
  };

  var documentEl = makeElement('html');
  documentEl.lang = '';

  var doc = {
    readyState:      'complete',
    documentElement: documentEl,
    head:            head,
    body:            body,
    _listeners:      {},

    getElementById: function (id) {
      return queryOne(headChildren, '#' + id) ||
             queryOne(bodyChildren, '#' + id);
    },

    querySelector: function (sel) {
      return body.querySelector(sel) || head.querySelector(sel);
    },

    createElement: function (tag) {
      return makeElement(tag);
    },

    addEventListener: function (evt, fn) {
      this._listeners[evt] = this._listeners[evt] || [];
      this._listeners[evt].push(fn);
    }
  };

  return doc;
}

/* ─────────────────────────────────────────────────
   Test harness
   ───────────────────────────────────────────────── */

var passed = 0;
var failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log('  ✓ ' + label);
    passed++;
  } else {
    console.error('  ✗ ' + label);
    failed++;
  }
}

function describe(suite, fn) {
  console.log('\n' + suite);
  fn();
}

/* ─────────────────────────────────────────────────
   Load module in a sandboxed global context
   ───────────────────────────────────────────────── */

function loadModule(overrides) {
  var mockDoc = createMockDOM();

  var mockWin = {
    currentLang: overrides.currentLang || undefined
  };

  var mockLS = {
    _store: {},
    getItem:    function (k) { return this._store[k] !== undefined ? this._store[k] : null; },
    setItem:    function (k, v) { this._store[k] = v; },
    removeItem: function (k) { delete this._store[k]; }
  };

  // sessionStorage mock
  var mockSS = {
    _store: {},
    getItem:    function (k) { return this._store[k] !== undefined ? this._store[k] : null; },
    setItem:    function (k, v) { this._store[k] = v; },
    removeItem: function (k) { delete this._store[k]; }
  };

  if (overrides.preferredLanguage) {
    mockLS._store['preferredLanguage'] = overrides.preferredLanguage;
  }
  if (overrides.htmlLang) {
    mockDoc.documentElement.lang = overrides.htmlLang;
  }
  if (overrides.promoDismissed) {
    mockSS._store['promo_dismissed'] = '1';
  }

  // Temporarily replace globals
  var origDoc = global.document;
  var origWin = global.window;
  var origLS  = global.localStorage;
  var origSS  = global.sessionStorage;
  var origMod = global.module;

  global.document      = mockDoc;
  global.window        = mockWin;
  global.localStorage  = mockLS;
  global.sessionStorage = mockSS;
  global.module        = { exports: {} };

  var src = require('fs').readFileSync(
    require('path').join(__dirname, '..', 'assets', 'js', 'promo-banner.js'),
    'utf8'
  );
  // eslint-disable-next-line no-new-func
  new Function('require', 'module', 'exports', src)(
    require,
    global.module,
    global.module.exports
  );

  var exports = global.module.exports;

  // Restore globals
  global.document       = origDoc;
  global.window         = origWin;
  global.localStorage   = origLS;
  global.sessionStorage = origSS;
  global.module         = origMod;

  return { doc: mockDoc, win: mockWin, ss: mockSS, exports: exports };
}

/* ─────────────────────────────────────────────────
   Tests
   ───────────────────────────────────────────────── */

describe('initPromoBanner() — skips rendering when promo_dismissed is set', function () {
  var env = loadModule({ promoDismissed: true, currentLang: 'es' });
  env.exports.initPromoBanner();

  var banner = env.doc.getElementById('promo-banner');
  assert(banner === null, 'banner is NOT injected when sessionStorage.promo_dismissed is set');
});

describe('initPromoBanner() — renders banner when not dismissed', function () {
  var env = loadModule({ currentLang: 'es' });
  env.exports.initPromoBanner();

  var banner = env.doc.getElementById('promo-banner');
  assert(banner !== null, 'banner element is injected into the DOM');

  assert(banner.getAttribute('role') === 'banner', 'banner has role="banner"');

  var ariaLabel = banner.getAttribute('aria-label');
  assert(ariaLabel !== null && ariaLabel.length > 0, 'banner has aria-label');
});

describe('initPromoBanner() — close button sets sessionStorage and removes banner', function () {
  var env = loadModule({ currentLang: 'en' });
  env.exports.initPromoBanner();

  var banner = env.doc.getElementById('promo-banner');
  assert(banner !== null, 'banner is present before close');

  var closeBtn = env.doc.getElementById('promo-banner__close');
  assert(closeBtn !== null, 'close button is present');

  // Click the close button
  closeBtn.click();

  assert(env.ss.getItem('promo_dismissed') === '1',
    'sessionStorage.promo_dismissed is set to "1" after close click');

  assert(banner.classList.contains('promo-banner--hiding'),
    'banner gets promo-banner--hiding class after close click');
});

describe('initPromoBanner() — banner removed from DOM after animation', function () {
  // Use fake timers by patching setTimeout
  var timerCallbacks = [];
  var origSetTimeout = global.setTimeout;
  global.setTimeout = function (fn) { timerCallbacks.push(fn); };

  var env = loadModule({ currentLang: 'en' });
  env.exports.initPromoBanner();

  var closeBtn = env.doc.getElementById('promo-banner__close');
  closeBtn.click();

  // Banner should still be in DOM before timer fires
  var bannerBeforeTimer = env.doc.getElementById('promo-banner');
  assert(bannerBeforeTimer !== null, 'banner still in DOM before animation timeout');

  // Fire the timeout callback
  timerCallbacks.forEach(function (fn) { fn(); });

  var bannerAfterTimer = env.doc.getElementById('promo-banner');
  assert(bannerAfterTimer === null, 'banner removed from DOM after animation timeout');

  // --promo-banner-height should be 0px
  var heightVar = env.doc.documentElement.style._vars['--promo-banner-height'];
  assert(heightVar === '0px', '--promo-banner-height is set to 0px after banner removal');

  global.setTimeout = origSetTimeout;
});

describe('initPromoBanner() — idempotent (no double injection)', function () {
  var env = loadModule({ currentLang: 'es' });
  env.exports.initPromoBanner();
  env.exports.initPromoBanner();

  var count = env.doc.body.children.filter(function (c) {
    return c.id === 'promo-banner';
  }).length;
  assert(count === 1, 'banner is injected only once even if init is called twice');
});

describe('initPromoBanner() — i18n message and close label per language', function () {
  var PROMO_I18N = loadModule({}).exports.PROMO_I18N;
  var langs = ['es', 'en', 'de', 'pt', 'ja', 'zh'];

  langs.forEach(function (lang) {
    var env = loadModule({ currentLang: lang });
    env.exports.initPromoBanner();

    var banner  = env.doc.getElementById('promo-banner');
    var closeBtn = env.doc.getElementById('promo-banner__close');

    assert(banner !== null, 'banner rendered for lang=' + lang);
    assert(
      closeBtn && closeBtn.getAttribute('aria-label') === PROMO_I18N[lang].close,
      'close button aria-label matches i18n for lang=' + lang
    );
  });
});

/* ─────────────────────────────────────────────────
   Summary
   ───────────────────────────────────────────────── */

console.log('\n─────────────────────────────────────');
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) {
  process.exit(1);
} else {
  console.log('All tests passed.');
}
