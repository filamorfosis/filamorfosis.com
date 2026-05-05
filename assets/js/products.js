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
    // Raw S3 key — resolve via the API origin's /uploads/ path
    const apiBase = (typeof API_BASE !== 'undefined' ? API_BASE : null)
        || window.FILAMORFOSIS_API_BASE
        || 'http://localhost:5205/api/v1';
    const origin = apiBase.replace(/\/api\/v1\/?$/, '');
    return `${origin}/uploads/${url.replace(/^\//, '')}`;
}

// closeModal — no-op, modal removed
function closeModal() {}

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
let _categoryName   = null;  // display name for the active category (set after categories load)
let _subCategorySlug = null; // active subcategory slug (more specific filter)
let _subCategoryName = null; // display name for the active subcategory
let _categoriesCache = [];   // flat list of all categories + subcategories for name lookup
let _fullCategoriesCache = []; // full category tree (with subCategories arrays) for sidebar re-init
let _activeTag = null;       // active tag chip filter
let _sortBy    = 'default';  // sort order: 'default' | 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'most-sold' | 'best-reviews'

// Set by router before renderAll() is called
window.setCategorySlug = function(slug) {
    _categorySlug = slug || null;
    _categoryName = null; // will be resolved after categories load
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
    // badge filter (for featured sections only)
    if (opts.badge)  params.badge  = opts.badge;

    // Subcategory takes priority; otherwise use parent category slug
    if (_subCategorySlug) {
        params.subCategorySlug = _subCategorySlug;
    } else if (_categorySlug) {
        params.categorySlug = _categorySlug;
    }

    // Process strip selection overrides category slug
    var activeProcess = window._stripProcessId || SPAState.activeProcessId;
    if (activeProcess) params.processId = activeProcess;

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
        // Tear down scroll observer so it re-initialises after fresh load
        _teardownInfiniteScroll();
    }

    // On reset: show full skeleton. On append: skeleton cards already injected by _loadNextPage.
    var _skeletonTimer = null;
    if (reset) {
        _skeletonTimer = setTimeout(function() { renderSkeletons(8); }, 100);
    }

    const empty = document.getElementById('catEmpty');
    if (empty) empty.classList.add('cat-empty--hidden');

    const opts = { page: currentPage };

    // Note: search and tag filtering are applied client-side in _applyClientFilter

    try {
        const result = await fetchProducts(opts);
        if (_skeletonTimer) clearTimeout(_skeletonTimer);

        const items = (result && result.items) ? result.items : (Array.isArray(result) ? result : []);
        totalCount = (result && result.totalCount != null) ? result.totalCount : items.length;

        if (reset) {
            _loadedProducts = items;
        } else {
            // Remove appended skeleton cards before rendering real ones
            var grid = document.getElementById('catGrid');
            if (grid) {
                grid.querySelectorAll('.cat-card--skeleton-append').forEach(function(el) { el.remove(); });
            }
            _loadedProducts = _loadedProducts.concat(items);
        }

        renderGrid();
        renderSectionHeader();
        _renderTagChips();

        if (_loadedProducts.length === 0) {
            var gridEl = document.getElementById('catGrid');
            if (gridEl) gridEl.innerHTML = '';
            if (empty) empty.classList.remove('cat-empty--hidden');
        }

        // (Re-)initialise infinite scroll after every load
        _initInfiniteScroll();

    } catch (e) {
        if (_skeletonTimer) clearTimeout(_skeletonTimer);
        renderError(function() { loadProducts(reset); });
    }
}

function _updateLoadMoreBtn() {
    // Replaced by infinite scroll — keep function for compatibility but do nothing
}

/* ═══════════════════════════════════════════════
   INFINITE SCROLL
   Uses an IntersectionObserver on a sentinel div
   placed after the grid. When it enters the
   viewport and more pages exist, loads the next
   page automatically with skeleton cards appended.
   ═══════════════════════════════════════════════ */
var _infiniteScrollObserver = null;

function _initInfiniteScroll() {
    // Tear down any previous observer
    if (_infiniteScrollObserver) {
        _infiniteScrollObserver.disconnect();
        _infiniteScrollObserver = null;
    }

    // Create or reuse the sentinel element
    var sentinel = document.getElementById('catScrollSentinel');
    if (!sentinel) {
        sentinel = document.createElement('div');
        sentinel.id = 'catScrollSentinel';
        sentinel.className = 'cat-scroll-sentinel';
        var grid = document.getElementById('catGrid');
        if (grid && grid.parentNode) {
            grid.parentNode.insertBefore(sentinel, grid.nextSibling);
        }
    }

    _infiniteScrollObserver = new IntersectionObserver(function(entries) {
        if (!entries[0].isIntersecting) return;
        // Only load if there are more pages and we're not already loading
        if (currentPage * pageSize < totalCount && !_isLoadingMore) {
            _loadNextPage();
        }
    }, { rootMargin: '200px' });

    _infiniteScrollObserver.observe(sentinel);
}

var _isLoadingMore = false;

async function _loadNextPage() {
    if (_isLoadingMore) return;
    _isLoadingMore = true;

    // Append skeleton cards to the grid while fetching
    var grid = document.getElementById('catGrid');
    if (grid) {
        var skeletonHtml = Array.from({ length: Math.min(pageSize, totalCount - _loadedProducts.length) }, function() {
            return '<div class="cat-card cat-card--skeleton cat-card--skeleton-append">' +
                '<div class="cat-card-img cat-skeleton-img skeleton-pulse"></div>' +
                '<div class="cat-card-body">' +
                    '<div class="cat-skeleton-line cat-skeleton-line--short skeleton-pulse"></div>' +
                    '<div class="cat-skeleton-line cat-skeleton-line--long skeleton-pulse"></div>' +
                    '<div class="cat-skeleton-line cat-skeleton-line--medium skeleton-pulse"></div>' +
                    '<div class="cat-skeleton-btn skeleton-pulse"></div>' +
                '</div>' +
            '</div>';
        }).join('');
        grid.insertAdjacentHTML('beforeend', skeletonHtml);
    }

    currentPage++;
    try {
        await loadProducts(false);
    } finally {
        _isLoadingMore = false;
    }
}

function _teardownInfiniteScroll() {
    if (_infiniteScrollObserver) {
        _infiniteScrollObserver.disconnect();
        _infiniteScrollObserver = null;
    }
    var sentinel = document.getElementById('catScrollSentinel');
    if (sentinel) sentinel.remove();
    _isLoadingMore = false;
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

    // Count after client-side filters
    var filtered = _applyClientFilter(_loadedProducts);
    var count = filtered.length;

    // Resolve category display name from cache if not yet set
    if (_categorySlug && !_categoryName && _categoriesCache.length) {
        var found = _categoriesCache.find(function(c) { return c.slug === _categorySlug; });
        if (found) _categoryName = found.name;
    }

    var displayName = _subCategoryName || _categoryName;
    if (displayName) {
        if (titleEl) titleEl.textContent = displayName;
    } else if (_categorySlug) {
        if (titleEl) titleEl.textContent = _categorySlug.replace(/-/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); });
    } else {
        if (titleEl) titleEl.textContent = t('all_products') || 'Todos los productos: (Selecciona una categoría del lado izquierdo)';
    }

    if (descEl) descEl.textContent = count + ' ' + (count === 1 ? t('products_count_one') : t('products_count_many'));

    // Animate stat counter
    const statEl = document.getElementById('statProducts');
    if (statEl) animateCounter(statEl, count, 600);

    // Render sort dropdown
    _renderSortDropdown();

    // Render active filter pill
    _renderActiveFilterPill();
}

/* ═══════════════════════════════════════════════
   SORT DROPDOWN
   ═══════════════════════════════════════════════ */
function _renderSortDropdown() {
    var titleRow = document.querySelector('#catSectionHeader .cat-content__title-row');
    if (!titleRow) return;

    var existing = document.getElementById('catSortWrap');
    if (existing) {
        // Just update the selected value
        var sel = existing.querySelector('#catSortBy');
        if (sel && sel.value !== _sortBy) sel.value = _sortBy;
        return;
    }

    var wrap = document.createElement('div');
    wrap.id = 'catSortWrap';
    wrap.className = 'cat-sort-wrap';
    wrap.innerHTML =
        '<label class="cat-sort-label" for="catSortBy">' +
            '<i class="fas fa-sort-amount-down"></i> ' + (t('sort_by') || 'Ordenar') +
        '</label>' +
        '<select id="catSortBy" class="cat-sort-select" aria-label="' + (t('sort_by') || 'Ordenar por') + '">' +
            '<option value="default">'  + (t('sort_default')      || 'Relevancia')    + '</option>' +
            '<option value="name-asc">' + (t('sort_name_asc')     || 'Nombre A-Z')    + '</option>' +
            '<option value="name-desc">'+ (t('sort_name_desc')    || 'Nombre Z-A')    + '</option>' +
            '<option value="price-asc">'+ (t('sort_price_asc')    || 'Precio: menor') + '</option>' +
            '<option value="price-desc">'+(t('sort_price_desc')   || 'Precio: mayor') + '</option>' +
            '<option value="most-sold">'+ (t('sort_most_sold')    || 'Más vendidos')  + '</option>' +
            '<option value="best-reviews">'+(t('sort_best_reviews')|| 'Mejor calificados') + '</option>' +
        '</select>';

    wrap.querySelector('#catSortBy').value = _sortBy;

    wrap.querySelector('#catSortBy').addEventListener('change', function(e) {
        _sortBy = e.target.value;
        renderGrid();
        renderSectionHeader();
    });

    // Append to the right side of the title row
    titleRow.appendChild(wrap);
}

/* ═══════════════════════════════════════════════
   ACTIVE FILTER PILL
   ═══════════════════════════════════════════════ */
function _renderActiveFilterPill() {
    var bar = document.getElementById('catFilterBar');
    if (!bar) return;

    var existing = document.getElementById('catActivePills');
    if (existing) existing.remove();

    var hasCategory = !!_categorySlug;
    var hasProcess  = !!(window._stripProcessId || SPAState.activeProcessId);
    var hasSearch   = !!searchQuery;

    if (!hasCategory && !hasProcess && !hasSearch) return;

    var pills = [];

    if (hasCategory) {
        var label = _categoryName || (_categorySlug ? _categorySlug.replace(/-/g, ' ') : '');
        pills.push(
            '<span class="cat-filter-pill">' +
                '<i class="fas fa-tag"></i> ' + label +
                '<button class="cat-filter-pill__remove" onclick="AdminProducts_clearCategoryFilter()" aria-label="Quitar filtro de categoría">' +
                    '<i class="fas fa-times"></i>' +
                '</button>' +
            '</span>'
        );
    }

    if (hasProcess) {
        var processId = window._stripProcessId || SPAState.activeProcessId;
        var proc = SPAState.processCache && SPAState.processCache.find(function(p) { return p.id === processId; });
        var procLabel = proc ? _processName(proc) : 'Proceso';
        pills.push(
            '<span class="cat-filter-pill">' +
                '<i class="fas fa-layer-group"></i> ' + procLabel +
                '<button class="cat-filter-pill__remove" onclick="window.filterByProcess(\'' + processId + '\')" aria-label="Quitar filtro de proceso">' +
                    '<i class="fas fa-times"></i>' +
                '</button>' +
            '</span>'
        );
    }

    if (hasSearch) {
        pills.push(
            '<span class="cat-filter-pill">' +
                '<i class="fas fa-search"></i> "' + searchQuery + '"' +
                '<button class="cat-filter-pill__remove" onclick="window._clearSearchFilter()" aria-label="Quitar búsqueda">' +
                    '<i class="fas fa-times"></i>' +
                '</button>' +
            '</span>'
        );
    }

    if (!pills.length) return;

    var wrap = document.createElement('div');
    wrap.id = 'catActivePills';
    wrap.className = 'cat-active-pills';
    wrap.innerHTML = pills.join('') +
        (pills.length > 1
            ? '<button class="cat-filter-pill cat-filter-pill--clear-all" onclick="window._clearAllFilters()">' +
                '<i class="fas fa-times-circle"></i> Limpiar todo' +
              '</button>'
            : '');
    bar.querySelector('.cat-filter-inner').appendChild(wrap);
}

// Clear category filter
window.AdminProducts_clearCategoryFilter = function() {
    // Always clear state directly — don't rely on router navigation
    // (navigation is a no-op when already on /tienda with no slug)
    _categorySlug    = null;
    _categoryName    = null;
    _subCategorySlug = null;
    _subCategoryName = null;
    _activeTag       = null;
    searchQuery      = '';
    _sortBy          = 'default';

    var searchEl = document.getElementById('catSearch');
    if (searchEl) searchEl.value = '';
    var sortEl = document.getElementById('catSortBy');
    if (sortEl) sortEl.value = 'default';

    // Sync sidebar "All" button active state
    var allBtn = document.getElementById('catSidebarAllBtn');
    if (allBtn) allBtn.classList.add('cat-sidebar__all-btn--active');

    // Re-render sidebar nav to deselect categories
    if (_fullCategoriesCache.length) {
        var nav = document.getElementById('catSidebarNav');
        if (nav) {
            nav.querySelectorAll('.cat-sidebar__nav-btn').forEach(function(btn) {
                btn.classList.remove('cat-sidebar__nav-btn--active');
                btn.setAttribute('aria-expanded', 'false');
            });
            nav.querySelectorAll('.cat-sidebar__subs').forEach(function(el) { el.remove(); });
        }
    }

    // If the URL has a slug, navigate away to clean it up; otherwise just push /tienda
    var pathParts = window.location.pathname.split('/');
    var hasSlugInUrl = pathParts[1] === 'tienda' && pathParts[2];
    if (hasSlugInUrl && typeof window.FilamorfosisRouter !== 'undefined' && window.FilamorfosisRouter.navigate) {
        window.FilamorfosisRouter.navigate('/tienda');
    } else {
        if (window.location.pathname !== '/tienda') {
            window.history.pushState({}, '', '/tienda');
        }
        currentPage = 1;
        _loadedProducts = [];
        loadProducts(true);
        renderSectionHeader();
    }
};

// Clear search filter
window._clearSearchFilter = function() {
    searchQuery = '';
    var searchEl = document.getElementById('catSearch');
    if (searchEl) searchEl.value = '';
    renderGrid();
    renderSectionHeader();
    _renderTagChips();
};

// Clear all active filters
window._clearAllFilters = function() {
    searchQuery = '';
    _sortBy = 'default';
    var searchEl = document.getElementById('catSearch');
    if (searchEl) searchEl.value = '';
    var sortEl = document.getElementById('catSortBy');
    if (sortEl) sortEl.value = 'default';
    SPAState.activeProcessId = null;
    window._stripProcessId = null;
    _subCategorySlug = null;
    _subCategoryName = null;
    _activeTag = null;
    // Update strip UI
    var listEl = document.querySelector('#category-strip .cat-strip__list');
    if (listEl) {
        listEl.querySelectorAll('.cat-strip__card').forEach(function(btn) {
            btn.classList.remove('cat-strip__card--active');
            btn.setAttribute('aria-pressed', 'false');
        });
    }
    if (_categorySlug) {
        window.AdminProducts_clearCategoryFilter();
    } else {
        currentPage = 1;
        _loadedProducts = [];
        loadProducts(true);
    }
};

/* ═══════════════════════════════════════════════
   CLIENT-SIDE FILTER HELPER
   Applies (in order): tag chip → text search → sort
   ═══════════════════════════════════════════════ */
function _applyClientFilter(products) {
    var result = products.slice(); // shallow copy

    // 1. Tag chip filter (final filter layer)
    if (_activeTag) {
        result = result.filter(function(p) {
            return (p.tags || []).indexOf(_activeTag) !== -1;
        });
    }

    // 2. Text search — matches title or description in current language
    if (searchQuery) {
        var q = searchQuery.toLowerCase();
        result = result.filter(function(p) {
            var title = (pT(p, 'title') || '').toLowerCase();
            var desc  = (pT(p, 'desc')  || '').toLowerCase();
            var tags  = (p.tags || []).join(' ').toLowerCase();
            return title.indexOf(q) !== -1 || desc.indexOf(q) !== -1 || tags.indexOf(q) !== -1;
        });
    }

    // 3. Sort
    if (_sortBy && _sortBy !== 'default') {
        result = result.slice(); // ensure we don't mutate
        result.sort(function(a, b) {
            function _minPrice(p) {
                var avail = (p.variants || []).filter(function(v) { return v.isAvailable !== false && v.inStock !== false; });
                if (!avail.length) return Infinity;
                return avail.reduce(function(min, v) {
                    var ep = (v.effectivePrice != null && v.effectivePrice > 0) ? v.effectivePrice : v.price;
                    return ep < min ? ep : min;
                }, Infinity);
            }
            if (_sortBy === 'name-asc')  return (pT(a,'title')||'').localeCompare(pT(b,'title')||'');
            if (_sortBy === 'name-desc') return (pT(b,'title')||'').localeCompare(pT(a,'title')||'');
            if (_sortBy === 'price-asc')  return _minPrice(a) - _minPrice(b);
            if (_sortBy === 'price-desc') return _minPrice(b) - _minPrice(a);
            if (_sortBy === 'most-sold')  return (b.salesCount || 0) - (a.salesCount || 0);
            if (_sortBy === 'best-reviews') return (b.averageRating || 0) - (a.averageRating || 0);
            return 0;
        });
    }

    return result;
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
        // Collect images from all variant imageUrls (deduplicated)
        var imgs = [];
        (p.variants || []).forEach(function(v) {
            (v.imageUrls || []).forEach(function(url) {
                if (url && imgs.indexOf(url) === -1) imgs.push(url);
            });
        });
        if (!imgs.length) imgs = null;
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

        return '<article class="cat-card" data-id="' + p.id + '" data-slug="' + (p.slug || p.id) + '" role="listitem">' +
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
                openModal(card.dataset.slug || card.dataset.id);
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
   PRODUCT NAVIGATION
   ═══════════════════════════════════════════════ */
function openModal(id) {
    if (window.FilamorfosisRouter) {
        window.FilamorfosisRouter.navigate('/producto/' + id);
    } else {
        window.location.href = '/producto/' + id;
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
    _activeTag = null;
    searchQuery = '';
    _sortBy = 'default';
    var searchEl = document.getElementById('catSearch');
    if (searchEl) searchEl.value = '';
    var sortEl = document.getElementById('catSortBy');
    if (sortEl) sortEl.value = 'default';

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

    return '<div class="swiper-slide featured-card" data-id="' + p.id + '" data-slug="' + (p.slug || p.id) + '">' +
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
                    openModal(card.dataset.slug || card.dataset.id);
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
/* ═══════════════════════════════════════════════
   TAG CHIPS — client-side filter
   ═══════════════════════════════════════════════ */
function _renderTagChips() {
    var container = document.getElementById('catTagChips');
    if (!container) return;

    // Count tags across ALL loaded products (before tag filter)
    var tagSet = {};
    _loadedProducts.forEach(function(p) {
        (p.tags || []).forEach(function(tag) {
            if (tag) tagSet[tag] = (tagSet[tag] || 0) + 1;
        });
    });

    // Only show tags that have at least 1 product
    var tags = Object.keys(tagSet).filter(function(tag) {
        return tagSet[tag] > 0;
    }).sort();

    if (!tags.length) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = tags.map(function(tag) {
        var isActive = _activeTag === tag;
        return '<button class="cat-tag-chip' + (isActive ? ' cat-tag-chip--active' : '') + '" data-tag="' + tag + '">' +
            tag +
            ' <span class="cat-tag-chip__count">' + tagSet[tag] + '</span>' +
        '</button>';
    }).join('');

    container.querySelectorAll('.cat-tag-chip').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var tag = btn.dataset.tag;
            _activeTag = (_activeTag === tag) ? null : tag;
            // Re-render grid with client-side tag + search + sort filter (no API call)
            renderGrid();
            renderSectionHeader();
            _renderTagChips();
        });
    });
}

// Override renderGrid to apply client-side tag filter
var _originalRenderGrid = null;

async function renderAll() {
    renderSectionHeader();

    // Load categories for filter pill name resolution AND sidebar
    var categoriesData = [];
    if (!_categoriesCache.length) {
        try {
            var cats = await window.getCategories();
            categoriesData = Array.isArray(cats) ? cats : (cats && cats.items ? cats.items : []);
            // Store full tree for sidebar re-init on subsequent renderAll() calls
            _fullCategoriesCache = categoriesData;
            // Flatten: parent categories + subcategories
            categoriesData.forEach(function(c) {
                _categoriesCache.push({ id: c.id, slug: c.slug, name: c.name });
                (c.subCategories || []).forEach(function(sc) {
                    _categoriesCache.push({ id: sc.id, slug: sc.slug, name: sc.name, _isSub: true });
                });
            });
            // Resolve category name now that cache is populated
            if (_categorySlug && !_categoryName) {
                var found = _categoriesCache.find(function(c) { return c.slug === _categorySlug; });
                if (found) _categoryName = found.name;
            }
        } catch (e) {
            // categories unavailable — continue without name resolution
        }
    } else {
        // Re-use the full category tree stored in _fullCategoriesCache
        categoriesData = _fullCategoriesCache;
    }

    // Build sidebar from full category tree
    _initSidebar(categoriesData.length ? categoriesData : null);

    // Wire search input — must happen here because the input is in a template
    // stamped by the router after DOMContentLoaded fires
    var searchEl = document.getElementById('catSearch');
    if (searchEl && !searchEl._wired) {
        searchEl._wired = true;
        searchEl.addEventListener('input', function(e) {
            clearTimeout(_searchDebounce);
            _searchDebounce = setTimeout(function() {
                searchQuery = e.target.value.toLowerCase().trim();
                // Text search filters the already-loaded results client-side
                renderGrid();
                renderSectionHeader();
                _renderTagChips();
            }, 200);
        });
    }

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

    // Deep-link: open product modal if URL contains #product=<slug-or-id>
    var hash = window.location.hash || '';
    var productMatch = hash.match(/[#&]?product=([^&]+)/i);
    if (productMatch) {
        openModal(decodeURIComponent(productMatch[1]));
    }
}

/* ═══════════════════════════════════════════════
   SIDEBAR — accordion category picker
   ═══════════════════════════════════════════════ */
function _initSidebar(categoriesData) {
    var nav    = document.getElementById('catSidebarNav');
    var allBtn = document.getElementById('catSidebarAllBtn');
    if (!nav) return;

    // Fetch full category tree if not passed in
    if (!categoriesData || !categoriesData.length) {
        window.getCategories().then(function(cats) {
            _initSidebar(Array.isArray(cats) ? cats : []);
        }).catch(function() {});
        return;
    }

    var groups = categoriesData.filter(function(c) { return c.subCategories && c.subCategories.length; });
    if (!groups.length) return;

    // ── Helper: reload products with current state ──────────────────────
    function _reload() {
        currentPage = 1;
        _loadedProducts = [];
        _activeTag = null;
        searchQuery = '';
        _sortBy = 'default';
        var searchEl = document.getElementById('catSearch');
        if (searchEl) searchEl.value = '';
        var sortEl = document.getElementById('catSortBy');
        if (sortEl) sortEl.value = 'default';

        // Keep the URL in sync without triggering a full router re-render
        var newPath = _subCategorySlug
            ? '/tienda/' + _subCategorySlug
            : _categorySlug
                ? '/tienda/' + _categorySlug
                : '/tienda';
        if (window.location.pathname !== newPath) {
            window.history.pushState({}, '', newPath);
        }

        loadProducts(true);
        renderSectionHeader();
    }

    // ── Helper: update "All" button active state ────────────────────────
    function _syncAllBtn() {
        if (allBtn) allBtn.classList.toggle('cat-sidebar__all-btn--active', !_categorySlug && !_subCategorySlug);
    }

    // ── Render the full nav ─────────────────────────────────────────────
    function _renderNav() {
        nav.innerHTML = groups.map(function(cat, i) {
            var icon = cat.icon ? '<i class="' + cat.icon + '"></i>' : '<i class="fas fa-tag"></i>';
            var isCatActive = _categorySlug === cat.slug;
            var isExpanded  = isCatActive; // expand when this category is active

            var subHtml = '';
            if (isExpanded) {
                subHtml = '<div class="cat-sidebar__subs">' +
                    cat.subCategories.map(function(sc) {
                        var scIcon = sc.icon ? '<i class="' + sc.icon + '"></i>' : '';
                        var isSubActive = _subCategorySlug === sc.slug;
                        return '<button class="cat-sidebar__sub-btn' + (isSubActive ? ' cat-sidebar__sub-btn--active' : '') + '" ' +
                            'data-slug="' + sc.slug + '" data-name="' + sc.name + '" data-cat-slug="' + cat.slug + '">' +
                            scIcon + '<span>' + sc.name + '</span>' +
                        '</button>';
                    }).join('') +
                '</div>';
            }

            return '<div class="cat-sidebar__cat-group">' +
                '<button class="cat-sidebar__nav-btn' + (isCatActive ? ' cat-sidebar__nav-btn--active' : '') + '" ' +
                    'data-cat-slug="' + cat.slug + '" data-cat-name="' + cat.name + '" data-cat-idx="' + i + '" ' +
                    'aria-expanded="' + isExpanded + '">' +
                    icon + '<span>' + cat.name + '</span>' +
                    '<i class="fas fa-chevron-' + (isExpanded ? 'up' : 'down') + ' cat-sidebar__chevron"></i>' +
                '</button>' +
                subHtml +
            '</div>';
        }).join('');

        // Wire category buttons
        nav.querySelectorAll('.cat-sidebar__nav-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var slug = btn.dataset.catSlug;
                var name = btn.dataset.catName;

                if (_categorySlug === slug) {
                    // Already active — clicking again collapses and clears filter
                    _categorySlug    = null;
                    _categoryName    = null;
                    _subCategorySlug = null;
                    _subCategoryName = null;
                } else {
                    // Select this category, clear any subcategory
                    _categorySlug    = slug;
                    _categoryName    = name;
                    _subCategorySlug = null;
                    _subCategoryName = null;
                }

                _syncAllBtn();
                _renderNav();   // re-render to show/hide subcategories
                _reload();
            });
        });

        // Wire subcategory buttons
        nav.querySelectorAll('.cat-sidebar__sub-btn').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation(); // don't bubble to category button
                var slug    = btn.dataset.slug;
                var name    = btn.dataset.name;
                var catSlug = btn.dataset.catSlug;

                if (_subCategorySlug === slug) {
                    // Deselect subcategory — fall back to parent category filter
                    _subCategorySlug = null;
                    _subCategoryName = null;
                    // Keep parent category active
                } else {
                    _subCategorySlug = slug;
                    _subCategoryName = name;
                    // Ensure parent category is still set
                    if (!_categorySlug) {
                        _categorySlug = catSlug;
                        var catObj = groups.find(function(g) { return g.slug === catSlug; });
                        _categoryName = catObj ? catObj.name : catSlug;
                    }
                }

                _syncAllBtn();
                _renderNav();   // re-render to update active states
                _reload();

                // On mobile: close sidebar after selection
                if (window.innerWidth <= 768) {
                    var sidebar = document.getElementById('catSidebar');
                    var overlay = document.getElementById('catSidebarOverlay');
                    if (sidebar) sidebar.classList.remove('open');
                    if (overlay) overlay.classList.remove('open');
                }
            });
        });
    }

    // ── "All products" button ───────────────────────────────────────────
    if (allBtn) {
        allBtn.addEventListener('click', function() {
            _categorySlug    = null;
            _categoryName    = null;
            _subCategorySlug = null;
            _subCategoryName = null;
            _syncAllBtn();
            _renderNav();
            _reload(); // _reload will push /tienda since all slugs are null
        });
    }

    // ── Initial render ──────────────────────────────────────────────────
    // If a slug came from the URL, find which category it belongs to
    if (_categorySlug) {
        var urlCat = groups.find(function(g) { return g.slug === _categorySlug; });
        if (!urlCat) {
            // It might be a subcategory slug — find parent
            for (var gi = 0; gi < groups.length; gi++) {
                var sc = groups[gi].subCategories.find(function(s) { return s.slug === _categorySlug; });
                if (sc) {
                    _subCategorySlug = _categorySlug;
                    _subCategoryName = sc.name;
                    _categorySlug    = groups[gi].slug;
                    _categoryName    = groups[gi].name;
                    break;
                }
            }
        }
    }

    _syncAllBtn();
    _renderNav();

    // ── Mobile toggle ───────────────────────────────────────────────────
    var toggleBtn = document.getElementById('catSidebarToggle');
    var sidebar   = document.getElementById('catSidebar');
    if (toggleBtn && sidebar) {
        if (!document.getElementById('catSidebarOverlay')) {
            var overlay = document.createElement('div');
            overlay.id = 'catSidebarOverlay';
            overlay.className = 'cat-sidebar-overlay';
            overlay.addEventListener('click', function() {
                sidebar.classList.remove('open');
                overlay.classList.remove('open');
                toggleBtn.setAttribute('aria-expanded', 'false');
            });
            document.body.appendChild(overlay);
        }
        toggleBtn.addEventListener('click', function() {
            var isOpen = sidebar.classList.toggle('open');
            document.getElementById('catSidebarOverlay').classList.toggle('open', isOpen);
            toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
    }
}

/* ═══════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function() {
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
   PRODUCT DETAIL PAGE
   renderProductDetailPage(id) — called by router
   ═══════════════════════════════════════════════ */
window.renderProductDetailPage = async function(slug) {
    var root = document.getElementById('pdp-root');
    if (!root) return;
    root.innerHTML = '<div class="pdp2-loading"><i class="fas fa-spinner fa-spin"></i></div>';
    window.scrollTo(0, 0);
    var p;
    try { p = await window.getProductBySlug(slug); }
    catch (e) {
        root.innerHTML = '<div class="pdp2-error"><i class="fas fa-exclamation-triangle"></i><p>Error al cargar el producto.</p><button class="pdp2-back-btn" onclick="window.FilamorfosisRouter&&window.FilamorfosisRouter.navigate(\'/tienda\')"><i class="fas fa-arrow-left"></i> Volver</button></div>';
        return;
    }
    document.title = (p.titleEs || 'Producto') + ' | Filamorfosis\u00ae';
    var variants = p.variants || [];
    var imgs = (p.imageUrls && p.imageUrls.length) ? p.imageUrls : [];

    function _ep(v) {
        var now = new Date(), ep = v.price || 0;
        (v.discounts || []).forEach(function(d) {
            var s = d.startsAt ? new Date(d.startsAt) : null;
            var e = d.endsAt ? new Date(d.endsAt) : null;
            if ((!s || s <= now) && (!e || e >= now))
                ep = d.discountType === 'Percentage' ? ep * (1 - d.value / 100) : Math.max(0, ep - d.value);
        });
        if (v.effectivePrice > 0 && v.effectivePrice < ep) ep = v.effectivePrice;
        return ep;
    }

    var galleryHtml;
    if (imgs.length) {
        var thumbsHtml = imgs.map(function(src, i) {
            return '<button class="pdp2-thumb' + (i===0?' pdp2-thumb--active':'') + '" data-idx="'+i+'" data-src="'+resolveImageUrl(src)+'">' +
                '<img src="'+resolveImageUrl(src)+'" alt="'+(p.titleEs||'')+' '+(i+1)+'" loading="lazy"></button>';
        }).join('');
        galleryHtml = '<div class="pdp2-gallery">' +
            '<div class="pdp2-gallery__main">' +
                '<img src="'+resolveImageUrl(imgs[0])+'" alt="'+(p.titleEs||'')+'" id="pdp2MainImg" class="pdp2-gallery__main-img" loading="lazy">' +
                (imgs.length > 1
                    ? '<button class="pdp2-gallery__arrow pdp2-gallery__arrow--prev" id="pdp2Prev"><i class="fas fa-chevron-left"></i></button>' +
                      '<button class="pdp2-gallery__arrow pdp2-gallery__arrow--next" id="pdp2Next"><i class="fas fa-chevron-right"></i></button>'
                    : '') +
            '</div>' +
            (imgs.length > 1 ? '<div class="pdp2-gallery__thumbs">'+thumbsHtml+'</div>' : '') +
        '</div>';
    } else {
        galleryHtml = '<div class="pdp2-gallery"><div class="pdp2-gallery__main pdp2-gallery__main--placeholder">' +
            '<span class="pdp2-placeholder-icon">\uD83D\uDCE6</span><span class="pdp2-placeholder-text">Sin imagen</span></div></div>';
    }

    var variantsHtml = variants.length ? variants.map(function(v) {
        var avail = v.isAvailable !== false && v.inStock !== false;
        var ep = _ep(v), hasDis = avail && ep < v.price;
        var badge = !avail ? '<span class="pdp2-variant__badge">'+(v.inStock===false?'Agotado':'No disponible')+'</span>' : '';
        var priceHtml = avail
            ? (hasDis
                ? '<span class="pdp2-variant__price-orig">$'+Math.round(v.price)+'</span><span class="pdp2-variant__price-eff">$'+Math.round(ep)+' MXN</span>'
                : '<span class="pdp2-variant__price">$'+Math.round(ep)+' MXN</span>')
            : '<span class="pdp2-variant__price pdp2-variant__price--na">\u2014</span>';
        return '<div class="pdp2-variant'+(avail?'':' pdp2-variant--disabled')+'" data-variant-id="'+v.id+'" data-price="'+ep+'" data-accepts-design="'+(v.acceptsDesignFile?'1':'0')+'">' +
            '<button type="button" class="pdp2-variant__btn'+(avail?'':' pdp2-variant__btn--disabled')+'"'+(avail?'':' disabled')+' data-variant-id="'+v.id+'">' +
                '<span class="pdp2-variant__label">'+(v.labelEs||'')+'</span>'+badge +
            '</button>' +
            '<div class="pdp2-variant__right">' + priceHtml +
                (avail ? '<div class="pdp2-variant__qty pdp2-variant__qty--hidden">' +
                    '<button type="button" class="pdp2-qty-btn pdp2-qty-dec">\u2212</button>' +
                    '<input type="number" class="pdp2-qty-input" value="1" min="1" max="99">' +
                    '<button type="button" class="pdp2-qty-btn pdp2-qty-inc">+</button>' +
                '</div>' : '') +
            '</div>' +
            (v.acceptsDesignFile && avail
                ? '<div class="pdp2-variant__upload pdp2-variant__upload--hidden"><label class="pdp2-upload-label"><i class="fas fa-upload"></i> Subir dise\u00f1o<input type="file" class="pdp2-design-file" accept=".png,.jpg,.jpeg,.svg,.pdf" data-variant-id="'+v.id+'"></label></div>'
                : '') +
        '</div>';
    }).join('') : '<p class="pdp2-no-variants">Sin variantes disponibles.</p>';

    var tagsHtml = (p.tags && p.tags.length)
        ? '<div class="pdp2-tags">'+p.tags.map(function(tag){return '<span class="pdp2-tag">'+tag+'</span>';}).join('')+'</div>' : '';
    var badgeHtml = p.badge ? '<span class="pdp2-badge pdp2-badge--'+p.badge+'">'+(t('badge_'+p.badge)||p.badge)+'</span>' : '';

    root.innerHTML =
        '<div class="pdp2-page">' +
            '<div class="pdp2-breadcrumb">' +
                '<button class="pdp2-back-btn" id="pdp2Back"><i class="fas fa-arrow-left"></i> Tienda</button>' +
                '<span class="pdp2-breadcrumb__sep">/</span>' +
                '<span class="pdp2-breadcrumb__current">'+(p.titleEs||'')+'</span>' +
            '</div>' +
            '<div class="pdp2-layout">' +
                '<div class="pdp2-layout__gallery">'+galleryHtml+'</div>' +
                '<div class="pdp2-layout__info">' +
                    badgeHtml +
                    '<h1 class="pdp2-title">'+(p.titleEs||'')+'</h1>' +
                    '<p class="pdp2-desc">'+(p.descriptionEs||'')+'</p>' +
                    tagsHtml +
                    '<div class="pdp2-divider"></div>' +
                    '<p class="pdp2-variants-label">Elige tus variantes y la cantidad — durante el checkout podrás compartirnos tu diseño personalizado.</p>' +
                    '<div class="pdp2-variants" id="pdp2Variants">'+variantsHtml+'</div>' +
                    '<div class="pdp2-total-row">' +
                        '<span class="pdp2-total-label">Total</span>' +
                        '<span class="pdp2-total-amount" id="pdp2Total">$0 MXN</span>' +
                    '</div>' +
                    '<button class="pdp2-add-btn" id="pdp2AddBtn" disabled><i class="fas fa-cart-plus"></i> Agregar al carrito</button>' +
                    '<a class="pdp2-wa-btn" href="https://wa.me/13152071586?text='+encodeURIComponent('Hola! Me interesa: '+(p.titleEs||''))+'" target="_blank" rel="noopener"><i class="fab fa-whatsapp"></i> Consultar por WhatsApp</a>' +
                    '<div class="pdp2-trust">' +
                        '<span><i class="fas fa-shield-alt"></i> Pago seguro</span>' +
                        '<span><i class="fas fa-truck"></i> Env\u00edo a todo M\u00e9xico</span>' +
                        '<span><i class="fas fa-star"></i> Calidad garantizada</span>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>';

    var _cur = 0, _thumbBtns = Array.from(root.querySelectorAll('.pdp2-thumb')), _mainImg = root.querySelector('#pdp2MainImg');
    function _goImg(idx) {
        if (!imgs.length) return;
        _cur = (idx + imgs.length) % imgs.length;
        if (_mainImg) _mainImg.src = resolveImageUrl(imgs[_cur]);
        _thumbBtns.forEach(function(b,i){ b.classList.toggle('pdp2-thumb--active', i===_cur); });
    }
    _thumbBtns.forEach(function(b,i){ b.addEventListener('click', function(){ _goImg(i); }); });
    var pBtn = root.querySelector('#pdp2Prev'), nBtn = root.querySelector('#pdp2Next');
    if (pBtn) pBtn.addEventListener('click', function(){ _goImg(_cur-1); });
    if (nBtn) nBtn.addEventListener('click', function(){ _goImg(_cur+1); });
    if (_mainImg) _mainImg.addEventListener('error', function(){ this.src = _IMG_PLACEHOLDER; });

    var backBtn = root.querySelector('#pdp2Back');
    if (backBtn) backBtn.addEventListener('click', function(){
        if (window.FilamorfosisRouter) window.FilamorfosisRouter.navigate('/tienda');
        else window.history.back();
    });

    var _sel = {}, addBtn = root.querySelector('#pdp2AddBtn'), totalEl = root.querySelector('#pdp2Total');
    function _updateTotal() {
        var total = 0;
        Object.keys(_sel).forEach(function(vid) {
            var el = root.querySelector('.pdp2-variant[data-variant-id="'+vid+'"]');
            total += (el ? parseFloat(el.dataset.price)||0 : 0) * (_sel[vid]||1);
        });
        if (totalEl) totalEl.textContent = '$'+Math.round(total)+' MXN';
        if (addBtn) addBtn.disabled = Object.keys(_sel).length === 0;
    }

    root.querySelectorAll('.pdp2-variant__btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var vid = btn.dataset.variantId;
            var el = root.querySelector('.pdp2-variant[data-variant-id="'+vid+'"]');
            if (!el) return;
            var qtyWrap = el.querySelector('.pdp2-variant__qty');
            var upWrap  = el.querySelector('.pdp2-variant__upload');
            if (_sel[vid]) {
                delete _sel[vid];
                btn.classList.remove('pdp2-variant__btn--selected');
                el.classList.remove('pdp2-variant--selected');
                if (qtyWrap) qtyWrap.classList.add('pdp2-variant__qty--hidden');
                if (upWrap)  upWrap.classList.add('pdp2-variant__upload--hidden');
            } else {
                _sel[vid] = 1;
                btn.classList.add('pdp2-variant__btn--selected');
                el.classList.add('pdp2-variant--selected');
                if (qtyWrap) qtyWrap.classList.remove('pdp2-variant__qty--hidden');
                if (upWrap && el.dataset.acceptsDesign==='1') upWrap.classList.remove('pdp2-variant__upload--hidden');
                var qi = el.querySelector('.pdp2-qty-input'); if (qi) qi.value = 1;
            }
            _updateTotal();
        });
    });

    root.querySelectorAll('.pdp2-qty-dec').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var el = btn.closest('.pdp2-variant'), vid = el&&el.dataset.variantId, inp = el&&el.querySelector('.pdp2-qty-input');
            if (!inp||!vid) return;
            inp.value = Math.max(1,(parseInt(inp.value)||1)-1);
            if (_sel[vid]) { _sel[vid]=parseInt(inp.value); _updateTotal(); }
        });
    });
    root.querySelectorAll('.pdp2-qty-inc').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var el = btn.closest('.pdp2-variant'), vid = el&&el.dataset.variantId, inp = el&&el.querySelector('.pdp2-qty-input');
            if (!inp||!vid) return;
            inp.value = Math.min(99,(parseInt(inp.value)||1)+1);
            if (_sel[vid]) { _sel[vid]=parseInt(inp.value); _updateTotal(); }
        });
    });
    root.querySelectorAll('.pdp2-qty-input').forEach(function(inp) {
        inp.addEventListener('change', function() {
            var el = inp.closest('.pdp2-variant'), vid = el&&el.dataset.variantId;
            if (vid&&_sel[vid]) { _sel[vid]=Math.max(1,parseInt(inp.value)||1); _updateTotal(); }
        });
    });

    if (addBtn) {
        addBtn.addEventListener('click', async function() {
            var vids = Object.keys(_sel); if (!vids.length) return;
            addBtn.disabled = true;
            addBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Agregando...';
            var allOk = true;
            for (var i = 0; i < vids.length; i++) {
                var vid = vids[i], qty = _sel[vid]||1;
                var el = root.querySelector('.pdp2-variant[data-variant-id="'+vid+'"]');
                var df = el&&el.querySelector('.pdp2-design-file');
                var file = df&&df.files.length ? df.files[0] : null;
                try {
                    var res = await window.addToCart({ productVariantId: vid, quantity: qty });
                    if (file && res && res.id) { try { await window.uploadDesign(res.id, file); } catch(_){} }
                } catch(err) {
                    allOk = false;
                    if (err&&err.status===401 && window.FilamorfosisAuth) { window.FilamorfosisAuth.showModal('login'); break; }
                }
            }
            if (window.FilamorfosisCart&&window.FilamorfosisCart.loadCart) window.FilamorfosisCart.loadCart();
            addBtn.disabled = false;
            addBtn.innerHTML = '<i class="fas fa-cart-plus"></i> Agregar al carrito';
            _updateTotal();
        });
    }

    // Render reviews section — always pass the product UUID, not the slug
    if (window.ProductReviews && window.ProductReviews.renderReviewsSection) {
        window.ProductReviews.renderReviewsSection(p.id);
    }
};

window.renderProductDetail = window.renderProductDetailPage;