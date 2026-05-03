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
                _initClients();
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
                _initClients();
                _reApplyLang();
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

    function _initClients() {
        if (typeof window.initClientsMarquee === 'function') {
            window.initClientsMarquee();
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

        // Extract category slug from path (/tienda/slug) or legacy ?category= param
        var pathParts = window.location.pathname.split('/');
        var slugFromPath = (pathParts[1] === 'tienda' && pathParts[2]) ? pathParts[2] : null;
        var slugFromQuery = new URLSearchParams(window.location.search).get('category');
        var categorySlug = slugFromPath || slugFromQuery || null;

        // Pass slug to catalog engine before rendering
        if (typeof window.setCategorySlug === 'function') {
            window.setCategorySlug(categorySlug);
        }

        if (typeof window.renderAll === 'function') {
            window.renderAll();
        }
    }

    function _initShowcase() {
        // main.js exposes window.initShowcase after our patch
        if (typeof window.initShowcase === 'function') {
            window.initShowcase();
        }

        // Populate the sticky service nav bar from cached processes (or fetch)
        if (window.FilamorfosisNav && window.FilamorfosisNav.ProcessService) {
            var ps = window.FilamorfosisNav.ProcessService;
            if (ps._cache !== null) {
                // Already cached — render immediately
                ps.renderIntoStickyNav(ps._cache);
            } else {
                // Fetch and render (also populates megamenu cache for later)
                ps.load();
            }
        }

        // Extract process slug from path (/servicios/slug) or legacy ?tab= param
        var pathParts = window.location.pathname.split('/');
        var slugFromPath = (pathParts[1] === 'servicios' && pathParts[2]) ? pathParts[2] : null;
        var tabFromQuery = new URLSearchParams(window.location.search).get('tab');
        var activeSlug = slugFromPath || tabFromQuery || null;

        if (activeSlug) {
            // Try to resolve slug → tab ID via data-process-slug on panels
            var tabId = _resolveSlugToTab(activeSlug) || activeSlug;
            if (typeof window.activateShowcaseTab === 'function') {
                setTimeout(function () {
                    window.activateShowcaseTab(tabId);
                    // Also update sticky card active state
                    if (window.FilamorfosisNav && window.FilamorfosisNav.ProcessService) {
                        window.FilamorfosisNav.ProcessService._activateStickyCard(activeSlug, tabId);
                    }
                }, 80);
            }
        }
    }

    /**
     * Maps a process slug to a showcase panel tab ID using data-process-slug
     * attributes on the panels in the current DOM.
     * @param {string} slug
     * @returns {string|null}
     */
    function _resolveSlugToTab(slug) {
        var panels = document.querySelectorAll('.showcase-panel[data-process-slug]');
        for (var i = 0; i < panels.length; i++) {
            if (panels[i].getAttribute('data-process-slug') === slug) {
                return panels[i].id.replace('showcase-', '');
            }
        }
        return null;
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
     * Supports exact matches and the /tienda/:slug pattern.
     * Falls back to the '/' route if no match is found.
     * @param {string} pathname
     * @returns {Object}
     */
    function _matchRoute(pathname) {
        var p = pathname.replace(/\/$/, '') || '/';

        // Exact match first
        for (var i = 0; i < routes.length; i++) {
            if (routes[i].path === p) { return routes[i]; }
        }

        // /tienda/:slug — treat as tienda route with a category slug
        if (/^\/tienda\/[^/]+$/.test(p)) {
            return routes[1]; // tienda route (index 1)
        }

        // /servicios/:slug — treat as servicios route with a process slug
        if (/^\/servicios\/[^/]+$/.test(p)) {
            return routes[2]; // servicios route (index 2)
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
        // Normalise: /tienda/anything counts as /tienda for active state
        // and /servicios/anything counts as /servicios
        var activePath = /^\/tienda(\/|$)/.test(path) ? '/tienda'
                       : /^\/servicios(\/|$)/.test(path) ? '/servicios'
                       : path;

        // Plain links with data-route
        var allLinks = document.querySelectorAll(
            '.site-nav__link[data-route], .mobile-nav__link[data-route]'
        );
        allLinks.forEach(function (link) {
            var linkPath = link.getAttribute('data-route');
            if (linkPath === activePath) {
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
            if (liPath === activePath) {
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
