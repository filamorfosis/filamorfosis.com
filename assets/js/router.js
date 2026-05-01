/**
 * router.js
 * Filamorfosis® — Lightweight SPA Router
 *
 * Uses the History API (pushState / popstate) for clean URLs.
 * Each route maps a pathname to a template id and an optional
 * init callback that runs after the template is stamped into #app-view.
 *
 * SEO: each navigation updates <title> and <meta name="description">
 * so crawlers that execute JS see the correct metadata per route.
 *
 * Public API (window.FilamorfosisRouter):
 *   navigate(path)  — programmatic navigation (pushState + render)
 *   current()       — returns the current pathname string
 */
(function (window) {
    'use strict';

    /* ── Route definitions ──────────────────────────────────────────────── */
    var routes = [
        {
            path: '/',
            templateId: 'tpl-inicio',
            title: 'Filamorfosis® | Impresión 3D, UV y Láser en México',
            description: 'Transforma tus ideas en realidad con Filamorfosis®. Impresión 3D, UV, corte láser, escaneo 3D y más. Calidad garantizada, entregas rápidas en México.',
            bodyClass: 'page-inicio',
            init: function () {
                _initWhatsApp();
                _initPromoBanner();
                _reApplyLang();
            }
        },
        {
            path: '/tienda',
            templateId: 'tpl-tienda',
            title: 'Tienda | Filamorfosis®',
            description: 'Explora nuestro catálogo de productos personalizados: impresión 3D, UV, corte láser y más.',
            bodyClass: 'page-tienda',
            init: function () {
                _initWhatsApp();
                _initPromoBanner();
                _initCatalog();
                _reApplyLang();
            }
        },
        {
            path: '/servicios',
            templateId: 'tpl-servicios',
            title: 'Servicios | Filamorfosis®',
            description: 'Conoce todos nuestros servicios: impresión 3D, UV, corte láser, escaneo 3D e impresión fotográfica.',
            bodyClass: 'page-servicios',
            init: function () {
                _initWhatsApp();
                _initShowcase();
                _reApplyLang();
                // Honour ?tab= query param
                var tab = new URLSearchParams(window.location.search).get('tab');
                if (tab && typeof window.activateShowcaseTab === 'function') {
                    window.activateShowcaseTab(tab);
                }
            }
        },
        {
            path: '/conocenos',
            templateId: 'tpl-conocenos',
            title: 'Conócenos | Filamorfosis®',
            description: 'Conoce la historia y el equipo detrás de Filamorfosis®, tu aliado en fabricación digital en México.',
            bodyClass: 'page-conocenos',
            init: function () {
                _initWhatsApp();
                _reApplyLang();
            }
        },
        {
            path: '/faq',
            templateId: 'tpl-faq',
            title: 'Preguntas Frecuentes | Filamorfosis®',
            description: 'Resolvemos tus dudas sobre pedidos, materiales, tiempos de entrega y más.',
            bodyClass: 'page-faq',
            init: function () {
                _reApplyLang();
            }
        }
    ];

    /* ── Init helpers ───────────────────────────────────────────────────── */

    function _initWhatsApp() {
        // whatsapp-fab.js exposes window.initWhatsAppFAB (capital A)
        if (typeof window.initWhatsAppFAB === 'function') {
            window.initWhatsAppFAB();
        }
    }

    function _initPromoBanner() {
        if (typeof window.initPromoBanner === 'function') {
            window.initPromoBanner();
        }
    }

    function _initCatalog() {
        // Reset catalog state so it re-fetches for the new DOM
        window._catalogInited = false;
        if (typeof window.renderAll === 'function') {
            window.renderAll();
        }
        // Honour ?category= query param
        var cat = new URLSearchParams(window.location.search).get('category');
        if (cat && typeof window.setActiveCategory === 'function') {
            // Give renderAll a moment to stamp the DOM before filtering
            setTimeout(function () {
                window.setActiveCategory(cat);
            }, 150);
        }
    }

    function _initShowcase() {
        // main.js exposes window.initShowcase after our patch
        if (typeof window.initShowcase === 'function') {
            window.initShowcase();
        }
    }

    /**
     * Re-applies the current language after a route swap so all
     * data-translate / data-t attributes in the new content are translated.
     */
    function _reApplyLang() {
        var lang = window.currentLang || localStorage.getItem('preferredLanguage') || 'es';
        if (typeof window.switchLanguage === 'function') {
            window.switchLanguage(lang);
        }
    }

    /* ── Route matching ─────────────────────────────────────────────────── */

    /**
     * Finds the route object for a given pathname.
     * Falls back to the '/' route if no match is found.
     * @param {string} pathname
     * @returns {Object}
     */
    function _matchRoute(pathname) {
        var p = pathname.replace(/\/$/, '') || '/';
        for (var i = 0; i < routes.length; i++) {
            if (routes[i].path === p) { return routes[i]; }
        }
        return routes[0]; // default to home
    }

    /* ── Render ─────────────────────────────────────────────────────────── */

    /**
     * Stamps the template content into #app-view, updates metadata,
     * updates the active nav link, and calls the route's init callback.
     * @param {Object} route
     */
    function _render(route) {
        var appView = document.getElementById('app-view');
        var tpl = document.getElementById(route.templateId);

        if (!appView || !tpl) { return; }

        // Swap content
        appView.innerHTML = '';
        appView.appendChild(document.importNode(tpl.content, true));

        // Update <title> and meta description
        document.title = route.title;
        var metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) { metaDesc.setAttribute('content', route.description); }

        // Update canonical link
        var canonical = document.querySelector('link[rel="canonical"]');
        if (canonical) {
            canonical.setAttribute('href', window.location.origin + route.path);
        }

        // Update body class for page-specific CSS hooks
        document.body.className = document.body.className
            .replace(/\bpage-\S+/g, '')
            .trim();
        if (route.bodyClass) {
            document.body.classList.add(route.bodyClass);
        }

        // Update active state on nav links
        _updateActiveNavLinks(route.path);

        // Scroll to top unless there's a hash anchor
        if (!window.location.hash) {
            window.scrollTo(0, 0);
        }

        // Run route-specific init
        if (typeof route.init === 'function') {
            route.init();
        }

        // Handle hash anchors (e.g. /conocenos#contact)
        if (window.location.hash) {
            var target = document.querySelector(window.location.hash);
            if (target) {
                setTimeout(function () {
                    target.scrollIntoView({ behavior: 'smooth' });
                }, 120);
            }
        }
    }

    /* ── Active nav link ────────────────────────────────────────────────── */

    function _updateActiveNavLinks(path) {
        // Plain links with data-route
        var allLinks = document.querySelectorAll(
            '.site-nav__link[data-route], .mobile-nav__link[data-route]'
        );
        allLinks.forEach(function (link) {
            var linkPath = link.getAttribute('data-route');
            if (linkPath === path) {
                link.classList.add('is-active');
                link.setAttribute('aria-current', 'page');
            } else {
                link.classList.remove('is-active');
                link.removeAttribute('aria-current');
            }
        });

        // Mega-menu <li> items with data-route
        var megaItems = document.querySelectorAll('.site-nav__item[data-route]');
        megaItems.forEach(function (li) {
            var liPath = li.getAttribute('data-route');
            if (liPath === path) {
                li.classList.add('is-active');
            } else {
                li.classList.remove('is-active');
            }
        });
    }

    /* ── Public navigate ────────────────────────────────────────────────── */

    function navigate(path) {
        var current = window.location.pathname + window.location.search + window.location.hash;
        if (path === current) { return; }
        window.history.pushState({}, '', path);
        _render(_matchRoute(window.location.pathname));
    }

    /* ── Event listeners ────────────────────────────────────────────────── */

    // Browser back / forward
    window.addEventListener('popstate', function () {
        _render(_matchRoute(window.location.pathname));
    });

    // Intercept same-origin <a> clicks
    document.addEventListener('click', function (e) {
        var link = e.target.closest('a[href]');
        if (!link) { return; }

        var href = link.getAttribute('href');
        if (!href) { return; }

        // Skip external, mailto, tel, javascript:, hash-only
        if (/^(https?:|mailto:|tel:|javascript:|#)/.test(href)) { return; }

        // Skip links that opt out of SPA routing
        if (link.hasAttribute('data-no-spa')) { return; }

        // Skip non-SPA pages
        var skipPages = ['account.html', 'admin.html', 'order-confirmation.html'];
        for (var i = 0; i < skipPages.length; i++) {
            if (href.indexOf(skipPages[i]) !== -1) { return; }
        }

        var url;
        try { url = new URL(href, window.location.origin); } catch (err) { return; }
        if (url.origin !== window.location.origin) { return; }

        // Only intercept if it matches a known route
        var matched = _matchRoute(url.pathname);
        if (matched) {
            e.preventDefault();
            navigate(url.pathname + url.search + url.hash);
        }
    });

    /* ── Initial render ─────────────────────────────────────────────────── */

    document.addEventListener('DOMContentLoaded', function () {
        _render(_matchRoute(window.location.pathname));
    });

    /* ── Public API ─────────────────────────────────────────────────────── */

    window.FilamorfosisRouter = {
        navigate: navigate,
        current: function () { return window.location.pathname; }
    };

}(window));
