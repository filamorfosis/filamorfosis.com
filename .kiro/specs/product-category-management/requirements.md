# Requirements Document: Product Category Management System

## Introduction

The Product Category Management System enables Filamorfosis to organize products into hierarchical, customer-facing lifestyle categories (Gifts, Business, Weddings, etc.) rather than solely technical process categories (UV Printing, 3D Printing, etc.). This system provides administrators with tools to create, manage, and assign multilingual product categories, supporting a more intuitive browsing experience for customers across six languages (ES, EN, DE, PT, JA, ZH).

## Glossary

- **Product_Category_System**: The complete hierarchical category management system including database, admin interface, and assignment logic
- **Category_Manager**: The admin interface component for creating, editing, and organizing product categories
- **Category_Tree**: The hierarchical structure of categories with parent-child relationships
- **Category_Assignment_Interface**: The UI component within the product editor for assigning categories to products
- **Database_Layer**: The PostgreSQL database tables and Entity Framework Core models for category persistence
- **Multilingual_Field**: A field that stores translations in six languages (ES, EN, DE, PT, JA, ZH)
- **Product_Editor**: The existing admin modal for editing product details
- **Admin_Panel**: The existing Filamorfosis admin interface (admin.html)
- **Category_Seed_Service**: The service responsible for populating initial category structure

## Requirements

### Requirement 1: Category Data Model

**User Story:** As a system architect, I want a robust category data model, so that categories can be stored with multilingual support and hierarchical relationships.

#### Acceptance Criteria

1. THE Database_Layer SHALL create a ProductCategories table with columns: Id (GUID primary key), NameEs (text), NameEn (text), NameDe (text), NamePt (text), NameJa (text), NameZh (text), Slug (text unique), Description (text nullable), Icon (text nullable), DisplayOrder (integer), ParentId (GUID nullable foreign key), IsActive (boolean)
2. THE Database_Layer SHALL create a ProductCategoryAssignments junction table with columns: ProductId (GUID foreign key), CategoryId (GUID foreign key), and composite primary key on both columns
3. THE Database_Layer SHALL enforce foreign key constraints where ParentId references ProductCategories.Id and allows null for root categories
4. THE Database_Layer SHALL enforce foreign key constraints where ProductCategoryAssignments.ProductId references Products.Id and ProductCategoryAssignments.CategoryId references ProductCategories.Id
5. WHEN a category is deleted, THE Database_Layer SHALL prevent deletion if child categories exist (referential integrity)
6. WHEN a category is deleted, THE Database_Layer SHALL cascade delete all ProductCategoryAssignments records for that category
7. THE Database_Layer SHALL create indexes on Slug, ParentId, DisplayOrder, and IsActive columns for query performance

### Requirement 2: Category CRUD Operations

**User Story:** As an administrator, I want to create, read, update, and delete product categories, so that I can maintain the category structure.

#### Acceptance Criteria

1. WHEN an administrator submits a new category with valid data, THE Product_Category_System SHALL persist the category to the database and return the created category with generated Id
2. WHEN an administrator submits a new category with a duplicate slug, THE Product_Category_System SHALL return a validation error indicating the slug must be unique
3. WHEN an administrator requests all categories, THE Product_Category_System SHALL return all categories ordered by DisplayOrder ascending
4. WHEN an administrator requests a specific category by Id, THE Product_Category_System SHALL return the category with all fields including parent relationship
5. WHEN an administrator updates a category with valid data, THE Product_Category_System SHALL persist the changes and return the updated category
6. WHEN an administrator attempts to delete a category with child categories, THE Product_Category_System SHALL return a validation error preventing deletion
7. WHEN an administrator deletes a category without child categories, THE Product_Category_System SHALL remove the category and all associated ProductCategoryAssignments records
8. WHEN an administrator sets a category's ParentId to its own Id or a descendant's Id, THE Product_Category_System SHALL return a validation error preventing circular references

### Requirement 3: Category Manager Admin Interface

**User Story:** As an administrator, I want a dedicated admin tab for managing categories, so that I can visually organize the category hierarchy.

#### Acceptance Criteria

1. THE Admin_Panel SHALL display a new tab labeled "Categorías de Producto" in the main navigation
2. WHEN an administrator clicks the "Categorías de Producto" tab, THE Category_Manager SHALL display a hierarchical tree view of all categories with indentation showing parent-child relationships
3. THE Category_Manager SHALL display each category with its icon/emoji, name (in current admin language), active status indicator, and action buttons (Edit, Delete)
4. THE Category_Manager SHALL display a "Nueva Categoría" button at the top of the category list
5. WHEN an administrator clicks "Nueva Categoría", THE Category_Manager SHALL open a modal form with fields for all six language names, slug, description, icon, display order, parent category dropdown, and active status toggle
6. WHEN an administrator clicks Edit on a category, THE Category_Manager SHALL open the same modal form pre-populated with the category's current data
7. THE Category_Manager SHALL display categories in tree structure respecting DisplayOrder within each hierarchy level
8. WHEN an administrator submits the category form with valid data, THE Category_Manager SHALL save the category and refresh the tree view
9. WHEN an administrator submits the category form with invalid data, THE Category_Manager SHALL display validation errors without closing the modal
10. WHEN an administrator clicks Delete on a category with children, THE Category_Manager SHALL display an error message preventing deletion
11. WHEN an administrator clicks Delete on a category without children, THE Category_Manager SHALL display a confirmation dialog and delete upon confirmation

### Requirement 4: Multilingual Category Support

**User Story:** As an administrator, I want to provide category names in all six supported languages, so that customers see categories in their preferred language.

#### Acceptance Criteria

1. THE Category_Manager SHALL provide input fields for category names in all six languages: Spanish (ES), English (EN), German (DE), Portuguese (PT), Japanese (JA), and Chinese (ZH)
2. THE Category_Manager SHALL require at least the Spanish (ES) name field to be non-empty
3. THE Category_Manager SHALL allow other language fields to be optional and default to the Spanish name if not provided
4. THE Product_Category_System SHALL store all six language variants in their respective database columns
5. WHEN retrieving categories via API, THE Product_Category_System SHALL return all six language variants in the response
6. THE Category_Manager SHALL display category names in the current admin interface language (defaulting to Spanish if translation unavailable)

### Requirement 5: Product Category Assignment

**User Story:** As an administrator, I want to assign multiple categories to each product, so that products appear in relevant lifestyle categories.

#### Acceptance Criteria

1. THE Product_Editor SHALL display a "Categorías" section with a multi-select interface for assigning categories
2. THE Category_Assignment_Interface SHALL display categories in a hierarchical tree structure with checkboxes
3. THE Category_Assignment_Interface SHALL allow selecting multiple categories across different hierarchy levels
4. WHEN an administrator checks a category checkbox, THE Category_Assignment_Interface SHALL add that category to the product's assigned categories
5. WHEN an administrator unchecks a category checkbox, THE Category_Assignment_Interface SHALL remove that category from the product's assigned categories
6. WHEN an administrator saves the product, THE Product_Editor SHALL persist all category assignments to the ProductCategoryAssignments table
7. THE Category_Assignment_Interface SHALL display currently assigned categories with checked checkboxes when the product editor opens
8. THE Category_Assignment_Interface SHALL only display active categories (IsActive = true) for assignment

### Requirement 6: Product List Category Display

**User Story:** As an administrator, I want to see assigned categories in the product list, so that I can quickly identify product categorization.

#### Acceptance Criteria

1. THE Admin_Panel SHALL display a "Categorías" column in the products list table
2. WHEN displaying a product row, THE Admin_Panel SHALL show the names of all assigned categories separated by commas
3. THE Admin_Panel SHALL display category names in the current admin interface language
4. WHEN a product has no assigned categories, THE Admin_Panel SHALL display "Sin categorías" or equivalent translation
5. WHEN a product has more than three assigned categories, THE Admin_Panel SHALL display the first three category names followed by "+N más" where N is the remaining count

### Requirement 7: Initial Category Structure Seeding

**User Story:** As a system administrator, I want the initial category structure automatically created, so that the system is ready for immediate use.

#### Acceptance Criteria

1. THE Category_Seed_Service SHALL create the following root categories with Spanish names and English translations: "Regalos Personalizados" (Personalized Gifts), "Bodas & Eventos" (Weddings & Events), "Negocios & Branding" (Business & Branding), "Hogar & Decoración" (Home & Decor), "Mascotas" (Pets), "Geek & Hobby" (Geek & Hobby), "Ediciones Especiales" (Special Editions), "Personaliza el Tuyo" (Customize Yours)
2. THE Category_Seed_Service SHALL create child categories under "Regalos Personalizados": "Para él" (For Him), "Para ella" (For Her), "Cumpleaños" (Birthdays), "Aniversarios" (Anniversaries), "Regalos originales" (Original Gifts), "Menos de $500" (Under $500), "Menos de $1000" (Under $1000)
3. THE Category_Seed_Service SHALL create child categories under "Bodas & Eventos": "Recuerdos para invitados" (Guest Favors), "Decoración personalizada" (Custom Decoration), "Propuestas / compromiso" (Proposals / Engagement), "Bridal party" (Bridal Party)
4. THE Category_Seed_Service SHALL create child categories under "Negocios & Branding": "Regalos corporativos" (Corporate Gifts), "Artículos promocionales" (Promotional Items), "Señalización / placas" (Signage / Plaques), "Merch personalizado" (Custom Merch)
5. THE Category_Seed_Service SHALL create child categories under "Hogar & Decoración": "Decoración moderna" (Modern Decor), "Cocina & bar" (Kitchen & Bar), "Organización" (Organization), "Cuadros / arte personalizado" (Custom Art / Frames)
6. THE Category_Seed_Service SHALL create child categories under "Mascotas": "Placas personalizadas" (Custom Tags), "Recuerdos" (Memorials), "Accesorios" (Accessories)
7. THE Category_Seed_Service SHALL create child categories under "Geek & Hobby": "Gaming" (Gaming), "Anime / cultura pop" (Anime / Pop Culture), "Gadgets impresos 3D" (3D Printed Gadgets), "Accesorios personalizados" (Custom Accessories)
8. THE Category_Seed_Service SHALL create child categories under "Ediciones Especiales": "Tendencias" (Trending), "Temporada" (Seasonal), "Lo más vendido" (Best Sellers), "Nuevos productos" (New Products)
9. THE Category_Seed_Service SHALL assign appropriate emoji icons to each root category: 🎁 (Regalos), 💍 (Bodas), 🏢 (Negocios), 🏠 (Hogar), 🐾 (Mascotas), 🎮 (Geek), ✨ (Ediciones Especiales), ⚡ (Personaliza)
10. THE Category_Seed_Service SHALL set DisplayOrder values to maintain the specified category order within each hierarchy level
11. THE Category_Seed_Service SHALL set all seeded categories to IsActive = true
12. THE Category_Seed_Service SHALL generate URL-friendly slugs for all categories (e.g., "regalos-personalizados", "para-el", "bodas-eventos")
13. WHEN the seed service runs and categories already exist, THE Category_Seed_Service SHALL skip seeding to prevent duplicates

### Requirement 8: Category API Endpoints

**User Story:** As a frontend developer, I want RESTful API endpoints for category operations, so that the admin interface can interact with category data.

#### Acceptance Criteria

1. THE Product_Category_System SHALL expose a GET endpoint at `/api/v1/categories` that returns all categories with hierarchical structure
2. THE Product_Category_System SHALL expose a GET endpoint at `/api/v1/categories/{id}` that returns a single category by Id
3. THE Product_Category_System SHALL expose a POST endpoint at `/api/v1/categories` that creates a new category and returns the created resource
4. THE Product_Category_System SHALL expose a PUT endpoint at `/api/v1/categories/{id}` that updates an existing category and returns the updated resource
5. THE Product_Category_System SHALL expose a DELETE endpoint at `/api/v1/categories/{id}` that deletes a category if it has no children
6. THE Product_Category_System SHALL expose a GET endpoint at `/api/v1/products/{id}/categories` that returns all categories assigned to a product
7. THE Product_Category_System SHALL expose a PUT endpoint at `/api/v1/products/{id}/categories` that accepts an array of category Ids and replaces all category assignments for the product
8. WHEN any category endpoint is called without valid authentication, THE Product_Category_System SHALL return HTTP 401 Unauthorized
9. WHEN any category endpoint is called by a non-admin user, THE Product_Category_System SHALL return HTTP 403 Forbidden
10. WHEN any category endpoint receives invalid data, THE Product_Category_System SHALL return HTTP 400 Bad Request with validation error details in RFC 7807 Problem Details format

### Requirement 9: Category Slug Generation

**User Story:** As an administrator, I want URL-friendly slugs automatically generated from category names, so that categories can be used in future customer-facing URLs.

#### Acceptance Criteria

1. WHEN an administrator creates a category without providing a slug, THE Product_Category_System SHALL generate a slug from the Spanish name by converting to lowercase, replacing spaces with hyphens, and removing special characters
2. WHEN an administrator creates a category with a manually provided slug, THE Product_Category_System SHALL validate the slug contains only lowercase letters, numbers, and hyphens
3. THE Product_Category_System SHALL ensure generated or provided slugs are unique across all categories
4. WHEN a slug collision occurs, THE Product_Category_System SHALL append a numeric suffix (e.g., "regalos-personalizados-2") to ensure uniqueness
5. THE Product_Category_System SHALL preserve manually provided slugs without modification if they are valid and unique

### Requirement 10: Category Hierarchy Validation

**User Story:** As a system administrator, I want category hierarchy integrity enforced, so that circular references and orphaned categories cannot occur.

#### Acceptance Criteria

1. WHEN an administrator sets a category's ParentId, THE Product_Category_System SHALL verify the parent category exists in the database
2. WHEN an administrator sets a category's ParentId to its own Id, THE Product_Category_System SHALL return a validation error preventing self-reference
3. WHEN an administrator sets a category's ParentId to a descendant category, THE Product_Category_System SHALL return a validation error preventing circular reference
4. THE Product_Category_System SHALL support a maximum hierarchy depth of 3 levels (root → child → grandchild)
5. WHEN an administrator attempts to create a category with depth exceeding 3 levels, THE Product_Category_System SHALL return a validation error
6. WHEN an administrator changes a category's ParentId, THE Product_Category_System SHALL recalculate hierarchy depth for all descendants and validate the new structure

### Requirement 11: Category Active Status Management

**User Story:** As an administrator, I want to activate or deactivate categories, so that I can hide categories without deleting them.

#### Acceptance Criteria

1. THE Category_Manager SHALL display a toggle switch for the IsActive status in the category form
2. WHEN an administrator sets a category to inactive (IsActive = false), THE Product_Category_System SHALL persist the status change
3. WHEN a category is inactive, THE Category_Assignment_Interface SHALL not display the category in the assignment tree for new assignments
4. WHEN a category is inactive, THE Category_Manager SHALL display the category with a visual indicator (e.g., grayed out or "Inactiva" badge)
5. WHEN a category is inactive and already assigned to products, THE Admin_Panel SHALL still display the category name in the product list
6. THE Product_Category_System SHALL allow reactivating an inactive category by setting IsActive = true

### Requirement 12: Category Display Order Management

**User Story:** As an administrator, I want to control the display order of categories, so that I can prioritize important categories.

#### Acceptance Criteria

1. THE Category_Manager SHALL provide a numeric input field for DisplayOrder in the category form
2. THE Category_Manager SHALL display categories sorted by DisplayOrder ascending within each hierarchy level
3. WHEN an administrator creates a new category without specifying DisplayOrder, THE Product_Category_System SHALL assign a default value of 999
4. WHEN an administrator updates a category's DisplayOrder, THE Category_Manager SHALL re-sort the tree view immediately after save
5. THE Product_Category_System SHALL allow DisplayOrder values to be non-unique (multiple categories can have the same order)
6. WHEN multiple categories have the same DisplayOrder, THE Category_Manager SHALL sort them alphabetically by Spanish name as a secondary sort

## Out of Scope

The following items are explicitly out of scope for this specification and will be addressed in separate features:

- Customer-facing category navigation and browsing interface
- Category-based filtering in the public product catalog
- Category analytics and reporting (e.g., products per category, popular categories)
- Category images or banner graphics (only icons/emoji are supported)
- Drag-and-drop reordering in the admin interface (manual DisplayOrder editing only)
- Category descriptions displayed to customers (descriptions are admin-only notes)
- SEO metadata for categories (meta titles, descriptions, keywords)
- Category-based URL routing on the customer site
