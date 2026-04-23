/**
 * Filamorfosis Auth Module
 * Handles login/register modals, logout, token refresh scheduling, and navbar state.
 */

(function () {
  'use strict';

  // ── State ──────────────────────────────────────────────────────────────────
  let _currentUser = null;
  let _refreshTimer = null;

  // ── Modal HTML ─────────────────────────────────────────────────────────────
  const MODAL_HTML = `
<div id="auth-modal" class="auth-modal" role="dialog" aria-modal="true" aria-label="Autenticación" style="display:none">
  <div class="auth-modal__backdrop"></div>
  <div class="auth-modal__box">
    <button class="auth-modal__close" aria-label="Cerrar">&times;</button>
    <div class="auth-modal__tabs">
      <button class="auth-tab active" data-tab="login" data-t="auth.login">Iniciar sesión</button>
      <button class="auth-tab" data-tab="register" data-t="auth.register">Registrarse</button>
    </div>

    <!-- Login form -->
    <form id="login-form" class="auth-form" novalidate>
      <div class="auth-form__field">
        <label for="login-email" data-t="auth.email">Correo electrónico</label>
        <input type="email" id="login-email" autocomplete="email" required>
        <span class="auth-form__error" id="login-email-err"></span>
      </div>
      <div class="auth-form__field">
        <label for="login-password" data-t="auth.password">Contraseña</label>
        <input type="password" id="login-password" autocomplete="current-password" required>
        <span class="auth-form__error" id="login-password-err"></span>
      </div>
      <span class="auth-form__error" id="login-general-err"></span>
      <button type="submit" class="btn-primary" data-t="auth.loginBtn">Entrar</button>
      <a href="javascript:void(0)" class="auth-form__link" id="forgot-link" data-t="auth.forgot">¿Olvidé mi contraseña?</a>
    </form>

    <!-- Register form -->
    <form id="register-form" class="auth-form" style="display:none" novalidate>
      <div class="auth-form__row">
        <div class="auth-form__field">
          <label for="reg-first" data-t="auth.firstName">Nombre</label>
          <input type="text" id="reg-first" autocomplete="given-name" required>
          <span class="auth-form__error" id="reg-first-err"></span>
        </div>
        <div class="auth-form__field">
          <label for="reg-last" data-t="auth.lastName">Apellido</label>
          <input type="text" id="reg-last" autocomplete="family-name" required>
          <span class="auth-form__error" id="reg-last-err"></span>
        </div>
      </div>
      <div class="auth-form__field">
        <label for="reg-email" data-t="auth.email">Correo electrónico</label>
        <input type="email" id="reg-email" autocomplete="email" required>
        <span class="auth-form__error" id="reg-email-err"></span>
      </div>
      <div class="auth-form__field">
        <label for="reg-password" data-t="auth.password">Contraseña</label>
        <input type="password" id="reg-password" autocomplete="new-password" required minlength="8">
        <span class="auth-form__hint" data-t="auth.passwordHint">Mínimo 8 caracteres, 1 mayúscula y 1 número</span>
        <span class="auth-form__error" id="reg-password-err"></span>
      </div>
      <span class="auth-form__error" id="reg-general-err"></span>
      <button type="submit" class="btn-primary" data-t="auth.registerBtn">Crear cuenta</button>
    </form>

    <!-- Forgot password form -->
    <form id="forgot-form" class="auth-form" style="display:none" novalidate>
      <p data-t="auth.forgotDesc">Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.</p>
      <div class="auth-form__field">
        <label for="forgot-email" data-t="auth.email">Correo electrónico</label>
        <input type="email" id="forgot-email" required>
        <span class="auth-form__error" id="forgot-email-err"></span>
      </div>
      <span class="auth-form__success" id="forgot-success"></span>
      <button type="submit" class="btn-primary" data-t="auth.sendReset">Enviar enlace</button>
      <a href="javascript:void(0)" class="auth-form__link" id="back-to-login" data-t="auth.backToLogin">← Volver al inicio de sesión</a>
    </form>
  </div>
</div>`;

  // ── Init ───────────────────────────────────────────────────────────────────
  function init() {
    document.body.insertAdjacentHTML('beforeend', MODAL_HTML);
    _bindEvents();
    _restoreSession();
  }

  function _bindEvents() {
    const modal = document.getElementById('auth-modal');

    // Close
    modal.querySelector('.auth-modal__close').addEventListener('click', hideModal);
    modal.querySelector('.auth-modal__backdrop').addEventListener('click', hideModal);

    // Tab switching
    modal.querySelectorAll('.auth-tab').forEach(btn => {
      btn.addEventListener('click', () => _switchTab(btn.dataset.tab));
    });

    // Forgot password link
    document.getElementById('forgot-link').addEventListener('click', e => {
      _showForm('forgot');
    });
    document.getElementById('back-to-login').addEventListener('click', e => {
      _showForm('login');
    });

    // Form submissions
    document.getElementById('login-form').addEventListener('submit', _handleLogin);
    document.getElementById('register-form').addEventListener('submit', _handleRegister);
    document.getElementById('forgot-form').addEventListener('submit', _handleForgot);

    // Navbar login button
    document.addEventListener('click', e => {
      if (e.target.closest('[data-action="show-login"]')) {
        e.preventDefault();
        showModal('login');
      }
      if (e.target.closest('[data-action="logout"]')) {
        e.preventDefault();
        logout();
      }
    });
  }

  function _switchTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    _showForm(tab);
  }

  function _showForm(name) {
    ['login', 'register', 'forgot'].forEach(f => {
      const el = document.getElementById(`${f}-form`);
      if (el) el.style.display = f === name ? '' : 'none';
    });
  }

  // ── Login ──────────────────────────────────────────────────────────────────
  async function _handleLogin(e) {
    e.preventDefault();
    _clearErrors('login');
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email) return _setError('login-email-err', 'Ingresa tu correo.');
    if (!password) return _setError('login-password-err', 'Ingresa tu contraseña.');

    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true;
    try {
      const user = await authLogin({ email, password });
      await _onAuthenticated(user);
      hideModal();
    } catch (err) {
      _setError('login-general-err', err.detail || 'Credenciales incorrectas.');
    } finally {
      btn.disabled = false;
    }
  }

  // ── Register ───────────────────────────────────────────────────────────────
  async function _handleRegister(e) {
    e.preventDefault();
    _clearErrors('reg');
    const firstName = document.getElementById('reg-first').value.trim();
    const lastName = document.getElementById('reg-last').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    let valid = true;
    if (!firstName) { _setError('reg-first-err', 'Requerido.'); valid = false; }
    if (!lastName) { _setError('reg-last-err', 'Requerido.'); valid = false; }
    if (!email) { _setError('reg-email-err', 'Ingresa tu correo.'); valid = false; }
    if (password.length < 8) { _setError('reg-password-err', 'Mínimo 8 caracteres.'); valid = false; }
    else if (!/[A-Z]/.test(password)) { _setError('reg-password-err', 'Debe incluir una mayúscula.'); valid = false; }
    else if (!/\d/.test(password)) { _setError('reg-password-err', 'Debe incluir un número.'); valid = false; }
    if (!valid) return;

    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true;
    try {
      const user = await authRegister({ email, password, firstName, lastName });
      await _onAuthenticated(user);
      hideModal();
    } catch (err) {
      if (err.status === 409) _setError('reg-email-err', 'Este correo ya está registrado.');
      else _setError('reg-general-err', err.detail || 'Error al registrarse.');
    } finally {
      btn.disabled = false;
    }
  }

  // ── Forgot password ────────────────────────────────────────────────────────
  async function _handleForgot(e) {
    e.preventDefault();
    const email = document.getElementById('forgot-email').value.trim();
    if (!email) return _setError('forgot-email-err', 'Ingresa tu correo.');

    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true;
    try {
      await forgotPassword(email);
      document.getElementById('forgot-success').textContent =
        'Si ese correo está registrado, recibirás un enlace en breve.';
    } catch {
      _setError('forgot-email-err', 'Error al enviar. Intenta de nuevo.');
    } finally {
      btn.disabled = false;
    }
  }

  // ── Post-auth ──────────────────────────────────────────────────────────────
  async function _onAuthenticated(user) {
    _currentUser = user;
    _scheduleRefresh();
    _updateNavbar();
    // Trigger cart merge (cart.js listens for this event)
    document.dispatchEvent(new CustomEvent('auth:login', { detail: user }));
  }

  function _scheduleRefresh() {
    if (_refreshTimer) clearTimeout(_refreshTimer);
    // Refresh ~23 hours after login (JWT expires in 24h)
    _refreshTimer = setTimeout(async () => {
      try {
        await authRefresh();
        _scheduleRefresh();
      } catch {
        _currentUser = null;
        _updateNavbar();
      }
    }, 23 * 60 * 60 * 1000);
  }

  function _restoreSession() {
    // Try a silent refresh on page load to restore session from cookie
    authRefresh()
      .then(() => getMe().then(user => {
        _currentUser = user;
        _scheduleRefresh();
        _updateNavbar();
        document.dispatchEvent(new CustomEvent('auth:restored', { detail: user }));
      }))
      .catch(() => { /* not logged in */ });
  }

  function _updateNavbar() {
    const loggedIn = !!_currentUser;
    document.querySelectorAll('[data-auth="logged-in"]').forEach(el => {
      el.style.display = loggedIn ? '' : 'none';
    });
    document.querySelectorAll('[data-auth="logged-out"]').forEach(el => {
      el.style.display = loggedIn ? 'none' : '';
    });
    const nameEl = document.getElementById('navbar-user-name');
    if (nameEl && _currentUser) nameEl.textContent = _currentUser.firstName;
  }

  async function logout() {
    try { await authLogout(); } catch { /* ignore */ }
    _currentUser = null;
    if (_refreshTimer) clearTimeout(_refreshTimer);
    _updateNavbar();
    document.dispatchEvent(new CustomEvent('auth:logout'));
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  function showModal(tab = 'login') {
    const modal = document.getElementById('auth-modal');
    modal.style.display = '';
    _switchTab(tab);
    document.body.style.overflow = 'hidden';
  }

  function hideModal() {
    const modal = document.getElementById('auth-modal');
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }

  function getCurrentUser() { return _currentUser; }

  // ── Helpers ────────────────────────────────────────────────────────────────
  function _setError(id, msg) {
    const el = document.getElementById(id);
    if (el) el.textContent = msg;
  }

  function _clearErrors(prefix) {
    document.querySelectorAll(`[id^="${prefix}-"][id$="-err"]`).forEach(el => { el.textContent = ''; });
    const gen = document.getElementById(`${prefix}-general-err`);
    if (gen) gen.textContent = '';
  }

  // ── Expose ─────────────────────────────────────────────────────────────────
  window.FilamorfosisAuth = { init, showModal, hideModal, logout, getCurrentUser };

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
