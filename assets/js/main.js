﻿'use strict';

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
            $('.navbar__toggle').removeClass('active');
            $('.navbar__menu').removeClass('active');
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

    // Mobile Menu Toggle
    $('.navbar__toggle').on('click', function() {
        $(this).toggleClass('active');
        $('.navbar__menu').toggleClass('active');
    });

    // Close mobile menu on link click
    $('.navbar__menu a').on('click', function() {
        $('.navbar__menu').removeClass('active');
        $('.navbar__toggle').removeClass('active');
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

    // Navbar scroll effect — toggle class, style handled in CSS
    $(window).on('scroll', function() {
        $('.navbar').toggleClass('navbar--scrolled', $(window).scrollTop() > 50);
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

    // Gallery Filter
    $('.gallery-filter').on('click', function() {
        const filter = $(this).data('filter');
        
        // Update active button
        $('.gallery-filter').removeClass('active');
        $(this).addClass('active');
        
        // Filter gallery items
        if (filter === 'all') {
            $('.gallery-item').fadeIn(400);
        } else {
            $('.gallery-item').each(function() {
                if ($(this).data('category') === filter) {
                    $(this).fadeIn(400);
                } else {
                    $(this).fadeOut(400);
                }
            });
        }
    });

    // Material Modal Data
    const materialData = {
        pla: {
            icon: '🎨',
            name: 'PLA',
            fullName: {
                es: 'Ácido Poliláctico',
                en: 'Polylactic Acid',
                ja: 'ポリ乳酸'
            },
            technical: {
                mechanical: {
                    es: [
                        { label: 'Resistencia a la Tracción', value: '50-70 MPa' },
                        { label: 'Resistencia a la Flexión', value: '80-100 MPa' },
                        { label: 'Resistencia al Impacto', value: '2-5 kJ/m²' },
                        { label: 'Elongación al Romper', value: '3-10%' }
                    ],
                    en: [
                        { label: 'Tensile Strength', value: '50-70 MPa' },
                        { label: 'Flexural Strength', value: '80-100 MPa' },
                        { label: 'Impact Resistance', value: '2-5 kJ/m²' },
                        { label: 'Elongation at Break', value: '3-10%' }
                    ],
                    ja: [
                        { label: '引張強度', value: '50-70 MPa' },
                        { label: '曲げ強度', value: '80-100 MPa' },
                        { label: '衝撃抵抗', value: '2-5 kJ/m²' },
                        { label: '破断伸び', value: '3-10%' }
                    ]
                },
                thermal: {
                    es: [
                        { label: 'Temperatura de Transición Vítrea', value: '55-65°C' },
                        { label: 'Temperatura de Deflexión', value: '50-55°C' },
                        { label: 'Punto de Fusión', value: '150-160°C' },
                        { label: 'Temperatura Máxima de Servicio', value: '50°C' }
                    ],
                    en: [
                        { label: 'Glass Transition Temperature', value: '55-65°C' },
                        { label: 'Heat Deflection Temperature', value: '50-55°C' },
                        { label: 'Melting Point', value: '150-160°C' },
                        { label: 'Max Service Temperature', value: '50°C' }
                    ],
                    ja: [
                        { label: 'ガラス転移温度', value: '55-65°C' },
                        { label: '熱変形温度', value: '50-55°C' },
                        { label: '融点', value: '150-160°C' },
                        { label: '最大使用温度', value: '50°C' }
                    ]
                },
                physical: {
                    es: [
                        { label: 'Densidad', value: '1.24 g/cm³' },
                        { label: 'Dureza Shore D', value: '75-85' },
                        { label: 'Absorción de Agua', value: '0.5% (24h)' },
                        { label: 'Contracción', value: '0.3-0.5%' }
                    ],
                    en: [
                        { label: 'Density', value: '1.24 g/cm³' },
                        { label: 'Shore D Hardness', value: '75-85' },
                        { label: 'Water Absorption', value: '0.5% (24h)' },
                        { label: 'Shrinkage Rate', value: '0.3-0.5%' }
                    ],
                    ja: [
                        { label: '密度', value: '1.24 g/cm³' },
                        { label: 'ショアD硬度', value: '75-85' },
                        { label: '吸水率', value: '0.5% (24時間)' },
                        { label: '収縮率', value: '0.3-0.5%' }
                    ]
                },
                durability: {
                    es: [
                        { label: 'Resistencia UV', value: 'Baja - se degrada con luz solar directa' },
                        { label: 'Resistencia Química', value: 'Buena a ácidos débiles y alcoholes' },
                        { label: 'Resistencia a la Intemperie', value: 'Baja - solo para interiores' },
                        { label: 'Vida Útil Estimada', value: '2-5 años en interiores' }
                    ],
                    en: [
                        { label: 'UV Resistance', value: 'Low - degrades with direct sunlight' },
                        { label: 'Chemical Resistance', value: 'Good to weak acids and alcohols' },
                        { label: 'Weatherability', value: 'Low - indoor use only' },
                        { label: 'Estimated Lifespan', value: '2-5 years indoors' }
                    ],
                    ja: [
                        { label: 'UV耐性', value: '低 - 直射日光で劣化' },
                        { label: '耐薬品性', value: '弱酸とアルコールに良好' },
                        { label: '耐候性', value: '低 - 室内使用のみ' },
                        { label: '推定寿命', value: '室内で2-5年' }
                    ]
                },
                recommendations: {
                    es: 'Mejor para objetos decorativos de interior, prototipos visuales y aplicaciones donde la estética es más importante que la resistencia mecánica. No usar en exteriores o donde se expondrá a temperaturas superiores a 50°C. Ideal para figuras, organizadores y objetos que no requieren alta resistencia al impacto.',
                    en: 'Best for indoor decorative objects, visual prototypes and applications where aesthetics are more important than mechanical strength. Do not use outdoors or where exposed to temperatures above 50°C. Ideal for figures, organizers and objects that don\'t require high impact resistance.',
                    ja: '室内装飾品、視覚的プロトタイプ、美観が機械的強度より重要なアプリケーションに最適。屋外や50°C以上の温度にさらされる場所では使用しないでください。フィギュア、オーガナイザー、高い衝撃抵抗を必要としないオブジェクトに最適。'
                }
            },
            properties: {
                es: [
                    'Biodegradable y ecológico - hecho de recursos renovables',
                    'Disponible en amplia variedad de colores vibrantes',
                    'Acabado suave y brillante',
                    'Ligero pero resistente para uso diario',
                    'Sin olores desagradables'
                ],
                en: [
                    'Biodegradable and eco-friendly - made from renewable resources',
                    'Available in wide variety of vibrant colors',
                    'Smooth and glossy finish',
                    'Lightweight but strong for daily use',
                    'No unpleasant odors'
                ],
                ja: [
                    '生分解性で環境に優しい - 再生可能資源から製造',
                    '鮮やかな色の豊富なバリエーション',
                    '滑らかで光沢のある仕上がり',
                    '軽量だが日常使用に十分な強度',
                    '不快な臭いなし'
                ]
            },
            advantages: {
                es: [
                    'Perfecto para decoración y objetos de interior',
                    'Colores brillantes que no se desvanecen',
                    'Seguro para el hogar y niños',
                    'Excelente para detalles finos y precisos',
                    'Precio más económico'
                ],
                en: [
                    'Perfect for decoration and indoor objects',
                    'Bright colors that don\'t fade',
                    'Safe for home and children',
                    'Excellent for fine and precise details',
                    'Most affordable option'
                ],
                ja: [
                    '装飾と室内オブジェクトに最適',
                    '色あせない鮮やかな色',
                    '家庭と子供に安全',
                    '細かく正確なディテールに優れる',
                    '最も手頃な価格'
                ]
            },
            applications: {
                es: 'Ideal para figuras decorativas, prototipos visuales, juguetes, organizadores de escritorio, modelos arquitectónicos, y cualquier objeto decorativo que no esté expuesto a altas temperaturas o uso intensivo.',
                en: 'Ideal for decorative figures, visual prototypes, toys, desk organizers, architectural models, and any decorative object not exposed to high temperatures or heavy use.',
                ja: '装飾フィギュア、視覚的プロトタイプ、おもちゃ、デスクオーガナイザー、建築模型、高温や激しい使用にさらされない装飾オブジェクトに最適。'
            },
            examples: {
                es: ['Figuras coleccionables', 'Macetas decorativas', 'Prototipos de diseño', 'Juguetes educativos', 'Organizadores de escritorio'],
                en: ['Collectible figures', 'Decorative planters', 'Design prototypes', 'Educational toys', 'Desk organizers'],
                ja: ['コレクタブルフィギュア', '装飾プランター', 'デザインプロトタイプ', '教育玩具', 'デスクオーガナイザー']
            }
        },
        petg: {
            icon: '💪',
            name: 'PETG',
            fullName: {
                es: 'Tereftalato de Polietileno Glicol',
                en: 'Polyethylene Terephthalate Glycol'
            },
            technical: {
                mechanical: {
                    es: [
                        { label: 'Resistencia a la Tracción', value: '50-55 MPa' },
                        { label: 'Resistencia a la Flexión', value: '70-80 MPa' },
                        { label: 'Resistencia al Impacto', value: '8-12 kJ/m²' },
                        { label: 'Elongación al Romper', value: '100-150%' }
                    ],
                    en: [
                        { label: 'Tensile Strength', value: '50-55 MPa' },
                        { label: 'Flexural Strength', value: '70-80 MPa' },
                        { label: 'Impact Resistance', value: '8-12 kJ/m²' },
                        { label: 'Elongation at Break', value: '100-150%' }
                    ]
                },
                thermal: {
                    es: [
                        { label: 'Temperatura de Transición Vítrea', value: '75-85°C' },
                        { label: 'Temperatura de Deflexión', value: '70-75°C' },
                        { label: 'Punto de Fusión', value: '230-250°C' },
                        { label: 'Temperatura Máxima de Servicio', value: '80°C' }
                    ],
                    en: [
                        { label: 'Glass Transition Temperature', value: '75-85°C' },
                        { label: 'Heat Deflection Temperature', value: '70-75°C' },
                        { label: 'Melting Point', value: '230-250°C' },
                        { label: 'Max Service Temperature', value: '80°C' }
                    ]
                },
                physical: {
                    es: [
                        { label: 'Densidad', value: '1.27 g/cm³' },
                        { label: 'Dureza Shore D', value: '80-85' },
                        { label: 'Absorción de Agua', value: '0.1% (24h)' },
                        { label: 'Contracción', value: '0.5-0.7%' }
                    ],
                    en: [
                        { label: 'Density', value: '1.27 g/cm³' },
                        { label: 'Shore D Hardness', value: '80-85' },
                        { label: 'Water Absorption', value: '0.1% (24h)' },
                        { label: 'Shrinkage Rate', value: '0.5-0.7%' }
                    ]
                },
                durability: {
                    es: [
                        { label: 'Resistencia UV', value: 'Media - puede usarse en exteriores con protección' },
                        { label: 'Resistencia Química', value: 'Excelente a ácidos, bases y alcoholes' },
                        { label: 'Resistencia a la Intemperie', value: 'Buena - apto para exteriores' },
                        { label: 'Vida Útil Estimada', value: '5-10 años en exteriores' }
                    ],
                    en: [
                        { label: 'UV Resistance', value: 'Medium - can be used outdoors with protection' },
                        { label: 'Chemical Resistance', value: 'Excellent to acids, bases and alcohols' },
                        { label: 'Weatherability', value: 'Good - suitable for outdoors' },
                        { label: 'Estimated Lifespan', value: '5-10 years outdoors' }
                    ]
                },
                recommendations: {
                    es: 'Excelente para aplicaciones funcionales que requieren durabilidad y resistencia al agua. Perfecto para contenedores de alimentos, piezas mecánicas y objetos de exterior. Soporta temperaturas más altas que PLA y tiene mejor resistencia al impacto. Ideal cuando se necesita un balance entre resistencia, flexibilidad y durabilidad.',
                    en: 'Excellent for functional applications requiring durability and water resistance. Perfect for food containers, mechanical parts and outdoor objects. Withstands higher temperatures than PLA and has better impact resistance. Ideal when you need a balance between strength, flexibility and durability.'
                }
            },
            properties: {
                es: [
                    'Muy resistente a golpes y caídas',
                    'Resistente al agua y humedad',
                    'Soporta temperaturas hasta 80°C',
                    'Flexible pero fuerte - no se rompe fácilmente',
                    'Transparente o en colores sólidos'
                ],
                en: [
                    'Highly resistant to impacts and drops',
                    'Water and moisture resistant',
                    'Withstands temperatures up to 80°C',
                    'Flexible but strong - doesn\'t break easily',
                    'Transparent or solid colors'
                ]
            },
            advantages: {
                es: [
                    'Perfecto para objetos de uso diario',
                    'Resistente a la intemperie - ideal para exteriores',
                    'No se agrieta con el tiempo',
                    'Seguro para contacto con alimentos y bebidas',
                    'Dura mucho más que PLA'
                ],
                en: [
                    'Perfect for everyday objects',
                    'Weather resistant - ideal for outdoors',
                    'Doesn\'t crack over time',
                    'Safe for food and beverage contact',
                    'Lasts much longer than PLA'
                ]
            },
            applications: {
                es: 'Perfecto para contenedores, botellas, objetos que se usan frecuentemente, piezas mecánicas funcionales, accesorios deportivos, y cualquier objeto que necesite resistir uso intensivo o condiciones exteriores.',
                en: 'Perfect for containers, bottles, frequently used objects, functional mechanical parts, sports accessories, and any object that needs to withstand heavy use or outdoor conditions.'
            },
            examples: {
                es: ['Botellas y contenedores', 'Piezas mecánicas', 'Fundas protectoras', 'Herramientas de jardín', 'Accesorios deportivos'],
                en: ['Bottles and containers', 'Mechanical parts', 'Protective cases', 'Garden tools', 'Sports accessories']
            }
        },
        tpu: {
            icon: '🤸',
            name: 'TPU',
            fullName: {
                es: 'Poliuretano Termoplástico',
                en: 'Thermoplastic Polyurethane'
            },
            technical: {
                mechanical: {
                    es: [
                        { label: 'Resistencia a la Tracción', value: '26-52 MPa' },
                        { label: 'Resistencia a la Flexión', value: '30-40 MPa' },
                        { label: 'Resistencia al Impacto', value: 'Sin rotura' },
                        { label: 'Elongación al Romper', value: '450-600%' }
                    ],
                    en: [
                        { label: 'Tensile Strength', value: '26-52 MPa' },
                        { label: 'Flexural Strength', value: '30-40 MPa' },
                        { label: 'Impact Resistance', value: 'No break' },
                        { label: 'Elongation at Break', value: '450-600%' }
                    ]
                },
                thermal: {
                    es: [
                        { label: 'Temperatura de Transición Vítrea', value: '-30 a -50°C' },
                        { label: 'Temperatura de Deflexión', value: '60-80°C' },
                        { label: 'Punto de Fusión', value: '200-220°C' },
                        { label: 'Temperatura Máxima de Servicio', value: '80°C' }
                    ],
                    en: [
                        { label: 'Glass Transition Temperature', value: '-30 to -50°C' },
                        { label: 'Heat Deflection Temperature', value: '60-80°C' },
                        { label: 'Melting Point', value: '200-220°C' },
                        { label: 'Max Service Temperature', value: '80°C' }
                    ]
                },
                physical: {
                    es: [
                        { label: 'Densidad', value: '1.20 g/cm³' },
                        { label: 'Dureza Shore A', value: '85-95' },
                        { label: 'Absorción de Agua', value: '0.5-1.0% (24h)' },
                        { label: 'Contracción', value: '1.0-1.5%' }
                    ],
                    en: [
                        { label: 'Density', value: '1.20 g/cm³' },
                        { label: 'Shore A Hardness', value: '85-95' },
                        { label: 'Water Absorption', value: '0.5-1.0% (24h)' },
                        { label: 'Shrinkage Rate', value: '1.0-1.5%' }
                    ]
                },
                durability: {
                    es: [
                        { label: 'Resistencia UV', value: 'Buena - mantiene propiedades en exteriores' },
                        { label: 'Resistencia Química', value: 'Excelente a aceites, grasas y solventes' },
                        { label: 'Resistencia a la Intemperie', value: 'Excelente - ideal para exteriores' },
                        { label: 'Vida Útil Estimada', value: '10+ años con uso normal' }
                    ],
                    en: [
                        { label: 'UV Resistance', value: 'Good - maintains properties outdoors' },
                        { label: 'Chemical Resistance', value: 'Excellent to oils, greases and solvents' },
                        { label: 'Weatherability', value: 'Excellent - ideal for outdoors' },
                        { label: 'Estimated Lifespan', value: '10+ years with normal use' }
                    ]
                },
                recommendations: {
                    es: 'Ideal para aplicaciones que requieren flexibilidad extrema y absorción de impactos. Perfecto para fundas protectoras, sellos, correas y cualquier pieza que necesite doblarse repetidamente. Excelente resistencia a la abrasión y al desgarro. No recomendado para piezas rígidas o estructurales.',
                    en: 'Ideal for applications requiring extreme flexibility and shock absorption. Perfect for protective cases, seals, straps and any part that needs to bend repeatedly. Excellent abrasion and tear resistance. Not recommended for rigid or structural parts.'
                }
            },
            properties: {
                es: [
                    'Súper flexible - se dobla sin romperse',
                    'Textura suave tipo goma',
                    'Absorbe golpes y protege dispositivos',
                    'Resistente al desgaste por fricción',
                    'Mantiene su forma después de estirarse'
                ],
                en: [
                    'Super flexible - bends without breaking',
                    'Soft rubber-like texture',
                    'Absorbs shocks and protects devices',
                    'Resistant to friction wear',
                    'Returns to shape after stretching'
                ]
            },
            advantages: {
                es: [
                    'Protección superior para dispositivos electrónicos',
                    'Agarre antideslizante',
                    'Cómodo al tacto',
                    'Resistente a aceites y productos químicos',
                    'Perfecto para objetos que se doblan o flexionan'
                ],
                en: [
                    'Superior protection for electronic devices',
                    'Non-slip grip',
                    'Comfortable to touch',
                    'Resistant to oils and chemicals',
                    'Perfect for objects that bend or flex'
                ]
            },
            applications: {
                es: 'Ideal para fundas de teléfono y tablet, correas de reloj, sellos personalizados, juguetes flexibles, calzado personalizado, y cualquier aplicación que requiera flexibilidad, amortiguación o agarre.',
                en: 'Ideal for phone and tablet cases, watch straps, custom seals, flexible toys, custom footwear, and any application requiring flexibility, cushioning or grip.'
            },
            examples: {
                es: ['Fundas de teléfono', 'Correas de reloj', 'Sellos personalizados', 'Juguetes blandos', 'Amortiguadores'],
                en: ['Phone cases', 'Watch straps', 'Custom seals', 'Soft toys', 'Shock absorbers']
            }
        },
        abs: {
            icon: '🔥',
            name: 'ABS',
            fullName: {
                es: 'Acrilonitrilo Butadieno Estireno',
                en: 'Acrylonitrile Butadiene Styrene'
            },
            technical: {
                mechanical: {
                    es: [
                        { label: 'Resistencia a la Tracción', value: '40-50 MPa' },
                        { label: 'Resistencia a la Flexión', value: '70-90 MPa' },
                        { label: 'Resistencia al Impacto', value: '15-25 kJ/m²' },
                        { label: 'Elongación al Romper', value: '3-20%' }
                    ],
                    en: [
                        { label: 'Tensile Strength', value: '40-50 MPa' },
                        { label: 'Flexural Strength', value: '70-90 MPa' },
                        { label: 'Impact Resistance', value: '15-25 kJ/m²' },
                        { label: 'Elongation at Break', value: '3-20%' }
                    ]
                },
                thermal: {
                    es: [
                        { label: 'Temperatura de Transición Vítrea', value: '105°C' },
                        { label: 'Temperatura de Deflexión', value: '95-100°C' },
                        { label: 'Punto de Fusión', value: '200-240°C' },
                        { label: 'Temperatura Máxima de Servicio', value: '95°C' }
                    ],
                    en: [
                        { label: 'Glass Transition Temperature', value: '105°C' },
                        { label: 'Heat Deflection Temperature', value: '95-100°C' },
                        { label: 'Melting Point', value: '200-240°C' },
                        { label: 'Max Service Temperature', value: '95°C' }
                    ]
                },
                physical: {
                    es: [
                        { label: 'Densidad', value: '1.04 g/cm³' },
                        { label: 'Dureza Shore D', value: '75-80' },
                        { label: 'Absorción de Agua', value: '0.2-0.4% (24h)' },
                        { label: 'Contracción', value: '0.6-0.8%' }
                    ],
                    en: [
                        { label: 'Density', value: '1.04 g/cm³' },
                        { label: 'Shore D Hardness', value: '75-80' },
                        { label: 'Water Absorption', value: '0.2-0.4% (24h)' },
                        { label: 'Shrinkage Rate', value: '0.6-0.8%' }
                    ]
                },
                durability: {
                    es: [
                        { label: 'Resistencia UV', value: 'Baja - requiere protección para exteriores' },
                        { label: 'Resistencia Química', value: 'Excelente a gasolina, aceites y grasas' },
                        { label: 'Resistencia a la Intemperie', value: 'Media - mejor con recubrimiento UV' },
                        { label: 'Vida Útil Estimada', value: '10-20 años en interiores' }
                    ],
                    en: [
                        { label: 'UV Resistance', value: 'Low - requires protection for outdoors' },
                        { label: 'Chemical Resistance', value: 'Excellent to gasoline, oils and greases' },
                        { label: 'Weatherability', value: 'Medium - better with UV coating' },
                        { label: 'Estimated Lifespan', value: '10-20 years indoors' }
                    ]
                },
                recommendations: {
                    es: 'Perfecto para aplicaciones automotrices y mecánicas que requieren alta resistencia al calor y al impacto. Excelente para carcasas de electrónicos, herramientas y piezas funcionales. Resistente a combustibles y aceites. Ideal cuando se necesita durabilidad a largo plazo y resistencia a temperaturas elevadas.',
                    en: 'Perfect for automotive and mechanical applications requiring high heat and impact resistance. Excellent for electronic housings, tools and functional parts. Resistant to fuels and oils. Ideal when long-term durability and elevated temperature resistance are needed.'
                }
            },
            properties: {
                es: [
                    'El mismo material de los bloques LEGO',
                    'Resiste altas temperaturas sin deformarse',
                    'Muy resistente a golpes fuertes',
                    'Acabado mate profesional',
                    'Extremadamente duradero'
                ],
                en: [
                    'Same material as LEGO blocks',
                    'Resists high temperatures without deforming',
                    'Highly resistant to strong impacts',
                    'Professional matte finish',
                    'Extremely durable'
                ]
            },
            advantages: {
                es: [
                    'Perfecto para piezas que soportan calor',
                    'Resistente a productos químicos y gasolina',
                    'No se degrada con luz solar (UV)',
                    'Ideal para uso automotriz',
                    'Larga vida útil - dura años'
                ],
                en: [
                    'Perfect for parts that withstand heat',
                    'Resistant to chemicals and gasoline',
                    'Doesn\'t degrade with sunlight (UV)',
                    'Ideal for automotive use',
                    'Long lifespan - lasts for years'
                ]
            },
            applications: {
                es: 'Perfecto para piezas automotrices, carcasas de electrónicos, herramientas de uso rudo, componentes mecánicos, y cualquier aplicación que requiera alta durabilidad, resistencia al calor o uso en ambientes exigentes.',
                en: 'Perfect for automotive parts, electronic housings, heavy-duty tools, mechanical components, and any application requiring high durability, heat resistance or use in demanding environments.'
            },
            examples: {
                es: ['Piezas de autos', 'Carcasas electrónicas', 'Herramientas', 'Componentes mecánicos', 'Prototipos funcionales'],
                en: ['Car parts', 'Electronic housings', 'Tools', 'Mechanical components', 'Functional prototypes']
            }
        },
        pacf: {
            icon: '⚡',
            name: 'PA+CF',
            fullName: {
                es: 'Nylon con Fibra de Carbono',
                en: 'Carbon Fiber Reinforced Nylon'
            },
            technical: {
                mechanical: {
                    es: [
                        { label: 'Resistencia a la Tracción', value: '90-120 MPa' },
                        { label: 'Resistencia a la Flexión', value: '150-180 MPa' },
                        { label: 'Resistencia al Impacto', value: '20-30 kJ/m²' },
                        { label: 'Elongación al Romper', value: '2-5%' }
                    ],
                    en: [
                        { label: 'Tensile Strength', value: '90-120 MPa' },
                        { label: 'Flexural Strength', value: '150-180 MPa' },
                        { label: 'Impact Resistance', value: '20-30 kJ/m²' },
                        { label: 'Elongation at Break', value: '2-5%' }
                    ]
                },
                thermal: {
                    es: [
                        { label: 'Temperatura de Transición Vítrea', value: '80-90°C' },
                        { label: 'Temperatura de Deflexión', value: '150-180°C' },
                        { label: 'Punto de Fusión', value: '220-260°C' },
                        { label: 'Temperatura Máxima de Servicio', value: '120°C' }
                    ],
                    en: [
                        { label: 'Glass Transition Temperature', value: '80-90°C' },
                        { label: 'Heat Deflection Temperature', value: '150-180°C' },
                        { label: 'Melting Point', value: '220-260°C' },
                        { label: 'Max Service Temperature', value: '120°C' }
                    ]
                },
                physical: {
                    es: [
                        { label: 'Densidad', value: '1.15 g/cm³' },
                        { label: 'Dureza Shore D', value: '85-90' },
                        { label: 'Absorción de Agua', value: '0.8-1.5% (24h)' },
                        { label: 'Contracción', value: '0.3-0.5%' }
                    ],
                    en: [
                        { label: 'Density', value: '1.15 g/cm³' },
                        { label: 'Shore D Hardness', value: '85-90' },
                        { label: 'Water Absorption', value: '0.8-1.5% (24h)' },
                        { label: 'Shrinkage Rate', value: '0.3-0.5%' }
                    ]
                },
                durability: {
                    es: [
                        { label: 'Resistencia UV', value: 'Buena - mantiene propiedades mecánicas' },
                        { label: 'Resistencia Química', value: 'Excelente a combustibles, aceites y solventes' },
                        { label: 'Resistencia a la Intemperie', value: 'Excelente - uso industrial exterior' },
                        { label: 'Vida Útil Estimada', value: '15-25 años en condiciones extremas' }
                    ],
                    en: [
                        { label: 'UV Resistance', value: 'Good - maintains mechanical properties' },
                        { label: 'Chemical Resistance', value: 'Excellent to fuels, oils and solvents' },
                        { label: 'Weatherability', value: 'Excellent - industrial outdoor use' },
                        { label: 'Estimated Lifespan', value: '15-25 years in extreme conditions' }
                    ]
                },
                recommendations: {
                    es: 'El material más resistente disponible, ideal para aplicaciones de alto rendimiento que requieren máxima resistencia con mínimo peso. Perfecto para drones, robótica, herramientas industriales y componentes estructurales. Puede reemplazar piezas de metal en muchas aplicaciones. Excelente rigidez y estabilidad dimensional bajo carga.',
                    en: 'The strongest material available, ideal for high-performance applications requiring maximum strength with minimum weight. Perfect for drones, robotics, industrial tools and structural components. Can replace metal parts in many applications. Excellent rigidity and dimensional stability under load.'
                }
            },
            properties: {
                es: [
                    'El material más resistente que ofrecemos',
                    'Extremadamente ligero pero súper fuerte',
                    'No se deforma bajo carga pesada',
                    'Resistente a químicos agresivos',
                    'Acabado profesional tipo carbono'
                ],
                en: [
                    'The strongest material we offer',
                    'Extremely lightweight but super strong',
                    'Doesn\'t deform under heavy load',
                    'Resistant to aggressive chemicals',
                    'Professional carbon-like finish'
                ]
            },
            advantages: {
                es: [
                    'Puede reemplazar piezas de metal',
                    'Perfecto para aplicaciones de alto rendimiento',
                    'Resistencia industrial',
                    'Ideal para drones y robótica',
                    'Soporta cargas y estrés extremo'
                ],
                en: [
                    'Can replace metal parts',
                    'Perfect for high-performance applications',
                    'Industrial-grade strength',
                    'Ideal for drones and robotics',
                    'Withstands extreme loads and stress'
                ]
            },
            applications: {
                es: 'Ideal para drones profesionales, piezas industriales, herramientas de alto rendimiento, soportes estructurales, engranajes de precisión, y aplicaciones aeroespaciales o robóticas que requieren máxima resistencia con mínimo peso.',
                en: 'Ideal for professional drones, industrial parts, high-performance tools, structural supports, precision gears, and aerospace or robotic applications requiring maximum strength with minimum weight.'
            },
            examples: {
                es: ['Partes de drones', 'Herramientas industriales', 'Engranajes de precisión', 'Soportes estructurales', 'Componentes aeroespaciales'],
                en: ['Drone parts', 'Industrial tools', 'Precision gears', 'Structural supports', 'Aerospace components']
            }
        }
    };

    // Materials tab switching
    $(document).on('click', '.mat-widget__tab', function() {
        var mat = $(this).data('mat');
        $('.mat-widget__tab').removeClass('active').attr('aria-selected', 'false');
        $(this).addClass('active').attr('aria-selected', 'true');
        $('.mat-widget__panel').removeClass('active');
        $('.mat-widget__panel[data-material="' + mat + '"]').addClass('active');
    });

    // Detail button — opens technical modal directly
    $(document).on('click', '.mat-widget__detail-btn', function(e) {
        e.stopPropagation();
        _openTechnicalModal($(this).data('material'));
    });

    function _openTechnicalModal(material) {
        const data = materialData[material];
        const lang = currentLang;

        if (data && data.technical) {
            $('.technical-modal-title').text(`${data.name} - ${translations[lang].tech_specifications || 'Especificaciones Técnicas'}`);
            $('#technicalModal .material-modal-icon').text(data.icon);

            $('.mechanical-specs').empty();
            data.technical.mechanical[lang].forEach(spec => {
                $('.mechanical-specs').append(`<li><strong>${spec.label}:</strong> <span>${spec.value}</span></li>`);
            });

            $('.thermal-specs').empty();
            data.technical.thermal[lang].forEach(spec => {
                $('.thermal-specs').append(`<li><strong>${spec.label}:</strong> <span>${spec.value}</span></li>`);
            });

            $('.physical-specs').empty();
            data.technical.physical[lang].forEach(spec => {
                $('.physical-specs').append(`<li><strong>${spec.label}:</strong> <span>${spec.value}</span></li>`);
            });

            $('.durability-specs').empty();
            data.technical.durability[lang].forEach(spec => {
                $('.durability-specs').append(`<li><strong>${spec.label}:</strong> <span>${spec.value}</span></li>`);
            });

            $('.tech-recommendations').text(data.technical.recommendations[lang]);

            $('#technicalModal').fadeIn(300);
        }
    }

    // "Learn more" button — opens material info modal
    $(document).on('click', '.mat-widget__learn-btn', function(e) {
        e.stopPropagation();
        _openMaterialModal($(this).data('material'));
    });

    function _openMaterialModal(material) {
        const data = materialData[material];
        const lang = currentLang;

        if (data) {
            // Store current material for technical modal
            $('#materialModal').data('current-material', material);

            // Set icon and title
            $('.material-modal-icon').text(data.icon);
            $('.material-modal-title').text(`${data.name} - ${data.fullName[lang]}`);

            // Set properties
            $('.material-modal-properties').empty();
            data.properties[lang].forEach(prop => {
                $('.material-modal-properties').append(`<li>${prop}</li>`);
            });

            // Set advantages
            $('.material-modal-advantages').empty();
            data.advantages[lang].forEach(adv => {
                $('.material-modal-advantages').append(`<li>${adv}</li>`);
            });

            // Set applications
            $('.material-modal-applications').text(data.applications[lang]);

            // Set examples
            $('.material-modal-examples').empty();
            data.examples[lang].forEach(example => {
                $('.material-modal-examples').append(`<div class="material-example-tag">${example}</div>`);
            });

            // Show modal
            $('#materialModal').fadeIn(300);
        }
    }

    // Technical Details Button Click
    // Technical Details Button inside material modal — reuse same function
    $('.material-tech-details-btn').on('click', function() {
        const material = $('#materialModal').data('current-material');
        if (material) {
            $('#materialModal').fadeOut(200, function() {
                _openTechnicalModal(material);
            });
        }
    });

    // Close material modal
    $('.material-modal-close').on('click', function() {
        $('#materialModal').fadeOut(300);
    });

    // Close technical modal
    $('.technical-modal-close').on('click', function() {
        $('#technicalModal').fadeOut(300);
    });

    // Close modal when clicking outside
    $(window).on('click', function(event) {
        if ($(event.target).is('#materialModal')) {
            $('#materialModal').fadeOut(300);
        }
        if ($(event.target).is('#technicalModal')) {
            $('#technicalModal').fadeOut(300);
        }
    });

    // Close modal with ESC key
    $(document).on('keydown', function(event) {
        if (event.key === 'Escape') {
            $('#materialModal').fadeOut(300);
            $('#technicalModal').fadeOut(300);
        }
    });

    // ===== CLIENTS =====
    const socialIconMap = {
        web:       'fas fa-globe',
        instagram: 'fab fa-instagram',
        facebook:  'fab fa-facebook-f',
        youtube:   'fab fa-youtube',
        twitter:   'fab fa-x-twitter',
        tiktok:    'fab fa-tiktok',
        linkedin:  'fab fa-linkedin-in',
        whatsapp:  'fab fa-whatsapp'
    };

    const grid = document.getElementById('clientsGrid');
    if (grid && typeof CLIENTS !== 'undefined') {
        CLIENTS.forEach(client => {
            const socials = client.socials.map(s => {
                const icon = socialIconMap[s.type] || 'fas fa-link';
                return `<a href="${s.url}" target="_blank" rel="noopener" class="client-social-link" title="${s.type}"><i class="${icon}"></i></a>`;
            }).join('');

            grid.insertAdjacentHTML('beforeend', `
                <div class="client-card">
                    <a class="client-logo-link" href="${client.socials[0]?.url || '#'}" target="_blank" rel="noopener">
                        <img src="${client.logo}" alt="${client.name}" class="client-logo" onerror="this.style.display='none'">
                    </a>
                    <div class="client-socials">${socials}</div>
                </div>
            `);
        });
    }

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
    
    // Initialize catalog on page load
    $(document).ready(function() {
        if (typeof renderAll === 'function') {
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
        // After catalog initialises (renderAll runs), set the category
        // Use a small delay to let renderAll complete if first visit
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
    };

    // ── Convert showcase-media-grid to 2-row auto-scrolling slider ──────────
    document.querySelectorAll('.showcase-media-grid').forEach(function(grid) {
        var items = Array.from(grid.children);
        if (!items.length) return;

        // Build a single track with all items, duplicated for seamless loop
        var track = document.createElement('div');
        track.className = 'showcase-media-track';
        items.forEach(function(item) { track.appendChild(item.cloneNode(true)); });
        items.forEach(function(item) { track.appendChild(item.cloneNode(true)); });

        grid.innerHTML = '';
        grid.appendChild(track);

        // Resolve lazy video sources — copy data-src → src and load
        grid.querySelectorAll('video[data-lazy="true"] source[data-src]').forEach(function(source) {
            source.src = source.getAttribute('data-src');
            var video = source.parentElement;
            if (video) {
                video.removeAttribute('data-lazy');
                video.load();
            }
        });
    });
    document.querySelectorAll('.showcase-tab, .service-sidebar__item').forEach(function(tab) {
        tab.addEventListener('click', function() {
            const target = this.dataset.tab;
            if (!target) return;
            // Deactivate all tabs and sidebar items
            document.querySelectorAll('.showcase-tab').forEach(function(t) {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            document.querySelectorAll('.service-sidebar__item').forEach(function(t) {
                t.classList.remove('active');
            });
            document.querySelectorAll('.showcase-panel').forEach(function(p) {
                p.classList.remove('active');
            });
            // Activate selected
            document.querySelectorAll('[data-tab="' + target + '"]').forEach(function(t) {
                t.classList.add('active');
                if (t.getAttribute('aria-selected') !== null) t.setAttribute('aria-selected', 'true');
            });
            const panel = document.getElementById('showcase-' + target);
            if (panel) panel.classList.add('active');

            // Update sticky CTA bar
            const stickyLabel = document.getElementById('showcaseStickyLabel');
            const stickyBtn   = document.getElementById('showcaseStickyBtn');
            const activeTab   = document.querySelector('.showcase-tab[data-tab="' + target + '"]');
            if (stickyLabel && activeTab) {
                const labelEl = activeTab.querySelector('.showcase-tab-label');
                stickyLabel.textContent = labelEl ? labelEl.textContent : '';
            }
            if (stickyBtn) {
                stickyBtn.setAttribute('onclick', "event.preventDefault();_navToCat('" + target + "');");
            }

            // Update sidebar catalog button to navigate to active category
            const catBtn = document.querySelector('.service-sidebar__catalog');
            if (catBtn) catBtn.setAttribute('onclick', "_navToCat('" + target + "')");

            // Update sidebar active label row
            const sidebarIcon = document.getElementById('sidebarActiveIcon');
            const sidebarName = document.getElementById('sidebarActiveName');
            const sidebarCta  = document.getElementById('sidebarActiveCta');
            const sidebarBtn  = document.querySelector('.service-sidebar__item[data-tab="' + target + '"]');
            if (sidebarIcon && sidebarBtn) sidebarIcon.textContent = sidebarBtn.textContent.trim();
            if (sidebarName && sidebarBtn) {
                // Use translation key if available, fall back to title
                var labelKey = sidebarBtn.getAttribute('data-label-key');
                var lang = window.currentLang || 'es';
                var tl = window.translations && window.translations[lang];
                var label = (tl && labelKey && tl[labelKey]) ? tl[labelKey] : (sidebarBtn.getAttribute('title') || '');
                sidebarName.textContent = label;
            }
            if (sidebarCta) {
                if (target === 'scan') {
                    var contactText = (window.translations && window.translations[window.currentLang || 'es'] && window.translations[window.currentLang || 'es']['wa_btn']) || 'Contáctanos →';
                    sidebarCta.textContent = contactText;
                    sidebarCta.setAttribute('onclick', "var m=document.getElementById('waModal');if(m){m.style.display='flex';var msg=document.getElementById('waMessage');if(msg)msg.value='Hola, me interesa el servicio de Escaneo 3D';}");
                } else {
                    var viewText = (window.translations && window.translations[window.currentLang || 'es'] && window.translations[window.currentLang || 'es']['service.viewProducts']) || 'Ver productos →';
                    sidebarCta.textContent = viewText;
                    sidebarCta.setAttribute('onclick', "event.preventDefault();_navToCat('" + target + "');");
                }
            }
        });
    });

    // ── Service sidebar visibility — show when #services is in view ───────────
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

// Navbar scroll blur
(function() {
  var navbar = document.querySelector('.navbar');
  if (!navbar) return;
  window.addEventListener('scroll', function() {
    if (window.scrollY > 80) {
      navbar.classList.add('navbar--scrolled');
    } else {
      navbar.classList.remove('navbar--scrolled');
    }
  }, { passive: true });
})();

// Mobile nav — handled by navbar__menu.active toggle in the jQuery block above

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
