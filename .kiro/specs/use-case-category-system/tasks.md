# Implementation Plan: Use-Case Category System

## Overview

This implementation plan converts the technical manufacturing-based product categorization (UV Printing, 3D Printing, Laser Cutting) into a customer-centric use-case based system (Gifts, Drinkware, Business, Decor, Events, Art). Products can belong to multiple categories simultaneously, improving discoverability and aligning with customer shopping intent.

**Key Implementation Approach:**
- Database-first: Execute migration script to add use_cases column and tag all 36 products
- Backend: Add use-case filtering to ProductsController API
- Frontend: Replace category tabs and update state management
- Translations: Add category labels to all 6 language files
- Testing: Verify multi-category display and backward compatibility

## Tasks

- [x] 1. Execute database migration and verify product tagging
  - Run PRODUCT-USE-CASE-TAGGING.sql script against PostgreSQL database
  - Verify use_cases column exists with TEXT[] type
  - Verify all 36 products have at least one use case assigned
  - Verify product counts per use case: gifts(18), drinkware(5), business(14), decor(13), events(11), art(12)
  - Create GIN index on use_cases column for array containment queries
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 10.1, 10.2, 10.3_

- [x] 2. Update backend domain entity and EF Core configuration
  - [x] 2.1 Add UseCases property to Product entity
    - Open backend/Filamorfosis.Domain/Entities/Product.cs
    - Add `public string[] UseCases { get; set; } = [];` property
    - Preserve all existing properties (CategoryId, Slug, Titles, etc.)
    - _Requirements: 1.1, 1.5_
  
  - [x] 2.2 Configure EF Core mapping for use_cases column
    - Open backend/Filamorfosis.Infrastructure/Data/Configurations/ProductConfiguration.cs
    - Add property configuration: `builder.Property(p => p.UseCases).HasColumnName("use_cases").HasColumnType("text[]").IsRequired();`
    - _Requirements: 1.1, 1.5_
  
  - [x] 2.3 Generate and verify EF Core migration
    - Run `dotnet ef migrations add AddUseCasesToProducts` in backend/Filamorfosis.API
    - Verify migration detects existing column (no schema change needed)
    - _Requirements: 1.2, 1.3_

- [x] 3. Implement backend API use-case filtering
  - [x] 3.1 Add useCase parameter to ProductsController.GetAll method
    - Open backend/Filamorfosis.API/Controllers/ProductsController.cs
    - Add `[FromQuery] string? useCase = null` parameter to GetAll method signature
    - Preserve all existing parameters (page, pageSize, categoryId, search, badge)
    - _Requirements: 3.1, 3.5_
  
  - [x] 3.2 Implement use-case filter logic in query
    - After existing categoryId filter, add: `if (!string.IsNullOrWhiteSpace(useCase)) { query = query.Where(p => p.UseCases.Contains(useCase)); }`
    - Ensure filter uses PostgreSQL array containment operator (@>)
    - Maintain existing ProductSummaryDto response format
    - _Requirements: 3.2, 3.4, 3.6_
  
  - [x] 3.3 Verify backward compatibility with existing parameters
    - Test that categoryId, search, badge, page, pageSize parameters still work
    - Test that omitting useCase parameter returns all products
    - _Requirements: 3.3, 7.1, 7.6_

- [x] 4. Checkpoint - Verify backend implementation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Add translation keys for all 6 languages
  - [x] 5.1 Add Spanish translations (lang.es.js)
    - Open assets/js/i18n/lang.es.js
    - Add keys: cat_gifts: 'Regalos', cat_drinkware: 'Tazas y Vasos', cat_business: 'Empresarial', cat_decor: 'Decoración', cat_events: 'Eventos', cat_art: 'Arte y Diseño', cat_all: 'Todos'
    - _Requirements: 5.1, 5.2, 5.4, 5.5_
  
  - [x] 5.2 Add English translations (lang.en.js)
    - Open assets/js/i18n/lang.en.js
    - Add keys: cat_gifts: 'Gifts', cat_drinkware: 'Mugs & Drinkware', cat_business: 'Business', cat_decor: 'Home Decor', cat_events: 'Events', cat_art: 'Art & Design', cat_all: 'All'
    - _Requirements: 5.1, 5.2, 5.4, 5.5_
  
  - [x] 5.3 Add German translations (lang.de.js)
    - Open assets/js/i18n/lang.de.js
    - Add keys: cat_gifts: 'Geschenke', cat_drinkware: 'Tassen & Trinkgeschirr', cat_business: 'Geschäftlich', cat_decor: 'Dekoration', cat_events: 'Veranstaltungen', cat_art: 'Kunst & Design', cat_all: 'Alle'
    - _Requirements: 5.1, 5.2, 5.4, 5.5_
  
  - [x] 5.4 Add Portuguese translations (lang.pt.js)
    - Open assets/js/i18n/lang.pt.js
    - Add keys: cat_gifts: 'Presentes', cat_drinkware: 'Canecas e Copos', cat_business: 'Empresarial', cat_decor: 'Decoração', cat_events: 'Eventos', cat_art: 'Arte e Design', cat_all: 'Todos'
    - _Requirements: 5.1, 5.2, 5.4, 5.5_
  
  - [x] 5.5 Add Japanese translations (lang.ja.js)
    - Open assets/js/i18n/lang.ja.js
    - Add keys: cat_gifts: 'ギフト', cat_drinkware: 'マグ＆ドリンクウェア', cat_business: 'ビジネス', cat_decor: 'ホームデコ', cat_events: 'イベント', cat_art: 'アート＆デザイン', cat_all: 'すべて'
    - _Requirements: 5.1, 5.2, 5.4, 5.5_
  
  - [x] 5.6 Add Chinese translations (lang.zh.js)
    - Open assets/js/i18n/lang.zh.js
    - Add keys: cat_gifts: '礼品', cat_drinkware: '杯具', cat_business: '商务', cat_decor: '装饰', cat_events: '活动', cat_art: '艺术设计', cat_all: '全部'
    - _Requirements: 5.1, 5.2, 5.4, 5.5_

- [x] 6. Update frontend category structure and state management
  - [x] 6.1 Replace CATEGORIES array with use-case categories
    - Open assets/js/products.js
    - Replace existing CATEGORIES array with: `[{ id: 'gifts', label: 'cat_gifts', icon: '🎁', color: '#f97316' }, { id: 'drinkware', label: 'cat_drinkware', icon: '☕', color: '#8b5cf6' }, { id: 'business', label: 'cat_business', icon: '🏢', color: '#3b82f6' }, { id: 'decor', label: 'cat_decor', icon: '🖼️', color: '#ec4899' }, { id: 'events', label: 'cat_events', icon: '🎉', color: '#f59e0b' }, { id: 'art', label: 'cat_art', icon: '🎨', color: '#10b981' }, { id: 'all', label: 'cat_all', icon: '📦', color: '#6b7280' }]`
    - Store emoji icons as literal UTF-8 characters (not HTML entities or unicode escapes)
    - _Requirements: 4.1, 4.4, 5.4_
  
  - [x] 6.2 Update state variables for use-case navigation
    - Rename `activeCategory` to `activeUseCase` (or create new variable if needed)
    - Set default value to 'gifts' or 'all'
    - Remove old category slug mapping logic (CAT_SLUG_MAP)
    - _Requirements: 4.4_
  
  - [x] 6.3 Modify fetchProducts function to use useCase parameter
    - Update API call to send `useCase` query parameter instead of `categoryId`
    - Only send useCase parameter when activeUseCase !== 'all'
    - Preserve all existing parameters (page, pageSize, search, badge)
    - _Requirements: 3.1, 4.2, 4.3, 7.4, 7.6_

- [x] 7. Update frontend tab rendering and event handling
  - [x] 7.1 Modify renderTabs function for use-case categories
    - Update tab HTML to use `data-usecase` attribute instead of `data-cat`
    - Use `t(c.label)` for translated category labels (not hardcoded text)
    - Display emoji icons from CATEGORIES array
    - Apply 'active' class based on activeUseCase comparison
    - _Requirements: 4.1, 5.3, 8.2, 8.3, 8.4_
  
  - [x] 7.2 Update tab click event handlers
    - Update event listener to read `btn.dataset.usecase`
    - Set `activeUseCase = btn.dataset.usecase`
    - Reset pagination to page 1 and clear search query on tab click
    - Call renderTabs(), renderChips(), and loadProducts(true)
    - _Requirements: 4.2, 4.6_
  
  - [x] 7.3 Preserve existing filter chips and modal functionality
    - Verify Popular, Nuevo, Económico, Premium, Promo filters still work
    - Verify product modal (detail view, variant selection, add to cart) still works
    - Verify product card rendering (carousels, badges, pricing) unchanged
    - _Requirements: 4.5, 7.2, 7.3, 7.5_

- [-] 8. Checkpoint - Verify frontend implementation
  - **Status**: Frontend implementation complete. All code verified:
    - ✅ CATEGORIES array updated in products/data/catalog.js with 7 use-case categories
    - ✅ renderTabs() function uses data-usecase attributes and t(c.label) translations
    - ✅ Tab click handlers correctly update activeUseCase and call loadProducts()
    - ✅ Filter chips (Popular, Nuevo, Económico, Premium, Promo) preserved in renderChips()
    - ✅ Product modal (openModal, renderModal) functionality intact
    - ✅ Product card rendering with carousels, badges, pricing preserved in renderGrid()
    - ✅ All 6 language files loaded in index.html
    - ✅ No JavaScript errors detected
  - **Next**: Manual browser testing recommended to verify visual appearance and interactions

- [ ] 9. Write backend unit tests for use-case filtering
  - [~] 9.1 Test use-case filter returns only matching products
    - Create ProductsControllerTests.cs test: GetAll_WithUseCaseFilter_ReturnsOnlyMatchingProducts
    - Seed products with different use cases, call GetAll with useCase="gifts"
    - Assert all returned products contain "gifts" in UseCases array
    - _Requirements: 3.2, 6.2_
  
  - [~] 9.2 Test invalid use-case returns empty result
    - Create test: GetAll_WithInvalidUseCase_ReturnsEmptyResult
    - Call GetAll with useCase="invalid"
    - Assert result.Items is empty and TotalCount is 0
    - _Requirements: 10.5_
  
  - [~] 9.3 Test use-case combines with other filters
    - Create test: GetAll_WithUseCaseAndBadge_ReturnsCombinedFilter
    - Seed products with various use cases and badges
    - Call GetAll with useCase="gifts" and badge="hot"
    - Assert all returned products have both "gifts" use case AND "hot" badge
    - _Requirements: 3.5_
  
  - [~] 9.4 Test null use-case returns all products
    - Create test: GetAll_WithoutUseCase_ReturnsAllProducts
    - Call GetAll with useCase=null
    - Assert all active products returned
    - _Requirements: 3.3_

- [ ] 10. Write frontend unit tests for category navigation
  - [~] 10.1 Test category tabs render with correct translations
    - Create products.test.js test: renderTabs displays translated category labels
    - Set language to 'en', call renderTabs()
    - Assert tab labels match FilamorfosisI18n['en'] values
    - _Requirements: 5.3_
  
  - [~] 10.2 Test clicking category tab updates state and fetches products
    - Mock fetchProducts, click "Regalos" tab
    - Assert activeUseCase === 'gifts' and fetchProducts called with useCase='gifts'
    - _Requirements: 4.2_
  
  - [~] 10.3 Test "Todos" category does not send useCase parameter
    - Mock fetchProducts, click "Todos" tab
    - Assert fetchProducts called without useCase parameter
    - _Requirements: 4.3_

- [ ] 11. Write backend integration tests for end-to-end filtering
  - [~] 11.1 Test end-to-end use-case filtering
    - Create ProductsControllerIntegrationTests.cs test: GetProducts_WithUseCaseGifts_ReturnsExpectedProducts
    - Use real database with seeded products
    - HTTP GET /api/v1/products?useCase=gifts
    - Assert response contains 18 products, all tagged with "gifts"
    - _Requirements: 6.2, 10.4_
  
  - [~] 11.2 Test multi-category products appear in multiple filters
    - Create test: GetProducts_MultiCategoryProduct_AppearsInBothFilters
    - Seed product with use_cases = ["gifts", "drinkware"]
    - Fetch with useCase="gifts", then with useCase="drinkware"
    - Assert same product appears in both result sets
    - _Requirements: 6.1, 6.4_

- [ ] 12. Manual testing and validation
  - [~] 12.1 Verify product counts per category
    - Open products.html in browser
    - Click each category tab and verify product counts: Regalos(18), Tazas y Vasos(5), Empresarial(14), Decoración(13), Eventos(11), Arte y Diseño(12), Todos(36)
    - _Requirements: 6.2, 6.3, 6.5, 10.3_
  
  - [~] 12.2 Test multi-category product display
    - Identify products with multiple use cases (e.g., Tumblers in both Gifts and Drinkware)
    - Verify product appears in all relevant category tabs with identical information
    - _Requirements: 6.1, 6.4_
  
  - [~] 12.3 Test language switching for category labels
    - Switch to each of 6 languages (es, en, de, pt, ja, zh)
    - Verify category tab labels update correctly within 100ms
    - Verify emoji icons render correctly (no replacement characters)
    - _Requirements: 5.3, 5.4_
  
  - [~] 12.4 Test backward compatibility with existing features
    - Test search functionality across all categories
    - Test filter chips (Popular, Nuevo, Económico, Premium, Promo) in combination with categories
    - Test pagination and "Load More" within each category
    - Test product modal (detail view, variant selection, add to cart)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_
  
  - [~] 12.5 Test performance and user experience
    - Measure category tab switching time (should be <100ms for skeleton display)
    - Measure API response time (should be <200ms)
    - Verify smooth animations and no visual jumps during category switching
    - Verify scroll position preserved when using "Load More"
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [~] 12.6 Verify frontend standards compliance
    - Inspect HTML for inline style attributes (should be none)
    - Inspect HTML for hardcoded text (should use data-translate/data-t)
    - Verify all text elements have minimum 1rem font size
    - Check browser console for unused functions or commented code
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [~] 13. Final checkpoint and deployment preparation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The SQL migration script (PRODUCT-USE-CASE-TAGGING.sql) already exists and is ready to execute
- This feature does NOT require property-based testing (per design document)
- Checkpoints ensure incremental validation at key milestones
- Backend changes are minimal (one entity property, one controller parameter, one filter line)
- Frontend changes focus on category structure and state management
- All 6 language files must be updated to maintain multilingual support
- Backward compatibility is preserved (old categoryId parameter still works)
- Multi-category display is a core feature (products appear in multiple tabs)
