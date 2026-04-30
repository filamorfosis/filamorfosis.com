# Implementation Plan: Product Category Management System

## Overview

This implementation plan breaks down the Product Category Management System into discrete coding tasks. The system introduces a hierarchical, multilingual category structure for organizing products into customer-facing lifestyle categories. Implementation follows a bottom-up approach: database layer → domain models → application services → API endpoints → frontend components.

## Tasks

- [x] 1. Set up database schema and domain entities
  - [x] 1.1 Create ProductCategory entity class
    - Create `backend/Filamorfosis.Domain/Entities/ProductCategory.cs` with all properties (Id, Name, Slug, Description, Icon, DisplayOrder, ParentId, IsActive)
    - Add navigation properties (Parent, Children, ProductAssignments)
    - _Requirements: 1.1_
  
  - [x] 1.2 Create ProductCategoryAssignment entity class
    - Create `backend/Filamorfosis.Domain/Entities/ProductCategoryAssignment.cs` with composite key properties
    - Add navigation properties (Product, Category)
    - _Requirements: 1.2_
  
  - [x] 1.3 Enhance Product entity with category relationships
    - Add `CategoryAssignments` collection navigation property to existing Product entity
    - _Requirements: 1.4_
  
  - [x] 1.4 Configure Entity Framework relationships in DbContext
    - Add `DbSet<ProductCategory>` and `DbSet<ProductCategoryAssignment>` to FilamorfosisDbContext
    - Configure entity relationships in `OnModelCreating` (self-referencing hierarchy, composite keys, cascade behaviors)
    - Add indexes on Slug, ParentId, DisplayOrder, IsActive
    - Add check constraint preventing self-reference
    - _Requirements: 1.1, 1.3, 1.5, 1.7_
  
  - [x] 1.5 Generate and apply EF Core migration
    - Run `dotnet ef migrations add AddProductCategories` to generate migration
    - Review generated migration for correctness
    - Apply migration to development database
    - _Requirements: 1.1, 1.2_

- [x] 2. Implement slug generation service
  - [x] 2.1 Create ISlugGenerationService interface and implementation
    - Create `backend/Filamorfosis.Application/Services/SlugGenerationService.cs`
    - Implement `GenerateSlug(string text)` method (lowercase, replace spaces with hyphens, remove special characters, handle Spanish accents)
    - Implement `EnsureUniqueSlugAsync(string baseSlug, Guid? excludeId)` method with collision handling (append -2, -3, etc.)
    - Implement `IsValidSlug(string slug)` validation method (regex: lowercase letters, numbers, hyphens only)
    - _Requirements: 9.1, 9.2, 9.4_
  
  - [x] 2.2 Write unit tests for slug generation
    - Test slug generation from Spanish text with spaces, accents, special characters
    - Test unique slug generation with collision handling
    - Test slug validation regex (valid and invalid patterns)
    - _Requirements: 9.1, 9.2, 9.4_

- [x] 3. Implement category validation service
  - [x] 3.1 Create ICategoryValidationService interface and implementation
    - Create `backend/Filamorfosis.Application/Services/CategoryValidationService.cs`
    - Implement `ValidateCreateAsync(CreateCategoryRequest)` method
    - Implement `ValidateUpdateAsync(Guid, UpdateCategoryRequest)` method
    - Implement `ValidateDeleteAsync(Guid)` method
    - Implement `HasCircularReferenceAsync(Guid, Guid?)` method with graph traversal
    - Implement `GetHierarchyDepthAsync(Guid)` method
    - _Requirements: 2.2, 2.8, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_
  
  - [x] 3.2 Write unit tests for category validation
    - Test required field validation (Name)
    - Test slug format validation
    - Test circular reference detection (direct, indirect, multi-level)
    - Test hierarchy depth calculation (0, 1, 2, 3+ levels)
    - Test parent existence validation
    - Test max depth enforcement
    - _Requirements: 2.2, 2.8, 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 4. Create DTOs for category operations
  - [x] 4.1 Create category DTOs
    - Create `backend/Filamorfosis.Application/DTOs/CategoryDto.cs` with all fields and Children collection
    - Create `CreateCategoryRequest` DTO with validation attributes
    - Create `UpdateCategoryRequest` DTO with optional fields
    - Create `AssignCategoriesRequest` DTO with CategoryIds list
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.7_

- [x] 5. Implement category seed service
  - [x] 5.1 Create CategorySeedService with initial data
    - Create `backend/Filamorfosis.Infrastructure/Data/CategorySeedService.cs`
    - Implement `SeedCategoriesAsync(FilamorfosisDbContext)` method
    - Add all root categories with Spanish/English names and emoji icons (Regalos 🎁, Bodas 💍, Negocios 🏢, Hogar 🏠, Mascotas 🐾, Geek 🎮, Ediciones Especiales ✨, Personaliza ⚡)
    - Add all child categories under each root category as specified in requirements
    - Generate slugs for all categories
    - Set DisplayOrder values to maintain specified order
    - Add idempotency check (skip if categories already exist)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10, 7.11, 7.12, 7.13_
  
  - [x] 5.2 Integrate seed service into application startup
    - Call CategorySeedService from Program.cs or DbSeeder in Development/Testing environments
    - _Requirements: 7.13_

- [x] 6. Checkpoint - Ensure database layer is functional
  - Ensure all tests pass, verify migration applied successfully, confirm seed data populates correctly, ask the user if questions arise.

- [x] 7. Implement AdminCategoriesController API endpoints
  - [x] 7.1 Create AdminCategoriesController with GET all categories endpoint
    - Create `backend/Filamorfosis.API/Controllers/AdminCategoriesController.cs`
    - Add `[Authorize(Roles = "Master,ProductManagement")]` and `[RequireMfa]` attributes
    - Implement `GET /api/v1/categories` endpoint returning hierarchical structure
    - Load categories with Include for Children navigation property
    - Order by DisplayOrder, then by Name
    - Map entities to CategoryDto with nested children
    - _Requirements: 8.1, 8.8, 8.9_
  
  - [x] 7.2 Implement GET single category endpoint
    - Implement `GET /api/v1/categories/{id}` endpoint
    - Return 404 if category not found
    - Map entity to CategoryDto
    - _Requirements: 8.2, 8.8, 8.9_
  
  - [x] 7.3 Implement POST create category endpoint
    - Implement `POST /api/v1/categories` endpoint
    - Call CategoryValidationService.ValidateCreateAsync
    - Generate slug if not provided using SlugGenerationService
    - Ensure slug uniqueness
    - Create ProductCategory entity and save to database
    - Return 201 Created with created CategoryDto
    - Return 400/422 for validation errors in RFC 7807 format
    - _Requirements: 2.1, 2.2, 8.3, 8.8, 8.9, 8.10, 9.1, 9.2, 9.3, 9.4_
  
  - [x] 7.4 Implement PUT update category endpoint
    - Implement `PUT /api/v1/categories/{id}` endpoint
    - Call CategoryValidationService.ValidateUpdateAsync
    - Update only provided fields (partial update)
    - Validate slug uniqueness if slug is being changed
    - Check for circular references if ParentId is being changed
    - Return 200 OK with updated CategoryDto
    - Return 404 if category not found, 400/422 for validation errors
    - _Requirements: 2.5, 2.8, 8.4, 8.8, 8.9, 8.10, 10.6_
  
  - [x] 7.5 Implement DELETE category endpoint
    - Implement `DELETE /api/v1/categories/{id}` endpoint
    - Call CategoryValidationService.ValidateDeleteAsync
    - Check if category has children (prevent deletion if true)
    - Delete category (cascade delete ProductCategoryAssignments via EF configuration)
    - Return 204 No Content on success
    - Return 404 if not found, 409 if category has children
    - _Requirements: 2.6, 2.7, 8.5, 8.8, 8.9_
  
  - [x] 7.6 Write integration tests for AdminCategoriesController
    - Test GET /categories returns hierarchical structure
    - Test POST /categories creates category with generated slug
    - Test PUT /categories updates category fields
    - Test DELETE /categories prevents deletion with children
    - Test authorization (401/403 responses for unauthorized users)
    - Test validation error responses (400/422)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.8, 8.9, 8.10_

- [x] 8. Implement product category assignment endpoints
  - [x] 8.1 Add GET product categories endpoint to AdminProductsController
    - Implement `GET /api/v1/admin/products/{id}/categories` endpoint in existing AdminProductsController
    - Load product with CategoryAssignments.Category navigation property
    - Return list of CategoryDto objects
    - Return 404 if product not found
    - _Requirements: 8.6, 8.8, 8.9_
  
  - [x] 8.2 Add PUT product categories endpoint to AdminProductsController
    - Implement `PUT /api/v1/admin/products/{id}/categories` endpoint
    - Accept AssignCategoriesRequest with CategoryIds array
    - Validate all category IDs exist in database
    - Remove all existing ProductCategoryAssignments for the product
    - Create new ProductCategoryAssignments for provided category IDs
    - Return 200 OK with updated category list
    - Return 404 if product not found, 400 if invalid category IDs
    - _Requirements: 5.6, 8.7, 8.8, 8.9, 8.10_
  
  - [x] 8.3 Write integration tests for product category assignment
    - Test GET /products/{id}/categories returns assigned categories
    - Test PUT /products/{id}/categories replaces assignments
    - Test validation for invalid category IDs
    - Test cascade delete when category is deleted
    - _Requirements: 5.6, 5.7, 8.6, 8.7_

- [x] 9. Checkpoint - Ensure API layer is complete
  - Ensure all tests pass, verify all endpoints return correct responses, test authorization and validation, ask the user if questions arise.

- [ ] 10. Create admin categories frontend module
  - [x] 10.1 Create admin-categories.js module structure
    - Create `assets/js/admin-categories.js` with IIFE module pattern
    - Implement `init()` function to set up event listeners
    - Implement `loadCategories()` async function to fetch categories from API
    - Implement `getCategories()` function to return cached categories for other modules
    - Store categories in module-scoped variable for reuse
    - _Requirements: 3.1, 3.2_
  
  - [x] 10.2 Implement category tree rendering
    - Implement `renderCategoryTree(categories)` function
    - Render hierarchical tree with indentation for parent-child relationships
    - Display icon/emoji, name (in current admin language), active status indicator
    - Add Edit and Delete action buttons for each category
    - Sort categories by DisplayOrder, then alphabetically by name
    - Display inactive categories with visual indicator (grayed out or "Inactiva" badge)
    - _Requirements: 3.2, 3.3, 3.7, 11.4_
  
  - [x] 10.3 Implement category CRUD modal
    - Implement `openAddCategoryModal()` function to open empty form
    - Implement `openEditCategoryModal(id)` function to open pre-populated form
    - Create modal HTML structure with fields: Name, Slug, Description, Icon, DisplayOrder, ParentId dropdown, IsActive toggle
    - Implement `saveCategoryModal(event)` async function to POST/PUT category
    - Display validation errors without closing modal
    - Refresh tree view after successful save
    - _Requirements: 3.4, 3.5, 3.6, 3.8, 3.9, 11.1, 12.1_
  
  - [x] 10.4 Implement category deletion
    - Implement `deleteCategory(id)` async function
    - Display confirmation dialog before deletion
    - Call DELETE endpoint
    - Display error message if category has children (409 response)
    - Refresh tree view after successful deletion
    - _Requirements: 3.10, 3.11_

- [ ] 11. Add category management tab to admin interface
  - [x] 11.1 Add "Categorías de Producto" tab to admin.html
    - Add new tab button in admin.html navigation
    - Add corresponding tab content container
    - Add "Nueva Categoría" button at top of category list
    - _Requirements: 3.1, 3.4_
  
  - [x] 11.2 Initialize admin-categories module on page load
    - Call `AdminCategories.init()` in admin.html or admin-ui.js
    - Load and render categories when tab is activated
    - _Requirements: 3.2_

- [ ] 12. Enhance product editor with category assignment UI
  - [x] 12.1 Add category assignment section to product editor modal
    - Modify existing product editor modal in admin.html to include "Categorías" section
    - Add container for category assignment UI
    - _Requirements: 5.1_
  
  - [x] 12.2 Implement category assignment tree rendering in admin-products.js
    - Implement `_renderCategoryAssignmentUI(product)` function in admin-products.js
    - Fetch categories from AdminCategories.getCategories()
    - Render hierarchical checkbox tree with indentation
    - Only display active categories (IsActive = true)
    - Pre-check checkboxes for currently assigned categories
    - _Requirements: 5.2, 5.3, 5.7, 5.8_
  
  - [x] 12.3 Implement category assignment save logic
    - Implement `_saveCategoryAssignments(productId, selectedCategoryIds)` function
    - Collect checked category IDs from checkbox tree
    - Call PUT /api/v1/products/{id}/categories endpoint
    - Handle validation errors
    - _Requirements: 5.4, 5.5, 5.6_

- [x] 13. Add category display to product list
  - [x] 13.1 Add "Categorías" column to product list table
    - Modify product list table in admin.html to include "Categorías" column header
    - _Requirements: 6.1_
  
  - [x] 13.2 Render category names in product list rows
    - Modify product list rendering in admin-products.js to display assigned categories
    - Display category names in current admin language, separated by commas
    - Display "Sin categorías" if no categories assigned
    - Display first 3 categories + "+N más" if more than 3 categories
    - _Requirements: 6.2, 6.3, 6.4, 6.5_

- [x] 14. Add internationalization for category management UI
  - [x] 14.1 Add category management translation keys to all language files
    - Add keys to `assets/js/i18n/lang.es.js`: "admin_categories_tab", "admin_new_category", "admin_category_name", "admin_category_slug", "admin_category_description", "admin_category_icon", "admin_category_display_order", "admin_category_parent", "admin_category_active", "admin_category_save", "admin_category_delete_confirm", "admin_category_has_children_error", "admin_categories_column", "admin_no_categories", "admin_more_categories"
    - Add corresponding translations to all other language files (en, de, pt, ja, zh)
    - _Requirements: 3.3, 3.4, 3.5, 6.4_
  
  - [x] 14.2 Apply translation attributes to category UI elements
    - Add `data-translate` or `data-t` attributes to all category management UI elements
    - Ensure modal labels, buttons, and messages use translation keys
    - _Requirements: 3.3, 3.4, 3.5_

- [x] 15. Final integration and testing
  - [x] 15.1 Test complete category CRUD workflow
    - Create root category with all fields
    - Create child category under root
    - Create grandchild category (3rd level)
    - Attempt to create great-grandchild (should fail with validation error)
    - Update category fields (name, slug, display order, parent, active status)
    - Delete category without children (should succeed)
    - Attempt to delete category with children (should fail)
    - _Requirements: 2.1, 2.2, 2.5, 2.6, 10.4, 10.5_
  
  - [x] 15.2 Test category assignment workflow
    - Assign multiple categories to a product
    - Verify categories display in product list
    - Verify categories persist after page reload
    - Remove category assignments
    - Verify "Sin categorías" displays when no categories assigned
    - _Requirements: 5.3, 5.4, 5.5, 5.6, 6.2, 6.4_
  
  - [x] 15.3 Test hierarchy validation
    - Attempt to set category as its own parent (should fail)
    - Attempt to create circular reference (should fail)
    - Verify max depth enforcement (3 levels)
    - _Requirements: 2.8, 10.2, 10.3, 10.5, 10.6_
  
  - [x] 15.4 Test slug generation and uniqueness
    - Create category without slug (verify auto-generation from Spanish name)
    - Create category with manual slug (verify validation)
    - Create category with duplicate slug (verify collision handling with -2, -3 suffix)
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  
  - [x] 15.5 Test active status management
    - Deactivate a category
    - Verify it's hidden in assignment UI
    - Verify it still displays in product list if already assigned
    - Reactivate category and verify it reappears in assignment UI
    - _Requirements: 11.2, 11.3, 11.4, 11.5, 11.6_
  
  - [x] 15.6 Test multilingual support
    - Verify seed data includes all 6 language translations
    - Verify API returns all language fields
    - Verify admin UI displays names in current language
    - _Requirements: 4.1, 4.2, 4.4, 4.5, 4.6_
  
  - [x] 15.7 Test display order functionality
    - Create categories with different DisplayOrder values
    - Verify tree view sorts by DisplayOrder
    - Update DisplayOrder and verify re-sorting
    - Test categories with same DisplayOrder (verify alphabetical secondary sort)
    - _Requirements: 12.2, 12.3, 12.4, 12.5, 12.6_

- [x] 16. Final checkpoint - Ensure all functionality is complete
  - Ensure all tests pass, verify all requirements are met, confirm UI is polished and responsive, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at major milestones
- Backend tasks (1-9) can proceed independently of frontend tasks (10-15)
- Seed service (task 5) should be tested early to provide data for frontend development
- Integration tests validate end-to-end flows and catch integration issues
- Manual testing checklist (15.1-15.7) ensures all user-facing scenarios work correctly
