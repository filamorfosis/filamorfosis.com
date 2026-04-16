/* ═══════════════════════════════════════════════
   FILAMORFOSIS® — Cookie Consent Banner Module
   assets/js/cookie-consent.js
   Plain JS IIFE — no ES modules.
   Auto-initializes on DOMContentLoaded.
   ═══════════════════════════════════════════════ */

(function () {
  'use strict';

  var STORAGE_KEY = 'filamorfosis_cookie_consent';

  // ── Language detection ──────────────────────────
  // Priority: window.currentLang → localStorage.preferredLanguage
  //           → document.documentElement.lang → 'es'
  function getLang() {
    var lang =
      (typeof window !== 'undefined' && window.currentLang) ||
      (typeof localStorage !== 'undefined' && localStorage.getItem('preferredLanguage')) ||
      (typeof document !== 'undefined' && document.documentElement && document.documentElement.lang) ||
      'es';
    return String(lang).toLowerCase().slice(0, 2) || 'es';
  }

  // ── i18n data ───────────────────────────────────
  var COOKIE_I18N = {
    es: {
      title:        'Usamos cookies',
      description:  'Utilizamos cookies para mejorar tu experiencia, analizar el tráfico y personalizar el contenido. Puedes elegir qué cookies aceptar.',
      acceptAll:    'Aceptar todo',
      essentialOnly:'Solo esenciales',
      customize:    'Personalizar',
      savePrefs:    'Guardar preferencias',
      essentials:   'Esenciales',
      analytics:    'Analíticas',
      marketing:    'Marketing',
      privacyLink:  'Política de privacidad',
      ariaLabel:    'Aviso de cookies'
    },
    en: {
      title:        'We use cookies',
      description:  'We use cookies to improve your experience, analyze traffic, and personalize content. You can choose which cookies to accept.',
      acceptAll:    'Accept all',
      essentialOnly:'Essential only',
      customize:    'Customize',
      savePrefs:    'Save preferences',
      essentials:   'Essential',
      analytics:    'Analytics',
      marketing:    'Marketing',
      privacyLink:  'Privacy policy',
      ariaLabel:    'Cookie notice'
    },
    de: {
      title:        'Wir verwenden Cookies',
      description:  'Wir verwenden Cookies, um Ihre Erfahrung zu verbessern, den Datenverkehr zu analysieren und Inhalte zu personalisieren. Sie können wählen, welche Cookies Sie akzeptieren.',
      acceptAll:    'Alle akzeptieren',
      essentialOnly:'Nur essentielle',
      customize:    'Anpassen',
      savePrefs:    'Einstellungen speichern',
      essentials:   'Essentielle',
      analytics:    'Analytische',
      marketing:    'Marketing',
      privacyLink:  'Datenschutzrichtlinie',
      ariaLabel:    'Cookie-Hinweis'
    },
    pt: {
      title:        'Usamos cookies',
      description:  'Usamos cookies para melhorar sua experiência, analisar o tráfego e personalizar o conteúdo. Você pode escolher quais cookies aceitar.',
      acceptAll:    'Aceitar tudo',
      essentialOnly:'Somente essenciais',
      customize:    'Personalizar',
      savePrefs:    'Salvar preferências',
      essentials:   'Essenciais',
      analytics:    'Analíticas',
      marketing:    'Marketing',
      privacyLink:  'Política de privacidade',
      ariaLabel:    'Aviso de cookies'
    },
    ja: {
      title:        'Cookieを使用しています',
      description:  '当サイトでは、ユーザー体験の向上、トラフィックの分析、コンテンツのパーソナライズのためにCookieを使用しています。受け入れるCookieを選択できます。',
      acceptAll:    'すべて受け入れる',
      essentialOnly:'必須のみ',
      customize:    'カスタマイズ',
      savePrefs:    '設定を保存',
      essentials:   '必須',
      analytics:    '分析',
      marketing:    'マーケティング',
      privacyLink:  'プライバシーポリシー',
      ariaLabel:    'Cookieに関するお知らせ'
    },
    zh: {
      title:        '我们使用Cookie',
      description:  '我们使用Cookie来改善您的体验、分析流量并个性化内容。您可以选择接受哪些Cookie。',
      acceptAll:    '全部接受',
      essentialOnly:'仅必要',
      customize:    '自定义',
      savePrefs:    '保存偏好',
      essentials:   '必要',
      analytics:    '分析',
      marketing:    '营销',
      privacyLink:  '隐私政策',
      ariaLabel:    'Cookie通知'
    }
  };

  // ── Storage helpers ─────────────────────────────
  function readConsent() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function writeConsent(obj) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    } catch (e) {
      // localStorage unavailable — silently ignore
    }
  }

  // ── Banner CSS ──────────────────────────────────
  var BANNER_CSS = [
    '#cookie-consent-banner {',
    '  position: fixed;',
    '  bottom: 0;',
    '  left: 0;',
    '  right: 0;',
    '  z-index: var(--z-drawer, 900);',
    '  background: rgba(10, 14, 26, 0.97);',
    '  border-top: 1px solid rgba(255, 255, 255, 0.1);',
    '  padding: var(--space-lg, 24px) var(--space-base, 16px);',
    '  font-family: var(--font-family-body, "Roboto", sans-serif);',
    '  color: var(--color-text-primary, #e2e8f0);',
    '}',
    '#cookie-consent-banner .cc-inner {',
    '  max-width: 720px;',
    '  margin: 0 auto;',
    '  display: flex;',
    '  flex-direction: column;',
    '  gap: var(--space-md, 12px);',
    '}',
    '#cookie-consent-banner .cc-title {',
    '  font-family: var(--font-family-heading, "Poppins", sans-serif);',
    '  font-size: var(--font-size-lg, 1.25rem);',
    '  font-weight: var(--font-weight-semibold, 600);',
    '  margin: 0;',
    '}',
    '#cookie-consent-banner .cc-description {',
    '  font-size: var(--font-size-sm, 0.875rem);',
    '  color: var(--color-text-secondary, #cbd5e1);',
    '  margin: 0;',
    '  line-height: var(--line-height-normal, 1.6);',
    '}',
    '#cookie-consent-banner .cc-description a {',
    '  color: var(--color-accent-purple, #8b5cf6);',
    '  text-decoration: underline;',
    '}',
    '#cookie-consent-banner .cc-description a:focus-visible {',
    '  outline: 2px solid var(--color-accent-purple, #8b5cf6);',
    '  outline-offset: 2px;',
    '}',
    '#cookie-consent-banner .cc-actions {',
    '  display: flex;',
    '  flex-wrap: wrap;',
    '  gap: var(--space-sm, 8px);',
    '  align-items: center;',
    '}',
    /* Customize panel */
    '#cookie-consent-banner .cc-customize-panel {',
    '  display: none;',
    '  flex-direction: column;',
    '  gap: var(--space-md, 12px);',
    '  padding: var(--space-md, 12px);',
    '  background: rgba(255, 255, 255, 0.04);',
    '  border: 1px solid rgba(255, 255, 255, 0.1);',
    '  border-radius: var(--radius-md, 8px);',
    '  animation: slide-down 0.3s ease;',
    '}',
    '#cookie-consent-banner .cc-customize-panel.cc-panel-open {',
    '  display: flex;',
    '}',
    '#cookie-consent-banner .cc-toggle-row {',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: space-between;',
    '  gap: var(--space-sm, 8px);',
    '}',
    '#cookie-consent-banner .cc-toggle-label {',
    '  font-size: var(--font-size-sm, 0.875rem);',
    '  font-weight: var(--font-weight-medium, 500);',
    '}',
    '#cookie-consent-banner .cc-toggle {',
    '  position: relative;',
    '  width: 44px;',
    '  height: 24px;',
    '  flex-shrink: 0;',
    '}',
    '#cookie-consent-banner .cc-toggle input {',
    '  opacity: 0;',
    '  width: 0;',
    '  height: 0;',
    '  position: absolute;',
    '}',
    '#cookie-consent-banner .cc-toggle-track {',
    '  position: absolute;',
    '  inset: 0;',
    '  border-radius: var(--radius-full, 9999px);',
    '  background: rgba(255, 255, 255, 0.15);',
    '  cursor: pointer;',
    '  transition: background 0.2s ease;',
    '}',
    '#cookie-consent-banner .cc-toggle input:checked + .cc-toggle-track {',
    '  background: var(--color-accent-purple, #8b5cf6);',
    '}',
    '#cookie-consent-banner .cc-toggle input:disabled + .cc-toggle-track {',
    '  opacity: 0.6;',
    '  cursor: not-allowed;',
    '}',
    '#cookie-consent-banner .cc-toggle-track::after {',
    '  content: "";',
    '  position: absolute;',
    '  top: 3px;',
    '  left: 3px;',
    '  width: 18px;',
    '  height: 18px;',
    '  border-radius: 50%;',
    '  background: #fff;',
    '  transition: transform 0.2s ease;',
    '}',
    '#cookie-consent-banner .cc-toggle input:checked + .cc-toggle-track::after {',
    '  transform: translateX(20px);',
    '}',
    /* Focus indicators */
    '#cookie-consent-banner button:focus-visible,',
    '#cookie-consent-banner input:focus-visible + .cc-toggle-track {',
    '  outline: 2px solid var(--color-accent-purple, #8b5cf6);',
    '  outline-offset: 2px;',
    '}',
    /* Mobile: full-width stacked buttons */
    '@media (max-width: 768px) {',
    '  #cookie-consent-banner .cc-actions {',
    '    flex-direction: column;',
    '  }',
    '  #cookie-consent-banner .cc-actions button {',
    '    width: 100%;',
    '    justify-content: center;',
    '  }',
    '}'
  ].join('\n');

  // ── Inject styles ────────────────────────────────
  function injectStyles() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('cookie-consent-styles')) return;
    var style = document.createElement('style');
    style.id = 'cookie-consent-styles';
    style.textContent = BANNER_CSS;
    document.head.appendChild(style);
  }

  // ── Remove banner ────────────────────────────────
  function removeBanner() {
    var el = typeof document !== 'undefined' && document.getElementById('cookie-consent-banner');
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  }

  // ── Focus trap ───────────────────────────────────
  function getFocusableElements(container) {
    var selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ');
    var nodes = container.querySelectorAll(selector);
    // Filter to only visible elements
    var result = [];
    for (var i = 0; i < nodes.length; i++) {
      result.push(nodes[i]);
    }
    return result;
  }

  function trapFocus(banner) {
    function onKeyDown(e) {
      if (e.key !== 'Tab') return;
      var focusable = getFocusableElements(banner);
      if (focusable.length === 0) return;
      var first = focusable[0];
      var last  = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    banner.addEventListener('keydown', onKeyDown);
    return onKeyDown; // returned so it can be removed if needed
  }

  // ── Build banner HTML ────────────────────────────
  function buildBanner(i18n) {
    return [
      '<div id="cookie-consent-banner"',
      '     role="dialog"',
      '     aria-modal="false"',
      '     aria-label="' + i18n.ariaLabel + '">',
      '  <div class="cc-inner">',
      '    <h2 class="cc-title">' + i18n.title + '</h2>',
      '    <p class="cc-description">',
      '      ' + i18n.description + ' ',
      '      <a href="#privacy-policy">' + i18n.privacyLink + '</a>',
      '    </p>',
      '    <div class="cc-actions">',
      '      <button type="button" class="btn-primary cc-btn-accept-all">',
      '        ' + i18n.acceptAll,
      '      </button>',
      '      <button type="button" class="btn-secondary cc-btn-essential-only">',
      '        ' + i18n.essentialOnly,
      '      </button>',
      '      <button type="button" class="btn-secondary cc-btn-customize">',
      '        ' + i18n.customize,
      '      </button>',
      '    </div>',
      '    <div class="cc-customize-panel" id="cc-customize-panel" aria-hidden="true">',
      '      <div class="cc-toggle-row">',
      '        <span class="cc-toggle-label">' + i18n.essentials + '</span>',
      '        <label class="cc-toggle">',
      '          <input type="checkbox" id="cc-toggle-essential" checked disabled',
      '                 aria-label="' + i18n.essentials + '">',
      '          <span class="cc-toggle-track"></span>',
      '        </label>',
      '      </div>',
      '      <div class="cc-toggle-row">',
      '        <span class="cc-toggle-label">' + i18n.analytics + '</span>',
      '        <label class="cc-toggle">',
      '          <input type="checkbox" id="cc-toggle-analytics"',
      '                 aria-label="' + i18n.analytics + '">',
      '          <span class="cc-toggle-track"></span>',
      '        </label>',
      '      </div>',
      '      <div class="cc-toggle-row">',
      '        <span class="cc-toggle-label">' + i18n.marketing + '</span>',
      '        <label class="cc-toggle">',
      '          <input type="checkbox" id="cc-toggle-marketing"',
      '                 aria-label="' + i18n.marketing + '">',
      '          <span class="cc-toggle-track"></span>',
      '        </label>',
      '      </div>',
      '      <button type="button" class="btn-primary cc-btn-save-prefs">',
      '        ' + i18n.savePrefs,
      '      </button>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('\n');
  }

  // ── Main init ────────────────────────────────────
  function initCookieConsent() {
    // 4.1 — Read stored consent; skip rendering if already set
    var stored = null;
    try {
      stored = readConsent();
    } catch (e) {
      // localStorage unavailable (private browsing) — render banner every load
      stored = null;
    }
    if (stored !== null) return; // consent already given

    // Avoid double-injection
    if (typeof document !== 'undefined' && document.getElementById('cookie-consent-banner')) return;

    injectStyles();

    var lang = getLang();
    var i18n = COOKIE_I18N[lang] || COOKIE_I18N['es'];

    // 4.2 — Inject banner HTML
    var wrapper = document.createElement('div');
    wrapper.innerHTML = buildBanner(i18n);
    var banner = wrapper.firstElementChild;
    document.body.appendChild(banner);

    // 4.7 — Focus trap
    trapFocus(banner);

    // Move focus into banner on open
    var firstBtn = banner.querySelector('button');
    if (firstBtn) firstBtn.focus();

    // ── 4.3 — "Aceptar todo" ──────────────────────
    var btnAcceptAll = banner.querySelector('.cc-btn-accept-all');
    if (btnAcceptAll) {
      btnAcceptAll.addEventListener('click', function () {
        writeConsent({
          essential: true,
          analytics: true,
          marketing: true,
          timestamp: new Date().toISOString()
        });
        removeBanner();
      });
    }

    // ── 4.4 — "Solo esenciales" ───────────────────
    var btnEssentialOnly = banner.querySelector('.cc-btn-essential-only');
    if (btnEssentialOnly) {
      btnEssentialOnly.addEventListener('click', function () {
        writeConsent({
          essential: true,
          analytics: false,
          marketing: false,
          timestamp: new Date().toISOString()
        });
        removeBanner();
      });
    }

    // ── 4.5 — "Personalizar" panel ────────────────
    var btnCustomize = banner.querySelector('.cc-btn-customize');
    var customizePanel = banner.querySelector('#cc-customize-panel');
    if (btnCustomize && customizePanel) {
      btnCustomize.addEventListener('click', function () {
        var isOpen = customizePanel.classList.contains('cc-panel-open');
        if (isOpen) {
          customizePanel.classList.remove('cc-panel-open');
          customizePanel.setAttribute('aria-hidden', 'true');
        } else {
          customizePanel.classList.add('cc-panel-open');
          customizePanel.setAttribute('aria-hidden', 'false');
          // Focus first interactive element in panel
          var firstInput = customizePanel.querySelector('input:not([disabled]), button');
          if (firstInput) firstInput.focus();
        }
      });
    }

    var btnSavePrefs = banner.querySelector('.cc-btn-save-prefs');
    if (btnSavePrefs) {
      btnSavePrefs.addEventListener('click', function () {
        var analyticsEl = banner.querySelector('#cc-toggle-analytics');
        var marketingEl = banner.querySelector('#cc-toggle-marketing');
        writeConsent({
          essential: true,
          analytics: analyticsEl ? analyticsEl.checked : false,
          marketing: marketingEl ? marketingEl.checked : false,
          timestamp: new Date().toISOString()
        });
        removeBanner();
      });
    }
  }

  // ── Auto-init ────────────────────────────────────
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initCookieConsent);
    } else {
      initCookieConsent();
    }
  }

  // ── Public API (for testing / external use) ──────
  if (typeof window !== 'undefined') {
    window.initCookieConsent = initCookieConsent;
    window.CookieConsent = {
      init:        initCookieConsent,
      getLang:     getLang,
      readConsent: readConsent,
      writeConsent: writeConsent,
      COOKIE_I18N: COOKIE_I18N,
      STORAGE_KEY: STORAGE_KEY
    };
  }

  // ── CommonJS export (for Node.js / test runner) ──
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      initCookieConsent: initCookieConsent,
      getLang:           getLang,
      readConsent:       readConsent,
      writeConsent:      writeConsent,
      COOKIE_I18N:       COOKIE_I18N,
      STORAGE_KEY:       STORAGE_KEY
    };
  }

}());
