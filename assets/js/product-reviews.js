/**
 * product-reviews.js — Customer-facing product reviews display and submission
 *
 * Responsibilities:
 *   - loadProductReviews(productId)     fetch and display approved reviews
 *   - renderReviewsSection(productId)   render reviews UI in product detail page
 *   - submitReview(productId)           submit new review
 *   - uploadReviewImage(reviewId, file) upload image to review
 *
 * Depends on: window.API_BASE or window.FILAMORFOSIS_API_BASE
 */

(function (window) {
  'use strict';

  const API_BASE = (() => {
    if (window.FILAMORFOSIS_API_BASE) return window.FILAMORFOSIS_API_BASE;
    if (typeof API_BASE !== 'undefined') return API_BASE;
    return 'http://localhost:5205/api/v1';
  })();

  // ── Helpers ───────────────────────────────────────────────────────────────
  function esc(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function stars(rating) {
    const full = Math.round(rating || 0);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  }

  function resolveImageUrl(url) {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    const cdn = window.FILAMORFOSIS_CDN_BASE;
    if (cdn) return `${cdn}/${url}`;
    const origin = API_BASE.replace(/\/api\/v1\/?$/, '');
    return `${origin}/uploads/${url.replace(/^\//, '')}`;
  }

  // ── API Calls ─────────────────────────────────────────────────────────────
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

    if (!res.ok) {
      let errorBody = { status: res.status, detail: res.statusText };
      try {
        const body = await res.json();
        errorBody = { status: res.status, ...body };
      } catch (_) {}
      throw errorBody;
    }

    if (res.status === 204) return null;
    return res.json();
  }

  async function getReviews(productId, page = 1, pageSize = 10) {
    return apiFetch(`/products/${productId}/reviews?page=${page}&pageSize=${pageSize}`);
  }

  async function submitReviewAPI(productId, data) {
    return apiFetch(`/products/${productId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async function uploadReviewImageAPI(productId, reviewId, file) {
    const form = new FormData();
    form.append('file', file);
    return fetch(`${API_BASE}/products/${productId}/reviews/${reviewId}/images`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      body: form
    }).then(async (res) => {
      if (!res.ok) {
        let errorBody = { status: res.status, detail: res.statusText };
        try { errorBody = { status: res.status, ...await res.json() }; } catch (_) {}
        throw errorBody;
      }
      return res.status === 204 ? null : res.json();
    });
  }

  // ── State ─────────────────────────────────────────────────────────────────
  let _currentProductId = null;
  let _reviewsData = null;

  // ── Load Reviews ──────────────────────────────────────────────────────────
  async function loadProductReviews(productId) {
    _currentProductId = productId;
    try {
      _reviewsData = await getReviews(productId, 1, 10);
      renderReviewsList();
    } catch (e) {
      console.error('Error loading reviews:', e);
      const container = document.getElementById('pdp-reviews-list');
      if (container) {
        container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:24px">Error al cargar reseñas</p>';
      }
    }
  }

  // ── Render Reviews List ───────────────────────────────────────────────────
  function renderReviewsList() {
    const container = document.getElementById('pdp-reviews-list');
    if (!container || !_reviewsData) return;

    const items = _reviewsData.items || [];
    
    if (!items.length) {
      container.innerHTML = '<p style="color:#64748b;text-align:center;padding:32px;font-size:1rem">Aún no hay reseñas. ¡Sé el primero en opinar!</p>';
      return;
    }

    container.innerHTML = items.map(r => {
      const verifiedBadge = r.isVerifiedPurchase
        ? '<span class="pdp-review-verified-badge" title="Este cliente compró el producto"><i class="fas fa-check-circle"></i> Compra Verificada</span>'
        : '';

      const imagesHtml = r.imageUrls && r.imageUrls.length
        ? `<div class="pdp-review-images">
            ${r.imageUrls.map(url => `
              <img src="${resolveImageUrl(url)}" alt="Imagen de reseña" class="pdp-review-img" loading="lazy">
            `).join('')}
           </div>`
        : '';

      return `
        <div class="pdp-review-card${r.isVerifiedPurchase ? ' pdp-review-card--verified' : ''}">
          <div class="pdp-review-header">
            <div class="pdp-review-author">
              <div class="pdp-review-avatar">${esc(r.authorName).charAt(0).toUpperCase()}</div>
              <div>
                <div class="pdp-review-author-name">
                  ${esc(r.authorName)}
                  ${verifiedBadge}
                </div>
                <div class="pdp-review-date">${formatDate(r.createdAt)}</div>
              </div>
            </div>
            <div class="pdp-review-rating">
              <span class="pdp-review-stars">${stars(r.rating)}</span>
              <span class="pdp-review-rating-num">${r.rating}/5</span>
            </div>
          </div>
          <div class="pdp-review-body">${esc(r.body)}</div>
          ${imagesHtml}
        </div>`;
    }).join('');
  }

  // ── Render Reviews Section ────────────────────────────────────────────────
  function renderReviewsSection(productId) {
    const root = document.getElementById('pdp-root');
    if (!root) return;

    const existingSection = document.getElementById('pdp-reviews-section');
    if (existingSection) existingSection.remove();

    const section = document.createElement('div');
    section.id = 'pdp-reviews-section';
    section.className = 'pdp-reviews-section';
    section.innerHTML = `
      <div class="pdp-reviews-container">
        <div class="pdp-reviews-header">
          <h2 class="pdp-reviews-title">
            <i class="fas fa-star"></i> Reseñas de Clientes
          </h2>
          <div class="pdp-reviews-summary" id="pdp-reviews-summary">
            <div class="pdp-reviews-avg">
              <span class="pdp-reviews-avg-num" id="pdp-avg-rating">0.0</span>
              <div class="pdp-reviews-avg-stars" id="pdp-avg-stars">☆☆☆☆☆</div>
              <span class="pdp-reviews-count" id="pdp-reviews-count">0 reseñas</span>
            </div>
          </div>
        </div>

        <div class="pdp-reviews-tabs">
          <button class="pdp-reviews-tab pdp-reviews-tab--active" data-tab="list">
            <i class="fas fa-list"></i> Ver Reseñas
          </button>
          <button class="pdp-reviews-tab" data-tab="write">
            <i class="fas fa-edit"></i> Escribir Reseña
          </button>
        </div>

        <div class="pdp-reviews-content">
          <div class="pdp-reviews-tab-content pdp-reviews-tab-content--active" id="pdp-reviews-list-tab">
            <div id="pdp-reviews-list">
              <p style="color:#64748b;text-align:center;padding:24px"><i class="fas fa-spinner fa-spin"></i> Cargando reseñas...</p>
            </div>
          </div>

          <div class="pdp-reviews-tab-content" id="pdp-reviews-write-tab">
            <form id="pdp-review-form" class="pdp-review-form">
              <div class="pdp-review-form-field">
                <label for="review-author">Tu nombre <span style="color:#f87171">*</span></label>
                <input type="text" id="review-author" name="authorName" required placeholder="Ej: Juan Pérez">
              </div>

              <div class="pdp-review-form-field">
                <label>Calificación <span style="color:#f87171">*</span></label>
                <div class="pdp-review-rating-input" id="review-rating-input">
                  <button type="button" class="pdp-rating-star" data-rating="1">☆</button>
                  <button type="button" class="pdp-rating-star" data-rating="2">☆</button>
                  <button type="button" class="pdp-rating-star" data-rating="3">☆</button>
                  <button type="button" class="pdp-rating-star" data-rating="4">☆</button>
                  <button type="button" class="pdp-rating-star" data-rating="5">☆</button>
                </div>
                <input type="hidden" id="review-rating" name="rating" value="0" required>
              </div>

              <div class="pdp-review-form-field">
                <label for="review-body">Tu opinión <span style="color:#f87171">*</span></label>
                <textarea id="review-body" name="body" rows="5" required placeholder="Cuéntanos tu experiencia con este producto..."></textarea>
              </div>

              <div class="pdp-review-form-field">
                <label for="review-images">Imágenes (opcional)</label>
                <input type="file" id="review-images" accept="image/png,image/jpeg" multiple>
                <p style="font-size:1rem;color:#64748b;margin-top:4px">Máximo 10MB por imagen. PNG o JPG.</p>
              </div>

              <div class="pdp-review-form-error" id="review-form-error"></div>

              <button type="submit" class="pdp-review-submit-btn" id="review-submit-btn">
                <i class="fas fa-paper-plane"></i> Enviar Reseña
              </button>

              <p style="font-size:1rem;color:#64748b;margin-top:12px;text-align:center">
                Tu reseña será revisada antes de publicarse.
              </p>
            </form>
          </div>
        </div>
      </div>`;

    const pdpPage = root.querySelector('.pdp2-page');
    if (pdpPage) {
      pdpPage.appendChild(section);
    } else {
      root.appendChild(section);
    }

    // Wire up tabs
    section.querySelectorAll('.pdp-reviews-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;
        section.querySelectorAll('.pdp-reviews-tab').forEach(t => t.classList.remove('pdp-reviews-tab--active'));
        section.querySelectorAll('.pdp-reviews-tab-content').forEach(c => c.classList.remove('pdp-reviews-tab-content--active'));
        tab.classList.add('pdp-reviews-tab--active');
        document.getElementById(`pdp-reviews-${targetTab}-tab`).classList.add('pdp-reviews-tab-content--active');
      });
    });

    // Wire up rating stars
    const ratingStars = section.querySelectorAll('.pdp-rating-star');
    const ratingInput = section.querySelector('#review-rating');
    ratingStars.forEach(star => {
      star.addEventListener('click', () => {
        const rating = parseInt(star.dataset.rating);
        ratingInput.value = rating;
        ratingStars.forEach((s, i) => {
          s.textContent = i < rating ? '★' : '☆';
          s.classList.toggle('pdp-rating-star--active', i < rating);
        });
      });
    });

    // Wire up form submission
    const form = section.querySelector('#pdp-review-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await submitReview(productId);
      });
    }

    // Load reviews
    loadProductReviews(productId);
  }

  // ── Submit Review ─────────────────────────────────────────────────────────
  async function submitReview(productId) {
    const form = document.getElementById('pdp-review-form');
    const errorEl = document.getElementById('review-form-error');
    const submitBtn = document.getElementById('review-submit-btn');
    
    if (!form) return;

    const authorName = form.querySelector('#review-author').value.trim();
    const rating = parseInt(form.querySelector('#review-rating').value);
    const body = form.querySelector('#review-body').value.trim();
    const imagesInput = form.querySelector('#review-images');

    // Validation
    if (!authorName) {
      if (errorEl) errorEl.textContent = 'Por favor ingresa tu nombre.';
      return;
    }
    if (rating < 1 || rating > 5) {
      if (errorEl) errorEl.textContent = 'Por favor selecciona una calificación.';
      return;
    }
    if (!body) {
      if (errorEl) errorEl.textContent = 'Por favor escribe tu opinión.';
      return;
    }

    if (errorEl) errorEl.textContent = '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    }

    try {
      // Submit review
      const review = await submitReviewAPI(productId, {
        authorName,
        rating,
        body
      });

      // Upload images if any
      if (imagesInput && imagesInput.files.length > 0) {
        for (let i = 0; i < imagesInput.files.length; i++) {
          try {
            await uploadReviewImageAPI(productId, review.id, imagesInput.files[i]);
          } catch (imgErr) {
            console.error('Error uploading image:', imgErr);
          }
        }
      }

      // Success
      form.reset();
      form.querySelectorAll('.pdp-rating-star').forEach(s => {
        s.textContent = '☆';
        s.classList.remove('pdp-rating-star--active');
      });

      if (errorEl) {
        errorEl.style.color = '#22c55e';
        errorEl.textContent = '¡Gracias! Tu reseña ha sido enviada y será revisada pronto.';
      }

      // Switch back to list tab after 2 seconds
      setTimeout(() => {
        const listTab = document.querySelector('.pdp-reviews-tab[data-tab="list"]');
        if (listTab) listTab.click();
        if (errorEl) errorEl.textContent = '';
      }, 2000);

    } catch (err) {
      if (errorEl) {
        errorEl.style.color = '#f87171';
        errorEl.textContent = err.detail || 'Error al enviar la reseña. Por favor intenta nuevamente.';
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Reseña';
      }
    }
  }

  // ── Update Summary ────────────────────────────────────────────────────────
  function updateReviewsSummary() {
    if (!_reviewsData) return;

    const avgRating = _reviewsData.averageRating || 0;
    const totalCount = _reviewsData.totalCount || 0;

    const avgNumEl = document.getElementById('pdp-avg-rating');
    const avgStarsEl = document.getElementById('pdp-avg-stars');
    const countEl = document.getElementById('pdp-reviews-count');

    if (avgNumEl) avgNumEl.textContent = avgRating.toFixed(1);
    if (avgStarsEl) avgStarsEl.textContent = stars(avgRating);
    if (countEl) countEl.textContent = `${totalCount} ${totalCount === 1 ? 'reseña' : 'reseñas'}`;
  }

  // Update summary after reviews load
  const originalRenderReviewsList = renderReviewsList;
  renderReviewsList = function() {
    originalRenderReviewsList();
    updateReviewsSummary();
  };

  // ── Public API ────────────────────────────────────────────────────────────
  window.ProductReviews = {
    renderReviewsSection,
    loadProductReviews,
    submitReview
  };

}(window));
