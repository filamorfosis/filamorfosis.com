/**
 * navigation.js
 * Filamorfosis® — Superside-Inspired Navigation
 *
 * Self-contained IIFE module. Exposes a minimal public API on
 * window.FilamorfosisNav. All state changes are CSS-class-driven;
 * no inline styles are ever set from JavaScript.
 *
 * Sub-controllers
 * ─────────────────────────────────────────────────────────────────────────
 *  MegaMenuController   — open/close/keyboard logic for desktop mega menus
 *  MobileMenuController — hamburger open/close/accordion logic
 *  CategoryService      — API fetch, in-memory cache, and DOM render
 *  LangSwitcherNav      — integrates with existing window.switchLanguage
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Load order: after main.js (relies on window.switchLanguage and
 * window.FilamorfosisI18n being available).
 */

(function (window) {
    'use strict';

    /* ─────────────────────────────────────────────────────────────────────
       Module-level state
    ───────────────────────────────────────────────────────────────────── */
    var _state = {
        activeMenu: null,        // Element | null — currently open mega menu trigger
        mobileOpen: false,       // boolean
        categoriesLoaded: false, // boolean — true after first successful API fetch
        lang: 'es'               // string — mirrors window.currentLang
    };

    /* ─────────────────────────────────────────────────────────────────────
       MegaMenuController
       Handles open/close/keyboard logic for desktop mega menus.
    ───────────────────────────────────────────────────────────────────── */
    var MegaMenuController = {
        // Per-item hover-intent timers: WeakMap<li, timeoutId>
        _hoverTimers: null,
        // Nav-level close-all timer (mouseleave on .site-nav)
        _closeTimer: null,

        /**
         * Opens the mega menu associated with the given trigger element.
         * Adds .is-open to the parent <li>, sets aria-expanded="true",
         * shows the backdrop, and triggers CategoryService.load() for
         * the Tienda menu when categories have not yet been loaded.
         * @param {Element} triggerEl — the .site-nav__trigger button
         */
        open: function (triggerEl) {
            var item = triggerEl.closest('.site-nav__item--has-mega');
            if (!item) { return; }

            // Close any other open menu first
            MegaMenuController.closeAll();

            item.classList.add('is-open');
            triggerEl.setAttribute('aria-expanded', 'true');
            _state.activeMenu = triggerEl;

            // Show backdrop
            var backdrop = document.querySelector('.site-nav__backdrop');
            if (backdrop) {
                backdrop.classList.add('site-nav__backdrop--visible');
            }

            // Announce to screen readers (live region wired in Task 14;
            // guard against it not existing yet)
            var liveRegion = document.querySelector('.site-nav__live-region');
            if (liveRegion) {
                var label = triggerEl.querySelector('[data-translate]');
                var menuName = label ? label.textContent.trim() : 'menú';
                liveRegion.textContent = 'Menú ' + menuName + ' abierto';
            }

            // Lazy-load categories for the Tienda mega menu
            var megaPanel = item.querySelector('.mega-menu');
            if (megaPanel && megaPanel.id === 'mega-tienda' && !_state.categoriesLoaded) {
                CategoryService.load();
            }
            // Lazy-load processes for the Servicios mega menu
            if (megaPanel && megaPanel.id === 'mega-servicios' && ProcessService._cache === null) {
                ProcessService.load();
            }
        },

        /**
         * Closes the mega menu associated with the given trigger element.
         * Removes .is-open, sets aria-expanded="false", and hides the
         * backdrop when no other menus remain open.
         * @param {Element} triggerEl — the .site-nav__trigger button
         */
        close: function (triggerEl) {
            var item = triggerEl.closest('.site-nav__item--has-mega');
            if (!item) { return; }

            item.classList.remove('is-open');
            triggerEl.setAttribute('aria-expanded', 'false');

            if (_state.activeMenu === triggerEl) {
                _state.activeMenu = null;
            }

            // Hide backdrop only when no other menu is open
            var anyOpen = document.querySelector('.site-nav__item--has-mega.is-open');
            if (!anyOpen) {
                var backdrop = document.querySelector('.site-nav__backdrop');
                if (backdrop) {
                    backdrop.classList.remove('site-nav__backdrop--visible');
                }

                // Clear live region
                var liveRegion = document.querySelector('.site-nav__live-region');
                if (liveRegion) {
                    liveRegion.textContent = '';
                }
            }
        },

        /**
         * Closes all currently open mega menus.
         */
        closeAll: function () {
            var openItems = document.querySelectorAll('.site-nav__item--has-mega.is-open');
            openItems.forEach(function (item) {
                var trigger = item.querySelector('.site-nav__trigger, .site-nav__trigger--chevron-only');
                if (trigger) {
                    MegaMenuController.close(trigger);
                }
            });
        },

        /**
         * Attaches all event listeners for desktop mega menu interactions:
         * hover intent (100ms open delay, 150ms close delay), keyboard
         * (Enter/Space to open, Escape to close, Tab to close on exit).
         */
        init: function () {
            MegaMenuController._hoverTimers = new WeakMap();

            var nav = document.querySelector('.site-nav');
            if (!nav) { return; }

            var megaItems = nav.querySelectorAll('.site-nav__item--has-mega');

            /* ── Hover intent ─────────────────────────────────────────── */
            megaItems.forEach(function (item) {
                // Support both full trigger buttons and chevron-only split buttons
                var trigger = item.querySelector('.site-nav__trigger, .site-nav__trigger--chevron-only');
                if (!trigger) { return; }

                // mouseenter: start 100ms open timer
                item.addEventListener('mouseenter', function () {
                    // Cancel any pending close-all timer
                    if (MegaMenuController._closeTimer !== null) {
                        clearTimeout(MegaMenuController._closeTimer);
                        MegaMenuController._closeTimer = null;
                    }

                    var timerId = setTimeout(function () {
                        MegaMenuController.open(trigger);
                    }, 100);

                    MegaMenuController._hoverTimers.set(item, timerId);
                });

                // mouseleave: cancel open timer if cursor leaves before 100ms
                item.addEventListener('mouseleave', function () {
                    var timerId = MegaMenuController._hoverTimers.get(item);
                    if (timerId !== undefined) {
                        clearTimeout(timerId);
                        MegaMenuController._hoverTimers.delete(item);
                    }
                });
            });

            // mouseleave on the whole nav: close all after 150ms
            nav.addEventListener('mouseleave', function () {
                MegaMenuController._closeTimer = setTimeout(function () {
                    MegaMenuController.closeAll();
                    MegaMenuController._closeTimer = null;
                }, 150);
            });

            // mouseenter on nav: cancel the close-all timer
            nav.addEventListener('mouseenter', function () {
                if (MegaMenuController._closeTimer !== null) {
                    clearTimeout(MegaMenuController._closeTimer);
                    MegaMenuController._closeTimer = null;
                }
            });

            // mouseenter/mouseleave on mega panels themselves:
            // The panels use position:fixed so they are outside .site-nav's
            // bounding box — we must cancel/restart the close timer manually.
            var megaPanels = nav.querySelectorAll('.mega-menu');
            megaPanels.forEach(function (panel) {
                panel.addEventListener('mouseenter', function () {
                    if (MegaMenuController._closeTimer !== null) {
                        clearTimeout(MegaMenuController._closeTimer);
                        MegaMenuController._closeTimer = null;
                    }
                });
                panel.addEventListener('mouseleave', function () {
                    MegaMenuController._closeTimer = setTimeout(function () {
                        MegaMenuController.closeAll();
                        MegaMenuController._closeTimer = null;
                    }, 150);
                });
            });

            /* ── Keyboard: Enter / Space on trigger ───────────────────── */
            megaItems.forEach(function (item) {
                var trigger = item.querySelector('.site-nav__trigger, .site-nav__trigger--chevron-only');
                if (!trigger) { return; }

                trigger.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (item.classList.contains('is-open')) {
                            MegaMenuController.close(trigger);
                        } else {
                            MegaMenuController.open(trigger);
                        }
                    }
                });
            });

            /* ── Keyboard: Escape closes active menu ──────────────────── */
            document.addEventListener('keydown', function (e) {
                if (e.key === 'Escape') {
                    var activeTrigger = _state.activeMenu;
                    MegaMenuController.closeAll();
                    // Return focus to the trigger that was active
                    if (activeTrigger) {
                        activeTrigger.focus();
                    }
                }
            });

            /* ── Keyboard: Tab past last focusable item closes menu ────── */
            megaItems.forEach(function (item) {
                var trigger = item.querySelector('.site-nav__trigger, .site-nav__trigger--chevron-only');
                var megaPanel = item.querySelector('.mega-menu');
                if (!trigger || !megaPanel) { return; }

                megaPanel.addEventListener('keydown', function (e) {
                    if (e.key !== 'Tab') { return; }

                    // Collect all focusable elements inside the open panel
                    var focusable = Array.prototype.slice.call(
                        megaPanel.querySelectorAll(
                            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
                        )
                    );

                    if (focusable.length === 0) { return; }

                    var last = focusable[focusable.length - 1];
                    var first = focusable[0];

                    if (!e.shiftKey && document.activeElement === last) {
                        // Tabbing forward past the last item — close the menu
                        MegaMenuController.close(trigger);
                        // Let the browser move focus naturally to the next element
                    } else if (e.shiftKey && document.activeElement === first) {
                        // Shift-Tab past the first item — close and return to trigger
                        e.preventDefault();
                        MegaMenuController.close(trigger);
                        trigger.focus();
                    }
                });
            });

            /* ── Backdrop click closes all menus ──────────────────────── */
            var backdrop = document.querySelector('.site-nav__backdrop');
            if (backdrop) {
                backdrop.addEventListener('click', function () {
                    MegaMenuController.closeAll();
                });
            }
        }
    };

    /* ─────────────────────────────────────────────────────────────────────
       MobileMenuController
       Handles hamburger open/close and accordion submenu logic.
    ───────────────────────────────────────────────────────────────────── */
    var MobileMenuController = {
        /**
         * Slides in the mobile nav panel and locks body scroll.
         * - Adds .is-open to .mobile-nav
         * - Removes aria-hidden from .mobile-nav
         * - Adds .no-scroll to <body>
         * - Sets aria-expanded="true" on the hamburger button
         */
        open: function () {
            var mobileNav = document.querySelector('.mobile-nav');
            var hamburger = document.querySelector('.mobile-nav__hamburger');

            if (!mobileNav) { return; }

            mobileNav.classList.add('is-open');
            mobileNav.removeAttribute('aria-hidden');
            document.body.classList.add('no-scroll');
            _state.mobileOpen = true;

            if (hamburger) {
                hamburger.setAttribute('aria-expanded', 'true');
            }
        },

        /**
         * Slides out the mobile nav panel and restores body scroll.
         * - Removes .is-open from .mobile-nav
         * - Restores aria-hidden="true" on .mobile-nav
         * - Removes .no-scroll from <body>
         * - Sets aria-expanded="false" on the hamburger button
         */
        close: function () {
            var mobileNav = document.querySelector('.mobile-nav');
            var hamburger = document.querySelector('.mobile-nav__hamburger');

            if (!mobileNav) { return; }

            mobileNav.classList.remove('is-open');
            mobileNav.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('no-scroll');
            _state.mobileOpen = false;

            if (hamburger) {
                hamburger.setAttribute('aria-expanded', 'false');
            }
        },

        /**
         * Toggles the mobile nav panel (used by the hamburger button).
         * Checks current state and calls open() or close() accordingly.
         */
        toggle: function () {
            if (_state.mobileOpen) {
                MobileMenuController.close();
            } else {
                MobileMenuController.open();
            }
        },

        /**
         * Collapses all expanded accordion submenus inside the mobile nav.
         * Used before expanding a new submenu to enforce single-open policy.
         */
        _collapseAllSubmenus: function () {
            var expandedItems = document.querySelectorAll(
                '.mobile-nav__item--has-sub.is-expanded'
            );
            expandedItems.forEach(function (item) {
                item.classList.remove('is-expanded');
                var trigger = item.querySelector(
                    '.mobile-nav__trigger, .mobile-nav__trigger--chevron-only'
                );
                if (trigger) {
                    trigger.setAttribute('aria-expanded', 'false');
                }
            });
        },

        /**
         * Attaches all event listeners for mobile menu interactions:
         * - Hamburger button → toggle()
         * - Close button → close()
         * - Accordion triggers → expand/collapse submenus (one at a time)
         * - Overlay click → close()
         * - Window resize → close() when viewport ≥ 768px
         */
        init: function () {
            /* ── Hamburger button ─────────────────────────────────────── */
            var hamburger = document.querySelector('.mobile-nav__hamburger');
            if (hamburger) {
                hamburger.addEventListener('click', function () {
                    MobileMenuController.toggle();
                });
            }

            /* ── Close button inside mobile nav header ────────────────── */
            var closeBtn = document.querySelector('.mobile-nav__close');
            if (closeBtn) {
                closeBtn.addEventListener('click', function () {
                    MobileMenuController.close();
                });
            }

            /* ── Accordion submenu triggers ───────────────────────────── */
            // Supports both full triggers and chevron-only buttons inside .mobile-nav__item-row
            var subTriggers = document.querySelectorAll(
                '.mobile-nav__item--has-sub > .mobile-nav__trigger, ' +
                '.mobile-nav__item--has-sub > .mobile-nav__item-row > .mobile-nav__trigger--chevron-only'
            );
            subTriggers.forEach(function (trigger) {
                trigger.addEventListener('click', function () {
                    var parentItem = trigger.closest('.mobile-nav__item--has-sub');
                    if (!parentItem) { return; }

                    var isExpanded = parentItem.classList.contains('is-expanded');

                    // Collapse all other open submenus first
                    MobileMenuController._collapseAllSubmenus();

                    // Toggle the clicked item (if it was closed, open it)
                    if (!isExpanded) {
                        parentItem.classList.add('is-expanded');
                        trigger.setAttribute('aria-expanded', 'true');
                    }
                });
            });

            /* ── Overlay click → close ────────────────────────────────── */
            var overlay = document.querySelector('.mobile-nav__overlay');
            if (overlay) {
                overlay.addEventListener('click', function () {
                    MobileMenuController.close();
                });
            }

            /* ── Window resize → close when viewport ≥ 768px ─────────── */
            window.addEventListener('resize', function () {
                if (window.innerWidth >= 768 && _state.mobileOpen) {
                    MobileMenuController.close();
                }
            });
        }
    };

    /* ─────────────────────────────────────────────────────────────────────
       CategoryService
       Fetches product categories from the API, caches the result, and
       renders category nodes into the Store mega menu.
    ───────────────────────────────────────────────────────────────────── */
    var CategoryService = {
        _cache: null,         // null = not fetched, [] = empty, [...] = data
        _fetchPromise: null,  // deduplicates concurrent in-flight fetches

        /**
         * Returns a promise that resolves with the categories array.
         *
         * - First call: initiates fetch('/api/v1/categories') wrapped in a
         *   3-second timeout via Promise.race; stores the promise in
         *   _fetchPromise so concurrent callers share the same request.
         * - While in-flight: returns the existing _fetchPromise.
         * - After cache is populated: returns _cache directly, no network
         *   request.
         *
         * On success: populates _cache, calls renderIntoMenu, removes the
         * loading skeleton state.
         * On error/timeout: delegates to _handleError / _handleTimeout.
         *
         * @returns {Promise<Array>}
         */
        load: function () {
            var self = CategoryService;
            var megaPanel = document.getElementById('mega-tienda');

            // ── Already cached — return immediately ──────────────────────
            if (self._cache !== null) {
                self.renderIntoMenu(self._cache);
                return Promise.resolve(self._cache);
            }

            // ── In-flight — return the existing promise ───────────────────
            if (self._fetchPromise !== null) {
                return self._fetchPromise;
            }

            // ── First call — show loading state ───────────────────────────
            self._setLoadingState(megaPanel);

            // Build a 3-second timeout rejection
            var timeoutPromise = new Promise(function (_, reject) {
                setTimeout(function () {
                    reject(new Error('TIMEOUT'));
                }, 3000);
            });

            var fetchPromise = (typeof window.apiFetch === 'function'
                    ? window.apiFetch('/categories')
                    : fetch('/api/v1/categories').then(function (r) {
                        if (!r.ok) { throw new Error('HTTP_ERROR:' + r.status); }
                        return r.json();
                    })
                );

            self._fetchPromise = Promise.race([fetchPromise, timeoutPromise])
                .then(function (categories) {
                    self._cache = Array.isArray(categories) ? categories : [];
                    self._fetchPromise = null;
                    _state.categoriesLoaded = true;
                    self._clearLoadingState(megaPanel);
                    self.renderIntoMenu(self._cache);
                    return self._cache;
                })
                .catch(function (err) {
                    self._fetchPromise = null;
                    self._clearLoadingState(megaPanel);
                    if (err && err.message === 'TIMEOUT') {
                        self._handleTimeout(megaPanel);
                    } else {
                        self._handleError(megaPanel);
                    }
                    return [];
                });

            return self._fetchPromise;
        },

        /**
         * Adds .mega-menu--loading to the panel and hides error/timeout
         * states so the skeleton shimmer is visible.
         * @param {Element|null} megaPanel
         */
        _setLoadingState: function (megaPanel) {
            if (!megaPanel) { return; }
            megaPanel.classList.add('mega-menu--loading');
            megaPanel.classList.remove('mega-menu--error', 'mega-menu--timeout');
        },

        /**
         * Removes .mega-menu--loading from the panel.
         * @param {Element|null} megaPanel
         */
        _clearLoadingState: function (megaPanel) {
            if (!megaPanel) { return; }
            megaPanel.classList.remove('mega-menu--loading');
        },

        /**
         * Shows the network/HTTP error state inside the Tienda mega menu.
         * Wires up the retry button to reset state and call load() again.
         * @param {Element|null} megaPanel
         */
        _handleError: function (megaPanel) {
            if (!megaPanel) { return; }
            megaPanel.classList.add('mega-menu--error');
            megaPanel.classList.remove('mega-menu--timeout');
            CategoryService._wireRetryButtons(megaPanel);
        },

        /**
         * Shows the timeout state inside the Tienda mega menu.
         * Wires up the retry button to reset state and call load() again.
         * @param {Element|null} megaPanel
         */
        _handleTimeout: function (megaPanel) {
            if (!megaPanel) { return; }
            megaPanel.classList.add('mega-menu--timeout');
            megaPanel.classList.remove('mega-menu--error');
            CategoryService._wireRetryButtons(megaPanel);
        },

        /**
         * Attaches one-time click handlers to all .mega-menu__retry-btn
         * elements inside the panel. On click: resets _cache and
         * _fetchPromise, removes error/timeout state classes, then calls
         * load() again.
         * @param {Element} megaPanel
         */
        _wireRetryButtons: function (megaPanel) {
            var retryBtns = megaPanel.querySelectorAll('.mega-menu__retry-btn');
            retryBtns.forEach(function (btn) {
                // Replace the node to remove any previously attached listeners
                var fresh = btn.cloneNode(true);
                btn.parentNode.replaceChild(fresh, btn);
                fresh.addEventListener('click', function () {
                    CategoryService._cache = null;
                    CategoryService._fetchPromise = null;
                    _state.categoriesLoaded = false;
                    megaPanel.classList.remove('mega-menu--error', 'mega-menu--timeout');
                    CategoryService.load();
                });
            });
        },

        /**
         * Builds and inserts DOM nodes for the Tienda mega menu columns
         * based on the provided categories array.
         *
         * - Populates .nav-categories-list with one .nav-category-item per
         *   category (icon + name, linked to buildCategoryUrl(slug)).
         * - Populates .nav-subcategories-panel with grouped subcategory
         *   sections, one per parent category that has children.
         * - Handles empty array by rendering a "no categories" message.
         *
         * @param {Array} categories
         */
        renderIntoMenu: function (categories) {
            var megaPanel = document.getElementById('mega-tienda');
            if (!megaPanel) { return; }

            var categoriesList = megaPanel.querySelector('.nav-categories-list');

            if (!categoriesList) { return; }

            // Clear previous renders
            categoriesList.innerHTML = '';

            // ── Empty state ───────────────────────────────────────────────
            if (!categories || categories.length === 0) {
                var emptyItem = document.createElement('li');
                emptyItem.className = 'nav-category-item nav-category-item--empty';
                emptyItem.textContent = 'No hay categorías disponibles';
                categoriesList.appendChild(emptyItem);
                CategoryService._renderMobileCategories([]);
                return;
            }

            // ── Render category list (Col 1) ──────────────────────────────
            categories.forEach(function (category) {
                var li = document.createElement('li');
                li.className = 'nav-category-item';

                var a = document.createElement('a');
                a.href = CategoryService.buildCategoryUrl(category.slug);
                a.className = 'nav-category-item__link';

                // Icon — supports emoji or FontAwesome class string
                var iconEl = document.createElement('span');
                iconEl.className = 'nav-category-item__icon';
                iconEl.setAttribute('aria-hidden', 'true');

                if (category.icon) {
                    // FontAwesome class (e.g. "fa-print") vs emoji/text
                    if (category.icon.indexOf('fa-') !== -1 || category.icon.indexOf('fas ') !== -1) {
                        var iEl = document.createElement('i');
                        // Normalise: if the value is just "fa-print" add "fas"
                        var faClass = category.icon.indexOf(' ') === -1
                            ? 'fas ' + category.icon
                            : category.icon;
                        iEl.className = faClass;
                        iconEl.appendChild(iEl);
                    } else {
                        iconEl.textContent = category.icon;
                    }
                }

                var nameEl = document.createElement('span');
                nameEl.className = 'nav-category-item__name';
                nameEl.textContent = category.name;

                // Wrap name + optional description in a text block
                var textEl = document.createElement('span');
                textEl.className = 'nav-category-item__text';
                textEl.appendChild(nameEl);

                if (category.description) {
                    var descEl = document.createElement('span');
                    descEl.className = 'nav-category-item__desc';
                    descEl.textContent = category.description;
                    textEl.appendChild(descEl);
                }

                a.appendChild(iconEl);
                a.appendChild(textEl);
                li.appendChild(a);
                categoriesList.appendChild(li);
            });

            // ── Also populate mobile nav sub-list ─────────────────────────
            CategoryService._renderMobileCategories(categories);
        },

        /**
         * Populates the mobile nav Tienda sub-list with category links.
         * @param {Array} categories
         */
        _renderMobileCategories: function (categories) {
            // The Tienda mobile item uses .mobile-nav__item-row structure
            var mobileSubList = document.querySelector(
                '.mobile-nav__item--has-sub .mobile-nav__item-row ~ .mobile-nav__sub'
            );
            if (!mobileSubList) { return; }

            mobileSubList.innerHTML = '';

            categories.forEach(function (category) {
                var li = document.createElement('li');
                var a = document.createElement('a');
                a.href = CategoryService.buildCategoryUrl(category.slug);
                a.className = 'mobile-nav__sub-link';
                a.textContent = category.name;
                li.appendChild(a);
                mobileSubList.appendChild(li);
            });
        },

        /**
         * Returns the store URL for a given category slug.
         * @param {string} slug
         * @returns {string}
         */
        buildCategoryUrl: function (slug) {
            return '/tienda/' + encodeURIComponent(slug);
        }
    };

    /* ─────────────────────────────────────────────────────────────────────
       ProcessService
       Fetches processes (services) from the API, caches the result, and
       renders image cards into the Servicios mega menu and mobile sub-list.
    ───────────────────────────────────────────────────────────────────── */
    var ProcessService = {
        _cache: null,
        _fetchPromise: null,

        /**
         * Loads processes from GET /api/v1/processes.
         * Caches after first successful fetch. Deduplicates in-flight calls.
         * Shows loading skeleton while fetching; delegates errors to _handleError.
         * @returns {Promise<Array>}
         */
        load: function () {
            var self = ProcessService;
            var megaPanel = document.getElementById('mega-servicios');

            if (self._cache !== null) {
                self.renderIntoMenu(self._cache);
                return Promise.resolve(self._cache);
            }

            if (self._fetchPromise !== null) {
                return self._fetchPromise;
            }

            self._setLoadingState(megaPanel);

            var timeoutPromise = new Promise(function (_, reject) {
                setTimeout(function () { reject(new Error('TIMEOUT')); }, 3000);
            });

            var fetchPromise = (typeof window.getProcesses === 'function'
                ? window.getProcesses()
                : fetch('/api/v1/processes').then(function (r) {
                    if (!r.ok) { throw new Error('HTTP_ERROR:' + r.status); }
                    return r.json();
                })
            );

            self._fetchPromise = Promise.race([fetchPromise, timeoutPromise])
                .then(function (processes) {
                    var list = (processes && processes.items)
                        ? processes.items
                        : (Array.isArray(processes) ? processes : []);
                    self._cache = list;
                    self._fetchPromise = null;
                    self._clearLoadingState(megaPanel);
                    self.renderIntoMenu(self._cache);
                    return self._cache;
                })
                .catch(function (err) {
                    self._fetchPromise = null;
                    self._clearLoadingState(megaPanel);
                    self._handleError(megaPanel, err && err.message === 'TIMEOUT');
                    return [];
                });

            return self._fetchPromise;
        },

        _setLoadingState: function (panel) {
            if (!panel) { return; }
            panel.classList.add('mega-menu--loading');
            panel.classList.remove('mega-menu--error');
        },

        _clearLoadingState: function (panel) {
            if (!panel) { return; }
            panel.classList.remove('mega-menu--loading');
        },

        _handleError: function (panel, isTimeout) {
            if (!panel) { return; }
            panel.classList.add('mega-menu--error');
            panel.classList.remove('mega-menu--loading');
            var retryBtn = panel.querySelector('.mega-menu__retry-btn--services');
            if (retryBtn) {
                var fresh = retryBtn.cloneNode(true);
                retryBtn.parentNode.replaceChild(fresh, retryBtn);
                fresh.addEventListener('click', function () {
                    ProcessService._cache = null;
                    ProcessService._fetchPromise = null;
                    panel.classList.remove('mega-menu--error');
                    ProcessService.load();
                });
            }
        },

        /**
         * Resolves a raw image URL or S3 key to a displayable URL.
         * @param {string|null} url
         * @returns {string}
         */
        _resolveImage: function (url) {
            if (!url) { return ''; }
            if (url.indexOf('http://') === 0 || url.indexOf('https://') === 0 || url.indexOf('data:') === 0) {
                return url;
            }
            var cdn = window.FILAMORFOSIS_CDN_BASE;
            return cdn ? (cdn + '/' + url) : '';
        },

        /**
         * Builds and inserts service cards into #mega-services-grid.
         * Each card shows the process image as background with a zoom-on-hover
         * effect, the process name, and links to /servicios/:slug.
         * Also populates the mobile sub-list.
         * @param {Array} processes
         */
        renderIntoMenu: function (processes) {
            var megaPanel = document.getElementById('mega-servicios');
            if (!megaPanel) { return; }

            var grid = megaPanel.querySelector('#mega-services-grid');
            if (!grid) { return; }

            grid.innerHTML = '';

            if (!processes || processes.length === 0) {
                var empty = document.createElement('p');
                empty.className = 'nav-category-item--empty';
                empty.textContent = 'No hay servicios disponibles';
                grid.appendChild(empty);
                ProcessService._renderMobileServices([]);
                return;
            }

            processes.forEach(function (process) {
                var imgUrl = ProcessService._resolveImage(process.imageUrl);

                var a = document.createElement('a');
                a.href = '/servicios/' + encodeURIComponent(process.slug);
                a.className = 'service-card service-card--image';
                if (imgUrl) {
                    a.setAttribute('data-bg', imgUrl);
                }

                // Image layer (zooms on hover via CSS)
                var imgLayer = document.createElement('span');
                imgLayer.className = 'service-card__bg';
                if (imgUrl) {
                    // CSS custom property is the correct way to pass a dynamic
                    // URL into a CSS background-image rule
                    imgLayer.style.setProperty('--svc-bg-url', 'url(' + imgUrl + ')');
                }

                // Overlay for readability
                var overlay = document.createElement('span');
                overlay.className = 'service-card__overlay';

                // Content
                var content = document.createElement('span');
                content.className = 'service-card__content';

                var title = document.createElement('span');
                title.className = 'service-card__title';
                title.textContent = process.nameEs || process.slug;

                var arrow = document.createElement('span');
                arrow.className = 'service-card__arrow';
                arrow.setAttribute('aria-hidden', 'true');
                arrow.innerHTML = '<i class="fas fa-arrow-right"></i>';

                content.appendChild(title);
                content.appendChild(arrow);

                a.appendChild(imgLayer);
                a.appendChild(overlay);
                a.appendChild(content);
                grid.appendChild(a);
            });

            ProcessService._renderMobileServices(processes);
        },

        /**
         * Populates the mobile nav Servicios sub-list.
         * @param {Array} processes
         */
        _renderMobileServices: function (processes) {
            var mobileSubList = document.getElementById('mobile-services-sub');
            if (!mobileSubList) { return; }

            mobileSubList.innerHTML = '';

            processes.forEach(function (process) {
                var li = document.createElement('li');
                var a = document.createElement('a');
                a.href = '/servicios/' + encodeURIComponent(process.slug);
                a.className = 'mobile-nav__sub-link';
                a.textContent = process.nameEs || process.slug;
                li.appendChild(a);
                mobileSubList.appendChild(li);
            });
        },

        /**
         * Returns the servicios URL for a given process slug.
         * @param {string} slug
         * @returns {string}
         */
        buildServiceUrl: function (slug) {
            return '/servicios/' + encodeURIComponent(slug);
        }
    };

    /* ─────────────────────────────────────────────────────────────────────
       LangSwitcherNav
       Integrates the navigation language controls with the existing
       window.switchLanguage function from main.js.
    ───────────────────────────────────────────────────────────────────── */
    var LangSwitcherNav = {
        /**
         * Attaches click handlers to all .lang-switcher__btn elements inside
         * .site-nav__actions and .mobile-nav__footer. Each click delegates to
         * window.switchLanguage (defined in main.js) and then updates the
         * active indicator across all nav lang switcher instances.
         *
         * Also syncs the initial active state to match the language that
         * main.js has already applied (window.currentLang or localStorage).
         */
        init: function () {
            // Collect all lang buttons in both desktop and mobile nav
            var allBtns = document.querySelectorAll(
                '.site-nav__actions .lang-switcher__btn, .mobile-nav__footer .lang-switcher__btn'
            );

            allBtns.forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var lang = btn.getAttribute('data-lang');
                    if (!lang) { return; }

                    // Delegate to the existing switchLanguage function in main.js
                    if (typeof window.switchLanguage === 'function') {
                        window.switchLanguage(lang);
                    }

                    // Update active indicator across all nav lang switcher instances
                    LangSwitcherNav._setActive(lang);
                });
            });

            // Sync initial active state with whatever language main.js loaded
            var initialLang = (typeof window.currentLang === 'string' && window.currentLang)
                ? window.currentLang
                : (localStorage.getItem('preferredLanguage') || 'es');
            LangSwitcherNav._setActive(initialLang);
        },

        /**
         * Marks the button matching `lang` as active (adds .is-active) and
         * removes .is-active from all other nav lang buttons.
         * @param {string} lang — e.g. 'es', 'en', 'de', 'pt', 'ja', 'zh'
         */
        _setActive: function (lang) {
            var allBtns = document.querySelectorAll(
                '.site-nav__actions .lang-switcher__btn, .mobile-nav__footer .lang-switcher__btn'
            );
            allBtns.forEach(function (btn) {
                if (btn.getAttribute('data-lang') === lang) {
                    btn.classList.add('is-active');
                    btn.setAttribute('aria-current', 'true');
                } else {
                    btn.classList.remove('is-active');
                    btn.removeAttribute('aria-current');
                }
            });
            _state.lang = lang;
        }
    };

    /* ─────────────────────────────────────────────────────────────────────
       Scroll behavior
       Toggles .site-nav--scrolled on the nav bar when window.scrollY > 50.
       Uses a passive listener for 60fps performance (Requirement 1.6, 9.6).
    ───────────────────────────────────────────────────────────────────── */
    function _initScrollBehavior() {
        var siteNav = document.querySelector('.site-nav');
        if (!siteNav) { return; }

        window.addEventListener('scroll', function () {
            siteNav.classList.toggle('site-nav--scrolled', window.scrollY > 50);
        }, { passive: true });

        // Apply immediately in case the page is already scrolled on load
        siteNav.classList.toggle('site-nav--scrolled', window.scrollY > 50);
    }

    /* ─────────────────────────────────────────────────────────────────────
       Public API
    ───────────────────────────────────────────────────────────────────── */
    window.FilamorfosisNav = {
        MegaMenuController: MegaMenuController,
        MobileMenuController: MobileMenuController,
        CategoryService: CategoryService,
        ProcessService: ProcessService,
        LangSwitcherNav: LangSwitcherNav,

        /**
         * Bootstraps the entire navigation module.
         * Called once after the DOM is ready.
         */
        init: function () {
            MegaMenuController.init();
            MobileMenuController.init();
            LangSwitcherNav.init();
            _initScrollBehavior();
        }
    };

    /* ─────────────────────────────────────────────────────────────────────
       Auto-bootstrap on DOMContentLoaded
    ───────────────────────────────────────────────────────────────────── */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            window.FilamorfosisNav.init();
        });
    } else {
        // DOM already ready (script loaded with defer after parse)
        window.FilamorfosisNav.init();
    }

}(window));
