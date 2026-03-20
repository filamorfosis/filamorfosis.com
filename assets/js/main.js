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
            nav_clients: 'Clientes',
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
            service_3d_examples_title: '¿Qué puedes crear?',
            service_3d_ex1: '🎮 Figuras y juguetes',
            service_3d_ex2: '🏠 Decoración del hogar',
            service_3d_ex3: '🔧 Piezas de repuesto',
            service_3d_ex4: '📱 Accesorios tech',
            service_3d_ex5: '🎁 Regalos personalizados',
            service_uv_title: 'Impresión UV',
            service_uv_desc: 'Personaliza casi cualquier superficie con colores vibrantes y duraderos. Tazas, vasos, madera, metal, vidrio y más.',
            service_uv_feat1: 'Imprime en objetos cilíndricos',
            service_uv_feat2: 'Colores que no se desvanecen',
            service_uv_feat3: 'Stickers resistentes al agua',
            service_uv_examples_title: '¿Qué puedes personalizar?',
            service_uv_ex1: '☕ Tazas y vasos térmicos',
            service_uv_ex2: '🏷️ Stickers UV DTF',
            service_uv_ex3: '🧲 Magnetos personalizados',
            service_uv_ex4: '🪵 Placas de madera',
            service_uv_ex5: '🎨 Objetos decorativos',
            service_laser_title: 'Corte Láser',
            service_laser_desc: 'Corta y graba con precisión quirúrgica. Perfecto para letreros, decoración, regalos personalizados y más.',
            service_laser_feat1: 'Cortes limpios y precisos',
            service_laser_feat2: 'Grabados con detalles increíbles',
            service_laser_feat3: 'Madera, acrílico, cuero y más',
            service_laser_examples_title: '¿Qué podemos hacer?',
            service_laser_ex1: '🪵 Letreros de madera',
            service_laser_ex2: '👜 Accesorios de cuero',
            service_laser_ex3: '💎 Piezas de acrílico',
            service_laser_ex4: '🏢 Señalética empresarial',
            service_laser_ex5: '🎁 Regalos grabados',
            service_photo_title: 'Impresión Fotográfica',
            service_photo_desc: 'Tus recuerdos merecen la mejor calidad. Impresión profesional que hace justicia a tus momentos especiales.',
            service_photo_feat1: 'Calidad profesional',
            service_photo_feat2: 'Papel de primera calidad',
            service_photo_feat3: 'Todos los tamaños',
            service_photo_examples_title: '¿Qué imprimimos?',
            service_photo_ex1: '📸 Fotos familiares',
            service_photo_ex2: '🖼️ Cuadros decorativos',
            service_photo_ex3: '📅 Calendarios personalizados',
            service_photo_ex4: '💼 Material promocional',
            service_photo_ex5: '🎨 Arte y posters',
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
            materials_subtitle: 'Haz clic en cada material para conocer más detalles',
            modal_properties: 'Propiedades',
            modal_advantages: 'Ventajas',
            modal_applications: 'Aplicaciones',
            modal_examples: 'Ejemplos de Uso',
            modal_tech_btn: '📊 Click aquí para detalles técnicos del material',
            tech_specifications: 'Especificaciones Técnicas',
            tech_mechanical: 'Propiedades Mecánicas',
            tech_thermal: 'Propiedades Térmicas',
            tech_physical: 'Propiedades Físicas',
            tech_durability: 'Durabilidad y Resistencia',
            tech_recommendations: 'Recomendaciones de Uso',
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
            clients_title: 'Nuestros Clientes',
            clients_subtitle: 'Empresas que confían en nosotros',
            wa_subtitle: 'Normalmente responde en minutos',
            wa_greeting: '¡Hola! 👋 ¿En qué podemos ayudarte? Cuéntanos sobre tu proyecto.',
            wa_placeholder: 'Escribe tu mensaje aquí...',
            wa_btn: 'Iniciar Chat →',            equipment_subtitle: 'Tecnología profesional para resultados excepcionales',
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
            nav_clients: 'Clients',
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
            service_3d_examples_title: 'What can you create?',
            service_3d_ex1: '🎮 Figures and toys',
            service_3d_ex2: '🏠 Home decoration',
            service_3d_ex3: '🔧 Replacement parts',
            service_3d_ex4: '📱 Tech accessories',
            service_3d_ex5: '🎁 Personalized gifts',
            service_uv_title: 'UV Printing',
            service_uv_desc: 'Customize almost any surface with vibrant, long-lasting colors. Mugs, glasses, wood, metal, glass and more.',
            service_uv_feat1: 'Prints on cylindrical objects',
            service_uv_feat2: 'Colors that never fade',
            service_uv_feat3: 'Water-resistant stickers',
            service_uv_examples_title: 'What can you customize?',
            service_uv_ex1: '☕ Mugs and thermal cups',
            service_uv_ex2: '🏷️ UV DTF stickers',
            service_uv_ex3: '🧲 Custom magnets',
            service_uv_ex4: '🪵 Wooden plaques',
            service_uv_ex5: '🎨 Decorative objects',
            service_laser_title: 'Laser Cutting',
            service_laser_desc: 'Cut and engrave with surgical precision. Perfect for signs, decoration, personalized gifts and more.',
            service_laser_feat1: 'Clean, precise cuts',
            service_laser_feat2: 'Engravings with incredible detail',
            service_laser_feat3: 'Wood, acrylic, leather and more',
            service_laser_examples_title: 'What can we make?',
            service_laser_ex1: '🪵 Wooden signs',
            service_laser_ex2: '👜 Leather accessories',
            service_laser_ex3: '💎 Acrylic pieces',
            service_laser_ex4: '🏢 Business signage',
            service_laser_ex5: '🎁 Engraved gifts',
            service_photo_title: 'Photo Printing',
            service_photo_desc: 'Your memories deserve the best quality. Professional printing that does justice to your special moments.',
            service_photo_feat1: 'Professional quality',
            service_photo_feat2: 'Premium paper',
            service_photo_feat3: 'All sizes',
            service_photo_examples_title: 'What do we print?',
            service_photo_ex1: '📸 Family photos',
            service_photo_ex2: '🖼️ Decorative paintings',
            service_photo_ex3: '📅 Custom calendars',
            service_photo_ex4: '💼 Promotional materials',
            service_photo_ex5: '🎨 Art and posters',
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
            materials_subtitle: 'Click on each material to learn more details',
            modal_properties: 'Properties',
            modal_advantages: 'Advantages',
            modal_applications: 'Applications',
            modal_examples: 'Usage Examples',
            modal_tech_btn: '📊 Click here for technical material details',
            tech_specifications: 'Technical Specifications',
            tech_mechanical: 'Mechanical Properties',
            tech_thermal: 'Thermal Properties',
            tech_physical: 'Physical Properties',
            tech_durability: 'Durability and Resistance',
            tech_recommendations: 'Usage Recommendations',
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
            clients_title: 'Our Clients',
            clients_subtitle: 'Companies that trust us',
            wa_subtitle: 'Usually replies within minutes',
            wa_greeting: 'Hi! 👋 How can we help you? Tell us about your project.',
            wa_placeholder: 'Type your message here...',
            wa_btn: 'Start Chat →',            contact_title: 'Contact Us',
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
        },
        ja: {
            nav_home: 'ホーム',
            nav_services: 'サービス',
            nav_equipment: '設備',
            nav_clients: 'クライアント',
            nav_contact: 'お問い合わせ',
            hero_title: 'あなたのアイデア。あなたの現実。',
            hero_subtitle: 'あなたの想像力を具体的なオブジェクトに変換します、レイヤーごとに。',
            hero_cta: '見積もりを依頼',
            hero_cta_secondary: 'サービスを見る',
            services_title: '私たちのサービス',
            services_subtitle: 'あなたのプロジェクトのための最先端技術',
            service_3d_title: '3Dプリント',
            service_3d_desc: 'マルチカラー・マルチマテリアルプリントでアイデアに命を吹き込みます。プロトタイプから実際に機能する機能部品まで。',
            service_3d_feat1: '1つの部品に最大5色',
            service_3d_feat2: '柔軟で強力な素材',
            service_3d_feat3: 'ミリメートル精度',
            service_3d_examples_title: '何が作れますか？',
            service_3d_ex1: '🎮 フィギュアとおもちゃ',
            service_3d_ex2: '🏠 ホームデコレーション',
            service_3d_ex3: '🔧 交換部品',
            service_3d_ex4: '📱 テックアクセサリー',
            service_3d_ex5: '🎁 パーソナライズされたギフト',
            service_uv_title: 'UVプリント',
            service_uv_desc: 'ほぼすべての表面に鮮やかで長持ちする色でカスタマイズ。マグカップ、グラス、木材、金属、ガラスなど。',
            service_uv_feat1: '円筒形のオブジェクトに印刷',
            service_uv_feat2: '色あせない色',
            service_uv_feat3: '耐水性ステッカー',
            service_uv_examples_title: '何をカスタマイズできますか？',
            service_uv_ex1: '☕ マグカップとサーマルカップ',
            service_uv_ex2: '🏷️ UV DTFステッカー',
            service_uv_ex3: '🧲 カスタムマグネット',
            service_uv_ex4: '🪵 木製プラーク',
            service_uv_ex5: '🎨 装飾オブジェクト',
            service_laser_title: 'レーザーカット',
            service_laser_desc: '外科的精度でカットと彫刻。看板、装飾、パーソナライズされたギフトなどに最適。',
            service_laser_feat1: 'クリーンで正確なカット',
            service_laser_feat2: '信じられないほど詳細な彫刻',
            service_laser_feat3: '木材、アクリル、革など',
            service_laser_examples_title: '何が作れますか？',
            service_laser_ex1: '🪵 木製看板',
            service_laser_ex2: '👜 革製アクセサリー',
            service_laser_ex3: '💎 アクリル部品',
            service_laser_ex4: '🏢 ビジネスサイネージ',
            service_laser_ex5: '🎁 彫刻されたギフト',
            service_photo_title: '写真プリント',
            service_photo_desc: 'あなたの思い出は最高の品質に値します。特別な瞬間を正当に評価するプロフェッショナルプリント。',
            service_photo_feat1: 'プロフェッショナル品質',
            service_photo_feat2: 'プレミアム紙',
            service_photo_feat3: 'すべてのサイズ',
            service_photo_examples_title: '何を印刷しますか？',
            service_photo_ex1: '📸 家族写真',
            service_photo_ex2: '🖼️ 装飾絵画',
            service_photo_ex3: '📅 カスタムカレンダー',
            service_photo_ex4: '💼 プロモーション資料',
            service_photo_ex5: '🎨 アートとポスター',
            equipment_title: '何が作れますか？',
            equipment_subtitle: '小さなおもちゃから大きくて強い部品まで',
            equip_card1_title: '超高速3Dプリント',
            equip_card1_desc: 'カラフルなプラスチックオブジェクトを作成します。プロトタイプ、フィギュア、カスタム部品に最適。',
            equip_card1_feat1: 'サイズ：最大25cm x 25cm x 25cm',
            equip_card1_feat2: '1つの部品に最大4色',
            equip_card1_feat3: '素材：PLA、PETG、柔軟なTPU',
            equip_card2_title: 'コンパクト3Dプリント',
            equip_card2_desc: '小型および中型のオブジェクトに最適。高速で静か、装飾やギフトに最適。',
            equip_card2_feat1: 'サイズ：最大18cm x 18cm x 18cm',
            equip_card2_feat2: 'マルチカラー対応',
            equip_card2_feat3: '素材：PLA、PETG、TPU',
            equip_card3_title: '大型で強力な3Dプリント',
            equip_card3_desc: '大型で耐久性のあるプロジェクト用。1つの部品に最大5つの異なる素材を使用できます。',
            equip_card3_feat1: 'サイズ：最大36cm x 36cm x 36cm',
            equip_card3_feat2: '最大5色/素材',
            equip_card3_feat3: '素材：PLA、PETG、ABS、PA+CF',
            equip_card4_title: 'ダイレクトUVプリント',
            equip_card4_desc: 'ほぼすべてのものにフルカラーデザインを印刷：マグカップ、グラス、木材、金属、ガラス、プラスチック。UV DTFステッカーも作成します。',
            equip_card4_feat1: '円筒形のオブジェクトに印刷（グラス、ボトル）',
            equip_card4_feat2: '耐久性のあるUV DTFステッカー',
            equip_card4_feat3: 'マグネット、プラークなど',
            equip_card5_title: 'レーザーカットと彫刻',
            equip_card5_desc: '木材、アクリル、革、段ボールなどにデザインをカットして彫刻します。看板や装飾に最適。',
            equip_card5_feat1: 'エリア：40cm x 40cm',
            equip_card5_feat2: '2cm厚の木材をカット',
            equip_card5_feat3: '超詳細な彫刻',
            materials_title: '使用する素材',
            materials_subtitle: '各素材をクリックして詳細を確認',
            modal_properties: 'プロパティ',
            modal_advantages: '利点',
            modal_applications: 'アプリケーション',
            modal_examples: '使用例',
            modal_tech_btn: '📊 素材の技術詳細はこちら',
            tech_specifications: '技術仕様',
            tech_mechanical: '機械的特性',
            tech_thermal: '熱特性',
            tech_physical: '物理的特性',
            tech_durability: '耐久性と耐性',
            tech_recommendations: '使用推奨事項',
            material_pla: '最も一般的。使いやすく、多くの色があります。装飾やプロトタイプに最適。',
            material_pla_uses: '最適用途：フィギュア、おもちゃ、装飾、プロトタイプ、オーガナイザー',
            material_petg: 'PLAより強く柔軟。耐水性。頻繁に使用されるオブジェクトに最適。',
            material_petg_uses: '最適用途：ボトル、容器、機械部品、屋外オブジェクト',
            material_tpu: 'ゴムのように超柔軟。電話ケース、柔らかいおもちゃ、曲がる部品に最適。',
            material_tpu_uses: '最適用途：電話ケース、ストラップ、スタンプ、柔軟なおもちゃ',
            material_abs: '非常に耐熱性。LEGOと同じ素材。機械部品に最適。',
            material_abs_uses: '最適用途：自動車部品、ケーシング、工具、耐熱部品',
            material_pacf: '最も強力。カーボンファイバー入り。超強力な部品が必要な場合に。',
            material_pacf_uses: '最適用途：ドローン、産業部品、工具、荷重支持',
            use_cases_title: '私たちが作るものの例',
            use_case_1_title: 'おもちゃとフィギュア',
            use_case_1_desc: 'ビデオゲームキャラクター、コレクタブルフィギュア、カスタムおもちゃ',
            use_case_2_title: 'ホームデコレーション',
            use_case_2_desc: 'プランター、ランプ、オーガナイザー、カスタムサイン、フレーム',
            use_case_3_title: 'パーソナライズされたギフト',
            use_case_3_desc: '名前入りマグカップ、キーチェーン、彫刻プラーク、カスタムトロフィー',
            use_case_4_title: '交換部品',
            use_case_4_desc: '家電部品、自動車部品、機械部品',
            use_case_5_title: 'テックアクセサリー',
            use_case_5_desc: '電話ケース、タブレットスタンド、ケーブルオーガナイザー',
            use_case_6_title: 'ビジネスとオフィス',
            use_case_6_desc: '看板、名刺ホルダー、カスタムスタンプ、製品ディスプレイ',
            use_case_7_title: 'UV DTFステッカー',
            use_case_7_desc: '耐水性デカール、ラップトップ、車、ボトル用ステッカー',
            use_case_8_title: 'カップとタンブラー',
            use_case_8_desc: 'カスタムサーマルカップ、デザイン入りボトル、写真入りマグカップ',
            use_case_9_title: 'マグネットとプラーク',
            use_case_9_desc: '冷蔵庫マグネット、IDプレート、サイネージ',
            gallery_title: 'プロジェクトギャラリー',
            gallery_subtitle: '私たちが作成したものの例',
            gallery_filter_all: 'すべて',
            gallery_filter_3d: '3Dプリント',
            gallery_filter_laser: 'レーザーカット',
            gallery_filter_uv: 'UVプリント',
            gallery_3d_1: 'フィギュアとプロトタイプ',
            gallery_3d_1_caption: 'キャラクター、コレクタブルフィギュア、マルチカラーPLAの機能的プロトタイプ',
            gallery_3d_2: '機能部品',
            gallery_3d_2_caption: 'PETGとABSの交換部品、工具、機械部品',
            gallery_3d_3: '装飾',
            gallery_3d_3_caption: 'プランター、ランプ、オーガナイザー、カスタム装飾オブジェクト',
            gallery_laser_1: '木材彫刻',
            gallery_laser_1_caption: '看板、カスタムプラーク、天然木の装飾',
            gallery_laser_2: '革彫刻',
            gallery_laser_2_caption: '財布、ベルト、キーチェーン、カスタム革製アクセサリー',
            gallery_laser_3: 'アクリルカット',
            gallery_laser_3_caption: '照明付き看板、ディスプレイ、装飾アクリル部品',
            gallery_uv_1: 'マグカップとグラス',
            gallery_uv_1_caption: 'ロータリーUVプリントのカスタムタンブラー、マグカップ、ボトル',
            gallery_uv_2: 'UV DTFステッカー',
            gallery_uv_2_caption: 'ラップトップ、車などの耐水性デカール',
            gallery_uv_3: 'マグネットとプラーク',
            gallery_uv_3_caption: 'カスタムマグネット、IDプレート、UVサイネージ',
            gallery_note: '💡 プロジェクトのアイデアがありますか？パーソナライズされた見積もりについてお問い合わせください',
            gallery_cta_btn: '見積もりを依頼',
            clients_title: 'クライアント',
            clients_subtitle: '私たちを信頼する企業',
            wa_subtitle: '通常数分以内に返信します',
            wa_greeting: 'こんにちは！👋 どのようなご用件ですか？プロジェクトについて教えてください。',
            wa_placeholder: 'メッセージを入力してください...',
            wa_btn: 'チャットを開始 →',            contact_title: 'お問い合わせ',
            contact_subtitle: 'あなたのプロジェクトについて教えてください',
            form_name: '名前',
            form_email: 'メール',
            form_phone: '電話',
            form_service: '興味のあるサービス',
            form_select: 'サービスを選択',
            form_opt_3d: '3Dプリント',
            form_opt_uv: 'UVプリント',
            form_opt_laser: 'レーザーカット',
            form_opt_photo: '写真プリント',
            form_opt_other: 'その他',
            form_message: 'メッセージ',
            form_submit: 'メッセージを送信',
            form_success: 'メッセージが正常に送信されました！すぐにご連絡いたします。',
            form_error: 'メッセージの送信中にエラーが発生しました。もう一度お試しください。',
            contact_email_label: 'メール',
            contact_phone_label: '電話',
            contact_hours_label: '営業時間',
            contact_hours: '月 - 金：9:00 - 18:00',
            footer_rights: '全著作権所有。',
            footer_trademark: 'Filamorfosis®は登録商標です。'
        },
        zh: {
            nav_home: '首页',
            nav_services: '服务',
            nav_equipment: '设备',
            nav_clients: '客户',
            nav_contact: '联系我们',
            hero_title: '您的创意。您的现实。',
            hero_subtitle: '我们将您的想象力转化为有形物体，一层一层地实现。',
            hero_cta: '请求报价',
            hero_cta_secondary: '查看服务',
            services_title: '我们的服务',
            services_subtitle: '为您的项目提供前沿技术',
            service_3d_title: '3D打印',
            service_3d_desc: '通过多色多材料打印让您的创意栩栩如生。从原型到真正可用的功能零件。',
            service_3d_feat1: '单件最多5种颜色',
            service_3d_feat2: '柔性和高强度材料',
            service_3d_feat3: '毫米级精度',
            service_3d_examples_title: '您能创造什么？',
            service_3d_ex1: '🎮 手办和玩具',
            service_3d_ex2: '🏠 家居装饰',
            service_3d_ex3: '🔧 替换零件',
            service_3d_ex4: '📱 科技配件',
            service_3d_ex5: '🎁 个性化礼品',
            service_uv_title: 'UV打印',
            service_uv_desc: '用鲜艳持久的色彩个性化几乎任何表面。马克杯、玻璃杯、木材、金属、玻璃等。',
            service_uv_feat1: '可在圆柱形物体上打印',
            service_uv_feat2: '永不褪色的颜色',
            service_uv_feat3: '防水贴纸',
            service_uv_examples_title: '您能个性化什么？',
            service_uv_ex1: '☕ 马克杯和保温杯',
            service_uv_ex2: '🏷️ UV DTF贴纸',
            service_uv_ex3: '🧲 定制磁铁',
            service_uv_ex4: '🪵 木质牌匾',
            service_uv_ex5: '🎨 装饰品',
            service_laser_title: '激光切割',
            service_laser_desc: '以外科手术般的精度切割和雕刻。非常适合标牌、装饰、个性化礼品等。',
            service_laser_feat1: '干净精确的切割',
            service_laser_feat2: '令人惊叹的细节雕刻',
            service_laser_feat3: '木材、亚克力、皮革等',
            service_laser_examples_title: '我们能做什么？',
            service_laser_ex1: '🪵 木质标牌',
            service_laser_ex2: '👜 皮革配件',
            service_laser_ex3: '💎 亚克力零件',
            service_laser_ex4: '🏢 商业标识',
            service_laser_ex5: '🎁 雕刻礼品',
            service_photo_title: '照片打印',
            service_photo_desc: '您的回忆值得最好的品质。专业打印让您的特殊时刻得到应有的呈现。',
            service_photo_feat1: '专业品质',
            service_photo_feat2: '优质纸张',
            service_photo_feat3: '所有尺寸',
            service_photo_examples_title: '我们打印什么？',
            service_photo_ex1: '📸 家庭照片',
            service_photo_ex2: '🖼️ 装饰画',
            service_photo_ex3: '📅 定制日历',
            service_photo_ex4: '💼 宣传材料',
            service_photo_ex5: '🎨 艺术和海报',
            equipment_title: '我们能创造什么？',
            equipment_subtitle: '从小玩具到大型坚固零件',
            equip_card1_title: '超高速3D打印',
            equip_card1_desc: '我们创造彩色塑料物体。非常适合原型、手办和定制零件。',
            equip_card1_feat1: '尺寸：最大25cm x 25cm x 25cm',
            equip_card1_feat2: '单件最多4种颜色',
            equip_card1_feat3: '材料：PLA、PETG、柔性TPU',
            equip_card2_title: '紧凑型3D打印',
            equip_card2_desc: '适合小型和中型物体。快速安静，非常适合装饰和礼品。',
            equip_card2_feat1: '尺寸：最大18cm x 18cm x 18cm',
            equip_card2_feat2: '支持多色',
            equip_card2_feat3: '材料：PLA、PETG、TPU',
            equip_card3_title: '大型高强度3D打印',
            equip_card3_desc: '适合大型耐用项目。单件可使用最多5种不同材料。',
            equip_card3_feat1: '尺寸：最大36cm x 36cm x 36cm',
            equip_card3_feat2: '最多5种颜色/材料',
            equip_card3_feat3: '材料：PLA、PETG、ABS、PA+CF',
            equip_card4_title: '直接UV打印',
            equip_card4_desc: '在几乎任何东西上打印全彩设计：马克杯、玻璃杯、木材、金属、玻璃、塑料。我们也制作UV DTF贴纸。',
            equip_card4_feat1: '可在圆柱形物体上打印（玻璃杯、瓶子）',
            equip_card4_feat2: '耐用UV DTF贴纸',
            equip_card4_feat3: '磁铁、牌匾等',
            equip_card5_title: '激光切割与雕刻',
            equip_card5_desc: '在木材、亚克力、皮革、纸板等上切割和雕刻设计。非常适合标牌和装饰。',
            equip_card5_feat1: '工作区域：40cm x 40cm',
            equip_card5_feat2: '可切割2cm厚木材',
            equip_card5_feat3: '超精细雕刻',
            materials_title: '我们使用的材料',
            materials_subtitle: '点击每种材料了解更多详情',
            modal_properties: '特性',
            modal_advantages: '优势',
            modal_applications: '应用',
            modal_examples: '使用示例',
            modal_tech_btn: '📊 点击查看材料技术详情',
            tech_specifications: '技术规格',
            tech_mechanical: '机械性能',
            tech_thermal: '热性能',
            tech_physical: '物理性能',
            tech_durability: '耐久性和耐性',
            tech_recommendations: '使用建议',
            material_pla: '最常见的材料。易于使用，颜色丰富。非常适合装饰和原型。',
            material_pla_uses: '最适合：手办、玩具、装饰、原型、收纳盒',
            material_petg: '比PLA更强韧灵活。防水。适合频繁使用的物品。',
            material_petg_uses: '最适合：瓶子、容器、机械零件、户外物品',
            material_tpu: '像橡胶一样超级柔韧。非常适合手机壳、软玩具和弯曲零件。',
            material_tpu_uses: '最适合：手机壳、表带、印章、柔性玩具',
            material_abs: '耐热性极强。与乐高积木相同的材料。适合机械零件。',
            material_abs_uses: '最适合：汽车零件、外壳、工具、耐热零件',
            material_pacf: '最强的材料。含碳纤维。适用于需要超强强度的零件。',
            material_pacf_uses: '最适合：无人机、工业零件、工具、承重支撑',
            use_cases_title: '我们创造的示例',
            use_case_1_title: '玩具和手办',
            use_case_1_desc: '电子游戏角色、收藏手办、定制玩具',
            use_case_2_title: '家居装饰',
            use_case_2_desc: '花盆、灯具、收纳盒、定制标牌、相框',
            use_case_3_title: '个性化礼品',
            use_case_3_desc: '印名字的马克杯、钥匙扣、雕刻牌匾、定制奖杯',
            use_case_4_title: '替换零件',
            use_case_4_desc: '家电零件、汽车零件、机械部件',
            use_case_5_title: '科技配件',
            use_case_5_desc: '手机壳、平板支架、理线器',
            use_case_6_title: '商业和办公',
            use_case_6_desc: '标牌、名片夹、定制印章、产品展示架',
            use_case_7_title: 'UV DTF贴纸',
            use_case_7_desc: '防水贴花，适用于笔记本电脑、汽车、瓶子',
            use_case_8_title: '杯子和保温杯',
            use_case_8_desc: '定制保温杯、带设计的瓶子、印照片的马克杯',
            use_case_9_title: '磁铁和牌匾',
            use_case_9_desc: '冰箱磁铁、身份铭牌、标识',
            gallery_title: '项目画廊',
            gallery_subtitle: '我们创作的一些示例',
            gallery_filter_all: '全部',
            gallery_filter_3d: '3D打印',
            gallery_filter_laser: '激光切割',
            gallery_filter_uv: 'UV打印',
            gallery_3d_1: '手办和原型',
            gallery_3d_1_caption: '多色PLA制作的角色、收藏手办和功能原型',
            gallery_3d_2: '功能零件',
            gallery_3d_2_caption: 'PETG和ABS制作的备件、工具和机械部件',
            gallery_3d_3: '装饰品',
            gallery_3d_3_caption: '花盆、灯具、收纳盒和定制装饰品',
            gallery_laser_1: '木材雕刻',
            gallery_laser_1_caption: '天然木材制作的标牌、定制牌匾和装饰品',
            gallery_laser_2: '皮革雕刻',
            gallery_laser_2_caption: '定制皮革钱包、腰带、钥匙扣和配件',
            gallery_laser_3: '亚克力切割',
            gallery_laser_3_caption: '发光标牌、展示架和装饰亚克力零件',
            gallery_uv_1: '马克杯和玻璃杯',
            gallery_uv_1_caption: '旋转UV打印的定制保温杯、马克杯和瓶子',
            gallery_uv_2: 'UV DTF贴纸',
            gallery_uv_2_caption: '适用于笔记本电脑、汽车等的防水贴花',
            gallery_uv_3: '磁铁和牌匾',
            gallery_uv_3_caption: '定制磁铁、身份铭牌和UV标识',
            gallery_note: '💡 有项目想法？联系我们获取个性化报价',
            gallery_cta_btn: '请求报价',
            clients_title: '我们的客户',
            clients_subtitle: '信任我们的企业',
            wa_subtitle: '通常在几分钟内回复',
            wa_greeting: '你好！👋 我们能为您做什么？请告诉我们您的项目。',
            wa_placeholder: '在此输入您的消息...',
            wa_btn: '开始聊天 →',            contact_title: '联系我们',
            contact_subtitle: '告诉我们您的项目，我们会尽快回复您',
            form_name: '姓名',
            form_email: '邮箱',
            form_phone: '电话',
            form_service: '感兴趣的服务',
            form_select: '选择服务',
            form_opt_3d: '3D打印',
            form_opt_uv: 'UV打印',
            form_opt_laser: '激光切割',
            form_opt_photo: '照片打印',
            form_opt_other: '其他',
            form_message: '留言',
            form_submit: '发送消息',
            form_success: '消息发送成功！我们会尽快联系您。',
            form_error: '发送消息时出错，请重试。',
            contact_email_label: '邮箱',
            contact_phone_label: '电话',
            contact_hours_label: '营业时间',
            contact_hours: '周一 - 周五：9:00 - 18:00',
            footer_rights: '版权所有。',
            footer_trademark: 'Filamorfosis®是注册商标。'
        }
    };

    let currentLang = 'es';
    
    // Language flag mapping
    const langFlags = {
        es: '🇪🇸',
        en: '🇬🇧',
        ja: '🇯🇵',
        zh: '🇨🇳'
    };
    
    const langCodes = {
        es: 'ES',
        en: 'EN',
        ja: '日本語',
        zh: '中文'
    };

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

        // Update desktop dropdown current language
        $('#currentLang .flag').text(langFlags[lang]);
        $('#currentLang .lang-text').text(langCodes[lang]);

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
        
        // Close all dropdowns
        $('.lang-selector').removeClass('active');
        $('.lang-selector-mob').removeClass('active');
    }

    // Initialize language
    $(document).ready(function() {
        const savedLang = localStorage.getItem('preferredLanguage') || 'es';
        switchLanguage(savedLang);

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
            $('.navbar__toggle span').css({'transform': 'none', 'opacity': '1'});
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

    $('.service-card, .equipment-card, .contact-info-item, .material-card, .use-case-card, .gallery-item, .client-card').each(function() {
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

    // Material Modal Functionality
    $('.material-card.clickable').on('click', function() {
        const material = $(this).data('material');
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
    });

    // Technical Details Button Click
    $('.material-tech-details-btn').on('click', function() {
        const material = $('#materialModal').data('current-material');
        const data = materialData[material];
        const lang = currentLang;

        if (data && data.technical) {
            // Hide first modal
            $('#materialModal').fadeOut(200, function() {
                // Set technical modal content
                $('.technical-modal-title').text(`${data.name} - ${translations[lang].tech_specifications || 'Especificaciones Técnicas'}`);
                $('#technicalModal .material-modal-icon').text(data.icon);

                // Populate mechanical properties
                $('.mechanical-specs').empty();
                data.technical.mechanical[lang].forEach(spec => {
                    $('.mechanical-specs').append(`<li><strong>${spec.label}:</strong> <span>${spec.value}</span></li>`);
                });

                // Populate thermal properties
                $('.thermal-specs').empty();
                data.technical.thermal[lang].forEach(spec => {
                    $('.thermal-specs').append(`<li><strong>${spec.label}:</strong> <span>${spec.value}</span></li>`);
                });

                // Populate physical properties
                $('.physical-specs').empty();
                data.technical.physical[lang].forEach(spec => {
                    $('.physical-specs').append(`<li><strong>${spec.label}:</strong> <span>${spec.value}</span></li>`);
                });

                // Populate durability specs
                $('.durability-specs').empty();
                data.technical.durability[lang].forEach(spec => {
                    $('.durability-specs').append(`<li><strong>${spec.label}:</strong> <span>${spec.value}</span></li>`);
                });

                // Set recommendations
                $('.tech-recommendations').text(data.technical.recommendations[lang]);

                // Show technical modal
                $('#technicalModal').fadeIn(300);
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

})(jQuery);
