# Requirements Document: Use-Case Category System

## Introduction

The Filamorfosis store currently organizes products by technical manufacturing methods (UV Printing, 3D Printing, Laser Cutting), which creates friction for customers who think in terms of what they want to buy (gifts, drinkware, business items) rather than how products are made. This feature replaces the technical category system with a customer-centric use-case based navigation system that allows products to appear in multiple relevant categories, improving product discoverability and conversion rates.

## Glossary

- **Use_Case**: A customer-oriented product category representing a shopping intent (e.g., "gifts", "drinkware", "business")
- **Product**: An item in the catalog that can be tagged with one or more use cases
- **Category_System**: The navigation structure that organizes products into browsable groups
- **Frontend_Catalog**: The client-side product browsing interface (products.js, catalog.js)
- **Backend_API**: The server-side product data service (ProductsController.cs)
- **Database**: PostgreSQL database storing product data via Entity Framework Core
- **Translation_System**: The i18n infrastructure supporting 6 languages (es, en, de, pt, ja, zh)
- **Multi_Category_Assignment**: The capability for a single product to belong to multiple use cases simultaneously

## Requirements

### Requirement 1: Database Schema Extension

**User Story:** As a system administrator, I want products to support multiple use-case tags, so that products can appear in all relevant customer-oriented categories.

#### Acceptance Criteria

1. THE Database SHALL store use cases as a TEXT[] array column named "use_cases" in the Products table
2. WHEN the migration script executes, THE Database SHALL add the use_cases column if it does not already exist
3. THE Database SHALL preserve all existing product data during the schema migration
4. WHEN a product has no use cases assigned, THE Database SHALL store an empty array '{}' as the default value
5. FOR ALL products in the database, querying the use_cases column SHALL return a valid array (never NULL)

### Requirement 2: Product Use-Case Tagging

**User Story:** As a system administrator, I want all 36 existing products automatically tagged with appropriate use cases, so that the new category system works immediately after migration.

#### Acceptance Criteria

1. THE Migration_Script SHALL tag exactly 18 products with the "gifts" use case
2. THE Migration_Script SHALL tag exactly 5 products with the "drinkware" use case
3. THE Migration_Script SHALL tag exactly 14 products with the "business" use case
4. THE Migration_Script SHALL tag exactly 13 products with the "decor" use case
5. THE Migration_Script SHALL tag exactly 11 products with the "events" use case
6. THE Migration_Script SHALL tag exactly 12 products with the "art" use case
7. WHEN a product belongs to multiple use cases, THE Migration_Script SHALL append each use case to the product's use_cases array without duplication
8. FOR ALL products after migration, the use_cases array SHALL contain only valid use case identifiers from the set: ["gifts", "drinkware", "business", "decor", "events", "art"]

### Requirement 3: Backend API Use-Case Filtering

**User Story:** As a frontend developer, I want to filter products by use case via the API, so that I can display category-specific product lists.

#### Acceptance Criteria

1. THE Backend_API SHALL accept an optional "useCase" query parameter in GET /api/v1/products
2. WHEN the useCase parameter is provided, THE Backend_API SHALL return only products where the use_cases array contains the specified use case
3. WHEN the useCase parameter is omitted or empty, THE Backend_API SHALL return all active products (existing behavior preserved)
4. THE Backend_API SHALL return products in the existing ProductSummaryDto format with all current fields intact
5. WHEN filtering by use case, THE Backend_API SHALL maintain support for all existing query parameters (page, pageSize, search, badge)
6. THE Backend_API SHALL perform use-case filtering using PostgreSQL array containment operators for optimal query performance

### Requirement 4: Frontend Category Navigation Structure

**User Story:** As a customer, I want to browse products by use case categories, so that I can quickly find products that match my shopping intent.

#### Acceptance Criteria

1. THE Frontend_Catalog SHALL display 7 primary category tabs: Regalos (🎁), Tazas y Vasos (☕), Empresarial (🏢), Decoración (🖼️), Eventos (🎉), Arte y Diseño (🎨), Todos (📦)
2. WHEN a customer clicks a use-case category tab, THE Frontend_Catalog SHALL fetch and display only products tagged with that use case
3. WHEN a customer clicks the "Todos" tab, THE Frontend_Catalog SHALL display all products without use-case filtering
4. THE Frontend_Catalog SHALL replace the existing technical category tabs (UV, 3D, Laser) with the new use-case tabs
5. THE Frontend_Catalog SHALL preserve all existing secondary filters (Popular, Nuevo, Económico, Premium, Promo)
6. WHEN switching between category tabs, THE Frontend_Catalog SHALL reset pagination to page 1 and clear the search query

### Requirement 5: Multi-Language Category Labels

**User Story:** As a customer browsing in any supported language, I want category names displayed in my language, so that I can understand the navigation structure.

#### Acceptance Criteria

1. THE Translation_System SHALL provide translations for all 7 use-case category labels in all 6 supported languages (es, en, de, pt, ja, zh)
2. THE Translation_System SHALL store category label translations using keys: cat_gifts, cat_drinkware, cat_business, cat_decor, cat_events, cat_art, cat_all
3. WHEN the user switches languages, THE Frontend_Catalog SHALL update all category tab labels to the selected language within 100ms
4. THE Translation_System SHALL preserve emoji icons (🎁, ☕, 🏢, 🖼️, 🎉, 🎨, 📦) as literal UTF-8 characters in all language files
5. FOR ALL translation keys added, every language file (lang.es.js, lang.en.js, lang.de.js, lang.pt.js, lang.ja.js, lang.zh.js) SHALL contain the corresponding translation

### Requirement 6: Product Multi-Category Display

**User Story:** As a customer, I want to see products in all relevant categories, so that I can discover products through multiple browsing paths.

#### Acceptance Criteria

1. WHEN a product is tagged with multiple use cases, THE Frontend_Catalog SHALL display that product in each corresponding category tab
2. WHEN browsing the "Regalos" category, THE Frontend_Catalog SHALL display all 18 products tagged with "gifts"
3. WHEN browsing the "Tazas y Vasos" category, THE Frontend_Catalog SHALL display all 5 products tagged with "drinkware"
4. WHEN a product appears in multiple categories, THE Frontend_Catalog SHALL display identical product information (title, price, images, badges) in each category
5. THE Frontend_Catalog SHALL maintain accurate product counts per category in the section header

### Requirement 7: Backward Compatibility with Existing Features

**User Story:** As a developer, I want the new category system to coexist with existing features, so that no functionality is lost during the transition.

#### Acceptance Criteria

1. THE Backend_API SHALL continue to support the existing "categoryId" query parameter for technical category filtering
2. THE Frontend_Catalog SHALL preserve all existing product card rendering logic (carousels, badges, pricing, availability)
3. THE Frontend_Catalog SHALL preserve all existing modal functionality (product detail view, variant selection, add to cart)
4. THE Frontend_Catalog SHALL preserve all existing search functionality across all use-case categories
5. THE Frontend_Catalog SHALL preserve all existing filter chips (Popular, Nuevo, Económico, Premium, Promo) and their behavior
6. WHEN using the search feature, THE Frontend_Catalog SHALL search across all products regardless of the active use-case tab

### Requirement 8: Frontend Standards Compliance

**User Story:** As a developer, I want the implementation to follow established frontend standards, so that code quality and maintainability are preserved.

#### Acceptance Criteria

1. THE Frontend_Catalog SHALL use only CSS classes for styling (no inline style attributes in HTML or JavaScript)
2. THE Frontend_Catalog SHALL use data-translate or data-t attributes for all user-visible text (no hardcoded strings in HTML or JavaScript)
3. THE Frontend_Catalog SHALL store all category label translations in window.FilamorfosisI18n['{code}'] objects
4. THE Frontend_Catalog SHALL use UTF-8 encoding for all emoji and special characters (no HTML entities or unicode escapes)
5. THE Frontend_Catalog SHALL maintain minimum font size of 1rem for all text elements
6. THE Frontend_Catalog SHALL contain no unused functions, variables, or commented-out code blocks

### Requirement 9: Performance and User Experience

**User Story:** As a customer, I want category switching to be fast and smooth, so that I can browse products efficiently.

#### Acceptance Criteria

1. WHEN switching between category tabs, THE Frontend_Catalog SHALL display skeleton loading states within 100ms
2. WHEN the API response completes, THE Frontend_Catalog SHALL render the product grid within 50ms of receiving data
3. THE Frontend_Catalog SHALL maintain smooth animations and transitions during category switching (no visual jumps or flickers)
4. THE Backend_API SHALL execute use-case filter queries in under 200ms for datasets up to 1000 products
5. THE Frontend_Catalog SHALL preserve scroll position when using "Load More" pagination within a category

### Requirement 10: Data Integrity and Validation

**User Story:** As a system administrator, I want to verify that all products are correctly tagged, so that no products are missing from expected categories.

#### Acceptance Criteria

1. THE Migration_Script SHALL include verification queries that count products per use case
2. THE Migration_Script SHALL include verification queries that identify products with zero use cases
3. WHEN the migration completes, THE Migration_Script SHALL output a summary showing product counts for each use case
4. THE Backend_API SHALL validate that use case filter values match the allowed set: ["gifts", "drinkware", "business", "decor", "events", "art"]
5. WHEN an invalid use case is requested, THE Backend_API SHALL return an empty result set (not an error)

## Special Requirements Guidance

### Parser and Serializer Requirements

This feature does not introduce new parsers or serializers. The existing JSON serialization for API responses and PostgreSQL array handling are sufficient.

### Round-Trip Properties

This feature does not require round-trip testing as it does not involve data transformation or serialization/deserialization cycles beyond standard API JSON handling.

## Success Metrics

- All 36 products correctly tagged with appropriate use cases
- Category navigation functional in all 6 languages
- API response times under 200ms for filtered queries
- Zero products orphaned (all products appear in at least one category)
- Existing features (search, filters, pagination, modal) continue to work without regression
