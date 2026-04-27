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
  // Close button labels per language (not in global i18n)
  var PROMO_CLOSE_I18N = {
    es: 'Cerrar banner',
    en: 'Close banner',
    de: 'Banner schließen',
    pt: 'Fechar banner',
    ja: 'バナーを閉じる',
    zh: '关闭横幅'
  };

  // Fallback messages used only when global i18n is not yet loaded
  var PROMO_I18N = {
    es: {
      message: '🎉 Envío gratis en pedidos mayores a $500 MXN',
      close:   'Cerrar banner'
    },
    en: {
      message: '🎉 Free shipping on orders over $500 MXN',
      close:   'Close banner'
    },
    de: {
      message: '🎉 Kostenloser Versand bei Bestellungen über $500 MXN',
      close:   'Banner schließen'
    },
    pt: {
      message: '🎉 Frete grátis em pedidos acima de $500 MXN',
      close:   'Fechar banner'
    },
    ja: {
      message: '🎉 $500 MXN以上のご注文で送料無料',
      close:   'バナーを閉じる'
    },
    zh: {
      message: '🎉 订单满$500 MXN免运费',
      close:   '关闭横幅'
    }
  };

  // ── Get promo message from global i18n or fallback ──
  function getPromoMessage(lang) {
    var globalI18n = (typeof window !== 'undefined' && window.FilamorfosisI18n) || {};
    var tl = globalI18n[lang] || globalI18n['es'] || {};
    if (tl['promo_banner_text']) {
      return tl['promo_banner_text'];
    }
    var fallback = PROMO_I18N[lang] || PROMO_I18N['es'];
    return fallback.message;
  }

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
    '  padding: 10px 16px;',
    '  font-size: 1rem;',
    '  font-family: var(--font-family-body, Roboto, sans-serif);',
    '}',
    '#promo-banner.promo-banner--hiding {',
    '  animation: toast-out 0.3s ease forwards;',
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
    // Avoid double-injection
    if (document.getElementById('promo-banner')) return;

    injectStyles();

    var lang = getLang();
    var message = getPromoMessage(lang);

    var banner = document.createElement('div');
    banner.id = 'promo-banner';
    banner.setAttribute('role', 'banner');
    banner.setAttribute('aria-label', 'Promotional banner');

    var msgSpan = document.createElement('span');
    msgSpan.setAttribute('data-t', 'promo_banner_text');
    msgSpan.textContent = message;

    banner.appendChild(msgSpan);
    document.body.insertBefore(banner, document.body.firstChild);

    // Set CSS variable to banner height so navbar can shift down
    var height = banner.offsetHeight || 40;
    setBannerHeightVar(height + 'px');
  }

  // ── Public API ───────────────────────────────────
  if (typeof window !== 'undefined') {
    window.initPromoBanner = initPromoBanner;
    window.PromoBanner = {
      init:            initPromoBanner,
      getLang:         getLang,
      PROMO_I18N:      PROMO_I18N,
      getPromoMessage: getPromoMessage
    };
  }

  // ── CommonJS export (for Node.js / test runner) ──
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      initPromoBanner: initPromoBanner,
      getLang:         getLang,
      PROMO_I18N:      PROMO_I18N,
      getPromoMessage: getPromoMessage
    };
  }

}());
