'use strict';

(function ($) {
    // Particles and smoky wave removed  hero now uses video background

    // Translations
    const translations = {
        es: {
            nav_home: 'Inicio',
            nav_services: 'Servicios',
            nav_equipment: 'Equipos',
            nav_clients: 'Clientes',
            nav_contact: 'Contacto',
            hero_title: 'Tus Ideas. Tu Realidad.',
            hero_subtitle: 'Transformamos tu imaginaci�n en objetos tangibles, capa por capa.',
            hero_cta: 'Solicitar Cotizaci�n',
            hero_cta_secondary: 'Explorar Servicios',
            services_title: 'Servicios a tu Medida',
            services_subtitle: 'Productos listos para personalizar  o dise�amos juntos algo �nico para ti.',
            service_3d_title: 'Impresi�n 3D',
            service_3d_desc: 'Dale vida a tus ideas con impresi�n multicolor y multimaterial. Desde prototipos hasta piezas funcionales que realmente funcionan.',
            service_3d_feat1: 'Hasta 5 colores en una pieza',
            service_3d_feat2: 'Materiales flexibles y resistentes',
            service_3d_feat3: 'Precisi�n milim�trica',
            service_3d_examples_title: '�Qu� puedes crear?',
            service_3d_ex1: '<� Figuras y juguetes',
            service_3d_ex2: '<� Decoraci�n del hogar',
            service_3d_ex3: '=� Piezas de repuesto',
            service_3d_ex4: '=� Accesorios tech',
            service_3d_ex5: '<� Regalos personalizados',
            service_uv_title: 'Impresi�n UV',
            service_uv_desc: 'Personaliza casi cualquier superficie con colores vibrantes y duraderos. Tazas, vasos, madera, metal, vidrio y m�s.',
            service_uv_feat1: 'Imprime en objetos cil�ndricos',
            service_uv_feat2: 'Colores que no se desvanecen',
            service_uv_feat3: 'Stickers resistentes al agua',
            service_uv_examples_title: '�Qu� puedes personalizar?',
            service_uv_ex1: ' Tazas y vasos t�rmicos',
            service_uv_ex2: '<� Stickers UV DTF',
            service_uv_ex3: '>� Magnetos personalizados',
            service_uv_ex4: '>� Placas de madera',
            service_uv_ex5: '<� Objetos decorativos',
            service_laser_title: 'Corte L�ser',
            service_laser_desc: 'Corta y graba con precisi�n quir�rgica. Perfecto para letreros, decoraci�n, regalos personalizados y m�s.',
            service_laser_feat1: 'Cortes limpios y precisos',
            service_laser_feat2: 'Grabados con detalles incre�bles',
            service_laser_feat3: 'Madera, acr�lico, cuero y m�s',
            service_laser_examples_title: '�Qu� podemos hacer?',
            service_laser_ex1: '>� Letreros de madera',
            service_laser_ex2: '=\ Accesorios de cuero',
            service_laser_ex3: '=� Piezas de acr�lico',
            service_laser_ex4: '<� Se�al�tica empresarial',
            service_laser_ex5: '<� Regalos grabados',
            service_engrave_title: 'Grabado L�ser',
            service_engrave_desc: 'Grabado de alta precisi�n sobre madera, metal, vidrio, cuero y m�s. Personaliza cualquier superficie con detalle fotogr�fico.',
            service_engrave_feat1: 'Detalle fotogr�fico y vectorial',
            service_engrave_feat2: 'Permanente  no se borra ni desvanece',
            service_engrave_feat3: 'Madera, metal, vidrio, cuero, piedra',
            service_engrave_examples_title: '�Qu� podemos grabar?',
            service_engrave_ex1: '<� Regalos personalizados',
            service_engrave_ex2: '<� Trofeos y placas',
            service_engrave_ex3: '= Llaveros y accesorios',
            service_engrave_ex4: '<~ Botellas y vasos',
            service_engrave_ex5: '=� Gadgets y electr�nicos',
            service_scan_title: 'Escaneo 3D',
            service_scan_desc: 'Convertimos objetos f�sicos en modelos digitales 3D. Ideal para replicar piezas, crear regalos personalizados o digitalizar recuerdos.',
            service_scan_feat1: 'Escanea desde joyer�a hasta muebles',
            service_scan_feat2: 'Captura color y textura real',
            service_scan_feat3: 'Listo para imprimir en 3D',
            service_scan_examples_title: '�Qu� puedes escanear?',
            service_scan_ex1: '<� Figuras y esculturas',
            service_scan_ex2: '=) Piezas y repuestos',
            service_scan_ex3: '=d Bustos y retratos',
            service_scan_ex4: '<� Objetos para replicar',
            service_scan_ex5: '=� Partes de veh�culos',
            equip_card6_title: 'Escaneo 3D',
            equip_card6_desc: 'Digitalizamos cualquier objeto f�sico con alta precisi�n. Desde joyer�a peque�a hasta muebles y veh�culos, con color real incluido.',
            equip_card6_feat1: 'Objetos desde 5cm hasta muebles completos',
            equip_card6_feat2: 'Captura color y textura en 48 MP',
            equip_card6_feat3: 'Archivo listo para imprimir en 3D',
            service_photo_title: 'Impresi�n Fotogr�fica',
            service_photo_desc: 'Tus recuerdos merecen la mejor calidad. Impresi�n profesional que hace justicia a tus momentos especiales.',
            service_photo_feat1: 'Calidad profesional',
            service_photo_feat2: 'Papel de primera calidad',
            service_photo_feat3: 'Todos los tama�os',
            service_photo_examples_title: '�Qu� imprimimos?',
            service_photo_ex1: '=� Fotos familiares',
            service_photo_ex2: '=� Cuadros decorativos',
            service_photo_ex3: '=� Calendarios personalizados',
            service_photo_ex4: '=� Material promocional',
            service_photo_ex5: '<� Arte y posters',
            equipment_title: '�Qu� Podemos Crear?',
            equipment_subtitle: 'Desde peque�os juguetes hasta piezas grandes y resistentes',
            equip_card1_title: 'Impresi�n 3D S�per R�pida',
            equip_card1_desc: 'Creamos objetos en pl�stico de colores. Perfecto para prototipos, figuras, y piezas personalizadas.',
            equip_card1_feat1: 'Tama�o: hasta 25cm x 25cm x 25cm',
            equip_card1_feat2: 'Hasta 4 colores en una pieza',
            equip_card1_feat3: 'Materiales: PLA, PETG, TPU flexible',
            equip_card2_title: 'Impresi�n 3D Compacta',
            equip_card2_desc: 'Ideal para objetos peque�os y medianos. R�pida y silenciosa, perfecta para decoraci�n y regalos.',
            equip_card2_feat1: 'Tama�o: hasta 18cm x 18cm x 18cm',
            equip_card2_feat2: 'Multicolor disponible',
            equip_card2_feat3: 'Materiales: PLA, PETG, TPU',
            equip_card3_title: 'Impresi�n 3D Grande y Fuerte',
            equip_card3_desc: 'Para proyectos grandes y resistentes. Podemos usar hasta 5 materiales diferentes en una sola pieza.',
            equip_card3_feat1: 'Tama�o: hasta 36cm x 36cm x 36cm',
            equip_card3_feat2: 'Hasta 5 colores/materiales',
            equip_card3_feat3: 'Materiales: PLA, PETG, ABS, PA+CF',
            equip_card4_title: 'Impresi�n UV Directa',
            equip_card4_desc: 'Imprimimos dise�os a todo color sobre casi cualquier cosa: tazas, vasos, madera, metal, vidrio, pl�stico. Tambi�n hacemos stickers UV DTF.',
            equip_card4_feat1: 'Imprime en objetos cil�ndricos (vasos, botellas)',
            equip_card4_feat2: 'Stickers UV DTF resistentes',
            equip_card4_feat3: 'Magnetos, placas y m�s',
            equip_card5_title: 'Corte y Grabado L�ser',
            equip_card5_desc: 'Cortamos y grabamos dise�os en madera, acr�lico, cuero, cart�n y m�s. Perfecto para letreros y decoraci�n.',
            equip_card5_feat1: '�rea: 40cm x 40cm',
            equip_card5_feat2: 'Corta madera de 2cm de grosor',
            equip_card5_feat3: 'Grabados super detallados',
            materials_title: 'Materiales que Usamos',
            materials_subtitle: 'Haz clic en cada material para conocer m�s detalles',
            materials_toggle: 'Haz clic aqu� para conocer todos los filamentos y materiales que usamos',
            mat_ideal_for: 'Ideal para',
            mat_more_info: '=� Ver detalles t�cnicos',
            mat_learn_more: '( Saber m�s',
            mat_badge_eco: 'Eco',
            mat_badge_tough: 'Duro',
            mat_badge_flex: 'Flex',
            mat_badge_heat: 'Calor',
            mat_badge_pro: 'Pro',
            eco_headline: 'Impresi�n Consciente con el Planeta',
            eco_desc: 'Nuestro material principal, el PLA, es de origen vegetal  fabricado a partir de almid�n de ma�z y ca�a de az�car. Es biodegradable y una alternativa m�s verde a los pl�sticos tradicionales.',
            modal_properties: 'Propiedades',
            modal_advantages: 'Ventajas',
            modal_applications: 'Aplicaciones',
            modal_examples: 'Ejemplos de Uso',
            modal_tech_btn: '=� Click aqu� para detalles t�cnicos del material',
            tech_specifications: 'Especificaciones T�cnicas',
            tech_mechanical: 'Propiedades Mec�nicas',
            tech_thermal: 'Propiedades T�rmicas',
            tech_physical: 'Propiedades F�sicas',
            tech_durability: 'Durabilidad y Resistencia',
            tech_recommendations: 'Recomendaciones de Uso',
            material_pla: 'El m�s com�n. F�cil de usar, viene en muchos colores. Perfecto para decoraci�n y prototipos.',
            material_pla_uses: 'Ideal para: Figuras, juguetes, decoraci�n, prototipos, organizadores',
            material_petg: 'M�s fuerte y flexible que PLA. Resistente al agua. Ideal para objetos que se usan mucho.',
            material_petg_uses: 'Ideal para: Botellas, contenedores, piezas mec�nicas, objetos de exterior',
            material_tpu: 'S�per flexible como goma. Perfecto para fundas de tel�fono, juguetes blandos y piezas que se doblan.',
            material_tpu_uses: 'Ideal para: Fundas de tel�fono, correas, sellos, juguetes flexibles',
            material_abs: 'Muy resistente al calor. El mismo material de los LEGO. Ideal para piezas mec�nicas.',
            material_abs_uses: 'Ideal para: Piezas de autos, carcasas, herramientas, piezas que aguantan calor',
            material_pacf: 'El m�s fuerte. Tiene fibra de carbono. Para piezas que necesitan ser super resistentes.',
            material_pacf_uses: 'Ideal para: Drones, piezas industriales, herramientas, soportes de carga',
            use_cases_title: 'Ejemplos de lo que Creamos',
            use_case_1_title: 'Juguetes y Figuras',
            use_case_1_desc: 'Personajes de videojuegos, figuras coleccionables, juguetes personalizados',
            use_case_2_title: 'Decoraci�n del Hogar',
            use_case_2_desc: 'Macetas, l�mparas, organizadores, letreros personalizados, marcos',
            use_case_3_title: 'Regalos Personalizados',
            use_case_3_desc: 'Tazas con nombres, llaveros, placas grabadas, trofeos personalizados',
            use_case_4_title: 'Piezas de Repuesto',
            use_case_4_desc: 'Repuestos para electrodom�sticos, piezas de autos, componentes mec�nicos',
            use_case_5_title: 'Accesorios Tech',
            use_case_5_desc: 'Fundas de tel�fono, soportes para tablet, organizadores de cables',
            use_case_6_title: 'Negocios y Oficina',
            use_case_6_desc: 'Letreros, tarjeteros, sellos personalizados, displays para productos',
            use_case_7_title: 'Stickers UV DTF',
            use_case_7_desc: 'Calcoman�as resistentes al agua, stickers para laptops, autos, botellas',
            use_case_8_title: 'Vasos y Tumblers',
            use_case_8_desc: 'Vasos t�rmicos personalizados, botellas con dise�os, tazas con fotos',
            use_case_9_title: 'Magnetos y Placas',
            use_case_9_desc: 'Imanes para refrigerador, placas de identificaci�n, se�al�tica',
            gallery_title: 'Galer�a de Proyectos',
            gallery_subtitle: 'Algunos ejemplos de lo que hemos creado',
            gallery_filter_all: 'Todos',
            gallery_filter_3d: 'Impresi�n 3D',
            gallery_filter_laser: 'Corte L�ser',
            gallery_filter_engrave: 'Grabado L�ser',
            gallery_filter_scan: 'Escaneo 3D',
            gallery_filter_uv: 'Impresi�n UV',
            gallery_3d_1_caption: 'Personajes, figuras coleccionables y prototipos funcionales en PLA multicolor',
            gallery_3d_2: 'Piezas Funcionales',
            gallery_3d_2_caption: 'Repuestos, herramientas y componentes mec�nicos en PETG y ABS',
            gallery_3d_3: 'Decoraci�n',
            gallery_3d_3_caption: 'Macetas, l�mparas, organizadores y objetos decorativos personalizados',
            gallery_laser_1: 'Grabado en Madera',
            gallery_laser_1_caption: 'Letreros, placas personalizadas y decoraci�n en madera natural',
            gallery_laser_2: 'Grabado en Cuero',
            gallery_laser_2_caption: 'Carteras, cinturones, llaveros y accesorios de cuero personalizados',
            gallery_laser_3: 'Corte en Acr�lico',
            gallery_laser_3_caption: 'Letreros luminosos, displays y piezas decorativas en acr�lico',
            gallery_uv_1: 'Tazas y Vasos',
            gallery_uv_1_caption: 'Tumblers, tazas y botellas personalizadas con impresi�n UV rotativa',
            gallery_uv_2: 'Stickers UV DTF',
            gallery_uv_2_caption: 'Calcoman�as resistentes al agua para laptops, autos y m�s',
            gallery_uv_3: 'Magnetos y Placas',
            gallery_uv_3_caption: 'Imanes personalizados, placas de identificaci�n y se�al�tica UV',
            gallery_note: '=� �Tienes un proyecto en mente? Cont�ctanos para una cotizaci�n personalizada',
            gallery_cta_btn: 'Solicitar Cotizaci�n',
            clients_title: 'Nuestros Clientes',
            clients_subtitle: 'Empresas que conf�an en nosotros',
            wa_subtitle: 'Normalmente responde en minutos',
            wa_greeting: '�Est�s listo para llevar tu idea a la realidad? =�',
            wa_placeholder: 'Escribe tu mensaje aqu�...',
            wa_btn: 'Iniciar Chat �',
            btl_eyebrow: 'De la idea a la realidad',
            btl_title: 'Tu boceto se convierte en algo real',
            btl_subtitle: 'No necesitas ser dise�ador. Si puedes dibujarlo, imaginarlo o describirlo  nosotros lo hacemos realidad.',
            btl_before_label: 'Tu idea',
            btl_before_title: 'Empieza con un boceto',
            btl_before_desc: 'Un dibujo en papel, una foto de referencia, una descripci�n  cualquier punto de partida funciona.',
            btl_step1: 'Dise�o 3D', btl_step2: 'Impresi�n', btl_step3: 'Acabado',
            btl_after_label: 'Tu objeto real',
            btl_after_title: 'Se vuelve realidad',
            btl_after_desc: 'Un objeto f�sico, preciso y duradero  listo para usar, regalar o vender.',
            btl_feat1: 'No necesitas saber dise�o 3D',
            btl_feat2: 'Te asesoramos en cada paso',
            btl_feat3: 'Entregas r�pidas',
            btl_feat4: 'Desde 1 pieza hasta producci�n',
            btl_cta: 'Cu�ntanos tu idea �',
            moq_single: 'pieza m�nima',
            moq_headline: 'Sin m�nimos. Sin excusas.',
            moq_sub: '�Necesitas una sola pieza? La hacemos. �Necesitas 500? Tambi�n. T� decides cu�nto.',
            moq_bulk: 'producci�n a escala',            equipment_subtitle: 'Tecnolog�a profesional para resultados excepcionales',
            equip_card1_title: 'Impresi�n 3D de Alta Velocidad',
            equip_card1_desc: 'Velocidades de hasta 300mm/s con calibraci�n autom�tica LIDAR, c�mara de impresi�n cerrada y soporte para materiales avanzados incluyendo fibra de carbono y pol�meros t�cnicos',
            equip_card2_title: 'Impresi�n 3D Compacta',
            equip_card2_desc: 'Sistema compacto con velocidades de hasta 500mm/s, calibraci�n autom�tica completa, compensaci�n activa de flujo y operaci�n silenciosa d48dB para proyectos peque�os y medianos',
            equip_card3_title: 'Impresi�n 3D Gran Formato',
            equip_card3_desc: 'Sistema de cambio de herramientas con hasta 5 cabezales independientes para impresi�n multimaterial sin desperdicio, volumen de construcci�n de 360mm� y precisi�n de borde a borde',
            equip_card4_title: 'Impresi�n UV Directa',
            equip_card4_desc: 'Impresi�n directa en m�ltiples superficies (madera, metal, vidrio, acr�lico, cer�mica) con texturas 3D de hasta 5mm, millones de colores con 100% de precisi�n crom�tica y autoenfoque l�ser dual',
            equip_card5_title: 'Corte y Grabado L�ser',
            equip_card5_desc: 'L�ser de 40W con �rea de trabajo de 400�400mm, velocidad de grabado de hasta 36000mm/min, capacidad de corte de 20mm en madera y 6mm en acr�lico, con modo de precisi�n para ensamblajes exactos',
            contact_title: 'Cont�ctanos',
            contact_subtitle: 'Cu�ntanos sobre tu proyecto y te responderemos pronto',
            form_name: 'Nombre',
            form_email: 'Email',
            form_phone: 'Tel�fono',
            form_service: 'Servicio de Inter�s',
            form_select: 'Selecciona un servicio',
            form_opt_3d: 'Impresi�n 3D',
            form_opt_uv: 'Impresi�n UV',
            form_opt_laser: 'Corte L�ser',
            form_opt_engrave: 'Grabado L�ser',
            form_opt_photo: 'Impresi�n Fotogr�fica',
            form_opt_other: 'Otro',
            form_message: 'Mensaje',
            form_submit: 'Enviar Mensaje',
            form_success: '�Mensaje enviado con �xito! Te contactaremos pronto.',
            form_error: 'Hubo un error al enviar el mensaje. Por favor, intenta de nuevo.',
            contact_email_label: 'Email',
            contact_phone_label: 'Tel�fono',
            contact_hours_label: 'Horario',
            contact_hours: 'Lun - Vie: 9:00 - 18:00',
            footer_rights: 'Todos los derechos reservados.',
            cert_mexico: 'Producci�n en M�xico',
            cert_materials: 'Materiales certificados',
            cert_quality: 'Calidad garantizada',
            
            //    Catalog keys   
            nav_catalog: '=� Cat�logo',
            hero_badge: 'Cat�logo Oficial 2025',
            hero_title_1: 'Productos',
            hero_title_2: 'Listos para Ordenar',
            hero_subtitle: 'Elige tu producto, personal�zalo a tu gusto y rec�belo en casa. Productos �nicos hechos para ti  porque ser igual que todos no es una opci�n.',
            stat_products: 'Productos',
            stat_min: 'Pieza m�nima',
            stat_response: 'Respuesta',
            empty_text: 'No se encontraron productos',
            footer_note_cat: 'Precios en MXN. Sujetos a cambio sin previo aviso. Cotizaci�n final seg�n especificaciones.',
            search_placeholder: 'Buscar producto...',
            filter_all: 'Todos',
            from_label: 'Desde',
            see_details: 'Ver detalles',
            cat_uv: 'Impresi�n UV',
            cat_3d: 'Impresi�n 3D',
            cat_laser: 'Corte L�ser',
            cat_engrave: 'Grabado L�ser',
            cat_photo: 'Fotograf�a',
            products_count_one: 'producto disponible',
            products_count_many: 'productos disponibles',
            modal_variants: 'Variantes disponibles',
            modal_features: 'Caracter�sticas',
            modal_price_title: 'Tabla de Precios',
            modal_flat: '=� Plano',
            modal_relief: '<� Relieve hasta 1mm',
            modal_variant_col: 'Variante / Tama�o',
            legend_flat: 'Impresi�n plana  dise�o 2D est�ndar',
            legend_relief: 'Relieve hasta 1mm  textura t�ctil 3D',
            cta_quote: 'Cotizar ahora',
            badge_hot: '=% Popular',
            badge_new: '( Nuevo',
            badge_promo: '<� Promo',
            no_image: 'Vista previa pr�ximamente',
            no_image_short: 'Sin imagen',
                        //    Filter keys   
            filter_all: 'Todos',
            filter_gift: '<� Regalos',
            filter_business: '=� Empresarial',
            filter_popular: '=% Popular',
            filter_new: '( Nuevo',
            filter_budget: '=� Econ�mico',
            filter_premium: '=� Premium',
            filter_decor: '=� Decoraci�n',
            filter_drinkware: ' Bebidas',
            footer_trademark: 'Filamorfosis� es una marca registrada.',
            //    Store CTA keys   
            'hero.shopNow': 'Explorar Productos',
            'nav.store': 'Tienda',
            'gallery.viewAll': 'Ver todos los productos �',
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
            services_subtitle: 'Ready-to-personalize products  or let\'s build something one-of-a-kind together.',
            service_3d_title: '3D Printing',
            service_3d_desc: 'Bring your ideas to life with multicolor and multimaterial printing. From prototypes to functional parts that actually work.',
            service_3d_feat1: 'Up to 5 colors in one piece',
            service_3d_feat2: 'Flexible and strong materials',
            service_3d_feat3: 'Millimeter precision',
            service_3d_examples_title: 'What can you create?',
            service_3d_ex1: '<� Figures and toys',
            service_3d_ex2: '<� Home decoration',
            service_3d_ex3: '=' Replacement parts',
            service_3d_ex4: '=� Tech accessories',
            service_3d_ex5: '<� Personalized gifts',
            service_uv_title: 'UV Printing',
            service_uv_desc: 'Customize almost any surface with vibrant, long-lasting colors. Mugs, glasses, wood, metal, glass and more.',
            service_uv_feat1: 'Prints on cylindrical objects',
            service_uv_feat2: 'Colors that never fade',
            service_uv_feat3: 'Water-resistant stickers',
            service_uv_examples_title: 'What can you customize?',
            service_uv_ex1: ' Mugs and thermal cups',
            service_uv_ex2: '<� UV DTF stickers',
            service_uv_ex3: '>� Custom magnets',
            service_uv_ex4: '>� Wooden plaques',
            service_uv_ex5: '<� Decorative objects',
            service_laser_title: 'Laser Cutting',
            service_laser_desc: 'Cut and engrave with surgical precision. Perfect for signs, decoration, personalized gifts and more.',
            service_laser_feat1: 'Clean, precise cuts',
            service_laser_feat2: 'Engravings with incredible detail',
            service_laser_feat3: 'Wood, acrylic, leather and more',
            service_laser_examples_title: 'What can we make?',
            service_laser_ex1: '>� Wooden signs',
            service_laser_ex2: '=\ Leather accessories',
            service_laser_ex3: '=� Acrylic pieces',
            service_laser_ex4: '<� Business signage',
            service_laser_ex5: '<� Engraved gifts',
            service_engrave_title: 'Laser Engraving',
            service_engrave_desc: 'High-precision laser engraving on wood, metal, glass, leather and more. Personalize any surface with photographic detail.',
            service_engrave_feat1: 'Photographic and vector detail',
            service_engrave_feat2: 'Permanent  never fades or wears off',
            service_engrave_feat3: 'Wood, metal, glass, leather, stone',
            service_engrave_examples_title: 'What can we engrave?',
            service_engrave_ex1: '<� Personalized gifts',
            service_engrave_ex2: '<� Trophies and plaques',
            service_engrave_ex3: '= Keychains and accessories',
            service_engrave_ex4: '<~ Bottles and glasses',
            service_engrave_ex5: '=� Gadgets and electronics',
            service_scan_title: '3D Scanning',
            service_scan_desc: 'We turn physical objects into digital 3D models. Perfect for replicating parts, creating personalized gifts, or preserving memories.',
            service_scan_feat1: 'Scans from jewelry to full furniture',
            service_scan_feat2: 'Captures real color and texture',
            service_scan_feat3: 'Ready to 3D print',
            service_scan_examples_title: 'What can you scan?',
            service_scan_ex1: '<� Figures and sculptures',
            service_scan_ex2: '=) Parts and spare pieces',
            service_scan_ex3: '=d Busts and portraits',
            service_scan_ex4: '<� Objects to replicate',
            service_scan_ex5: '=� Vehicle parts',
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
            service_photo_ex1: '=� Family photos',
            service_photo_ex2: '=� Decorative paintings',
            service_photo_ex3: '=� Custom calendars',
            service_photo_ex4: '=� Promotional materials',
            service_photo_ex5: '<� Art and posters',
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
            mat_more_info: '=� View technical details',
            mat_learn_more: '( Learn more',
            mat_badge_eco: 'Eco',
            mat_badge_tough: 'Tough',
            mat_badge_flex: 'Flex',
            mat_badge_heat: 'Heat',
            mat_badge_pro: 'Pro',
            eco_headline: 'Eco-Conscious Printing',
            eco_desc: 'Our primary material, PLA, is plant-based  made from corn starch and sugarcane. It\'s biodegradable and a greener alternative to traditional plastics.',
            modal_properties: 'Properties',
            modal_advantages: 'Advantages',
            modal_applications: 'Applications',
            modal_examples: 'Usage Examples',
            modal_tech_btn: '=� Click here for technical material details',
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
            gallery_note: '=� Have a project in mind? Contact us for a personalized quote',
            gallery_cta_btn: 'Request Quote',
            clients_title: 'Our Clients',
            clients_subtitle: 'Companies that trust us',
            wa_subtitle: 'Usually replies within minutes',
            wa_greeting: 'Are you ready to bring your idea to reality? =�',
            wa_placeholder: 'Type your message here...',
            wa_btn: 'Start Chat �',
            btl_eyebrow: 'From idea to reality',
            btl_title: 'Your sketch becomes something real',
            btl_subtitle: "You don't need to be a designer. If you can draw it, imagine it or describe it  we make it happen.",
            btl_before_label: 'Your idea',
            btl_before_title: 'Start with a sketch',
            btl_before_desc: 'A drawing on paper, a reference photo, a description  any starting point works.',
            btl_step1: '3D Design', btl_step2: 'Printing', btl_step3: 'Finishing',
            btl_after_label: 'Your real object',
            btl_after_title: 'It becomes reality',
            btl_after_desc: 'A physical, precise and durable object  ready to use, gift or sell.',
            btl_feat1: "No 3D design knowledge needed",
            btl_feat2: 'We guide you every step of the way',
            btl_feat3: 'Fast turnaround',
            btl_feat4: 'From 1 piece to full production',
            btl_cta: 'Tell us your idea �',
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
                        //    Catalog keys   
            nav_catalog: '=� Catalog',
            hero_badge: 'Official Catalog 2025',
            hero_title_1: 'Products',
            hero_title_2: 'Ready to Order',
            hero_subtitle: 'Pick your product, customize it your way, and get it delivered. Unique personalized products  because blending in was never your style.',
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
            modal_flat: '=� Flat',
            modal_relief: '<� Relief up to 1mm',
            modal_variant_col: 'Variant / Size',
            legend_flat: 'Flat printing  standard 2D design',
            legend_relief: 'Relief up to 1mm  tactile 3D texture',
            cta_quote: 'Get a quote',
            badge_hot: '=% Popular',
            badge_new: '( New',
            badge_promo: '<� Promo',
            no_image: 'Preview coming soon',
            no_image_short: 'No image',
                        //    Filter keys   
            filter_all: 'All',
            filter_gift: '<� Gifts',
            filter_business: '=� Business',
            filter_popular: '=% Popular',
            filter_new: '( New',
            filter_budget: '=� Budget',
            filter_premium: '=� Premium',
            filter_decor: '=� Decor',
            filter_drinkware: ' Drinkware',
            footer_trademark: '',
            //    Store CTA keys   
            'hero.shopNow': 'Explore Products',
            'nav.store': 'Store',
            'gallery.viewAll': 'View all products �',
            'service.viewProducts': 'View products',
            'add_to_cart': 'Add to cart',
        },
        de: {
            nav_home: 'Start',
            nav_services: 'Dienste',
            nav_equipment: 'Ausr�stung',
            nav_clients: 'Kunden',
            nav_contact: 'Kontakt',
            hero_title: 'Deine Ideen. Deine Realit�t.',
            hero_subtitle: 'Wir verwandeln deine Vorstellung in greifbare Objekte, Schicht f�r Schicht.',
            hero_cta: 'Angebot anfordern',
            hero_cta_secondary: 'Dienste erkunden',
            services_title: 'Ma�geschneiderte Dienste',
            services_subtitle: 'Sofort personalisierbare Produkte  oder wir erschaffen gemeinsam etwas Einzigartiges.',
            service_3d_title: '3D-Druck',
            service_3d_desc: 'Erwecke deine Ideen mit Mehrfarb- und Multimaterialdruck zum Leben. Von Prototypen bis zu funktionalen Teilen.',
            service_3d_feat1: 'Bis zu 5 Farben in einem Teil',
            service_3d_feat2: 'Flexible und robuste Materialien',
            service_3d_feat3: 'Millimetergenaue Pr�zision',
            service_3d_examples_title: 'Was kannst du erstellen?',
            service_3d_ex1: '<� Figuren und Spielzeug',
            service_3d_ex2: '<� Heimdekoration',
            service_3d_ex3: '=' Ersatzteile',
            service_3d_ex4: '=� Tech-Zubeh�r',
            service_3d_ex5: '<� Personalisierte Geschenke',
            service_uv_title: 'UV-Druck',
            service_uv_desc: 'Personalisiere fast jede Oberfl�che mit lebendigen, langlebigen Farben. Tassen, Gl�ser, Holz, Metall, Glas und mehr.',
            service_uv_feat1: 'Druck auf zylindrische Objekte',
            service_uv_feat2: 'Farben, die nicht verblassen',
            service_uv_feat3: 'Wasserfeste Aufkleber',
            service_uv_examples_title: 'Was kannst du personalisieren?',
            service_uv_ex1: ' Tassen und Thermobecher',
            service_uv_ex2: '<� UV DTF Aufkleber',
            service_uv_ex3: '>� Personalisierte Magnete',
            service_uv_ex4: '>� Holzplatten',
            service_uv_ex5: '<� Dekorative Objekte',
            service_laser_title: 'Laserschneiden',
            service_laser_desc: 'Schneiden und gravieren mit chirurgischer Pr�zision. Perfekt f�r Schilder, Dekoration, personalisierte Geschenke und mehr.',
            service_laser_feat1: 'Saubere und pr�zise Schnitte',
            service_laser_feat2: 'Gravuren mit unglaublichen Details',
            service_laser_feat3: 'Holz, Acryl, Leder und mehr',
            service_laser_examples_title: 'Was k�nnen wir machen?',
            service_laser_ex1: '>� Holzschilder',
            service_laser_ex2: '=\ Lederaccessoires',
            service_laser_ex3: '=� Acrylteile',
            service_laser_ex4: '<� Unternehmensbeschilderung',
            service_laser_ex5: '<� Gravierte Geschenke',
            service_engrave_title: 'Lasergravur',
            service_engrave_desc: 'Hochpr�zise Lasergravur auf Holz, Metall, Glas, Leder und mehr. Personalisiere jede Oberfl�che mit fotografischem Detail.',
            service_engrave_feat1: 'Fotografisches und vektorielles Detail',
            service_engrave_feat2: 'Permanent  verblasst nie',
            service_engrave_feat3: 'Holz, Metall, Glas, Leder, Stein',
            service_engrave_examples_title: 'Was k�nnen wir gravieren?',
            service_engrave_ex1: '<� Personalisierte Geschenke',
            service_engrave_ex2: '<� Troph�en und Plaketten',
            service_engrave_ex3: '= Schl�sselanh�nger',
            service_engrave_ex4: '<~ Flaschen und Gl�ser',
            service_engrave_ex5: '=� Gadgets und Elektronik',
            service_scan_title: '3D-Scanning',
            service_scan_desc: 'Wir wandeln physische Objekte in digitale 3D-Modelle um. Ideal zum Replizieren von Teilen oder Digitalisieren von Erinnerungen.',
            service_scan_feat1: 'Scannt von Schmuck bis M�bel',
            service_scan_feat2: 'Erfasst echte Farbe und Textur',
            service_scan_feat3: 'Druckfertige Datei',
            service_scan_examples_title: 'Was kannst du scannen?',
            service_scan_ex1: '<� Figuren und Skulpturen',
            service_scan_ex2: '=) Teile und Ersatzteile',
            service_scan_ex3: '=d B�sten und Portr�ts',
            service_scan_ex4: '<� Objekte zum Replizieren',
            service_scan_ex5: '=� Fahrzeugteile',
            equip_card6_title: '3D-Scanning',
            equip_card6_desc: 'Wir digitalisieren jedes physische Objekt mit hoher Pr�zision  von kleinem Schmuck bis zu M�beln.',
            equip_card6_feat1: 'Objekte von 5cm bis zu ganzen M�beln',
            equip_card6_feat2: 'Farbe und Textur in 48 MP',
            equip_card6_feat3: 'Druckfertige Datei',
            service_photo_title: 'Fotodruck',
            service_photo_desc: 'Deine Erinnerungen verdienen die beste Qualit�t. Professioneller Druck f�r deine besonderen Momente.',
            service_photo_feat1: 'Professionelle Qualit�t',
            service_photo_feat2: 'Erstklassiges Papier',
            service_photo_feat3: 'Alle Gr��en',
            service_photo_examples_title: 'Was drucken wir?',
            service_photo_ex1: '=� Familienfotos',
            service_photo_ex2: '=� Dekorative Bilder',
            service_photo_ex3: '=� Personalisierte Kalender',
            service_photo_ex4: '=� Werbematerial',
            service_photo_ex5: '<� Kunst und Poster',
            equipment_title: 'Was k�nnen wir erstellen?',
            equipment_subtitle: 'Von kleinen Spielzeugen bis zu gro�en, robusten Teilen',
            equip_card1_title: 'Hochgeschwindigkeits-3D-Druck',
            equip_card1_desc: 'Objekte aus farbigem Kunststoff. Perfekt f�r Prototypen, Figuren und personalisierte Teile.',
            equip_card1_feat1: 'Gr��e: bis 25cm x 25cm x 25cm',
            equip_card1_feat2: 'Bis zu 4 Farben in einem Teil',
            equip_card1_feat3: 'Materialien: PLA, PETG, flexibles TPU',
            equip_card2_title: 'Kompakter 3D-Druck',
            equip_card2_desc: 'Ideal f�r kleine und mittlere Objekte. Schnell und leise, perfekt f�r Dekoration und Geschenke.',
            equip_card2_feat1: 'Gr��e: bis 18cm x 18cm x 18cm',
            equip_card2_feat2: 'Mehrfarb verf�gbar',
            equip_card2_feat3: 'Materialien: PLA, PETG, TPU',
            equip_card3_title: 'Gro�er und robuster 3D-Druck',
            equip_card3_desc: 'F�r gro�e und robuste Projekte. Bis zu 5 verschiedene Materialien in einem Teil.',
            equip_card3_feat1: 'Gr��e: bis 36cm x 36cm x 36cm',
            equip_card3_feat2: 'Bis zu 5 Farben/Materialien',
            equip_card3_feat3: 'Materialien: PLA, PETG, ABS, PA+CF',
            equip_card4_title: 'Direkter UV-Druck',
            equip_card4_desc: 'Wir drucken Designs in Vollfarbe auf fast alles: Tassen, Gl�ser, Holz, Metall, Glas, Kunststoff.',
            equip_card4_feat1: 'Druck auf zylindrische Objekte',
            equip_card4_feat2: 'Robuste UV DTF Aufkleber',
            equip_card4_feat3: 'Magnete, Platten und mehr',
            equip_card5_title: 'Laserschneiden und -gravieren',
            equip_card5_desc: 'Wir schneiden und gravieren Designs in Holz, Acryl, Leder, Karton und mehr.',
            equip_card5_feat1: 'Bereich: 40cm x 40cm',
            equip_card5_feat2: 'Schneidet 2cm dickes Holz',
            equip_card5_feat3: 'Superpr�zise Gravuren',
            materials_title: 'Materialien, die wir verwenden',
            materials_subtitle: 'Klicke auf jedes Material f�r mehr Details',
            materials_toggle: 'Klicke hier, um alle Filamente und Materialien zu entdecken',
            mat_ideal_for: 'Ideal f�r',
            mat_more_info: '=� Technische Details',
            mat_learn_more: '( Mehr erfahren',
            mat_badge_eco: '�ko',
            mat_badge_tough: 'Hart',
            mat_badge_flex: 'Flex',
            mat_badge_heat: 'Hitze',
            mat_badge_pro: 'Pro',
            eco_headline: 'Umweltbewusstes Drucken',
            eco_desc: 'Unser Hauptmaterial PLA ist pflanzlich  hergestellt aus Maisst�rke und Zuckerrohr. Es ist biologisch abbaubar und eine gr�nere Alternative zu herk�mmlichen Kunststoffen.',
            modal_properties: 'Eigenschaften',
            modal_advantages: 'Vorteile',
            modal_applications: 'Anwendungen',
            modal_examples: 'Anwendungsbeispiele',
            modal_tech_btn: '=� Klicke hier f�r technische Materialdetails',
            tech_specifications: 'Technische Spezifikationen',
            tech_mechanical: 'Mechanische Eigenschaften',
            tech_thermal: 'Thermische Eigenschaften',
            tech_physical: 'Physikalische Eigenschaften',
            tech_durability: 'Haltbarkeit und Widerstandsf�higkeit',
            tech_recommendations: 'Verwendungsempfehlungen',
            material_pla: 'Das h�ufigste. Einfach zu verwenden, in vielen Farben erh�ltlich. Perfekt f�r Dekoration und Prototypen.',
            material_pla_uses: 'Ideal f�r: Figuren, Spielzeug, Dekoration, Prototypen, Organizer',
            material_petg: 'St�rker und flexibler als PLA. Wasserbest�ndig. Ideal f�r h�ufig verwendete Objekte.',
            material_petg_uses: 'Ideal f�r: Flaschen, Beh�lter, mechanische Teile, Au�enobjekte',
            material_tpu: 'Super flexibel wie Gummi. Perfekt f�r Handyh�llen, weiches Spielzeug und biegbare Teile.',
            material_tpu_uses: 'Ideal f�r: Handyh�llen, Riemen, Dichtungen, flexibles Spielzeug',
            material_abs: 'Sehr hitzebest�ndig. Das gleiche Material wie LEGO. Ideal f�r mechanische Teile.',
            material_abs_uses: 'Ideal f�r: Autoteile, Geh�use, Werkzeuge, hitzebest�ndige Teile',
            material_pacf: 'Das st�rkste. Enth�lt Kohlefaser. F�r Teile, die extrem widerstandsf�hig sein m�ssen.',
            material_pacf_uses: 'Ideal f�r: Drohnen, Industrieteile, Werkzeuge, Lasttr�ger',
            use_cases_title: 'Beispiele unserer Arbeit',
            use_case_1_title: 'Spielzeug und Figuren',
            use_case_1_desc: 'Videospielcharaktere, Sammlerfiguren, personalisiertes Spielzeug',
            use_case_2_title: 'Heimdekoration',
            use_case_2_desc: 'Blument�pfe, Lampen, Organizer, personalisierte Schilder, Rahmen',
            use_case_3_title: 'Personalisierte Geschenke',
            use_case_3_desc: 'Tassen mit Namen, Schl�sselanh�nger, gravierte Platten, personalisierte Troph�en',
            use_case_4_title: 'Ersatzteile',
            use_case_4_desc: 'Ersatzteile f�r Haushaltsger�te, Autoteile, mechanische Komponenten',
            use_case_5_title: 'Tech-Zubeh�r',
            use_case_5_desc: 'Handyh�llen, Tablet-St�nder, Kabelorganizer',
            use_case_6_title: 'B�ro und Gesch�ft',
            use_case_6_desc: 'Schilder, Visitenkartenhalter, personalisierte Stempel, Produktdisplays',
            use_case_7_title: 'UV DTF Aufkleber',
            use_case_7_desc: 'Wasserfeste Aufkleber f�r Laptops, Autos, Flaschen',
            use_case_8_title: 'Becher und Tumblers',
            use_case_8_desc: 'Personalisierte Thermobecher, Flaschen mit Designs, Fototassen',
            use_case_9_title: 'Magnete und Platten',
            use_case_9_desc: 'K�hlschrankmagnete, Namensschilder, Beschilderung',
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
            gallery_3d_3_caption: 'Blument�pfe, Lampen, Organizer und personalisierte Dekorationsobjekte',
            gallery_laser_1: 'Holzgravur',
            gallery_laser_1_caption: 'Schilder, personalisierte Platten und Dekoration aus Naturholz',
            gallery_laser_2: 'Ledergravur',
            gallery_laser_2_caption: 'Geldb�rsen, G�rtel, Schl�sselanh�nger und personalisiertes Lederzubeh�r',
            gallery_laser_3: 'Acrylschnitt',
            gallery_laser_3_caption: 'Leuchtschilder, Displays und dekorative Acrylteile',
            gallery_uv_1: 'Tassen und Becher',
            gallery_uv_1_caption: 'Personalisierte Tumblers, Tassen und Flaschen mit UV-Druck',
            gallery_uv_2: 'UV DTF Aufkleber',
            gallery_uv_2_caption: 'Wasserfeste Aufkleber f�r Laptops, Autos und mehr',
            gallery_uv_3: 'Magnete und Platten',
            gallery_uv_3_caption: 'Personalisierte Magnete, Namensschilder und UV-Beschilderung',
            gallery_note: '=� Hast du ein Projekt im Sinn? Kontaktiere uns f�r ein individuelles Angebot',
            gallery_cta_btn: 'Angebot anfordern',
            clients_title: 'Unsere Kunden',
            clients_subtitle: 'Unternehmen, die uns vertrauen',
            wa_subtitle: 'Antwortet normalerweise innerhalb von Minuten',
            wa_greeting: 'Bist du bereit, deine Idee Wirklichkeit werden zu lassen? =�',
            wa_placeholder: 'Schreibe deine Nachricht hier...',
            wa_btn: 'Chat starten �',
            btl_eyebrow: 'Von der Idee zur Realit�t',
            btl_title: 'Deine Skizze wird zu etwas Realem',
            btl_subtitle: 'Du musst kein Designer sein. Wenn du es zeichnen, vorstellen oder beschreiben kannst  wir machen es wahr.',
            btl_before_label: 'Deine Idee',
            btl_before_title: 'Beginne mit einer Skizze',
            btl_before_desc: 'Eine Zeichnung auf Papier, ein Referenzfoto, eine Beschreibung  jeder Ausgangspunkt funktioniert.',
            btl_step1: '3D-Design', btl_step2: 'Druck', btl_step3: 'Finish',
            btl_after_label: 'Dein echtes Objekt',
            btl_after_title: 'Wird Wirklichkeit',
            btl_after_desc: 'Ein physisches, pr�zises und langlebiges Objekt  bereit zum Verwenden, Verschenken oder Verkaufen.',
            btl_feat1: 'Kein 3D-Design-Wissen n�tig',
            btl_feat2: 'Wir beraten dich bei jedem Schritt',
            btl_feat3: 'Schnelle Lieferung',
            btl_feat4: 'Von 1 St�ck bis zur Produktion',
            btl_cta: 'Erz�hl uns deine Idee �',
            moq_single: 'Mindestst�ck',
            moq_headline: 'Keine Mindestmengen. Keine Ausreden.',
            moq_sub: 'Brauchst du nur ein St�ck? Wir machen es. 500? Auch. Du entscheidest.',
            moq_bulk: 'Skalierte Produktion',
            equipment_subtitle: 'Professionelle Technologie f�r au�ergew�hnliche Ergebnisse',
            equip_card1_title: 'Hochgeschwindigkeits-3D-Druck',
            equip_card1_desc: 'Geschwindigkeiten bis 300mm/s mit automatischer LIDAR-Kalibrierung und Unterst�tzung f�r fortschrittliche Materialien.',
            equip_card2_title: 'Kompakter 3D-Druck',
            equip_card2_desc: 'Kompaktes System mit Geschwindigkeiten bis 500mm/s und leiser Betrieb d48dB.',
            equip_card3_title: 'Gro�format-3D-Druck',
            equip_card3_desc: 'Werkzeugwechselsystem mit bis zu 5 unabh�ngigen K�pfen f�r Multimaterialdruck.',
            equip_card4_title: 'Direkter UV-Druck',
            equip_card4_desc: 'Direktdruck auf mehrere Oberfl�chen mit 3D-Texturen und Millionen von Farben.',
            equip_card5_title: 'Laserschneiden und -gravieren',
            equip_card5_desc: '40W-Laser mit 400�400mm Arbeitsbereich und Graviergeschwindigkeit bis 36000mm/min.',
            contact_title: 'Kontakt',
            contact_subtitle: 'Erz�hl uns von deinem Projekt und wir melden uns bald',
            form_name: 'Name',
            form_email: 'E-Mail',
            form_phone: 'Telefon',
            form_service: 'Gew�nschter Dienst',
            form_select: 'Dienst ausw�hlen',
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
            contact_hours_label: '�ffnungszeiten',
            contact_hours: 'Mo - Fr: 9:00 - 18:00',
            footer_rights: 'Alle Rechte vorbehalten.',
            cert_mexico: 'Hergestellt in Mexiko',
            cert_materials: 'Zertifizierte Materialien',
            cert_quality: 'Qualit�t garantiert',
            
            //    Catalog keys   
            nav_catalog: '=� Katalog',
            hero_badge: 'Offizieller Katalog 2025',
            hero_title_1: 'Produkte',
            hero_title_2: 'Bestellbereit',
            hero_subtitle: 'W�hle dein Produkt, personalisiere es nach deinem Geschmack und lass es liefern. Einzigartige Produkte  weil du nicht wie alle anderen sein willst.',
            stat_products: 'Produkte',
            stat_min: 'Mindestst�ck',
            stat_response: 'Antwort',
            empty_text: 'Keine Produkte gefunden',
            footer_note_cat: 'Preise in MXN. �nderungen vorbehalten. Endangebot gem�� Spezifikationen.',
            search_placeholder: 'Produkt suchen...',
            filter_all: 'Alle',
            from_label: 'Ab',
            see_details: 'Details ansehen',
            cat_uv: 'UV-Druck',
            cat_3d: '3D-Druck',
            cat_laser: 'Laserschneiden',
            cat_engrave: 'Lasergravur',
            cat_photo: 'Fotografie',
            products_count_one: 'Produkt verf�gbar',
            products_count_many: 'Produkte verf�gbar',
            modal_variants: 'Verf�gbare Varianten',
            modal_features: 'Eigenschaften',
            modal_price_title: 'Preistabelle',
            modal_flat: '=� Flach',
            modal_relief: '<� Relief bis 1mm',
            modal_variant_col: 'Variante / Gr��e',
            legend_flat: 'Flachdruck  Standard-2D-Design',
            legend_relief: 'Relief bis 1mm  taktile 3D-Textur',
            cta_quote: 'Angebot anfordern',
            badge_hot: '=% Beliebt',
            badge_new: '( Neu',
            badge_promo: '<� Promo',
            no_image: 'Vorschau demn�chst',
            no_image_short: 'Kein Bild',
                        //    Filter keys   
            filter_all: 'Alle',
            filter_gift: '<� Geschenke',
            filter_business: '=� Gesch�ftlich',
            filter_popular: '=% Beliebt',
            filter_new: '( Neu',
            filter_budget: '=� G�nstig',
            filter_premium: '=� Premium',
            filter_decor: '=� Dekoration',
            filter_drinkware: ' Getr�nke',
            footer_trademark: 'Filamorfosis� ist eine eingetragene Marke.'
        },
        pt: {
            nav_home: 'In�cio',
            nav_services: 'Servi�os',
            nav_equipment: 'Equipamentos',
            nav_clients: 'Clientes',
            nav_contact: 'Contato',
            hero_title: 'Suas Ideias. Sua Realidade.',
            hero_subtitle: 'Transformamos sua imagina��o em objetos tang�veis, camada por camada.',
            hero_cta: 'Solicitar Or�amento',
            hero_cta_secondary: 'Ver Servi�os',
            services_title: 'Servi�os Sob Medida',
            services_subtitle: 'Produtos prontos para personalizar  ou criamos juntos algo �nico para voc�.',
            service_3d_title: 'Impress�o 3D',
            service_3d_desc: 'D� vida �s suas ideias com impress�o multicolor e multimaterial. De prot�tipos a pe�as funcionais.',
            service_3d_feat1: 'At� 5 cores em uma pe�a',
            service_3d_feat2: 'Materiais flex�veis e resistentes',
            service_3d_feat3: 'Precis�o milim�trica',
            service_3d_examples_title: 'O que voc� pode criar?',
            service_3d_ex1: '<� Figuras e brinquedos',
            service_3d_ex2: '<� Decora��o para casa',
            service_3d_ex3: '=' Pe�as de reposi��o',
            service_3d_ex4: '=� Acess�rios tech',
            service_3d_ex5: '<� Presentes personalizados',
            service_uv_title: 'Impress�o UV',
            service_uv_desc: 'Personalize quase qualquer superf�cie com cores vibrantes e duradouras. Canecas, copos, madeira, metal, vidro e mais.',
            service_uv_feat1: 'Imprime em objetos cil�ndricos',
            service_uv_feat2: 'Cores que n�o desbotam',
            service_uv_feat3: 'Adesivos resistentes � �gua',
            service_uv_examples_title: 'O que voc� pode personalizar?',
            service_uv_ex1: ' Canecas e copos t�rmicos',
            service_uv_ex2: '<� Adesivos UV DTF',
            service_uv_ex3: '>� �m�s personalizados',
            service_uv_ex4: '>� Placas de madeira',
            service_uv_ex5: '<� Objetos decorativos',
            service_laser_title: 'Corte a Laser',
            service_laser_desc: 'Corte e grave com precis�o cir�rgica. Perfeito para placas, decora��o, presentes personalizados e mais.',
            service_laser_feat1: 'Cortes limpos e precisos',
            service_laser_feat2: 'Grava��es com detalhes incr�veis',
            service_laser_feat3: 'Madeira, acr�lico, couro e mais',
            service_laser_examples_title: 'O que podemos fazer?',
            service_laser_ex1: '>� Placas de madeira',
            service_laser_ex2: '=\ Acess�rios de couro',
            service_laser_ex3: '=� Pe�as de acr�lico',
            service_laser_ex4: '<� Sinaliza��o empresarial',
            service_laser_ex5: '<� Presentes gravados',
            service_engrave_title: 'Grava��o a Laser',
            service_engrave_desc: 'Grava��o a laser de alta precis�o em madeira, metal, vidro, couro e mais. Personalize qualquer superf�cie com detalhe fotogr�fico.',
            service_engrave_feat1: 'Detalhe fotogr�fico e vetorial',
            service_engrave_feat2: 'Permanente  nunca desaparece',
            service_engrave_feat3: 'Madeira, metal, vidro, couro, pedra',
            service_engrave_examples_title: 'O que podemos gravar?',
            service_engrave_ex1: '<� Presentes personalizados',
            service_engrave_ex2: '<� Trof�us e placas',
            service_engrave_ex3: '= Chaveiros e acess�rios',
            service_engrave_ex4: '<~ Garrafas e copos',
            service_engrave_ex5: '=� Gadgets e eletr�nicos',
            service_scan_title: 'Escaneamento 3D',
            service_scan_desc: 'Convertemos objetos f�sicos em modelos digitais 3D. Ideal para replicar pe�as ou digitalizar mem�rias.',
            service_scan_feat1: 'Escaneia de joias a m�veis',
            service_scan_feat2: 'Captura cor e textura reais',
            service_scan_feat3: 'Arquivo pronto para impress�o',
            service_scan_examples_title: 'O que voc� pode escanear?',
            service_scan_ex1: '<� Figuras e esculturas',
            service_scan_ex2: '=) Pe�as e reposi��es',
            service_scan_ex3: '=d Bustos e retratos',
            service_scan_ex4: '<� Objetos para replicar',
            service_scan_ex5: '=� Pe�as de ve�culos',
            equip_card6_title: 'Escaneamento 3D',
            equip_card6_desc: 'Digitalizamos qualquer objeto f�sico com alta precis�o  de pequenas joias a m�veis.',
            equip_card6_feat1: 'Objetos de 5cm a m�veis inteiros',
            equip_card6_feat2: 'Captura cor e textura em 48 MP',
            equip_card6_feat3: 'Arquivo pronto para impress�o 3D',
            service_photo_title: 'Impress�o Fotogr�fica',
            service_photo_desc: 'Suas mem�rias merecem a melhor qualidade. Impress�o profissional para seus momentos especiais.',
            service_photo_feat1: 'Qualidade profissional',
            service_photo_feat2: 'Papel de primeira qualidade',
            service_photo_feat3: 'Todos os tamanhos',
            service_photo_examples_title: 'O que imprimimos?',
            service_photo_ex1: '=� Fotos de fam�lia',
            service_photo_ex2: '=� Quadros decorativos',
            service_photo_ex3: '=� Calend�rios personalizados',
            service_photo_ex4: '=� Material promocional',
            service_photo_ex5: '<� Arte e p�steres',
            equipment_title: 'O que podemos criar?',
            equipment_subtitle: 'De pequenos brinquedos a pe�as grandes e resistentes',
            equip_card1_title: 'Impress�o 3D de Alta Velocidade',
            equip_card1_desc: 'Objetos em pl�stico colorido. Perfeito para prot�tipos, figuras e pe�as personalizadas.',
            equip_card1_feat1: 'Tamanho: at� 25cm x 25cm x 25cm',
            equip_card1_feat2: 'At� 4 cores em uma pe�a',
            equip_card1_feat3: 'Materiais: PLA, PETG, TPU flex�vel',
            equip_card2_title: 'Impress�o 3D Compacta',
            equip_card2_desc: 'Ideal para objetos pequenos e m�dios. R�pida e silenciosa, perfeita para decora��o e presentes.',
            equip_card2_feat1: 'Tamanho: at� 18cm x 18cm x 18cm',
            equip_card2_feat2: 'Multicolor dispon�vel',
            equip_card2_feat3: 'Materiais: PLA, PETG, TPU',
            equip_card3_title: 'Impress�o 3D Grande e Resistente',
            equip_card3_desc: 'Para projetos grandes e resistentes. At� 5 materiais diferentes em uma pe�a.',
            equip_card3_feat1: 'Tamanho: at� 36cm x 36cm x 36cm',
            equip_card3_feat2: 'At� 5 cores/materiais',
            equip_card3_feat3: 'Materiais: PLA, PETG, ABS, PA+CF',
            equip_card4_title: 'Impress�o UV Direta',
            equip_card4_desc: 'Imprimimos designs coloridos em quase tudo: canecas, copos, madeira, metal, vidro, pl�stico.',
            equip_card4_feat1: 'Imprime em objetos cil�ndricos',
            equip_card4_feat2: 'Adesivos UV DTF resistentes',
            equip_card4_feat3: '�m�s, placas e mais',
            equip_card5_title: 'Corte e Grava��o a Laser',
            equip_card5_desc: 'Cortamos e gravamos designs em madeira, acr�lico, couro, papel�o e mais.',
            equip_card5_feat1: '�rea: 40cm x 40cm',
            equip_card5_feat2: 'Corta madeira de 2cm de espessura',
            equip_card5_feat3: 'Grava��es super detalhadas',
            materials_title: 'Materiais que Usamos',
            materials_subtitle: 'Clique em cada material para saber mais detalhes',
            materials_toggle: 'Clique aqui para conhecer todos os filamentos e materiais que usamos',
            mat_ideal_for: 'Ideal para',
            mat_more_info: '=� Ver detalhes t�cnicos',
            mat_learn_more: '( Saiba mais',
            mat_badge_eco: 'Eco',
            mat_badge_tough: 'Forte',
            mat_badge_flex: 'Flex',
            mat_badge_heat: 'Calor',
            mat_badge_pro: 'Pro',
            eco_headline: 'Impress�o Consciente com o Planeta',
            eco_desc: 'Nosso principal material, o PLA, � de origem vegetal  fabricado a partir de amido de milho e cana-de-a��car. � biodegrad�vel e uma alternativa mais verde aos pl�sticos tradicionais.',
            modal_properties: 'Propriedades',
            modal_advantages: 'Vantagens',
            modal_applications: 'Aplica��es',
            modal_examples: 'Exemplos de Uso',
            modal_tech_btn: '=� Clique aqui para detalhes t�cnicos do material',
            tech_specifications: 'Especifica��es T�cnicas',
            tech_mechanical: 'Propriedades Mec�nicas',
            tech_thermal: 'Propriedades T�rmicas',
            tech_physical: 'Propriedades F�sicas',
            tech_durability: 'Durabilidade e Resist�ncia',
            tech_recommendations: 'Recomenda��es de Uso',
            material_pla: 'O mais comum. F�cil de usar, dispon�vel em muitas cores. Perfeito para decora��o e prot�tipos.',
            material_pla_uses: 'Ideal para: Figuras, brinquedos, decora��o, prot�tipos, organizadores',
            material_petg: 'Mais forte e flex�vel que o PLA. Resistente � �gua. Ideal para objetos de uso frequente.',
            material_petg_uses: 'Ideal para: Garrafas, recipientes, pe�as mec�nicas, objetos externos',
            material_tpu: 'Super flex�vel como borracha. Perfeito para capas de celular, brinquedos macios e pe�as dobr�veis.',
            material_tpu_uses: 'Ideal para: Capas de celular, correias, selos, brinquedos flex�veis',
            material_abs: 'Muito resistente ao calor. O mesmo material do LEGO. Ideal para pe�as mec�nicas.',
            material_abs_uses: 'Ideal para: Pe�as de carro, carca�as, ferramentas, pe�as resistentes ao calor',
            material_pacf: 'O mais forte. Tem fibra de carbono. Para pe�as que precisam ser super resistentes.',
            material_pacf_uses: 'Ideal para: Drones, pe�as industriais, ferramentas, suportes de carga',
            use_cases_title: 'Exemplos do que Criamos',
            use_case_1_title: 'Brinquedos e Figuras',
            use_case_1_desc: 'Personagens de videogame, figuras colecion�veis, brinquedos personalizados',
            use_case_2_title: 'Decora��o para Casa',
            use_case_2_desc: 'Vasos, lumin�rias, organizadores, placas personalizadas, molduras',
            use_case_3_title: 'Presentes Personalizados',
            use_case_3_desc: 'Canecas com nomes, chaveiros, placas gravadas, trof�us personalizados',
            use_case_4_title: 'Pe�as de Reposi��o',
            use_case_4_desc: 'Reposi��es para eletrodom�sticos, pe�as de carro, componentes mec�nicos',
            use_case_5_title: 'Acess�rios Tech',
            use_case_5_desc: 'Capas de celular, suportes para tablet, organizadores de cabos',
            use_case_6_title: 'Neg�cios e Escrit�rio',
            use_case_6_desc: 'Placas, porta-cart�es, carimbos personalizados, displays de produtos',
            use_case_7_title: 'Adesivos UV DTF',
            use_case_7_desc: 'Adesivos resistentes � �gua para laptops, carros, garrafas',
            use_case_8_title: 'Copos e Tumblers',
            use_case_8_desc: 'Copos t�rmicos personalizados, garrafas com designs, canecas com fotos',
            use_case_9_title: '�m�s e Placas',
            use_case_9_desc: '�m�s de geladeira, placas de identifica��o, sinaliza��o',
            gallery_title: 'Galeria de Projetos',
            gallery_subtitle: 'Alguns exemplos do que criamos',
            gallery_filter_all: 'Todos',
            gallery_filter_3d: 'Impress�o 3D',
            gallery_filter_laser: 'Corte a Laser',
            gallery_filter_engrave: 'Grava��o a Laser',
            gallery_filter_scan: 'Escaneamento 3D',
            gallery_filter_uv: 'Impress�o UV',
            gallery_3d_1_caption: 'Personagens, figuras colecion�veis e prot�tipos funcionais em PLA multicolor',
            gallery_3d_2: 'Pe�as Funcionais',
            gallery_3d_2_caption: 'Reposi��es, ferramentas e componentes mec�nicos em PETG e ABS',
            gallery_3d_3: 'Decora��o',
            gallery_3d_3_caption: 'Vasos, lumin�rias, organizadores e objetos decorativos personalizados',
            gallery_laser_1: 'Grava��o em Madeira',
            gallery_laser_1_caption: 'Placas, pe�as personalizadas e decora��o em madeira natural',
            gallery_laser_2: 'Grava��o em Couro',
            gallery_laser_2_caption: 'Carteiras, cintos, chaveiros e acess�rios de couro personalizados',
            gallery_laser_3: 'Corte em Acr�lico',
            gallery_laser_3_caption: 'Placas luminosas, displays e pe�as decorativas em acr�lico',
            gallery_uv_1: 'Canecas e Copos',
            gallery_uv_1_caption: 'Tumblers, canecas e garrafas personalizadas com impress�o UV',
            gallery_uv_2: 'Adesivos UV DTF',
            gallery_uv_2_caption: 'Adesivos resistentes � �gua para laptops, carros e mais',
            gallery_uv_3: '�m�s e Placas',
            gallery_uv_3_caption: '�m�s personalizados, placas de identifica��o e sinaliza��o UV',
            gallery_note: '=� Tem um projeto em mente? Entre em contato para um or�amento personalizado',
            gallery_cta_btn: 'Solicitar Or�amento',
            clients_title: 'Nossos Clientes',
            clients_subtitle: 'Empresas que confiam em n�s',
            wa_subtitle: 'Normalmente responde em minutos',
            wa_greeting: 'Voc� est� pronto para transformar sua ideia em realidade? =�',
            wa_placeholder: 'Escreva sua mensagem aqui...',
            wa_btn: 'Iniciar Chat �',
            btl_eyebrow: 'Da ideia � realidade',
            btl_title: 'Seu esbo�o se torna algo real',
            btl_subtitle: 'Voc� n�o precisa ser designer. Se puder desenhar, imaginar ou descrever  n�s realizamos.',
            btl_before_label: 'Sua ideia',
            btl_before_title: 'Comece com um esbo�o',
            btl_before_desc: 'Um desenho em papel, uma foto de refer�ncia, uma descri��o  qualquer ponto de partida funciona.',
            btl_step1: 'Design 3D', btl_step2: 'Impress�o', btl_step3: 'Acabamento',
            btl_after_label: 'Seu objeto real',
            btl_after_title: 'Vira realidade',
            btl_after_desc: 'Um objeto f�sico, preciso e dur�vel  pronto para usar, presentear ou vender.',
            btl_feat1: 'N�o precisa saber design 3D',
            btl_feat2: 'Te orientamos em cada etapa',
            btl_feat3: 'Entregas r�pidas',
            btl_feat4: 'De 1 pe�a at� produ��o em escala',
            btl_cta: 'Conte-nos sua ideia �',
            moq_single: 'pe�a m�nima',
            moq_headline: 'Sem m�nimos. Sem desculpas.',
            moq_sub: 'Precisa de uma pe�a? Fazemos. 500? Tamb�m. Voc� decide.',
            moq_bulk: 'produ��o em escala',
            equipment_subtitle: 'Tecnologia profissional para resultados excepcionais',
            equip_card1_title: 'Impress�o 3D de Alta Velocidade',
            equip_card1_desc: 'Velocidades de at� 300mm/s com calibra��o autom�tica LIDAR e suporte a materiais avan�ados.',
            equip_card2_title: 'Impress�o 3D Compacta',
            equip_card2_desc: 'Sistema compacto com velocidades de at� 500mm/s e opera��o silenciosa d48dB.',
            equip_card3_title: 'Impress�o 3D Grande Formato',
            equip_card3_desc: 'Sistema de troca de ferramentas com at� 5 cabe�as independentes para impress�o multimaterial.',
            equip_card4_title: 'Impress�o UV Direta',
            equip_card4_desc: 'Impress�o direta em m�ltiplas superf�cies com texturas 3D e milh�es de cores.',
            equip_card5_title: 'Corte e Grava��o a Laser',
            equip_card5_desc: 'Laser de 40W com �rea de trabalho de 400�400mm e velocidade de grava��o de at� 36000mm/min.',
            contact_title: 'Contato',
            contact_subtitle: 'Conte-nos sobre seu projeto e responderemos em breve',
            form_name: 'Nome',
            form_email: 'E-mail',
            form_phone: 'Telefone',
            form_service: 'Servi�o de Interesse',
            form_select: 'Selecione um servi�o',
            form_opt_3d: 'Impress�o 3D',
            form_opt_uv: 'Impress�o UV',
            form_opt_laser: 'Corte a Laser',
            form_opt_engrave: 'Grava��o a Laser',
            form_opt_photo: 'Impress�o Fotogr�fica',
            form_opt_other: 'Outro',
            form_message: 'Mensagem',
            form_submit: 'Enviar Mensagem',
            form_success: 'Mensagem enviada com sucesso! Entraremos em contato em breve.',
            form_error: 'Erro ao enviar mensagem. Por favor, tente novamente.',
            contact_email_label: 'E-mail',
            contact_phone_label: 'Telefone',
            contact_hours_label: 'Hor�rio',
            contact_hours: 'Seg - Sex: 9:00 - 18:00',
            footer_rights: 'Todos os direitos reservados.',
            cert_mexico: 'Produ��o no M�xico',
            cert_materials: 'Materiais certificados',
            cert_quality: 'Qualidade garantida',
            
            //    Catalog keys   
            nav_catalog: '=� Cat�logo',
            hero_badge: 'Cat�logo Oficial 2025',
            hero_title_1: 'Produtos',
            hero_title_2: 'Prontos para Pedir',
            hero_subtitle: 'Escolha seu produto, personalize do seu jeito e receba em casa. Produtos �nicos feitos para voc�  porque ser igual a todo mundo nunca foi sua praia.',
            stat_products: 'Produtos',
            stat_min: 'Pe�a m�nima',
            stat_response: 'Resposta',
            empty_text: 'Nenhum produto encontrado',
            footer_note_cat: 'Pre�os em MXN. Sujeitos a altera��o sem aviso pr�vio. Or�amento final conforme especifica��es.',
            search_placeholder: 'Buscar produto...',
            filter_all: 'Todos',
            from_label: 'A partir de',
            see_details: 'Ver detalhes',
            cat_uv: 'Impress�o UV',
            cat_3d: 'Impress�o 3D',
            cat_laser: 'Corte a Laser',
            cat_engrave: 'Grava��o a Laser',
            cat_photo: 'Fotografia',
            products_count_one: 'produto dispon�vel',
            products_count_many: 'produtos dispon�veis',
            modal_variants: 'Variantes dispon�veis',
            modal_features: 'Caracter�sticas',
            modal_price_title: 'Tabela de Pre�os',
            modal_flat: '=� Plano',
            modal_relief: '<� Relevo at� 1mm',
            modal_variant_col: 'Variante / Tamanho',
            legend_flat: 'Impress�o plana  design 2D padr�o',
            legend_relief: 'Relevo at� 1mm  textura t�til 3D',
            cta_quote: 'Solicitar or�amento',
            badge_hot: '=% Popular',
            badge_new: '( Novo',
            badge_promo: '<� Promo',
            no_image: 'Pr�via em breve',
            no_image_short: 'Sem imagem',
                        //    Filter keys   
            filter_all: 'Todos',
            filter_gift: '<� Presentes',
            filter_business: '=� Empresarial',
            filter_popular: '=% Popular',
            filter_new: '( Novo',
            filter_budget: '=� Econ�mico',
            filter_premium: '=� Premium',
            filter_decor: '=� Decora��o',
            filter_drinkware: ' Bebidas',
            footer_trademark: 'Filamorfosis� � uma marca registrada.'
        },
        ja: {
            nav_home: '���',
            nav_services: '��ӹ',
            nav_equipment: '-�',
            nav_clients: '�餢��',
            nav_contact: 'JOD�[',
            hero_title: 'Bj_n��ǢBj_n��',
            hero_subtitle: 'Bj_n�ϛ�wS�j�ָ���k	�W~Y���Thk',
            hero_cta: '�M����<',
            hero_cta_secondary: '��ӹ���',
            services_title: '�����ɵ�ӹ',
            services_subtitle: 'YPk���ޤ�gM�F�  ~_oBj_`Qny%j�n� �k\�~W�F',
            service_3d_title: '3D����',
            service_3d_desc: '������������������g��Ǣk}�9M�~Y��ȿ��K���k_�Y�_���~g',
            service_3d_feat1: '1dn��k '5r',
            service_3d_feat2: '��g7�j P',
            service_3d_feat3: '�����뾦',
            service_3d_examples_title: 'UL\�~YK',
            service_3d_ex1: '<� գ��hJ�a�',
            service_3d_ex2: '<� ���ǳ�����',
            service_3d_ex3: '=' ����',
            service_3d_ex4: '=� �ï������',
            service_3d_ex5: '<� ����餺U�_���',
            service_uv_title: 'UV����',
            service_uv_desc: '{|Yyfnhbk��KgwaY�rg���ޤ�ް�����(P�^��ji',
            service_uv_feat1: '�Rbn�ָ���kp7',
            service_uv_feat2: 'rB[jDr',
            service_uv_feat3: '4'��ë�',
            service_uv_examples_title: 'U����ޤ�gM~YK',
            service_uv_ex1: ' ް���h������',
            service_uv_ex2: '<� UV DTF��ë�',
            service_uv_ex3: '>� ����ް���',
            service_uv_ex4: '>� (�����',
            service_uv_ex5: '<� ���ָ���',
            service_laser_title: '�������',
            service_laser_desc: 'ф��g���hk;������餺U�_���jik i',
            service_laser_feat1: '����gc�j���',
            service_laser_feat2: '�X��jD{is0jk;',
            service_laser_feat3: '(P����iji',
            service_laser_examples_title: 'UL\�~YK',
            service_laser_ex1: '>� (�',
            service_laser_ex2: '=\ i�������',
            service_laser_ex3: '=� ������',
            service_laser_ex4: '<� Ӹ͹�����',
            service_laser_ex5: '<� k;U�_���',
            service_engrave_title: '����k;',
            service_engrave_desc: '(P�^��ijixnؾ�����k;i�jhb����g����餺',
            service_engrave_feat1: '��ٯ����',
            service_engrave_feat2: '8E�  �HjD',
            service_engrave_feat3: '(P�^��i�',
            service_engrave_examples_title: 'U�k;gM~YK',
            service_engrave_ex1: '<� ����餺���',
            service_engrave_ex2: '<� ��գ�h����',
            service_engrave_ex3: '= ������',
            service_engrave_ex4: '<~ ���h��',
            service_engrave_ex5: '=� �����',
            service_scan_title: '3D����',
            service_scan_desc: 'i�j�ָ��ȒǸ��3D���k	�W~Y���n�������D�nǸ��k igY',
            service_scan_feat1: '����K��w~g������',
            service_scan_feat2: '��j���hƯ���֗',
            service_scan_feat3: '3Dp7��ա��g
�',
            service_scan_examples_title: 'U�����gM~YK',
            service_scan_ex1: '<� գ��hk;',
            service_scan_ex2: '=) ���h�ڢ���',
            service_scan_ex3: '=d й�h������',
            service_scan_ex4: '<� �W_D�ָ���',
            service_scan_ex5: '=� �!���',
            equip_card6_title: '3D����',
            equip_card6_desc: 'ؾ�gi�j�ָ��ȒǸ��W~YUj����K��w��!~g�����Mg��',
            equip_card6_feat1: '5cmniK�'��w~g��',
            equip_card6_feat2: '48MPg���hƯ���֗',
            equip_card6_feat3: '3Dp7��ա��g
�',
            service_photo_title: '�����',
            service_photo_desc: 'Bj_nD�o �n��k$W~Yy%j���cSkU�Y���է÷�������',
            service_photo_feat1: '��է÷�����',
            service_photo_feat2: '��ߢ�',
            service_photo_feat3: 'Yyfn���',
            service_photo_examples_title: 'U�p7W~YK',
            service_photo_ex1: '=� �ϙ',
            service_photo_ex2: '=� ��u;',
            service_photo_ex3: '=� ��������',
            service_photo_ex4: '=� �������Ǚ',
            service_photo_ex5: '<� ���hݹ��',
            equipment_title: 'UL\�~YK',
            equipment_subtitle: 'UjJ�a�K�'MOf7D��~g',
            equip_card1_title: '��3D����',
            equip_card1_desc: '����j���ï�ָ��Ȓ\W~Y��ȿ��գ��������k i',
            equip_card1_feat1: '��� '25cm x 25cm x 25cm',
            equip_card1_feat2: '1dn��k '4r',
            equip_card1_feat3: ' PPLAPETG��jTPU',
            equip_card2_title: '��ѯ�3D����',
            equip_card2_desc: '�J�s-�n�ָ���k i�gYK������k i',
            equip_card2_feat1: '��� '18cm x 18cm x 18cm',
            equip_card2_feat2: '��������',
            equip_card2_feat3: ' PPLAPETGTPU',
            equip_card3_title: ''�g7�j3D����',
            equip_card3_desc: ''�gE'nB�������(1dn��k '5dnpj� P�(gM~Y',
            equip_card3_feat1: '��� '36cm x 36cm x 36cm',
            equip_card3_feat2: ' '5r/ P',
            equip_card3_feat3: ' PPLAPETGABSPA+CF',
            equip_card4_title: '����UV����',
            equip_card4_desc: '{|Yyfn�nk����Ƕ��p7ް�����(P�^�����ïUV DTF��ë��\W~Y',
            equip_card4_feat1: '�Rbn�ָ���kp7�����	',
            equip_card4_feat2: 'E'nB�UV DTF��ë�',
            equip_card4_feat3: 'ް�������ji',
            equip_card5_title: '�������hk;',
            equip_card5_desc: '(P����i����jikǶ����Wfk;W~Y���k i',
            equip_card5_feat1: '��40cm x 40cm',
            equip_card5_feat2: '2cm�n(P����',
            equip_card5_feat3: '�s0jk;',
            materials_title: '(Y� P',
            materials_subtitle: ' P���ïWfs0���',
            materials_toggle: 'Sa����ïWf(Y�գ����h P�YyfT�O`UD',
            mat_ideal_for: ' ij(',
            mat_more_info: '=� �Ss0���',
            mat_learn_more: '( sWO��',
            mat_badge_eco: '��',
            mat_badge_tough: '7m',
            mat_badge_flex: '��ï�',
            mat_badge_heat: '�',
            mat_badge_pro: '��',
            eco_headline: '��kMnW_p7',
            eco_desc: ';� PnPLAo
i1egȦ��������Ȧ��K�\��fD~Y�'LB��en���ï�����k�UWDx��gY',
            modal_properties: '���ƣ',
            modal_advantages: ')�',
            modal_applications: '�������',
            modal_examples: '(�',
            modal_tech_btn: '=�  Pn�Ss0oSa�',
            tech_specifications: '�S��',
            tech_mechanical: '_��y'',
            tech_thermal: '�y'',
            tech_physical: 'i�y'',
            tech_durability: 'E'h'',
            tech_recommendations: '(�h�',
            material_pla: ' � ,�D�YOOnrLB�~Y�����ȿ��k i',
            material_pla_uses: ' i(գ��J�a�����ȿ�����ʤ��',
            material_petg: 'PLA��7O��4';Ak(U���ָ���k i',
            material_petg_uses: ' i(����h_���K�ָ���',
            material_tpu: '��n�Fk����q���ԉKDJ�a��L���k i',
            material_tpu_uses: ' i(�q��������������jJ�a�',
            material_abs: '^8k�'LEGOhX P_���k i',
            material_abs_uses: ' i(����������w���',
            material_pacf: ' �7�����ա���e��7�j��LŁj4k',
            material_pacf_uses: ' i(����#m���ww�/',
            use_cases_title: '�_aL\��nn�',
            use_case_1_title: 'J�a�hգ��',
            use_case_1_desc: '�Ǫ����鯿��쯿��գ������J�a�',
            use_case_2_title: '���ǳ�����',
            use_case_2_desc: '����������ʤ�����൤�����',
            use_case_3_title: '����餺U�_���',
            use_case_3_desc: '
Me�ް���������k;����������գ�',
            use_case_4_title: '����',
            use_case_4_desc: '���������_���',
            use_case_5_title: '�ï������',
            use_case_5_desc: '�q�������ȹ���������ʤ��',
            use_case_6_title: 'Ӹ͹h�գ�',
            use_case_6_desc: '
:�������๿����ǣ���',
            use_case_7_title: 'UV DTF��ë�',
            use_case_7_desc: '4'ǫ������������(��ë�',
            use_case_8_title: '���h�����',
            use_case_8_desc: '���������Ƕ��e�����e�ް���',
            use_case_9_title: 'ް���h����',
            use_case_9_desc: '�5�ް���ID���������',
            gallery_title: '�����Ȯ����',
            gallery_subtitle: '�_aL\W_�nn�',
            gallery_filter_all: 'Yyf',
            gallery_filter_3d: '3D����',
            gallery_filter_laser: '�������',
            gallery_filter_engrave: '����k;',
            gallery_filter_scan: '3D����',
            gallery_filter_uv: 'UV����',
            gallery_3d_1_caption: '��鯿��쯿��գ��������PLAn_����ȿ��',
            gallery_3d_2: '_���',
            gallery_3d_2_caption: 'PETGhABSn�����w_���',
            gallery_3d_3: '��',
            gallery_3d_3_caption: '����������ʤ���������ָ���',
            gallery_laser_1: '(Pk;',
            gallery_laser_1_caption: '��������)6(n��',
            gallery_laser_2: 'ik;',
            gallery_laser_2_caption: '��������������i�������',
            gallery_laser_3: '������',
            gallery_laser_3_caption: 'g�Mǣ�����������',
            gallery_uv_1: 'ް���h��',
            gallery_uv_1_caption: '�����UV����n��������ް������',
            gallery_uv_2: 'UV DTF��ë�',
            gallery_uv_2_caption: '�������jin4'ǫ��',
            gallery_uv_3: 'ް���h����',
            gallery_uv_3_caption: '����ް���ID����UV�����',
            gallery_note: '=� ������n��ǢLB�~YK����餺U�_�M��kdDfJOD�[O`UD',
            gallery_cta_btn: '�M����<',
            clients_title: '�餢��',
            clients_subtitle: '�_a��<Y�m',
            wa_subtitle: '8p�k��W~Y',
            wa_greeting: 'Bj_n��Ǣ���kY���ogMfD~YK=�',
            wa_placeholder: '�û���e�WfO`UD...',
            wa_btn: '���Ȓ�� �',
            btl_eyebrow: '��ǢK���x',
            btl_title: 'Bj_n����L��kj�',
            btl_subtitle: 'Ƕ���gB�ŁoB�~[��Q��n��gM��n�gM��n  �_aL��W~Y',
            btl_before_label: 'Bj_n��Ǣ',
            btl_before_title: '����K�ˁ�',
            btl_before_desc: 'nu����  i�j�z�g�'+gY',
            btl_step1: '3DǶ��', btl_step2: 'p7', btl_step3: '�
R',
            btl_after_label: '�i',
            btl_after_title: '��kj�',
            btl_after_desc: '��gE'nB�i�j�ָ���  (�i��k��',
            btl_feat1: '3DǶ��n�X
�',
            btl_feat2: 'Yyfn����g����',
            btl_feat3: '�j
�',
            btl_feat4: '1K��#~g',
            btl_cta: '��Ǣ�YHfO`UD �',
            moq_single: ' �p',
            moq_headline: ' �jW6PjW',
            moq_sub: '1`QŁ\�~Y500�a��Bj_Lz�~Y',
            moq_bulk: ''�#��',            contact_title: 'JOD�[',
            contact_subtitle: 'Bj_n������kdDfYHfO`UD',
            form_name: '
M',
            form_email: '���',
            form_phone: '�q',
            form_service: 'snB���ӹ',
            form_select: '��ӹ�x�',
            form_opt_3d: '3D����',
            form_opt_uv: 'UV����',
            form_opt_laser: '�������',
            form_opt_engrave: '����k;',
            form_opt_photo: '�����',
            form_opt_other: ']n�',
            form_message: '�û��',
            form_submit: '�û����',
            form_success: '�û��Lc8k�U�~W_YPkT#aD_W~Y',
            form_error: '�û��n�-k���LzW~W_�F �JfWO`UD',
            contact_email_label: '���',
            contact_phone_label: '�q',
            contact_hours_label: '�mB�',
            contact_hours: ' - �9:00 - 18:00',
            footer_rights: 'hW\)@	',
            cert_mexico: '᭷�� ',
            cert_materials: '�� P(',
            cert_quality: '���<',
            
            //    Catalog keys   
            nav_catalog: '=� ����',
            hero_badge: 'l���� 2025',
            hero_title_1: '��',
            hero_title_2: '�YP���',
            hero_subtitle: '���x�g�}k���ޤ�WfJQf��JF�jhXX�d~�jD  Bj_`Qn/ !�n�����',
            stat_products: '��',
            stat_min: ' �p',
            stat_response: '�T',
            empty_text: '��L�dK�~[�',
            footer_note_cat: '�<oMXN�JjO	�U��4LB�~Y B�M��o��k��~Y',
            search_placeholder: '���"...',
            filter_all: 'Yyf',
            from_label: 'K�',
            see_details: 's0���',
            cat_uv: 'UVp7',
            cat_3d: '3Dp7',
            cat_laser: '�������',
            cat_engrave: '����k;',
            cat_photo: '�p7',
            products_count_one: '��B�',
            products_count_many: '��B�',
            modal_variants: ')(��j����',
            modal_features: 'y�',
            modal_price_title: '�<h',
            modal_flat: '=� ����',
            modal_relief: '<� ���� '1mm',
            modal_variant_col: '���� / ���',
            legend_flat: '����p7  �2DǶ��',
            legend_relief: '���� '1mm  暄3DƯ���',
            cta_quote: '�YP�M��',
            badge_hot: '=% �',
            badge_new: '( �@',
            badge_promo: '<� ���',
            no_image: '�������l�',
            no_image_short: ';�jW',
                        //    Filter keys   
            filter_all: 'Yyf',
            filter_gift: '<� ���',
            filter_business: '=� Ӹ͹',
            filter_popular: '=% �',
            filter_new: '( �@',
            filter_budget: '=� JK',
            filter_premium: '=� ��ߢ�',
            filter_decor: '=� ǳ�����',
            filter_drinkware: ' ��󯦧�',
            footer_trademark: 'Filamorfosis�o{2FgY'
        },
        zh: {
            nav_home: '�u',
            nav_services: '
�',
            nav_equipment: '�',
            nav_clients: '�7',
            nav_contact: 'T��',
            hero_title: '������',
            hero_subtitle: '����a�l:	biS B B0��',
            hero_cta: '�B��',
            hero_cta_secondary: '�
�',
            services_title: '�6
�',
            services_subtitle: 's�*'����  � wS ^�`�� ��K\',
            service_3d_title: '3DSp',
            service_3d_desc: '�rP�Sp���))�Ο�0c�(�����',
            service_3d_feat1: 'U� 5͜r',
            service_3d_feat2: '�'��:�P�',
            service_3d_feat3: '�s���',
            service_3d_examples_title: '�� �H',
            service_3d_ex1: '<� K���w',
            service_3d_ex2: '<� �E�p',
            service_3d_ex3: '=' �b��',
            service_3d_ex4: '=� рM�',
            service_3d_ex5: '<� *'<�',
            service_uv_title: 'UVSp',
            service_uv_desc: '(�sE�ri*'�N�UhblKo��o(P�^��I',
            service_uv_feat1: '�(�biS
Sp',
            service_uv_feat2: '8
*r��r',
            service_uv_feat3: '244�',
            service_uv_examples_title: '��*'�H',
            service_uv_ex1: ' lKo��)o',
            service_uv_ex2: '<� UV DTF4�',
            service_uv_ex3: '>� �6��',
            service_uv_ex4: '>� ((L>',
            service_uv_ex5: '<� �p�',
            service_laser_title: '�Ir',
            service_laser_desc: '��K/,���r��;^8L�p*'<�I',
            service_laser_feat1: 'r��n�r',
            service_laser_feat2: '����Ƃ�;',
            service_laser_feat3: '(P�K��iI',
            service_laser_examples_title: '��Z�H',
            service_laser_ex1: '>� ((L',
            service_laser_ex2: '=\ �iM�',
            service_laser_ex3: '=� �K���',
            service_laser_ex4: '<� F�',
            service_laser_ex5: '<� �;<�',
            service_engrave_title: '�I�;',
            service_engrave_desc: '((P�^���iIP�
�Lؾ��I�;(gG�Ƃ*'�Uhb',
            service_engrave_feat1: 'gG���Ƃ',
            service_engrave_feat2: '8E'  
�1',
            service_engrave_feat3: '(P�^���i�P',
            service_engrave_examples_title: '���;�H',
            service_engrave_ex1: '<� *'<�',
            service_engrave_ex2: '<� Vo�VL',
            service_engrave_ex3: '= �c�M�',
            service_engrave_ex4: '<~ �P�oP',
            service_engrave_ex5: '=� 5P��',
            service_scan_title: '3Dk�',
            service_scan_desc: '�il:pW3D!�
6��6\*'<��5i�pW�X',
            service_scan_feat1: '�k����0�w�{i�',
            service_scan_feat2: 'UI��r��',
            service_scan_feat3: '�����3DSp��',
            service_scan_examples_title: '��k��H',
            service_scan_ex1: '<� K���Q',
            service_scan_ex2: '=) ����',
            service_scan_ex3: '=d J�ό��',
            service_scan_ex4: '<�  �
6�i�',
            service_scan_ex5: '=� f����',
            equip_card6_title: '3Dk�',
            equip_card6_desc: 'ؾ�pW�U�i����0�w�f�+��r',
            equip_card6_feat1: '�k�5cmi��'��w',
            equip_card6_feat2: '48MPUI�r��',
            equip_card6_feat3: '�����3DSp���',
            service_photo_title: 'gGSp',
            service_photo_desc: '����<� }��(Sp���y��;�0�	�H�',
            service_photo_feat1: '�(',
            service_photo_feat2: '(� ',
            service_photo_feat3: '@	:�',
            service_photo_examples_title: '�Sp�H',
            service_photo_ex1: '=� ��gG',
            service_photo_ex2: '=� �p;',
            service_photo_ex3: '=� �6�',
            service_photo_ex4: '=� � P�',
            service_photo_ex5: '<� z/�w�',
            equipment_title: '�� �H',
            equipment_subtitle: '��w0'�Z���',
            equip_card1_title: '��3DSp',
            equip_card1_desc: '� irQ�iS^8��K���6��',
            equip_card1_feat1: ':� '25cm x 25cm x 25cm',
            equip_card1_feat2: 'U� 4͜r',
            equip_card1_feat3: 'P�PLAPETG�'TPU',
            equip_card2_title: ''ы3DSp',
            equip_card2_desc: '��-�iS��Y^8�p�<�',
            equip_card2_feat1: ':� '18cm x 18cm x 18cm',
            equip_card2_feat2: '/r',
            equip_card2_feat3: 'P�PLAPETGTPU',
            equip_card3_title: ''��:�3DSp',
            equip_card3_desc: ''�(y�U��( 5�
P�',
            equip_card3_feat1: ':� '36cm x 36cm x 36cm',
            equip_card3_feat2: ' 5͜r/P�',
            equip_card3_feat3: 'P�PLAPETGABSPA+CF',
            equip_card4_title: '��UVSp',
            equip_card4_desc: '(�N�U
Sphi��lKo��o(P�^��Q��_6\UV DTF4�',
            equip_card4_feat1: '�(�biS
Sp��o�P	',
            equip_card4_feat2: '(UV DTF4�',
            equip_card4_feat3: '��L>I',
            equip_card5_title: '�Ir�;',
            equip_card5_desc: '((P�K��i�I
r��;��^8L��p',
            equip_card5_feat1: '�\:�40cm x 40cm',
            equip_card5_feat2: '�r2cm�(P',
            equip_card5_feat3: '����;',
            materials_title: '�(�P�',
            materials_subtitle: '����P������',
            materials_toggle: '��d���(�@	P�P�',
            mat_ideal_for: '(�',
            mat_more_info: '=� ��/��',
            mat_learn_more: '( ���',
            mat_badge_eco: '��',
            mat_badge_tough: 'Z�',
            mat_badge_flex: '9'',
            mat_badge_heat: '�',
            mat_badge_pro: '',
            eco_headline: '���Sp',
            eco_desc: '�;�P�PLA/
i��1�s���6��iM�/ �Q���݄���',
            modal_properties: 'y'',
            modal_advantages: '�',
            modal_applications: '�(',
            modal_examples: '(:�',
            modal_tech_btn: '=� ���P��/��',
            tech_specifications: '�/�<',
            tech_mechanical: ':�'�',
            tech_thermal: '�'�',
            tech_physical: 'i'�',
            tech_durability: 'E'�'',
            tech_recommendations: '(��',
            material_pla: ' 8��P��(�r0�^8�p���',
            material_pla_uses: ' K��w�p��6��',
            material_petg: '�PLA�:�u;24�A(�i�',
            material_petg_uses: ' �P�h:���7i�',
            material_tpu: '�a� 7����^8K:�o�w�/���',
            material_tpu_uses: ' K:�h&p��'�w',
            material_abs: '�'�:P��(��P�:���',
            material_abs_uses: ' }f����w���',
            material_pacf: ' :�P�+���(� ��::����',
            material_pacf_uses: ' �:����w�/�',
            use_cases_title: '� �:�',
            use_case_1_title: '�w�K�',
            use_case_1_desc: '5P8�r6�K��6�w',
            use_case_2_title: '�E�p',
            use_case_2_desc: '��ow6���6L�F',
            use_case_3_title: '*'<�',
            use_case_3_desc: 'p
W�lKo�c�;L>�6Vo',
            use_case_4_title: '�b��',
            use_case_4_desc: '�5��}f��:���',
            use_case_5_title: 'рM�',
            use_case_5_desc: 'K:�s/��h',
            use_case_6_title: 'F��l',
            use_case_6_desc: 'L
G9�6p���U:�',
            use_case_7_title: 'UV DTF4�',
            use_case_7_desc: '244�(��,5}f�P',
            use_case_8_title: 'oP��)o',
            use_case_8_desc: '�6�)o&����PpgG�lKo',
            use_case_9_title: '���L>',
            use_case_9_desc: '�������L�',
            gallery_title: 'y�;�',
            gallery_subtitle: '�\� �:�',
            gallery_filter_all: 'h�',
            gallery_filter_3d: '3DSp',
            gallery_filter_laser: '�Ir',
            gallery_filter_engrave: '�I�;',
            gallery_filter_scan: '3Dk�',
            gallery_filter_uv: 'UVSp',
            gallery_3d_1_caption: 'rPLA6\��r6�K������',
            gallery_3d_2: '����',
            gallery_3d_2_caption: 'PETG�ABS6\���w�:���',
            gallery_3d_3: '�p�',
            gallery_3d_3_caption: '��ow6�Ҍ�6�p�',
            gallery_laser_1: '(P�;',
            gallery_laser_1_caption: ')6(P6\�L�6L>��p�',
            gallery_laser_2: '�i�;',
            gallery_laser_2_caption: '�6�i�p&�c�M�',
            gallery_laser_3: '�K�r',
            gallery_laser_3_caption: '�ILU:���p�K���',
            gallery_uv_1: 'lKo���o',
            gallery_uv_1_caption: '�lUVSp��6�)olKo��P',
            gallery_uv_2: 'UV DTF4�',
            gallery_uv_2_caption: '(��,5}fI�244�',
            gallery_uv_3: '���L>',
            gallery_uv_3_caption: '�6�����L�UV�',
            gallery_note: '=� 	y���T���*'��',
            gallery_cta_btn: '�B��',
            clients_title: '섢7',
            clients_subtitle: '���',
            wa_subtitle: '8(����
',
            wa_greeting: '��}�����:���=�',
            wa_placeholder: '(d�e���o...',
            wa_btn: ' �J) �',
            btl_eyebrow: '�0��',
            btl_title: '��I���i�',
            btl_subtitle: '�
 �/����;�e�a�e���e  �e��',
            btl_before_label: '��',
            btl_before_title: '�I� �',
            btl_before_desc: '�
�;�gG�W��  �Uw����',
            btl_step1: '3D��', btl_step2: 'Sp', btl_step3: '',
            btl_after_label: '�i�',
            btl_after_title: '���',
            btl_after_desc: '�n(��i  ��(< .',
            btl_feat1: '� 3D����',
            btl_feat2: 'h:�Л�',
            btl_feat3: '��'',
            btl_feat4: '�1�0y��',
            btl_cta: 'J�쨄�� �',
            moq_single: ' wp',
            moq_headline: '� Nw����',
            moq_sub: '� � ��eZ �500�_�����p�',
            moq_bulk: '�!�',
            contact_title: 'T��',
            contact_subtitle: 'J�쨄y��=��
�',
            form_name: '�
',
            form_email: '��',
            form_phone: '5�',
            form_service: 't��
�',
            form_select: '	�
�',
            form_opt_3d: '3DSp',
            form_opt_uv: 'UVSp',
            form_opt_laser: '�Ir',
            form_opt_engrave: '�I�;',
            form_opt_photo: 'gGSp',
            form_opt_other: 'v�',
            form_message: 'Y ',
            form_submit: '��o',
            form_success: '�o���=�T��',
            form_error: '��o�����',
            contact_email_label: '��',
            contact_phone_label: '5�',
            contact_hours_label: '%��',
            contact_hours: 'h  - h�9:00 - 18:00',
            footer_rights: 'HC@	',
            cert_mexico: '��6 ',
            cert_materials: '��P�',
            cert_quality: '�(��',
            
            //    Catalog keys   
            nav_catalog: '=� �U',
            hero_badge: '���U 2025',
            hero_title_1: '��',
            hero_title_2: '�s�-',
            hero_subtitle: '	��	`���6'
�� ���*'��  �:�'A�e
/`��<',
            stat_products: '��',
            stat_min: ' �p',
            stat_response: '͔',
            empty_text: '*~0��',
            footer_note_cat: '�<�MXN��	��U
�L� ȥ�9n�<�',
            search_placeholder: '"��...',
            filter_all: 'h�',
            from_label: 'w�',
            see_details: '���',
            cat_uv: 'UVp7',
            cat_3d: '3DSp',
            cat_laser: '�Ir',
            cat_engrave: '�I�;',
            cat_photo: 'gGSp',
            products_count_one: '*���(',
            products_count_many: '*���(',
            modal_variants: '�(�S',
            modal_features: 'y�',
            modal_price_title: '�<h',
            modal_flat: '=� sb',
            modal_relief: '<� n� �1mm',
            modal_variant_col: '�S / :�',
            legend_flat: 'sbp7  �2D��',
            legend_relief: 'n� �1mm  �3D�',
            cta_quote: '�s��',
            badge_hot: '=% ��',
            badge_new: '( ��',
            badge_promo: '<� � ',
            no_image: '��s��',
            no_image_short: '��G',
                        //    Filter keys   
            filter_all: 'h�',
            filter_gift: '<� <�',
            filter_business: '=� F�',
            filter_popular: '=% ��',
            filter_new: '( ��',
            filter_budget: '=� ��',
            filter_premium: '=� ��',
            filter_decor: '=� �p',
            filter_drinkware: ' n�',
            footer_trademark: 'Filamorfosis�/�F'
        }
    };

    window.translations = translations; // expose for SPA catalog
    let currentLang = 'es';
    window.currentLang = currentLang; // expose for SPA catalog
    
    // Language flag mapping
    const langFlags = {
        es: '<�<�',
        en: '<�<�',
        de: '<�<�',
        pt: '<�<�',
        ja: '<�<�',
        zh: '<�<�'
    };
    
    const langCodes = {
        es: 'ES',
        en: 'EN',
        de: 'DE',
        pt: 'PT',
        ja: '�,�',
        zh: '-�'
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
                    sidebarCta.textContent = tl['wa_btn'] || 'Cont�ctanos �';
                } else {
                    sidebarCta.textContent = tl['service.viewProducts'] || 'Ver productos �';
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

        //    Sync catalog language   
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

    //    Hero video crossfade loop                                              
    // Two videos crossfade over 1s near the end so the loop is seamless
    (function() {
        const FADE_BEFORE_END = 0.6; // seconds before end to start crossfade
        const FADE_DURATION   = 500; // ms  must match CSS transition

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
            icon: '<�',
            name: 'PLA',
            fullName: {
                es: '�cido Polil�ctico',
                en: 'Polylactic Acid',
                ja: '��sx'
            },
            technical: {
                mechanical: {
                    es: [
                        { label: 'Resistencia a la Tracci�n', value: '50-70 MPa' },
                        { label: 'Resistencia a la Flexi�n', value: '80-100 MPa' },
                        { label: 'Resistencia al Impacto', value: '2-5 kJ/m�' },
                        { label: 'Elongaci�n al Romper', value: '3-10%' }
                    ],
                    en: [
                        { label: 'Tensile Strength', value: '50-70 MPa' },
                        { label: 'Flexural Strength', value: '80-100 MPa' },
                        { label: 'Impact Resistance', value: '2-5 kJ/m�' },
                        { label: 'Elongation at Break', value: '3-10%' }
                    ],
                    ja: [
                        { label: '57�', value: '50-70 MPa' },
                        { label: '�R7�', value: '80-100 MPa' },
                        { label: ']���', value: '2-5 kJ/m�' },
                        { label: '4�8s', value: '3-10%' }
                    ]
                },
                thermal: {
                    es: [
                        { label: 'Temperatura de Transici�n V�trea', value: '55-65�C' },
                        { label: 'Temperatura de Deflexi�n', value: '50-55�C' },
                        { label: 'Punto de Fusi�n', value: '150-160�C' },
                        { label: 'Temperatura M�xima de Servicio', value: '50�C' }
                    ],
                    en: [
                        { label: 'Glass Transition Temperature', value: '55-65�C' },
                        { label: 'Heat Deflection Temperature', value: '50-55�C' },
                        { label: 'Melting Point', value: '150-160�C' },
                        { label: 'Max Service Temperature', value: '50�C' }
                    ],
                    ja: [
                        { label: '����)�', value: '55-65�C' },
                        { label: '�	b)�', value: '50-55�C' },
                        { label: '��', value: '150-160�C' },
                        { label: ' '()�', value: '50�C' }
                    ]
                },
                physical: {
                    es: [
                        { label: 'Densidad', value: '1.24 g/cm�' },
                        { label: 'Dureza Shore D', value: '75-85' },
                        { label: 'Absorci�n de Agua', value: '0.5% (24h)' },
                        { label: 'Contracci�n', value: '0.3-0.5%' }
                    ],
                    en: [
                        { label: 'Density', value: '1.24 g/cm�' },
                        { label: 'Shore D Hardness', value: '75-85' },
                        { label: 'Water Absorption', value: '0.5% (24h)' },
                        { label: 'Shrinkage Rate', value: '0.3-0.5%' }
                    ],
                    ja: [
                        { label: 'Ʀ', value: '1.24 g/cm�' },
                        { label: '��Dl�', value: '75-85' },
                        { label: '84�', value: '0.5% (24B�)' },
                        { label: '�.�', value: '0.3-0.5%' }
                    ]
                },
                durability: {
                    es: [
                        { label: 'Resistencia UV', value: 'Baja - se degrada con luz solar directa' },
                        { label: 'Resistencia Qu�mica', value: 'Buena a �cidos d�biles y alcoholes' },
                        { label: 'Resistencia a la Intemperie', value: 'Baja - solo para interiores' },
                        { label: 'Vida �til Estimada', value: '2-5 a�os en interiores' }
                    ],
                    en: [
                        { label: 'UV Resistance', value: 'Low - degrades with direct sunlight' },
                        { label: 'Chemical Resistance', value: 'Good to weak acids and alcohols' },
                        { label: 'Weatherability', value: 'Low - indoor use only' },
                        { label: 'Estimated Lifespan', value: '2-5 years indoors' }
                    ],
                    ja: [
                        { label: 'UV'', value: 'N - ��Ig�' },
                        { label: '��'', value: '1xh����ko}' },
                        { label: ''', value: 'N - ��(n' },
                        { label: '���}', value: '��g2-5t' }
                    ]
                },
                recommendations: {
                    es: 'Mejor para objetos decorativos de interior, prototipos visuales y aplicaciones donde la est�tica es m�s importante que la resistencia mec�nica. No usar en exteriores o donde se expondr� a temperaturas superiores a 50�C. Ideal para figuras, organizadores y objetos que no requieren alta resistencia al impacto.',
                    en: 'Best for indoor decorative objects, visual prototypes and applications where aesthetics are more important than mechanical strength. Do not use outdoors or where exposed to temperatures above 50�C. Ideal for figures, organizers and objects that don\'t require high impact resistance.',
                    ja: '����������ȿ����L_��7���́j�������k iK�50�C�
n)�kU�U��4@go(WjDgO`UDգ�����ʤ���D]����ŁhWjD�ָ���k i'
                }
            },
            properties: {
                es: [
                    'Biodegradable y ecol�gico - hecho de recursos renovables',
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
                    '�'g��k*WD - ���ǐK�� ',
                    '��KjrnJ�j������',
                    'щKgI�nB��
L�',
                    '��`L�8(kAj7�',
                    '
�j�DjW'
                ]
            },
            advantages: {
                es: [
                    'Perfecto para decoraci�n y objetos de interior',
                    'Colores brillantes que no se desvanecen',
                    'Seguro para el hogar y ni�os',
                    'Excelente para detalles finos y precisos',
                    'Precio m�s econ�mico'
                ],
                en: [
                    'Perfect for decoration and indoor objects',
                    'Bright colors that don\'t fade',
                    'Safe for home and children',
                    'Excellent for fine and precise details',
                    'Most affordable option'
                ],
                ja: [
                    '��h���ָ���k i',
                    'rB[jD��Kjr',
                    '��hP�k�h',
                    '0KOc�jǣ���k*��',
                    ' �Kj�<'
                ]
            },
            applications: {
                es: 'Ideal para figuras decorativas, prototipos visuales, juguetes, organizadores de escritorio, modelos arquitect�nicos, y cualquier objeto decorativo que no est� expuesto a altas temperaturas o uso intensivo.',
                en: 'Ideal for decorative figures, visual prototypes, toys, desk organizers, architectural models, and any decorative object not exposed to high temperatures or heavy use.',
                ja: '��գ�������ȿ��J�a�ǹ����ʤ����!��)��WD(kU�U�jD���ָ���k i'
            },
            examples: {
                es: ['Figuras coleccionables', 'Macetas decorativas', 'Prototipos de dise�o', 'Juguetes educativos', 'Organizadores de escritorio'],
                en: ['Collectible figures', 'Decorative planters', 'Design prototypes', 'Educational toys', 'Desk organizers'],
                ja: ['�쯿��գ��', '������', 'Ƕ����ȿ��', 'Y��w', 'ǹ����ʤ��']
            }
        },
        petg: {
            icon: '=�',
            name: 'PETG',
            fullName: {
                es: 'Tereftalato de Polietileno Glicol',
                en: 'Polyethylene Terephthalate Glycol'
            },
            technical: {
                mechanical: {
                    es: [
                        { label: 'Resistencia a la Tracci�n', value: '50-55 MPa' },
                        { label: 'Resistencia a la Flexi�n', value: '70-80 MPa' },
                        { label: 'Resistencia al Impacto', value: '8-12 kJ/m�' },
                        { label: 'Elongaci�n al Romper', value: '100-150%' }
                    ],
                    en: [
                        { label: 'Tensile Strength', value: '50-55 MPa' },
                        { label: 'Flexural Strength', value: '70-80 MPa' },
                        { label: 'Impact Resistance', value: '8-12 kJ/m�' },
                        { label: 'Elongation at Break', value: '100-150%' }
                    ]
                },
                thermal: {
                    es: [
                        { label: 'Temperatura de Transici�n V�trea', value: '75-85�C' },
                        { label: 'Temperatura de Deflexi�n', value: '70-75�C' },
                        { label: 'Punto de Fusi�n', value: '230-250�C' },
                        { label: 'Temperatura M�xima de Servicio', value: '80�C' }
                    ],
                    en: [
                        { label: 'Glass Transition Temperature', value: '75-85�C' },
                        { label: 'Heat Deflection Temperature', value: '70-75�C' },
                        { label: 'Melting Point', value: '230-250�C' },
                        { label: 'Max Service Temperature', value: '80�C' }
                    ]
                },
                physical: {
                    es: [
                        { label: 'Densidad', value: '1.27 g/cm�' },
                        { label: 'Dureza Shore D', value: '80-85' },
                        { label: 'Absorci�n de Agua', value: '0.1% (24h)' },
                        { label: 'Contracci�n', value: '0.5-0.7%' }
                    ],
                    en: [
                        { label: 'Density', value: '1.27 g/cm�' },
                        { label: 'Shore D Hardness', value: '80-85' },
                        { label: 'Water Absorption', value: '0.1% (24h)' },
                        { label: 'Shrinkage Rate', value: '0.5-0.7%' }
                    ]
                },
                durability: {
                    es: [
                        { label: 'Resistencia UV', value: 'Media - puede usarse en exteriores con protecci�n' },
                        { label: 'Resistencia Qu�mica', value: 'Excelente a �cidos, bases y alcoholes' },
                        { label: 'Resistencia a la Intemperie', value: 'Buena - apto para exteriores' },
                        { label: 'Vida �til Estimada', value: '5-10 a�os en exteriores' }
                    ],
                    en: [
                        { label: 'UV Resistance', value: 'Medium - can be used outdoors with protection' },
                        { label: 'Chemical Resistance', value: 'Excellent to acids, bases and alcohols' },
                        { label: 'Weatherability', value: 'Good - suitable for outdoors' },
                        { label: 'Estimated Lifespan', value: '5-10 years outdoors' }
                    ]
                },
                recommendations: {
                    es: 'Excelente para aplicaciones funcionales que requieren durabilidad y resistencia al agua. Perfecto para contenedores de alimentos, piezas mec�nicas y objetos de exterior. Soporta temperaturas m�s altas que PLA y tiene mejor resistencia al impacto. Ideal cuando se necesita un balance entre resistencia, flexibilidad y durabilidad.',
                    en: 'Excellent for functional applications requiring durability and water resistance. Perfect for food containers, mechanical parts and outdoor objects. Withstands higher temperatures than PLA and has better impact resistance. Ideal when you need a balance between strength, flexibility and durability.'
                }
            },
            properties: {
                es: [
                    'Muy resistente a golpes y ca�das',
                    'Resistente al agua y humedad',
                    'Soporta temperaturas hasta 80�C',
                    'Flexible pero fuerte - no se rompe f�cilmente',
                    'Transparente o en colores s�lidos'
                ],
                en: [
                    'Highly resistant to impacts and drops',
                    'Water and moisture resistant',
                    'Withstands temperatures up to 80�C',
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
                    'Dura mucho m�s que PLA'
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
                es: 'Perfecto para contenedores, botellas, objetos que se usan frecuentemente, piezas mec�nicas funcionales, accesorios deportivos, y cualquier objeto que necesite resistir uso intensivo o condiciones exteriores.',
                en: 'Perfect for containers, bottles, frequently used objects, functional mechanical parts, sports accessories, and any object that needs to withstand heavy use or outdoor conditions.'
            },
            examples: {
                es: ['Botellas y contenedores', 'Piezas mec�nicas', 'Fundas protectoras', 'Herramientas de jard�n', 'Accesorios deportivos'],
                en: ['Bottles and containers', 'Mechanical parts', 'Protective cases', 'Garden tools', 'Sports accessories']
            }
        },
        tpu: {
            icon: '>8',
            name: 'TPU',
            fullName: {
                es: 'Poliuretano Termopl�stico',
                en: 'Thermoplastic Polyurethane'
            },
            technical: {
                mechanical: {
                    es: [
                        { label: 'Resistencia a la Tracci�n', value: '26-52 MPa' },
                        { label: 'Resistencia a la Flexi�n', value: '30-40 MPa' },
                        { label: 'Resistencia al Impacto', value: 'Sin rotura' },
                        { label: 'Elongaci�n al Romper', value: '450-600%' }
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
                        { label: 'Temperatura de Transici�n V�trea', value: '-30 a -50�C' },
                        { label: 'Temperatura de Deflexi�n', value: '60-80�C' },
                        { label: 'Punto de Fusi�n', value: '200-220�C' },
                        { label: 'Temperatura M�xima de Servicio', value: '80�C' }
                    ],
                    en: [
                        { label: 'Glass Transition Temperature', value: '-30 to -50�C' },
                        { label: 'Heat Deflection Temperature', value: '60-80�C' },
                        { label: 'Melting Point', value: '200-220�C' },
                        { label: 'Max Service Temperature', value: '80�C' }
                    ]
                },
                physical: {
                    es: [
                        { label: 'Densidad', value: '1.20 g/cm�' },
                        { label: 'Dureza Shore A', value: '85-95' },
                        { label: 'Absorci�n de Agua', value: '0.5-1.0% (24h)' },
                        { label: 'Contracci�n', value: '1.0-1.5%' }
                    ],
                    en: [
                        { label: 'Density', value: '1.20 g/cm�' },
                        { label: 'Shore A Hardness', value: '85-95' },
                        { label: 'Water Absorption', value: '0.5-1.0% (24h)' },
                        { label: 'Shrinkage Rate', value: '1.0-1.5%' }
                    ]
                },
                durability: {
                    es: [
                        { label: 'Resistencia UV', value: 'Buena - mantiene propiedades en exteriores' },
                        { label: 'Resistencia Qu�mica', value: 'Excelente a aceites, grasas y solventes' },
                        { label: 'Resistencia a la Intemperie', value: 'Excelente - ideal para exteriores' },
                        { label: 'Vida �til Estimada', value: '10+ a�os con uso normal' }
                    ],
                    en: [
                        { label: 'UV Resistance', value: 'Good - maintains properties outdoors' },
                        { label: 'Chemical Resistance', value: 'Excellent to oils, greases and solvents' },
                        { label: 'Weatherability', value: 'Excellent - ideal for outdoors' },
                        { label: 'Estimated Lifespan', value: '10+ years with normal use' }
                    ]
                },
                recommendations: {
                    es: 'Ideal para aplicaciones que requieren flexibilidad extrema y absorci�n de impactos. Perfecto para fundas protectoras, sellos, correas y cualquier pieza que necesite doblarse repetidamente. Excelente resistencia a la abrasi�n y al desgarro. No recomendado para piezas r�gidas o estructurales.',
                    en: 'Ideal for applications requiring extreme flexibility and shock absorption. Perfect for protective cases, seals, straps and any part that needs to bend repeatedly. Excellent abrasion and tear resistance. Not recommended for rigid or structural parts.'
                }
            },
            properties: {
                es: [
                    'S�per flexible - se dobla sin romperse',
                    'Textura suave tipo goma',
                    'Absorbe golpes y protege dispositivos',
                    'Resistente al desgaste por fricci�n',
                    'Mantiene su forma despu�s de estirarse'
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
                    'Protecci�n superior para dispositivos electr�nicos',
                    'Agarre antideslizante',
                    'C�modo al tacto',
                    'Resistente a aceites y productos qu�micos',
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
                es: 'Ideal para fundas de tel�fono y tablet, correas de reloj, sellos personalizados, juguetes flexibles, calzado personalizado, y cualquier aplicaci�n que requiera flexibilidad, amortiguaci�n o agarre.',
                en: 'Ideal for phone and tablet cases, watch straps, custom seals, flexible toys, custom footwear, and any application requiring flexibility, cushioning or grip.'
            },
            examples: {
                es: ['Fundas de tel�fono', 'Correas de reloj', 'Sellos personalizados', 'Juguetes blandos', 'Amortiguadores'],
                en: ['Phone cases', 'Watch straps', 'Custom seals', 'Soft toys', 'Shock absorbers']
            }
        },
        abs: {
            icon: '=%',
            name: 'ABS',
            fullName: {
                es: 'Acrilonitrilo Butadieno Estireno',
                en: 'Acrylonitrile Butadiene Styrene'
            },
            technical: {
                mechanical: {
                    es: [
                        { label: 'Resistencia a la Tracci�n', value: '40-50 MPa' },
                        { label: 'Resistencia a la Flexi�n', value: '70-90 MPa' },
                        { label: 'Resistencia al Impacto', value: '15-25 kJ/m�' },
                        { label: 'Elongaci�n al Romper', value: '3-20%' }
                    ],
                    en: [
                        { label: 'Tensile Strength', value: '40-50 MPa' },
                        { label: 'Flexural Strength', value: '70-90 MPa' },
                        { label: 'Impact Resistance', value: '15-25 kJ/m�' },
                        { label: 'Elongation at Break', value: '3-20%' }
                    ]
                },
                thermal: {
                    es: [
                        { label: 'Temperatura de Transici�n V�trea', value: '105�C' },
                        { label: 'Temperatura de Deflexi�n', value: '95-100�C' },
                        { label: 'Punto de Fusi�n', value: '200-240�C' },
                        { label: 'Temperatura M�xima de Servicio', value: '95�C' }
                    ],
                    en: [
                        { label: 'Glass Transition Temperature', value: '105�C' },
                        { label: 'Heat Deflection Temperature', value: '95-100�C' },
                        { label: 'Melting Point', value: '200-240�C' },
                        { label: 'Max Service Temperature', value: '95�C' }
                    ]
                },
                physical: {
                    es: [
                        { label: 'Densidad', value: '1.04 g/cm�' },
                        { label: 'Dureza Shore D', value: '75-80' },
                        { label: 'Absorci�n de Agua', value: '0.2-0.4% (24h)' },
                        { label: 'Contracci�n', value: '0.6-0.8%' }
                    ],
                    en: [
                        { label: 'Density', value: '1.04 g/cm�' },
                        { label: 'Shore D Hardness', value: '75-80' },
                        { label: 'Water Absorption', value: '0.2-0.4% (24h)' },
                        { label: 'Shrinkage Rate', value: '0.6-0.8%' }
                    ]
                },
                durability: {
                    es: [
                        { label: 'Resistencia UV', value: 'Baja - requiere protecci�n para exteriores' },
                        { label: 'Resistencia Qu�mica', value: 'Excelente a gasolina, aceites y grasas' },
                        { label: 'Resistencia a la Intemperie', value: 'Media - mejor con recubrimiento UV' },
                        { label: 'Vida �til Estimada', value: '10-20 a�os en interiores' }
                    ],
                    en: [
                        { label: 'UV Resistance', value: 'Low - requires protection for outdoors' },
                        { label: 'Chemical Resistance', value: 'Excellent to gasoline, oils and greases' },
                        { label: 'Weatherability', value: 'Medium - better with UV coating' },
                        { label: 'Estimated Lifespan', value: '10-20 years indoors' }
                    ]
                },
                recommendations: {
                    es: 'Perfecto para aplicaciones automotrices y mec�nicas que requieren alta resistencia al calor y al impacto. Excelente para carcasas de electr�nicos, herramientas y piezas funcionales. Resistente a combustibles y aceites. Ideal cuando se necesita durabilidad a largo plazo y resistencia a temperaturas elevadas.',
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
                    'Resistente a productos qu�micos y gasolina',
                    'No se degrada con luz solar (UV)',
                    'Ideal para uso automotriz',
                    'Larga vida �til - dura a�os'
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
                es: 'Perfecto para piezas automotrices, carcasas de electr�nicos, herramientas de uso rudo, componentes mec�nicos, y cualquier aplicaci�n que requiera alta durabilidad, resistencia al calor o uso en ambientes exigentes.',
                en: 'Perfect for automotive parts, electronic housings, heavy-duty tools, mechanical components, and any application requiring high durability, heat resistance or use in demanding environments.'
            },
            examples: {
                es: ['Piezas de autos', 'Carcasas electr�nicas', 'Herramientas', 'Componentes mec�nicos', 'Prototipos funcionales'],
                en: ['Car parts', 'Electronic housings', 'Tools', 'Mechanical components', 'Functional prototypes']
            }
        },
        pacf: {
            icon: '�',
            name: 'PA+CF',
            fullName: {
                es: 'Nylon con Fibra de Carbono',
                en: 'Carbon Fiber Reinforced Nylon'
            },
            technical: {
                mechanical: {
                    es: [
                        { label: 'Resistencia a la Tracci�n', value: '90-120 MPa' },
                        { label: 'Resistencia a la Flexi�n', value: '150-180 MPa' },
                        { label: 'Resistencia al Impacto', value: '20-30 kJ/m�' },
                        { label: 'Elongaci�n al Romper', value: '2-5%' }
                    ],
                    en: [
                        { label: 'Tensile Strength', value: '90-120 MPa' },
                        { label: 'Flexural Strength', value: '150-180 MPa' },
                        { label: 'Impact Resistance', value: '20-30 kJ/m�' },
                        { label: 'Elongation at Break', value: '2-5%' }
                    ]
                },
                thermal: {
                    es: [
                        { label: 'Temperatura de Transici�n V�trea', value: '80-90�C' },
                        { label: 'Temperatura de Deflexi�n', value: '150-180�C' },
                        { label: 'Punto de Fusi�n', value: '220-260�C' },
                        { label: 'Temperatura M�xima de Servicio', value: '120�C' }
                    ],
                    en: [
                        { label: 'Glass Transition Temperature', value: '80-90�C' },
                        { label: 'Heat Deflection Temperature', value: '150-180�C' },
                        { label: 'Melting Point', value: '220-260�C' },
                        { label: 'Max Service Temperature', value: '120�C' }
                    ]
                },
                physical: {
                    es: [
                        { label: 'Densidad', value: '1.15 g/cm�' },
                        { label: 'Dureza Shore D', value: '85-90' },
                        { label: 'Absorci�n de Agua', value: '0.8-1.5% (24h)' },
                        { label: 'Contracci�n', value: '0.3-0.5%' }
                    ],
                    en: [
                        { label: 'Density', value: '1.15 g/cm�' },
                        { label: 'Shore D Hardness', value: '85-90' },
                        { label: 'Water Absorption', value: '0.8-1.5% (24h)' },
                        { label: 'Shrinkage Rate', value: '0.3-0.5%' }
                    ]
                },
                durability: {
                    es: [
                        { label: 'Resistencia UV', value: 'Buena - mantiene propiedades mec�nicas' },
                        { label: 'Resistencia Qu�mica', value: 'Excelente a combustibles, aceites y solventes' },
                        { label: 'Resistencia a la Intemperie', value: 'Excelente - uso industrial exterior' },
                        { label: 'Vida �til Estimada', value: '15-25 a�os en condiciones extremas' }
                    ],
                    en: [
                        { label: 'UV Resistance', value: 'Good - maintains mechanical properties' },
                        { label: 'Chemical Resistance', value: 'Excellent to fuels, oils and solvents' },
                        { label: 'Weatherability', value: 'Excellent - industrial outdoor use' },
                        { label: 'Estimated Lifespan', value: '15-25 years in extreme conditions' }
                    ]
                },
                recommendations: {
                    es: 'El material m�s resistente disponible, ideal para aplicaciones de alto rendimiento que requieren m�xima resistencia con m�nimo peso. Perfecto para drones, rob�tica, herramientas industriales y componentes estructurales. Puede reemplazar piezas de metal en muchas aplicaciones. Excelente rigidez y estabilidad dimensional bajo carga.',
                    en: 'The strongest material available, ideal for high-performance applications requiring maximum strength with minimum weight. Perfect for drones, robotics, industrial tools and structural components. Can replace metal parts in many applications. Excellent rigidity and dimensional stability under load.'
                }
            },
            properties: {
                es: [
                    'El material m�s resistente que ofrecemos',
                    'Extremadamente ligero pero s�per fuerte',
                    'No se deforma bajo carga pesada',
                    'Resistente a qu�micos agresivos',
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
                    'Ideal para drones y rob�tica',
                    'Soporta cargas y estr�s extremo'
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
                es: 'Ideal para drones profesionales, piezas industriales, herramientas de alto rendimiento, soportes estructurales, engranajes de precisi�n, y aplicaciones aeroespaciales o rob�ticas que requieren m�xima resistencia con m�nimo peso.',
                en: 'Ideal for professional drones, industrial parts, high-performance tools, structural supports, precision gears, and aerospace or robotic applications requiring maximum strength with minimum weight.'
            },
            examples: {
                es: ['Partes de drones', 'Herramientas industriales', 'Engranajes de precisi�n', 'Soportes estructurales', 'Componentes aeroespaciales'],
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

    // Detail button  opens technical modal directly
    $(document).on('click', '.mat-widget__detail-btn', function(e) {
        e.stopPropagation();
        _openTechnicalModal($(this).data('material'));
    });

    function _openTechnicalModal(material) {
        const data = materialData[material];
        const lang = currentLang;

        if (data && data.technical) {
            $('.technical-modal-title').text(`${data.name} - ${translations[lang].tech_specifications || 'Especificaciones T�cnicas'}`);
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

    // "Learn more" button  opens material info modal
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
    // Technical Details Button inside material modal  reuse same function
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

        // Duplicate cards for seamless infinite loop  replace videos with placeholders to avoid re-downloads
        const origCards = Array.from(grid.children);
        origCards.forEach(card => {
            var clone = card.cloneNode(true);
            clone.querySelectorAll('video').forEach(function(v) {
                var ph = document.createElement('div');
                ph.style.cssText = 'width:100%;height:100%;background:#0a0e1a';
                v.parentNode.replaceChild(ph, v);
            });
            grid.appendChild(clone);
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

    // PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
    //  SPA ROUTER
    // PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
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
                // Language handled by main.js switchLanguage  skip catalog's initLangSelector
                renderAll();
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

                //    Init catalog hero particles + wave                         
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
                    requestAnimationFrame(function() {
                        var el = document.getElementById('smoky-bg-cat');
                        if (el && el.offsetWidth > 0) {
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
                    });
                }
            } else if (typeof renderAll === 'function') {
                // Re-render to apply current language
                renderAll();
            }
        } else if (target !== 'home') {
            // Scroll to section. Use a single rAF to let the browser finish
            // showing the sections (display:none � '') before measuring position.
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

    // Handle hash changes (browser back/forward only  direct clicks use spaNavigate)
    var _lastHash = '';
    $(window).on('hashchange', function() {
        var h = window.location.hash;
        if (h !== _lastHash) {
            _lastHash = h;
            spaNavigate(h);
        }
    });

    // Handle nav link clicks  call spaNavigate directly (no hashchange relay)
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
    // If URL contains #product=ID, navigate to catalog so the product modal can open
    var _initHash = window.location.hash || '';
    if (_initHash.match(/[#&]?product=([a-f0-9-]{36})/i)) {
        spaNavigate('#catalog');
    } else {
        spaNavigate(_initHash || '#home');
    }

    // Expose globally so external buttons can trigger SPA navigation
    window._spaNavigate = spaNavigate;

    //    Navigate to catalog with a specific category pre-selected             
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

    //    Ensure videos in the initially-active panel start playing             
    // Use an IntersectionObserver on the services section so videos only load
    // when the section actually scrolls into view (not on page load).
    function _lazyLoadVideos(container) {
        var videos = Array.from(container.querySelectorAll('video[data-lazy="true"]'));
        var grid = container.querySelector('.showcase-media-grid');

        if (grid && videos.length) {
            grid.style.display = 'none';

            var old = container.querySelector('.grid-spinner');
            if (old) old.remove();

            var spinner = document.createElement('div');
            spinner.className = 'grid-spinner';
            grid.parentNode.insertBefore(spinner, grid);

            var loaded = 0;
            var total = videos.length;
            var done = false;

            function _onReady() {
                if (done) return;
                loaded++;
                if (loaded >= total) {
                    done = true;
                    if (spinner.parentNode) spinner.remove();
                    grid.style.display = '';
                }
            }

            // Swap data-src � src and load first, THEN attach listeners
            videos.forEach(function(v) {
                v.querySelectorAll('source[data-src]').forEach(function(s) { s.src = s.dataset.src; });
                delete v.dataset.lazy;
                v.load();
            });

            // Listen for 'playing'  fires when first frame is actually rendered
            videos.forEach(function(v) {
                v.addEventListener('playing', _onReady, { once: true });
                v.play().catch(function(){});
            });

            // No automatic fallback  spinner stays until all videos play
        } else {
            // No lazy videos  just resume paused ones (tab switch back)
            container.querySelectorAll('video').forEach(function(v) {
                if (v.paused) v.play().catch(function(){});
            });
        }
    }

    var servicesSection = document.getElementById('services');
    if (servicesSection && 'IntersectionObserver' in window) {
        var sectionObserver = new IntersectionObserver(function(entries) {
            if (entries[0].isIntersecting) {
                var activePanel = servicesSection.querySelector('.showcase-panel.active');
                if (activePanel) _lazyLoadVideos(activePanel);
                sectionObserver.disconnect();
            }
        }, { threshold: 0.1 });
        sectionObserver.observe(servicesSection);
    }

    //    Image error fallback  hide broken images gracefully                  
    document.querySelectorAll('img').forEach(function(img) {
        img.addEventListener('error', function() {
            this.style.opacity = '0';
        });
    });

    //    Video strip lazy-load on scroll                                       
    if ('IntersectionObserver' in window) {
        var stripObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                var v = entry.target;
                if (entry.isIntersecting) {
                    if (v.dataset.lazy === 'true') {
                        v.querySelectorAll('source[data-src]').forEach(function(s) { s.src = s.dataset.src; });
                        delete v.dataset.lazy;
                        v.load();
                    }
                    v.play().catch(function(){});
                    stripObserver.unobserve(v);
                }
            });
        }, { threshold: 0.1 });

        // Only observe video-strip videos (not showcase panel videos  those are handled by _lazyLoadVideos)
        document.querySelectorAll('.video-strip video').forEach(function(v) {
            stripObserver.observe(v);
        });
    }

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
        // Helper: clone item but replace <video> with a static placeholder to avoid duplicate downloads
        function _cloneItem(item) {
            var clone = item.cloneNode(true);
            clone.querySelectorAll('video').forEach(function(v) {
                var ph = document.createElement('div');
                ph.style.cssText = 'width:100%;height:100%;background:#0a0e1a';
                v.parentNode.replaceChild(ph, v);
            });
            return clone;
        }

        var tracks = [track0, track1].map(function(itemList) {
            var t = document.createElement('div');
            t.className = 'showcase-media-track';
            // Add originals (move, don't clone, to keep the live video element)
            itemList.forEach(function(item) { t.appendChild(item); });
            // Duplicate for seamless loop  use placeholder clones (no video download)
            itemList.forEach(function(item) { t.appendChild(_cloneItem(item)); });
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
            if (panel) {
                panel.classList.add('active');
                _lazyLoadVideos(panel);
            }

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
                    var contactText = (window.translations && window.translations[window.currentLang || 'es'] && window.translations[window.currentLang || 'es']['wa_btn']) || 'Cont�ctanos �';
                    sidebarCta.textContent = contactText;
                    sidebarCta.setAttribute('onclick', "var m=document.getElementById('waModal');if(m){m.style.display='flex';var msg=document.getElementById('waMessage');if(msg)msg.value='Hola, me interesa el servicio de Escaneo 3D';}");
                } else {
                    var viewText = (window.translations && window.translations[window.currentLang || 'es'] && window.translations[window.currentLang || 'es']['service.viewProducts']) || 'Ver productos �';
                    sidebarCta.textContent = viewText;
                    sidebarCta.setAttribute('onclick', "event.preventDefault();_navToCat('" + target + "');");
                }
            }
        });
    });

    //    Service sidebar visibility  show when #services is in view            
    //    Service sidebar  always visible, no scroll logic needed              

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

// Mobile nav  handled by navbar__menu.active toggle in the jQuery block above

