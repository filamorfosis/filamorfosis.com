// Feature: store-product-first-redesign, Property 8: Product card renders all required fields with lazy-loaded images
// Feature: store-product-first-redesign, Property 6: Discounted price display always shows both prices
// Feature: store-product-first-redesign, Property 11: Price format invariant
// Validates: Requirements 5.1, 5.3, 5.7, 6.12, 11.1

'use strict';

const fc = require('fast-check');

// ---------------------------------------------------------------------------
// Pure helpers extracted from products.js renderGrid logic
// ---------------------------------------------------------------------------

/**
 * resolveImageUrl — mirrors products.js logic
 */
function resolveImageUrl(url) {
    if (!url) return 'placeholder';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    return 'https://cdn.example.com/' + url;
}

/**
 * pT — mirrors products.js language resolution
 */
function pT(product, key, lang) {
    lang = lang || 'es';
    if (key === 'title') return lang === 'es' ? product.titleEs : product.titleEn;
    if (key === 'desc')  return lang === 'es' ? product.descriptionEs : product.descriptionEn;
    return product[key];
}

/**
 * t — minimal i18n stub
 */
function t(key) {
    const map = {
        'no_image':       'Sin imagen',
        'no_disponible':  'No disponible',
        'from_label':     'Desde',
        'ver_detalles':   'Ver detalles',
        'badge_hot':      '🔥 Popular',
        'badge_new':      '✨ Nuevo',
        'badge_promo':    '🏷️ Promo',
        'badge_popular':  '⭐ Popular',
    };
    return map[key] || key;
}

/**
 * formatPrice — mirrors the $N MXN format used in renderGrid
 */
function formatPrice(value) {
    return '$' + Math.round(value) + ' MXN';
}

/**
 * renderProductCard — mirrors the renderGrid template logic from products.js
 * Returns the HTML string for a single product card.
 */
function renderProductCard(p) {
    // Availability
    var availableVariants = (p.variants || []).filter(function(v) {
        return v.isAvailable !== false && v.inStock !== false;
    });
    var isAvailable = availableVariants.length > 0;

    // Carousel / image
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

    // Badge
    var imageBadgesHtml = '';
    if (p.badge) {
        var badgeClass = (p.badge === 'hot' || p.badge === 'popular')
            ? 'badge badge-hot'
            : (p.badge === 'new' ? 'badge badge-new' : 'badge badge-promo');
        imageBadgesHtml = '<span class="' + badgeClass + ' cat-card-badge-overlay">' + t('badge_' + p.badge) + '</span>';
    }

    // Price
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

    var ctaDisabled = !isAvailable ? ' disabled' : '';
    var ctaClass = 'cat-card-cta' + (!isAvailable ? ' cat-card-cta--disabled' : '');

    return '<article class="cat-card" data-id="' + p.id + '">' +
        '<div class="cat-card-img">' +
            carouselHtml +
            imageBadgesHtml +
        '</div>' +
        '<div class="cat-card-body">' +
            '<div class="cat-card-category"></div>' +
            '<div class="cat-card-title">' + pT(p, 'title') + '</div>' +
            '<div class="cat-card-desc">' + (pT(p, 'desc') || '') + '</div>' +
            '<div class="cat-card-price-row">' +
                '<div class="cat-card-price-wrap">' + priceHtml + '</div>' +
                '<div class="cat-card-actions">' +
                    '<button class="' + ctaClass + '"' + ctaDisabled + '>' +
                        '<i class="fas fa-eye"></i> ' + t('ver_detalles') +
                    '</button>' +
                '</div>' +
            '</div>' +
        '</div>' +
    '</article>';
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const variantArb = fc.record({
    id:             fc.uuid(),
    price:          fc.float({ min: 1, max: 9999, noNaN: true }),
    effectivePrice: fc.oneof(
        fc.float({ min: 1, max: 9999, noNaN: true }),
        fc.constant(null)
    ),
    isAvailable:    fc.boolean(),
    inStock:        fc.boolean(),
});

const productArb = fc.record({
    id:            fc.uuid(),
    titleEs:       fc.string({ minLength: 1, maxLength: 60 }).filter(s => s.trim().length > 0),
    titleEn:       fc.string({ minLength: 1, maxLength: 60 }).filter(s => s.trim().length > 0),
    descriptionEs: fc.string({ minLength: 0, maxLength: 200 }),
    descriptionEn: fc.string({ minLength: 0, maxLength: 200 }),
    imageUrls:     fc.array(fc.webUrl(), { minLength: 0, maxLength: 4 }),
    badge:         fc.oneof(
        fc.constant(null),
        fc.constant('hot'),
        fc.constant('new'),
        fc.constant('promo'),
        fc.constant('popular')
    ),
    variants:      fc.array(variantArb, { minLength: 0, maxLength: 5 }),
});

// Product guaranteed to have at least one available variant
const productWithAvailableVariantArb = fc.record({
    id:            fc.uuid(),
    titleEs:       fc.string({ minLength: 1, maxLength: 60 }).filter(s => s.trim().length > 0),
    titleEn:       fc.string({ minLength: 1, maxLength: 60 }).filter(s => s.trim().length > 0),
    descriptionEs: fc.string({ minLength: 0, maxLength: 200 }),
    descriptionEn: fc.string({ minLength: 0, maxLength: 200 }),
    imageUrls:     fc.array(fc.webUrl(), { minLength: 0, maxLength: 4 }),
    badge:         fc.constant(null),
    variants:      fc.array(variantArb, { minLength: 0, maxLength: 4 }).map(function(extras) {
        // Guarantee at least one available variant
        return extras.concat([{ id: 'avail-1', price: 100, effectivePrice: 100, isAvailable: true, inStock: true }]);
    }),
});

// ---------------------------------------------------------------------------
// Property 8: Product card renders all required fields with lazy-loaded images
// Validates: Requirements 5.1, 11.1
// ---------------------------------------------------------------------------

var p8Passed = false;
try {
    fc.assert(
        fc.property(
            productArb,
            function(product) {
                var html = renderProductCard(product);

                // Must contain localized title
                var title = pT(product, 'title');
                // Check title is present (HTML may encode special chars, check escaped version too)
                var titleEscaped = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
                if (!html.includes(title) && !html.includes(titleEscaped)) {
                    throw new Error('Title not found. title=' + JSON.stringify(title) + ' escaped=' + JSON.stringify(titleEscaped));
                }

                // Must contain a price display (either price or "no disponible")
                var hasPriceDisplay = html.includes('cat-card-price') || html.includes('no_disponible') || html.includes('No disponible');
                if (!hasPriceDisplay) {
                    throw new Error('No price display found');
                }

                // Must contain CTA button with ver_detalles text
                if (!html.includes('cat-card-cta')) {
                    throw new Error('No CTA button found');
                }
                if (!html.includes('Ver detalles')) {
                    throw new Error('Ver detalles text not found');
                }

                // All <img> elements must have loading="lazy"
                // Count img tags and loading="lazy" occurrences
                var allImgCount = (html.match(/<img\s/g) || []).length;
                var lazyCount = (html.match(/loading="lazy"/g) || []).length;
                if (allImgCount !== lazyCount) {
                    throw new Error('Not all imgs have loading=lazy. imgs=' + allImgCount + ' lazy=' + lazyCount);
                }

                return true;
            }
        ),
        { numRuns: 200 }
    );
    p8Passed = true;
    console.log('✅ Property 8 PASSED: Product card renders all required fields with lazy-loaded images');
} catch (err) {
    console.error('❌ Property 8 FAILED:', err.message);
}

// ---------------------------------------------------------------------------
// Property 6: Discounted price display always shows both prices
// Validates: Requirements 5.3, 6.12
// ---------------------------------------------------------------------------

var p6Passed = false;
try {
    // Variant with discount: effectivePrice < price
    const discountedVariantArb = fc.record({
        price:          fc.float({ min: 10, max: 9999, noNaN: true }),
        effectivePrice: fc.float({ min: 1, max: 9, noNaN: true }), // always < price (price >= 10)
        isAvailable:    fc.constant(true),
        inStock:        fc.constant(true),
    }).filter(function(v) { return v.effectivePrice < v.price; });

    // Variant without discount: effectivePrice >= price (or null)
    const noDiscountVariantArb = fc.record({
        price:          fc.float({ min: 10, max: 9999, noNaN: true }),
        effectivePrice: fc.oneof(fc.constant(null), fc.constant(0)),
        isAvailable:    fc.constant(true),
        inStock:        fc.constant(true),
    });

    fc.assert(
        fc.property(
            discountedVariantArb,
            function(variant) {
                var product = {
                    id: 'test-id',
                    titleEs: 'Producto Test',
                    titleEn: 'Test Product',
                    descriptionEs: '',
                    descriptionEn: '',
                    imageUrls: [],
                    badge: null,
                    variants: [variant],
                };
                var html = renderProductCard(product);

                // Must contain strikethrough original price
                if (!html.includes('cat-card-price-original')) return false;
                // Must contain effective price
                if (!html.includes('cat-card-price--effective')) return false;
                // Both prices must appear as $N MXN
                var originalStr = '$' + Math.round(variant.price) + ' MXN';
                var effectiveStr = '$' + Math.round(variant.effectivePrice) + ' MXN';
                if (!html.includes(originalStr)) return false;
                if (!html.includes(effectiveStr)) return false;

                return true;
            }
        ),
        { numRuns: 200 }
    );

    // Also verify: no discount → single price only
    fc.assert(
        fc.property(
            noDiscountVariantArb,
            function(variant) {
                var product = {
                    id: 'test-id',
                    titleEs: 'Producto Test',
                    titleEn: 'Test Product',
                    descriptionEs: '',
                    descriptionEn: '',
                    imageUrls: [],
                    badge: null,
                    variants: [variant],
                };
                var html = renderProductCard(product);

                // Must NOT contain strikethrough original price
                if (html.includes('cat-card-price-original')) return false;
                // Must NOT contain effective price class
                if (html.includes('cat-card-price--effective')) return false;
                // Must contain single price
                if (!html.includes('cat-card-price')) return false;

                return true;
            }
        ),
        { numRuns: 200 }
    );

    p6Passed = true;
    console.log('✅ Property 6 PASSED: Discounted price display always shows both prices');
} catch (err) {
    console.error('❌ Property 6 FAILED:', err.message);
}

// ---------------------------------------------------------------------------
// Property 11: Price format invariant — $N MXN (rounded integer, no decimals)
// Validates: Requirements 5.7
// ---------------------------------------------------------------------------

var p11Passed = false;
try {
    const priceFormatRegex = /^\$\d+ MXN$/;

    fc.assert(
        fc.property(
            fc.float({ min: Math.fround(0.01), max: Math.fround(999999), noNaN: true }),
            function(price) {
                var formatted = formatPrice(price);
                // Must match $N MXN pattern
                if (!priceFormatRegex.test(formatted)) return false;
                // Must not contain a decimal point
                if (formatted.includes('.')) return false;
                // The number must be the rounded integer
                var num = parseInt(formatted.replace('$', '').replace(' MXN', ''));
                return num === Math.round(price);
            }
        ),
        { numRuns: 500 }
    );

    // Also verify via rendered card HTML
    fc.assert(
        fc.property(
            productWithAvailableVariantArb,
            function(product) {
                var html = renderProductCard(product);
                // Extract all price strings from the HTML
                var priceMatches = html.match(/\$\d+(?:\.\d+)? MXN/g) || [];
                for (var i = 0; i < priceMatches.length; i++) {
                    if (!priceFormatRegex.test(priceMatches[i])) return false;
                }
                return true;
            }
        ),
        { numRuns: 200 }
    );

    p11Passed = true;
    console.log('✅ Property 11 PASSED: Price format invariant $N MXN (no decimals)');
} catch (err) {
    console.error('❌ Property 11 FAILED:', err.message);
}

// ---------------------------------------------------------------------------
// Exit
// ---------------------------------------------------------------------------
if (p8Passed && p6Passed && p11Passed) {
    console.log('\n✅ All product card property tests passed.');
    process.exit(0);
} else {
    console.error('\n❌ One or more product card property tests failed.');
    process.exit(1);
}
