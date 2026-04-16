/* ═══════════════════════════════════════════════
   FILAMORFOSIS® — Promotional Banner Module
   assets/js/promo-banner.js
   Plain JS IIFE — no ES modules.
   Call initPromoBanner() after DOM is ready.
   ═══════════════════════════════════════════════ */

(function () {
  'use strict';

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
  var PROMO_I18N = {
    es: {
      message: '🚀 ¡Envío gratis en pedidos mayores a $999 MXN! Usa el código FILA999',
      close:   'Cerrar banner'
    },
    en: {
      message: '🚀 Free shipping on orders over $999 MXN! Use code FILA999',
      close:   'Close banner'
    },
    de: {
      message: '🚀 Kostenloser Versand ab $999 MXN! Code: FILA999',
      close:   'Banner schließen'
    },
    pt: {
      message: '🚀 Frete grátis em pedidos acima de $999 MXN! Use o código FILA999',
      close:   'Fechar banner'
    },
    ja: {
      message: '🚀 $999 MXN以上のご注文で送料無料！コード: FILA999',
      close:   'バナーを閉じる'
    },
    zh: {
      message: '🚀 订单满$999 MXN免运费！使用代码FILA999',
      close:   '关闭横幅'
    }
  };

  // ── Banner CSS ──────────────────────────────────
  var BANNER_CSS = [
    '#promo-banner {',
    '  position: fixed;',
    '  top: 0;',
    '  left: 0;',
    '  right: 0;',
    '  z-index: var(--z-promo-banner, 1100);',
    '  background: var(--color-gradient-brand);',
    '  color: #fff;',
    '  text-align: center;',
    '  padding: 10px 48px 10px 16px;',
    '  font-size: var(--font-size-sm, 0.875rem);',
    '  font-family: var(--font-family-body, Roboto, sans-serif);',
    '}',
    '#promo-banner.promo-banner--hiding {',
    '  animation: toast-out 0.3s ease forwards;',
    '}',
    '#promo-banner__close {',
    '  position: absolute;',
    '  right: 12px;',
    '  top: 50%;',
    '  transform: translateY(-50%);',
    '  background: none;',
    '  border: none;',
    '  color: #fff;',
    '  font-size: 1.2rem;',
    '  cursor: pointer;',
    '  padding: 4px 8px;',
    '}'
  ].join('\n');

  // ── Inject styles ────────────────────────────────
  function injectStyles() {
    if (document.getElementById('promo-banner-styles')) return;
    var style = document.createElement('style');
    style.id = 'promo-banner-styles';
    style.textContent = BANNER_CSS;
    document.head.appendChild(style);
  }

  // ── Update CSS variable on <html> ────────────────
  function setBannerHeightVar(px) {
    document.documentElement.style.setProperty('--promo-banner-height', px);
  }

  // ── Main init ────────────────────────────────────
  function initPromoBanner() {
    // Skip if already dismissed this session
    if (typeof sessionStorage !== 'undefined' &&
        sessionStorage.getItem('promo_dismissed') === '1') {
      return;
    }

    // Avoid double-injection
    if (document.getElementById('promo-banner')) return;

    injectStyles();

    var lang = getLang();
    var i18n = PROMO_I18N[lang] || PROMO_I18N['es'];

    var banner = document.createElement('div');
    banner.id = 'promo-banner';
    banner.setAttribute('role', 'banner');
    banner.setAttribute('aria-label', i18n.close);

    var msgSpan = document.createElement('span');
    msgSpan.textContent = i18n.message;

    var closeBtn = document.createElement('button');
    closeBtn.id = 'promo-banner__close';
    closeBtn.setAttribute('aria-label', i18n.close);
    closeBtn.textContent = '×';

    banner.appendChild(msgSpan);
    banner.appendChild(closeBtn);
    document.body.insertBefore(banner, document.body.firstChild);

    // Set CSS variable to banner height so navbar can shift down
    var height = banner.offsetHeight || 40;
    setBannerHeightVar(height + 'px');

    // ── Close handler ──────────────────────────────
    closeBtn.addEventListener('click', function () {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('promo_dismissed', '1');
      }

      banner.classList.add('promo-banner--hiding');

      // Remove from DOM after animation completes
      var ANIM_DURATION = 300;
      setTimeout(function () {
        if (banner.parentNode) {
          banner.parentNode.removeChild(banner);
        }
        setBannerHeightVar('0px');
      }, ANIM_DURATION);
    });
  }

  // ── Public API ───────────────────────────────────
  if (typeof window !== 'undefined') {
    window.initPromoBanner = initPromoBanner;
    window.PromoBanner = {
      init:        initPromoBanner,
      getLang:     getLang,
      PROMO_I18N:  PROMO_I18N
    };
  }

  // ── CommonJS export (for Node.js / test runner) ──
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      initPromoBanner: initPromoBanner,
      getLang:         getLang,
      PROMO_I18N:      PROMO_I18N
    };
  }

}());
