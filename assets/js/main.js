'use strict';

(function ($) {
    // Particles and smoky wave removed — hero now uses video background

    // Translations — loaded from external i18n files (assets/js/i18n/lang.*.js)
    // Each file sets window.FilamorfosisI18n['xx'] = { ... }
    const translations = window.FilamorfosisI18n || {};
    window.translations = translations; // expose for SPA catalog
    let currentLang = 'es';
    window.currentLang = currentLang; // expose for SPA catalog
    
    // Language flag mapping
    const langFlags = {
        es: '🇪🇸',
        en: '🇬🇧',
        de: '🇩🇪',
        pt: '🇧🇷',
        ja: '🇯🇵',
        zh: '🇨🇳'
    };
    
    const langCodes = {
        es: 'ES',
        en: 'EN',
        de: 'DE',
        pt: 'PT',
        ja: '日本語',
        zh: '中文'
    };

    // Language Switcher
    function switchLanguage(lang) {
        currentLang = lang;
        document.documentElement.lang = lang;
        $('[data-translate]').each(function() {
            const key = $(this).data('translate');
            if (translations[lang][key]) {
                if ($(this).is('input, textarea')) {
                    $(this).attr('placeholder', translations[lang][key]);
                } else {
                    $(this).text(translations[lang][key]);
                }
            }
        });

        // Update data-t elements (store CTA keys)
        $('[data-t]').each(function() {
            const key = $(this).data('t');
            const tl = translations[lang] || {};
            const val = tl[key] !== undefined ? tl[key] : (translations['es'] || {})[key];
            if (val !== undefined) {
                if ($(this).is('input, textarea')) {
                    $(this).attr('placeholder', val);
                } else {
                    $(this).text(val);
                }
            }
        });

        // Update desktop dropdown current language
        $('#currentLang .flag').text(langFlags[lang]);
        $('#currentLang .lang-text').text(langCodes[lang]);

        // Refresh sidebar active label with new language
        (function() {
            var activeBtn = document.querySelector('.service-sidebar__item.active');
            var sidebarName = document.getElementById('sidebarActiveName');
            var sidebarCta  = document.getElementById('sidebarActiveCta');
            if (activeBtn && sidebarName) {
                var labelKey = activeBtn.getAttribute('data-label-key');
                var tl = translations[lang] || {};
                sidebarName.textContent = (labelKey && tl[labelKey]) ? tl[labelKey] : (activeBtn.getAttribute('title') || '');
            }
            if (sidebarCta) {
                var activeTab = activeBtn ? activeBtn.getAttribute('data-tab') : null;
                var tl = translations[lang] || {};
                if (activeTab === 'scan') {
                    sidebarCta.textContent = tl['wa_btn'] || 'Contáctanos →';
                } else {
                    sidebarCta.textContent = tl['service.viewProducts'] || 'Ver productos →';
                }
            }
        })();

        // Sync nav select
        $('#navLangSelect').val(lang);

        // Update mobile button
        const mobileCode = langCodes[lang];
        // For Japanese/Chinese show 2-char code, others use first 2 letters
        const mobileLabel = (lang === 'ja') ? 'JP' : (lang === 'zh') ? 'ZH' : langCodes[lang];
        $('#currentLangMobile .lang-code-mobile').text(mobileLabel);

        // Update active states - desktop
        $('.lang-option').removeClass('active');
        $(`.lang-option[data-lang="${lang}"]`).addClass('active');

        // Update active states - mobile popup
        $('.lang-option-mob').removeClass('active');
        $(`.lang-option-mob[data-lang="${lang}"]`).addClass('active');

        // Save preference
        localStorage.setItem('preferredLanguage', lang);
        window.currentLang = lang; // keep global in sync

        // ── Sync catalog language ──
        if (typeof CATEGORIES !== 'undefined') {
            const tl = translations[lang] || {};
            if (tl.cat_uv)      CATEGORIES[0].label = tl.cat_uv;
            if (tl.cat_3d)      CATEGORIES[1].label = tl.cat_3d;
            if (tl.cat_laser)   CATEGORIES[2].label = tl.cat_laser;
            if (tl.cat_engrave) CATEGORIES[3].label = tl.cat_engrave;
            if (tl.cat_photo)   CATEGORIES[4].label = tl.cat_photo;
            // Re-render catalog if it's been initialized (regardless of visibility)
            if (typeof renderAll === 'function' && window._catalogInited) {
                renderAll();
            }
        }

        // ── Re-render category strip from cache (no extra API call) ──
        if (typeof _renderCategoryStripFromCache === 'function') {
            _renderCategoryStripFromCache();
        }
        
        // Close all dropdowns
        $('.lang-selector').removeClass('active');
        $('.lang-selector-mob').removeClass('active');
    }
    window.switchLanguage = switchLanguage; // expose for store-i18n.js

    // Initialize language
    $(document).ready(function() {
        const savedLang = localStorage.getItem('preferredLanguage') || 'es';
        switchLanguage(savedLang);

        // Initialize promo banner (uses global i18n key promo_banner_text)
        if (typeof window.initPromoBanner === 'function') {
            window.initPromoBanner();
        }

        // Desktop nav language select
        $('#navLangSelect').on('change', function() {
            switchLanguage($(this).val());
        });

        // Desktop dropdown toggle
        $('#currentLang').on('click', function(e) {
            e.stopPropagation();
            $('.lang-selector').toggleClass('active');
            $('.lang-selector-mob').removeClass('active');
        });

        // Mobile button toggle
        $('#currentLangMobile').on('click', function(e) {
            e.stopPropagation();
            $('.lang-selector-mob').toggleClass('active');
            $('.lang-selector').removeClass('active');
        });

        // Desktop language option click
        $('.lang-option').on('click', function() {
            const lang = $(this).data('lang');
            switchLanguage(lang);
        });

        // Mobile popup option click
        $('.lang-option-mob').on('click', function(e) {
            e.stopPropagation();
            const lang = $(this).data('lang');
            switchLanguage(lang);
        });

        // Mobile language option click (inside hamburger menu)
        $('.lang-option-mobile').on('click', function() {
            const lang = $(this).data('lang');
            switchLanguage(lang);
        });

        // Close dropdowns when clicking outside
        $(document).on('click', function(e) {
            if (!$(e.target).closest('.lang-selector').length) {
                $('.lang-selector').removeClass('active');
            }
            if (!$(e.target).closest('.lang-selector-mob').length) {
                $('.lang-selector-mob').removeClass('active');
            }
        });
    });

    // Smooth Scrolling
    $('a[href^="#"]').on('click', function(e) {
        e.preventDefault();
        const target = $(this.getAttribute('href'));
        
        if (target.length) {
            $('html, body').stop().animate({
                scrollTop: target.offset().top - 70
            }, 1000);
        }
    });

    // Contact Form Handling with Web3Forms
    $('#contactForm').on('submit', async function(e) {
        e.preventDefault();
        
        const form = this;
        const formData = new FormData(form);
        const submitButton = $(form).find('button[type="submit"]');
        const formMessage = $('#formMessage');
        
        // Disable submit button
        submitButton.prop('disabled', true).text('Enviando...');
        
        try {
            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                formMessage
                    .removeClass('error')
                    .addClass('success')
                    .text(translations[currentLang].form_success)
                    .fadeIn();
                
                form.reset();
                
                setTimeout(function() {
                    formMessage.fadeOut();
                }, 5000);
            } else {
                throw new Error('Form submission failed');
            }
        } catch (error) {
            formMessage
                .removeClass('success')
                .addClass('error')
                .text(translations[currentLang].form_error)
                .fadeIn();
        } finally {
            // Re-enable submit button
            submitButton.prop('disabled', false);
            const buttonText = currentLang === 'es' ? 'Enviar Mensaje' : 'Send Message';
            submitButton.text(buttonText);
        }
    });

    // ── Hero video crossfade loop ─────────────────────────────────────────────
    // Two videos crossfade over 1s near the end so the loop is seamless
    (function() {
        const FADE_BEFORE_END = 0.6; // seconds before end to start crossfade
        const FADE_DURATION   = 500; // ms — must match CSS transition

        const vidA = document.getElementById('heroBgA');
        const vidB = document.getElementById('heroBgB');
        if (!vidA || !vidB) return;

        let active = vidA;   // currently visible
        let next   = vidB;   // preloaded, waiting
        let fading = false;

        function crossfade() {
            if (fading) return;
            fading = true;

            // Start next from beginning and play
            next.currentTime = 0;
            next.play().catch(() => {});

            // Swap opacity: active fades out, next fades in
            active.style.opacity = '0';
            next.style.opacity   = '0.45';

            setTimeout(function() {
                // Pause the old one and reset
                active.pause();
                active.currentTime = 0;

                // Swap roles
                const tmp = active;
                active = next;
                next   = tmp;
                fading = false;
            }, FADE_DURATION + 100);
        }

        function checkTime() {
            if (!fading && active.duration && active.currentTime >= active.duration - FADE_BEFORE_END) {
                crossfade();
            }
        }

        vidA.addEventListener('timeupdate', checkTime);
        vidB.addEventListener('timeupdate', checkTime);

        // Kick off
        vidA.play().catch(() => {});
    })();

    // ── Hero CTA smooth scroll ────────────────────────────────────────────────
    (function() {
        var primaryBtn = document.getElementById('heroPrimaryCtaBtn');
        var secondaryBtn = document.getElementById('heroSecondaryCtaBtn');

        if (primaryBtn) {
            primaryBtn.addEventListener('click', function() {
                var target = document.getElementById('category-strip') || document.getElementById('catalog');
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }

        if (secondaryBtn) {
            secondaryBtn.addEventListener('click', function() {
                var target = document.getElementById('services');
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }
    })();

    // Card icon hover — class-based, CSS handles the transform
    $('.service-card, .equipment-card').on('mouseenter', function() {
        $(this).find('.service-icon, .equipment-badge').addClass('icon--hovered');
    }).on('mouseleave', function() {
        $(this).find('.service-icon, .equipment-badge').removeClass('icon--hovered');
    });

    // ===== WHATSAPP MODAL =====
    const WA_NUMBER = '13152071586'; // change to your number

    $('#waBubble').on('click', function() {
        // Set placeholder from current lang
        const ph = translations[currentLang].wa_placeholder || 'Escribe tu mensaje...';
        $('#waMessage').attr('placeholder', ph).val('');
        $('#waModal').fadeIn(200);
    });

    $('#waModalClose').on('click', function() {
        $('#waModal').fadeOut(200);
    });

    $('#waModal').on('click', function(e) {
        if ($(e.target).is('#waModal')) $('#waModal').fadeOut(200);
    });

    $('#waStartChat').on('click', function() {
        const msg = $('#waMessage').val().trim() || (translations[currentLang].wa_greeting || '');
        const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
        $('#waModal').fadeOut(200);
    });

    // ===== CAROUSELS =====
    function initCarousel(carouselId, dotsId) {
        const $carousel = $('#' + carouselId);
        if (!$carousel.length) return;

        const $track = $carousel.find('.carousel-track');
        const $slides = $track.find('.carousel-slide');
        const total = $slides.length;
        let current = 0;
        let autoTimer = null;

        // Build dots
        const $dotsContainer = $('#' + dotsId);
        $dotsContainer.empty();
        for (let i = 0; i < total; i++) {
            $dotsContainer.append(`<button class="carousel-dot${i === 0 ? ' active' : ''}" data-index="${i}" aria-label="Slide ${i+1}"></button>`);
        }

        function goTo(index) {
            current = (index + total) % total;
            $track.css('transform', `translateX(-${current * 100}%)`);
            $dotsContainer.find('.carousel-dot').removeClass('active').eq(current).addClass('active');
            // Pause all videos, play only the active slide's video
            $slides.find('video').each(function() { this.pause(); });
            const activeVideo = $slides.eq(current).find('video')[0];
            if (activeVideo) activeVideo.play();
        }

        function startAuto() {
            autoTimer = setInterval(() => goTo(current + 1), 4000);
        }

        function stopAuto() {
            clearInterval(autoTimer);
        }

        $carousel.find('.carousel-prev').on('click', function() {
            stopAuto(); goTo(current - 1); startAuto();
        });
        $carousel.find('.carousel-next').on('click', function() {
            stopAuto(); goTo(current + 1); startAuto();
        });
        $dotsContainer.on('click', '.carousel-dot', function() {
            stopAuto(); goTo(parseInt($(this).data('index'))); startAuto();
        });

        // Touch/swipe support
        let touchStartX = 0;
        $carousel[0].addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
        $carousel[0].addEventListener('touchend', e => {
            const diff = touchStartX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 40) { stopAuto(); goTo(diff > 0 ? current + 1 : current - 1); startAuto(); }
        }, { passive: true });

        startAuto();
    }

    initCarousel('carousel-3d', 'dots-3d');
    initCarousel('carousel-uv', 'dots-uv');
    initCarousel('carousel-laser', 'dots-laser');
    initCarousel('carousel-scan', 'dots-scan');

    // Materials mobile collapsible
    $('#materialsToggle').on('click', function() {
        var expanded = $(this).attr('aria-expanded') === 'true';
        $(this).attr('aria-expanded', !expanded);
        $('#materialsCollapsible').toggleClass('open', !expanded);
    });

    // ══════════════════════════════════════════════════════
    // ══════════════════════════════════════════════════════
    //  CATALOG INITIALIZATION
    // ══════════════════════════════════════════════════════
    
    // Initialize catalog on page load — only when the tienda template is in the DOM
    $(document).ready(function() {
        if (typeof renderAll === 'function' && document.getElementById('catGrid')) {
            renderAll();
            
            // Animate product counter after products load
            if (typeof animateCounter === 'function') {
                setTimeout(function() {
                    const count = window._loadedProducts ? window._loadedProducts.length : 0;
                    if (count > 0) {
                        animateCounter(document.getElementById('statProducts'), count, 1200);
                    }
                }, 500);
            }
            
            // Wire catalog search
            const searchEl = document.getElementById('catSearch');
            if (searchEl) {
                searchEl.addEventListener('input', function(e) {
                    if (typeof renderGrid === 'function') {
                        renderGrid();
                    }
                });
            }
            
            // Wire catalog modal close
            const modalClose = document.getElementById('catModalClose');
            if (modalClose && typeof closeModal === 'function') {
                modalClose.addEventListener('click', closeModal);
            }
            
            const modalOverlay = document.getElementById('catModal');
            if (modalOverlay && typeof closeModal === 'function') {
                modalOverlay.addEventListener('click', function(e) {
                    if (e.target === modalOverlay) closeModal();
                });
            }
            
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && typeof closeModal === 'function') {
                    closeModal();
                }
            });

            // Init catalog hero particles + wave
            if (typeof particlesJS !== 'undefined' && document.getElementById('particles-js-cat')) {
                particlesJS('particles-js-cat', {
                    particles: {
                        number: { value: 60, density: { enable: true, value_area: 900 } },
                        color: { value: '#ffffff' },
                        shape: { type: 'circle' },
                        opacity: { value: 0.35, random: true },
                        size: { value: 2.5, random: true },
                        line_linked: { enable: true, distance: 140, color: '#ffffff', opacity: 0.25, width: 1 },
                        move: { enable: true, speed: 3, direction: 'none', random: true, out_mode: 'out' }
                    },
                    interactivity: {
                        detect_on: 'canvas',
                        events: { onhover: { enable: true, mode: 'repulse' }, onclick: { enable: true, mode: 'push' }, resize: true },
                        modes: { repulse: { distance: 120, duration: 0.4 }, push: { particles_nb: 3 } }
                    },
                    retina_detect: true
                });
            }
            
            if (typeof $ !== 'undefined' && $.fn.waterpipe && $('#smoky-bg-cat').length) {
                const smokyEl = $('#smoky-bg-cat')[0];
                if (smokyEl && smokyEl.offsetWidth > 0 && smokyEl.offsetHeight > 0) {
                    $('#smoky-bg-cat').waterpipe({
                        gradientStart: '#f97316',
                        gradientEnd: '#6366f1',
                        smokeOpacity: 0.07,
                        numCircles: 1,
                        maxMaxRad: 'auto',
                        minMaxRad: 'auto',
                        minRadFactor: 0,
                        iterations: 8,
                        drawsPerFrame: 10,
                        lineWidth: 2,
                        speed: 8,
                        bgColorInner: '#0f172a',
                        bgColorOuter: '#0a0e1a'
                    });
                }
            }
        }
    });

    // ── Navigate to catalog with a specific category pre-selected ────────────
    window._navToCat = function(catId) {
        var targetPath = '/tienda' + (catId ? '?category=' + encodeURIComponent(catId) : '');

        // If already on the tienda route, just set the category directly
        if (window.location.pathname === '/tienda') {
            var attempt = 0;
            function trySet() {
                if (typeof window.setActiveCategory === 'function') {
                    window.setActiveCategory(catId);
                } else if (attempt < 10) {
                    attempt++;
                    setTimeout(trySet, 100);
                }
            }
            trySet();
        } else if (window.FilamorfosisRouter) {
            // SPA navigation to tienda with category param
            window.FilamorfosisRouter.navigate(targetPath);
        } else {
            window.location.href = targetPath;
        }
    };

    // ── Convert showcase-media-grid to 2-row auto-scrolling slider ──────────
    // This is now called by window.initShowcase() after the servicios template
    // is stamped into the DOM. The inline call below is kept for pages that
    // already have the grid in the initial HTML (legacy support).
    function _buildShowcaseSliders(root) {
        (root || document).querySelectorAll('.showcase-media-grid').forEach(function(grid) {
            if (grid.dataset.sliderBuilt) return; // avoid double-build
            grid.dataset.sliderBuilt = '1';
            var items = Array.from(grid.children);
            if (!items.length) return;

            var track = document.createElement('div');
            track.className = 'showcase-media-track';
            items.forEach(function(item) { track.appendChild(item.cloneNode(true)); });
            items.forEach(function(item) { track.appendChild(item.cloneNode(true)); });

            grid.innerHTML = '';
            grid.appendChild(track);

            grid.querySelectorAll('video[data-lazy="true"] source[data-src]').forEach(function(source) {
                source.src = source.getAttribute('data-src');
                var video = source.parentElement;
                if (video) {
                    video.removeAttribute('data-lazy');
                    video.load();
                }
            });
        });
    }
    window._buildShowcaseSliders = _buildShowcaseSliders;
    _buildShowcaseSliders(); // run for any grids already in the DOM
    // ── Showcase tab activation helper ───────────────────────────────────────
    function _activateShowcaseTab(target) {
        if (!target) return;
        document.querySelectorAll('.showcase-tab').forEach(function(t) {
            t.classList.remove('active');
            t.setAttribute('aria-selected', 'false');
        });
        document.querySelectorAll('.showcase-panel').forEach(function(p) {
            p.classList.remove('active');
        });
        document.querySelectorAll('[data-tab="' + target + '"]').forEach(function(t) {
            t.classList.add('active');
            if (t.getAttribute('aria-selected') !== null) t.setAttribute('aria-selected', 'true');
        });
        var panel = document.getElementById('showcase-' + target);
        if (panel) panel.classList.add('active');

        // Sync sticky nav card active state
        var activePanel = document.getElementById('showcase-' + target);
        var activeSlug = activePanel ? activePanel.getAttribute('data-process-slug') : null;
        document.querySelectorAll('.svc-nav-card').forEach(function(card) {
            var isActive = activeSlug
                ? card.getAttribute('data-slug') === activeSlug
                : card.getAttribute('data-tab') === target;
            card.classList.toggle('svc-nav-card--active', isActive);
        });
    }

    // Expose for router.js to call after servicios template is stamped
    window.activateShowcaseTab = _activateShowcaseTab;

    // initShowcase — wires tab clicks and lazy-loads videos in the current DOM
    window.initShowcase = function() {
        document.querySelectorAll('.showcase-tab, .service-sidebar__item').forEach(function(tab) {
            tab.addEventListener('click', function() {
                _activateShowcaseTab(this.dataset.tab);
            });
        });
        // Build sliders and lazy-load videos now that the template is in the DOM
        _buildShowcaseSliders();
    };

    // ── Service sidebar — always visible, no scroll logic needed ─────────────

})(jQuery);

// Lazy load videos using IntersectionObserver — only load when visible
(function() {
    function loadLazyVideos(root) {
        var videos = (root || document).querySelectorAll('video[data-lazy="true"]');
        
        if (!('IntersectionObserver' in window)) {
            // Fallback for browsers without IntersectionObserver support
            videos.forEach(function(video) {
                var sources = video.querySelectorAll('source[data-src]');
                sources.forEach(function(source) {
                    source.src = source.getAttribute('data-src');
                });
                video.removeAttribute('data-lazy');
                video.load();
            });
            return;
        }

        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    var video = entry.target;
                    var sources = video.querySelectorAll('source[data-src]');
                    sources.forEach(function(source) {
                        source.src = source.getAttribute('data-src');
                    });
                    video.removeAttribute('data-lazy');
                    video.load();
                    observer.unobserve(video);
                }
            });
        }, {
            rootMargin: '50px' // Start loading 50px before video enters viewport
        });

        videos.forEach(function(video) {
            observer.observe(video);
        });
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() { loadLazyVideos(); });
    } else {
        loadLazyVideos();
    }
    
    // Expose for dynamic content (e.g., SPA navigation)
    window._loadLazyVideos = loadLazyVideos;
})();

// Profile dropdown toggle
(function() {
    var trigger = document.querySelector('.profile-dropdown__trigger');
    var dropdown = document.querySelector('.profile-dropdown');
    if (!trigger || !dropdown) return;

    trigger.addEventListener('click', function(e) {
        e.stopPropagation();
        var isOpen = dropdown.classList.toggle('open');
        trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    document.addEventListener('click', function(e) {
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove('open');
            trigger.setAttribute('aria-expanded', 'false');
        }
    });

    // Logout action
    var logoutBtn = dropdown.querySelector('[data-action="logout"]');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            dropdown.classList.remove('open');
            trigger.setAttribute('aria-expanded', 'false');
            if (window.FilamorfosisAuth && typeof window.FilamorfosisAuth.logout === 'function') {
                window.FilamorfosisAuth.logout();
            }
        });
    }
})();



/* ═══════════════════════════════════════════════════════════════════════════
   PROMO SLIDER
   ═══════════════════════════════════════════════════════════════════════════ */
(function() {
    let currentSlide = 0;
    let slideInterval;
    const slides = document.querySelectorAll('.promo-slide');
    const dots = document.querySelectorAll('.promo-slider__dot');
    const prevBtn = document.querySelector('.promo-slider__arrow--prev');
    const nextBtn = document.querySelector('.promo-slider__arrow--next');

    if (!slides.length) return;

    function showSlide(index) {
        // Wrap around
        if (index >= slides.length) index = 0;
        if (index < 0) index = slides.length - 1;
        
        currentSlide = index;

        // Update slides
        slides.forEach((slide, i) => {
            slide.classList.toggle('promo-slide--active', i === currentSlide);
        });

        // Update dots
        dots.forEach((dot, i) => {
            dot.classList.toggle('promo-slider__dot--active', i === currentSlide);
        });
    }

    function nextSlide() {
        showSlide(currentSlide + 1);
    }

    function prevSlide() {
        showSlide(currentSlide - 1);
    }

    function startAutoplay() {
        slideInterval = setInterval(nextSlide, 5000); // Change slide every 5 seconds
    }

    function stopAutoplay() {
        clearInterval(slideInterval);
    }

    // Event listeners
    if (nextBtn) nextBtn.addEventListener('click', () => {
        nextSlide();
        stopAutoplay();
        startAutoplay(); // Restart autoplay after manual navigation
    });

    if (prevBtn) prevBtn.addEventListener('click', () => {
        prevSlide();
        stopAutoplay();
        startAutoplay();
    });

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            showSlide(index);
            stopAutoplay();
            startAutoplay();
        });
    });

    // Pause on hover
    const slider = document.querySelector('.promo-slider');
    if (slider) {
        slider.addEventListener('mouseenter', stopAutoplay);
        slider.addEventListener('mouseleave', startAutoplay);
    }

    // Start autoplay
    startAutoplay();
})();
