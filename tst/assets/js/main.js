'use strict';

(function ($) {
    // Particles and smoky wave removed — hero now uses video background

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
            hero_cta_secondary: 'Explorar Servicios',
            services_title: 'Servicios a tu Medida',
            services_subtitle: 'Productos listos para personalizar — o diseñamos juntos algo único para ti.',
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
            service_engrave_title: 'Grabado Láser',
            service_engrave_desc: 'Grabado de alta precisión sobre madera, metal, vidrio, cuero y más. Personaliza cualquier superficie con detalle fotográfico.',
            service_engrave_feat1: 'Detalle fotográfico y vectorial',
            service_engrave_feat2: 'Permanente — no se borra ni desvanece',
            service_engrave_feat3: 'Madera, metal, vidrio, cuero, piedra',
            service_engrave_examples_title: '¿Qué podemos grabar?',
            service_engrave_ex1: '🎁 Regalos personalizados',
            service_engrave_ex2: '🏅 Trofeos y placas',
            service_engrave_ex3: '🔑 Llaveros y accesorios',
            service_engrave_ex4: '🍾 Botellas y vasos',
            service_engrave_ex5: '📱 Gadgets y electrónicos',
            service_scan_title: 'Escaneo 3D',
            service_scan_desc: 'Convertimos objetos físicos en modelos digitales 3D. Ideal para replicar piezas, crear regalos personalizados o digitalizar recuerdos.',
            service_scan_feat1: 'Escanea desde joyería hasta muebles',
            service_scan_feat2: 'Captura color y textura real',
            service_scan_feat3: 'Listo para imprimir en 3D',
            service_scan_examples_title: '¿Qué puedes escanear?',
            service_scan_ex1: '🏺 Figuras y esculturas',
            service_scan_ex2: '🔩 Piezas y repuestos',
            service_scan_ex3: '👤 Bustos y retratos',
            service_scan_ex4: '🎁 Objetos para replicar',
            service_scan_ex5: '🚗 Partes de vehículos',
            equip_card6_title: 'Escaneo 3D',
            equip_card6_desc: 'Digitalizamos cualquier objeto físico con alta precisión. Desde joyería pequeña hasta muebles y vehículos, con color real incluido.',
            equip_card6_feat1: 'Objetos desde 5cm hasta muebles completos',
            equip_card6_feat2: 'Captura color y textura en 48 MP',
            equip_card6_feat3: 'Archivo listo para imprimir en 3D',
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
            materials_toggle: 'Haz clic aquí para conocer todos los filamentos y materiales que usamos',
            mat_ideal_for: 'Ideal para',
            mat_more_info: '📋 Ver detalles técnicos',
            mat_learn_more: '✨ Saber más',
            mat_badge_eco: 'Eco',
            mat_badge_tough: 'Duro',
            mat_badge_flex: 'Flex',
            mat_badge_heat: 'Calor',
            mat_badge_pro: 'Pro',
            eco_headline: 'Impresión Consciente con el Planeta',
            eco_desc: 'Nuestro material principal, el PLA, es de origen vegetal — fabricado a partir de almidón de maíz y caña de azúcar. Es biodegradable y una alternativa más verde a los plásticos tradicionales.',
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
            gallery_filter_engrave: 'Grabado Láser',
            gallery_filter_scan: 'Escaneo 3D',
            gallery_filter_uv: 'Impresión UV',
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
            wa_greeting: '¿Estás listo para llevar tu idea a la realidad? 🚀',
            wa_placeholder: 'Escribe tu mensaje aquí...',
            wa_btn: 'Iniciar Chat →',
            btl_eyebrow: 'De la idea a la realidad',
            btl_title: 'Tu boceto se convierte en algo real',
            btl_subtitle: 'No necesitas ser diseñador. Si puedes dibujarlo, imaginarlo o describirlo — nosotros lo hacemos realidad.',
            btl_before_label: 'Tu idea',
            btl_before_title: 'Empieza con un boceto',
            btl_before_desc: 'Un dibujo en papel, una foto de referencia, una descripción — cualquier punto de partida funciona.',
            btl_step1: 'Diseño 3D', btl_step2: 'Impresión', btl_step3: 'Acabado',
            btl_after_label: 'Tu objeto real',
            btl_after_title: 'Se vuelve realidad',
            btl_after_desc: 'Un objeto físico, preciso y duradero — listo para usar, regalar o vender.',
            btl_feat1: 'No necesitas saber diseño 3D',
            btl_feat2: 'Te asesoramos en cada paso',
            btl_feat3: 'Entregas rápidas',
            btl_feat4: 'Desde 1 pieza hasta producción',
            btl_cta: 'Cuéntanos tu idea →',
            moq_single: 'pieza mínima',
            moq_headline: 'Sin mínimos. Sin excusas.',
            moq_sub: '¿Necesitas una sola pieza? La hacemos. ¿Necesitas 500? También. Tú decides cuánto.',
            moq_bulk: 'producción a escala',            equipment_subtitle: 'Tecnología profesional para resultados excepcionales',
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
            form_opt_engrave: 'Grabado Láser',
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
            cert_mexico: 'Producción en México',
            cert_materials: 'Materiales certificados',
            cert_quality: 'Calidad garantizada',
            
            // ── Catalog keys ──
            nav_catalog: '🛍️ Catálogo',
            hero_badge: 'Catálogo Oficial 2025',
            hero_title_1: 'Productos',
            hero_title_2: 'Listos para Ordenar',
            hero_subtitle: 'Elige tu producto, personalízalo a tu gusto y recíbelo en casa. Productos únicos hechos para ti — porque ser igual que todos no es una opción.',
            stat_products: 'Productos',
            stat_min: 'Pieza mínima',
            stat_response: 'Respuesta',
            empty_text: 'No se encontraron productos',
            footer_note_cat: 'Precios en MXN. Sujetos a cambio sin previo aviso. Cotización final según especificaciones.',
            search_placeholder: 'Buscar producto...',
            filter_all: 'Todos',
            from_label: 'Desde',
            see_details: 'Ver detalles',
            cat_uv: 'Impresión UV',
            cat_3d: 'Impresión 3D',
            cat_laser: 'Corte Láser',
            cat_engrave: 'Grabado Láser',
            cat_photo: 'Fotografía',
            products_count_one: 'producto disponible',
            products_count_many: 'productos disponibles',
            modal_variants: 'Variantes disponibles',
            modal_features: 'Características',
            modal_price_title: 'Tabla de Precios',
            modal_flat: '🖨️ Plano',
            modal_relief: '🏔️ Relieve hasta 1mm',
            modal_variant_col: 'Variante / Tamaño',
            legend_flat: 'Impresión plana — diseño 2D estándar',
            legend_relief: 'Relieve hasta 1mm — textura táctil 3D',
            cta_quote: 'Cotizar ahora',
            badge_hot: '🔥 Popular',
            badge_new: '✨ Nuevo',
            badge_promo: '🏷️ Promo',
            no_image: 'Vista previa próximamente',
            no_image_short: 'Sin imagen',
                        // ── Filter keys ──
            filter_all: 'Todos',
            filter_gift: '🎁 Regalos',
            filter_business: '💼 Empresarial',
            filter_popular: '🔥 Popular',
            filter_new: '✨ Nuevo',
            filter_budget: '💰 Económico',
            filter_premium: '💎 Premium',
            filter_decor: '🖼️ Decoración',
            filter_drinkware: '☕ Bebidas',
            footer_trademark: 'Filamorfosis® es una marca registrada.',
            // ── Store CTA keys ──
            'hero.shopNow': 'Explorar Productos',
            'nav.store': 'Tienda',
            'gallery.viewAll': 'Ver todos los productos →',
            'service.viewProducts': 'Ver productos',
            'add_to_cart': 'Agregar al carrito',
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
            hero_cta_secondary: 'Explore Services',
            services_title: 'Tailored Services',
            services_subtitle: 'Ready-to-personalize products — or let\'s build something one-of-a-kind together.',
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
            service_engrave_title: 'Laser Engraving',
            service_engrave_desc: 'High-precision laser engraving on wood, metal, glass, leather and more. Personalize any surface with photographic detail.',
            service_engrave_feat1: 'Photographic and vector detail',
            service_engrave_feat2: 'Permanent — never fades or wears off',
            service_engrave_feat3: 'Wood, metal, glass, leather, stone',
            service_engrave_examples_title: 'What can we engrave?',
            service_engrave_ex1: '🎁 Personalized gifts',
            service_engrave_ex2: '🏅 Trophies and plaques',
            service_engrave_ex3: '🔑 Keychains and accessories',
            service_engrave_ex4: '🍾 Bottles and glasses',
            service_engrave_ex5: '📱 Gadgets and electronics',
            service_scan_title: '3D Scanning',
            service_scan_desc: 'We turn physical objects into digital 3D models. Perfect for replicating parts, creating personalized gifts, or preserving memories.',
            service_scan_feat1: 'Scans from jewelry to full furniture',
            service_scan_feat2: 'Captures real color and texture',
            service_scan_feat3: 'Ready to 3D print',
            service_scan_examples_title: 'What can you scan?',
            service_scan_ex1: '🏺 Figures and sculptures',
            service_scan_ex2: '🔩 Parts and spare pieces',
            service_scan_ex3: '👤 Busts and portraits',
            service_scan_ex4: '🎁 Objects to replicate',
            service_scan_ex5: '🚗 Vehicle parts',
            equip_card6_title: '3D Scanning',
            equip_card6_desc: 'We digitize any physical object with high precision. From small jewelry to full furniture and vehicles, with real color included.',
            equip_card6_feat1: 'Objects from 5cm to full furniture',
            equip_card6_feat2: 'Captures color and texture at 48 MP',
            equip_card6_feat3: 'File ready to 3D print',
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
            materials_toggle: 'Click here to know about all the filaments and materials we use',
            mat_ideal_for: 'Ideal for',
            mat_more_info: '📋 View technical details',
            mat_learn_more: '✨ Learn more',
            mat_badge_eco: 'Eco',
            mat_badge_tough: 'Tough',
            mat_badge_flex: 'Flex',
            mat_badge_heat: 'Heat',
            mat_badge_pro: 'Pro',
            eco_headline: 'Eco-Conscious Printing',
            eco_desc: 'Our primary material, PLA, is plant-based — made from corn starch and sugarcane. It\'s biodegradable and a greener alternative to traditional plastics.',
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
            gallery_filter_engrave: 'Laser Engraving',
            gallery_filter_scan: '3D Scanning',
            gallery_filter_uv: 'UV Printing',
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
            wa_greeting: 'Are you ready to bring your idea to reality? 🚀',
            wa_placeholder: 'Type your message here...',
            wa_btn: 'Start Chat →',
            btl_eyebrow: 'From idea to reality',
            btl_title: 'Your sketch becomes something real',
            btl_subtitle: "You don't need to be a designer. If you can draw it, imagine it or describe it — we make it happen.",
            btl_before_label: 'Your idea',
            btl_before_title: 'Start with a sketch',
            btl_before_desc: 'A drawing on paper, a reference photo, a description — any starting point works.',
            btl_step1: '3D Design', btl_step2: 'Printing', btl_step3: 'Finishing',
            btl_after_label: 'Your real object',
            btl_after_title: 'It becomes reality',
            btl_after_desc: 'A physical, precise and durable object — ready to use, gift or sell.',
            btl_feat1: "No 3D design knowledge needed",
            btl_feat2: 'We guide you every step of the way',
            btl_feat3: 'Fast turnaround',
            btl_feat4: 'From 1 piece to full production',
            btl_cta: 'Tell us your idea →',
            moq_single: 'minimum pieces',
            moq_headline: 'No minimums. No excuses.',
            moq_sub: 'Need just one piece? Done. Need 500? Also done. You decide how many.',
            moq_bulk: 'bulk production',            contact_title: 'Contact Us',
            contact_subtitle: 'Tell us about your project and we\'ll get back to you soon',
            form_name: 'Name',
            form_email: 'Email',
            form_phone: 'Phone',
            form_service: 'Service of Interest',
            form_select: 'Select a service',
            form_opt_3d: '3D Printing',
            form_opt_uv: 'UV Printing',
            form_opt_laser: 'Laser Cutting',
            form_opt_engrave: 'Laser Engraving',
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
            cert_mexico: 'Made in Mexico',
            cert_materials: 'Certified materials',
            cert_quality: 'Quality guaranteed',
                        // ── Catalog keys ──
            nav_catalog: '🛍️ Catalog',
            hero_badge: 'Official Catalog 2025',
            hero_title_1: 'Products',
            hero_title_2: 'Ready to Order',
            hero_subtitle: 'Pick your product, customize it your way, and get it delivered. Unique personalized products — because blending in was never your style.',
            stat_products: 'Products',
            stat_min: 'Minimum piece',
            stat_response: 'Response',
            empty_text: 'No products found',
            footer_note_cat: 'Prices in MXN. Subject to change without notice. Final quote based on specifications.',
            search_placeholder: 'Search product...',
            filter_all: 'All',
            from_label: 'From',
            see_details: 'See details',
            cat_uv: 'UV Printing',
            cat_3d: '3D Printing',
            cat_laser: 'Laser Cutting',
            cat_engrave: 'Laser Engraving',
            cat_photo: 'Photography',
            products_count_one: 'product available',
            products_count_many: 'products available',
            modal_variants: 'Available variants',
            modal_features: 'Features',
            modal_price_title: 'Price Table',
            modal_flat: '🖨️ Flat',
            modal_relief: '🏔️ Relief up to 1mm',
            modal_variant_col: 'Variant / Size',
            legend_flat: 'Flat printing — standard 2D design',
            legend_relief: 'Relief up to 1mm — tactile 3D texture',
            cta_quote: 'Get a quote',
            badge_hot: '🔥 Popular',
            badge_new: '✨ New',
            badge_promo: '🏷️ Promo',
            no_image: 'Preview coming soon',
            no_image_short: 'No image',
                        // ── Filter keys ──
            filter_all: 'All',
            filter_gift: '🎁 Gifts',
            filter_business: '💼 Business',
            filter_popular: '🔥 Popular',
            filter_new: '✨ New',
            filter_budget: '💰 Budget',
            filter_premium: '💎 Premium',
            filter_decor: '🖼️ Decor',
            filter_drinkware: '☕ Drinkware',
            footer_trademark: '',
            // ── Store CTA keys ──
            'hero.shopNow': 'Explore Products',
            'nav.store': 'Store',
            'gallery.viewAll': 'View all products →',
            'service.viewProducts': 'View products',
            'add_to_cart': 'Add to cart',
        },
        de: {
            nav_home: 'Start',
            nav_services: 'Dienste',
            nav_equipment: 'Ausrüstung',
            nav_clients: 'Kunden',
            nav_contact: 'Kontakt',
            hero_title: 'Deine Ideen. Deine Realität.',
            hero_subtitle: 'Wir verwandeln deine Vorstellung in greifbare Objekte, Schicht für Schicht.',
            hero_cta: 'Angebot anfordern',
            hero_cta_secondary: 'Dienste erkunden',
            services_title: 'Maßgeschneiderte Dienste',
            services_subtitle: 'Sofort personalisierbare Produkte — oder wir erschaffen gemeinsam etwas Einzigartiges.',
            service_3d_title: '3D-Druck',
            service_3d_desc: 'Erwecke deine Ideen mit Mehrfarb- und Multimaterialdruck zum Leben. Von Prototypen bis zu funktionalen Teilen.',
            service_3d_feat1: 'Bis zu 5 Farben in einem Teil',
            service_3d_feat2: 'Flexible und robuste Materialien',
            service_3d_feat3: 'Millimetergenaue Präzision',
            service_3d_examples_title: 'Was kannst du erstellen?',
            service_3d_ex1: '🎮 Figuren und Spielzeug',
            service_3d_ex2: '🏠 Heimdekoration',
            service_3d_ex3: '🔧 Ersatzteile',
            service_3d_ex4: '📱 Tech-Zubehör',
            service_3d_ex5: '🎁 Personalisierte Geschenke',
            service_uv_title: 'UV-Druck',
            service_uv_desc: 'Personalisiere fast jede Oberfläche mit lebendigen, langlebigen Farben. Tassen, Gläser, Holz, Metall, Glas und mehr.',
            service_uv_feat1: 'Druck auf zylindrische Objekte',
            service_uv_feat2: 'Farben, die nicht verblassen',
            service_uv_feat3: 'Wasserfeste Aufkleber',
            service_uv_examples_title: 'Was kannst du personalisieren?',
            service_uv_ex1: '☕ Tassen und Thermobecher',
            service_uv_ex2: '🏷️ UV DTF Aufkleber',
            service_uv_ex3: '🧲 Personalisierte Magnete',
            service_uv_ex4: '🪵 Holzplatten',
            service_uv_ex5: '🎨 Dekorative Objekte',
            service_laser_title: 'Laserschneiden',
            service_laser_desc: 'Schneiden und gravieren mit chirurgischer Präzision. Perfekt für Schilder, Dekoration, personalisierte Geschenke und mehr.',
            service_laser_feat1: 'Saubere und präzise Schnitte',
            service_laser_feat2: 'Gravuren mit unglaublichen Details',
            service_laser_feat3: 'Holz, Acryl, Leder und mehr',
            service_laser_examples_title: 'Was können wir machen?',
            service_laser_ex1: '🪵 Holzschilder',
            service_laser_ex2: '👜 Lederaccessoires',
            service_laser_ex3: '💎 Acrylteile',
            service_laser_ex4: '🏢 Unternehmensbeschilderung',
            service_laser_ex5: '🎁 Gravierte Geschenke',
            service_engrave_title: 'Lasergravur',
            service_engrave_desc: 'Hochpräzise Lasergravur auf Holz, Metall, Glas, Leder und mehr. Personalisiere jede Oberfläche mit fotografischem Detail.',
            service_engrave_feat1: 'Fotografisches und vektorielles Detail',
            service_engrave_feat2: 'Permanent — verblasst nie',
            service_engrave_feat3: 'Holz, Metall, Glas, Leder, Stein',
            service_engrave_examples_title: 'Was können wir gravieren?',
            service_engrave_ex1: '🎁 Personalisierte Geschenke',
            service_engrave_ex2: '🏅 Trophäen und Plaketten',
            service_engrave_ex3: '🔑 Schlüsselanhänger',
            service_engrave_ex4: '🍾 Flaschen und Gläser',
            service_engrave_ex5: '📱 Gadgets und Elektronik',
            service_scan_title: '3D-Scanning',
            service_scan_desc: 'Wir wandeln physische Objekte in digitale 3D-Modelle um. Ideal zum Replizieren von Teilen oder Digitalisieren von Erinnerungen.',
            service_scan_feat1: 'Scannt von Schmuck bis Möbel',
            service_scan_feat2: 'Erfasst echte Farbe und Textur',
            service_scan_feat3: 'Druckfertige Datei',
            service_scan_examples_title: 'Was kannst du scannen?',
            service_scan_ex1: '🏺 Figuren und Skulpturen',
            service_scan_ex2: '🔩 Teile und Ersatzteile',
            service_scan_ex3: '👤 Büsten und Porträts',
            service_scan_ex4: '🎁 Objekte zum Replizieren',
            service_scan_ex5: '🚗 Fahrzeugteile',
            equip_card6_title: '3D-Scanning',
            equip_card6_desc: 'Wir digitalisieren jedes physische Objekt mit hoher Präzision — von kleinem Schmuck bis zu Möbeln.',
            equip_card6_feat1: 'Objekte von 5cm bis zu ganzen Möbeln',
            equip_card6_feat2: 'Farbe und Textur in 48 MP',
            equip_card6_feat3: 'Druckfertige Datei',
            service_photo_title: 'Fotodruck',
            service_photo_desc: 'Deine Erinnerungen verdienen die beste Qualität. Professioneller Druck für deine besonderen Momente.',
            service_photo_feat1: 'Professionelle Qualität',
            service_photo_feat2: 'Erstklassiges Papier',
            service_photo_feat3: 'Alle Größen',
            service_photo_examples_title: 'Was drucken wir?',
            service_photo_ex1: '📸 Familienfotos',
            service_photo_ex2: '🖼️ Dekorative Bilder',
            service_photo_ex3: '📅 Personalisierte Kalender',
            service_photo_ex4: '💼 Werbematerial',
            service_photo_ex5: '🎨 Kunst und Poster',
            equipment_title: 'Was können wir erstellen?',
            equipment_subtitle: 'Von kleinen Spielzeugen bis zu großen, robusten Teilen',
            equip_card1_title: 'Hochgeschwindigkeits-3D-Druck',
            equip_card1_desc: 'Objekte aus farbigem Kunststoff. Perfekt für Prototypen, Figuren und personalisierte Teile.',
            equip_card1_feat1: 'Größe: bis 25cm x 25cm x 25cm',
            equip_card1_feat2: 'Bis zu 4 Farben in einem Teil',
            equip_card1_feat3: 'Materialien: PLA, PETG, flexibles TPU',
            equip_card2_title: 'Kompakter 3D-Druck',
            equip_card2_desc: 'Ideal für kleine und mittlere Objekte. Schnell und leise, perfekt für Dekoration und Geschenke.',
            equip_card2_feat1: 'Größe: bis 18cm x 18cm x 18cm',
            equip_card2_feat2: 'Mehrfarb verfügbar',
            equip_card2_feat3: 'Materialien: PLA, PETG, TPU',
            equip_card3_title: 'Großer und robuster 3D-Druck',
            equip_card3_desc: 'Für große und robuste Projekte. Bis zu 5 verschiedene Materialien in einem Teil.',
            equip_card3_feat1: 'Größe: bis 36cm x 36cm x 36cm',
            equip_card3_feat2: 'Bis zu 5 Farben/Materialien',
            equip_card3_feat3: 'Materialien: PLA, PETG, ABS, PA+CF',
            equip_card4_title: 'Direkter UV-Druck',
            equip_card4_desc: 'Wir drucken Designs in Vollfarbe auf fast alles: Tassen, Gläser, Holz, Metall, Glas, Kunststoff.',
            equip_card4_feat1: 'Druck auf zylindrische Objekte',
            equip_card4_feat2: 'Robuste UV DTF Aufkleber',
            equip_card4_feat3: 'Magnete, Platten und mehr',
            equip_card5_title: 'Laserschneiden und -gravieren',
            equip_card5_desc: 'Wir schneiden und gravieren Designs in Holz, Acryl, Leder, Karton und mehr.',
            equip_card5_feat1: 'Bereich: 40cm x 40cm',
            equip_card5_feat2: 'Schneidet 2cm dickes Holz',
            equip_card5_feat3: 'Superpräzise Gravuren',
            materials_title: 'Materialien, die wir verwenden',
            materials_subtitle: 'Klicke auf jedes Material für mehr Details',
            materials_toggle: 'Klicke hier, um alle Filamente und Materialien zu entdecken',
            mat_ideal_for: 'Ideal für',
            mat_more_info: '📋 Technische Details',
            mat_learn_more: '✨ Mehr erfahren',
            mat_badge_eco: 'Öko',
            mat_badge_tough: 'Hart',
            mat_badge_flex: 'Flex',
            mat_badge_heat: 'Hitze',
            mat_badge_pro: 'Pro',
            eco_headline: 'Umweltbewusstes Drucken',
            eco_desc: 'Unser Hauptmaterial PLA ist pflanzlich — hergestellt aus Maisstärke und Zuckerrohr. Es ist biologisch abbaubar und eine grünere Alternative zu herkömmlichen Kunststoffen.',
            modal_properties: 'Eigenschaften',
            modal_advantages: 'Vorteile',
            modal_applications: 'Anwendungen',
            modal_examples: 'Anwendungsbeispiele',
            modal_tech_btn: '📊 Klicke hier für technische Materialdetails',
            tech_specifications: 'Technische Spezifikationen',
            tech_mechanical: 'Mechanische Eigenschaften',
            tech_thermal: 'Thermische Eigenschaften',
            tech_physical: 'Physikalische Eigenschaften',
            tech_durability: 'Haltbarkeit und Widerstandsfähigkeit',
            tech_recommendations: 'Verwendungsempfehlungen',
            material_pla: 'Das häufigste. Einfach zu verwenden, in vielen Farben erhältlich. Perfekt für Dekoration und Prototypen.',
            material_pla_uses: 'Ideal für: Figuren, Spielzeug, Dekoration, Prototypen, Organizer',
            material_petg: 'Stärker und flexibler als PLA. Wasserbeständig. Ideal für häufig verwendete Objekte.',
            material_petg_uses: 'Ideal für: Flaschen, Behälter, mechanische Teile, Außenobjekte',
            material_tpu: 'Super flexibel wie Gummi. Perfekt für Handyhüllen, weiches Spielzeug und biegbare Teile.',
            material_tpu_uses: 'Ideal für: Handyhüllen, Riemen, Dichtungen, flexibles Spielzeug',
            material_abs: 'Sehr hitzebeständig. Das gleiche Material wie LEGO. Ideal für mechanische Teile.',
            material_abs_uses: 'Ideal für: Autoteile, Gehäuse, Werkzeuge, hitzebeständige Teile',
            material_pacf: 'Das stärkste. Enthält Kohlefaser. Für Teile, die extrem widerstandsfähig sein müssen.',
            material_pacf_uses: 'Ideal für: Drohnen, Industrieteile, Werkzeuge, Lastträger',
            use_cases_title: 'Beispiele unserer Arbeit',
            use_case_1_title: 'Spielzeug und Figuren',
            use_case_1_desc: 'Videospielcharaktere, Sammlerfiguren, personalisiertes Spielzeug',
            use_case_2_title: 'Heimdekoration',
            use_case_2_desc: 'Blumentöpfe, Lampen, Organizer, personalisierte Schilder, Rahmen',
            use_case_3_title: 'Personalisierte Geschenke',
            use_case_3_desc: 'Tassen mit Namen, Schlüsselanhänger, gravierte Platten, personalisierte Trophäen',
            use_case_4_title: 'Ersatzteile',
            use_case_4_desc: 'Ersatzteile für Haushaltsgeräte, Autoteile, mechanische Komponenten',
            use_case_5_title: 'Tech-Zubehör',
            use_case_5_desc: 'Handyhüllen, Tablet-Ständer, Kabelorganizer',
            use_case_6_title: 'Büro und Geschäft',
            use_case_6_desc: 'Schilder, Visitenkartenhalter, personalisierte Stempel, Produktdisplays',
            use_case_7_title: 'UV DTF Aufkleber',
            use_case_7_desc: 'Wasserfeste Aufkleber für Laptops, Autos, Flaschen',
            use_case_8_title: 'Becher und Tumblers',
            use_case_8_desc: 'Personalisierte Thermobecher, Flaschen mit Designs, Fototassen',
            use_case_9_title: 'Magnete und Platten',
            use_case_9_desc: 'Kühlschrankmagnete, Namensschilder, Beschilderung',
            gallery_title: 'Projektgalerie',
            gallery_subtitle: 'Einige Beispiele unserer Arbeit',
            gallery_filter_all: 'Alle',
            gallery_filter_3d: '3D-Druck',
            gallery_filter_laser: 'Laserschneiden',
            gallery_filter_engrave: 'Lasergravur',
            gallery_filter_scan: '3D-Scanning',
            gallery_filter_uv: 'UV-Druck',
            gallery_3d_1_caption: 'Charaktere, Sammlerfiguren und funktionale Prototypen in mehrfarbigem PLA',
            gallery_3d_2: 'Funktionale Teile',
            gallery_3d_2_caption: 'Ersatzteile, Werkzeuge und mechanische Komponenten in PETG und ABS',
            gallery_3d_3: 'Dekoration',
            gallery_3d_3_caption: 'Blumentöpfe, Lampen, Organizer und personalisierte Dekorationsobjekte',
            gallery_laser_1: 'Holzgravur',
            gallery_laser_1_caption: 'Schilder, personalisierte Platten und Dekoration aus Naturholz',
            gallery_laser_2: 'Ledergravur',
            gallery_laser_2_caption: 'Geldbörsen, Gürtel, Schlüsselanhänger und personalisiertes Lederzubehör',
            gallery_laser_3: 'Acrylschnitt',
            gallery_laser_3_caption: 'Leuchtschilder, Displays und dekorative Acrylteile',
            gallery_uv_1: 'Tassen und Becher',
            gallery_uv_1_caption: 'Personalisierte Tumblers, Tassen und Flaschen mit UV-Druck',
            gallery_uv_2: 'UV DTF Aufkleber',
            gallery_uv_2_caption: 'Wasserfeste Aufkleber für Laptops, Autos und mehr',
            gallery_uv_3: 'Magnete und Platten',
            gallery_uv_3_caption: 'Personalisierte Magnete, Namensschilder und UV-Beschilderung',
            gallery_note: '💡 Hast du ein Projekt im Sinn? Kontaktiere uns für ein individuelles Angebot',
            gallery_cta_btn: 'Angebot anfordern',
            clients_title: 'Unsere Kunden',
            clients_subtitle: 'Unternehmen, die uns vertrauen',
            wa_subtitle: 'Antwortet normalerweise innerhalb von Minuten',
            wa_greeting: 'Bist du bereit, deine Idee Wirklichkeit werden zu lassen? 🚀',
            wa_placeholder: 'Schreibe deine Nachricht hier...',
            wa_btn: 'Chat starten →',
            btl_eyebrow: 'Von der Idee zur Realität',
            btl_title: 'Deine Skizze wird zu etwas Realem',
            btl_subtitle: 'Du musst kein Designer sein. Wenn du es zeichnen, vorstellen oder beschreiben kannst — wir machen es wahr.',
            btl_before_label: 'Deine Idee',
            btl_before_title: 'Beginne mit einer Skizze',
            btl_before_desc: 'Eine Zeichnung auf Papier, ein Referenzfoto, eine Beschreibung — jeder Ausgangspunkt funktioniert.',
            btl_step1: '3D-Design', btl_step2: 'Druck', btl_step3: 'Finish',
            btl_after_label: 'Dein echtes Objekt',
            btl_after_title: 'Wird Wirklichkeit',
            btl_after_desc: 'Ein physisches, präzises und langlebiges Objekt — bereit zum Verwenden, Verschenken oder Verkaufen.',
            btl_feat1: 'Kein 3D-Design-Wissen nötig',
            btl_feat2: 'Wir beraten dich bei jedem Schritt',
            btl_feat3: 'Schnelle Lieferung',
            btl_feat4: 'Von 1 Stück bis zur Produktion',
            btl_cta: 'Erzähl uns deine Idee →',
            moq_single: 'Mindeststück',
            moq_headline: 'Keine Mindestmengen. Keine Ausreden.',
            moq_sub: 'Brauchst du nur ein Stück? Wir machen es. 500? Auch. Du entscheidest.',
            moq_bulk: 'Skalierte Produktion',
            equipment_subtitle: 'Professionelle Technologie für außergewöhnliche Ergebnisse',
            equip_card1_title: 'Hochgeschwindigkeits-3D-Druck',
            equip_card1_desc: 'Geschwindigkeiten bis 300mm/s mit automatischer LIDAR-Kalibrierung und Unterstützung für fortschrittliche Materialien.',
            equip_card2_title: 'Kompakter 3D-Druck',
            equip_card2_desc: 'Kompaktes System mit Geschwindigkeiten bis 500mm/s und leiser Betrieb ≤48dB.',
            equip_card3_title: 'Großformat-3D-Druck',
            equip_card3_desc: 'Werkzeugwechselsystem mit bis zu 5 unabhängigen Köpfen für Multimaterialdruck.',
            equip_card4_title: 'Direkter UV-Druck',
            equip_card4_desc: 'Direktdruck auf mehrere Oberflächen mit 3D-Texturen und Millionen von Farben.',
            equip_card5_title: 'Laserschneiden und -gravieren',
            equip_card5_desc: '40W-Laser mit 400×400mm Arbeitsbereich und Graviergeschwindigkeit bis 36000mm/min.',
            contact_title: 'Kontakt',
            contact_subtitle: 'Erzähl uns von deinem Projekt und wir melden uns bald',
            form_name: 'Name',
            form_email: 'E-Mail',
            form_phone: 'Telefon',
            form_service: 'Gewünschter Dienst',
            form_select: 'Dienst auswählen',
            form_opt_3d: '3D-Druck',
            form_opt_uv: 'UV-Druck',
            form_opt_laser: 'Laserschneiden',
            form_opt_engrave: 'Lasergravur',
            form_opt_photo: 'Fotodruck',
            form_opt_other: 'Sonstiges',
            form_message: 'Nachricht',
            form_submit: 'Nachricht senden',
            form_success: 'Nachricht erfolgreich gesendet! Wir melden uns bald.',
            form_error: 'Fehler beim Senden. Bitte versuche es erneut.',
            contact_email_label: 'E-Mail',
            contact_phone_label: 'Telefon',
            contact_hours_label: 'Öffnungszeiten',
            contact_hours: 'Mo - Fr: 9:00 - 18:00',
            footer_rights: 'Alle Rechte vorbehalten.',
            cert_mexico: 'Hergestellt in Mexiko',
            cert_materials: 'Zertifizierte Materialien',
            cert_quality: 'Qualität garantiert',
            
            // ── Catalog keys ──
            nav_catalog: '🛍️ Katalog',
            hero_badge: 'Offizieller Katalog 2025',
            hero_title_1: 'Produkte',
            hero_title_2: 'Bestellbereit',
            hero_subtitle: 'Wähle dein Produkt, personalisiere es nach deinem Geschmack und lass es liefern. Einzigartige Produkte — weil du nicht wie alle anderen sein willst.',
            stat_products: 'Produkte',
            stat_min: 'Mindeststück',
            stat_response: 'Antwort',
            empty_text: 'Keine Produkte gefunden',
            footer_note_cat: 'Preise in MXN. Änderungen vorbehalten. Endangebot gemäß Spezifikationen.',
            search_placeholder: 'Produkt suchen...',
            filter_all: 'Alle',
            from_label: 'Ab',
            see_details: 'Details ansehen',
            cat_uv: 'UV-Druck',
            cat_3d: '3D-Druck',
            cat_laser: 'Laserschneiden',
            cat_engrave: 'Lasergravur',
            cat_photo: 'Fotografie',
            products_count_one: 'Produkt verfügbar',
            products_count_many: 'Produkte verfügbar',
            modal_variants: 'Verfügbare Varianten',
            modal_features: 'Eigenschaften',
            modal_price_title: 'Preistabelle',
            modal_flat: '🖨️ Flach',
            modal_relief: '🏔️ Relief bis 1mm',
            modal_variant_col: 'Variante / Größe',
            legend_flat: 'Flachdruck — Standard-2D-Design',
            legend_relief: 'Relief bis 1mm — taktile 3D-Textur',
            cta_quote: 'Angebot anfordern',
            badge_hot: '🔥 Beliebt',
            badge_new: '✨ Neu',
            badge_promo: '🏷️ Promo',
            no_image: 'Vorschau demnächst',
            no_image_short: 'Kein Bild',
                        // ── Filter keys ──
            filter_all: 'Alle',
            filter_gift: '🎁 Geschenke',
            filter_business: '💼 Geschäftlich',
            filter_popular: '🔥 Beliebt',
            filter_new: '✨ Neu',
            filter_budget: '💰 Günstig',
            filter_premium: '💎 Premium',
            filter_decor: '🖼️ Dekoration',
            filter_drinkware: '☕ Getränke',
            footer_trademark: 'Filamorfosis® ist eine eingetragene Marke.'
        },
        pt: {
            nav_home: 'Início',
            nav_services: 'Serviços',
            nav_equipment: 'Equipamentos',
            nav_clients: 'Clientes',
            nav_contact: 'Contato',
            hero_title: 'Suas Ideias. Sua Realidade.',
            hero_subtitle: 'Transformamos sua imaginação em objetos tangíveis, camada por camada.',
            hero_cta: 'Solicitar Orçamento',
            hero_cta_secondary: 'Ver Serviços',
            services_title: 'Serviços Sob Medida',
            services_subtitle: 'Produtos prontos para personalizar — ou criamos juntos algo único para você.',
            service_3d_title: 'Impressão 3D',
            service_3d_desc: 'Dê vida às suas ideias com impressão multicolor e multimaterial. De protótipos a peças funcionais.',
            service_3d_feat1: 'Até 5 cores em uma peça',
            service_3d_feat2: 'Materiais flexíveis e resistentes',
            service_3d_feat3: 'Precisão milimétrica',
            service_3d_examples_title: 'O que você pode criar?',
            service_3d_ex1: '🎮 Figuras e brinquedos',
            service_3d_ex2: '🏠 Decoração para casa',
            service_3d_ex3: '🔧 Peças de reposição',
            service_3d_ex4: '📱 Acessórios tech',
            service_3d_ex5: '🎁 Presentes personalizados',
            service_uv_title: 'Impressão UV',
            service_uv_desc: 'Personalize quase qualquer superfície com cores vibrantes e duradouras. Canecas, copos, madeira, metal, vidro e mais.',
            service_uv_feat1: 'Imprime em objetos cilíndricos',
            service_uv_feat2: 'Cores que não desbotam',
            service_uv_feat3: 'Adesivos resistentes à água',
            service_uv_examples_title: 'O que você pode personalizar?',
            service_uv_ex1: '☕ Canecas e copos térmicos',
            service_uv_ex2: '🏷️ Adesivos UV DTF',
            service_uv_ex3: '🧲 Ímãs personalizados',
            service_uv_ex4: '🪵 Placas de madeira',
            service_uv_ex5: '🎨 Objetos decorativos',
            service_laser_title: 'Corte a Laser',
            service_laser_desc: 'Corte e grave com precisão cirúrgica. Perfeito para placas, decoração, presentes personalizados e mais.',
            service_laser_feat1: 'Cortes limpos e precisos',
            service_laser_feat2: 'Gravações com detalhes incríveis',
            service_laser_feat3: 'Madeira, acrílico, couro e mais',
            service_laser_examples_title: 'O que podemos fazer?',
            service_laser_ex1: '🪵 Placas de madeira',
            service_laser_ex2: '👜 Acessórios de couro',
            service_laser_ex3: '💎 Peças de acrílico',
            service_laser_ex4: '🏢 Sinalização empresarial',
            service_laser_ex5: '🎁 Presentes gravados',
            service_engrave_title: 'Gravação a Laser',
            service_engrave_desc: 'Gravação a laser de alta precisão em madeira, metal, vidro, couro e mais. Personalize qualquer superfície com detalhe fotográfico.',
            service_engrave_feat1: 'Detalhe fotográfico e vetorial',
            service_engrave_feat2: 'Permanente — nunca desaparece',
            service_engrave_feat3: 'Madeira, metal, vidro, couro, pedra',
            service_engrave_examples_title: 'O que podemos gravar?',
            service_engrave_ex1: '🎁 Presentes personalizados',
            service_engrave_ex2: '🏅 Troféus e placas',
            service_engrave_ex3: '🔑 Chaveiros e acessórios',
            service_engrave_ex4: '🍾 Garrafas e copos',
            service_engrave_ex5: '📱 Gadgets e eletrônicos',
            service_scan_title: 'Escaneamento 3D',
            service_scan_desc: 'Convertemos objetos físicos em modelos digitais 3D. Ideal para replicar peças ou digitalizar memórias.',
            service_scan_feat1: 'Escaneia de joias a móveis',
            service_scan_feat2: 'Captura cor e textura reais',
            service_scan_feat3: 'Arquivo pronto para impressão',
            service_scan_examples_title: 'O que você pode escanear?',
            service_scan_ex1: '🏺 Figuras e esculturas',
            service_scan_ex2: '🔩 Peças e reposições',
            service_scan_ex3: '👤 Bustos e retratos',
            service_scan_ex4: '🎁 Objetos para replicar',
            service_scan_ex5: '🚗 Peças de veículos',
            equip_card6_title: 'Escaneamento 3D',
            equip_card6_desc: 'Digitalizamos qualquer objeto físico com alta precisão — de pequenas joias a móveis.',
            equip_card6_feat1: 'Objetos de 5cm a móveis inteiros',
            equip_card6_feat2: 'Captura cor e textura em 48 MP',
            equip_card6_feat3: 'Arquivo pronto para impressão 3D',
            service_photo_title: 'Impressão Fotográfica',
            service_photo_desc: 'Suas memórias merecem a melhor qualidade. Impressão profissional para seus momentos especiais.',
            service_photo_feat1: 'Qualidade profissional',
            service_photo_feat2: 'Papel de primeira qualidade',
            service_photo_feat3: 'Todos os tamanhos',
            service_photo_examples_title: 'O que imprimimos?',
            service_photo_ex1: '📸 Fotos de família',
            service_photo_ex2: '🖼️ Quadros decorativos',
            service_photo_ex3: '📅 Calendários personalizados',
            service_photo_ex4: '💼 Material promocional',
            service_photo_ex5: '🎨 Arte e pôsteres',
            equipment_title: 'O que podemos criar?',
            equipment_subtitle: 'De pequenos brinquedos a peças grandes e resistentes',
            equip_card1_title: 'Impressão 3D de Alta Velocidade',
            equip_card1_desc: 'Objetos em plástico colorido. Perfeito para protótipos, figuras e peças personalizadas.',
            equip_card1_feat1: 'Tamanho: até 25cm x 25cm x 25cm',
            equip_card1_feat2: 'Até 4 cores em uma peça',
            equip_card1_feat3: 'Materiais: PLA, PETG, TPU flexível',
            equip_card2_title: 'Impressão 3D Compacta',
            equip_card2_desc: 'Ideal para objetos pequenos e médios. Rápida e silenciosa, perfeita para decoração e presentes.',
            equip_card2_feat1: 'Tamanho: até 18cm x 18cm x 18cm',
            equip_card2_feat2: 'Multicolor disponível',
            equip_card2_feat3: 'Materiais: PLA, PETG, TPU',
            equip_card3_title: 'Impressão 3D Grande e Resistente',
            equip_card3_desc: 'Para projetos grandes e resistentes. Até 5 materiais diferentes em uma peça.',
            equip_card3_feat1: 'Tamanho: até 36cm x 36cm x 36cm',
            equip_card3_feat2: 'Até 5 cores/materiais',
            equip_card3_feat3: 'Materiais: PLA, PETG, ABS, PA+CF',
            equip_card4_title: 'Impressão UV Direta',
            equip_card4_desc: 'Imprimimos designs coloridos em quase tudo: canecas, copos, madeira, metal, vidro, plástico.',
            equip_card4_feat1: 'Imprime em objetos cilíndricos',
            equip_card4_feat2: 'Adesivos UV DTF resistentes',
            equip_card4_feat3: 'Ímãs, placas e mais',
            equip_card5_title: 'Corte e Gravação a Laser',
            equip_card5_desc: 'Cortamos e gravamos designs em madeira, acrílico, couro, papelão e mais.',
            equip_card5_feat1: 'Área: 40cm x 40cm',
            equip_card5_feat2: 'Corta madeira de 2cm de espessura',
            equip_card5_feat3: 'Gravações super detalhadas',
            materials_title: 'Materiais que Usamos',
            materials_subtitle: 'Clique em cada material para saber mais detalhes',
            materials_toggle: 'Clique aqui para conhecer todos os filamentos e materiais que usamos',
            mat_ideal_for: 'Ideal para',
            mat_more_info: '📋 Ver detalhes técnicos',
            mat_learn_more: '✨ Saiba mais',
            mat_badge_eco: 'Eco',
            mat_badge_tough: 'Forte',
            mat_badge_flex: 'Flex',
            mat_badge_heat: 'Calor',
            mat_badge_pro: 'Pro',
            eco_headline: 'Impressão Consciente com o Planeta',
            eco_desc: 'Nosso principal material, o PLA, é de origem vegetal — fabricado a partir de amido de milho e cana-de-açúcar. É biodegradável e uma alternativa mais verde aos plásticos tradicionais.',
            modal_properties: 'Propriedades',
            modal_advantages: 'Vantagens',
            modal_applications: 'Aplicações',
            modal_examples: 'Exemplos de Uso',
            modal_tech_btn: '📊 Clique aqui para detalhes técnicos do material',
            tech_specifications: 'Especificações Técnicas',
            tech_mechanical: 'Propriedades Mecânicas',
            tech_thermal: 'Propriedades Térmicas',
            tech_physical: 'Propriedades Físicas',
            tech_durability: 'Durabilidade e Resistência',
            tech_recommendations: 'Recomendações de Uso',
            material_pla: 'O mais comum. Fácil de usar, disponível em muitas cores. Perfeito para decoração e protótipos.',
            material_pla_uses: 'Ideal para: Figuras, brinquedos, decoração, protótipos, organizadores',
            material_petg: 'Mais forte e flexível que o PLA. Resistente à água. Ideal para objetos de uso frequente.',
            material_petg_uses: 'Ideal para: Garrafas, recipientes, peças mecânicas, objetos externos',
            material_tpu: 'Super flexível como borracha. Perfeito para capas de celular, brinquedos macios e peças dobráveis.',
            material_tpu_uses: 'Ideal para: Capas de celular, correias, selos, brinquedos flexíveis',
            material_abs: 'Muito resistente ao calor. O mesmo material do LEGO. Ideal para peças mecânicas.',
            material_abs_uses: 'Ideal para: Peças de carro, carcaças, ferramentas, peças resistentes ao calor',
            material_pacf: 'O mais forte. Tem fibra de carbono. Para peças que precisam ser super resistentes.',
            material_pacf_uses: 'Ideal para: Drones, peças industriais, ferramentas, suportes de carga',
            use_cases_title: 'Exemplos do que Criamos',
            use_case_1_title: 'Brinquedos e Figuras',
            use_case_1_desc: 'Personagens de videogame, figuras colecionáveis, brinquedos personalizados',
            use_case_2_title: 'Decoração para Casa',
            use_case_2_desc: 'Vasos, luminárias, organizadores, placas personalizadas, molduras',
            use_case_3_title: 'Presentes Personalizados',
            use_case_3_desc: 'Canecas com nomes, chaveiros, placas gravadas, troféus personalizados',
            use_case_4_title: 'Peças de Reposição',
            use_case_4_desc: 'Reposições para eletrodomésticos, peças de carro, componentes mecânicos',
            use_case_5_title: 'Acessórios Tech',
            use_case_5_desc: 'Capas de celular, suportes para tablet, organizadores de cabos',
            use_case_6_title: 'Negócios e Escritório',
            use_case_6_desc: 'Placas, porta-cartões, carimbos personalizados, displays de produtos',
            use_case_7_title: 'Adesivos UV DTF',
            use_case_7_desc: 'Adesivos resistentes à água para laptops, carros, garrafas',
            use_case_8_title: 'Copos e Tumblers',
            use_case_8_desc: 'Copos térmicos personalizados, garrafas com designs, canecas com fotos',
            use_case_9_title: 'Ímãs e Placas',
            use_case_9_desc: 'Ímãs de geladeira, placas de identificação, sinalização',
            gallery_title: 'Galeria de Projetos',
            gallery_subtitle: 'Alguns exemplos do que criamos',
            gallery_filter_all: 'Todos',
            gallery_filter_3d: 'Impressão 3D',
            gallery_filter_laser: 'Corte a Laser',
            gallery_filter_engrave: 'Gravação a Laser',
            gallery_filter_scan: 'Escaneamento 3D',
            gallery_filter_uv: 'Impressão UV',
            gallery_3d_1_caption: 'Personagens, figuras colecionáveis e protótipos funcionais em PLA multicolor',
            gallery_3d_2: 'Peças Funcionais',
            gallery_3d_2_caption: 'Reposições, ferramentas e componentes mecânicos em PETG e ABS',
            gallery_3d_3: 'Decoração',
            gallery_3d_3_caption: 'Vasos, luminárias, organizadores e objetos decorativos personalizados',
            gallery_laser_1: 'Gravação em Madeira',
            gallery_laser_1_caption: 'Placas, peças personalizadas e decoração em madeira natural',
            gallery_laser_2: 'Gravação em Couro',
            gallery_laser_2_caption: 'Carteiras, cintos, chaveiros e acessórios de couro personalizados',
            gallery_laser_3: 'Corte em Acrílico',
            gallery_laser_3_caption: 'Placas luminosas, displays e peças decorativas em acrílico',
            gallery_uv_1: 'Canecas e Copos',
            gallery_uv_1_caption: 'Tumblers, canecas e garrafas personalizadas com impressão UV',
            gallery_uv_2: 'Adesivos UV DTF',
            gallery_uv_2_caption: 'Adesivos resistentes à água para laptops, carros e mais',
            gallery_uv_3: 'Ímãs e Placas',
            gallery_uv_3_caption: 'Ímãs personalizados, placas de identificação e sinalização UV',
            gallery_note: '💡 Tem um projeto em mente? Entre em contato para um orçamento personalizado',
            gallery_cta_btn: 'Solicitar Orçamento',
            clients_title: 'Nossos Clientes',
            clients_subtitle: 'Empresas que confiam em nós',
            wa_subtitle: 'Normalmente responde em minutos',
            wa_greeting: 'Você está pronto para transformar sua ideia em realidade? 🚀',
            wa_placeholder: 'Escreva sua mensagem aqui...',
            wa_btn: 'Iniciar Chat →',
            btl_eyebrow: 'Da ideia à realidade',
            btl_title: 'Seu esboço se torna algo real',
            btl_subtitle: 'Você não precisa ser designer. Se puder desenhar, imaginar ou descrever — nós realizamos.',
            btl_before_label: 'Sua ideia',
            btl_before_title: 'Comece com um esboço',
            btl_before_desc: 'Um desenho em papel, uma foto de referência, uma descrição — qualquer ponto de partida funciona.',
            btl_step1: 'Design 3D', btl_step2: 'Impressão', btl_step3: 'Acabamento',
            btl_after_label: 'Seu objeto real',
            btl_after_title: 'Vira realidade',
            btl_after_desc: 'Um objeto físico, preciso e durável — pronto para usar, presentear ou vender.',
            btl_feat1: 'Não precisa saber design 3D',
            btl_feat2: 'Te orientamos em cada etapa',
            btl_feat3: 'Entregas rápidas',
            btl_feat4: 'De 1 peça até produção em escala',
            btl_cta: 'Conte-nos sua ideia →',
            moq_single: 'peça mínima',
            moq_headline: 'Sem mínimos. Sem desculpas.',
            moq_sub: 'Precisa de uma peça? Fazemos. 500? Também. Você decide.',
            moq_bulk: 'produção em escala',
            equipment_subtitle: 'Tecnologia profissional para resultados excepcionais',
            equip_card1_title: 'Impressão 3D de Alta Velocidade',
            equip_card1_desc: 'Velocidades de até 300mm/s com calibração automática LIDAR e suporte a materiais avançados.',
            equip_card2_title: 'Impressão 3D Compacta',
            equip_card2_desc: 'Sistema compacto com velocidades de até 500mm/s e operação silenciosa ≤48dB.',
            equip_card3_title: 'Impressão 3D Grande Formato',
            equip_card3_desc: 'Sistema de troca de ferramentas com até 5 cabeças independentes para impressão multimaterial.',
            equip_card4_title: 'Impressão UV Direta',
            equip_card4_desc: 'Impressão direta em múltiplas superfícies com texturas 3D e milhões de cores.',
            equip_card5_title: 'Corte e Gravação a Laser',
            equip_card5_desc: 'Laser de 40W com área de trabalho de 400×400mm e velocidade de gravação de até 36000mm/min.',
            contact_title: 'Contato',
            contact_subtitle: 'Conte-nos sobre seu projeto e responderemos em breve',
            form_name: 'Nome',
            form_email: 'E-mail',
            form_phone: 'Telefone',
            form_service: 'Serviço de Interesse',
            form_select: 'Selecione um serviço',
            form_opt_3d: 'Impressão 3D',
            form_opt_uv: 'Impressão UV',
            form_opt_laser: 'Corte a Laser',
            form_opt_engrave: 'Gravação a Laser',
            form_opt_photo: 'Impressão Fotográfica',
            form_opt_other: 'Outro',
            form_message: 'Mensagem',
            form_submit: 'Enviar Mensagem',
            form_success: 'Mensagem enviada com sucesso! Entraremos em contato em breve.',
            form_error: 'Erro ao enviar mensagem. Por favor, tente novamente.',
            contact_email_label: 'E-mail',
            contact_phone_label: 'Telefone',
            contact_hours_label: 'Horário',
            contact_hours: 'Seg - Sex: 9:00 - 18:00',
            footer_rights: 'Todos os direitos reservados.',
            cert_mexico: 'Produção no México',
            cert_materials: 'Materiais certificados',
            cert_quality: 'Qualidade garantida',
            
            // ── Catalog keys ──
            nav_catalog: '🛍️ Catálogo',
            hero_badge: 'Catálogo Oficial 2025',
            hero_title_1: 'Produtos',
            hero_title_2: 'Prontos para Pedir',
            hero_subtitle: 'Escolha seu produto, personalize do seu jeito e receba em casa. Produtos únicos feitos para você — porque ser igual a todo mundo nunca foi sua praia.',
            stat_products: 'Produtos',
            stat_min: 'Peça mínima',
            stat_response: 'Resposta',
            empty_text: 'Nenhum produto encontrado',
            footer_note_cat: 'Preços em MXN. Sujeitos a alteração sem aviso prévio. Orçamento final conforme especificações.',
            search_placeholder: 'Buscar produto...',
            filter_all: 'Todos',
            from_label: 'A partir de',
            see_details: 'Ver detalhes',
            cat_uv: 'Impressão UV',
            cat_3d: 'Impressão 3D',
            cat_laser: 'Corte a Laser',
            cat_engrave: 'Gravação a Laser',
            cat_photo: 'Fotografia',
            products_count_one: 'produto disponível',
            products_count_many: 'produtos disponíveis',
            modal_variants: 'Variantes disponíveis',
            modal_features: 'Características',
            modal_price_title: 'Tabela de Preços',
            modal_flat: '🖨️ Plano',
            modal_relief: '🏔️ Relevo até 1mm',
            modal_variant_col: 'Variante / Tamanho',
            legend_flat: 'Impressão plana — design 2D padrão',
            legend_relief: 'Relevo até 1mm — textura tátil 3D',
            cta_quote: 'Solicitar orçamento',
            badge_hot: '🔥 Popular',
            badge_new: '✨ Novo',
            badge_promo: '🏷️ Promo',
            no_image: 'Prévia em breve',
            no_image_short: 'Sem imagem',
                        // ── Filter keys ──
            filter_all: 'Todos',
            filter_gift: '🎁 Presentes',
            filter_business: '💼 Empresarial',
            filter_popular: '🔥 Popular',
            filter_new: '✨ Novo',
            filter_budget: '💰 Econômico',
            filter_premium: '💎 Premium',
            filter_decor: '🖼️ Decoração',
            filter_drinkware: '☕ Bebidas',
            footer_trademark: 'Filamorfosis® é uma marca registrada.'
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
            services_title: 'オーダーメイドサービス',
            services_subtitle: 'すぐにカスタマイズできる商品 — またはあなただけの特別なものを一緒に作りましょう。',
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
            service_engrave_title: 'レーザー彫刻',
            service_engrave_desc: '木材、金属、ガラス、革などへの高精度レーザー彫刻。どんな表面も写真品質でパーソナライズ。',
            service_engrave_feat1: '写真・ベクター対応',
            service_engrave_feat2: '永久的 — 消えない',
            service_engrave_feat3: '木材、金属、ガラス、革、石',
            service_engrave_examples_title: '何を彫刻できますか？',
            service_engrave_ex1: '🎁 パーソナライズギフト',
            service_engrave_ex2: '🏅 トロフィーとプレート',
            service_engrave_ex3: '🔑 キーホルダー',
            service_engrave_ex4: '🍾 ボトルとグラス',
            service_engrave_ex5: '📱 ガジェット',
            service_scan_title: '3Dスキャン',
            service_scan_desc: '物理的なオブジェクトをデジタル3Dモデルに変換します。パーツの複製、カスタムギフト、思い出のデジタル化に最適です。',
            service_scan_feat1: 'ジュエリーから家具までスキャン可能',
            service_scan_feat2: 'リアルなカラーとテクスチャを取得',
            service_scan_feat3: '3D印刷対応ファイルで納品',
            service_scan_examples_title: '何をスキャンできますか？',
            service_scan_ex1: '🏺 フィギュアと彫刻',
            service_scan_ex2: '🔩 パーツとスペアパーツ',
            service_scan_ex3: '👤 バストとポートレート',
            service_scan_ex4: '🎁 複製したいオブジェクト',
            service_scan_ex5: '🚗 車両パーツ',
            equip_card6_title: '3Dスキャン',
            equip_card6_desc: '高精度で物理的なオブジェクトをデジタル化します。小さなジュエリーから家具・車両まで、リアルカラー付きで対応。',
            equip_card6_feat1: '5cmの小物から大型家具まで対応',
            equip_card6_feat2: '48MPでカラーとテクスチャを取得',
            equip_card6_feat3: '3D印刷対応ファイルで納品',
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
            materials_toggle: 'こちらをクリックして、使用するフィラメントと素材をすべてご覧ください',
            mat_ideal_for: '最適な用途',
            mat_more_info: '📋 技術詳細を見る',
            mat_learn_more: '✨ 詳しく見る',
            mat_badge_eco: 'エコ',
            mat_badge_tough: '強靭',
            mat_badge_flex: 'フレックス',
            mat_badge_heat: '耐熱',
            mat_badge_pro: 'プロ',
            eco_headline: '環境に配慮した印刷',
            eco_desc: '主要素材のPLAは植物由来で、トウモロコシデンプンやサトウキビから作られています。生分解性があり、従来のプラスチックよりも環境にやさしい選択肢です。',
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
            gallery_filter_engrave: 'レーザー彫刻',
            gallery_filter_scan: '3Dスキャン',
            gallery_filter_uv: 'UVプリント',
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
            wa_greeting: 'あなたのアイデアを現実にする準備はできていますか？🚀',
            wa_placeholder: 'メッセージを入力してください...',
            wa_btn: 'チャットを開始 →',
            btl_eyebrow: 'アイデアから現実へ',
            btl_title: 'あなたのスケッチが現実になる',
            btl_subtitle: 'デザイナーである必要はありません。描けるもの、想像できるもの、説明できるもの — 私たちが実現します。',
            btl_before_label: 'あなたのアイデア',
            btl_before_title: 'スケッチから始める',
            btl_before_desc: '紙の絵、参考写真、説明文 — どんな出発点でも大丈夫です。',
            btl_step1: '3Dデザイン', btl_step2: '印刷', btl_step3: '仕上げ',
            btl_after_label: '実物',
            btl_after_title: '現実になる',
            btl_after_desc: '精密で耐久性のある物理的なオブジェクト — 使用、贈り物、販売に対応。',
            btl_feat1: '3Dデザインの知識不要',
            btl_feat2: 'すべてのステップでサポート',
            btl_feat3: '迅速な納品',
            btl_feat4: '1個から量産まで',
            btl_cta: 'アイデアを教えてください →',
            moq_single: '最小注文数',
            moq_headline: '最小注文なし。制限なし。',
            moq_sub: '1個だけ必要？作ります。500個？もちろん。あなたが決めます。',
            moq_bulk: '大量生産対応',            contact_title: 'お問い合わせ',
            contact_subtitle: 'あなたのプロジェクトについて教えてください',
            form_name: '名前',
            form_email: 'メール',
            form_phone: '電話',
            form_service: '興味のあるサービス',
            form_select: 'サービスを選択',
            form_opt_3d: '3Dプリント',
            form_opt_uv: 'UVプリント',
            form_opt_laser: 'レーザーカット',
            form_opt_engrave: 'レーザー彫刻',
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
            cert_mexico: 'メキシコ製造',
            cert_materials: '認定素材使用',
            cert_quality: '品質保証',
            
            // ── Catalog keys ──
            nav_catalog: '🛍️ カタログ',
            hero_badge: '公式カタログ 2025',
            hero_title_1: '製品',
            hero_title_2: '今すぐ注文可能',
            hero_subtitle: '製品を選んで、自分好みにカスタマイズして、届けてもらおう。みんなと同じじゃつまらない — あなただけの唯一無二のアイテムを。',
            stat_products: '製品',
            stat_min: '最小注文数',
            stat_response: '返答',
            empty_text: '製品が見つかりません',
            footer_note_cat: '価格はMXN。予告なく変更される場合があります。最終見積もりは仕様によります。',
            search_placeholder: '製品を検索...',
            filter_all: 'すべて',
            from_label: '〜から',
            see_details: '詳細を見る',
            cat_uv: 'UV印刷',
            cat_3d: '3D印刷',
            cat_laser: 'レーザーカット',
            cat_engrave: 'レーザー彫刻',
            cat_photo: '写真印刷',
            products_count_one: '製品あり',
            products_count_many: '製品あり',
            modal_variants: '利用可能なバリアント',
            modal_features: '特徴',
            modal_price_title: '価格表',
            modal_flat: '🖨️ フラット',
            modal_relief: '🏔️ レリーフ最大1mm',
            modal_variant_col: 'バリアント / サイズ',
            legend_flat: 'フラット印刷 — 標準2Dデザイン',
            legend_relief: 'レリーフ最大1mm — 触覚的3Dテクスチャ',
            cta_quote: '今すぐ見積もり',
            badge_hot: '🔥 人気',
            badge_new: '✨ 新着',
            badge_promo: '🏷️ セール',
            no_image: 'プレビュー近日公開',
            no_image_short: '画像なし',
                        // ── Filter keys ──
            filter_all: 'すべて',
            filter_gift: '🎁 ギフト',
            filter_business: '💼 ビジネス',
            filter_popular: '🔥 人気',
            filter_new: '✨ 新着',
            filter_budget: '💰 お手頃',
            filter_premium: '💎 プレミアム',
            filter_decor: '🖼️ デコレーション',
            filter_drinkware: '☕ ドリンクウェア',
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
            services_title: '定制服务',
            services_subtitle: '即可个性化的现成产品 — 或者我们一起打造专属于你的独一无二之作。',
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
            service_engrave_title: '激光雕刻',
            service_engrave_desc: '在木材、金属、玻璃、皮革等材料上进行高精度激光雕刻。用照片级细节个性化任何表面。',
            service_engrave_feat1: '照片和矢量细节',
            service_engrave_feat2: '永久性 — 不会消失',
            service_engrave_feat3: '木材、金属、玻璃、皮革、石材',
            service_engrave_examples_title: '我们能雕刻什么？',
            service_engrave_ex1: '🎁 个性化礼品',
            service_engrave_ex2: '🏅 奖杯和奖牌',
            service_engrave_ex3: '🔑 钥匙扣和配件',
            service_engrave_ex4: '🍾 瓶子和杯子',
            service_engrave_ex5: '📱 电子产品',
            service_scan_title: '3D扫描',
            service_scan_desc: '将实物转化为数字3D模型。适合复制零件、制作个性化礼品或将珍贵物品数字化保存。',
            service_scan_feat1: '可扫描从珠宝到家具的各类物品',
            service_scan_feat2: '捕捉真实颜色和纹理',
            service_scan_feat3: '直接输出可3D打印文件',
            service_scan_examples_title: '您能扫描什么？',
            service_scan_ex1: '🏺 手办和雕塑',
            service_scan_ex2: '🔩 零件和备件',
            service_scan_ex3: '👤 半身像和肖像',
            service_scan_ex4: '🎁 需要复制的物品',
            service_scan_ex5: '🚗 车辆零部件',
            equip_card6_title: '3D扫描',
            equip_card6_desc: '高精度数字化任何实物。从小型珠宝到家具和车辆，包含真实颜色。',
            equip_card6_feat1: '可扫描5cm小物件至大型家具',
            equip_card6_feat2: '48MP捕捉颜色和纹理',
            equip_card6_feat3: '输出可直接3D打印的文件',
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
            materials_toggle: '点击此处了解我们使用的所有耗材和材料',
            mat_ideal_for: '适用于',
            mat_more_info: '📋 查看技术详情',
            mat_learn_more: '✨ 了解更多',
            mat_badge_eco: '环保',
            mat_badge_tough: '坚韧',
            mat_badge_flex: '弹性',
            mat_badge_heat: '耐热',
            mat_badge_pro: '专业',
            eco_headline: '环保意识打印',
            eco_desc: '我们的主要材料PLA是植物基的——由玉米淀粉和甘蔗制成。它可生物降解，是传统塑料更环保的替代品。',
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
            gallery_filter_engrave: '激光雕刻',
            gallery_filter_scan: '3D扫描',
            gallery_filter_uv: 'UV打印',
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
            wa_greeting: '您准备好将您的想法变为现实了吗？🚀',
            wa_placeholder: '在此输入您的消息...',
            wa_btn: '开始聊天 →',
            btl_eyebrow: '从创意到现实',
            btl_title: '您的草图变成真实物品',
            btl_subtitle: '您不需要是设计师。只要能画出来、想象出来或描述出来 — 我们来实现。',
            btl_before_label: '您的创意',
            btl_before_title: '从草图开始',
            btl_before_desc: '纸上的画、参考照片、文字描述 — 任何起点都可以。',
            btl_step1: '3D设计', btl_step2: '打印', btl_step3: '后处理',
            btl_after_label: '真实物品',
            btl_after_title: '变成现实',
            btl_after_desc: '精确耐用的实物 — 可以使用、送礼或销售。',
            btl_feat1: '无需3D设计知识',
            btl_feat2: '全程为您提供指导',
            btl_feat3: '快速交货',
            btl_feat4: '从1件到批量生产',
            btl_cta: '告诉我们您的想法 →',
            moq_single: '最少起印',
            moq_headline: '无最低起订量。无借口。',
            moq_sub: '只需要一件？我们来做。需要500件？也没问题。您决定数量。',
            moq_bulk: '规模化生产',
            contact_title: '联系我们',
            contact_subtitle: '告诉我们您的项目，我们会尽快回复您',
            form_name: '姓名',
            form_email: '邮箱',
            form_phone: '电话',
            form_service: '感兴趣的服务',
            form_select: '选择服务',
            form_opt_3d: '3D打印',
            form_opt_uv: 'UV打印',
            form_opt_laser: '激光切割',
            form_opt_engrave: '激光雕刻',
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
            cert_mexico: '墨西哥制造',
            cert_materials: '认证材料',
            cert_quality: '品质保证',
            
            // ── Catalog keys ──
            nav_catalog: '🛍️ 目录',
            hero_badge: '官方目录 2025',
            hero_title_1: '产品',
            hero_title_2: '立即可订购',
            hero_subtitle: '选择产品，按你的方式定制，送货上门。独一无二的个性化产品 — 因为随大流从来不是你的风格。',
            stat_products: '产品',
            stat_min: '最小件数',
            stat_response: '响应',
            empty_text: '未找到产品',
            footer_note_cat: '价格以MXN计。如有变更恕不另行通知。最终报价根据规格而定。',
            search_placeholder: '搜索产品...',
            filter_all: '全部',
            from_label: '起价',
            see_details: '查看详情',
            cat_uv: 'UV印刷',
            cat_3d: '3D打印',
            cat_laser: '激光切割',
            cat_engrave: '激光雕刻',
            cat_photo: '照片打印',
            products_count_one: '个产品可用',
            products_count_many: '个产品可用',
            modal_variants: '可用变体',
            modal_features: '特点',
            modal_price_title: '价格表',
            modal_flat: '🖨️ 平面',
            modal_relief: '🏔️ 浮雕最高1mm',
            modal_variant_col: '变体 / 尺寸',
            legend_flat: '平面印刷 — 标准2D设计',
            legend_relief: '浮雕最高1mm — 触感3D纹理',
            cta_quote: '立即报价',
            badge_hot: '🔥 热门',
            badge_new: '✨ 新品',
            badge_promo: '🏷️ 促销',
            no_image: '预览即将推出',
            no_image_short: '无图片',
                        // ── Filter keys ──
            filter_all: '全部',
            filter_gift: '🎁 礼品',
            filter_business: '💼 商务',
            filter_popular: '🔥 热门',
            filter_new: '✨ 新品',
            filter_budget: '💰 实惠',
            filter_premium: '💎 高端',
            filter_decor: '🖼️ 装饰',
            filter_drinkware: '☕ 饮品',
            footer_trademark: 'Filamorfosis®是注册商标。'
        }
    };

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
        
        // Close all dropdowns
        $('.lang-selector').removeClass('active');
        $('.lang-selector-mob').removeClass('active');
    }
    window.switchLanguage = switchLanguage; // expose for store-i18n.js

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

        // Duplicate cards for seamless infinite loop
        const origCards = Array.from(grid.children);
        origCards.forEach(card => grid.appendChild(card.cloneNode(true)));
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
    //  SPA ROUTER
    // ══════════════════════════════════════════════════════
    const SPA_SECTIONS = ['home', 'services', 'materials', 'gallery', 'bring-to-life', 'clients', 'contact', 'catalog'];

    // IDs of homepage-only sections to hide when catalog is active
    const HOME_SECTION_IDS = ['home','services','materials','gallery','bring-to-life','clients','contact'];
    // IDs of elements that wrap homepage sections (video strip, btl, etc.)
    const HOME_WRAPPER_CLASSES = ['.video-strip','.btl-section','.materials-section','.gallery-section-wrap'];

    function spaNavigate(hash) {
        const target = (hash || '#home').replace('#', '');
        const isCatalog = target === 'catalog';

        // Show/hide catalog section
        const catalogEl = document.getElementById('catalog');
        if (catalogEl) catalogEl.style.display = isCatalog ? 'block' : 'none';

        // Show/hide homepage-only sections by ID
        HOME_SECTION_IDS.forEach(function(id) {
            const el = document.getElementById(id);
            if (el) el.style.display = isCatalog ? 'none' : '';
        });
        // Also hide/show video strip and other non-section elements
        document.querySelectorAll('.video-strip, .btl-section, .wa-bubble, #waBubble').forEach(function(el) {
            el.style.display = isCatalog ? 'none' : '';
        });

        // Scroll to top on catalog, or to section on homepage
        if (isCatalog) {
            window.scrollTo(0, 0);
            // Init catalog if not already done
            if (typeof renderAll === 'function' && !window._catalogInited) {
                window._catalogInited = true;
                // Language handled by main.js switchLanguage — skip catalog's initLangSelector
                renderAll();
                if (typeof animateCounter === 'function') {
                    animateCounter(document.getElementById('statProducts'), PRODUCTS.length, 1200);
                }
                // Wire catalog search
                const searchEl = document.getElementById('catSearch');
                if (searchEl) {
                    searchEl.addEventListener('input', function(e) {
                        searchQuery = e.target.value.toLowerCase().trim();
                        renderGrid();
                    });
                }
                // Wire catalog modal close
                const modalClose = document.getElementById('catModalClose');
                if (modalClose) modalClose.addEventListener('click', closeModal);
                const modalOverlay = document.getElementById('catModal');
                if (modalOverlay) {
                    modalOverlay.addEventListener('click', function(e) {
                        if (e.target === modalOverlay) closeModal();
                    });
                }
                document.addEventListener('keydown', function(e) {
                    if (e.key === 'Escape') closeModal();
                });

                // ── Init catalog hero particles + wave ────────────────────────
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
            } else if (typeof renderAll === 'function') {
                // Re-render to apply current language
                renderAll();
            }
        } else if (target !== 'home') {
            // Scroll to section. Use a single rAF to let the browser finish
            // showing the sections (display:none → '') before measuring position.
            const el = document.getElementById(target);
            if (el) {
                requestAnimationFrame(function() {
                    const navH = (document.querySelector('.navbar') || {}).offsetHeight || 70;
                    const top = el.getBoundingClientRect().top + window.pageYOffset - navH - 8;
                    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
                });
            }
        } else {
            // Scroll to top for home
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // Update active nav link
        $('.navbar__menu a').removeClass('spa-active');
        $(`.navbar__menu a[href="#${target}"]`).addClass('spa-active');
    }

    // Handle hash changes (browser back/forward only — direct clicks use spaNavigate)
    var _lastHash = '';
    $(window).on('hashchange', function() {
        var h = window.location.hash;
        if (h !== _lastHash) {
            _lastHash = h;
            spaNavigate(h);
        }
    });

    // Handle nav link clicks — call spaNavigate directly (no hashchange relay)
    $(document).on('click', '.navbar__menu a[href^="#"]', function(e) {
        e.preventDefault();
        const href = $(this).attr('href');
        // Update hash silently so back button works
        if (window.location.hash !== href) {
            history.pushState(null, '', href);
        }
        _lastHash = href;
        spaNavigate(href);
        // Close mobile menu
        $('.navbar__toggle').removeClass('active');
        $('.navbar__menu').removeClass('active');
        $('.navbar__toggle span').css({'transform': 'none', 'opacity': '1'});
    });

    // Initial navigation on page load
    spaNavigate(window.location.hash || '#home');

    // Expose globally so external buttons can trigger SPA navigation
    window._spaNavigate = spaNavigate;

    // ── Navigate to catalog with a specific category pre-selected ────────────
    window._navToCat = function(catId) {
        // Navigate to catalog first
        spaNavigate('#catalog');
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

        // Separate videos and images for better distribution
        var videos = items.filter(function(el) { return el.querySelector('video'); });
        var images = items.filter(function(el) { return !el.querySelector('video'); });

        // Track 0: alternate video/image starting with video
        // Track 1: alternate image/video starting with image
        var track0 = [], track1 = [];
        var vi = 0, ii = 0;
        var total = Math.max(videos.length, images.length);

        for (var n = 0; n < total * 2; n++) {
            if (n % 2 === 0) {
                // even slots: video on track0, image on track1
                track0.push(videos[vi % videos.length] || images[ii % images.length]);
                track1.push(images[ii % images.length] || videos[vi % videos.length]);
                vi++; ii++;
            } else {
                // odd slots: image on track0, video on track1
                track0.push(images[ii % images.length] || videos[vi % videos.length]);
                track1.push(videos[vi % videos.length] || images[ii % images.length]);
                ii++; vi++;
            }
        }

        // If only one type exists, fall back to round-robin
        if (!videos.length || !images.length) {
            track0 = []; track1 = [];
            items.forEach(function(item, i) {
                (i % 2 === 0 ? track0 : track1).push(item);
            });
        }

        // Build the two track elements
        var tracks = [track0, track1].map(function(itemList) {
            var t = document.createElement('div');
            t.className = 'showcase-media-track';
            // Add items (clone to avoid DOM conflicts)
            itemList.forEach(function(item) { t.appendChild(item.cloneNode(true)); });
            // Duplicate for seamless loop
            itemList.forEach(function(item) { t.appendChild(item.cloneNode(true)); });
            return t;
        });

        // Replace grid contents with tracks only (no arrows)
        grid.innerHTML = '';
        tracks.forEach(function(t) { grid.appendChild(t); });
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

