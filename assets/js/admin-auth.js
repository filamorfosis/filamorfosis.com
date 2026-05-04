/**
 * admin-auth.js — MFA login + QR enrollment for admin.html
 *
 * Responsibilities:
 *  - checkAdminSession(): guards the page; shows login modal or TOTP step as needed
 *  - Step 1: email + password → POST /api/v1/auth/admin/login → stores mfaToken in memory
 *  - Step 2: TOTP → if !mfaEnabled calls setup endpoint first (renders QR), then confirm/verify
 *  - Logout: POST /api/v1/auth/logout → redirect to index.html
 *  - Displays admin name in #navbar-user-name after successful auth
 *
 * Requirements: 1.1, 1.2, 1.3, 1.6, 1.7, 1.12
 */

(function (window) {
  'use strict';

  // ── In-memory MFA token (never stored in localStorage / cookies) ──────────
  let _mfaToken = null;
  let _currentUser = null;

  // ── API base (reuses the same base as api.js / admin-api.js) ─────────────
  const _BASE = (() => {
    if (window.FILAMORFOSIS_API_BASE) return window.FILAMORFOSIS_API_BASE;
    return 'https://api.filamorfosis.com/api/v1';
  })();

  async function _fetch(path, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(options.headers || {})
    };
    const res = await fetch(`${_BASE}${path}`, {
      credentials: 'include',
      ...options,
      headers
    });
    if (!res.ok) {
      let err = { status: res.status, detail: res.statusText };
      try { err = { status: res.status, ...await res.json() }; } catch (_) {}
      throw err;
    }
    return res.status === 204 ? null : res.json();
  }

  // ── Modal helpers ─────────────────────────────────────────────────────────
  function _showModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'flex';
  }

  function _hideModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  }

  function _setError(elId, msg) {
    const el = document.getElementById(elId);
    if (el) el.textContent = msg || '';
  }

  // ── QR code renderer (uses qrcode.js if available, or text fallback) ──────
  function _renderQr(containerId, uri, secret) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = ''; // clear spinner

    if (typeof QRCode !== 'undefined') {
      new QRCode(container, {
        text: uri,
        width: 300,
        height: 300,
        colorDark: '#ffffff',
        colorLight: '#0a0e1a'
      });
    } else {
      // Fallback: show the otpauth URI as a copyable block
      container.innerHTML = `
        <div style="text-align:center">
          <p style="font-size:1rem;color:#94a3b8;margin-bottom:8px">
            Copia este enlace en tu app autenticadora:
          </p>
          <textarea readonly onclick="this.select()" style="
            width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(139,92,246,0.3);
            border-radius:8px;color:#a78bfa;font-size:1rem;padding:10px;
            resize:none;height:80px;font-family:monospace">${uri}</textarea>
        </div>`;
    }

    // Always show the raw secret for manual entry
    const secretEl = document.getElementById('mfa-setup-secret');
    if (secretEl) secretEl.textContent = secret;
  }

  // ── Step visibility ───────────────────────────────────────────────────────
  function _showLoginStep(step) {
    const s1 = document.getElementById('login-step-1');
    const s2 = document.getElementById('login-step-2');
    if (s1) s1.style.display = step === 1 ? '' : 'none';
    if (s2) s2.style.display = step === 2 ? '' : 'none';

    // Always reset step 1 button when returning to it
    if (step === 1) {
      const btn = document.querySelector('#login-form-step1 button[type=submit]');
      if (typeof spin === 'function') spin(btn, false);
      _setError('login-err-step1', '');
    }
  }

  // ── Navbar user display ───────────────────────────────────────────────────
  function _updateNavbar(user) {
    const nameEl = document.getElementById('navbar-user-name');
    if (nameEl && user) {
      nameEl.textContent = user.firstName
        ? `${user.firstName} ${user.lastName || ''}`.trim()
        : (user.email || 'Admin');
    }
    // Show logged-in state
    document.querySelectorAll('[data-auth="logged-in"]').forEach(el => el.style.display = '');
    document.querySelectorAll('[data-auth="logged-out"]').forEach(el => el.style.display = 'none');
  }

  // ── checkAdminSession ─────────────────────────────────────────────────────
  /**
   * Called on page load. Determines auth state and either:
   *  a) fires 'auth:login' and updates navbar  — fully authenticated Admin
   *  b) shows login modal step 2              — Admin with session but mfa_verified missing
   *  c) shows login modal step 1              — not authenticated or not Admin
   */
  async function checkAdminSession() {
    try {
      const user = await _fetch('/auth/admin/me');

      if (!user || !Array.isArray(user.roles) || !user.roles.some(r => ['Master', 'UserManagement', 'ProductManagement', 'OrderManagement'].includes(r))) {
        // Logged in, but not an admin role → show access-denied state
        _showAccessDenied();
        return;
      }

      if (!user.mfaVerified) {
        // Admin but MFA claim not present — only go to step 2 if we already
        // have an mfaToken from a fresh password login. Otherwise the session
        // has expired and we need credentials again → step 1.
        if (_mfaToken) {
          _currentUser = user;
          _showModal('login-modal');
          _showLoginStep(2);
          _detectMfaState();
        } else {
          _showModal('login-modal');
          _showLoginStep(1);
        }
        return;
      }

      // Fully authenticated Admin
      _currentUser = user;
      _updateNavbar(user);
      _hideModal('login-modal');
      document.dispatchEvent(new CustomEvent('auth:login', { detail: user }));

    } catch (err) {
      // 401 or any network error → show login
      _showModal('login-modal');
      _showLoginStep(1);
    }
  }

  function _showAccessDenied() {
    const wrap = document.querySelector('.admin-wrap');
    if (wrap) {
      wrap.innerHTML = `
        <div style="text-align:center;padding:80px 24px">
          <i class="fas fa-ban" style="font-size:3rem;color:#f87171;margin-bottom:16px;display:block"></i>
          <h2 style="color:#f87171;margin-bottom:8px">Acceso Denegado</h2>
          <p style="color:#94a3b8">Tu cuenta no tiene permisos de administrador.</p>
          <a href="index.html" class="btn-admin btn-admin-secondary" style="margin-top:20px;display:inline-flex">
            <i class="fas fa-arrow-left"></i>&nbsp; Volver al sitio
          </a>
        </div>`;
    }
  }

  // ── Step 1: email + password ──────────────────────────────────────────────
  function _initLoginStep1() {
    const form = document.getElementById('login-form-step1');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      _setError('login-err-step1', '');
      const btn = form.querySelector('button[type=submit]');
      if (typeof spin === 'function') spin(btn, true);

      const email = form.querySelector('[name=email]').value.trim();
      const password = form.querySelector('[name=password]').value;

      try {
        const res = await _fetch('/auth/admin/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });

        // Store mfaToken in memory only — never in localStorage
        _mfaToken = res.mfaToken;
        
        // Store mfaEnabled from the login response
        _currentUser = { mfaEnabled: res.mfaEnabled };

        if (typeof spin === 'function') spin(btn, false);
        _showLoginStep(2);
        _detectMfaState();

      } catch (err) {
        _setError('login-err-step1', err.detail || 'Credenciales inválidas');
        if (typeof spin === 'function') spin(btn, false);
      }
    });
  }

  // ── Step 2: TOTP (setup → confirm, or verify) ─────────────────────────────
  function _initLoginStep2() {
    const form = document.getElementById('login-form-step2');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      _setError('login-err-step2', '');
      const btn = form.querySelector('button[type=submit]');
      if (typeof spin === 'function') spin(btn, true);

      const totpCode = form.querySelector('[name=totpCode]').value.trim();

      try {
        // Determine whether this is confirm (first-time enrollment) or verify
        const mfaEnabled = form.dataset.mfaEnabled === 'true';
        const endpoint = mfaEnabled ? '/auth/admin/mfa/verify' : '/auth/admin/mfa/confirm';

        await _fetch(endpoint, {
          method: 'POST',
          headers: { Authorization: `Bearer ${_mfaToken}` },
          body: JSON.stringify({ mfaToken: _mfaToken, totpCode })
        });

        // Cookies are now set by the API; clean up and reload
        _mfaToken = null;
        _hideModal('login-modal');
        _hideModal('mfa-setup-modal');
        location.reload();

      } catch (err) {
        _setError('login-err-step2', err.detail || 'Código inválido');
        if (typeof spin === 'function') spin(btn, false);
      }
    });

    // "Setup MFA" trigger — shown when mfaEnabled is false
    const setupBtn = document.getElementById('btn-trigger-mfa-setup');
    if (setupBtn) {
      setupBtn.addEventListener('click', _handleMfaSetup);
    }
  }

  // ── MFA setup: generate secret + show QR ─────────────────────────────────
  async function _handleMfaSetup() {
    _setError('login-err-step2', '');
    const btn = document.getElementById('btn-trigger-mfa-setup');
    if (typeof spin === 'function' && btn) spin(btn, true);

    try {
      const res = await _fetch('/auth/admin/mfa/setup', {
        method: 'POST',
        headers: { Authorization: `Bearer ${_mfaToken}` }
      });

      // Render QR code in the setup modal
      _renderQr('mfa-qr-container', res.qrCodeUri, res.secret);
      _showModal('mfa-setup-modal');

      // Mark the step-2 form as "needs confirm" (not verify)
      const step2Form = document.getElementById('login-form-step2');
      if (step2Form) step2Form.dataset.mfaEnabled = 'false';

    } catch (err) {
      _setError('login-err-step2', err.detail || 'Error al configurar MFA');
    } finally {
      if (typeof spin === 'function' && btn) spin(btn, false);
    }
  }

  // ── MFA setup modal confirm form ──────────────────────────────────────────
  function _initMfaSetupModal() {
    const form = document.getElementById('mfa-setup-confirm-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      _setError('mfa-setup-err', '');
      const btn = form.querySelector('button[type=submit]');
      if (typeof spin === 'function') spin(btn, true);

      const totpCode = form.querySelector('[name=totpCode]').value.trim();

      try {
        await _fetch('/auth/admin/mfa/confirm', {
          method: 'POST',
          headers: { Authorization: `Bearer ${_mfaToken}` },
          body: JSON.stringify({ mfaToken: _mfaToken, totpCode })
        });

        _mfaToken = null;
        _hideModal('mfa-setup-modal');
        _hideModal('login-modal');
        location.reload();

      } catch (err) {
        _setError('mfa-setup-err', err.detail || 'Código inválido');
        if (typeof spin === 'function') spin(btn, false);
      }
    });

    // Close button
    const closeBtn = document.getElementById('btn-close-mfa-setup');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => _hideModal('mfa-setup-modal'));
    }
  }

  // ── Show login modal ──────────────────────────────────────────────────────
  function _initShowLogin() {
    document.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action="show-login"]');
      if (!target) return;
      e.preventDefault();
      _showModal('login-modal');
      _showLoginStep(1);
    });
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  function _initLogout() {
    document.addEventListener('click', async (e) => {
      const target = e.target.closest('[data-action="logout"]');
      if (!target) return;
      e.preventDefault();
      try {
        await _fetch('/auth/admin/logout', { method: 'POST', body: JSON.stringify({}) });
      } catch (_) {
        // proceed regardless
      }
      window.location.href = 'index.html';
    });
  }

  // ── Check whether Admin already has MFA set up ────────────────────────────
  function _detectMfaState() {
    const step2Form = document.getElementById('login-form-step2');
    if (!step2Form) return;

    const hasMfa = _currentUser && _currentUser.mfaEnabled === true;
    step2Form.dataset.mfaEnabled = hasMfa ? 'true' : 'false';

    const setupSection = document.getElementById('mfa-setup-section');
    const verifySection = document.getElementById('mfa-verify-section');
    if (setupSection) setupSection.style.display = hasMfa ? 'none' : '';
    if (verifySection) verifySection.style.display = hasMfa ? '' : 'none';

    // If MFA is not yet set up and we have an mfaToken, auto-trigger setup
    if (!hasMfa && _mfaToken) {
      _handleMfaSetup();
    }
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  function init() {
    _initLoginStep1();
    _initLoginStep2();
    _initMfaSetupModal();
    _initShowLogin();
    _initLogout();
  }

  // Run init when DOM is ready, then check session
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      init();
      checkAdminSession();
    });
  } else {
    init();
    checkAdminSession();
  }

  // ── Public API ────────────────────────────────────────────────────────────
  window.AdminAuth = {
    checkAdminSession,
    getCurrentUser: () => _currentUser
  };

}(window));
