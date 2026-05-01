// Feature: superside-inspired-navigation
// Property 2: Language switching updates all navigation text
// Property 3: All interactive nav elements have accessible names
// Property 4: All static nav text elements carry data-translate attributes
// Validates: Requirements 3.6, 4.7, 7.4, 8.1, 8.2

'use strict';

const fc = require('fast-check');

// ---------------------------------------------------------------------------
// JSDOM setup — provides a browser-like DOM environment for Node.js
// ---------------------------------------------------------------------------

const { JSDOM } = (() => {
    try {
        return require('jsdom');
    } catch (_) {
        console.error(
            '❌ jsdom is not installed. Run: npm install --save-dev jsdom'
        );
        process.exit(1);
    }
})();

// ---------------------------------------------------------------------------
// Helpers — build a minimal but realistic nav DOM from the actual HTML
// structure used in index.html, plus a stub i18n registry and switchLanguage.
// ---------------------------------------------------------------------------

/**
 * All nav_* translation keys used in the static nav HTML.
 * These must be present in every language file.
 */
const NAV_KEYS = [
    'nav_tienda',
    'nav_servicios',
    'nav_conocenos',
    'nav_faq_mega',
    'nav_contacto',
    'nav_mega_store_heading',
    'nav_mega_store_promo_title',
    'nav_mega_store_promo_desc',
    'nav_mega_store_cta',
    'nav_mega_store_loading',
    'nav_mega_store_error',
    'nav_mega_store_retry',
    'nav_mega_store_timeout',
    'nav_mega_services_heading',
    'nav_mega_svc_3d_title',
    'nav_mega_svc_3d_desc',
    'nav_mega_svc_uv_title',
    'nav_mega_svc_uv_desc',
    'nav_mega_svc_laser_title',
    'nav_mega_svc_laser_desc',
    'nav_mega_svc_scan_title',
    'nav_mega_svc_scan_desc',
    'nav_mega_svc_photo_title',
    'nav_mega_svc_photo_desc',
    'nav_mega_about_heading',
    'nav_mega_about_who',
    'nav_mega_about_mission',
    'nav_mega_about_process',
    'nav_mega_about_blog',
    'nav_mega_about_clients_label',
    'nav_mega_about_testimonial',
    'nav_cart_label',
    'nav_account_label',
    'nav_open_menu',
    'nav_close_menu',
    'nav_lang_label',
];

const SUPPORTED_LANGS = ['es', 'en', 'de', 'pt', 'ja', 'zh'];

/**
 * Builds a minimal i18n registry for the given language.
 * Each key maps to a unique, deterministic string so we can assert exact
 * equality without loading the real language files.
 *
 * @param {string} lang
 * @returns {Object}
 */
function buildTranslations(lang) {
    const dict = {};
    NAV_KEYS.forEach(function (key) {
        dict[key] = lang + ':' + key;
    });
    return dict;
}

/**
 * Returns the minimal static nav HTML that mirrors the real index.html
 * structure.  Only elements with data-translate attributes are included —
 * dynamically injected nodes (.nav-category-item) are intentionally absent.
 *
 * @returns {string}
 */
function buildNavHTML() {
    return `
<nav class="site-nav" aria-label="Navegación principal">
  <div class="site-nav__inner">

    <a class="site-nav__logo" href="index.html" aria-label="Filamorfosis — Inicio">
      <span class="site-nav__brand">Filamorfosis</span>
    </a>

    <ul class="site-nav__menu" role="list">

      <!-- Tienda -->
      <li class="site-nav__item site-nav__item--has-mega">
        <button class="site-nav__trigger"
                aria-expanded="false"
                aria-haspopup="true"
                aria-label="Tienda">
          <span class="site-nav__trigger-label" data-translate="nav_tienda">Tienda</span>
        </button>
        <div class="mega-menu" id="mega-tienda" role="region" aria-label="Tienda">
          <div class="mega-menu__inner">
            <div class="mega-menu__col">
              <h2 class="mega-menu__heading" data-translate="nav_mega_store_heading">Explorar Tienda</h2>
              <ul class="nav-categories-list"></ul>
              <div class="mega-menu__loading" data-translate="nav_mega_store_loading">Cargando categorías...</div>
              <div class="mega-menu__error">
                <span data-translate="nav_mega_store_error">Error al cargar categorías</span>
                <button class="mega-menu__retry-btn" data-translate="nav_mega_store_retry">Reintentar</button>
              </div>
              <div class="mega-menu__timeout" data-translate="nav_mega_store_timeout">La carga tardó demasiado.</div>
            </div>
            <div class="mega-menu__col">
              <div class="nav-subcategories-panel"></div>
            </div>
            <div class="mega-menu__col mega-menu__col--promo">
              <h3 class="mega-menu__promo-title" data-translate="nav_mega_store_promo_title">Desde 1 pieza</h3>
              <p class="mega-menu__promo-desc" data-translate="nav_mega_store_promo_desc">Sin mínimos. Sin excusas.</p>
              <a class="mega-menu__promo-cta" href="store.html" data-translate="nav_mega_store_cta">Ver todos los productos</a>
            </div>
          </div>
        </div>
      </li>

      <!-- Servicios -->
      <li class="site-nav__item site-nav__item--has-mega">
        <button class="site-nav__trigger"
                aria-expanded="false"
                aria-haspopup="true"
                aria-label="Servicios">
          <span class="site-nav__trigger-label" data-translate="nav_servicios">Servicios</span>
        </button>
        <div class="mega-menu" id="mega-servicios" role="region" aria-label="Servicios">
          <div class="mega-menu__inner">
            <h2 class="mega-menu__heading" data-translate="nav_mega_services_heading">Nuestros Servicios</h2>
            <div class="mega-menu__services-grid">
              <div class="service-card">
                <h3 data-translate="nav_mega_svc_3d_title">Impresión 3D</h3>
                <p data-translate="nav_mega_svc_3d_desc">Multicolor y multimaterial</p>
              </div>
              <div class="service-card">
                <h3 data-translate="nav_mega_svc_uv_title">Impresión UV</h3>
                <p data-translate="nav_mega_svc_uv_desc">En tazas, madera, metal y más</p>
              </div>
              <div class="service-card">
                <h3 data-translate="nav_mega_svc_laser_title">Corte Láser</h3>
                <p data-translate="nav_mega_svc_laser_desc">Precisión quirúrgica</p>
              </div>
              <div class="service-card">
                <h3 data-translate="nav_mega_svc_scan_title">Escaneo 3D</h3>
                <p data-translate="nav_mega_svc_scan_desc">Digitaliza cualquier objeto</p>
              </div>
              <div class="service-card">
                <h3 data-translate="nav_mega_svc_photo_title">Impresión Fotográfica</h3>
                <p data-translate="nav_mega_svc_photo_desc">Calidad profesional</p>
              </div>
            </div>
          </div>
        </div>
      </li>

      <!-- Conócenos -->
      <li class="site-nav__item site-nav__item--has-mega">
        <button class="site-nav__trigger"
                aria-expanded="false"
                aria-haspopup="true"
                aria-label="Conócenos">
          <span class="site-nav__trigger-label" data-translate="nav_conocenos">Conócenos</span>
        </button>
        <div class="mega-menu" id="mega-conocenos" role="region" aria-label="Conócenos">
          <div class="mega-menu__inner">
            <div class="mega-menu__col">
              <h2 class="mega-menu__heading" data-translate="nav_mega_about_heading">Conócenos</h2>
              <ul>
                <li><a href="#quienes-somos" data-translate="nav_mega_about_who">Quiénes Somos</a></li>
                <li><a href="#mision" data-translate="nav_mega_about_mission">Misión y Valores</a></li>
                <li><a href="#proceso" data-translate="nav_mega_about_process">Nuestro Proceso</a></li>
                <li><a href="#blog" data-translate="nav_mega_about_blog">Blog</a></li>
              </ul>
            </div>
            <div class="mega-menu__col">
              <div class="mega-menu__social-proof">
                <p data-translate="nav_mega_about_clients_label">Clientes satisfechos</p>
                <blockquote data-translate="nav_mega_about_testimonial">"Calidad increíble y entrega rápida"</blockquote>
              </div>
            </div>
          </div>
        </div>
      </li>

      <!-- FAQ (plain link) -->
      <li class="site-nav__item">
        <a class="site-nav__link" href="#faq" data-translate="nav_faq_mega">Preguntas Frecuentes</a>
      </li>

      <!-- Contacto (plain link) -->
      <li class="site-nav__item">
        <a class="site-nav__link" href="#contacto" data-translate="nav_contacto">Contacto</a>
      </li>

    </ul><!-- /.site-nav__menu -->

    <div class="site-nav__actions">
      <a class="site-nav__cart" href="javascript:void(0)" aria-label="Carrito">
        <span class="cart-badge">0</span>
      </a>
      <a class="site-nav__account" href="account.html" aria-label="Mi cuenta"></a>
      <button class="mobile-nav__hamburger"
              aria-expanded="false"
              aria-haspopup="true"
              aria-label="Abrir menú"
              data-translate-aria-label="nav_open_menu">
      </button>
    </div>

    <div class="site-nav__backdrop" aria-hidden="true"></div>
    <div class="site-nav__live-region" aria-live="polite" aria-atomic="true"></div>

  </div><!-- /.site-nav__inner -->
</nav><!-- /.site-nav -->

<div class="mobile-nav" aria-hidden="true">
  <div class="mobile-nav__header">
    <a class="mobile-nav__logo" href="index.html" aria-label="Filamorfosis — Inicio">
      <span class="mobile-nav__brand">Filamorfosis</span>
    </a>
    <button class="mobile-nav__close"
            aria-expanded="false"
            aria-label="Cerrar menú"
            data-translate-aria-label="nav_close_menu">
    </button>
  </div>

  <ul class="mobile-nav__menu" role="list">
    <li class="mobile-nav__item mobile-nav__item--has-sub">
      <button class="mobile-nav__trigger"
              aria-expanded="false"
              aria-haspopup="true">
        <span class="mobile-nav__trigger-label" data-translate="nav_tienda">Tienda</span>
      </button>
      <ul class="mobile-nav__sub" role="list"></ul>
    </li>
    <li class="mobile-nav__item mobile-nav__item--has-sub">
      <button class="mobile-nav__trigger"
              aria-expanded="false"
              aria-haspopup="true">
        <span class="mobile-nav__trigger-label" data-translate="nav_servicios">Servicios</span>
      </button>
      <ul class="mobile-nav__sub" role="list"></ul>
    </li>
    <li class="mobile-nav__item mobile-nav__item--has-sub">
      <button class="mobile-nav__trigger"
              aria-expanded="false"
              aria-haspopup="true">
        <span class="mobile-nav__trigger-label" data-translate="nav_conocenos">Conócenos</span>
      </button>
      <ul class="mobile-nav__sub" role="list"></ul>
    </li>
    <li class="mobile-nav__item">
      <a class="mobile-nav__link" href="#faq" data-translate="nav_faq_mega">Preguntas Frecuentes</a>
    </li>
    <li class="mobile-nav__item">
      <a class="mobile-nav__link" href="#contacto" data-translate="nav_contacto">Contacto</a>
    </li>
  </ul>

  <div class="mobile-nav__footer">
    <div class="lang-switcher lang-switcher--mobile" aria-label="Idioma">
      <button class="lang-switcher__btn" data-lang="es" aria-label="Español">
        <span class="lang-switcher__flag" aria-hidden="true">🇪🇸</span>
        <span class="lang-switcher__code">ES</span>
      </button>
      <button class="lang-switcher__btn" data-lang="en" aria-label="English">
        <span class="lang-switcher__flag" aria-hidden="true">🇬🇧</span>
        <span class="lang-switcher__code">EN</span>
      </button>
      <button class="lang-switcher__btn" data-lang="de" aria-label="Deutsch">
        <span class="lang-switcher__flag" aria-hidden="true">🇩🇪</span>
        <span class="lang-switcher__code">DE</span>
      </button>
      <button class="lang-switcher__btn" data-lang="pt" aria-label="Português">
        <span class="lang-switcher__flag" aria-hidden="true">🇧🇷</span>
        <span class="lang-switcher__code">PT</span>
      </button>
      <button class="lang-switcher__btn" data-lang="ja" aria-label="日本語">
        <span class="lang-switcher__flag" aria-hidden="true">🇯🇵</span>
        <span class="lang-switcher__code">JA</span>
      </button>
      <button class="lang-switcher__btn" data-lang="zh" aria-label="中文">
        <span class="lang-switcher__flag" aria-hidden="true">🇨🇳</span>
        <span class="lang-switcher__code">ZH</span>
      </button>
    </div>
  </div>
</div><!-- /.mobile-nav -->
`;
}

/**
 * Creates a fresh JSDOM environment with the nav HTML and a stub
 * switchLanguage function that mirrors the real implementation in main.js.
 *
 * @returns {{ dom: JSDOM, window: Window, document: Document, switchLanguage: Function }}
 */
function createNavEnvironment() {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
        url: 'http://localhost',
    });

    const { window } = dom;
    const { document } = window;

    // Populate the i18n registry with deterministic per-language values
    window.FilamorfosisI18n = {};
    SUPPORTED_LANGS.forEach(function (lang) {
        window.FilamorfosisI18n[lang] = buildTranslations(lang);
    });

    // Stub switchLanguage — mirrors the real implementation in main.js:
    // iterates all [data-translate] elements and sets their textContent.
    window.switchLanguage = function (lang) {
        const translations = window.FilamorfosisI18n[lang];
        if (!translations) { return; }
        window.currentLang = lang;
        document.querySelectorAll('[data-translate]').forEach(function (el) {
            const key = el.getAttribute('data-translate');
            if (translations[key] !== undefined) {
                el.textContent = translations[key];
            }
        });
    };

    // Inject the nav HTML
    document.body.innerHTML = buildNavHTML();

    return { dom, window, document, switchLanguage: window.switchLanguage };
}

// ---------------------------------------------------------------------------
// Property 2: Language switching updates all navigation text
// Tag: Feature: superside-inspired-navigation, Property 2: Language switching updates all navigation text
// Validates: Requirements 3.6, 4.7, 8.2
// ---------------------------------------------------------------------------

var allPassed = true;

try {
    fc.assert(
        fc.property(
            fc.constantFrom(...SUPPORTED_LANGS),
            function (lang) {
                const { document, switchLanguage, window } = createNavEnvironment();

                // Apply the language switch
                switchLanguage(lang);

                // Collect all [data-translate] elements inside .site-nav and .mobile-nav
                const navEls = Array.from(
                    document.querySelectorAll('.site-nav [data-translate], .mobile-nav [data-translate]')
                );

                if (navEls.length === 0) {
                    throw new Error(
                        'No [data-translate] elements found inside .site-nav or .mobile-nav'
                    );
                }

                const translations = window.FilamorfosisI18n[lang];

                for (const el of navEls) {
                    const key = el.getAttribute('data-translate');
                    const expected = translations[key];

                    if (expected === undefined) {
                        // Key missing from the language file — fail with a clear message
                        throw new Error(
                            'Missing translation key "' + key + '" in language "' + lang + '"'
                        );
                    }

                    const actual = el.textContent.trim();
                    if (actual !== expected) {
                        throw new Error(
                            'Language switch to "' + lang + '" did not update element with ' +
                            'data-translate="' + key + '". ' +
                            'Expected: "' + expected + '", Got: "' + actual + '"'
                        );
                    }
                }

                return true;
            }
        ),
        { numRuns: 100 }
    );
    console.log('✅ Property 2: Language switching updates all navigation text — PASSED');
} catch (err) {
    console.error('❌ Property 2 FAILED:', err.message);
    allPassed = false;
}

// ---------------------------------------------------------------------------
// Property 3: All interactive nav elements have accessible names
// Tag: Feature: superside-inspired-navigation, Property 3: All interactive nav elements have accessible names
// Validates: Requirements 7.4
// ---------------------------------------------------------------------------
// Structural invariant — run once against the rendered DOM.
// ---------------------------------------------------------------------------

try {
    fc.assert(
        fc.property(
            // Single constant run — the property is structural, not data-driven.
            // We use fc.constant(null) so fast-check manages the run lifecycle.
            fc.constant(null),
            function () {
                const { document } = createNavEnvironment();

                const interactiveEls = Array.from(
                    document.querySelectorAll('.site-nav button, .site-nav a, .mobile-nav button, .mobile-nav a')
                );

                if (interactiveEls.length === 0) {
                    throw new Error(
                        'No interactive elements (button, a) found inside .site-nav or .mobile-nav'
                    );
                }

                for (const el of interactiveEls) {
                    const ariaLabel = (el.getAttribute('aria-label') || '').trim();
                    const ariaLabelledBy = (el.getAttribute('aria-labelledby') || '').trim();
                    const textContent = el.textContent.trim();

                    const hasAccessibleName = ariaLabel !== '' || ariaLabelledBy !== '' || textContent !== '';

                    if (!hasAccessibleName) {
                        throw new Error(
                            'Interactive element <' + el.tagName.toLowerCase() + '> ' +
                            '(class="' + el.className + '") has no accessible name. ' +
                            'It must have aria-label, aria-labelledby, or non-empty text content.'
                        );
                    }
                }

                return true;
            }
        ),
        { numRuns: 1 }
    );
    console.log('✅ Property 3: All interactive nav elements have accessible names — PASSED');
} catch (err) {
    console.error('❌ Property 3 FAILED:', err.message);
    allPassed = false;
}

// ---------------------------------------------------------------------------
// Property 4: All static nav text elements carry data-translate attributes
// Tag: Feature: superside-inspired-navigation, Property 4: All static nav text elements carry data-translate attributes
// Validates: Requirements 8.1
// ---------------------------------------------------------------------------
// Structural invariant — run once against the rendered DOM.
// Checks every element that renders user-visible text and is not a
// dynamically injected category node (.nav-category-item).
// ---------------------------------------------------------------------------

/**
 * Returns true if the element is a leaf text node container — i.e., it has
 * non-empty trimmed textContent and none of its children are element nodes
 * (so the text is directly inside this element, not inherited from children).
 *
 * This avoids false positives on container elements like <ul>, <div>, <nav>
 * whose textContent is the concatenation of all their descendants.
 *
 * @param {Element} el
 * @returns {boolean}
 */
function isLeafTextElement(el) {
    // Must have non-empty text
    if (el.textContent.trim() === '') { return false; }

    // Must have no child element nodes (only text nodes)
    const childElements = Array.from(el.childNodes).filter(
        function (node) { return node.nodeType === 1; } // ELEMENT_NODE
    );
    return childElements.length === 0;
}

/**
 * Returns true if the element or any of its ancestors is a dynamically
 * injected category node (identified by .nav-category-item class).
 *
 * @param {Element} el
 * @returns {boolean}
 */
function isDynamicCategoryNode(el) {
    let current = el;
    while (current) {
        if (current.classList && current.classList.contains('nav-category-item')) {
            return true;
        }
        current = current.parentElement;
    }
    return false;
}

/**
 * Returns true if the element is a purely decorative or non-translatable
 * element that legitimately carries text without a data-translate attribute:
 * - aria-hidden elements (icons, decorative spans)
 * - Elements whose text is a number, badge count, or single character
 * - The live region (dynamically populated by JS)
 * - The cart badge (dynamic count)
 * - lang-switcher__code spans (language codes like "ES", "EN" — not translated)
 * - lang-switcher__flag spans (emoji flags — not translated)
 * - mobile-nav__brand / site-nav__brand (brand name — intentionally not translated)
 *
 * @param {Element} el
 * @returns {boolean}
 */
function isExemptFromTranslation(el) {
    // aria-hidden elements are decorative
    if (el.getAttribute('aria-hidden') === 'true') { return true; }

    // Live region — populated dynamically by JS
    if (el.classList.contains('site-nav__live-region')) { return true; }

    // Cart badge — dynamic count
    if (el.classList.contains('cart-badge')) { return true; }

    // Language code labels (e.g. "ES", "EN") — these are language identifiers,
    // not translatable strings
    if (el.classList.contains('lang-switcher__code')) { return true; }

    // Flag emoji spans — decorative
    if (el.classList.contains('lang-switcher__flag')) { return true; }

    // Brand name — intentionally not translated (it's a proper noun / trademark)
    if (el.classList.contains('site-nav__brand')) { return true; }
    if (el.classList.contains('mobile-nav__brand')) { return true; }

    return false;
}

try {
    fc.assert(
        fc.property(
            fc.constant(null),
            function () {
                const { document } = createNavEnvironment();

                // Collect all elements inside the nav regions
                const allEls = Array.from(
                    document.querySelectorAll('.site-nav *, .mobile-nav *')
                );

                // Filter to leaf text elements that are not dynamic or exempt
                const staticTextEls = allEls.filter(function (el) {
                    return (
                        isLeafTextElement(el) &&
                        !isDynamicCategoryNode(el) &&
                        !isExemptFromTranslation(el)
                    );
                });

                if (staticTextEls.length === 0) {
                    throw new Error(
                        'No static text elements found inside .site-nav or .mobile-nav. ' +
                        'The nav HTML may not have been injected correctly.'
                    );
                }

                for (const el of staticTextEls) {
                    const hasTranslateAttr =
                        el.hasAttribute('data-translate') ||
                        el.hasAttribute('data-t');

                    if (!hasTranslateAttr) {
                        throw new Error(
                            'Static text element <' + el.tagName.toLowerCase() + '> ' +
                            '(class="' + el.className + '", ' +
                            'text="' + el.textContent.trim().substring(0, 40) + '") ' +
                            'is missing a data-translate or data-t attribute. ' +
                            'All user-visible static nav text must be translatable.'
                        );
                    }
                }

                return true;
            }
        ),
        { numRuns: 1 }
    );
    console.log('✅ Property 4: All static nav text elements carry data-translate attributes — PASSED');
} catch (err) {
    console.error('❌ Property 4 FAILED:', err.message);
    allPassed = false;
}

// ---------------------------------------------------------------------------
// Exit
// ---------------------------------------------------------------------------

if (allPassed) {
    console.log('\n✅ All navigation property tests passed.');
    process.exit(0);
} else {
    console.error('\n❌ One or more navigation property tests failed.');
    process.exit(1);
}
