/**
 * tests/whatsapp-fab.test.js
 *
 * Unit tests for assets/js/whatsapp-fab.js
 *
 * Uses a plain JS jsdom-style mock — no npm packages required.
 * Run with: node tests/whatsapp-fab.test.js
 */

'use strict';

/* ─────────────────────────────────────────────────
   Minimal DOM mock (jsdom-style, no dependencies)
   ───────────────────────────────────────────────── */

function createMockDOM() {
  var headChildren = [];
  var bodyChildren = [];

  function makeElement(tag) {
    var el = {
      tagName:    tag.toUpperCase(),
      id:         '',
      className:  '',
      textContent: '',
      innerHTML:  '',
      children:   [],
      attributes: {},
      style:      {},
      _listeners: {},

      setAttribute: function (k, v) { this.attributes[k] = v; },
      getAttribute: function (k)    { return this.attributes[k] || null; },

      appendChild: function (child) {
        this.children.push(child);
        if (tag === 'body') bodyChildren.push(child);
        if (tag === 'head') headChildren.push(child);
        return child;
      },

      querySelector: function (sel) {
        return queryOne(this.children, sel);
      },

      addEventListener: function (evt, fn) {
        this._listeners[evt] = this._listeners[evt] || [];
        this._listeners[evt].push(fn);
      },

      click: function () {
        var handlers = this._listeners['click'] || [];
        handlers.forEach(function (fn) { fn(); });
      },

      get firstElementChild() {
        return this.children[0] || null;
      }
    };
    return el;
  }

  /* Parses the minimal HTML strings produced by initWhatsAppFAB */
  function parseHTML(html) {
    // Extract the outer .whatsapp-fab div and its inner <a>
    var fabDiv = makeElement('div');
    fabDiv.className = 'whatsapp-fab';

    var hrefMatch    = html.match(/href="([^"]+)"/);
    var labelMatch   = html.match(/aria-label="([^"]+)"/);
    var targetMatch  = html.match(/target="([^"]+)"/);

    var anchor = makeElement('a');
    anchor.className = 'whatsapp-fab__btn';
    if (hrefMatch)   anchor.attributes['href']       = hrefMatch[1];
    if (labelMatch)  anchor.attributes['aria-label'] = labelMatch[1];
    if (targetMatch) anchor.attributes['target']     = targetMatch[1];

    var ring = makeElement('span');
    ring.className = 'whatsapp-fab__ring';
    anchor.children.push(ring);

    fabDiv.children.push(anchor);
    return fabDiv;
  }

  /* Simple selector matching for class and id */
  function queryOne(children, sel) {
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      if (!child) continue;

      if (sel.startsWith('.') && child.className &&
          child.className.split(' ').indexOf(sel.slice(1)) !== -1) {
        return child;
      }
      if (sel.startsWith('#') && child.id === sel.slice(1)) {
        return child;
      }

      // Recurse
      var found = queryOne(child.children || [], sel);
      if (found) return found;
    }
    return null;
  }

  var head = makeElement('head');
  var body = makeElement('body');

  body.querySelector = function (sel) {
    return queryOne(bodyChildren, sel);
  };
  head.querySelector = function (sel) {
    return queryOne(headChildren, sel);
  };

  /* Override appendChild on body to also parse innerHTML strings */
  var _origBodyAppend = body.appendChild.bind(body);
  body.appendChild = function (child) {
    if (child && child.innerHTML) {
      var parsed = parseHTML(child.innerHTML);
      _origBodyAppend(parsed);
      return parsed;
    }
    return _origBodyAppend(child);
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
  // Build a fresh mock environment
  var mockDoc = createMockDOM();
  var mockWin = {
    currentLang: overrides.currentLang || undefined
  };
  var mockLS  = {
    _store: {},
    getItem:    function (k) { return this._store[k] || null; },
    setItem:    function (k, v) { this._store[k] = v; },
    removeItem: function (k) { delete this._store[k]; }
  };

  if (overrides.preferredLanguage) {
    mockLS._store['preferredLanguage'] = overrides.preferredLanguage;
  }
  if (overrides.htmlLang) {
    mockDoc.documentElement.lang = overrides.htmlLang;
  }

  // Temporarily replace globals
  var origDoc = global.document;
  var origWin = global.window;
  var origLS  = global.localStorage;
  var origMod = global.module;

  global.document   = mockDoc;
  global.window     = mockWin;
  global.localStorage = mockLS;
  // Allow CommonJS export
  global.module = { exports: {} };

  // Re-execute the IIFE source in this global context
  var src = require('fs').readFileSync(
    require('path').join(__dirname, '..', 'assets', 'js', 'whatsapp-fab.js'),
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
  global.document   = origDoc;
  global.window     = origWin;
  global.localStorage = origLS;
  global.module     = origMod;

  return { doc: mockDoc, win: mockWin, exports: exports };
}

/* ─────────────────────────────────────────────────
   Tests
   ───────────────────────────────────────────────── */

describe('getLang() — language detection priority', function () {
  var env;

  env = loadModule({ currentLang: 'en' });
  assert(env.exports.getLang() === 'en', 'returns window.currentLang when set');

  env = loadModule({ preferredLanguage: 'de' });
  assert(env.exports.getLang() === 'de', 'falls back to localStorage.preferredLanguage');

  env = loadModule({ htmlLang: 'pt' });
  assert(env.exports.getLang() === 'pt', 'falls back to document.documentElement.lang');

  env = loadModule({});
  assert(env.exports.getLang() === 'es', 'defaults to "es" when nothing is set');
});

describe('buildWaUrl() — URL construction', function () {
  var env = loadModule({});
  var WA_I18N = env.exports.WA_I18N;
  var PHONE   = env.exports.WA_PHONE;

  ['es', 'en', 'de', 'pt', 'ja', 'zh'].forEach(function (lang) {
    var url = env.exports.buildWaUrl(lang);
    var expected = 'https://wa.me/' + PHONE + '?text=' +
                   encodeURIComponent(WA_I18N[lang].message);
    assert(url === expected, 'correct wa.me URL for lang=' + lang);
  });

  // Unknown lang falls back to 'es'
  var fallback = env.exports.buildWaUrl('xx');
  var expectedFallback = 'https://wa.me/' + PHONE + '?text=' +
                         encodeURIComponent(WA_I18N['es'].message);
  assert(fallback === expectedFallback, 'unknown lang falls back to es message');
});

describe('initWhatsAppFAB() — DOM injection', function () {
  var env = loadModule({ currentLang: 'es' });
  env.exports.initWhatsAppFAB();

  var fab = env.doc.body.querySelector('.whatsapp-fab');
  assert(fab !== null, 'injects .whatsapp-fab element into <body>');

  var btn = env.doc.body.querySelector('.whatsapp-fab__btn');
  assert(btn !== null, 'injects .whatsapp-fab__btn anchor');

  var ring = env.doc.body.querySelector('.whatsapp-fab__ring');
  assert(ring !== null, 'injects .whatsapp-fab__ring pulse element');
});

describe('aria-label — matches current language', function () {
  var langs = {
    es: 'Contactar por WhatsApp',
    en: 'Contact via WhatsApp',
    de: 'Über WhatsApp kontaktieren',
    pt: 'Contatar pelo WhatsApp',
    ja: 'WhatsAppで連絡する',
    zh: '通过WhatsApp联系'
  };

  Object.keys(langs).forEach(function (lang) {
    var env = loadModule({ currentLang: lang });
    env.exports.initWhatsAppFAB();

    var btn = env.doc.body.querySelector('.whatsapp-fab__btn');
    var label = btn ? btn.getAttribute('aria-label') : null;
    assert(label === langs[lang],
      'aria-label is "' + langs[lang] + '" for lang=' + lang);
  });
});

describe('click — opens correct wa.me URL with language-appropriate message', function () {
  var cases = [
    { lang: 'es', msg: 'Hola, me gustaría obtener más información sobre sus productos.' },
    { lang: 'en', msg: 'Hello, I would like to get more information about your products.' },
    { lang: 'de', msg: 'Hallo, ich möchte mehr Informationen über Ihre Produkte erhalten.' },
    { lang: 'pt', msg: 'Olá, gostaria de obter mais informações sobre seus produtos.' },
    { lang: 'ja', msg: 'こんにちは、製品についてもっと詳しく知りたいです。' },
    { lang: 'zh', msg: '你好，我想了解更多关于您的产品的信息。' }
  ];

  cases.forEach(function (tc) {
    var env = loadModule({ currentLang: tc.lang });
    env.exports.initWhatsAppFAB();

    var btn = env.doc.body.querySelector('.whatsapp-fab__btn');
    var href = btn ? btn.getAttribute('href') : '';
    var expectedUrl = 'https://wa.me/13152071586?text=' +
                      encodeURIComponent(tc.msg);

    assert(href === expectedUrl,
      'href contains correct encoded message for lang=' + tc.lang);

    var target = btn ? btn.getAttribute('target') : '';
    assert(target === '_blank',
      'opens in new tab (target=_blank) for lang=' + tc.lang);
  });
});

describe('initWhatsAppFAB() — idempotent (no double injection)', function () {
  var env = loadModule({ currentLang: 'en' });
  env.exports.initWhatsAppFAB();
  env.exports.initWhatsAppFAB(); // second call should be a no-op

  // Count .whatsapp-fab elements in body children
  var count = env.doc.body.children.filter(function (c) {
    return c.className && c.className.split(' ').indexOf('whatsapp-fab') !== -1;
  }).length;
  assert(count === 1, 'FAB is injected only once even if init is called twice');
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
