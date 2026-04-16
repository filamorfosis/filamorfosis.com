/* ═══════════════════════════════════════════════
   FILAMORFOSIS® — WhatsApp FAB Module
   assets/js/whatsapp-fab.js
   Plain JS IIFE — no ES modules.
   Auto-initializes on DOMContentLoaded.
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
  var WA_I18N = {
    es: {
      message:   'Hola, me gustaría obtener más información sobre sus productos.',
      ariaLabel: 'Contactar por WhatsApp'
    },
    en: {
      message:   'Hello, I would like to get more information about your products.',
      ariaLabel: 'Contact via WhatsApp'
    },
    de: {
      message:   'Hallo, ich möchte mehr Informationen über Ihre Produkte erhalten.',
      ariaLabel: 'Über WhatsApp kontaktieren'
    },
    pt: {
      message:   'Olá, gostaria de obter mais informações sobre seus produtos.',
      ariaLabel: 'Contatar pelo WhatsApp'
    },
    ja: {
      message:   'こんにちは、製品についてもっと詳しく知りたいです。',
      ariaLabel: 'WhatsAppで連絡する'
    },
    zh: {
      message:   '你好，我想了解更多关于您的产品的信息。',
      ariaLabel: '通过WhatsApp联系'
    }
  };

  var WA_PHONE = '13152071586';

  // ── URL builder ─────────────────────────────────
  function buildWaUrl(lang) {
    var i18n = WA_I18N[lang] || WA_I18N['es'];
    return 'https://wa.me/' + WA_PHONE + '?text=' + encodeURIComponent(i18n.message);
  }

  // ── FAB CSS ─────────────────────────────────────
  var FAB_CSS = [
    /* Wrapper — fixed positioning */
    '.whatsapp-fab {',
    '  position: fixed;',
    '  bottom: 24px;',
    '  right: 24px;',
    '  z-index: var(--z-fab, 600);',
    '}',
    /* Circular button */
    '.whatsapp-fab__btn {',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  width: 56px;',
    '  height: 56px;',
    '  border-radius: 50%;',
    '  background: #25d366;',
    '  color: #fff;',
    '  font-size: 1.5rem;',
    '  text-decoration: none;',
    '  box-shadow: 0 4px 16px rgba(37,211,102,0.4);',
    '  transition: transform 0.2s ease, box-shadow 0.2s ease;',
    '  position: relative;',
    '}',
    '.whatsapp-fab__btn:hover {',
    '  transform: scale(1.08);',
    '  box-shadow: 0 6px 24px rgba(37,211,102,0.55);',
    '}',
    /* Pulse ring — absolutely positioned inside the button */
    '.whatsapp-fab__ring {',
    '  position: absolute;',
    '  top: 0;',
    '  left: 0;',
    '  width: 56px;',
    '  height: 56px;',
    '  border-radius: 50%;',
    '  border: 2px solid #25d366;',
    '  animation: wa-pulse 2s ease-out infinite;',
    '  pointer-events: none;',
    '}',
    /* Mobile override — raise above bottom nav */
    '@media (max-width: 768px) {',
    '  .whatsapp-fab {',
    '    bottom: 80px;',
    '  }',
    '}'
  ].join('\n');

  // ── Inject styles ────────────────────────────────
  function injectStyles() {
    if (document.getElementById('whatsapp-fab-styles')) return;
    var style = document.createElement('style');
    style.id = 'whatsapp-fab-styles';
    style.textContent = FAB_CSS;
    document.head.appendChild(style);
  }

  // ── Main init ────────────────────────────────────
  function initWhatsAppFAB() {
    // Avoid double-injection
    if (document.querySelector('.whatsapp-fab')) return;

    injectStyles();

    var lang  = getLang();
    var i18n  = WA_I18N[lang] || WA_I18N['es'];
    var waUrl = buildWaUrl(lang);

    var wrapper = document.createElement('div');
    wrapper.innerHTML = [
      '<div class="whatsapp-fab">',
      '  <button class="whatsapp-fab__btn"',
      '     type="button"',
      '     aria-label="' + i18n.ariaLabel + '">',
      '    <i class="fab fa-whatsapp" aria-hidden="true"></i>',
      '    <span class="whatsapp-fab__ring" aria-hidden="true"></span>',
      '  </button>',
      '</div>'
    ].join('');

    document.body.appendChild(wrapper.firstElementChild);

    // Wire up click: open popup if it exists on the page, otherwise open wa.me directly
    var fabBtn = document.querySelector('.whatsapp-fab__btn');
    if (fabBtn) {
      fabBtn.addEventListener('click', function () {
        var modal = document.getElementById('waModal');
        if (modal) {
          modal.style.display = 'flex';
          var ph = (window.translations && window.translations[getLang()] && window.translations[getLang()].wa_placeholder) || 'Escribe tu mensaje...';
          var msgEl = document.getElementById('waMessage');
          if (msgEl) { msgEl.setAttribute('placeholder', ph); msgEl.value = ''; }
          var closeBtn = document.getElementById('waModalClose');
          if (closeBtn && !closeBtn._waBound) {
            closeBtn._waBound = true;
            closeBtn.addEventListener('click', function () { modal.style.display = 'none'; });
          }
          modal.addEventListener('click', function (e) {
            if (e.target === modal) modal.style.display = 'none';
          });
          var startBtn = document.getElementById('waStartChat');
          if (startBtn && !startBtn._waBound) {
            startBtn._waBound = true;
            startBtn.addEventListener('click', function () {
              var msg = (document.getElementById('waMessage') || {}).value || '';
              if (!msg.trim()) msg = (window.translations && window.translations[getLang()] && window.translations[getLang()].wa_greeting) || '';
              window.open('https://wa.me/' + WA_PHONE + '?text=' + encodeURIComponent(msg), '_blank');
              modal.style.display = 'none';
            });
          }
        } else {
          window.open(waUrl, '_blank');
        }
      });
    }
  }

  // ── Auto-init ────────────────────────────────────
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initWhatsAppFAB);
    } else {
      initWhatsAppFAB();
    }
  }

  // ── Public API (for testing / external use) ──────
  if (typeof window !== 'undefined') {
    window.initWhatsAppFAB = initWhatsAppFAB;
    window.WhatsAppFAB = {
      init:       initWhatsAppFAB,
      getLang:    getLang,
      buildWaUrl: buildWaUrl,
      WA_I18N:    WA_I18N,
      WA_PHONE:   WA_PHONE
    };
  }

  // ── CommonJS export (for Node.js / test runner) ──
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      initWhatsAppFAB: initWhatsAppFAB,
      getLang:         getLang,
      buildWaUrl:      buildWaUrl,
      WA_I18N:         WA_I18N,
      WA_PHONE:        WA_PHONE
    };
  }

}());
