/* ═══════════════════════════════════════════════
   FILAMORFOSIS® — Toast Notification Module
   assets/js/toast.js
   Singleton. Sets window.Toast = { show }.
   No ES-module syntax — plain IIFE.
   ═══════════════════════════════════════════════ */

(function (global) {
  'use strict';

  /* ── Inject styles once ─────────────────────── */
  var STYLE_ID = 'filamorfosis-toast-styles';
  if (!document.getElementById(STYLE_ID)) {
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      /* Container — desktop: fixed top-right */
      '#toast-container {',
      '  position: fixed;',
      '  top: 16px;',
      '  right: 16px;',
      '  z-index: var(--z-toast, 700);',
      '  display: flex;',
      '  flex-direction: column;',
      '  gap: 8px;',
      '  max-width: 360px;',
      '  pointer-events: none;',
      '}',
      /* Container — mobile: top-center */
      '@media (max-width: 768px) {',
      '  #toast-container {',
      '    top: 16px;',
      '    left: 50%;',
      '    right: auto;',
      '    transform: translateX(-50%);',
      '    max-width: calc(100vw - 32px);',
      '  }',
      '}',
      /* Individual toast */
      '.toast {',
      '  background: #1e2a3a;',
      '  border: 1px solid rgba(255,255,255,0.1);',
      '  border-radius: 10px;',
      '  padding: 12px 16px;',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 12px;',
      '  min-width: 280px;',
      '  box-shadow: 0 8px 24px rgba(0,0,0,0.4);',
      '  pointer-events: all;',
      '  position: relative;',
      '  animation: toast-in 0.3s ease forwards;',
      '}',
      /* Mobile entry animation override */
      '@media (max-width: 768px) {',
      '  .toast {',
      '    animation-name: toast-in-mobile;',
      '  }',
      '}',
      /* Leaving state — desktop exit */
      '.toast--leaving {',
      '  animation: toast-out 0.3s ease forwards !important;',
      '}',
      '@media (max-width: 768px) {',
      '  .toast--leaving {',
      '    animation: toast-out-mobile 0.3s ease forwards !important;',
      '  }',
      '}',
      /* Type accent borders */
      '.toast--success { border-left: 3px solid #10b981; }',
      '.toast--error   { border-left: 3px solid #ef4444; }',
      '.toast--info    { border-left: 3px solid #3b82f6; }',
      /* Thumbnail */
      '.toast__thumb {',
      '  width: 40px;',
      '  height: 40px;',
      '  border-radius: 6px;',
      '  object-fit: cover;',
      '  flex-shrink: 0;',
      '}',
      /* Body */
      '.toast__body {',
      '  flex: 1;',
      '  min-width: 0;',
      '}',
      '.toast__message {',
      '  color: #e2e8f0;',
      '  font-size:1rem;',
      '  font-family: Roboto, sans-serif;',
      '  line-height: 1.4;',
      '  word-break: break-word;',
      '}',
      /* Close button */
      '.toast__close {',
      '  background: none;',
      '  border: none;',
      '  color: #94a3b8;',
      '  font-size: 1.1rem;',
      '  line-height: 1;',
      '  cursor: pointer;',
      '  padding: 2px 4px;',
      '  flex-shrink: 0;',
      '  transition: color 0.15s ease;',
      '}',
      '.toast__close:hover { color: #e2e8f0; }',
      '.toast__close:focus-visible {',
      '  outline: 2px solid #8b5cf6;',
      '  outline-offset: 2px;',
      '  border-radius: 4px;',
      '}',
    ].join('\n');
    document.head.appendChild(style);
  }

  /* ── Container (lazy-created on first show) ─── */
  var _container = null;

  function getContainer() {
    if (_container && document.body.contains(_container)) return _container;
    _container = document.createElement('div');
    _container.id = 'toast-container';
    _container.setAttribute('role', 'status');
    _container.setAttribute('aria-live', 'polite');
    _container.setAttribute('aria-atomic', 'false');
    document.body.appendChild(_container);
    return _container;
  }

  /* ── FIFO queue ─────────────────────────────── */
  var _queue   = [];   // pending toast options
  var _active  = null; // currently visible toast element

  /**
   * _dismiss(toastEl, onDone)
   * Applies the leaving animation then removes the element.
   * Calls onDone() after the 300ms animation completes.
   */
  function _dismiss(toastEl, onDone) {
    if (!toastEl || toastEl._dismissed) return;
    toastEl._dismissed = true;
    toastEl.classList.add('toast--leaving');
    setTimeout(function () {
      if (toastEl.parentNode) toastEl.parentNode.removeChild(toastEl);
      if (typeof onDone === 'function') onDone();
    }, 300);
  }

  /**
   * _showNext()
   * Dequeues and renders the next toast, if any.
   */
  function _showNext() {
    _active = null;
    if (_queue.length === 0) return;
    var opts = _queue.shift();
    _render(opts);
  }

  /**
   * _render(opts)
   * Builds and inserts a toast element into the container.
   */
  function _render(opts) {
    var message  = opts.message  || '';
    var type     = opts.type     || 'info';
    var thumbnail = opts.thumbnail || null;
    var duration = (typeof opts.duration === 'number') ? opts.duration : 3000;

    var container = getContainer();

    /* Build element */
    var toast = document.createElement('div');
    toast.className = 'toast toast--' + type;
    toast.setAttribute('role', 'alert');

    /* Optional thumbnail */
    if (thumbnail) {
      var img = document.createElement('img');
      img.className = 'toast__thumb';
      img.src = thumbnail;
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
      toast.appendChild(img);
    }

    /* Message body */
    var body = document.createElement('div');
    body.className = 'toast__body';
    var msgEl = document.createElement('p');
    msgEl.className = 'toast__message';
    msgEl.textContent = message;
    body.appendChild(msgEl);
    toast.appendChild(body);

    /* Close button */
    var closeBtn = document.createElement('button');
    closeBtn.className = 'toast__close';
    closeBtn.setAttribute('aria-label', 'Cerrar notificación');
    closeBtn.textContent = '×';
    toast.appendChild(closeBtn);

    container.appendChild(toast);
    _active = toast;

    /* Auto-dismiss timer */
    var timerId = setTimeout(function () {
      _dismiss(toast, _showNext);
    }, duration);

    /* Manual close */
    closeBtn.addEventListener('click', function () {
      clearTimeout(timerId);
      _dismiss(toast, _showNext);
    });
  }

  /* ── Public API ─────────────────────────────── */

  /**
   * Toast.show({ message, type, thumbnail, duration })
   *
   * @param {object} opts
   * @param {string}  opts.message   - Text to display
   * @param {string}  [opts.type]    - 'success' | 'error' | 'info' (default: 'info')
   * @param {string}  [opts.thumbnail] - Image URL for optional thumbnail
   * @param {number}  [opts.duration]  - Auto-dismiss delay in ms (default: 3000)
   */
  function show(opts) {
    if (_active) {
      _queue.push(opts);
    } else {
      _render(opts);
    }
  }

  global.Toast = { show: show };

}(typeof window !== 'undefined' ? window : global));
