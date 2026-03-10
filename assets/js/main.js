'use strict';

(function ($) {
    // Particles.js Configuration
    if ($('#particles-js').length) {
        particlesJS("particles-js", {
            "particles": {
                "number": {
                    "value": 80,
                    "density": {
                        "enable": true,
                        "value_area": 800
                    }
                },
                "color": {
                    "value": "#ffffff"
                },
                "shape": {
                    "type": "circle",
                    "stroke": {
                        "width": 0,
                        "color": "#000000"
                    }
                },
                "opacity": {
                    "value": 0.5,
                    "random": false,
                    "anim": {
                        "enable": false,
                        "speed": 1,
                        "opacity_min": 0.1,
                        "sync": false
                    }
                },
                "size": {
                    "value": 3,
                    "random": true,
                    "anim": {
                        "enable": false,
                        "speed": 40,
                        "size_min": 0.1,
                        "sync": false
                    }
                },
                "line_linked": {
                    "enable": true,
                    "distance": 150,
                    "color": "#ffffff",
                    "opacity": 0.4,
                    "width": 1
                },
                "move": {
                    "enable": true,
                    "speed": 6,
                    "direction": "none",
                    "random": false,
                    "straight": false,
                    "out_mode": "out",
                    "bounce": false,
                    "attract": {
                        "enable": false,
                        "rotateX": 600,
                        "rotateY": 1200
                    }
                }
            },
            "interactivity": {
                "detect_on": "canvas",
                "events": {
                    "onhover": {
                        "enable": true,
                        "mode": "repulse"
                    },
                    "onclick": {
                        "enable": true,
                        "mode": "push"
                    },
                    "resize": true
                },
                "modes": {
                    "grab": {
                        "distance": 400,
                        "line_linked": {
                            "opacity": 1
                        }
                    },
                    "bubble": {
                        "distance": 400,
                        "size": 40,
                        "duration": 2,
                        "opacity": 8,
                        "speed": 3
                    },
                    "repulse": {
                        "distance": 200,
                        "duration": 0.4
                    },
                    "push": {
                        "particles_nb": 4
                    },
                    "remove": {
                        "particles_nb": 2
                    }
                }
            },
            "retina_detect": true
        });
    }

    // Waterpipe Smoky Background
    if ($('#smoky-bg').length) {
        var smokyBG = $('#smoky-bg').waterpipe({
            gradientStart: '#51ff00',
            gradientEnd: '#001eff',
            smokeOpacity: 0.1,
            numCircles: 1,
            maxMaxRad: 'auto',
            minMaxRad: 'auto',
            minRadFactor: 0,
            iterations: 8,
            drawsPerFrame: 10,
            lineWidth: 2,
            speed: 10,
            bgColorInner: "#0f172a",
            bgColorOuter: "#0a0e1a"
        });
    }

    // Translations
    const translations = {
        es: {
            nav_home: 'Inicio',
            nav_services: 'Servicios',
            nav_equipment: 'Equipos',
            nav_contact: 'Contacto',
            hero_title: 'Tus Ideas. Tu Realidad.',
            hero_subtitle: 'Transformamos tu imaginación en objetos tangibles, capa por capa.',
            hero_cta: 'Solicitar Cotización',
            hero_cta_secondary: 'Ver Servicios',
            services_title: 'Nuestros Servicios',
            services_subtitle: 'Tecnología de vanguardia para tus proyectos',
            service_3d_title: 'Impresión 3D',
            service_3d_desc: 'Dale vida a tus ideas con impresión multicolor y multimaterial. Desde prototipos hasta piezas funcionales que realmente funcionan.',
            service_3d_feat1: 'Hasta 5 colores en una pieza',
            service_3d_feat2: 'Materiales flexibles y resistentes',
            service_3d_feat3: 'Precisión milimétrica',
            service_uv_title: 'Impresión UV',
            service_uv_desc: 'Personaliza casi cualquier superficie con colores vibrantes y duraderos. Tazas, vasos, madera, metal, vidrio y más.',
            service_uv_feat1: 'Imprime en objetos cilíndricos',
            service_uv_feat2: 'Colores que no se desvanecen',
            service_uv_feat3: 'Stickers resistentes al agua',
            service_laser_title: 'Corte Láser',
            service_laser_desc: 'Corta y graba con precisión quirúrgica. Perfecto para letreros, decoración, regalos personalizados y más.',
            service_laser_feat1: 'Cortes limpios y precisos',
            service_laser_feat2: 'Grabados con detalles increíbles',
            service_laser_feat3: 'Madera, acrílico, cuero y más',
            service_photo_title: 'Impresión Fotográfica',
            service_photo_desc: 'Tus recuerdos merecen la mejor calidad. Impresión profesional que hace justicia a tus momentos especiales.',
            service_photo_feat1: 'Calidad profesional',
            service_photo_feat2: 'Papel de primera calidad',
            service_photo_feat3: 'Todos los tamaños',
            equipment_title: '¿Qué Podemos Crear?',
            equipment_subtitle: 'Desde pequeños juguetes hasta piezas grandes y resistentes',
            equip_card1_title: 'Impresión 3D Súper Rápida',
            equip_card1_desc: 'Creamos objetos en plástico de colores. Perfecto para prototipos, figuras, y piezas personalizadas.',
            equip_card1_feat1: 'Tamaño: hasta 25cm x 25cm x 25cm',
            equip_card1_feat2: 'Hasta 4 colores en una pieza',
            equip_card1_feat3: 'Materiales: PLA, PETG, TPU flexible',
            equip_card2_title: 'Impresión 3D Compacta',
            equip_card2_desc: 'Ideal para objetos pequeños y medianos. Rápida y silenciosa, perfecta para decoración y regalos.',
            equip_card2_feat1: 'Tamaño: hasta 18cm x 18cm x 18cm',
            equip_card2_feat2: 'Multicolor disponible',
            equip_card2_feat3: 'Materiales: PLA, PETG, TPU',
            equip_card3_title: 'Impresión 3D Grande y Fuerte',
            equip_card3_desc: 'Para proyectos grandes y resistentes. Podemos usar hasta 5 materiales diferentes en una sola pieza.',
            equip_card3_feat1: 'Tamaño: hasta 36cm x 36cm x 36cm',
            equip_card3_feat2: 'Hasta 5 colores/materiales',
            equip_card3_feat3: 'Materiales: PLA, PETG, ABS, PA+CF',
            equip_card4_title: 'Impresión UV Directa',
            equip_card4_desc: 'Imprimimos diseños a todo color sobre casi cualquier cosa: tazas, vasos, madera, metal, vidrio, plástico. También hacemos stickers UV DTF.',
            equip_card4_feat1: 'Imprime en objetos cilíndricos (vasos, botellas)',
            equip_card4_feat2: 'Stickers UV DTF resistentes',
            equip_card4_feat3: 'Magnetos, placas y más',
            equip_card5_title: 'Corte y Grabado Láser',
            equip_card5_desc: 'Cortamos y grabamos diseños en madera, acrílico, cuero, cartón y más. Perfecto para letreros y decoración.',
            equip_card5_feat1: 'Área: 40cm x 40cm',
            equip_card5_feat2: 'Corta madera de 2cm de grosor',
            equip_card5_feat3: 'Grabados super detallados',
            materials_title: 'Materiales que Usamos',
            material_pla: 'El más común. Fácil de usar, viene en muchos colores. Perfecto para decoración y prototipos.',
            material_pla_uses: 'Ideal para: Figuras, juguetes, decoración, prototipos, organizadores',
            material_petg: 'Más fuerte y flexible que PLA. Resistente al agua. Ideal para objetos que se usan mucho.',
            material_petg_uses: 'Ideal para: Botellas, contenedores, piezas mecánicas, objetos de exterior',
            material_tpu: 'Súper flexible como goma. Perfecto para fundas de teléfono, juguetes blandos y piezas que se doblan.',
            material_tpu_uses: 'Ideal para: Fundas de teléfono, correas, sellos, juguetes flexibles',
            material_abs: 'Muy resistente al calor. El mismo material de los LEGO. Ideal para piezas mecánicas.',
            material_abs_uses: 'Ideal para: Piezas de autos, carcasas, herramientas, piezas que aguantan calor',
            material_pacf: 'El más fuerte. Tiene fibra de carbono. Para piezas que necesitan ser super resistentes.',
            material_pacf_uses: 'Ideal para: Drones, piezas industriales, herramientas, soportes de carga',
            use_cases_title: 'Ejemplos de lo que Creamos',
            use_case_1_title: 'Juguetes y Figuras',
            use_case_1_desc: 'Personajes de videojuegos, figuras coleccionables, juguetes personalizados',
            use_case_2_title: 'Decoración del Hogar',
            use_case_2_desc: 'Macetas, lámparas, organizadores, letreros personalizados, marcos',
            use_case_3_title: 'Regalos Personalizados',
            use_case_3_desc: 'Tazas con nombres, llaveros, placas grabadas, trofeos personalizados',
            use_case_4_title: 'Piezas de Repuesto',
            use_case_4_desc: 'Repuestos para electrodomésticos, piezas de autos, componentes mecánicos',
            use_case_5_title: 'Accesorios Tech',
            use_case_5_desc: 'Fundas de teléfono, soportes para tablet, organizadores de cables',
            use_case_6_title: 'Negocios y Oficina',
            use_case_6_desc: 'Letreros, tarjeteros, sellos personalizados, displays para productos',
            use_case_7_title: 'Stickers UV DTF',
            use_case_7_desc: 'Calcomanías resistentes al agua, stickers para laptops, autos, botellas',
            use_case_8_title: 'Vasos y Tumblers',
            use_case_8_desc: 'Vasos térmicos personalizados, botellas con diseños, tazas con fotos',
            use_case_9_title: 'Magnetos y Placas',
            use_case_9_desc: 'Imanes para refrigerador, placas de identificación, señalética',
            gallery_title: 'Galería de Proyectos',
            gallery_subtitle: 'Algunos ejemplos de lo que hemos creado',
            gallery_filter_all: 'Todos',
            gallery_filter_3d: 'Impresión 3D',
            gallery_filter_laser: 'Corte Láser',
            gallery_filter_uv: 'Impresión UV',
            gallery_3d_1: 'Figuras y Prototipos',
            gallery_3d_1_caption: 'Personajes, figuras coleccionables y prototipos funcionales en PLA multicolor',
            gallery_3d_2: 'Piezas Funcionales',
            gallery_3d_2_caption: 'Repuestos, herramientas y componentes mecánicos en PETG y ABS',
            gallery_3d_3: 'Decoración',
            gallery_3d_3_caption: 'Macetas, lámparas, organizadores y objetos decorativos personalizados',
            gallery_laser_1: 'Grabado en Madera',
            gallery_laser_1_caption: 'Letreros, placas personalizadas y decoración en madera natural',
            gallery_laser_2: 'Grabado en Cuero',
            gallery_laser_2_caption: 'Carteras, cinturones, llaveros y accesorios de cuero personalizados',
            gallery_laser_3: 'Corte en Acrílico',
            gallery_laser_3_caption: 'Letreros luminosos, displays y piezas decorativas en acrílico',
            gallery_uv_1: 'Tazas y Vasos',
            gallery_uv_1_caption: 'Tumblers, tazas y botellas personalizadas con impresión UV rotativa',
            gallery_uv_2: 'Stickers UV DTF',
            gallery_uv_2_caption: 'Calcomanías resistentes al agua para laptops, autos y más',
            gallery_uv_3: 'Magnetos y Placas',
            gallery_uv_3_caption: 'Imanes personalizados, placas de identificación y señalética UV',
            gallery_note: '💡 ¿Tienes un proyecto en mente? Contáctanos para una cotización personalizada',
            gallery_cta_btn: 'Solicitar Cotización',
            equipment_subtitle: 'Tecnología profesional para resultados excepcionales',
            equip_card1_title: 'Impresión 3D de Alta Velocidad',
            equip_card1_desc: 'Velocidades de hasta 300mm/s con calibración automática LIDAR, cámara de impresión cerrada y soporte para materiales avanzados incluyendo fibra de carbono y polímeros técnicos',
            equip_card2_title: 'Impresión 3D Compacta',
            equip_card2_desc: 'Sistema compacto con velocidades de hasta 500mm/s, calibración automática completa, compensación activa de flujo y operación silenciosa ≤48dB para proyectos pequeños y medianos',
            equip_card3_title: 'Impresión 3D Gran Formato',
            equip_card3_desc: 'Sistema de cambio de herramientas con hasta 5 cabezales independientes para impresión multimaterial sin desperdicio, volumen de construcción de 360mm³ y precisión de borde a borde',
            equip_card4_title: 'Impresión UV Directa',
            equip_card4_desc: 'Impresión directa en múltiples superficies (madera, metal, vidrio, acrílico, cerámica) con texturas 3D de hasta 5mm, millones de colores con 100% de precisión cromática y autoenfoque láser dual',
            equip_card5_title: 'Corte y Grabado Láser',
            equip_card5_desc: 'Láser de 40W con área de trabajo de 400×400mm, velocidad de grabado de hasta 36000mm/min, capacidad de corte de 20mm en madera y 6mm en acrílico, con modo de precisión para ensamblajes exactos',
            contact_title: 'Contáctanos',
            contact_subtitle: 'Cuéntanos sobre tu proyecto y te responderemos pronto',
            form_name: 'Nombre',
            form_email: 'Email',
            form_phone: 'Teléfono',
            form_service: 'Servicio de Interés',
            form_select: 'Selecciona un servicio',
            form_opt_3d: 'Impresión 3D',
            form_opt_uv: 'Impresión UV',
            form_opt_laser: 'Corte Láser',
            form_opt_photo: 'Impresión Fotográfica',
            form_opt_other: 'Otro',
            form_message: 'Mensaje',
            form_submit: 'Enviar Mensaje',
            form_success: '¡Mensaje enviado con éxito! Te contactaremos pronto.',
            form_error: 'Hubo un error al enviar el mensaje. Por favor, intenta de nuevo.',
            contact_email_label: 'Email',
            contact_phone_label: 'Teléfono',
            contact_hours_label: 'Horario',
            contact_hours: 'Lun - Vie: 9:00 - 18:00',
            footer_rights: 'Todos los derechos reservados.',
            footer_trademark: 'Filamorfosis® es una marca registrada.'
        },
        en: {
            nav_home: 'Home',
            nav_services: 'Services',
            nav_equipment: 'Equipment',
            nav_contact: 'Contact',
            hero_title: 'Your Ideas. Your Reality.',
            hero_subtitle: 'We transform your imagination into tangible objects, layer by layer.',
            hero_cta: 'Request Quote',
            hero_cta_secondary: 'View Services',
            services_title: 'Our Services',
            services_subtitle: 'Cutting-edge technology for your projects',
            service_3d_title: '3D Printing',
            service_3d_desc: 'Bring your ideas to life with multicolor and multimaterial printing. From prototypes to functional parts that actually work.',
            service_3d_feat1: 'Up to 5 colors in one piece',
            service_3d_feat2: 'Flexible and strong materials',
            service_3d_feat3: 'Millimeter precision',
            service_uv_title: 'UV Printing',
            service_uv_desc: 'Customize almost any surface with vibrant, long-lasting colors. Mugs, glasses, wood, metal, glass and more.',
            service_uv_feat1: 'Prints on cylindrical objects',
            service_uv_feat2: 'Colors that never fade',
            service_uv_feat3: 'Water-resistant stickers',
            service_laser_title: 'Laser Cutting',
            service_laser_desc: 'Cut and engrave with surgical precision. Perfect for signs, decoration, personalized gifts and more.',
            service_laser_feat1: 'Clean, precise cuts',
            service_laser_feat2: 'Engravings with incredible detail',
            service_laser_feat3: 'Wood, acrylic, leather and more',
            service_photo_title: 'Photo Printing',
            service_photo_desc: 'Your memories deserve the best quality. Professional printing that does justice to your special moments.',
            service_photo_feat1: 'Professional quality',
            service_photo_feat2: 'Premium paper',
            service_photo_feat3: 'All sizes',
            equipment_title: 'What Can We Create?',
            equipment_subtitle: 'From small toys to large and strong pieces',
            equip_card1_title: 'Super Fast 3D Printing',
            equip_card1_desc: 'We create colorful plastic objects. Perfect for prototypes, figures, and custom pieces.',
            equip_card1_feat1: 'Size: up to 25cm x 25cm x 25cm',
            equip_card1_feat2: 'Up to 4 colors in one piece',
            equip_card1_feat3: 'Materials: PLA, PETG, flexible TPU',
            equip_card2_title: 'Compact 3D Printing',
            equip_card2_desc: 'Ideal for small and medium objects. Fast and quiet, perfect for decoration and gifts.',
            equip_card2_feat1: 'Size: up to 18cm x 18cm x 18cm',
            equip_card2_feat2: 'Multicolor available',
            equip_card2_feat3: 'Materials: PLA, PETG, TPU',
            equip_card3_title: 'Large and Strong 3D Printing',
            equip_card3_desc: 'For large and resistant projects. We can use up to 5 different materials in one piece.',
            equip_card3_feat1: 'Size: up to 36cm x 36cm x 36cm',
            equip_card3_feat2: 'Up to 5 colors/materials',
            equip_card3_feat3: 'Materials: PLA, PETG, ABS, PA+CF',
            equip_card4_title: 'Direct UV Printing',
            equip_card4_desc: 'We print full-color designs on almost anything: mugs, glasses, wood, metal, glass, plastic. We also make UV DTF stickers.',
            equip_card4_feat1: 'Prints on cylindrical objects (glasses, bottles)',
            equip_card4_feat2: 'Durable UV DTF stickers',
            equip_card4_feat3: 'Magnets, plaques and more',
            equip_card5_title: 'Laser Cutting & Engraving',
            equip_card5_desc: 'We cut and engrave designs on wood, acrylic, leather, cardboard and more. Perfect for signs and decoration.',
            equip_card5_feat1: 'Area: 40cm x 40cm',
            equip_card5_feat2: 'Cuts 2cm thick wood',
            equip_card5_feat3: 'Super detailed engravings',
            materials_title: 'Materials We Use',
            material_pla: 'The most common. Easy to use, comes in many colors. Perfect for decoration and prototypes.',
            material_pla_uses: 'Ideal for: Figures, toys, decoration, prototypes, organizers',
            material_petg: 'Stronger and more flexible than PLA. Water resistant. Ideal for objects that get used a lot.',
            material_petg_uses: 'Ideal for: Bottles, containers, mechanical parts, outdoor objects',
            material_tpu: 'Super flexible like rubber. Perfect for phone cases, soft toys and bendable parts.',
            material_tpu_uses: 'Ideal for: Phone cases, straps, stamps, flexible toys',
            material_abs: 'Very heat resistant. The same material as LEGO. Ideal for mechanical parts.',
            material_abs_uses: 'Ideal for: Car parts, casings, tools, heat-resistant parts',
            material_pacf: 'The strongest. Has carbon fiber. For parts that need to be super strong.',
            material_pacf_uses: 'Ideal for: Drones, industrial parts, tools, load-bearing supports',
            use_cases_title: 'Examples of What We Create',
            use_case_1_title: 'Toys and Figures',
            use_case_1_desc: 'Video game characters, collectible figures, custom toys',
            use_case_2_title: 'Home Decoration',
            use_case_2_desc: 'Planters, lamps, organizers, custom signs, frames',
            use_case_3_title: 'Personalized Gifts',
            use_case_3_desc: 'Mugs with names, keychains, engraved plaques, custom trophies',
            use_case_4_title: 'Replacement Parts',
            use_case_4_desc: 'Appliance parts, car parts, mechanical components',
            use_case_5_title: 'Tech Accessories',
            use_case_5_desc: 'Phone cases, tablet stands, cable organizers',
            use_case_6_title: 'Business and Office',
            use_case_6_desc: 'Signs, business card holders, custom stamps, product displays',
            use_case_7_title: 'UV DTF Stickers',
            use_case_7_desc: 'Water-resistant decals, stickers for laptops, cars, bottles',
            use_case_8_title: 'Cups and Tumblers',
            use_case_8_desc: 'Custom thermal cups, bottles with designs, mugs with photos',
            use_case_9_title: 'Magnets and Plaques',
            use_case_9_desc: 'Refrigerator magnets, ID plates, signage',
            gallery_title: 'Project Gallery',
            gallery_subtitle: 'Some examples of what we have created',
            gallery_filter_all: 'All',
            gallery_filter_3d: '3D Printing',
            gallery_filter_laser: 'Laser Cutting',
            gallery_filter_uv: 'UV Printing',
            gallery_3d_1: 'Figures and Prototypes',
            gallery_3d_1_caption: 'Characters, collectible figures and functional prototypes in multicolor PLA',
            gallery_3d_2: 'Functional Parts',
            gallery_3d_2_caption: 'Spare parts, tools and mechanical components in PETG and ABS',
            gallery_3d_3: 'Decoration',
            gallery_3d_3_caption: 'Planters, lamps, organizers and custom decorative objects',
            gallery_laser_1: 'Wood Engraving',
            gallery_laser_1_caption: 'Signs, custom plaques and decoration in natural wood',
            gallery_laser_2: 'Leather Engraving',
            gallery_laser_2_caption: 'Wallets, belts, keychains and custom leather accessories',
            gallery_laser_3: 'Acrylic Cutting',
            gallery_laser_3_caption: 'Illuminated signs, displays and decorative acrylic pieces',
            gallery_uv_1: 'Mugs and Glasses',
            gallery_uv_1_caption: 'Custom tumblers, mugs and bottles with rotary UV printing',
            gallery_uv_2: 'UV DTF Stickers',
            gallery_uv_2_caption: 'Water-resistant decals for laptops, cars and more',
            gallery_uv_3: 'Magnets and Plaques',
            gallery_uv_3_caption: 'Custom magnets, ID plates and UV signage',
            gallery_note: '💡 Have a project in mind? Contact us for a personalized quote',
            gallery_cta_btn: 'Request Quote',
            contact_title: 'Contact Us',
            contact_subtitle: 'Tell us about your project and we\'ll get back to you soon',
            form_name: 'Name',
            form_email: 'Email',
            form_phone: 'Phone',
            form_service: 'Service of Interest',
            form_select: 'Select a service',
            form_opt_3d: '3D Printing',
            form_opt_uv: 'UV Printing',
            form_opt_laser: 'Laser Cutting',
            form_opt_photo: 'Photo Printing',
            form_opt_other: 'Other',
            form_message: 'Message',
            form_submit: 'Send Message',
            form_success: 'Message sent successfully! We\'ll contact you soon.',
            form_error: 'There was an error sending the message. Please try again.',
            contact_email_label: 'Email',
            contact_phone_label: 'Phone',
            contact_hours_label: 'Hours',
            contact_hours: 'Mon - Fri: 9:00 AM - 6:00 PM',
            footer_rights: 'All rights reserved.',
            footer_trademark: ''
        }
    };

    let currentLang = 'es';

    // Language Switcher
    function switchLanguage(lang) {
        currentLang = lang;
        document.documentElement.lang = lang;
        
        // Update all translatable elements
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

        // Update language buttons (both desktop and mobile)
        $('.lang-btn, .lang-btn-menu').removeClass('active');
        $(`.lang-btn[data-lang="${lang}"], .lang-btn-menu[data-lang="${lang}"]`).addClass('active');

        // Save preference
        localStorage.setItem('preferredLanguage', lang);
    }

    // Initialize language
    $(document).ready(function() {
        const savedLang = localStorage.getItem('preferredLanguage') || 'es';
        switchLanguage(savedLang);

        // Language button click (desktop)
        $('.lang-btn').on('click', function() {
            const lang = $(this).data('lang');
            switchLanguage(lang);
        });

        // Language button click (mobile menu)
        $('.lang-btn-menu').on('click', function() {
            const lang = $(this).data('lang');
            switchLanguage(lang);
        });
    });

    // Mobile Menu Toggle
    $('.navbar__toggle').on('click', function() {
        $(this).toggleClass('active');
        $('.navbar__menu').toggleClass('active');
        
        // Animate hamburger
        if ($(this).hasClass('active')) {
            $(this).find('span:nth-child(1)').css('transform', 'rotate(45deg) translateY(10px)');
            $(this).find('span:nth-child(2)').css('opacity', '0');
            $(this).find('span:nth-child(3)').css('transform', 'rotate(-45deg) translateY(-10px)');
        } else {
            $(this).find('span').css({'transform': 'none', 'opacity': '1'});
        }
    });

    // Close mobile menu on link click
    $('.navbar__menu a').on('click', function() {
        $('.navbar__menu').removeClass('active');
        $('.navbar__toggle').removeClass('active');
        $('.navbar__toggle span').css({'transform': 'none', 'opacity': '1'});
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

    // Navbar scroll effect
    $(window).on('scroll', function() {
        if ($(window).scrollTop() > 50) {
            $('.navbar').css('background', 'rgba(15, 23, 42, 0.98)');
        } else {
            $('.navbar').css('background', 'rgba(15, 23, 42, 0.95)');
        }
    });

    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe service cards
    $('.service-card, .equipment-card').each(function(index) {
        $(this).css({
            'opacity': '0',
            'transform': 'translateY(30px)',
            'transition': `all 0.6s ease ${index * 0.1}s`
        });
        observer.observe(this);
    });

    // Observe section titles and subtitles
    const titleObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.2,
        rootMargin: '0px'
    });

    $('.section-title, .section-subtitle').each(function() {
        titleObserver.observe(this);
    });

    // Parallax scroll effects
    $(window).on('scroll', function() {
        const scrolled = $(window).scrollTop();
        
        // Parallax for hero background only
        if (scrolled < window.innerHeight) {
            $('.smoky, #particles-js').css('transform', `translateY(${scrolled * 0.5}px)`);
            $('.hero-content').css('transform', `translateY(${scrolled * 0.3}px)`);
            $('.hero-content').css('opacity', 1 - (scrolled / window.innerHeight) * 0.8);
        }
    });

    // Smooth reveal on scroll for cards
    const cardObserver = new IntersectionObserver(function(entries) {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('card-visible');
                }, index * 100);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    $('.service-card, .equipment-card, .contact-info-item, .material-card, .use-case-card, .gallery-item').each(function() {
        cardObserver.observe(this);
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

    // Parallax effect for hero
    $(window).on('scroll', function() {
        const scrolled = $(window).scrollTop();
        if (scrolled < window.innerHeight) {
            $('.smoky, #particles-js').css('transform', `translateY(${scrolled * 0.5}px)`);
            $('.hero-content').css('transform', `translateY(${scrolled * 0.3}px)`);
        }
    });

    // Add hover effect to cards
    $('.service-card, .equipment-card').hover(
        function() {
            $(this).find('.service-icon, .equipment-badge').css('transform', 'scale(1.1) rotate(5deg)');
        },
        function() {
            $(this).find('.service-icon, .equipment-badge').css('transform', 'scale(1) rotate(0deg)');
        }
    );

    // Smooth icon transitions
    $('.service-icon, .equipment-badge').css('transition', 'transform 0.3s ease');

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


})(jQuery);
