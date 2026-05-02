/* ══════════════════════════════════════════════
   CATALOG ENGINE — API-backed
   Fetches products from GET /api/v1/products
   t() bridges to catalog.js / main.js translations
   ══════════════════════════════════════════════ */

// Bridge: use unified translations — reads window.currentLang set by main.js
function t(key) {
    const lang = window.currentLang || (typeof catLang !== 'undefined' ? catLang : 'es');
    const tl = (window.translations && window.translations[lang])
        || (typeof CAT_TRANSLATIONS !== 'undefined' && CAT_TRANSLATIONS[lang]);
    if (tl && tl[key] !== undefined) return tl[key];
    const es = (window.translations && window.translations['es'])
        || (typeof CAT_TRANSLATIONS !== 'undefined' && CAT_TRANSLATIONS['es']);
    if (es && es[key] !== undefined) return es[key];
    return key;
}

// pT: get translated product field from API DTO
function pT(product, key) {
    const lang = window.currentLang || (typeof catLang !== 'undefined' ? catLang : 'es');
    if (key === 'title') return lang === 'es' ? product.titleEs : product.titleEn;
    if (key === 'desc')  return lang === 'es' ? product.descriptionEs : product.descriptionEn;
    if (key === 'tags')  return product.tags || [];
    return product[key];
}

// resolveImageUrl: convert raw S3 key to displayable URL
// Raw keys (no http prefix) are prefixed with CDN base when available.
// In local dev without a CDN, returns a grey placeholder to avoid 404s.
const _IMG_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect width="200" height="200" fill="%231e293b"/%3E%3Ctext x="50%25" y="54%25" dominant-baseline="middle" text-anchor="middle" font-size="60" fill="%2364748b"%3E📦%3C/text%3E%3C/svg%3E';
function resolveImageUrl(url) {
    if (!url) return _IMG_PLACEHOLDER;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    const cdn = window.FILAMORFOSIS_CDN_BASE;
    if (cdn) return `${cdn}/${url}`;
    return _IMG_PLACEHOLDER;
}

// closeModal exposed globally for router
function closeModal() {
    const overlay = document.getElementById('catModal');
    if (overlay) {
        overlay.classList.remove('open');
        overlay.removeEventListener('keydown', _modalFocusTrap);
    }
    document.body.style.overflow = '';
}

// animateCounter exposed globally
function animateCounter(el, target, duration) {
    if (!el) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
        start += step;
        if (start >= target) { el.textContent = target; clearInterval(timer); return; }
        el.textContent = Math.floor(start);
    }, 16);
}

// ── PURE HELPER: urgency signal logic ────────────────────────────────────────
function shouldShowUrgency(stockQuantity) {
    return stockQuantity !== undefined && stockQuantity !== null && stockQuantity <= 5;
}

// Expose for tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { shouldShowUrgency };
}

/* ═══════════════════════════════════════════════
   SPA STATE
   ═══════════════════════════════════════════════ */
var SPAState = {
    processCache:    [],   // Process[] fetched once from GET /api/v1/processes
    featuredHotCache: [],
    featuredNewCache: [],
    activeProcessId: null  // currently selected process strip card
};

/* ═══════════════════════════════════════════════
   STATE
   ═══════════════════════════════════════════════ */
let searchQuery     = '';
let currentPage     = 1;
let totalCount      = 0;
let pageSize        = 20;
let _searchDebounce = null;
let _loadedProducts = [];     // accumulated across "load more" pages
let processSlugToId = {};    // maps API process slug → API GUID
let _categorySlug   = null;  // active category slug from /tienda/:slug

// Set by router before renderAll() is called
window.setCategorySlug = function(slug) {
    _categorySlug = slug || null;
};

/* ═══════════════════════════════════════════════
   SKELETON LOADING
   ═══════════════════════════════════════════════ */
function renderSkeletons(n) {
    const grid = document.getElementById('catGrid');
    if (!grid) return;
    grid.innerHTML = Array.from({ length: n }, () => `
        <div class="cat-card cat-card--skeleton">
            <div class="cat-card-img cat-skeleton-img skeleton-pulse"></div>
            <div class="cat-card-body">
                <div class="cat-skeleton-line cat-skeleton-line--short skeleton-pulse"></div>
                <div class="cat-skeleton-line cat-skeleton-line--long skeleton-pulse"></div>
                <div class="cat-skeleton-line cat-skeleton-line--medium skeleton-pulse"></div>
                <div class="cat-skeleton-btn skeleton-pulse"></div>
            </div>
        </div>`).join('');
}

/* ═══════════════════════════════════════════════
   API WRAPPER
   ═══════════════════════════════════════════════ */
async function fetchProducts(opts) {
    opts = opts || {};
    const params = { pageSize: pageSize };
    if (opts.search) params.search = opts.search;
    if (_categorySlug) params.category = _categorySlug;
    params.page = opts.page || 1;
    return window.getProducts(params);
}

/* ═══════════════════════════════════════════════
   LOAD PRODUCTS
   ═══════════════════════════════════════════════ */
async function loadProducts(reset) {
    if (reset) {
        _loadedProducts = [];
        currentPage = 1;
    }

    // Show skeleton within 100ms of fetch initiation
    var _skeletonTimer = setTimeout(function() { renderSkeletons(8); }, 100);

    const empty = document.getElementById('catEmpty');
    if (empty) empty.classList.add('cat-empty--hidden');

    const opts = { page: currentPage };
    
    if (searchQuery) opts.search = searchQuery;

    try {
        const result = await fetchProducts(opts);
        clearTimeout(_skeletonTimer);
        const items = (result && result.items) ? result.items : (Array.isArray(result) ? result : []);
        totalCount = (result && result.totalCount != null) ? result.totalCount : items.length;

        if (reset) {
            _loadedProducts = items;
        } else {
            _loadedProducts = _loadedProducts.concat(items);
        }

        renderGrid();
        renderSectionHeader();
        _updateLoadMoreBtn();

        if (_loadedProducts.length === 0) {
            const grid = document.getElementById('catGrid');
            if (grid) grid.innerHTML = '';
            if (empty) empty.classList.remove('cat-empty--hidden');
        }
    } catch (e) {
        clearTimeout(_skeletonTimer);
        renderError(function() { loadProducts(reset); });
    }
}

function _updateLoadMoreBtn() {
    let btn = document.getElementById('catLoadMore');
    if (!btn) {
        btn = document.createElement('div');
        btn.id = 'catLoadMore';
        btn.className = 'cat-load-more-wrap cat-load-more-wrap--hidden';
        btn.innerHTML = `<button class="cat-load-more-btn">
            <i class="fas fa-plus"></i> <span class="cat-load-more-label">${t('load_more')}</span>
        </button>`;
        const main = document.querySelector('.cat-main');
        if (main) main.appendChild(btn);
        btn.querySelector('button').addEventListener('click', function() {
            currentPage++;
            loadProducts(false);
        });
    }
    // Update label in case language changed
    var labelEl = btn.querySelector('.cat-load-more-label');
    if (labelEl) labelEl.textContent = t('load_more');

    if (currentPage * pageSize < totalCount) {
        btn.classList.remove('cat-load-more-wrap--hidden');
    } else {
        btn.classList.add('cat-load-more-wrap--hidden');
    }
}

/* ═══════════════════════════════════════════════
   ERROR STATE
   ═══════════════════════════════════════════════ */
function renderError(retryFn) {
    const grid = document.getElementById('catGrid');
    if (!grid) return;
    grid.innerHTML = `
        <div class="cat-error-card">
            <i class="fas fa-exclamation-triangle cat-error-icon"></i>
            <p class="cat-error-msg">${t('error_load_products')}</p>
            <button class="cat-error-retry" id="catRetryBtn">
                <i class="fas fa-redo"></i> ${t('retry')}
            </button>
        </div>`;
    const retryBtn = document.getElementById('catRetryBtn');
    if (retryBtn) retryBtn.addEventListener('click', retryFn);
}


/* ═══════════════════════════════════════════════
   RENDER TABS
   ═══════════════════════════════════════════════ */
function renderTabs() {
    // Tabs removed - function kept for compatibility
}

/* ═══════════════════════════════════════════════
   RENDER FILTER CHIPS
   ═══════════════════════════════════════════════ */
function renderChips() {
    // Filter chips removed - function kept for compatibility
}

/* ═══════════════════════════════════════════════
   RENDER SECTION HEADER
   ═══════════════════════════════════════════════ */
function renderSectionHeader() {
    const titleEl = document.getElementById('catSectionTitle');
    const descEl  = document.getElementById('catSectionDesc');
    if (titleEl) titleEl.textContent = t('all_products') || 'Todos los Productos';
    const count = totalCount || _loadedProducts.length;
    if (descEl) descEl.textContent = count + ' ' + (count === 1 ? t('products_count_one') : t('products_count_many'));

    // Animate stat counter
    const statEl = document.getElementById('statProducts');
    if (statEl) animateCounter(statEl, count, 600);
}

/* ═══════════════════════════════════════════════
   CLIENT-SIDE FILTER HELPER
   ═══════════════════════════════════════════════ */
function _applyClientFilter(products) {
    // All filtering removed - return all products
    return products;
}


/* ═══════════════════════════════════════════════
   RENDER GRID
   ═══════════════════════════════════════════════ */
function renderGrid() {
    const grid  = document.getElementById('catGrid');
    const empty = document.getElementById('catEmpty');
    if (!grid) return;

    const prods = _applyClientFilter(_loadedProducts);

    if (!prods.length) {
        grid.innerHTML = '';
        if (empty) {
            empty.classList.remove('cat-empty--hidden');
            // Update empty text with i18n key
            var emptyTextEl = empty.querySelector('.cat-empty-text');
            if (emptyTextEl) emptyTextEl.textContent = t('empty_text');
        }
        return;
    }
    if (empty) empty.classList.add('cat-empty--hidden');

    // Find process label for a product by matching processId against SPAState.processCache
    function getProcessLabel(processId) {
        if (!processId || !SPAState.processCache || !SPAState.processCache.length) return '';
        var process = SPAState.processCache.find(function(c) { return c.id === processId; });
        if (!process) return '';
        var lang = window.currentLang || 'es';
        return lang === 'es' ? process.nameEs : process.nameEn;
    }

    grid.innerHTML = prods.map(function(p, i) {
        // ── Availability ────────────────────────────────────────────────────────────────────
        var availableVariants = (p.variants || []).filter(function(v) {
            return v.isAvailable !== false && v.inStock !== false;
        });
        var isAvailable = availableVariants.length > 0;

        // ── Carousel ────────────────────────────────────────────────────────────────────
        var imgs = (p.imageUrls && p.imageUrls.length) ? p.imageUrls : null;
        var carouselHtml;
        if (imgs) {
            var slides = imgs.map(function(src, si) {
                return '<div class="cc-slide' + (si === 0 ? ' active' : '') + '" data-idx="' + si + '">' +
                    '<img src="' + resolveImageUrl(src) + '" alt="' + pT(p, 'title') + '" loading="lazy">' +
                    '</div>';
            }).join('');
            var dots = imgs.length > 1
                ? '<div class="cc-dots">' + imgs.map(function(_, si) {
                    return '<span class="cc-dot' + (si === 0 ? ' active' : '') + '" data-idx="' + si + '"></span>';
                }).join('') + '</div>'
                : '';
            var arrows = imgs.length > 1
                ? '<button class="cc-arrow cc-arrow--prev" type="button" aria-label="Anterior"><i class="fas fa-chevron-left"></i></button>' +
                  '<button class="cc-arrow cc-arrow--next" type="button" aria-label="Siguiente"><i class="fas fa-chevron-right"></i></button>'
                : '';
            carouselHtml = '<div class="cat-card-carousel" data-id="' + p.id + '">' + slides + arrows + dots + '</div>';
        } else {
            carouselHtml = '<div class="cat-card-img-placeholder"><span class="ph-icon">📦</span><span>' + t('no_image') + '</span></div>';
        }

        // ── Badge overlay ─────────────────────────────────────────────────────────────────
        var imageBadgesHtml = '';
        if (p.badge) {
            var badgeClass = (p.badge === 'hot' || p.badge === 'popular')
                ? 'badge badge-hot'
                : (p.badge === 'new' ? 'badge badge-new' : 'badge badge-promo');
            imageBadgesHtml = '<span class="' + badgeClass + ' cat-card-badge-overlay">' + t('badge_' + p.badge) + '</span>';
        }

        // ── Price (cheapest available variant effectivePrice) ─────────────────────────────────────────────────────────────────
        var priceHtml;
        if (!isAvailable) {
            priceHtml = '<span class="cat-card-price cat-card-price--unavailable">' + t('no_disponible') + '</span>';
        } else {
            var cheapest = availableVariants.reduce(function(best, v) {
                var ep = (v.effectivePrice != null && v.effectivePrice > 0) ? v.effectivePrice : v.price;
                var bestEp = (best.effectivePrice != null && best.effectivePrice > 0) ? best.effectivePrice : best.price;
                return ep < bestEp ? v : best;
            });
            var effectivePrice = (cheapest.effectivePrice != null && cheapest.effectivePrice > 0) ? cheapest.effectivePrice : cheapest.price;
            var originalPrice = cheapest.price;
            var hasDiscount = effectivePrice < originalPrice;
            if (hasDiscount) {
                priceHtml = '<span class="cat-card-price-from">' + t('from_label') + '</span>' +
                    '<span class="cat-card-price-original">$' + Math.round(originalPrice) + ' MXN</span>' +
                    '<span class="cat-card-price cat-card-price--effective">$' + Math.round(effectivePrice) + ' MXN</span>';
            } else {
                priceHtml = '<span class="cat-card-price-from">' + t('from_label') + '</span>' +
                    '<span class="cat-card-price">$' + Math.round(effectivePrice) + ' MXN</span>';
            }
        }

        // ── Process label ────────────────────────────────────────────────────
        var processLabel = getProcessLabel(p.processId);

        // ── CTA button ────────────────────────────────────────────────────────────────────
        var ctaDisabled = !isAvailable ? ' disabled' : '';
        var ctaClass = 'cat-card-cta' + (!isAvailable ? ' cat-card-cta--disabled' : '');

        return '<article class="cat-card" data-id="' + p.id + '" role="listitem">' +
            '<div class="cat-card-img">' +
                carouselHtml +
                imageBadgesHtml +
            '</div>' +
            '<div class="cat-card-body">' +
                '<div class="cat-card-category">' + processLabel + '</div>' +
                '<div class="cat-card-title">' + pT(p, 'title') + '</div>' +
                '<div class="cat-card-desc">' + (pT(p, 'desc') || '') + '</div>' +
                '<div class="cat-card-price-row">' +
                    '<div class="cat-card-price-wrap">' + priceHtml + '</div>' +
                    '<div class="cat-card-actions">' +
                        '<button class="' + ctaClass + '"' + ctaDisabled + ' aria-label="Ver detalles de ' + pT(p, 'title') + '">' +
                            '<i class="fas fa-eye"></i> ' + t('ver_detalles') +
                        '</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</article>';
    }).join('');

    // ── Card click → SPA navigate to product detail ──────────────────────────
    grid.querySelectorAll('.cat-card').forEach(function(card) {
        card.addEventListener('click', function(e) {
            // Don't navigate if clicking carousel arrows or dots
            if (e.target.closest('.cc-arrow') || e.target.closest('.cc-dot')) return;
            // Don't navigate if CTA is disabled
            var cta = card.querySelector('.cat-card-cta');
            if (cta && cta.disabled) return;
            // Open product modal
            if (typeof openModal === 'function') {
                openModal(card.dataset.id);
            }
        });

        // ── Hover state: lift + border glow via CSS class toggle ──────────────
        card.addEventListener('mouseenter', function() {
            card.classList.add('product-card--hovered');
        });
        card.addEventListener('mouseleave', function() {
            card.classList.remove('product-card--hovered');
        });
    });

    // ── Broken image handler ──────────────────────────────────────────────────
    grid.querySelectorAll('.cat-card-img img').forEach(function(img) {
        img.addEventListener('error', function() {
            var slide = this.closest('.cc-slide');
            if (slide) {
                this.style.display = 'none';
                var ph = document.createElement('div');
                ph.className = 'cat-card-img-placeholder';
                ph.innerHTML = '<span class="ph-icon">📦</span>';
                slide.appendChild(ph);
            } else {
                var container = this.closest('.cat-card-img');
                if (container) container.innerHTML = '<div class="cat-card-img-placeholder"><span class="ph-icon">📦</span></div>';
            }
        });
    });

    // ── Init carousels ────────────────────────────────────────────────────────
    grid.querySelectorAll('.cat-card-carousel').forEach(function(carousel) {
        var slides = carousel.querySelectorAll('.cc-slide');
        var dots   = carousel.querySelectorAll('.cc-dot');
        if (slides.length <= 1) return;

        var current = 0;
        var timer   = null;

        function goTo(idx) {
            slides[current].classList.remove('active');
            dots[current] && dots[current].classList.remove('active');
            current = (idx + slides.length) % slides.length;
            slides[current].classList.add('active');
            dots[current] && dots[current].classList.add('active');
        }
        function startAuto() { timer = setInterval(function() { goTo(current + 1); }, 3000); }
        function stopAuto()  { clearInterval(timer); }

        startAuto();

        var prevBtn = carousel.querySelector('.cc-arrow--prev');
        var nextBtn = carousel.querySelector('.cc-arrow--next');
        if (prevBtn) prevBtn.addEventListener('click', function(e) { e.stopPropagation(); stopAuto(); goTo(current - 1); startAuto(); });
        if (nextBtn) nextBtn.addEventListener('click', function(e) { e.stopPropagation(); stopAuto(); goTo(current + 1); startAuto(); });

        dots.forEach(function(dot, di) {
            dot.addEventListener('click', function(e) { e.stopPropagation(); stopAuto(); goTo(di); startAuto(); });
        });

        carousel.addEventListener('mouseenter', stopAuto);
        carousel.addEventListener('mouseleave', startAuto);
    });
}


/* ═══════════════════════════════════════════════
   MODAL — open (async fetch) + render
   ═══════════════════════════════════════════════ */
async function openModal(id) {
    var overlay = document.getElementById('catModal');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    var inner = document.getElementById('catModalInner');
    inner.innerHTML = '<div style="text-align:center;padding:40px"><i class="fas fa-spinner fa-spin fa-2x" style="color:#a78bfa"></i></div>';
    try {
        var p = await window.getProduct(id);
        renderModal(p);
    } catch (e) {
        inner.innerHTML = '<div style="text-align:center;padding:40px;color:#f87171">Error al cargar el producto</div>';
    }
}

function renderModal(p) {
    var inner = document.getElementById('catModalInner');

    // ── Gallery ───────────────────────────────────────────────────────────────
    var imgs = p.imageUrls && p.imageUrls.length ? p.imageUrls : null;
    var galleryHtml = '';
    if (imgs) {
        var mainSrc = resolveImageUrl(imgs[0]);
        galleryHtml = `<div class="cat-modal-gallery" style="margin-bottom:16px">
            <img src="${mainSrc}" alt="${pT(p,'title')}" id="modalMainImg" style="width:100%;border-radius:12px;max-height:280px;object-fit:cover" loading="lazy">
            ${imgs.length > 1 ? `<div class="cat-modal-gallery-thumbs" style="display:flex;gap:8px;margin-top:8px;overflow-x:auto">
                ${imgs.map(function(src, i) {
                    return `<div class="cat-modal-gallery-thumb ${i===0?'active':''}" data-idx="${i}" style="cursor:pointer;border-radius:8px;overflow:hidden;flex-shrink:0;width:60px;height:60px;border:2px solid ${i===0?'#a78bfa':'transparent'}">
                        <img src="${resolveImageUrl(src)}" alt="${pT(p,'title')} ${i+1}" loading="lazy" style="width:100%;height:100%;object-fit:cover">
                    </div>`;
                }).join('')}
            </div>` : ''}
        </div>`;
    }

    // ── Variants ──────────────────────────────────────────────────────────────
    var variants = p.variants || [];
    var variantsHtml = `
        <div class="modal-variants-section">
            <div class="modal-table-header">
                <span class="modal-table-title">Opciones disponibles</span>
                <span class="modal-table-hint" id="tableHint">Selecciona una o más opciones</span>
            </div>
            <div class="modal-variants-list" id="modalVariantsList">
                ${variants.map(function(v) {
                    var available = v.isAvailable && v.inStock !== false;

                    // Compute effective price client-side from discounts (same logic as admin table)
                    var now = new Date();
                    var effectivePrice = v.price ?? 0;
                    var appliedDiscounts = []; // Track applied discounts for display
                    (v.discounts || []).forEach(function(d) {
                        var starts = d.startsAt ? new Date(d.startsAt) : null;
                        var ends   = d.endsAt   ? new Date(d.endsAt)   : null;
                        var active = (!starts || starts <= now) && (!ends || ends >= now);
                        if (!active) return;
                        if (d.discountType === 'Percentage') {
                            effectivePrice = effectivePrice * (1 - d.value / 100);
                            appliedDiscounts.push({ type: 'Percentage', value: d.value });
                        } else {
                            effectivePrice = Math.max(0, effectivePrice - d.value);
                            appliedDiscounts.push({ type: 'Fixed', value: d.value });
                        }
                    });
                    // Also use server-sent effectivePrice if it's valid and lower
                    if (v.effectivePrice != null && v.effectivePrice > 0 && v.effectivePrice < effectivePrice) {
                        effectivePrice = v.effectivePrice;
                    }

                    var hasDiscount = available && effectivePrice < (v.price ?? 0);
                    
                    // Build discount badge text based on discount type
                    var discountBadge = '';
                    if (hasDiscount) {
                        // Calculate total discount amount
                        var totalDiscountAmount = (v.price ?? 0) - effectivePrice;
                        
                        if (appliedDiscounts.length === 1) {
                            // Single discount - show based on type
                            var discount = appliedDiscounts[0];
                            if (discount.type === 'Percentage') {
                                discountBadge = '-' + Math.round(discount.value) + '%';
                            } else {
                                discountBadge = '-$' + Math.round(discount.value);
                            }
                        } else if (appliedDiscounts.length > 1) {
                            // Multiple discounts - show total dollar amount
                            discountBadge = '-$' + Math.round(totalDiscountAmount);
                        } else {
                            // Fallback: calculate percentage if no discount info available
                            var discountPct = Math.round((1 - effectivePrice / v.price) * 100);
                            discountBadge = '-' + discountPct + '%';
                        }
                    }
                    
                    var priceLabel = available ? ('$' + Math.round(hasDiscount ? effectivePrice : v.price) + ' MXN') : '';
                    return `<div class="modal-variant-item${!available ? ' unavailable' : ''}" data-variant-id="${v.id}">
                        <label class="modal-variant-check-wrap${!available ? ' modal-variant-check-wrap--disabled' : ''}">
                            <input type="checkbox" class="modal-variant-cb variant-cb" value="${v.id}"
                                   ${!available ? 'disabled' : ''}>
                            <span class="modal-variant-label">${v.labelEs || v.labelEn || ''}</span>
                        </label>
                        <span class="modal-variant-price">
                            ${hasDiscount ? `
                                <span style="text-decoration:line-through;color:#64748b;font-size:1rem;margin-right:2px">$${Math.round(v.price)}</span>
                                <span class="variant-discount-badge">${discountBadge}</span>
                                <span style="color:#fb923c;font-weight:700">$${Math.round(effectivePrice)} MXN</span>
                            ` : priceLabel}
                        </span>
                        ${v.inStock === false ? '<span class="badge badge-red modal-variant-status-badge">Agotado</span>' : (!v.isAvailable ? '<span class="badge badge-red modal-variant-status-badge">No disponible</span>' : '')}
                        <div class="variant-qty-wrap">
                            <button type="button" class="qty-btn qty-dec modal-qty-btn">−</button>
                            <input type="number" class="variant-qty" value="1" min="1" max="99"
                                   style="width:44px;text-align:center;background:#1e293b;border:1px solid #334155;color:#f1f5f9;border-radius:6px;padding:3px 4px;font-size:1rem">
                            <button type="button" class="qty-btn qty-inc modal-qty-btn">+</button>
                        </div>
                    </div>`;
                }).join('')}
                ${variants.length === 0 ? '<p class="modal-variants-empty">Sin variantes disponibles</p>' : ''}
            </div>
        </div>`;

    // ── Assemble ──────────────────────────────────────────────────────────────
    inner.innerHTML = `
        <div class="cat-modal-header">
            <h2 class="cat-modal-title" id="catModalTitle">${pT(p,'title')}</h2>
            <div class="cat-modal-desc">${pT(p,'desc')}</div>
        </div>
        ${galleryHtml}
        ${variantsHtml}
        <div class="modal-cta-row">
            <button class="modal-cta-add" id="modalAddToCartBtn" disabled>
                <i class="fas fa-cart-plus"></i>
                <span id="cartBtnLabel">Selecciona una opción</span>
            </button>
            <button class="modal-cta-share" id="modalShareBtn">
                <i class="fas fa-share-alt"></i>
                <span>Compartir</span>
            </button>
        </div>
        <details class="modal-help-details">
            <summary><i class="fas fa-question-circle"></i> ¿Necesitas ayuda?</summary>
            <div class="modal-help-details__body">
                <a class="modal-help-link" href="javascript:void(0)" onclick="whatsapp('${(pT(p,'title')||'').replace(/'/g,"\\'")}')">
                    <i class="fab fa-whatsapp modal-wa-icon"></i> Consultar por WhatsApp
                </a>
            </div>
        </details>`;

    // ── Accessibility ─────────────────────────────────────────────────────────
    var overlay = document.getElementById('catModal');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'catModalTitle');

    // ── Thumbnail gallery click ───────────────────────────────────────────────
    inner.querySelectorAll('.cat-modal-gallery-thumb').forEach(function(thumb) {
        thumb.addEventListener('click', function() {
            var idx = parseInt(thumb.dataset.idx);
            var mainImg = document.getElementById('modalMainImg');
            if (mainImg && p.imageUrls && p.imageUrls[idx]) {
                mainImg.src = resolveImageUrl(p.imageUrls[idx]);
            }
            inner.querySelectorAll('.cat-modal-gallery-thumb').forEach(function(t) {
                t.classList.remove('active');
            });
            thumb.classList.add('active');
        });
    });

    // ── Variant checkboxes → show qty, enable cart button ────────────────────
    var cartBtn  = document.getElementById('modalAddToCartBtn');
    var labelEl  = document.getElementById('cartBtnLabel');
    var hintEl   = document.getElementById('tableHint');

    function _updateCartBtn() {
        var anyChecked = inner.querySelectorAll('.variant-cb:checked').length > 0;
        cartBtn.disabled = !anyChecked;
        if (labelEl) labelEl.textContent = anyChecked ? (t('add_to_cart') || 'Agregar al carrito') : 'Selecciona una opción';
        if (hintEl)  hintEl.classList.toggle('modal-table-hint--hidden', anyChecked);
    }

    inner.querySelectorAll('.variant-cb').forEach(function(cb) {
        cb.addEventListener('change', function() {
            var row = cb.closest('.modal-variant-item');
            var qtyWrap = row && row.querySelector('.variant-qty-wrap');
            if (qtyWrap) {
                qtyWrap.classList.toggle('variant-qty-wrap--visible', cb.checked);
                if (cb.checked) {
                    var qtyInput = qtyWrap.querySelector('.variant-qty');
                    if (qtyInput) qtyInput.value = 1;
                }
            }
            // Highlight checked row
            if (row) row.classList.toggle('selected', cb.checked);
            _updateCartBtn();
        });
    });

    // Qty +/- buttons
    inner.querySelectorAll('.qty-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var row = btn.closest('.modal-variant-item');
            var input = row && row.querySelector('.variant-qty');
            if (!input) return;
            var val = parseInt(input.value) || 1;
            if (btn.classList.contains('qty-dec')) val = Math.max(1, val - 1);
            else val = Math.min(99, val + 1);
            input.value = val;
        });
    });

    // ── Cart button ───────────────────────────────────────────────────────────
    if (cartBtn) {
        cartBtn.addEventListener('click', function() {
            var checked = inner.querySelectorAll('.variant-cb:checked');
            if (!checked.length) {
                if (hintEl) hintEl.classList.remove('modal-table-hint--hidden');
                return;
            }
            checked.forEach(function(cb) {
                var row = cb.closest('.modal-variant-item');
                var qty = row ? (parseInt(row.querySelector('.variant-qty')?.value) || 1) : 1;
                if (window.FilamorfosisCart) {
                    window.FilamorfosisCart.addItem(cb.value, qty);
                }
            });
        });
    }

    // ── Share button ──────────────────────────────────────────────────────────
    var shareBtn = document.getElementById('modalShareBtn');
    if (shareBtn) {
        shareBtn.addEventListener('click', function() {
            var url = window.location.href.split('#')[0] + '#product=' + p.id;
            function _showShareTooltip() {
                var existing = document.getElementById('share-tooltip');
                if (existing) existing.remove();
                var tip = document.createElement('div');
                tip.id = 'share-tooltip';
                tip.textContent = '¡Enlace copiado!';
                tip.style.cssText = [
                    'position:fixed',
                    'background:#1e293b',
                    'border:1px solid #8b5cf6',
                    'color:#c4b5fd',
                    'font-size:1rem',
                    'font-weight:600',
                    'padding:6px 14px',
                    'border-radius:8px',
                    'z-index:99999',
                    'pointer-events:none',
                    'box-shadow:0 4px 20px rgba(139,92,246,0.3)',
                    'white-space:nowrap',
                    'transition:opacity 0.3s'
                ].join(';');
                document.body.appendChild(tip);
                // Position above the share button
                var rect = shareBtn.getBoundingClientRect();
                tip.style.left = (rect.left + rect.width / 2 - tip.offsetWidth / 2) + 'px';
                tip.style.top  = (rect.top - tip.offsetHeight - 8) + 'px';
                setTimeout(function() {
                    tip.style.opacity = '0';
                    setTimeout(function() { tip.remove(); }, 300);
                }, 2000);
            }
            var copy = navigator.clipboard
                ? navigator.clipboard.writeText(url)
                : Promise.resolve(document.execCommand('copy', false, url));
            copy.then(_showShareTooltip).catch(function() {
                try {
                    var ta = document.createElement('textarea');
                    ta.value = url; ta.style.cssText = 'position:fixed;opacity:0';
                    document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
                    _showShareTooltip();
                } catch (_) {}
            });
        });
    }

    // ── Focus trap ────────────────────────────────────────────────────────────
    overlay.addEventListener('keydown', _modalFocusTrap);

    // ── Focus first element ───────────────────────────────────────────────────
    setTimeout(function() {
        var firstFocusable = overlay.querySelector(
            'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (firstFocusable) firstFocusable.focus();
    }, 50);
}


/* ═══════════════════════════════════════════════
   FOCUS TRAP
   ═══════════════════════════════════════════════ */
function _modalFocusTrap(e) {
    if (e.key !== 'Tab') return;
    var overlay = document.getElementById('catModal');
    var focusable = Array.from(overlay.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
    )).filter(function(el) { return el.offsetParent !== null; });
    if (!focusable.length) return;
    var first = focusable[0];
    var last  = focusable[focusable.length - 1];
    if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
}

/* ═══════════════════════════════════════════════
   UTILITY
   ═══════════════════════════════════════════════ */
function whatsapp(title) {
    var msg = encodeURIComponent('Hola! Me interesa cotizar: ' + title);
    window.open('https://wa.me/13152071586?text=' + msg, '_blank');
}

// Expose setActiveCategory for compatibility (no-op now)
window.setActiveCategory = function(useCaseId) {
    // Filtering removed - function kept for compatibility
    loadProducts(true);
};

/* ═══════════════════════════════════════════════
   PROCESS STRIP
   ═══════════════════════════════════════════════ */

// Resolve localized process name from current language
function _processName(process) {
    var lang = window.currentLang || 'es';
    return lang === 'es' ? process.nameEs : process.nameEn;
}

// Render the process strip from cached data (no extra API call)
function _renderProcessStripFromCache() {
    var container = document.getElementById('category-strip');
    if (!container) return;

    var processes = SPAState.processCache;
    if (!processes || !processes.length) {
        container.classList.add('cat-strip--hidden');
        return;
    }

    container.classList.remove('cat-strip--hidden');

    var listEl = container.querySelector('.cat-strip__list');
    if (!listEl) return;

    listEl.innerHTML = processes.map(function(process) {
        var isActive = SPAState.activeProcessId === process.id;
        var imgHtml;
        if (process.imageUrl) {
            imgHtml = '<img src="' + resolveImageUrl(process.imageUrl) + '" alt="' + _processName(process) + '" loading="lazy" class="cat-strip__img">';
        } else {
            imgHtml = '<div class="cat-strip__img-placeholder" aria-hidden="true"></div>';
        }
        return '<li class="cat-strip__item" role="listitem">' +
            '<button class="cat-strip__card' + (isActive ? ' cat-strip__card--active' : '') + '" ' +
                'data-cat-id="' + process.id + '" ' +
                'aria-pressed="' + isActive + '" ' +
                'aria-label="Filtrar por proceso: ' + _processName(process) + '">' +
                imgHtml +
                '<span class="cat-strip__name">' + _processName(process) + '</span>' +
                '<span class="cat-strip__count" aria-label="' + (process.productCount || 0) + ' productos">' + (process.productCount || 0) + '</span>' +
            '</button>' +
        '</li>';
    }).join('');

    // Attach click handlers
    listEl.querySelectorAll('.cat-strip__card').forEach(function(btn) {
        btn.addEventListener('click', function() {
            window.filterByProcess(btn.dataset.catId);
        });
    });
}

// Fetch processes once, cache, then render
async function renderProcessStrip() {
    var container = document.getElementById('category-strip');
    if (!container) return;

    // Use cache if already populated
    if (SPAState.processCache && SPAState.processCache.length) {
        _renderProcessStripFromCache();
        return;
    }

    try {
        var result = await window.getProcesses();
        var processes = (result && result.items) ? result.items : (Array.isArray(result) ? result : []);
        SPAState.processCache = processes;
        // Also populate slug→id map used by existing tab logic
        processes.forEach(function(c) { processSlugToId[c.slug] = c.id; });
    } catch (e) {
        // Process loading failed - render grid without filtering
        SPAState.processCache = [];
    }

    _renderProcessStripFromCache();
}

// Filter the product grid by a process id; toggle active card
window.filterByProcess = function(processId) {
    // Toggle off if same process clicked again
    if (SPAState.activeProcessId === processId) {
        SPAState.activeProcessId = null;
    } else {
        SPAState.activeProcessId = processId;
    }

    // Update active class on cards
    var listEl = document.querySelector('#category-strip .cat-strip__list');
    if (listEl) {
        listEl.querySelectorAll('.cat-strip__card').forEach(function(btn) {
            var isActive = btn.dataset.catId === SPAState.activeProcessId;
            btn.classList.toggle('cat-strip__card--active', isActive);
            btn.setAttribute('aria-pressed', String(isActive));
        });
    }

    // Re-fetch product grid with selected process
    currentPage = 1;
    _loadedProducts = [];
    activeFilter = 'all';
    searchQuery = '';
    var searchEl = document.getElementById('catSearch');
    if (searchEl) searchEl.value = '';

    // Override getActiveProcessId for this fetch
    if (SPAState.activeProcessId) {
        // Temporarily patch so loadProducts picks up the strip selection
        window._stripProcessId = SPAState.activeProcessId;
    } else {
        window._stripProcessId = null;
    }

    loadProducts(true);
};

/* ═══════════════════════════════════════════════
   FEATURED CAROUSELS
   ═══════════════════════════════════════════════ */

// Build a single featured card HTML string
function _buildFeaturedCard(p) {
    var title = pT(p, 'title');
    var imgSrc = (p.imageUrls && p.imageUrls.length) ? resolveImageUrl(p.imageUrls[0]) : _IMG_PLACEHOLDER;
    var badgeLabel = p.badge ? t('badge_' + p.badge) : '';

    var priceHtml;
    if (p.hasDiscount && p.basePrice != null && p.basePrice > 0) {
        // Compute effective price from cheapest available variant
        var effectivePrice = p.basePrice;
        if (p.variants && p.variants.length) {
            var now = new Date();
            var available = p.variants.filter(function(v) { return v.isAvailable && v.inStock !== false; });
            if (available.length) {
                var prices = available.map(function(v) {
                    var ep = v.effectivePrice != null && v.effectivePrice > 0 ? v.effectivePrice : v.price;
                    return ep;
                });
                effectivePrice = Math.min.apply(null, prices);
            }
        }
        priceHtml = '<span class="featured-card__price-original">$' + Math.round(p.basePrice) + ' MXN</span>' +
                    '<span class="featured-card__price-effective">$' + Math.round(effectivePrice) + ' MXN</span>';
    } else {
        var displayPrice = (p.basePrice != null && p.basePrice > 0) ? ('$' + Math.round(p.basePrice) + ' MXN') : t('cta_quote');
        priceHtml = '<span class="featured-card__price-single">' + displayPrice + '</span>';
    }

    return '<div class="swiper-slide featured-card" data-id="' + p.id + '">' +
        '<div class="featured-card__img-wrap">' +
            '<img src="' + imgSrc + '" alt="' + title + '" loading="lazy" class="featured-card__img">' +
            (badgeLabel ? '<span class="featured-card__badge">' + badgeLabel + '</span>' : '') +
        '</div>' +
        '<div class="featured-card__body">' +
            '<div class="featured-card__title">' + title + '</div>' +
            '<div class="featured-card__price">' + priceHtml + '</div>' +
        '</div>' +
    '</div>';
}

// Render a featured carousel section
// badge: 'hot' | 'new'
// containerId: 'featured-hot' | 'featured-new'
async function renderFeaturedSection(badge, containerId) {
    var section = document.getElementById(containerId);
    if (!section) return;

    var cacheKey = badge === 'hot' ? 'featuredHotCache' : 'featuredNewCache';
    var slidesId = containerId + '-slides';
    var swiperId = containerId + '-swiper';
    var paginationId = containerId + '-pagination';

    // Use cache if already populated
    var products = SPAState[cacheKey];
    if (!products || !products.length) {
        try {
            var result = await fetchProducts({ badge: badge, page: 1 });
            products = (result && result.items) ? result.items : (Array.isArray(result) ? result : []);
            SPAState[cacheKey] = products;
        } catch (e) {
            products = [];
            SPAState[cacheKey] = [];
        }
    }

    if (!products.length) {
        section.classList.add('featured-section--hidden');
        return;
    }

    section.classList.remove('featured-section--hidden');

    var slidesEl = document.getElementById(slidesId);
    if (slidesEl) {
        slidesEl.innerHTML = products.map(_buildFeaturedCard).join('');
    }

    // Attach click handlers
    var swiperEl = document.getElementById(swiperId);
    if (swiperEl) {
        swiperEl.querySelectorAll('.featured-card').forEach(function(card) {
            card.addEventListener('click', function() {
                if (typeof openModal === 'function') {
                    openModal(card.dataset.id);
                }
            });
        });

        // Broken image fallback
        swiperEl.querySelectorAll('.featured-card__img').forEach(function(img) {
            img.addEventListener('error', function() {
                this.src = _IMG_PLACEHOLDER;
            });
        });
    }

    // Initialize Swiper
    if (window.Swiper) {
        new window.Swiper('#' + swiperId, {
            slidesPerView: 'auto',
            spaceBetween: 16,
            loop: products.length > 3,
            autoplay: { delay: 4000, pauseOnMouseEnter: true },
            pagination: { el: '#' + paginationId, clickable: true },
            navigation: {
                prevEl: '#' + containerId + ' .featured-section__prev',
                nextEl: '#' + containerId + ' .featured-section__next'
            },
            breakpoints: {
                640:  { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
                1280: { slidesPerView: 4 }
            }
        });
    }
}

// Expose for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports.renderFeaturedSection = renderFeaturedSection;
    module.exports._buildFeaturedCard = _buildFeaturedCard;
}

/* ═══════════════════════════════════════════════
   RENDER ALL — main init
   ═══════════════════════════════════════════════ */
async function renderAll() {
    // renderTabs(); // Removed - tabs hidden
    // renderChips(); // Removed - chips hidden
    renderSectionHeader();

    // Fetch processes once — builds slug→id map AND populates process strip
    await renderProcessStrip();

    // If renderProcessStrip already populated processSlugToId, skip re-fetch
    if (!Object.keys(processSlugToId).length) {
        try {
            var processes = await window.getProcesses();
            var processList = (processes && processes.items) ? processes.items : (Array.isArray(processes) ? processes : []);
            processList.forEach(function(c) { processSlugToId[c.slug] = c.id; });
        } catch (e) {
            // processes unavailable — continue without slug mapping
        }
    }

    // Render featured carousels in parallel with product grid
    renderFeaturedSection('hot', 'featured-hot');
    renderFeaturedSection('new', 'featured-new');

    await loadProducts(true);

    // Deep-link: open product modal if URL contains #product=ID
    var hash = window.location.hash || '';
    var productMatch = hash.match(/[#&]?product=([a-f0-9-]{36})/i);
    if (productMatch) {
        openModal(productMatch[1]);
    }
}

/* ═══════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function() {
    // Search with 300ms debounce
    var searchEl = document.getElementById('catSearch');
    if (searchEl) {
        searchEl.addEventListener('input', function(e) {
            clearTimeout(_searchDebounce);
            _searchDebounce = setTimeout(function() {
                searchQuery = e.target.value.toLowerCase().trim();
                currentPage = 1;
                _loadedProducts = [];
                loadProducts(true);
            }, 300);
        });
    }

    // Modal close
    var closeBtn = document.getElementById('catModalClose');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    var modalOverlay = document.getElementById('catModal');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) closeModal();
        });
    }
    document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeModal(); });

    // Sticky tabs shadow on scroll
    window.addEventListener('scroll', function() {
        var wrap = document.getElementById('catTabsWrap');
        if (wrap) wrap.classList.toggle('cat-tabs-wrap--shadow', window.scrollY > 100);
    });
});


/* ═══════════════════════════════════════════════
   PRODUCT DETAIL PAGE — Task 10
   renderProductDetail(id) — renders into #spa-view
   ═══════════════════════════════════════════════ */

async function renderProductDetail(id) {
    var spaView = document.getElementById('spa-view');
    if (!spaView) return;

    // Show loading spinner
    spaView.innerHTML = '<div class="pdp-loading"><i class="fas fa-spinner fa-spin pdp-loading__icon"></i></div>';
    window.scrollTo(0, 0);

    var product;
    try {
        product = await window.getProduct(id);
    } catch (e) {
        _renderProductDetailError(spaView);
        return;
    }

    if (!product) {
        _renderProductDetailError(spaView);
        return;
    }

    _renderProductDetailPage(spaView, product);
}

function _renderProductDetailError(container) {
    container.innerHTML =
        '<div class="pdp-error-card">' +
            '<i class="fas fa-exclamation-triangle pdp-error-card__icon"></i>' +
            '<p class="pdp-error-card__msg">' + t('error_load_products') + '</p>' +
            '<button class="pdp-back-link" onclick="window._spaNavigate(\'#home\')">' +
                '<i class="fas fa-arrow-left"></i> ' + t('back_to_catalog') +
            '</button>' +
        '</div>';
}

function _renderProductDetailPage(container, p) {
    var variants = p.variants || [];
    var imgs = (p.imageUrls && p.imageUrls.length) ? p.imageUrls : [];

    // ── Resolve category name from cache ──────────────────────────────────────
    var catName = '';
    if (p.categoryId && SPAState.categoryCache && SPAState.categoryCache.length) {
        var cat = SPAState.categoryCache.find(function(c) { return c.id === p.categoryId; });
        if (cat) catName = _catName(cat);
    }

    // ── Gallery HTML ──────────────────────────────────────────────────────────
    var galleryHtml;
    if (imgs.length) {
        var mainImg = resolveImageUrl(imgs[0]);
        var thumbsHtml = imgs.length > 1
            ? '<div class="pdp-gallery__thumbs">' +
                imgs.map(function(src, i) {
                    return '<button class="pdp-gallery__thumb' + (i === 0 ? ' pdp-gallery__thumb--active' : '') + '" ' +
                        'data-idx="' + i + '" data-src="' + resolveImageUrl(src) + '" ' +
                        'aria-label="' + t('breadcrumb_home') + ' ' + (i + 1) + '">' +
                        '<img src="' + resolveImageUrl(src) + '" alt="' + pT(p, 'title') + ' ' + (i + 1) + '" loading="lazy">' +
                    '</button>';
                }).join('') +
              '</div>'
            : '';
        galleryHtml =
            '<div class="pdp-gallery">' +
                '<div class="pdp-gallery__main-wrap">' +
                    '<img src="' + mainImg + '" alt="' + pT(p, 'title') + '" id="pdpMainImg" class="pdp-gallery__main-img" loading="lazy">' +
                '</div>' +
                thumbsHtml +
            '</div>';
    } else {
        galleryHtml =
            '<div class="pdp-gallery">' +
                '<div class="pdp-gallery__main-wrap pdp-gallery__main-wrap--placeholder">' +
                    '<span class="pdp-gallery__placeholder-icon">📦</span>' +
                    '<span class="pdp-gallery__placeholder-text">' + t('no_image') + '</span>' +
                '</div>' +
            '</div>';
    }

    // ── Breadcrumb HTML ───────────────────────────────────────────────────────
    var breadcrumbHtml =
        '<nav class="pdp-breadcrumb" aria-label="breadcrumb">' +
            '<ol class="pdp-breadcrumb__list">' +
                '<li class="pdp-breadcrumb__item">' +
                    '<button class="pdp-breadcrumb__link" onclick="window._spaNavigate(\'#home\')">' +
                        t('breadcrumb_home') +
                    '</button>' +
                '</li>' +
                (catName
                    ? '<li class="pdp-breadcrumb__item">' +
                        '<span class="pdp-breadcrumb__sep" aria-hidden="true">/</span>' +
                        '<span class="pdp-breadcrumb__text">' + catName + '</span>' +
                      '</li>'
                    : '') +
                '<li class="pdp-breadcrumb__item">' +
                    '<span class="pdp-breadcrumb__sep" aria-hidden="true">/</span>' +
                    '<span class="pdp-breadcrumb__text pdp-breadcrumb__text--current" aria-current="page">' + pT(p, 'title') + '</span>' +
                '</li>' +
            '</ol>' +
        '</nav>';

    // ── Variants HTML ─────────────────────────────────────────────────────────
    var variantsHtml = variants.map(function(v) {
        var available = v.isAvailable !== false && v.inStock !== false;
        var ep = (v.effectivePrice != null && v.effectivePrice > 0) ? v.effectivePrice : v.price;
        var hasDiscount = available && ep < v.price;

        var priceHtml;
        if (!available) {
            priceHtml = '<span class="pdp-variant__price pdp-variant__price--unavailable">' +
                (v.inStock === false ? t('agotado') : t('no_disponible')) +
            '</span>';
        } else if (hasDiscount) {
            priceHtml =
                '<span class="pdp-variant__price-original">$' + Math.round(v.price) + ' MXN</span>' +
                '<span class="pdp-variant__price pdp-variant__price--effective">$' + Math.round(ep) + ' MXN</span>';
        } else {
            priceHtml = '<span class="pdp-variant__price">$' + Math.round(ep) + ' MXN</span>';
        }

        var unavailableLabel = !available
            ? '<span class="pdp-variant__unavailable-label">' +
                (v.inStock === false ? t('agotado') : t('no_disponible')) +
              '</span>'
            : '';

        return '<div class="pdp-variant-row' + (!available ? ' pdp-variant-row--disabled' : '') + '" data-variant-id="' + v.id + '">' +
            '<label class="pdp-variant-row__check-wrap">' +
                '<input type="checkbox" class="pdp-variant-cb" value="' + v.id + '"' +
                    (available ? '' : ' disabled') +
                    ' data-price="' + ep + '"' +
                    ' data-accepts-design="' + (v.acceptsDesignFile ? 'true' : 'false') + '">' +
                '<span class="pdp-variant-row__label">' + (pT(v, 'title') || v.labelEs || v.labelEn || '') + '</span>' +
            '</label>' +
            '<div class="pdp-variant-row__price-wrap">' + priceHtml + '</div>' +
            unavailableLabel +
            '<div class="pdp-variant-row__qty-wrap pdp-variant-row__qty-wrap--hidden">' +
                '<button type="button" class="pdp-qty-btn pdp-qty-btn--dec" aria-label="−">−</button>' +
                '<input type="number" class="pdp-qty-input" value="1" min="1" max="99" aria-label="' + t('agregar_al_carrito') + '">' +
                '<button type="button" class="pdp-qty-btn pdp-qty-btn--inc" aria-label="+">+</button>' +
            '</div>' +
            (v.acceptsDesignFile
                ? '<div class="pdp-variant-row__upload-wrap pdp-variant-row__upload-wrap--hidden">' +
                    '<label class="pdp-upload-label">' +
                        '<i class="fas fa-upload"></i> ' +
                        '<span class="pdp-upload-label__text">Subir diseño</span>' +
                        '<input type="file" class="pdp-design-file" accept=".png,.jpg,.jpeg,.svg,.pdf" data-variant-id="' + v.id + '">' +
                    '</label>' +
                  '</div>'
                : '') +
        '</div>';
    }).join('');

    // ── Assemble full page ────────────────────────────────────────────────────
    container.innerHTML =
        '<div class="pdp-page">' +
            breadcrumbHtml +
            '<div class="pdp-layout">' +
                '<div class="pdp-layout__gallery">' +
                    galleryHtml +
                '</div>' +
                '<div class="pdp-layout__info">' +
                    '<h1 class="pdp-title">' + pT(p, 'title') + '</h1>' +
                    '<p class="pdp-desc">' + (pT(p, 'desc') || '') + '</p>' +
                    '<section class="pdp-variants" aria-label="' + t('agregar_al_carrito') + '">' +
                        (variants.length
                            ? variantsHtml
                            : '<p class="pdp-variants__empty">' + t('no_disponible') + '</p>') +
                    '</section>' +
                    '<div class="pdp-total-row">' +
                        '<span class="pdp-total-label">' + t('cart_total') + '</span>' +
                        '<span class="pdp-total-amount" id="pdpTotalAmount">$0 MXN</span>' +
                    '</div>' +
                    '<button class="pdp-add-btn" id="pdpAddBtn" disabled>' +
                        '<i class="fas fa-cart-plus"></i> ' + t('agregar_al_carrito') +
                    '</button>' +
                    '<button class="pdp-back-link" onclick="window._spaNavigate(\'#home\')">' +
                        '<i class="fas fa-arrow-left"></i> ' + t('back_to_catalog') +
                    '</button>' +
                '</div>' +
            '</div>' +
        '</div>';

    // ── Wire gallery thumbnails + auto-advance ────────────────────────────────
    var _galleryThumbs = Array.from(container.querySelectorAll('.pdp-gallery__thumb'));
    var _galleryTimer = null;
    var _galleryCurrentIdx = 0;

    function _galleryGoTo(idx) {
        var mainImg = document.getElementById('pdpMainImg');
        if (!_galleryThumbs.length || !mainImg) return;
        _galleryCurrentIdx = (idx + _galleryThumbs.length) % _galleryThumbs.length;
        var thumb = _galleryThumbs[_galleryCurrentIdx];
        mainImg.src = thumb.dataset.src;
        _galleryThumbs.forEach(function(b) { b.classList.remove('pdp-gallery__thumb--active'); });
        thumb.classList.add('pdp-gallery__thumb--active');
    }

    function _galleryStartAuto() {
        if (_galleryThumbs.length <= 1) return;
        _galleryTimer = setInterval(function() {
            _galleryGoTo(_galleryCurrentIdx + 1);
        }, 3000);
    }

    function _galleryStopAuto() {
        clearInterval(_galleryTimer);
        _galleryTimer = null;
    }

    _galleryThumbs.forEach(function(btn, idx) {
        btn.addEventListener('click', function() {
            _galleryStopAuto();
            _galleryGoTo(idx);
            _galleryStartAuto();
        });
    });

    // Auto-advance only when multiple images exist
    if (_galleryThumbs.length > 1) {
        _galleryStartAuto();
        var galleryEl = container.querySelector('.pdp-gallery');
        if (galleryEl) {
            galleryEl.addEventListener('mouseenter', _galleryStopAuto);
            galleryEl.addEventListener('mouseleave', _galleryStartAuto);
        }
    }

    // ── Broken image fallback ─────────────────────────────────────────────────
    var mainImgEl = document.getElementById('pdpMainImg');
    if (mainImgEl) {
        mainImgEl.addEventListener('error', function() {
            this.src = _IMG_PLACEHOLDER;
        });
    }

    // ── Variant selection logic ───────────────────────────────────────────────
    var addBtn = document.getElementById('pdpAddBtn');
    var totalAmountEl = document.getElementById('pdpTotalAmount');

    function _updateTotal() {
        var total = 0;
        container.querySelectorAll('.pdp-variant-cb:checked').forEach(function(cb) {
            var row = cb.closest('.pdp-variant-row');
            var qty = row ? (parseInt(row.querySelector('.pdp-qty-input').value) || 1) : 1;
            var price = parseFloat(cb.dataset.price) || 0;
            total += price * qty;
        });
        if (totalAmountEl) totalAmountEl.textContent = '$' + Math.round(total) + ' MXN';
        var anyChecked = container.querySelectorAll('.pdp-variant-cb:checked').length > 0;
        if (addBtn) addBtn.disabled = !anyChecked;
    }

    container.querySelectorAll('.pdp-variant-cb').forEach(function(cb) {
        cb.addEventListener('change', function() {
            var row = cb.closest('.pdp-variant-row');
            if (!row) return;
            var qtyWrap = row.querySelector('.pdp-variant-row__qty-wrap');
            var uploadWrap = row.querySelector('.pdp-variant-row__upload-wrap');
            if (qtyWrap) qtyWrap.classList.toggle('pdp-variant-row__qty-wrap--hidden', !cb.checked);
            if (uploadWrap && cb.dataset.acceptsDesign === 'true') {
                uploadWrap.classList.toggle('pdp-variant-row__upload-wrap--hidden', !cb.checked);
            }
            row.classList.toggle('pdp-variant-row--selected', cb.checked);
            _updateTotal();
        });
    });

    // ── Qty stepper ───────────────────────────────────────────────────────────
    container.querySelectorAll('.pdp-qty-btn--dec').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var input = btn.closest('.pdp-variant-row__qty-wrap').querySelector('.pdp-qty-input');
            if (input) { input.value = Math.max(1, (parseInt(input.value) || 1) - 1); _updateTotal(); }
        });
    });
    container.querySelectorAll('.pdp-qty-btn--inc').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var input = btn.closest('.pdp-variant-row__qty-wrap').querySelector('.pdp-qty-input');
            if (input) { input.value = Math.min(99, (parseInt(input.value) || 1) + 1); _updateTotal(); }
        });
    });
    container.querySelectorAll('.pdp-qty-input').forEach(function(input) {
        input.addEventListener('change', _updateTotal);
    });

    // ── Add to cart ───────────────────────────────────────────────────────────
    if (addBtn) {
        addBtn.addEventListener('click', async function() {
            var checked = container.querySelectorAll('.pdp-variant-cb:checked');
            if (!checked.length) return;

            addBtn.disabled = true;

            var productTitle = pT(p, 'title');
            var thumbUrl = imgs.length ? resolveImageUrl(imgs[0]) : '';
            var allOk = true;

            for (var i = 0; i < checked.length; i++) {
                var cb = checked[i];
                var row = cb.closest('.pdp-variant-row');
                var qty = row ? (parseInt(row.querySelector('.pdp-qty-input').value) || 1) : 1;
                var variantId = cb.value;

                // Check for design file
                var designFileInput = row ? row.querySelector('.pdp-design-file') : null;
                var designFile = designFileInput && designFileInput.files.length ? designFileInput.files[0] : null;

                try {
                    var cartResult = await window.addToCart({ productVariantId: variantId, quantity: qty });

                    // Upload design file if present
                    if (designFile && cartResult && cartResult.id) {
                        try {
                            await window.uploadDesign(cartResult.id, designFile);
                        } catch (_) { /* design upload failure is non-fatal */ }
                    }
                } catch (err) {
                    allOk = false;
                    if (err && err.status === 401) {
                        if (window.FilamorfosisAuth) window.FilamorfosisAuth.showModal('login');
                        break;
                    }
                }
            }

            // Update cart badge
            if (window.FilamorfosisCart && window.FilamorfosisCart.loadCart) {
                window.FilamorfosisCart.loadCart();
            }

            if (allOk) {
                if (window.Toast) {
                    window.Toast.show({ message: t('cart_add_success') || productTitle, type: 'success', thumbnail: thumbUrl || null });
                }
            } else {
                if (window.Toast) {
                    window.Toast.show({ message: t('cart_add_error') || 'Error al agregar al carrito', type: 'error' });
                }
            }

            addBtn.disabled = false;
            _updateTotal();
        });
    }
}

// Expose for SPA router wiring
window.renderProductDetail = renderProductDetail;
