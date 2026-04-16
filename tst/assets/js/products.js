/* ══════════════════════════════════════════════
   CATALOG ENGINE — SPA MODE
   t() bridges to main.js unified translations
   ══════════════════════════════════════════════ */

// Bridge: use unified translations — reads window.currentLang set by main.js
function t(key) {
    const lang = window.currentLang || 'es';
    const tl = (window.translations && window.translations[lang]) || (typeof CAT_TRANSLATIONS !== 'undefined' && CAT_TRANSLATIONS[lang]);
    if (tl && tl[key] !== undefined) return tl[key];
    // fallback to ES
    const es = (window.translations && window.translations['es']) || (typeof CAT_TRANSLATIONS !== 'undefined' && CAT_TRANSLATIONS['es']);
    if (es && es[key] !== undefined) return es[key];
    return key;
}

// pT: get translated product field — uses window.currentLang
function pT(product, key) {
    const lang = window.currentLang || 'es';
    if (typeof PRODUCT_I18N !== 'undefined') {
        const i18n = PRODUCT_I18N[product.id];
        if (i18n && i18n[lang] && i18n[lang][key] !== undefined) return i18n[lang][key];
    }
    if (key === 'pricingRows') return product.pricing ? product.pricing.rows : [];
    return product[key];
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

/* ═══════════════════════════════════════════════
   FILAMORFOSIS® — CATALOG ENGINE
   Rendering logic. Data lives in products/data/catalog.js
   ═══════════════════════════════════════════════ */

// ── STATE ────────────────────────────────────────────────────────────────────
let activeCategory = 'uv';
let activeFilter   = 'all';
let searchQuery    = '';
let activeProduct  = null;
let activeVariant  = null;
let activeImgIdx   = 0;

// ── HELPERS ──────────────────────────────────────────────────────────────────
function filteredProducts() {
    const filterObj = typeof CURATED_FILTERS !== 'undefined'
        ? CURATED_FILTERS.find(f => f.id === activeFilter)
        : null;
    return PRODUCTS.filter(p => {
        const matchCat    = p.category === activeCategory;
        const matchFilter = activeFilter === 'all' || (filterObj ? filterObj.match(p) : false);
        const matchSearch = !searchQuery ||
            (pT(p,'title') || p.title).toLowerCase().includes(searchQuery) ||
            (pT(p,'desc')  || p.desc).toLowerCase().includes(searchQuery);
        return matchCat && matchFilter && matchSearch;
    });
}

function uniqueFilters(cat) {
    // Returns curated filters that have at least 1 matching product in this category
    if (typeof CURATED_FILTERS === 'undefined') return [];
    return CURATED_FILTERS.filter(f => {
        if (f.id === 'all') return true;
        return PRODUCTS.some(p => p.category === cat && f.match(p));
    });
}

function countByCategory(catId) {
    return PRODUCTS.filter(p => p.category === catId).length;
}

function lowestPrice(product) {
    if (!product.pricing || !product.pricing.rows) return null;
    const prices = product.pricing.rows
        .map(r => r.flat)
        .filter(p => p !== 'N/A' && p !== 'Cotizar')
        .map(p => parseInt(p.replace(/\D/g, '')))
        .filter(n => !isNaN(n));
    if (!prices.length) return 'Cotizar';
    return '$' + Math.min(...prices);
}

// ── RENDER TABS ───────────────────────────────────────────────────────────────
function renderTabs() {
    const el = document.getElementById('catTabs');
    el.innerHTML = CATEGORIES.map(c => `
        <button class="cat-tab ${c.id === activeCategory ? 'active' : ''}" data-cat="${c.id}">
            <span class="cat-tab-icon">${c.icon}</span>
            <span class="cat-tab-label">${c.label}</span>
            <span class="cat-tab-count">${countByCategory(c.id)}</span>
        </button>
    `).join('');
    el.querySelectorAll('.cat-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            activeCategory = btn.dataset.cat;
            activeFilter = 'all';
            searchQuery = '';
            document.getElementById('catSearch').value = '';
            renderAll();
        });
    });
}

// ── RENDER FILTER CHIPS ───────────────────────────────────────────────────────
function renderChips() {
    const el = document.getElementById('catFilterChips');
    const filters = uniqueFilters(activeCategory);
    el.innerHTML = filters.map(f =>
        `<button class="cat-chip ${activeFilter === f.id ? 'active' : ''}" data-filter="${f.id}">${t(f.labelKey)}</button>`
    ).join('');
    // Update search placeholder translation
    const searchEl = document.getElementById('catSearch');
    if (searchEl) searchEl.placeholder = t('search_placeholder');
    el.querySelectorAll('.cat-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            activeFilter = btn.dataset.filter;
            renderChips();
            renderGrid();
        });
    });
}

// ── RENDER SECTION HEADER ─────────────────────────────────────────────────────
function renderSectionHeader() {
    const cat = CATEGORIES.find(c => c.id === activeCategory);
    const count = filteredProducts().length;
    document.getElementById('catSectionTitle').textContent = `${cat.icon} ${cat.label}`;
    document.getElementById('catSectionDesc').textContent =
        `${count} ${count === 1 ? t('products_count_one') : t('products_count_many')}`;
}

// ── PURE HELPER: urgency signal logic ────────────────────────────────────────
// Exported for property-based testing.
// Returns true iff stockQuantity is defined and in [0, 5].
function shouldShowUrgency(stockQuantity) {
    return stockQuantity !== undefined && stockQuantity !== null && stockQuantity <= 5;
}

// Expose for tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { shouldShowUrgency };
}

// ── SKELETON LOADING ──────────────────────────────────────────────────────────
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

// ── RENDER GRID ───────────────────────────────────────────────────────────────
function renderGrid() {
    const grid  = document.getElementById('catGrid');
    const empty = document.getElementById('catEmpty');

    // 9.2 — show skeletons immediately, then replace with real cards async
    renderSkeletons(8);
    renderSectionHeader();

    setTimeout(() => {
        const prods = filteredProducts();
        renderSectionHeader();

        if (!prods.length) {
            grid.innerHTML = '';
            empty.style.display = 'block';
            return;
        }
        empty.style.display = 'none';

        grid.innerHTML = prods.map((p, i) => {
            // ── Card carousel ─────────────────────────────────────────────────
            const imgs = p.images && p.images.length ? p.images : null;
            let carouselHtml;
            if (imgs) {
                const slides = imgs.map((src, si) => `
                    <div class="cc-slide ${si === 0 ? 'active' : ''}" data-idx="${si}">
                        <img src="${src}" alt="${pT(p,'title') || p.title}" loading="lazy" data-emoji="${p.emoji}">
                    </div>`).join('');
                const dots = imgs.length > 1
                    ? `<div class="cc-dots">${imgs.map((_,si) => `<span class="cc-dot ${si===0?'active':''}" data-idx="${si}"></span>`).join('')}</div>`
                    : '';
                const arrows = imgs.length > 1
                    ? `<button class="cc-arrow cc-arrow--prev" type="button" aria-label="Anterior"><i class="fas fa-chevron-left"></i></button>
                       <button class="cc-arrow cc-arrow--next" type="button" aria-label="Siguiente"><i class="fas fa-chevron-right"></i></button>`
                    : '';
                carouselHtml = `<div class="cat-card-carousel" data-id="${p.id}">${slides}${arrows}${dots}</div>`;
            } else {
                carouselHtml = `<div class="cat-card-img-placeholder"><span class="ph-icon">${p.emoji}</span><span>${t('no_image')}</span></div>`;
            }

            // 9.3 — out-of-stock detection
            const isOutOfStock = p.isAvailable === false || p.outOfStock === true;

            // 9.5 — badge logic: hot/new from p.badge; rating badge or "Nuevo" fallback
            let imageBadgesHtml = '';

            // Existing badge (hot, new, promo, uv) — keep working
            if (p.badge === 'hot') {
                imageBadgesHtml += `<span class="badge badge-hot" style="position:absolute;top:12px;left:12px">🔥 ${t('badge_hot') || 'Más vendido'}</span>`;
            } else if (p.badge === 'new') {
                imageBadgesHtml += `<span class="badge badge-new" style="position:absolute;top:12px;left:12px">✨ ${t('badge_new') || 'Nuevo'}</span>`;
            } else if (p.badge === 'promo') {
                imageBadgesHtml += `<span class="cat-card-badge promo">${t('badge_promo') || 'Promo'}</span>`;
            } else if (p.badge === 'uv') {
                imageBadgesHtml += `<span class="cat-card-badge uv">UV</span>`;
            }

            // 9.3 — "Agotado" badge on image
            if (isOutOfStock) {
                imageBadgesHtml += `<span class="badge badge-error" style="position:absolute;top:12px;right:12px">Agotado</span>`;
            }

            // 9.5 — rating badge (purple) or "Nuevo" if no rating
            if (p.rating) {
                imageBadgesHtml += `<span class="badge badge-purple" style="position:absolute;bottom:10px;left:10px">⭐ ${p.rating}</span>`;
            } else if (!p.badge) {
                imageBadgesHtml += `<span class="badge badge-new" style="position:absolute;bottom:10px;left:10px">Nuevo</span>`;
            }

            const imgCount = p.images && p.images.length > 1
                ? `<span class="cat-card-imgs-count">📷 ${p.images.length}</span>` : '';

            const price = lowestPrice(p);

            // 9.6 — urgency signal below title
            const urgencyHtml = shouldShowUrgency(p.stockQuantity)
                ? `<div class="badge badge-warning" style="margin-bottom:8px;display:inline-flex">¡Solo quedan ${p.stockQuantity} en stock!</div>`
                : '';

            // 9.1 / 9.3 — CTA button: "Notificarme" (disabled) when out of stock, else "Ver detalles"
            const ctaHtml = isOutOfStock
                ? `<button class="cat-card-cta" disabled style="opacity:0.5;cursor:not-allowed"><i class="fas fa-bell"></i> Notificarme</button>`
                : `<button class="cat-card-cta"><i class="fas fa-eye"></i> ${t('see_details') || 'Ver detalles'}</button>`;

            return `
            <div class="cat-card" data-id="${p.id}" style="animation-delay:${i * 0.05}s">
                <div class="cat-card-img">
                    ${carouselHtml}
                    ${imageBadgesHtml}
                </div>
                <div class="cat-card-body">
                    <div class="cat-card-category">${CATEGORIES.find(c=>c.id===p.category)?.label || ''}</div>
                    <div class="cat-card-title">${pT(p,"title") || p.title}</div>
                    ${urgencyHtml}
                    <div class="cat-card-desc">${pT(p,"desc") || p.desc}</div>
                    <div class="cat-card-tags">${(pT(p,"tags")||p.tags).slice(0,4).map(tag=>`<span class="cat-card-tag">${tag}</span>`).join('')}</div>
                    <div class="cat-card-price-row">
                        <div>
                            <div class="cat-card-price-from">${t('from_label')}</div>
                            <div class="cat-card-price">${price || 'Cotizar'}</div>
                        </div>
                        <div class="cat-card-actions">
                            ${ctaHtml}
                        </div>
                    </div>
                </div>
            </div>`;
        }).join('');

        grid.querySelectorAll('.cat-card').forEach(card => {
            card.addEventListener('click', () => {
                openModal(card.dataset.id);
            });
        });

        // Handle broken images gracefully
        grid.querySelectorAll('.cat-card-img img').forEach(img => {
            img.addEventListener('error', function() {
                const emoji = this.dataset.emoji || '📦';
                const slide = this.closest('.cc-slide');
                if (slide) {
                    // Replace just the broken slide content, not the whole carousel
                    this.style.display = 'none';
                    const ph = document.createElement('div');
                    ph.className = 'cat-card-img-placeholder';
                    ph.innerHTML = `<span class="ph-icon">${emoji}</span>`;
                    slide.appendChild(ph);
                } else {
                    const container = this.closest('.cat-card-img');
                    if (container) container.innerHTML = `<div class="cat-card-img-placeholder"><span class="ph-icon">${emoji}</span></div>`;
                }
            });
        });

        // ── Init carousels ────────────────────────────────────────────────────
        grid.querySelectorAll('.cat-card-carousel').forEach(carousel => {
            const slides = carousel.querySelectorAll('.cc-slide');
            const dots   = carousel.querySelectorAll('.cc-dot');
            if (slides.length <= 1) return;

            let current = 0;
            let timer   = null;

            function goTo(idx) {
                slides[current].classList.remove('active');
                dots[current] && dots[current].classList.remove('active');
                current = (idx + slides.length) % slides.length;
                slides[current].classList.add('active');
                dots[current] && dots[current].classList.add('active');
            }

            function startAuto() {
                timer = setInterval(() => goTo(current + 1), 3000);
            }
            function stopAuto() { clearInterval(timer); }

            startAuto();

            // Arrows — stop propagation so card click doesn't fire
            carousel.querySelector('.cc-arrow--prev')?.addEventListener('click', e => {
                e.stopPropagation(); stopAuto(); goTo(current - 1); startAuto();
            });
            carousel.querySelector('.cc-arrow--next')?.addEventListener('click', e => {
                e.stopPropagation(); stopAuto(); goTo(current + 1); startAuto();
            });

            // Dots
            dots.forEach((dot, di) => {
                dot.addEventListener('click', e => {
                    e.stopPropagation(); stopAuto(); goTo(di); startAuto();
                });
            });

            // Pause on hover
            carousel.addEventListener('mouseenter', stopAuto);
            carousel.addEventListener('mouseleave', startAuto);
        });
    }, 0);
}

// ── MODAL ─────────────────────────────────────────────────────────────────────
function openModal(id) {
    const p = PRODUCTS.find(x => x.id === id);
    if (!p) return;
    activeProduct = p;
    // 10.2 — start with no variant selected when variants exist
    activeVariant = (p.variants && p.variants.length > 0) ? null : null;
    activeImgIdx  = 0;
    renderModal(p);
    const overlay = document.getElementById('catModal');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    // 10.12 — focus first interactive element inside modal
    setTimeout(() => {
        const firstFocusable = overlay.querySelector(
            'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (firstFocusable) firstFocusable.focus();
    }, 50);
}

// closeModal defined in bridge above

function renderModal(p) {
    const inner = document.getElementById('catModalInner');
    const hasTable = p.pricing && p.pricing.type === 'flat-relief' && p.pricing.rows && p.pricing.rows.length > 0;

    // ── Gallery ───────────────────────────────────────────────────────────────
    const mainImg = p.images && p.images[activeImgIdx]
        ? `<img src="${p.images[activeImgIdx]}" alt="${p.title}" id="modalMainImg" class="modal-img--fade" loading="lazy">`
        : `<div class="cat-modal-gallery-placeholder" style="font-size:4rem;display:flex;align-items:center;justify-content:center;height:100%">${p.emoji}</div>`;

    const thumbs = p.images && p.images.length > 1
        ? p.images.map((img, i) => `
            <div class="cat-modal-gallery-thumb ${i === activeImgIdx ? 'active' : ''}" data-idx="${i}">
                <img src="${img}" alt="${p.title} ${i+1}" loading="lazy">
            </div>`).join('')
        : '';

    // ── Pricing table: material rows × flat/relief columns, each with checkbox+qty ──
    const pricingHtml = hasTable ? `
        <div class="modal-table-section">
            <div class="modal-table-header">
                <span class="modal-table-title">Opciones disponibles</span>
                <span class="modal-table-hint" id="tableHint">Selecciona al menos una opción</span>
            </div>
            <div class="modal-price-table-wrap">
                <table class="modal-price-table">
                    <thead>
                        <tr>
                            <th class="mpt-col-mat">Material / Tamaño</th>
                            <th class="mpt-col-type">
                                <div class="mpt-type-head">
                                    <span class="price-label-flat">${t('modal_flat')}</span>
                                    <span class="mpt-type-sub">precio · seleccionar · cantidad</span>
                                </div>
                            </th>
                            <th class="mpt-col-type">
                                <div class="mpt-type-head">
                                    <span class="price-label-relief">${t('modal_relief')}</span>
                                    <span class="mpt-type-sub">precio · seleccionar · cantidad</span>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        ${p.pricing.rows.map((r, idx) => `
                        <tr class="modal-price-row" data-idx="${idx}" data-variant="${r.variant}">
                            <td class="mpt-col-mat">${r.variant}</td>
                            <td class="mpt-col-type">
                                <div class="mpt-cell">
                                    <span class="mpt-price price-flat">${r.flat}</span>
                                    ${r.flat !== 'N/A' && r.flat !== 'Cotizar' ? `
                                    <label class="mpt-check-label">
                                        <input type="checkbox" class="modal-row-check" data-idx="${idx}" data-type="flat" data-price="${r.flat}">
                                        <span class="mpt-check-box"></span>
                                    </label>
                                    <div class="mpt-qty" id="qty_flat_${p.id}_${idx}" style="display:none">
                                        <button class="mpt-qty-btn mpt-qty-dec" type="button">−</button>
                                        <span class="mpt-qty-val">1</span>
                                        <button class="mpt-qty-btn mpt-qty-inc" type="button">+</button>
                                    </div>` : `<span class="mpt-na">—</span>`}
                                </div>
                            </td>
                            <td class="mpt-col-type">
                                <div class="mpt-cell">
                                    <span class="mpt-price price-relief">${r.relief}</span>
                                    ${r.relief !== 'N/A' && r.relief !== 'Cotizar' ? `
                                    <label class="mpt-check-label">
                                        <input type="checkbox" class="modal-row-check" data-idx="${idx}" data-type="relief" data-price="${r.relief}">
                                        <span class="mpt-check-box"></span>
                                    </label>
                                    <div class="mpt-qty" id="qty_relief_${p.id}_${idx}" style="display:none">
                                        <button class="mpt-qty-btn mpt-qty-dec" type="button">−</button>
                                        <span class="mpt-qty-val">1</span>
                                        <button class="mpt-qty-btn mpt-qty-inc" type="button">+</button>
                                    </div>` : `<span class="mpt-na">—</span>`}
                                </div>
                            </td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>
            ${p.pricing.note ? `<p class="modal-pricing-note">${p.pricing.note}</p>` : ''}
        </div>` : '';

    // ── Features ──────────────────────────────────────────────────────────────
    const featHtml = p.features && p.features.length ? `
        <div class="cat-modal-features">
            <h4>${t('modal_features')}</h4>
            <div class="cat-feat-list">
                ${(pT(p,"features")||p.features).map(f => `<div class="cat-feat-item"><i class="fas fa-check-circle"></i>${f}</div>`).join('')}
            </div>
        </div>` : '';

    // ── Assemble — no gallery, features below CTA ────────────────────────────
    inner.innerHTML = `
        <div class="cat-modal-header">
            <div class="cat-modal-cat">${CATEGORIES.find(c=>c.id===p.category)?.label || ''}</div>
            <h2 class="cat-modal-title" id="catModalTitle">${p.emoji} ${pT(p,"title") || p.title}</h2>
            <div class="cat-modal-desc">${pT(p,"desc") || p.desc}</div>
        </div>
        ${pricingHtml}
        <div class="modal-cta-row">
            <button class="modal-cta-add" id="modalAddToCartBtn" disabled>
                <i class="fas fa-cart-plus"></i>
                <span id="cartBtnLabel">${hasTable ? 'Selecciona una opción' : (t('add_to_cart') || 'Agregar al carrito')}</span>
            </button>
            <button class="modal-cta-share" id="modalShareBtn">
                <i class="fas fa-share-alt"></i>
                <span>Compartir</span>
            </button>
        </div>
        ${featHtml}
        <details class="modal-help-details">
            <summary><i class="fas fa-question-circle"></i> ¿Necesitas ayuda?</summary>
            <div class="modal-help-details__body">
                <a class="modal-help-link" href="faq.html" target="_blank">
                    <i class="fas fa-circle-question" style="color:#fb923c"></i> Ver preguntas frecuentes
                </a>
                <a class="modal-help-link" href="javascript:void(0)" onclick="whatsapp('${(pT(p,'title')||p.title).replace(/'/g,"\\'")}')">
                    <i class="fab fa-whatsapp" style="color:#25d366"></i> Consultar por WhatsApp
                </a>
            </div>
        </details>`;

    // ── Accessibility ─────────────────────────────────────────────────────────
    const overlay = document.getElementById('catModal');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'catModalTitle');

    // ── Checkbox + qty logic: key = "idx__type" ───────────────────────────────
    const selections = new Map(); // "idx__type" → qty

    function _syncCartBtn() {
        const cartBtn = document.getElementById('modalAddToCartBtn');
        const labelEl = document.getElementById('cartBtnLabel');
        const hint    = document.getElementById('tableHint');
        if (selections.size > 0) {
            cartBtn.disabled = false;
            const total = [...selections.values()].reduce((s, q) => s + q, 0);
            labelEl.textContent = `Agregar ${total} al carrito`;
            if (hint) hint.style.opacity = '0';
        } else {
            cartBtn.disabled = true;
            labelEl.textContent = hasTable ? 'Selecciona una opción' : (t('add_to_cart') || 'Agregar al carrito');
            if (hint) hint.style.opacity = '1';
        }
    }

    inner.querySelectorAll('.modal-row-check').forEach(chk => {
        chk.addEventListener('change', () => {
            const key     = `${chk.dataset.idx}__${chk.dataset.type}`;
            const qtyId   = `qty_${chk.dataset.type}_${p.id}_${chk.dataset.idx}`;
            const stepper = document.getElementById(qtyId);
            const row     = chk.closest('.modal-price-row');
            if (chk.checked) {
                if (stepper) stepper.style.display = 'flex';
                selections.set(key, parseInt(stepper?.querySelector('.mpt-qty-val')?.textContent) || 1);
            } else {
                if (stepper) stepper.style.display = 'none';
                selections.delete(key);
            }
            // highlight row if any checkbox in it is checked
            const anyChecked = [...row.querySelectorAll('.modal-row-check')].some(c => c.checked);
            row.classList.toggle('selected', anyChecked);
            _syncCartBtn();
        });
    });

    inner.querySelectorAll('.mpt-qty-dec').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            const stepper = btn.closest('.mpt-qty');
            const valEl   = stepper.querySelector('.mpt-qty-val');
            const chk     = stepper.closest('td').querySelector('.modal-row-check');
            const key     = `${chk.dataset.idx}__${chk.dataset.type}`;
            let qty = parseInt(valEl.textContent) || 1;
            if (qty > 1) { qty--; valEl.textContent = qty; selections.set(key, qty); _syncCartBtn(); }
        });
    });

    inner.querySelectorAll('.mpt-qty-inc').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            const stepper = btn.closest('.mpt-qty');
            const valEl   = stepper.querySelector('.mpt-qty-val');
            const chk     = stepper.closest('td').querySelector('.modal-row-check');
            const key     = `${chk.dataset.idx}__${chk.dataset.type}`;
            let qty = parseInt(valEl.textContent) || 1;
            qty++; valEl.textContent = qty; selections.set(key, qty); _syncCartBtn();
        });
    });

    // ── Cart button ───────────────────────────────────────────────────────────
    const cartBtn = document.getElementById('modalAddToCartBtn');
    if (cartBtn) {
        cartBtn.addEventListener('click', () => {
            if (selections.size === 0) {
                const hint = document.getElementById('tableHint');
                if (hint) { hint.style.opacity = '1'; hint.style.animation = 'none'; hint.offsetHeight; hint.style.animation = 'shake 0.4s ease'; }
                return;
            }
            if (!window.FilamorfosisCart) return;
            selections.forEach((qty, key) => {
                const [idx, type] = key.split('__');
                const row = inner.querySelector(`.modal-price-row[data-idx="${idx}"]`);
                if (!row) return;
                const variantId = `${activeProduct.id}__${row.dataset.variant}__${type}`;
                window.FilamorfosisCart.addItem(variantId, qty);
            });
        });
    }

    // ── Share button ──────────────────────────────────────────────────────────
    const shareBtn = document.getElementById('modalShareBtn');
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            const url = window.location.href.split('#')[0] + '#product=' + p.id;
            const copy = navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.resolve(document.execCommand('copy', false, url));
            copy.then(() => { if (window.Toast) window.Toast.show({ message: '¡Enlace copiado!', type: 'success' }); })
                .catch(() => {
                    try {
                        const ta = document.createElement('textarea');
                        ta.value = url; ta.style.cssText = 'position:fixed;opacity:0';
                        document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
                        if (window.Toast) window.Toast.show({ message: '¡Enlace copiado!', type: 'success' });
                    } catch (_) {}
                });
        });
    }

    // ── Focus trap ────────────────────────────────────────────────────────────
    overlay.addEventListener('keydown', _modalFocusTrap);
}

// ── Design file handler (10.5) ────────────────────────────────────────────────
function handleDesignFile(file, inputEl, previewEl) {
    const MAX_MB = 20 * 1024 * 1024;
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'application/pdf'];
    const zone = inputEl.closest('.design-upload-zone');
    // Clear previous error
    const prevErr = zone.querySelector('.design-upload-zone__error');
    if (prevErr) prevErr.remove();

    if (file.size > MAX_MB) {
        inputEl.value = '';
        previewEl.style.display = 'none';
        const err = document.createElement('p');
        err.className = 'design-upload-zone__error';
        err.textContent = 'El archivo supera el límite de 20 MB.';
        zone.appendChild(err);
        return;
    }
    if (!allowed.includes(file.type)) {
        inputEl.value = '';
        previewEl.style.display = 'none';
        const err = document.createElement('p');
        err.className = 'design-upload-zone__error';
        err.textContent = 'Formato no soportado. Usa PNG, JPG, SVG o PDF.';
        zone.appendChild(err);
        return;
    }

    previewEl.innerHTML = '';
    previewEl.style.display = 'block';

    if (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/jpg') {
        const reader = new FileReader();
        reader.onload = e => {
            const div = document.createElement('div');
            div.className = 'design-upload-zone__preview';
            div.innerHTML = `<img src="${e.target.result}" alt="Vista previa del diseño">`;
            previewEl.appendChild(div);
        };
        reader.readAsDataURL(file);
    } else {
        // SVG or PDF — show icon + name
        const iconClass = file.type === 'application/pdf' ? 'fa-file-pdf' : 'fa-file-code';
        const div = document.createElement('div');
        div.className = 'design-upload-zone__preview';
        div.innerHTML = `
            <div class="design-upload-zone__file-icon">
                <i class="fas ${iconClass}"></i>
                <span>${file.name}</span>
            </div>`;
        previewEl.appendChild(div);
    }
}

// ── Focus trap for modal (10.12) ──────────────────────────────────────────────
function _modalFocusTrap(e) {
    if (e.key !== 'Tab') return;
    const overlay = document.getElementById('catModal');
    const focusable = Array.from(overlay.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
    )).filter(el => el.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
}

function cotizar(title) {
    window.location.hash = '#contact';
}
function whatsapp(title) {
    const msg = encodeURIComponent(`Hola! Me interesa cotizar: ${title}`);
    window.open(`https://wa.me/13152071586?text=${msg}`, '_blank');
}

// ── ADD-TO-CART HELPERS ───────────────────────────────────────────────────────
// Called from modal "Agregar al carrito" button — respects selected variant
window._catModalAddToCart = function() {
    if (!activeProduct) return;
    const variantId = activeVariant
        ? `${activeProduct.id}__${activeVariant}`
        : activeProduct.id;
    if (window.FilamorfosisCart) {
        window.FilamorfosisCart.addItem(variantId, 1);
    }
};

// Expose setActiveCategory for URL param pre-selection
window.setActiveCategory = function(catId) {
    activeCategory = catId;
    activeFilter = 'all';
    renderAll();
};

// ── STAT COUNTER ANIMATION ────────────────────────────────────────────────────
// animateCounter defined in bridge above

// ── RENDER ALL ────────────────────────────────────────────────────────────────
function renderAll() {
    renderTabs();
    renderChips();
    renderGrid();
}

// ── INIT ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // In SPA mode, renderAll() is called by the router when #catalog is activated.
    // initLangSelector is a no-op (main.js handles language).
    // This DOMContentLoaded is kept for standalone products.html compatibility only.

    // Search
    document.getElementById('catSearch').addEventListener('input', e => {
        searchQuery = e.target.value.toLowerCase().trim();
        renderGrid();
    });

    // Modal close
    document.getElementById('catModalClose').addEventListener('click', closeModal);
    document.getElementById('catModal').addEventListener('click', e => {
        if (e.target === document.getElementById('catModal')) closeModal();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

    // Sticky tabs shadow on scroll
    window.addEventListener('scroll', () => {
        const wrap = document.getElementById('catTabsWrap');
        wrap.style.boxShadow = window.scrollY > 100 ? '0 4px 30px rgba(0,0,0,0.4)' : 'none';
    });
});
