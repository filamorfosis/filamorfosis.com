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
   STATE
   ═══════════════════════════════════════════════ */
let activeCategory  = 'uv';   // short ID from CATEGORIES
let activeFilter    = 'all';
let searchQuery     = '';
let currentPage     = 1;
let totalCount      = 0;
let pageSize        = 20;
let _searchDebounce = null;
let _loadedProducts = [];     // accumulated across "load more" pages
let categorySlugToId = {};    // maps API category slug → API GUID

// Short-id → API slug mapping
const CAT_SLUG_MAP = {
    'uv':      'uv-printing',
    '3d':      '3d-printing',
    'laser':   'laser-cutting',
    'engrave': 'laser-cutting',
    'photo':   'photo-printing',
};

function getActiveCategoryId() {
    const slug = CAT_SLUG_MAP[activeCategory];
    return slug ? categorySlugToId[slug] : undefined;
}

/* ═══════════════════════════════════════════════
   SKELETON LOADING
   ═══════════════════════════════════════════════ */
function renderSkeletons(n) {
    const grid = document.getElementById('catGrid');
    if (!grid) return;
    grid.innerHTML = Array.from({ length: n }, () => `
        <div class="cat-card cat-card--skeleton">
            <div class="cat-card-img skeleton" style="height:220px"></div>
            <div class="cat-card-body">
                <div class="skeleton" style="height:12px;width:60%;margin-bottom:8px;border-radius:4px"></div>
                <div class="skeleton" style="height:20px;width:90%;margin-bottom:8px;border-radius:4px"></div>
                <div class="skeleton" style="height:14px;width:80%;margin-bottom:16px;border-radius:4px"></div>
                <div class="skeleton" style="height:36px;width:100%;border-radius:8px"></div>
            </div>
        </div>`).join('');
}

/* ═══════════════════════════════════════════════
   API WRAPPER
   ═══════════════════════════════════════════════ */
async function fetchProducts(opts) {
    opts = opts || {};
    const params = { pageSize: pageSize };
    if (opts.categoryId) params.categoryId = opts.categoryId;
    if (opts.search)     params.search     = opts.search;
    if (opts.badge)      params.badge      = opts.badge;
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

    renderSkeletons(8);

    const empty = document.getElementById('catEmpty');
    if (empty) empty.style.display = 'none';

    const opts = { page: currentPage };
    const catId = getActiveCategoryId();
    if (catId) opts.categoryId = catId;
    if (searchQuery) opts.search = searchQuery;
    if (activeFilter === 'popular') opts.badge = 'hot';
    else if (activeFilter === 'new') opts.badge = 'new';

    try {
        const result = await fetchProducts(opts);
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
            if (empty) empty.style.display = 'block';
        }
    } catch (e) {
        console.error('loadProducts error:', e);
        renderError(function() { loadProducts(reset); });
    }
}

function _updateLoadMoreBtn() {
    let btn = document.getElementById('catLoadMore');
    if (!btn) {
        btn = document.createElement('div');
        btn.id = 'catLoadMore';
        btn.style.cssText = 'display:none;text-align:center;padding:20px';
        btn.innerHTML = `<button class="cat-card-cta" style="padding:12px 32px;font-size:1rem">
            <i class="fas fa-plus"></i> Cargar más
        </button>`;
        const main = document.querySelector('.cat-main');
        if (main) main.appendChild(btn);
        btn.querySelector('button').addEventListener('click', function() {
            currentPage++;
            loadProducts(false);
        });
    }
    btn.style.display = (currentPage * pageSize < totalCount) ? 'block' : 'none';
}

/* ═══════════════════════════════════════════════
   ERROR STATE
   ═══════════════════════════════════════════════ */
function renderError(retryFn) {
    const grid = document.getElementById('catGrid');
    if (!grid) return;
    grid.innerHTML = `
        <div class="cat-error-card" style="grid-column:1/-1;text-align:center;padding:40px;color:#f87171">
            <i class="fas fa-exclamation-triangle" style="font-size:2rem;margin-bottom:12px;display:block"></i>
            <p>Error al cargar los productos</p>
            <button class="cat-card-cta" id="catRetryBtn" style="margin-top:12px">
                <i class="fas fa-redo"></i> Reintentar
            </button>
        </div>`;
    const retryBtn = document.getElementById('catRetryBtn');
    if (retryBtn) retryBtn.addEventListener('click', retryFn);
}


/* ═══════════════════════════════════════════════
   RENDER TABS
   ═══════════════════════════════════════════════ */
function renderTabs() {
    const el = document.getElementById('catTabs');
    if (!el || typeof CATEGORIES === 'undefined') return;
    el.innerHTML = CATEGORIES.map(c => `
        <button class="cat-tab ${c.id === activeCategory ? 'active' : ''}" data-cat="${c.id}">
            <span class="cat-tab-icon">${c.icon}</span>
            <span class="cat-tab-label">${c.label}</span>
        </button>
    `).join('');
    el.querySelectorAll('.cat-tab').forEach(function(btn) {
        btn.addEventListener('click', function() {
            activeCategory = btn.dataset.cat;
            activeFilter   = 'all';
            searchQuery    = '';
            currentPage    = 1;
            _loadedProducts = [];
            const searchEl = document.getElementById('catSearch');
            if (searchEl) searchEl.value = '';
            renderTabs();
            renderChips();
            loadProducts(true);
        });
    });
}

/* ═══════════════════════════════════════════════
   RENDER FILTER CHIPS
   ═══════════════════════════════════════════════ */
function renderChips() {
    const el = document.getElementById('catFilterChips');
    if (!el || typeof CURATED_FILTERS === 'undefined') return;

    // Collect unique tags from loaded products
    var tagSet = {};
    _loadedProducts.forEach(function(p) {
        (p.tags || []).forEach(function(tag) {
            if (tag) tagSet[tag.toLowerCase()] = tag;
        });
    });
    var tagChips = Object.values(tagSet).sort().map(function(tag) {
        var id = 'tag:' + tag.toLowerCase();
        return { id: id, label: tag };
    });

    var curatedHtml = CURATED_FILTERS.map(function(f) {
        return `<button class="cat-chip ${activeFilter === f.id ? 'active' : ''}" data-filter="${f.id}">${t(f.labelKey)}</button>`;
    }).join('');

    var tagHtml = tagChips.map(function(tc) {
        return `<button class="cat-chip cat-chip--tag ${activeFilter === tc.id ? 'active' : ''}" data-filter="${tc.id}">
            <i class="fas fa-tag" style="font-size:1rem;margin-right:3px;opacity:0.7"></i>${tc.label}
        </button>`;
    }).join('');

    el.innerHTML = curatedHtml + (tagHtml ? '<span class="cat-chip-divider"></span>' + tagHtml : '');

    const searchEl = document.getElementById('catSearch');
    if (searchEl) searchEl.placeholder = t('search_placeholder');

    el.querySelectorAll('.cat-chip').forEach(function(btn) {
        btn.addEventListener('click', function() {
            activeFilter = btn.dataset.filter;
            renderChips();
            if (activeFilter === 'popular' || activeFilter === 'new') {
                currentPage = 1;
                _loadedProducts = [];
                loadProducts(true);
            } else {
                renderGrid();
            }
        });
    });
}

/* ═══════════════════════════════════════════════
   RENDER SECTION HEADER
   ═══════════════════════════════════════════════ */
function renderSectionHeader() {
    const cat = (typeof CATEGORIES !== 'undefined') ? CATEGORIES.find(function(c) { return c.id === activeCategory; }) : null;
    if (!cat) return;
    const titleEl = document.getElementById('catSectionTitle');
    const descEl  = document.getElementById('catSectionDesc');
    if (titleEl) titleEl.textContent = cat.icon + ' ' + cat.label;
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
    if (activeFilter === 'all' || activeFilter === 'popular' || activeFilter === 'new') {
        return products;
    }

    // Tag-based filter (chip id starts with 'tag:')
    if (activeFilter.startsWith('tag:')) {
        var tag = activeFilter.slice(4).toLowerCase();
        return products.filter(function(p) {
            return (p.tags || []).some(function(t) { return t.toLowerCase() === tag; });
        });
    }

    const filterObj = (typeof CURATED_FILTERS !== 'undefined')
        ? CURATED_FILTERS.find(function(f) { return f.id === activeFilter; })
        : null;
    if (!filterObj) return products;
    return products.filter(function(p) {
        // Map API fields to what CURATED_FILTERS.match expects
        const proxy = Object.assign({}, p, {
            desc: p.descriptionEs || '',
            tags: p.tags || [],
            badge: p.badge || null,
            pricing: p._pricing || null,
        });
        return filterObj.match(proxy);
    });
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
        if (empty) empty.style.display = 'block';
        return;
    }
    if (empty) empty.style.display = 'none';

    // Find category label for a product by matching categoryId against categorySlugToId
    function getCatLabel(categoryId) {
        if (!categoryId || typeof CATEGORIES === 'undefined') return '';
        for (var i = 0; i < CATEGORIES.length; i++) {
            var c = CATEGORIES[i];
            var slug = CAT_SLUG_MAP[c.id];
            if (slug && categorySlugToId[slug] === categoryId) return c.label;
        }
        return '';
    }

    grid.innerHTML = prods.map(function(p, i) {
        // ── Carousel ──────────────────────────────────────────────────────────
        var imgs = (p.imageUrls && p.imageUrls.length) ? p.imageUrls : null;
        var carouselHtml;
        if (imgs) {
            var slides = imgs.map(function(src, si) {
                return `<div class="cc-slide ${si === 0 ? 'active' : ''}" data-idx="${si}">
                    <img src="${resolveImageUrl(src)}" alt="${pT(p,'title')}" loading="lazy" data-emoji="📦">
                </div>`;
            }).join('');
            var dots = imgs.length > 1
                ? `<div class="cc-dots">${imgs.map(function(_,si){ return `<span class="cc-dot ${si===0?'active':''}" data-idx="${si}"></span>`; }).join('')}</div>`
                : '';
            var arrows = imgs.length > 1
                ? `<button class="cc-arrow cc-arrow--prev" type="button" aria-label="Anterior"><i class="fas fa-chevron-left"></i></button>
                   <button class="cc-arrow cc-arrow--next" type="button" aria-label="Siguiente"><i class="fas fa-chevron-right"></i></button>`
                : '';
            carouselHtml = `<div class="cat-card-carousel" data-id="${p.id}">${slides}${arrows}${dots}</div>`;
        } else {
            carouselHtml = `<div class="cat-card-img-placeholder"><span class="ph-icon">📦</span><span>${t('no_image')}</span></div>`;
        }

        // ── Badges ────────────────────────────────────────────────────────────
        var imageBadgesHtml = '';
        if (p.badge === 'hot') {
            imageBadgesHtml += `<span class="badge badge-hot" style="position:absolute;top:12px;left:12px">🔥 ${t('badge_hot')}</span>`;
        } else if (p.badge === 'new') {
            imageBadgesHtml += `<span class="badge badge-new" style="position:absolute;top:12px;left:12px">✨ ${t('badge_new')}</span>`;
        } else if (p.badge === 'promo') {
            imageBadgesHtml += `<span class="cat-card-badge promo">${t('badge_promo')}</span>`;
        } else if (p.badge === 'popular') {
            imageBadgesHtml += `<span class="badge badge-hot" style="position:absolute;top:12px;left:12px">⭐ Popular</span>`;
        }

        // ── Price ─────────────────────────────────────────────────────────────
        var priceDisplay = (p.basePrice != null && p.basePrice > 0)
            ? '$' + Math.round(p.basePrice)
            : 'Cotizar';
        var cardDiscountBadge = p.hasDiscount
            ? '<span class="badge badge-promo" style="position:absolute;top:12px;right:12px;font-size:1rem;padding:3px 8px">🏷️ OFERTA</span>'
            : '';

        // ── Tags ──────────────────────────────────────────────────────────────
        var tags = pT(p, 'tags') || [];
        var tagsHtml = tags.slice(0, 4).map(function(tag) {
            return `<span class="cat-card-tag">${tag}</span>`;
        }).join('');

        // ── Category label ────────────────────────────────────────────────────
        var catLabel = getCatLabel(p.categoryId);

        return `
        <div class="cat-card" data-id="${p.id}" style="animation-delay:${i * 0.05}s">
            <div class="cat-card-img">
                ${carouselHtml}
                ${imageBadgesHtml}
                ${cardDiscountBadge}
            </div>
            <div class="cat-card-body">
                <div class="cat-card-category">${catLabel}</div>
                <div class="cat-card-title">${pT(p,'title')}</div>
                <div class="cat-card-desc">${pT(p,'desc')}</div>
                <div class="cat-card-tags">${tagsHtml}</div>
                <div class="cat-card-price-row">
                    <div>
                        <div class="cat-card-price-from">${t('from_label')}</div>
                        <div class="cat-card-price">${priceDisplay}</div>
                    </div>
                    <div class="cat-card-actions">
                        <button class="cat-card-cta"><i class="fas fa-eye"></i> ${t('see_details')}</button>
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');

    // ── Card click → open modal ───────────────────────────────────────────────
    grid.querySelectorAll('.cat-card').forEach(function(card) {
        card.addEventListener('click', function() {
            openModal(card.dataset.id);
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
                    (v.discounts || []).forEach(function(d) {
                        var starts = d.startsAt ? new Date(d.startsAt) : null;
                        var ends   = d.endsAt   ? new Date(d.endsAt)   : null;
                        var active = (!starts || starts <= now) && (!ends || ends >= now);
                        if (!active) return;
                        if (d.discountType === 'Percentage') effectivePrice = effectivePrice * (1 - d.value / 100);
                        else effectivePrice = Math.max(0, effectivePrice - d.value);
                    });
                    // Also use server-sent effectivePrice if it's valid and lower
                    if (v.effectivePrice != null && v.effectivePrice > 0 && v.effectivePrice < effectivePrice) {
                        effectivePrice = v.effectivePrice;
                    }

                    var hasDiscount = available && effectivePrice < (v.price ?? 0);
                    var discountPct = hasDiscount ? Math.round((1 - effectivePrice / v.price) * 100) : 0;
                    var priceLabel = available ? ('$' + Math.round(hasDiscount ? effectivePrice : v.price) + ' MXN') : '';
                    return `<div class="modal-variant-item${!available ? ' unavailable' : ''}" data-variant-id="${v.id}">
                        <label class="modal-variant-check-wrap" style="display:flex;align-items:center;gap:10px;flex:1;cursor:${available ? 'pointer' : 'default'}">
                            <input type="checkbox" class="variant-cb" value="${v.id}"
                                   ${!available ? 'disabled' : ''}
                                   style="width:17px;height:17px;accent-color:#8b5cf6;cursor:${available ? 'pointer' : 'not-allowed'};flex-shrink:0">
                            <span class="modal-variant-label">${v.labelEs || v.labelEn || ''}</span>
                        </label>
                        <span class="modal-variant-price">
                            ${hasDiscount ? `
                                <span style="text-decoration:line-through;color:#64748b;font-size:1rem;margin-right:2px">$${Math.round(v.price)}</span>
                                <span class="variant-discount-badge">-${discountPct}%</span>
                                <span style="color:#fb923c;font-weight:700">$${Math.round(effectivePrice)} MXN</span>
                            ` : priceLabel}
                        </span>
                        ${v.inStock === false ? '<span class="badge badge-red" style="font-size:1rem">Agotado</span>' : (!v.isAvailable ? '<span class="badge badge-red" style="font-size:1rem">No disponible</span>' : '')}
                        <div class="variant-qty-wrap" style="display:none;align-items:center;gap:6px">
                            <button type="button" class="qty-btn qty-dec" style="width:26px;height:26px;border-radius:6px;border:1px solid #334155;background:#1e293b;color:#e2e8f0;cursor:pointer;font-size:1rem;line-height:1">−</button>
                            <input type="number" class="variant-qty" value="1" min="1" max="99"
                                   style="width:44px;text-align:center;background:#1e293b;border:1px solid #334155;color:#f1f5f9;border-radius:6px;padding:3px 4px;font-size:1rem">
                            <button type="button" class="qty-btn qty-inc" style="width:26px;height:26px;border-radius:6px;border:1px solid #334155;background:#1e293b;color:#e2e8f0;cursor:pointer;font-size:1rem;line-height:1">+</button>
                        </div>
                    </div>`;
                }).join('')}
                ${variants.length === 0 ? '<p style="color:#94a3b8;padding:12px 0">Sin variantes disponibles</p>' : ''}
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
                    <i class="fab fa-whatsapp" style="color:#25d366"></i> Consultar por WhatsApp
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
                t.style.borderColor = 'transparent';
            });
            thumb.classList.add('active');
            thumb.style.borderColor = '#a78bfa';
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
        if (hintEl)  hintEl.style.opacity = anyChecked ? '0' : '1';
    }

    inner.querySelectorAll('.variant-cb').forEach(function(cb) {
        cb.addEventListener('change', function() {
            var row = cb.closest('.modal-variant-item');
            var qtyWrap = row && row.querySelector('.variant-qty-wrap');
            if (qtyWrap) {
                qtyWrap.style.display = cb.checked ? 'flex' : 'none';
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
                if (hintEl) hintEl.style.opacity = '1';
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

// Expose setActiveCategory for URL param pre-selection
window.setActiveCategory = function(catId) {
    activeCategory = catId;
    activeFilter   = 'all';
    currentPage    = 1;
    _loadedProducts = [];
    renderTabs();
    renderChips();
    loadProducts(true);
};

/* ═══════════════════════════════════════════════
   RENDER ALL — main init
   ═══════════════════════════════════════════════ */
async function renderAll() {
    renderTabs();
    renderChips();
    renderSectionHeader();

    // Fetch categories once to build slug→id map
    try {
        var cats = await window.getCategories();
        var catList = (cats && cats.items) ? cats.items : (Array.isArray(cats) ? cats : []);
        catList.forEach(function(c) { categorySlugToId[c.slug] = c.id; });
    } catch (e) {
        console.warn('Could not fetch categories:', e);
    }

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
        if (wrap) wrap.style.boxShadow = window.scrollY > 100 ? '0 4px 30px rgba(0,0,0,0.4)' : 'none';
    });
});
