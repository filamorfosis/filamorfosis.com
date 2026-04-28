# Design Document: Use-Case Category System

## Overview

This design implements a customer-centric product categorization system that replaces the current technical manufacturing-based categories (UV Printing, 3D Printing, Laser Cutting) with use-case based categories (Gifts, Drinkware, Business, Decor, Events, Art). The system allows products to belong to multiple categories simultaneously, improving product discoverability and aligning the browsing experience with customer intent.

### Key Design Decisions

1. **Multi-category assignment**: Products can be tagged with multiple use cases, appearing in all relevant category tabs
2. **Array-based storage**: PostgreSQL TEXT[] column provides efficient querying and flexibility
3. **Backward compatibility**: Existing categoryId field preserved; new useCase parameter added alongside
4. **Frontend-first approach**: Category tabs drive the UX; backend provides filtering capability
5. **Translation-driven labels**: All category names stored in i18n files, not hardcoded

### Design Rationale

**Why array-based use cases instead of a junction table?**
- Simpler schema (no additional table)
- Faster queries (single array containment check vs JOIN)
- Easier migration (single ALTER TABLE + UPDATE statements)
- Sufficient for the expected scale (6 use cases, 36 products initially)

**Why preserve the old categoryId field?**
- Enables gradual migration
- Supports A/B testing between old and new systems
- Provides fallback if use-case system needs adjustment
- Maintains data integrity during transition

## Architecture

### System Components

```mermaid
graph TB
    subgraph Frontend
        A[products.js] --> B[Category Tabs]
        A --> C[Product Grid]
        A --> D[Filter Chips]
        E[catalog.js] --> F[CATEGORIES Array]
        G[lang.*.js] --> H[Translation Keys]
    end
    
    subgraph Backend
        I[ProductsController] --> J[EF Core Query]
        J --> K[PostgreSQL]
    end
    
    subgraph Database
        K --> L[Products Table]
        L --> M[use_cases TEXT[]]
    end
    
    B --> I
    F --> B
    H --> B
    I --> C
```

### Data Flow

1. **User clicks category tab** → Frontend sends `useCase` parameter to API
2. **API receives request** → ProductsController filters by array containment
3. **Database query executes** → PostgreSQL `@> ARRAY['gifts']` operator
4. **Results returned** → ProductSummaryDto list sent to frontend
5. **Grid renders** → products.js displays filtered products

### Integration Points

| Component | Integration Method | Data Format |
|-----------|-------------------|-------------|
| Frontend → Backend | HTTP GET with query params | `?useCase=gifts&page=1&pageSize=20` |
| Backend → Database | EF Core LINQ with array contains | `.Where(p => p.UseCases.Contains(useCase))` |
| Frontend i18n | Translation key lookup | `t('cat_gifts')` → window.FilamorfosisI18n[lang].cat_gifts |
| Category mapping | Static array in catalog.js | `{ id: 'gifts', label: 'Regalos', icon: '🎁' }` |

## Components and Interfaces

### Database Schema

#### Products Table Extension

```sql
-- New column added to existing Products table
ALTER TABLE "Products" ADD COLUMN use_cases TEXT[] DEFAULT '{}';

-- Index for efficient array containment queries
CREATE INDEX idx_products_use_cases ON "Products" USING GIN (use_cases);
```

**Column Specification:**
- **Name**: `use_cases`
- **Type**: `TEXT[]` (PostgreSQL array of text)
- **Default**: `'{}'` (empty array)
- **Nullable**: No (enforced by default value)
- **Indexed**: Yes (GIN index for array operations)

**Valid Use Case Values:**
- `gifts` - Personalized gifts
- `drinkware` - Mugs, tumblers, bottles
- `business` - Corporate and promotional items
- `decor` - Home decoration
- `events` - Weddings, parties, celebrations
- `art` - Artistic and custom design pieces

### Backend API

#### ProductsController Modifications

**File**: `backend/Filamorfosis.API/Controllers/ProductsController.cs`

**New Query Parameter:**

```csharp
[HttpGet]
public async Task<IActionResult> GetAll(
    [FromQuery] int page = 1,
    [FromQuery] int pageSize = 20,
    [FromQuery] Guid? categoryId = null,  // Existing - preserved
    [FromQuery] string? useCase = null,    // NEW - use-case filter
    [FromQuery] string? search = null,
    [FromQuery] string? badge = null)
```

**Filter Logic:**

```csharp
// After existing categoryId filter
if (!string.IsNullOrWhiteSpace(useCase))
{
    query = query.Where(p => p.UseCases.Contains(useCase));
}
```

**EF Core Translation:**
- LINQ: `p.UseCases.Contains(useCase)`
- SQL: `WHERE use_cases @> ARRAY['gifts']::text[]`

**Response Format:**
- Unchanged - existing `ProductSummaryDto` structure
- No new DTO fields required
- use_cases array not exposed in API response (internal filtering only)

### Frontend Architecture

#### Category Definition Structure

**File**: `assets/js/products.js` (or separate `catalog-config.js`)

```javascript
const CATEGORIES = [
    { id: 'gifts',      label: 'cat_gifts',      icon: '🎁', color: '#f97316' },
    { id: 'drinkware',  label: 'cat_drinkware',  icon: '☕', color: '#8b5cf6' },
    { id: 'business',   label: 'cat_business',   icon: '🏢', color: '#3b82f6' },
    { id: 'decor',      label: 'cat_decor',      icon: '🖼️', color: '#ec4899' },
    { id: 'events',     label: 'cat_events',     icon: '🎉', color: '#f59e0b' },
    { id: 'art',        label: 'cat_art',        icon: '🎨', color: '#10b981' },
    { id: 'all',        label: 'cat_all',        icon: '📦', color: '#6b7280' },
];
```

**Field Descriptions:**
- `id`: Use case identifier sent to API (matches database values)
- `label`: Translation key (not literal text)
- `icon`: UTF-8 emoji character
- `color`: Hex color for tab accent (optional, for future styling)

#### State Management

**Modified State Variables:**

```javascript
// BEFORE (old system)
let activeCategory = 'uv';  // Technical category short ID

// AFTER (new system)
let activeUseCase = 'gifts';  // Use case ID

// Removed mapping (no longer needed)
// const CAT_SLUG_MAP = { 'uv': 'uv-printing', ... };
```

**API Call Changes:**

```javascript
// BEFORE
async function fetchProducts(opts) {
    const params = { pageSize: pageSize };
    if (opts.categoryId) params.categoryId = opts.categoryId;
    // ...
}

// AFTER
async function fetchProducts(opts) {
    const params = { pageSize: pageSize };
    if (opts.useCase && opts.useCase !== 'all') {
        params.useCase = opts.useCase;
    }
    // categoryId parameter removed (or kept for backward compat)
    // ...
}
```

#### Tab Rendering

**Modified renderTabs() Function:**

```javascript
function renderTabs() {
    const el = document.getElementById('catTabs');
    if (!el) return;
    
    el.innerHTML = CATEGORIES.map(c => `
        <button class="cat-tab ${c.id === activeUseCase ? 'active' : ''}" 
                data-usecase="${c.id}">
            <span class="cat-tab-icon">${c.icon}</span>
            <span class="cat-tab-label">${t(c.label)}</span>
        </button>
    `).join('');
    
    el.querySelectorAll('.cat-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            activeUseCase = btn.dataset.usecase;
            activeFilter = 'all';
            searchQuery = '';
            currentPage = 1;
            _loadedProducts = [];
            const searchEl = document.getElementById('catSearch');
            if (searchEl) searchEl.value = '';
            renderTabs();
            renderChips();
            loadProducts(true);
        });
    });
}
```

**Key Changes:**
- `data-cat` → `data-usecase`
- `activeCategory` → `activeUseCase`
- Translation via `t(c.label)` instead of direct `c.label`

## Data Models

### Domain Entity

**File**: `backend/Filamorfosis.Domain/Entities/Product.cs`

```csharp
public class Product
{
    public Guid Id { get; set; }
    public Guid CategoryId { get; set; }  // Existing - preserved
    public string Slug { get; set; } = string.Empty;
    public string TitleEs { get; set; } = string.Empty;
    public string TitleEn { get; set; } = string.Empty;
    public string DescriptionEs { get; set; } = string.Empty;
    public string DescriptionEn { get; set; } = string.Empty;
    public string[] Tags { get; set; } = [];
    public string[] ImageUrls { get; set; } = [];
    public string? Badge { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    
    // NEW PROPERTY
    public string[] UseCases { get; set; } = [];  // NEW
    
    // Navigation properties
    public Category Category { get; set; } = null!;
    public ICollection<ProductVariant> Variants { get; set; } = new List<ProductVariant>();
    public ICollection<ProductAttributeDefinition> AttributeDefinitions { get; set; } = new List<ProductAttributeDefinition>();
    public ICollection<Discount> Discounts { get; set; } = new List<Discount>();
}
```

### EF Core Configuration

**File**: `backend/Filamorfosis.Infrastructure/Data/Configurations/ProductConfiguration.cs`

```csharp
public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        // Existing configuration...
        
        // NEW: Configure use_cases array column
        builder.Property(p => p.UseCases)
            .HasColumnName("use_cases")
            .HasColumnType("text[]")
            .IsRequired();
    }
}
```

### Translation Data Model

**Structure in all 6 language files:**

```javascript
window.FilamorfosisI18n['es'] = {
    // Existing keys...
    
    // NEW KEYS
    cat_gifts: 'Regalos',
    cat_drinkware: 'Tazas y Vasos',
    cat_business: 'Empresarial',
    cat_decor: 'Decoración',
    cat_events: 'Eventos',
    cat_art: 'Arte y Diseño',
    cat_all: 'Todos',
};
```

**Translation Matrix:**

| Key | ES | EN | DE | PT | JA | ZH |
|-----|----|----|----|----|----|----|
| cat_gifts | Regalos | Gifts | Geschenke | Presentes | ギフト | 礼品 |
| cat_drinkware | Tazas y Vasos | Mugs & Drinkware | Tassen & Trinkgeschirr | Canecas e Copos | マグ＆ドリンクウェア | 杯具 |
| cat_business | Empresarial | Business | Geschäftlich | Empresarial | ビジネス | 商务 |
| cat_decor | Decoración | Home Decor | Dekoration | Decoração | ホームデコ | 装饰 |
| cat_events | Eventos | Events | Veranstaltungen | Eventos | イベント | 活动 |
| cat_art | Arte y Diseño | Art & Design | Kunst & Design | Arte e Design | アート＆デザイン | 艺术设计 |
| cat_all | Todos | All | Alle | Todos | すべて | 全部 |

## Error Handling

### Backend Error Scenarios

**Invalid use case value:**
```csharp
// No validation error thrown - simply returns empty result set
// This is intentional: invalid filters should not crash the API
if (!string.IsNullOrWhiteSpace(useCase))
{
    query = query.Where(p => p.UseCases.Contains(useCase));
}
// If useCase = "invalid", query returns 0 products (expected behavior)
```

**Database connection failure:**
```csharp
// Existing error handling preserved
try {
    var products = await query.ToListAsync();
    return Ok(new PagedResult<ProductSummaryDto> { ... });
}
catch (Exception ex) {
    _logger.LogError(ex, "Failed to fetch products");
    return StatusCode(500, new ProblemDetails {
        Title = "Internal Server Error",
        Detail = "Failed to retrieve products"
    });
}
```

### Frontend Error Handling

**API request failure:**
```javascript
async function loadProducts(reset) {
    try {
        const result = await fetchProducts(opts);
        // ... render products
    } catch (e) {
        clearTimeout(_skeletonTimer);
        renderError(() => loadProducts(reset));  // Retry callback
    }
}
```

**Missing translation key:**
```javascript
function t(key) {
    const lang = window.currentLang || 'es';
    const tl = window.FilamorfosisI18n[lang];
    if (tl && tl[key] !== undefined) return tl[key];
    // Fallback to Spanish
    const es = window.FilamorfosisI18n['es'];
    if (es && es[key] !== undefined) return es[key];
    // Last resort: return key itself
    return key;
}
```

**Empty result set:**
```javascript
if (_loadedProducts.length === 0) {
    const grid = document.getElementById('catGrid');
    if (grid) grid.innerHTML = '';
    const empty = document.getElementById('catEmpty');
    if (empty) {
        empty.classList.remove('cat-empty--hidden');
        // Display translated empty message
        const emptyTextEl = empty.querySelector('.cat-empty-text');
        if (emptyTextEl) emptyTextEl.textContent = t('empty_text');
    }
}
```

## Testing Strategy

### Unit Tests

**Backend Unit Tests** (`ProductsControllerTests.cs`):

1. **Test: UseCase filter returns only matching products**
   ```csharp
   [Fact]
   public async Task GetAll_WithUseCaseFilter_ReturnsOnlyMatchingProducts()
   {
       // Arrange: Seed products with different use cases
       // Act: Call GetAll with useCase="gifts"
       // Assert: All returned products contain "gifts" in UseCases array
   }
   ```

2. **Test: Invalid useCase returns empty result**
   ```csharp
   [Fact]
   public async Task GetAll_WithInvalidUseCase_ReturnsEmptyResult()
   {
       // Arrange: Seed products
       // Act: Call GetAll with useCase="invalid"
       // Assert: Result.Items is empty, TotalCount is 0
   }
   ```

3. **Test: UseCase filter combines with other filters**
   ```csharp
   [Fact]
   public async Task GetAll_WithUseCaseAndBadge_ReturnsCombinedFilter()
   {
       // Arrange: Seed products with various use cases and badges
       // Act: Call GetAll with useCase="gifts" and badge="hot"
       // Assert: All returned products have both "gifts" use case AND "hot" badge
   }
   ```

4. **Test: Null or empty useCase returns all products**
   ```csharp
   [Fact]
   public async Task GetAll_WithoutUseCase_ReturnsAllProducts()
   {
       // Arrange: Seed products
       // Act: Call GetAll with useCase=null
       // Assert: All active products returned
   }
   ```

**Frontend Unit Tests** (`products.test.js`):

1. **Test: Category tabs render with correct translations**
   ```javascript
   test('renderTabs displays translated category labels', () => {
       // Arrange: Set language to 'en'
       // Act: Call renderTabs()
       // Assert: Tab labels match FilamorfosisI18n['en'] values
   });
   ```

2. **Test: Clicking category tab updates state and fetches products**
   ```javascript
   test('clicking category tab triggers product fetch', async () => {
       // Arrange: Mock fetchProducts
       // Act: Click "Regalos" tab
       // Assert: activeUseCase === 'gifts', fetchProducts called with useCase='gifts'
   });
   ```

3. **Test: "Todos" category does not send useCase parameter**
   ```javascript
   test('Todos category fetches all products', async () => {
       // Arrange: Mock fetchProducts
       // Act: Click "Todos" tab
       // Assert: fetchProducts called without useCase parameter
   });
   ```

### Integration Tests

**Backend Integration Tests** (`ProductsControllerIntegrationTests.cs`):

1. **Test: End-to-end use-case filtering**
   ```csharp
   [Fact]
   public async Task GetProducts_WithUseCaseGifts_ReturnsExpectedProducts()
   {
       // Arrange: Real database with seeded products
       // Act: HTTP GET /api/v1/products?useCase=gifts
       // Assert: Response contains 18 products, all tagged with "gifts"
   }
   ```

2. **Test: Multi-category products appear in multiple filters**
   ```csharp
   [Fact]
   public async Task GetProducts_MultiCategoryProduct_AppearsInBothFilters()
   {
       // Arrange: Product with use_cases = ["gifts", "drinkware"]
       // Act: Fetch with useCase="gifts", then with useCase="drinkware"
       // Assert: Same product appears in both result sets
   }
   ```

**Frontend Integration Tests** (Playwright/Cypress):

1. **Test: Category navigation workflow**
   ```javascript
   test('user can browse products by category', async () => {
       // Navigate to products page
       // Click "Regalos" tab
       // Verify: URL contains ?useCase=gifts
       // Verify: Product grid displays 18 products
       // Click "Tazas y Vasos" tab
       // Verify: Product grid displays 5 products
   });
   ```

2. **Test: Language switching updates category labels**
   ```javascript
   test('category labels update when language changes', async () => {
       // Navigate to products page
       // Verify: Tab shows "Regalos"
       // Switch language to English
       // Verify: Tab shows "Gifts"
   });
   ```

### Manual Testing Checklist

- [ ] All 36 products correctly tagged after migration
- [ ] Each category tab displays expected product count
- [ ] Products with multiple use cases appear in all relevant tabs
- [ ] Search works across all categories
- [ ] Filter chips work in combination with category tabs
- [ ] Pagination works within each category
- [ ] "Load More" button appears/disappears correctly
- [ ] Empty state displays when category has no products
- [ ] Category labels display correctly in all 6 languages
- [ ] Emoji icons render correctly (no replacement characters)
- [ ] Backward compatibility: old categoryId parameter still works
- [ ] Performance: Category switching feels instant (<200ms)

## Migration Strategy

### Phase 1: Database Migration

**File**: `PRODUCT-USE-CASE-TAGGING.sql` (already exists)

**Execution Steps:**

1. **Backup database:**
   ```bash
   pg_dump -h <host> -U <user> -d filamorfosis > backup_pre_usecase.sql
   ```

2. **Run migration script:**
   ```bash
   psql -h <host> -U <user> -d filamorfosis -f PRODUCT-USE-CASE-TAGGING.sql
   ```

3. **Verify migration:**
   ```sql
   -- Check column exists
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'Products' AND column_name = 'use_cases';
   
   -- Check product counts per use case
   SELECT unnest(use_cases) as use_case, COUNT(*) 
   FROM "Products" 
   GROUP BY use_case;
   
   -- Expected output:
   -- gifts: 18
   -- drinkware: 5
   -- business: 14
   -- decor: 13
   -- events: 11
   -- art: 12
   ```

4. **Create index:**
   ```sql
   CREATE INDEX IF NOT EXISTS idx_products_use_cases 
   ON "Products" USING GIN (use_cases);
   ```

### Phase 2: Backend Implementation

**Steps:**

1. **Update Product entity** (`Product.cs`):
   - Add `public string[] UseCases { get; set; } = [];`

2. **Update EF Core configuration** (`ProductConfiguration.cs`):
   - Configure use_cases column mapping

3. **Generate migration:**
   ```bash
   cd backend/Filamorfosis.API
   dotnet ef migrations add AddUseCasesToProducts
   ```
   
   **Note**: Migration will detect existing column, no schema change needed

4. **Update ProductsController** (`ProductsController.cs`):
   - Add `useCase` parameter to GetAll method
   - Add filter logic: `query.Where(p => p.UseCases.Contains(useCase))`

5. **Test backend changes:**
   ```bash
   dotnet test
   ```

6. **Deploy backend:**
   - Deploy to staging environment
   - Verify API endpoint: `GET /api/v1/products?useCase=gifts`
   - Check response time (<200ms)

### Phase 3: Frontend Implementation

**Steps:**

1. **Update translation files** (all 6 languages):
   - Add cat_gifts, cat_drinkware, cat_business, cat_decor, cat_events, cat_art, cat_all

2. **Update products.js**:
   - Replace CATEGORIES array with new use-case categories
   - Update state variables (activeCategory → activeUseCase)
   - Modify fetchProducts() to use useCase parameter
   - Update renderTabs() to use new data attributes
   - Remove old category slug mapping logic

3. **Test frontend changes:**
   - Open products.html in browser
   - Verify all 7 category tabs render
   - Click each tab, verify correct products load
   - Switch languages, verify translations work
   - Test search + category combination
   - Test filters + category combination

4. **Deploy frontend:**
   - Deploy static assets to CDN/S3
   - Clear CloudFront cache
   - Verify production site

### Phase 4: Validation and Rollback Plan

**Validation Checklist:**

- [ ] All products appear in at least one category
- [ ] Product counts match expected values (18, 5, 14, 13, 11, 12)
- [ ] No 404 errors in browser console
- [ ] No JavaScript errors in browser console
- [ ] API response times <200ms
- [ ] All 6 languages display correctly
- [ ] Mobile responsive layout works
- [ ] Existing features (cart, modal, search) still work

**Rollback Plan:**

If critical issues arise:

1. **Frontend rollback** (fastest):
   ```bash
   # Revert to previous frontend deployment
   aws s3 sync s3://filamorfosis-backup/assets/ s3://filamorfosis-prod/assets/
   aws cloudfront create-invalidation --distribution-id <id> --paths "/*"
   ```

2. **Backend rollback**:
   ```bash
   # Revert to previous backend deployment
   eb deploy --version <previous-version>
   ```

3. **Database rollback** (last resort):
   ```sql
   -- Remove use_cases column (data loss!)
   ALTER TABLE "Products" DROP COLUMN use_cases;
   ```

### Phase 5: Monitoring and Optimization

**Metrics to Monitor:**

- API response time for `/api/v1/products?useCase=*`
- Database query execution time
- Frontend page load time
- User engagement per category (analytics)
- Bounce rate on products page
- Conversion rate by category

**Optimization Opportunities:**

1. **Database**: Add GIN index if not already present
2. **Backend**: Add response caching for popular categories
3. **Frontend**: Preload first category on page load
4. **CDN**: Cache API responses for 60 seconds

## Deployment Checklist

### Pre-Deployment

- [ ] Code review completed
- [ ] Unit tests passing (backend + frontend)
- [ ] Integration tests passing
- [ ] Manual testing completed
- [ ] Translation files updated for all 6 languages
- [ ] Database backup created
- [ ] Rollback plan documented

### Deployment Steps

1. [ ] Run database migration script
2. [ ] Verify migration with SQL queries
3. [ ] Deploy backend to staging
4. [ ] Test staging API endpoints
5. [ ] Deploy frontend to staging
6. [ ] Full staging validation
7. [ ] Deploy backend to production
8. [ ] Deploy frontend to production
9. [ ] Clear CDN cache
10. [ ] Smoke test production

### Post-Deployment

- [ ] Monitor error logs for 24 hours
- [ ] Check API response times
- [ ] Verify analytics tracking
- [ ] Collect user feedback
- [ ] Document any issues encountered
- [ ] Update runbook with lessons learned

---

## Appendix: File Modification Summary

### Files to Create

- None (all files already exist)

### Files to Modify

**Backend:**
1. `backend/Filamorfosis.Domain/Entities/Product.cs` - Add UseCases property
2. `backend/Filamorfosis.Infrastructure/Data/Configurations/ProductConfiguration.cs` - Configure use_cases column
3. `backend/Filamorfosis.API/Controllers/ProductsController.cs` - Add useCase parameter and filter logic

**Frontend:**
4. `assets/js/products.js` - Replace CATEGORIES array, update state management, modify API calls
5. `assets/js/i18n/lang.es.js` - Add 7 new translation keys
6. `assets/js/i18n/lang.en.js` - Add 7 new translation keys
7. `assets/js/i18n/lang.de.js` - Add 7 new translation keys
8. `assets/js/i18n/lang.pt.js` - Add 7 new translation keys
9. `assets/js/i18n/lang.ja.js` - Add 7 new translation keys
10. `assets/js/i18n/lang.zh.js` - Add 7 new translation keys

**Database:**
11. Execute `PRODUCT-USE-CASE-TAGGING.sql` (already exists)

### Files NOT Modified

- `assets/css/products.css` - No styling changes needed
- `products.html` - No HTML structure changes needed
- `backend/Filamorfosis.Application/DTOs/*` - No DTO changes needed
- `backend/Filamorfosis.Domain/Entities/Category.cs` - Old category system preserved

---

**Design Document Version**: 1.0  
**Last Updated**: 2025-01-XX  
**Status**: Ready for Implementation
