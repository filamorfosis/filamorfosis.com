/* ═══════════════════════════════════════════════
   FILAMORFOSIS® — LASER ENGRAVING PRODUCTS
   Base product data (ES). Add new engraving products here.
   ═══════════════════════════════════════════════ */

// Appended to PRODUCTS array defined in Products_UV.js
PRODUCTS.push(

    // ════════════════════════════════════════════
    //  LASER ENGRAVING
    // ════════════════════════════════════════════

    {
        id: 'engrave-wood',
        category: 'engrave',
        badge: 'hot',
        title: 'Grabado en Madera',
        desc: 'Grabado láser de alta precisión sobre madera natural, MDF y bambú. Detalle fotográfico, permanente y elegante.',
        tags: ['Madera', 'MDF', 'Bambú', 'Personalizado', 'Regalo'],
        images: [],
        emoji: '🪵',
        features: [
            'Detalle fotográfico',
            'Permanente — no se borra',
            'Madera natural, MDF o bambú',
            'Tamaños personalizados',
            'Acabado natural o barnizado',
            'Mínimo 1 pieza',
        ],
        variants: ['10×15cm', '15×20cm', '20×30cm', '30×40cm', 'Tamaño libre'],
        pricing: {
            type: 'flat-relief',
            note: 'Precio por pieza en MXN. Incluye diseño vectorial básico.',
            rows: [
                { variant: '10×15cm',     flat: '$80',  relief: 'N/A' },
                { variant: '15×20cm',     flat: '$110', relief: 'N/A' },
                { variant: '20×30cm',     flat: '$155', relief: 'N/A' },
                { variant: '30×40cm',     flat: '$220', relief: 'N/A' },
                { variant: 'Tamaño libre', flat: 'Cotizar', relief: 'N/A' },
            ],
        },
    },

    {
        id: 'engrave-metal',
        category: 'engrave',
        badge: 'new',
        title: 'Grabado en Metal',
        desc: 'Grabado láser sobre acero inoxidable, aluminio y latón. Ideal para trofeos, placas, llaveros y regalos corporativos premium.',
        tags: ['Acero', 'Aluminio', 'Latón', 'Trofeo', 'Corporativo'],
        images: [],
        emoji: '🏅',
        features: [
            'Acero inox, aluminio o latón',
            'Grabado permanente y preciso',
            'Ideal para trofeos y placas',
            'Acabado brillante o cepillado',
            'Texto, logo o foto',
            'Mínimo 1 pieza',
        ],
        variants: ['Placa 10×7cm', 'Placa 15×10cm', 'Placa 20×15cm', 'Llavero metal', 'Pieza personalizada'],
        pricing: {
            type: 'flat-relief',
            note: 'Precio por pieza en MXN.',
            rows: [
                { variant: 'Placa 10×7cm',       flat: '$120', relief: 'N/A' },
                { variant: 'Placa 15×10cm',      flat: '$170', relief: 'N/A' },
                { variant: 'Placa 20×15cm',      flat: '$240', relief: 'N/A' },
                { variant: 'Llavero metal',      flat: '$65',  relief: 'N/A' },
                { variant: 'Pieza personalizada', flat: 'Cotizar', relief: 'N/A' },
            ],
        },
    },

    {
        id: 'engrave-glass',
        category: 'engrave',
        badge: null,
        title: 'Grabado en Vidrio',
        desc: 'Grabado láser sobre vasos, botellas, espejos y cristal. Efecto esmerilado elegante, perfecto para regalos y branding.',
        tags: ['Vidrio', 'Vaso', 'Botella', 'Espejo', 'Branding'],
        images: [],
        emoji: '🍾',
        features: [
            'Efecto esmerilado elegante',
            'Vasos, botellas, espejos',
            'Texto, logo o diseño',
            'Permanente y resistente',
            'Ideal para bodas y eventos',
            'Mínimo 1 pieza',
        ],
        variants: ['Vaso estándar', 'Vaso térmico', 'Botella de vino', 'Espejo decorativo', 'Pieza personalizada'],
        pricing: {
            type: 'flat-relief',
            note: 'Precio por pieza en MXN. El objeto puede ser propio o proveído.',
            rows: [
                { variant: 'Vaso estándar',       flat: '$90',  relief: 'N/A' },
                { variant: 'Vaso térmico',        flat: '$110', relief: 'N/A' },
                { variant: 'Botella de vino',     flat: '$130', relief: 'N/A' },
                { variant: 'Espejo decorativo',   flat: '$150', relief: 'N/A' },
                { variant: 'Pieza personalizada', flat: 'Cotizar', relief: 'N/A' },
            ],
        },
    },

    {
        id: 'engrave-leather',
        category: 'engrave',
        badge: null,
        title: 'Grabado en Cuero',
        desc: 'Grabado láser sobre cuero genuino y sintético. Carteras, cinturones, agendas y accesorios con tu diseño o logo.',
        tags: ['Cuero', 'Cartera', 'Cinturón', 'Agenda', 'Moda'],
        images: [],
        emoji: '👜',
        features: [
            'Cuero genuino o sintético',
            'Grabado suave y elegante',
            'Carteras, cinturones, agendas',
            'Texto, logo o diseño',
            'Acabado natural del cuero',
            'Mínimo 1 pieza',
        ],
        variants: ['Cartera/billetera', 'Cinturón', 'Agenda/libreta', 'Llavero cuero', 'Pieza personalizada'],
        pricing: {
            type: 'flat-relief',
            note: 'Precio de grabado por pieza en MXN. El objeto puede ser propio.',
            rows: [
                { variant: 'Cartera/billetera',   flat: '$95',  relief: 'N/A' },
                { variant: 'Cinturón',            flat: '$110', relief: 'N/A' },
                { variant: 'Agenda/libreta',      flat: '$120', relief: 'N/A' },
                { variant: 'Llavero cuero',       flat: '$55',  relief: 'N/A' },
                { variant: 'Pieza personalizada', flat: 'Cotizar', relief: 'N/A' },
            ],
        },
    },

    {
        id: 'engrave-acrylic',
        category: 'engrave',
        badge: 'new',
        title: 'Grabado en Acrílico',
        desc: 'Grabado láser sobre acrílico transparente, de color o espejado. Letreros, displays, trofeos y decoración con efecto premium.',
        tags: ['Acrílico', 'Transparente', 'Espejado', 'Letrero', 'Display'],
        images: [],
        emoji: '💎',
        features: [
            'Acrílico transparente, color o espejo',
            'Grabado con efecto esmerilado',
            'Letreros y señalética premium',
            'Trofeos y reconocimientos',
            'Iluminación LED compatible',
            'Mínimo 1 pieza',
        ],
        variants: ['10×15cm', '15×20cm', '20×30cm', '30×40cm', 'Tamaño libre'],
        pricing: {
            type: 'flat-relief',
            note: 'Precio por pieza en MXN.',
            rows: [
                { variant: '10×15cm',     flat: '$95',  relief: 'N/A' },
                { variant: '15×20cm',     flat: '$130', relief: 'N/A' },
                { variant: '20×30cm',     flat: '$185', relief: 'N/A' },
                { variant: '30×40cm',     flat: '$260', relief: 'N/A' },
                { variant: 'Tamaño libre', flat: 'Cotizar', relief: 'N/A' },
            ],
        },
    },

    {
        id: 'engrave-stone',
        category: 'engrave',
        badge: null,
        title: 'Grabado en Piedra',
        desc: 'Grabado láser sobre pizarra, mármol y granito. Perfecto para lápidas conmemorativas, decoración rústica y regalos únicos.',
        tags: ['Pizarra', 'Mármol', 'Granito', 'Decoración', 'Memorial'],
        images: [],
        emoji: '🪨',
        features: [
            'Pizarra, mármol o granito',
            'Grabado profundo y duradero',
            'Efecto natural y rústico',
            'Texto, foto o diseño',
            'Ideal para memoriales y decoración',
            'Mínimo 1 pieza',
        ],
        variants: ['Pizarra 10×15cm', 'Pizarra 20×30cm', 'Mármol 10×10cm', 'Granito personalizado'],
        pricing: {
            type: 'flat-relief',
            note: 'Precio por pieza en MXN.',
            rows: [
                { variant: 'Pizarra 10×15cm',       flat: '$100', relief: 'N/A' },
                { variant: 'Pizarra 20×30cm',       flat: '$160', relief: 'N/A' },
                { variant: 'Mármol 10×10cm',        flat: '$140', relief: 'N/A' },
                { variant: 'Granito personalizado', flat: 'Cotizar', relief: 'N/A' },
            ],
        },
    }

); // end PRODUCTS.push
