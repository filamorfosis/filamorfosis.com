-- ═══════════════════════════════════════════════════════════════════════════
-- PRODUCT USE-CASE TAGGING MIGRATION
-- Adds use_cases column and intelligently tags all products
-- ═══════════════════════════════════════════════════════════════════════════

-- Add use_cases column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Products' AND column_name = 'use_cases'
    ) THEN
        ALTER TABLE "Products" ADD COLUMN use_cases TEXT[] DEFAULT '{}';
    END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- TAG PRODUCTS BY USE CASE
-- ═══════════════════════════════════════════════════════════════════════════

-- 🎁 REGALOS (Gifts) - 18 products
UPDATE "Products" SET use_cases = array_append(use_cases, 'gifts')
WHERE slug IN (
    'uv-tumbler',
    'uv-mug',
    'uv-coaster',
    'uv-sticker',
    'uv-magnet',
    'uv-bottle',
    'uv-phone-case',
    'uv-keychain',
    'uv-pet-tag',
    'uv-golf-ball',
    'uv-jewelry',
    'uv-challenge-coin',
    'uv-bottle-opener',
    'engrave-wood',
    'engrave-glass',
    'engrave-leather',
    'engrave-acrylic',
    'engrave-stone'
);

-- ☕ TAZAS Y VASOS (Drinkware) - 5 products
UPDATE "Products" SET use_cases = array_append(use_cases, 'drinkware')
WHERE slug IN (
    'uv-tumbler',
    'uv-mug',
    'uv-bottle',
    'uv-coaster',
    'engrave-glass'
);

-- 🏢 EMPRESARIAL (Business) - 14 products
UPDATE "Products" SET use_cases = array_append(use_cases, 'business')
WHERE slug IN (
    'uv-sticker',
    'uv-magnet',
    'uv-business-card',
    'uv-award',
    'uv-tote-bag',
    'uv-wood-sign',
    'uv-metal-poster',
    'uv-luggage-tag',
    'uv-challenge-coin',
    'uv-poster',
    'engrave-metal',
    'engrave-glass',
    'engrave-acrylic',
    'engrave-wood'
);

-- 🖼️ DECORACIÓN (Home Decor) - 13 products
UPDATE "Products" SET use_cases = array_append(use_cases, 'decor')
WHERE slug IN (
    'uv-coaster',
    'uv-wood-sign',
    'uv-stained-glass',
    'uv-metal-poster',
    'uv-wood-frame',
    'uv-canvas',
    'uv-acrylic-art',
    'uv-tile',
    'uv-poster',
    'engrave-wood',
    'engrave-acrylic',
    'engrave-stone',
    'engrave-glass'
);

-- 🎉 EVENTOS (Events & Celebrations) - 11 products
UPDATE "Products" SET use_cases = array_append(use_cases, 'events')
WHERE slug IN (
    'uv-wedding',
    'uv-coaster',
    'uv-magnet',
    'uv-bottle-opener',
    'uv-tote-bag',
    'uv-award',
    'uv-challenge-coin',
    'uv-sticker',
    'uv-luggage-tag',
    'engrave-glass',
    'engrave-wood'
);

-- 🎨 ARTE Y DISEÑO (Art & Custom Design) - 12 products
UPDATE "Products" SET use_cases = array_append(use_cases, 'art')
WHERE slug IN (
    'uv-stained-glass',
    'uv-metal-poster',
    'uv-canvas',
    'uv-acrylic-art',
    'uv-wood-frame',
    'uv-nail-art',
    'uv-jewelry',
    'uv-skateboard',
    'uv-poster',
    'engrave-wood',
    'engrave-acrylic',
    'engrave-stone'
);

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES
-- ═══════════════════════════════════════════════════════════════════════════

-- Count products per use case
SELECT 
    unnest(use_cases) as use_case,
    COUNT(*) as product_count
FROM "Products"
WHERE use_cases IS NOT NULL AND array_length(use_cases, 1) > 0
GROUP BY use_case
ORDER BY product_count DESC;

-- Show products with their use cases
SELECT 
    slug,
    "TitleEs" as title,
    use_cases,
    array_length(use_cases, 1) as category_count
FROM "Products"
ORDER BY array_length(use_cases, 1) DESC, slug;

-- Products without use cases (should be empty)
SELECT slug, "TitleEs"
FROM "Products"
WHERE use_cases IS NULL OR array_length(use_cases, 1) = 0;

