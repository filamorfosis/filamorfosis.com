# Design Document: Product Category Management System

## Overview

The Product Category Management System introduces a hierarchical, multilingual category structure for organizing products into customer-facing lifestyle categories (Gifts, Business, Weddings, etc.) alongside the existing technical process categories (UV Printing, 3D Printing, etc.). This design implements a complete category management solution including database schema, RESTful API endpoints, admin interface components, and automatic category seeding.

### Key Design Decisions

1. **Dual Category System**: Products retain their existing `ProcessId` (technical categorization) while gaining support for multiple lifestyle categories through a many-to-many relationship
2. **Multilingual First**: All category names stored in six languages (ES, EN, DE, PT, JA, ZH) at the database level
3. **Hierarchical Structure**: Maximum 3-level depth (root → child → grandchild) with parent-child relationships
4. **Active Status Management**: Soft deletion via `IsActive` flag preserves historical data
5. **Automatic Slug Generation**: URL-friendly slugs generated from Spanish names with collision handling
6. **Admin-Only Scope**: This phase focuses exclusively on admin management; customer-facing features are out of scope

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Admin Frontend                           │
│  ┌──────────────────┐  ┌───────────────────────────────┐   │
│  │  Category Manager │  │  Product Editor (Enhanced)    │   │
│  │  - Tree View      │  │  - Category Assignment UI     │   │
│  │  - CRUD Forms     │  │  - Multi-select Checkboxes    │   │
│  └────────┬──────────┘  └──────────────┬────────────────┘   │
│           │                             │                     │
└───────────┼─────────────────────────────┼─────────────────────┘
            │                             │
            │         HTTP/JSON           │
            ▼                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    ASP.NET Core API                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  AdminCategoriesController                           │   │
│  │  - GET /api/v1/categories                            │   │
│  │  - POST /api/v1/categories                           │   │
│  │  - PUT /api/v1/categories/{id}                       │   │
│  │  - DELETE /api/v1/categories/{id}                    │   │
│  └──────────────────┬───────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  AdminProductsController (Enhanced)                  │   │
│  │  - GET /api/v1/products/{id}/categories              │   │
│  │  - PUT /api/v1/products/{id}/categories              │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                     │                                         │
│  ┌──────────────────▼───────────────────────────────────┐   │
│  │  CategorySeedService                                 │   │
│  │  - SeedCategoriesAsync()                             │   │
│  └──────────────────┬───────────────────────────────────┘   │
└────────────────────┼─────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              PostgreSQL / SQLite Database                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ProductCategories                                   │   │
│  │  - Id, NameEs, NameEn, NameDe, NamePt, NameJa,      │   │
│  │    NameZh, Slug, Description, Icon, DisplayOrder,   │   │
│  │    ParentId, IsActive                                │   │
│  └──────────────────┬───────────────────────────────────┘   │
│  ┌──────────────────▼───────────────────────────────────┐   │
│  │  ProductCategoryAssignments (Junction Table)        │   │
│  │  - ProductId, CategoryId (Composite PK)              │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Backend**: ASP.NET Core 8, Entity Framework Core 8
- **Database**: PostgreSQL (production) / SQLite (development)
- **Frontend**: Vanilla JavaScript, jQuery (existing admin patterns)
- **Authentication**: JWT Bearer tokens with MFA (existing system)
- **Authorization**: Role-based (Master, ProductManagement roles)

## Components and Interfaces

### Backend Components

#### 1. Domain Entities

**ProductCategory.cs** (new)
```csharp
namespace Filamorfosis.Domain.Entities;

public class ProductCategory
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Icon { get; set; }
    public int DisplayOrder { get; set; } = 999;
    public Guid? ParentId { get; set; }
    public bool IsActive { get; set; } = true;
    
    // Navigation properties
    public ProductCategory? Parent { get; set; }
    public ICollection<ProductCategory> Children { get; set; } = new List<ProductCategory>();
    public ICollection<ProductCategoryAssignment> ProductAssignments { get; set; } = new List<ProductCategoryAssignment>();
}
```

**ProductCategoryAssignment.cs** (new)
```csharp
namespace Filamorfosis.Domain.Entities;

public class ProductCategoryAssignment
{
    public Guid ProductId { get; set; }
    public Guid CategoryId { get; set; }
    
    // Navigation properties
    public Product Product { get; set; } = null!;
    public ProductCategory Category { get; set; } = null!;
}
```

**Product.cs** (enhanced)
```csharp
// Add to existing Product entity:
public ICollection<ProductCategoryAssignment> CategoryAssignments { get; set; } = new List<ProductCategoryAssignment>();
```

#### 2. DTOs

**CategoryDto.cs**
```csharp
namespace Filamorfosis.Application.DTOs;

public class CategoryDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Icon { get; set; }
    public int DisplayOrder { get; set; }
    public Guid? ParentId { get; set; }
    public bool IsActive { get; set; }
    public List<CategoryDto> Children { get; set; } = new();
}

public class CreateCategoryRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? Description { get; set; }
    public string? Icon { get; set; }
    public int DisplayOrder { get; set; } = 999;
    public Guid? ParentId { get; set; }
    public bool IsActive { get; set; } = true;
}

public class UpdateCategoryRequest
{
    public string? Name { get; set; }
    public string? Slug { get; set; }
    public string? Description { get; set; }
    public string? Icon { get; set; }
    public int? DisplayOrder { get; set; }
    public Guid? ParentId { get; set; }
    public bool? IsActive { get; set; }
}

public class AssignCategoriesRequest
{
    public List<Guid> CategoryIds { get; set; } = new();
}
```

#### 3. API Controller

**AdminCategoriesController.cs** (new)
```csharp
[ApiController]
[Route("api/v1/categories")]
[Authorize(Roles = "Master,ProductManagement")]
[RequireMfa]
public class AdminCategoriesController : ControllerBase
{
    // GET /api/v1/categories
    // POST /api/v1/categories
    // GET /api/v1/categories/{id}
    // PUT /api/v1/categories/{id}
    // DELETE /api/v1/categories/{id}
}
```

**AdminProductsController.cs** (enhanced)
```csharp
// Add new endpoints:
// GET /api/v1/products/{id}/categories
// PUT /api/v1/products/{id}/categories
```

#### 4. Validation Service

**CategoryValidationService.cs** (new)
```csharp
public interface ICategoryValidationService
{
    Task<ValidationResult> ValidateCreateAsync(CreateCategoryRequest request);
    Task<ValidationResult> ValidateUpdateAsync(Guid id, UpdateCategoryRequest request);
    Task<ValidationResult> ValidateDeleteAsync(Guid id);
    Task<bool> HasCircularReferenceAsync(Guid categoryId, Guid? newParentId);
    Task<int> GetHierarchyDepthAsync(Guid categoryId);
}
```

#### 5. Slug Generation Service

**SlugGenerationService.cs** (new)
```csharp
public interface ISlugGenerationService
{
    string GenerateSlug(string text);
    Task<string> EnsureUniqueSlugAsync(string baseSlug, Guid? excludeId = null);
    bool IsValidSlug(string slug);
}
```

#### 6. Category Seed Service

**CategorySeedService.cs** (new)
```csharp
public class CategorySeedService
{
    public async Task SeedCategoriesAsync(FilamorfosisDbContext db);
}
```

### Frontend Components

#### 1. Category Manager Module

**admin-categories.js** (new)
```javascript
(function (window) {
  'use strict';

  const AdminCategories = {
    init: function() {},
    loadCategories: async function() {},
    renderCategoryTree: function(categories) {},
    openAddCategoryModal: function() {},
    openEditCategoryModal: function(id) {},
    saveCategoryModal: async function(event) {},
    deleteCategory: async function(id) {},
    getCategories: function() {} // Returns cached categories for other modules
  };

  window.AdminCategories = AdminCategories;
})(window);
```

#### 2. Product Editor Enhancement

**admin-products.js** (enhanced)
```javascript
// Add to existing module:
function _renderCategoryAssignmentUI(product) {
  // Render hierarchical checkbox tree
}

function _saveCategoryAssignments(productId, selectedCategoryIds) {
  // PUT /api/v1/products/{id}/categories
}
```

#### 3. Admin UI Components

**New Tab**: "Categorías de Producto" in admin.html navigation
**New Modal**: Category create/edit form with multilingual fields
**Enhanced Modal**: Product editor with category assignment section

## Data Models

### Database Schema

#### ProductCategories Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| Id | GUID | PRIMARY KEY | Unique identifier |
| Name | TEXT | NOT NULL | Spanish name |
| Slug | TEXT | NOT NULL, UNIQUE | URL-friendly identifier |
| Description | TEXT | NULL | Admin notes |
| Icon | TEXT | NULL | Emoji or icon identifier |
| DisplayOrder | INTEGER | NOT NULL, DEFAULT 999 | Sort order within level |
| ParentId | GUID | NULL, FK → ProductCategories.Id | Parent category reference |
| IsActive | BOOLEAN | NOT NULL, DEFAULT TRUE | Visibility flag |

**Indexes**:
- `IX_ProductCategories_Slug` (UNIQUE)
- `IX_ProductCategories_ParentId`
- `IX_ProductCategories_DisplayOrder`
- `IX_ProductCategories_IsActive`

**Constraints**:
- `FK_ProductCategories_ParentId` FOREIGN KEY (ParentId) REFERENCES ProductCategories(Id) ON DELETE RESTRICT
- `CK_ProductCategories_NoSelfReference` CHECK (Id != ParentId)

#### ProductCategoryAssignments Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| ProductId | GUID | PRIMARY KEY (composite) | Product reference |
| CategoryId | GUID | PRIMARY KEY (composite) | Category reference |

**Constraints**:
- `PK_ProductCategoryAssignments` PRIMARY KEY (ProductId, CategoryId)
- `FK_ProductCategoryAssignments_ProductId` FOREIGN KEY (ProductId) REFERENCES Products(Id) ON DELETE CASCADE
- `FK_ProductCategoryAssignments_CategoryId` FOREIGN KEY (CategoryId) REFERENCES ProductCategories(Id) ON DELETE CASCADE

### Entity Framework Configuration

```csharp
// In FilamorfosisDbContext.OnModelCreating():

modelBuilder.Entity<ProductCategory>(entity =>
{
    entity.HasKey(c => c.Id);
    
    entity.Property(c => c.Name).IsRequired();
    entity.Property(c => c.Slug).IsRequired();
    entity.Property(c => c.DisplayOrder).HasDefaultValue(999);
    entity.Property(c => c.IsActive).HasDefaultValue(true);
    
    entity.HasIndex(c => c.Slug).IsUnique();
    entity.HasIndex(c => c.ParentId);
    entity.HasIndex(c => c.DisplayOrder);
    entity.HasIndex(c => c.IsActive);
    
    entity.HasOne(c => c.Parent)
          .WithMany(c => c.Children)
          .HasForeignKey(c => c.ParentId)
          .OnDelete(DeleteBehavior.Restrict);
});

modelBuilder.Entity<ProductCategoryAssignment>(entity =>
{
    entity.HasKey(pca => new { pca.ProductId, pca.CategoryId });
    
    entity.HasOne(pca => pca.Product)
          .WithMany(p => p.CategoryAssignments)
          .HasForeignKey(pca => pca.ProductId)
          .OnDelete(DeleteBehavior.Cascade);
    
    entity.HasOne(pca => pca.Category)
          .WithMany(c => c.ProductAssignments)
          .HasForeignKey(pca => pca.CategoryId)
          .OnDelete(DeleteBehavior.Cascade);
});
```

### Data Relationships

```
ProductCategory (1) ──< (N) ProductCategory [self-referencing hierarchy]
                 │
                 │ (1)
                 │
                 ▼
                (N) ProductCategoryAssignment (N)
                                │
                                │
                                ▼
                              Product
```

## API Endpoints

### Category Management Endpoints

#### GET /api/v1/categories
**Description**: Retrieve all categories with hierarchical structure  
**Authorization**: Master, ProductManagement  
**Response**: 200 OK
```json
[
  {
    "id": "guid",
    "nameEs": "Regalos Personalizados",
    "nameEn": "Personalized Gifts",
    "nameDe": "Personalisierte Geschenke",
    "namePt": "Presentes Personalizados",
    "nameJa": "パーソナライズされたギフト",
    "nameZh": "个性化礼品",
    "slug": "regalos-personalizados",
    "description": null,
    "icon": "🎁",
    "displayOrder": 1,
    "parentId": null,
    "isActive": true,
    "children": [
      {
        "id": "guid",
        "nameEs": "Para él",
        "nameEn": "For Him",
        "slug": "para-el",
        "displayOrder": 1,
        "parentId": "parent-guid",
        "isActive": true,
        "children": []
      }
    ]
  }
]
```

#### GET /api/v1/categories/{id}
**Description**: Retrieve a single category by ID  
**Authorization**: Master, ProductManagement  
**Response**: 200 OK (same structure as above, single object)  
**Error**: 404 Not Found

#### POST /api/v1/categories
**Description**: Create a new category  
**Authorization**: Master, ProductManagement  
**Request Body**:
```json
{
  "name": "Regalos Personalizados",
  "slug": "regalos-personalizados",
  "description": "Categoría principal para regalos",
  "icon": "🎁",
  "displayOrder": 1,
  "parentId": null,
  "isActive": true
}
```
**Response**: 201 Created (returns created category)  
**Errors**:
- 400 Bad Request (validation errors)
- 422 Unprocessable Entity (duplicate slug, circular reference, max depth exceeded)

#### PUT /api/v1/categories/{id}
**Description**: Update an existing category  
**Authorization**: Master, ProductManagement  
**Request Body**: Same as POST (all fields optional)  
**Response**: 200 OK (returns updated category)  
**Errors**: 400, 404, 422

#### DELETE /api/v1/categories/{id}
**Description**: Delete a category (only if no children exist)  
**Authorization**: Master, ProductManagement  
**Response**: 204 No Content  
**Errors**:
- 404 Not Found
- 409 Conflict (category has children)

### Product Category Assignment Endpoints

#### GET /api/v1/products/{id}/categories
**Description**: Get all categories assigned to a product  
**Authorization**: Master, ProductManagement  
**Response**: 200 OK
```json
[
  {
    "id": "guid",
    "nameEs": "Regalos Personalizados",
    "slug": "regalos-personalizados",
    "icon": "🎁"
  }
]
```

#### PUT /api/v1/products/{id}/categories
**Description**: Replace all category assignments for a product  
**Authorization**: Master, ProductManagement  
**Request Body**:
```json
{
  "categoryIds": ["guid1", "guid2", "guid3"]
}
```
**Response**: 200 OK (returns updated assignments)  
**Errors**:
- 400 Bad Request (invalid category IDs)
- 404 Not Found (product not found)

### Error Response Format (RFC 7807)

```json
{
  "type": "https://filamorfosis.com/errors/validation",
  "title": "Validation Error",
  "status": 400,
  "detail": "El slug 'regalos-personalizados' ya existe.",
  "errors": {
    "slug": ["Slug must be unique"]
  }
}
```

## Error Handling

### Validation Rules

#### Category Creation/Update
1. **NameEs Required**: Spanish name must not be empty
2. **Slug Uniqueness**: Slug must be unique across all categories
3. **Slug Format**: Only lowercase letters, numbers, and hyphens
4. **Parent Existence**: ParentId must reference an existing category
5. **No Self-Reference**: Category cannot be its own parent
6. **No Circular Reference**: Category cannot have a descendant as parent
7. **Max Depth**: Hierarchy cannot exceed 3 levels
8. **Display Order**: Must be non-negative integer

#### Category Deletion
1. **No Children**: Cannot delete category with child categories
2. **Cascade Assignments**: ProductCategoryAssignments are cascade deleted

### Error Scenarios

| Scenario | HTTP Status | Error Type | Message |
|----------|-------------|------------|---------|
| Missing Name | 400 | Validation | "El nombre es requerido" |
| Duplicate slug | 422 | Conflict | "El slug '{slug}' ya existe" |
| Invalid slug format | 400 | Validation | "El slug solo puede contener letras minúsculas, números y guiones" |
| Parent not found | 400 | Validation | "La categoría padre no existe" |
| Self-reference | 422 | Conflict | "Una categoría no puede ser su propio padre" |
| Circular reference | 422 | Conflict | "Referencia circular detectada en la jerarquía" |
| Max depth exceeded | 422 | Conflict | "La jerarquía no puede exceder 3 niveles" |
| Delete with children | 409 | Conflict | "No se puede eliminar: la categoría tiene subcategorías" |
| Category not found | 404 | Not Found | "Categoría no encontrada" |

### Validation Implementation

```csharp
public class CategoryValidationService : ICategoryValidationService
{
    public async Task<ValidationResult> ValidateCreateAsync(CreateCategoryRequest request)
    {
        var errors = new List<string>();
        
        // Required field validation
        if (string.IsNullOrWhiteSpace(request.Name))
            errors.Add("El nombre en es requerido");
        
        // Slug validation
        if (!string.IsNullOrEmpty(request.Slug) && !IsValidSlug(request.Slug))
            errors.Add("El slug solo puede contener letras minúsculas, números y guiones");
        
        // Parent validation
        if (request.ParentId.HasValue)
        {
            var parent = await _db.ProductCategories.FindAsync(request.ParentId.Value);
            if (parent == null)
                errors.Add("La categoría padre no existe");
            else
            {
                var depth = await GetHierarchyDepthAsync(request.ParentId.Value);
                if (depth >= 2)
                    errors.Add("La jerarquía no puede exceder 3 niveles");
            }
        }
        
        return new ValidationResult { IsValid = errors.Count == 0, Errors = errors };
    }
    
    public async Task<bool> HasCircularReferenceAsync(Guid categoryId, Guid? newParentId)
    {
        if (!newParentId.HasValue) return false;
        if (categoryId == newParentId.Value) return true;
        
        var current = newParentId.Value;
        var visited = new HashSet<Guid> { categoryId };
        
        while (current != Guid.Empty)
        {
            if (visited.Contains(current)) return true;
            visited.Add(current);
            
            var parent = await _db.ProductCategories
                .Where(c => c.Id == current)
                .Select(c => c.ParentId)
                .FirstOrDefaultAsync();
            
            if (!parent.HasValue) break;
            current = parent.Value;
        }
        
        return false;
    }
}
```

## Testing Strategy

### Unit Tests

#### Backend Unit Tests (xUnit + Moq)

**CategoryValidationServiceTests.cs**
- Test slug format validation (valid/invalid patterns)
- Test circular reference detection (direct, indirect, multi-level)
- Test hierarchy depth calculation (0, 1, 2, 3+ levels)
- Test required field validation (NameEs)
- Test parent existence validation

**SlugGenerationServiceTests.cs**
- Test slug generation from Spanish text (spaces, accents, special chars)
- Test unique slug generation with collision handling (append -2, -3, etc.)
- Test slug validation regex

**AdminCategoriesControllerTests.cs**
- Test GET /categories returns hierarchical structure
- Test POST /categories creates category with generated slug
- Test PUT /categories updates category fields
- Test DELETE /categories prevents deletion with children
- Test authorization (401/403 responses)

#### Frontend Unit Tests (Jest or similar)

**admin-categories.test.js**
- Test category tree rendering (nested structure, indentation)
- Test form validation (required fields, slug format)
- Test modal open/close behavior
- Test API call error handling

### Integration Tests

**CategoryIntegrationTests.cs** (WebApplicationFactory)
- Test full CRUD cycle (create → read → update → delete)
- Test category assignment to products
- Test cascade delete of assignments
- Test concurrent slug generation (race conditions)
- Test multilingual field persistence and retrieval

### Manual Testing Checklist

- [ ] Create root category with all 6 language names
- [ ] Create child category under root
- [ ] Create grandchild category (3rd level)
- [ ] Attempt to create great-grandchild (should fail)
- [ ] Attempt to set category as its own parent (should fail)
- [ ] Attempt to create circular reference (should fail)
- [ ] Delete category with children (should fail)
- [ ] Delete category without children (should succeed)
- [ ] Assign multiple categories to a product
- [ ] Verify category names display in product list
- [ ] Deactivate category and verify it's hidden in assignment UI
- [ ] Reactivate category and verify it reappears
- [ ] Test slug auto-generation from Spanish name
- [ ] Test manual slug with special characters (should fail)
- [ ] Test duplicate slug (should fail)
- [ ] Verify DisplayOrder sorting in tree view
- [ ] Verify emoji icons display correctly

### Performance Testing

- Load test: 1000 categories with 3-level hierarchy
- Query performance: Retrieve all categories with children (< 100ms)
- Assignment performance: Assign 10 categories to 100 products (< 500ms)

## Implementation Notes

### Phase 1: Database and Domain Layer
1. Create ProductCategory and ProductCategoryAssignment entities
2. Add DbSet properties to FilamorfosisDbContext
3. Configure entity relationships in OnModelCreating
4. Generate and apply EF Core migration
5. Implement CategorySeedService with initial data

### Phase 2: Application Layer
1. Create DTOs (CategoryDto, CreateCategoryRequest, UpdateCategoryRequest)
2. Implement SlugGenerationService
3. Implement CategoryValidationService
4. Create AdminCategoriesController with all CRUD endpoints
5. Enhance AdminProductsController with category assignment endpoints

### Phase 3: Frontend Layer
1. Add "Categorías de Producto" tab to admin.html
2. Create admin-categories.js module
3. Implement category tree view rendering
4. Implement category CRUD modals
5. Enhance admin-products.js with category assignment UI
6. Add category display to product list table

### Phase 4: Testing and Refinement
1. Write unit tests for validation and slug generation
2. Write integration tests for API endpoints
3. Perform manual testing with seed data
4. Fix bugs and refine UI/UX
5. Performance optimization if needed

### Migration Strategy

```bash
# Generate migration
dotnet ef migrations add AddProductCategories --project backend/Filamorfosis.Infrastructure --startup-project backend/Filamorfosis.API

# Apply migration
dotnet ef database update --project backend/Filamorfosis.Infrastructure --startup-project backend/Filamorfosis.API
```

### Seed Data Execution

The CategorySeedService will run automatically on application startup in Development and Testing environments (following existing DbSeeder pattern in Program.cs). For production, seed data should be applied via a separate migration or manual script.

## Security Considerations

1. **Authorization**: All category endpoints require Master or ProductManagement role + MFA
2. **Input Validation**: All user input sanitized and validated before database operations
3. **SQL Injection**: Prevented by EF Core parameterized queries
4. **CSRF Protection**: Existing X-Requested-With header validation applies
5. **XSS Prevention**: Frontend escapes all user-generated content (category names, descriptions)

## Future Enhancements (Out of Scope)

- Customer-facing category navigation and filtering
- Category-based URL routing (/categories/regalos-personalizados)
- Category analytics (products per category, popular categories)
- Drag-and-drop reordering in admin UI
- Category images/banners (currently only emoji icons)
- SEO metadata for categories
- Category-based product recommendations
- Bulk category assignment operations

---

**Design Document Version**: 1.0  
**Last Updated**: 2025-01-XX  
**Status**: Ready for Implementation

