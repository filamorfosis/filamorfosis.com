-- ═══════════════════════════════════════════════════════════════════════════
-- PRODUCT USE-CASE TAGGING MIGRATION (SQLite Version)
-- Adds use_cases column and intelligently tags all products
-- ═══════════════════════════════════════════════════════════════════════════

-- Add use_cases column if it doesn't exist (SQLite uses TEXT for JSON arrays)
-- SQLite doesn't support IF NOT EXISTS for columns, so we'll handle this in code

-- First, check if column exists by attempting to select it
-- If this fails, we need to add the column
PRAGMA table_info(Products);

-- Add the column (will fail if it already exists, which is fine)
-- ALTER TABLE Products ADD COLUMN use_cases TEXT DEFAULT '[]';

-- ═══════════════════════════════════════════════════════════════════════════
-- TAG PRODUCTS BY USE CASE
-- SQLite stores arrays as JSON, so we need to use json_insert/json_set
-- ═══════════════════════════════════════════════════════════════════════════

-- Helper: For SQLite, we'll build JSON arrays by appending to existing arrays
-- Since SQLite doesn't have array_append, we'll use json_insert

-- 🎁 REGALOS (Gifts) - 18 products
UPDATE Products 
SET use_cases = json_insert(
    COALESCE(use_cases, '[]'),
    '$[#]', 'gifts'
)
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
)
AND (use_cases IS NULL OR json_extract(use_cases, '$') NOT LIKE '%gifts%');

-- ☕ TAZAS Y VASOS (Drinkware) - 5 products
UPDATE Products 
SET use_cases = json_insert(
    COALESCE(use_cases, '[]'),
    '$[#]', 'drinkware'
)
WHERE slug IN (
    'uv-tumbler',
    'uv-mug',
    'uv-bottle',
    'uv-coaster',
    'engrave-glass'
)
AND (use_cases IS NULL OR json_extract(use_cases, '$') NOT LIKE '%drinkware%');

-- 🏢 EMPRESARIAL (Business) - 14 products
UPDATE Products 
SET use_cases = json_insert(
    COALESCE(use_cases, '[]'),
    '$[#]', 'business'
)
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
)
AND (use_cases IS NULL OR json_extract(use_cases, '$') NOT LIKE '%business%');

-- 🖼️ DECORACIÓN (Home Decor) - 13 products
UPDATE Products 
SET use_cases = json_insert(
    COALESCE(use_cases, '[]'),
    '$[#]', 'decor'
)
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
)
AND (use_cases IS NULL OR json_extract(use_cases, '$') NOT LIKE '%decor%');

-- 🎉 EVENTOS (Events & Celebrations) - 11 products
UPDATE Products 
SET use_cases = json_insert(
    COALESCE(use_cases, '[]'),
    '$[#]', 'events'
)
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
)
AND (use_cases IS NULL OR json_extract(use_cases, '$') NOT LIKE '%events%');

-- 🎨 ARTE Y DISEÑO (Art & Custom Design) - 12 products
UPDATE Products 
SET use_cases = json_insert(
    COALESCE(use_cases, '[]'),
    '$[#]', 'art'
)
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
)
AND (use_cases IS NULL OR json_extract(use_cases, '$') NOT LIKE '%art%');

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES
-- ═══════════════════════════════════════════════════════════════════════════

-- Count products per use case (SQLite version using json_each)
SELECT 
    value as use_case,
    COUNT(*) as product_count
FROM Products, json_each(Products.use_cases)
WHERE use_cases IS NOT NULL AND use_cases != '[]'
GROUP BY value
ORDER BY product_count DESC;

-- Show products with their use cases
SELECT 
    slug,
    TitleEs as title,
    use_cases,
    json_array_length(use_cases) as category_count
FROM Products
ORDER BY json_array_length(use_cases) DESC, slug;

-- Products without use cases (should be empty)
SELECT slug, TitleEs
FROM Products
WHERE use_cases IS NULL OR use_cases = '[]' OR json_array_length(use_cases) = 0;
