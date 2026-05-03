/**
 * Filamorfosis API Client
 * Central fetch wrapper with cookie auth, CSRF header, 401 refresh, and error normalization.
 */

const API_BASE = (() => {
  // Swap per environment — override window.FILAMORFOSIS_API_BASE before loading this file
  if (typeof window !== 'undefined' && window.FILAMORFOSIS_API_BASE) {
    return window.FILAMORFOSIS_API_BASE;
  }
  return 'https://api.filamorfosis.com/api/v1';
})();

let _refreshing = null;

async function tryRefresh() {
  if (_refreshing) return _refreshing;
  _refreshing = apiFetch('/auth/refresh', { method: 'POST', body: JSON.stringify({}) })
    .catch(() => { throw new Error('session_expired'); })
    .finally(() => { _refreshing = null; });
  return _refreshing;
}

// Public endpoints — no auth required, skip 401 refresh
const PUBLIC_PATHS = ['/categories', '/processes', '/products'];

async function apiFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...(options.headers || {})
  };

  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...options,
    headers
  });

  // Refresh endpoint returning 401 just means no active session — not an error worth retrying
  if (res.status === 401 && path === '/auth/refresh') {
    throw { status: 401, detail: 'no_session' };
  }

  const isPublic = PUBLIC_PATHS.some(p => path === p || path.startsWith(p + '?') || path.startsWith(p + '/'));

  if (res.status === 401 && !isPublic && path !== '/auth/login') {
    try {
      await tryRefresh();
      const retry = await fetch(`${API_BASE}${path}`, {
        credentials: 'include',
        ...options,
        headers
      });
      if (!retry.ok) throw await _parseError(retry);
      return retry.status === 204 ? null : retry.json();
    } catch {
      throw { status: 401, detail: 'Session expired. Please log in again.' };
    }
  }

  if (!res.ok) throw await _parseError(res);
  return res.status === 204 ? null : res.json();
}

async function _parseError(res) {
  try {
    const body = await res.json();
    return { status: res.status, ...body };
  } catch {
    return { status: res.status, detail: res.statusText };
  }
}

// ── Named helpers ─────────────────────────────────────────────────────────────

window.getProcesses = () => apiFetch('/processes');
window.getCategories = () => apiFetch('/categories');
window.getProducts = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/products${qs ? '?' + qs : ''}`);
};
window.getProduct = (id) => apiFetch(`/products/${id}`);

window.getCart = () => apiFetch('/cart');
window.addToCart = (item) => apiFetch('/cart/items', { method: 'POST', body: JSON.stringify(item) });
window.updateCartItem = (id, qty) => apiFetch(`/cart/items/${id}`, { method: 'PUT', body: JSON.stringify({ quantity: qty }) });
window.removeCartItem = (id) => apiFetch(`/cart/items/${id}`, { method: 'DELETE' });
window.clearCart = () => apiFetch('/cart', { method: 'DELETE' });
window.uploadDesign = (itemId, file) => {
  const form = new FormData();
  form.append('file', file);
  return fetch(`${API_BASE}/cart/items/${itemId}/design`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
    body: form
  }).then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)));
};

window.createOrder = (payload) => apiFetch('/orders', { method: 'POST', body: JSON.stringify(payload) });
window.createPayment = (orderId) => apiFetch(`/orders/${orderId}/payment`, { method: 'POST', body: JSON.stringify({}) });
window.getOrders = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/orders${qs ? '?' + qs : ''}`);
};
window.getOrder = (id) => apiFetch(`/orders/${id}`);

window.getMe = () => apiFetch('/users/me');
window.updateMe = (data) => apiFetch('/users/me', { method: 'PUT', body: JSON.stringify(data) });
window.getAddresses = () => window.getMe().then(u => u.addresses);
window.addAddress = (addr) => apiFetch('/users/me/addresses', { method: 'POST', body: JSON.stringify(addr) });
window.deleteAddress = (id) => apiFetch(`/users/me/addresses/${id}`, { method: 'DELETE' });

window.authRegister = (data) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(data) });
window.authLogin = (data) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(data) });
window.authLogout = () => apiFetch('/auth/logout', { method: 'POST', body: JSON.stringify({}) });
window.authRefresh = () => apiFetch('/auth/refresh', { method: 'POST', body: JSON.stringify({}) });
window.forgotPassword = (email) => apiFetch('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
window.resetPassword = (token, newPassword) => apiFetch('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword }) });

// Admin helpers
window.adminGetProducts = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/admin/products${qs ? '?' + qs : ''}`);
};
window.adminCreateProduct = (data) => apiFetch('/admin/products', { method: 'POST', body: JSON.stringify(data) });
window.adminUpdateProduct = (id, data) => apiFetch(`/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });
window.adminDeleteProduct = (id) => apiFetch(`/admin/products/${id}`, { method: 'DELETE' });
window.adminCreateVariant = (productId, data) => apiFetch(`/admin/products/${productId}/variants`, { method: 'POST', body: JSON.stringify(data) });
window.adminUpdateVariant = (productId, variantId, data) => apiFetch(`/admin/products/${productId}/variants/${variantId}`, { method: 'PUT', body: JSON.stringify(data) });
window.adminDeleteVariant = (productId, variantId) => apiFetch(`/admin/products/${productId}/variants/${variantId}`, { method: 'DELETE' });
window.adminUploadImage = (productId, file) => {
  const form = new FormData();
  form.append('file', file);
  return fetch(`${API_BASE}/admin/products/${productId}/images`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
    body: form
  }).then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)));
};
window.adminGetProcesses = () => apiFetch('/admin/processes');
window.adminCreateProcess = (data) => apiFetch('/admin/processes', { method: 'POST', body: JSON.stringify(data) });
window.adminUpdateProcess = (id, data) => apiFetch(`/admin/processes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
window.adminGetOrders = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/admin/orders${qs ? '?' + qs : ''}`);
};
window.adminUpdateOrderStatus = (orderId, status) => apiFetch(`/admin/orders/${orderId}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
window.adminGetDesignFiles = (orderId) => apiFetch(`/admin/orders/${orderId}/design-files`);
