# Implementation Plan: Filamorfosis Online Store

## Overview

Full conversion of the Filamorfosis brochure/catalog site into an e-commerce platform. The backend is a new C# .NET 8 ASP.NET Core Web API (clean architecture, EF Core, SQLite (replicated to S3 via Litestream), ASP.NET Core Identity, MercadoPago). The frontend extends the existing vanilla HTML/CSS/JS site with new modules and pages. Tasks are ordered so each step builds on the previous one and all code is wired together before the next phase begins.

## Tasks

- [x] 1. Backend project setup
  - Create solution `Filamorfosis.sln` with four projects: `Filamorfosis.Domain`, `Filamorfosis.Application`, `Filamorfosis.Infrastructure`, `Filamorfosis.API`
  - Add project references: API → Infrastructure → Application → Domain
  - Install NuGet packages: `Microsoft.AspNetCore.Identity.EntityFrameworkCore`, `Microsoft.EntityFrameworkCore.Sqlite`, `Microsoft.EntityFrameworkCore.Design`, `AutoMapper`, `FluentValidation.AspNetCore`, `Serilog.AspNetCore`, `AWSSDK.S3`, `AWSSDK.SimpleEmail`, `MercadoPago`, `Microsoft.AspNetCore.Authentication.JwtBearer`, `FsCheck.Xunit`
  - Configure `appsettings.json` with placeholder sections for Jwt, MercadoPago, Aws, and `SQLITE_DB_PATH` environment variable; wire AWS Secrets Manager provider in `Program.cs` for non-DB secrets
  - Set up Serilog structured logging, global exception-handling middleware returning RFC 7807 Problem Details, and CORS policy allowing the frontend origin
  - Configure `SameSite=Strict`, `HttpOnly`, `Secure` cookie policy; add `X-Requested-With` CSRF validation middleware for POST/PUT/DELETE
  - _Requirements: 14.1, 14.5, 14.7_


- [x] 2. Domain entities and EF Core migrations
  - [x] 2.1 Define all domain entities in `Filamorfosis.Domain`
    - Implement `User` (extends `IdentityUser<Guid>`), `Address`, `Category`, `Product`, `ProductVariant`, `Cart`, `CartItem`, `DesignFile`, `Order`, `OrderItem`, `RefreshToken`, `PasswordResetToken` exactly as specified in the design
    - Define `OrderStatus` enum with all 8 values: `Pending`, `PendingPayment`, `Paid`, `InProduction`, `Shipped`, `Delivered`, `Cancelled`, `PaymentFailed`
    - _Requirements: 8.2, 10.5_
  - [x] 2.2 Configure `FilamorfosisDbContext` in `Filamorfosis.Infrastructure`
    - Extend `IdentityDbContext<User, IdentityRole<Guid>, Guid>`
    - Configure `Product.Tags` and `Product.ImageUrls` as JSON TEXT columns using EF Core value converters (`List<string>` ↔ JSON string)
    - Configure `OrderStatus` as TEXT
    - Add indexes on `Cart.GuestToken`, `Cart.UserId`, `Order.UserId`, `Order.MercadoPagoPaymentId`, `RefreshToken.Token`, `PasswordResetToken.TokenHash`
    - _Requirements: 6.8_
  - [x] 2.3 Generate and apply initial EF Core migration
    - Run `dotnet ef migrations add InitialCreate` and `dotnet ef database update` targeting SQLite (connection string: `Data Source=$SQLITE_DB_PATH`)
    - Seed at least one `Category` and one `Product` with two `ProductVariant` rows for local development
    - _Requirements: 1.1, 1.3_


- [x] 3. Product catalog API
  - [x] 3.1 Implement `GET /api/v1/categories` endpoint
    - Create `CategoriesController` returning all categories with `productCount` (count of active products per category)
    - _Requirements: 1.3_
  - [x] 3.2 Write property test for category product count (Property 3)
    - **Property 3: Category product count accuracy**
    - **Validates: Requirements 1.3**
  - [x] 3.3 Implement `GET /api/v1/products` endpoint with pagination, `categoryId` filter, and `search` filter
    - Return paginated list with `page`, `pageSize`, `totalCount`; include variants and base (minimum available) price per product
    - Apply case-insensitive `search` against title and description; apply `categoryId` filter when provided
    - _Requirements: 1.1, 1.4, 1.5, 1.7_
  - [x] 3.4 Write property tests for catalog filters (Properties 1, 2, 4)
    - **Property 1: Category filter invariant** — Validates: Requirements 1.4
    - **Property 2: Search filter invariant** — Validates: Requirements 1.5
    - **Property 4: Minimum variant price display** — Validates: Requirements 1.7
  - [x] 3.5 Implement `GET /api/v1/products/{id}` endpoint
    - Return full product detail including all variants, pricing, features, images, tags
    - Return `404 Not Found` for unknown or inactive products
    - _Requirements: 1.2_


- [x] 4. Authentication API
  - [x] 4.1 Implement `POST /api/v1/auth/register`
    - Validate email uniqueness (409 on duplicate), password rules (≥8 chars, ≥1 uppercase, ≥1 digit; 422 on failure) via FluentValidation
    - Create user via ASP.NET Core Identity (bcrypt cost 12), issue JWT (24 h) + refresh token (30 d) as `httpOnly` cookies
    - Fire-and-forget welcome email via SES adapter
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.7, 14.2_
  - [x] 4.2 Write property tests for registration (Properties 5, 6, 7)
    - **Property 5: Registration accepts valid credentials** — Validates: Requirements 2.2
    - **Property 6: Registration rejects duplicate email** — Validates: Requirements 2.3
    - **Property 7: Registration rejects invalid passwords** — Validates: Requirements 2.4
  - [x] 4.3 Implement `POST /api/v1/auth/login` with rate limiting
    - Validate credentials; return 401 with generic message on failure (do not distinguish email vs password)
    - Issue JWT + refresh token cookies on success; apply ASP.NET Core rate-limiting middleware (10 req/min/IP)
    - _Requirements: 3.1, 3.2, 3.3, 14.3_
  - [x] 4.4 Write property tests for login (Properties 9, 10)
    - **Property 9: Login round-trip** — Validates: Requirements 3.1, 3.2
    - **Property 10: Login rejects invalid credentials** — Validates: Requirements 3.3
  - [x] 4.5 Implement `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`
    - Refresh: validate refresh token hash, issue new JWT cookie; return 401 for expired/invalid tokens
    - Logout: revoke refresh token in DB, clear both cookies
    - _Requirements: 3.4, 3.5, 3.6_
  - [x] 4.6 Write property test for refresh token invalidation after logout (Property 11)
    - **Property 11: Refresh token invalidation after logout** — Validates: Requirements 3.6
  - [x] 4.7 Implement `POST /api/v1/auth/forgot-password` and `POST /api/v1/auth/reset-password`
    - Forgot: always return 200; send reset email only for registered emails; store SHA-256 token hash with 60 min expiry
    - Reset: validate token hash, enforce password rules, update password, mark token used; return 400 for expired/used tokens
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  - [x] 4.8 Write property tests for password reset (Properties 12, 13)
    - **Property 12: Password reset email behavior** — Validates: Requirements 4.2, 4.3
    - **Property 13: Password reset round-trip** — Validates: Requirements 4.4, 4.5


- [x] 5. User profile API
  - [x] 5.1 Implement `GET /api/v1/users/me` and `PUT /api/v1/users/me`
    - GET: return name, email, phone, saved addresses; require JWT auth (401 if missing)
    - PUT: allow updating first name, last name, phone number; validate with FluentValidation
    - _Requirements: 5.1, 5.2, 5.5_
  - [x] 5.2 Implement `POST /api/v1/users/me/addresses` and `DELETE /api/v1/users/me/addresses/{addressId}`
    - POST: validate all address fields; associate with authenticated user
    - DELETE: verify address belongs to authenticated user before deleting; return 404 otherwise
    - _Requirements: 5.3, 5.4, 5.5_
  - [x] 5.3 Write property tests for profile and address round-trips (Properties 14, 15)
    - **Property 14: Profile data round-trip** — Validates: Requirements 5.1, 5.2, 5.3, 5.4
    - **Property 15: Unauthenticated access returns 401** — Validates: Requirements 5.5, 8.5


- [x] 6. Shopping cart API
  - [x] 6.1 Implement guest cart session middleware
    - On every request, read `guest_cart_token` cookie; if absent and user is unauthenticated, generate a new UUID token and set the cookie (`HttpOnly`, `SameSite=Strict`, 30-day expiry)
    - Resolve the correct `Cart` record (by `UserId` for authenticated users, by `GuestToken` for guests)
    - _Requirements: 6.8_
  - [x] 6.2 Implement `GET /api/v1/cart`
    - Return cart items with variant details, unit prices, quantities, design file info, and cart total in MXN
    - _Requirements: 6.1_
  - [x] 6.3 Implement `POST /api/v1/cart/items`
    - Accept `productVariantId`, `quantity`, optional `customizationNotes`
    - If variant already in cart, increment quantity; otherwise insert new `CartItem`
    - Return 400 if product has no available variants
    - _Requirements: 6.2, 6.3, 1.8_
  - [x] 6.4 Implement `PUT /api/v1/cart/items/{itemId}` and `DELETE /api/v1/cart/items/{itemId}`
    - PUT: update quantity; if quantity = 0, remove the item
    - DELETE: remove item unconditionally
    - _Requirements: 6.4, 6.5, 6.6_
  - [x] 6.5 Implement `DELETE /api/v1/cart` (clear cart)
    - Remove all `CartItem` rows for the current cart
    - _Requirements: 6.7_
  - [x] 6.6 Implement cart merge logic (called on login and register)
    - Move guest cart items into user cart; sum quantities for overlapping variants; delete guest cart record; clear `guest_cart_token` cookie in response
    - _Requirements: 2.6, 3.7_
  - [x] 6.7 Write property tests for cart CRUD and merge (Properties 8, 16, 17)
    - **Property 8: Cart merge on authentication** — Validates: Requirements 2.6, 3.7
    - **Property 16: Cart CRUD round-trip** — Validates: Requirements 6.1, 6.2, 6.4, 6.6, 6.7
    - **Property 17: Cart item quantity accumulation** — Validates: Requirements 6.3


- [x] 7. Design file upload (S3)
  - [x] 7.1 Implement `IS3Service` interface and `S3Service` adapter in `Filamorfosis.Infrastructure`
    - Methods: `UploadAsync(stream, key, contentType)`, `GetPresignedUrlAsync(key, ttlMinutes)`
    - Use `AWSSDK.S3`; bucket name from configuration; never hardcode credentials
    - _Requirements: 7.2, 11.5, 14.5_
  - [x] 7.2 Implement `POST /api/v1/cart/items/{itemId}/design`
    - Validate MIME type (PNG, JPG, SVG, PDF) and file size (≤ 20 MB) in middleware before reaching the controller; return 422 on violation
    - Upload to S3 under key `designs/{userId}/{cartItemId}/{filename}`; create `DesignFile` record; associate with `CartItem`
    - _Requirements: 7.1, 7.2, 7.3_
  - [x] 7.3 Write property test for design file upload association (Property 18)
    - **Property 18: Design file upload association** — Validates: Requirements 7.1, 7.2


- [x] 8. Order creation and checkout API
  - [x] 8.1 Implement `POST /api/v1/orders`
    - Require authentication (401 if missing); return 400 if cart is empty
    - Accept shipping address ID (must belong to authenticated user) and optional notes
    - Snapshot each cart item's product title (ES + EN), variant label (ES + EN), unit price, and quantity into `OrderItem` rows
    - Set initial `OrderStatus` to `Pending`; clear the cart after creation
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  - [x] 8.2 Write property tests for order creation (Properties 19, 20)
    - **Property 19: Order creation price snapshot** — Validates: Requirements 8.2
    - **Property 20: Cart cleared after order creation** — Validates: Requirements 8.3
  - [x] 8.3 Implement `GET /api/v1/orders` and `GET /api/v1/orders/{orderId}`
    - GET list: paginated, ordered by `CreatedAt` descending, scoped to authenticated user only
    - GET single: return full order detail including items, shipping address, payment status, fulfillment status; return 403 if order belongs to a different user
    - _Requirements: 10.1, 10.2, 10.3_
  - [x] 8.4 Write property tests for order isolation (Properties 24, 25)
    - **Property 24: Order list isolation** — Validates: Requirements 10.1
    - **Property 25: Cross-user order access returns 403** — Validates: Requirements 10.3


- [x] 9. MercadoPago payment integration
  - [x] 9.1 Implement `IMercadoPagoService` interface and adapter in `Filamorfosis.Infrastructure`
    - Methods: `CreatePreferenceAsync(order)` → returns `{ preferenceId, checkoutUrl }`, `GetPaymentAsync(paymentId)`
    - Load MP access token from AWS Secrets Manager; use `mercadopago-sdk-dotnet`
    - Build preference payload with `external_reference = orderId`, itemized `OrderItem` lines, `back_urls` for success/failure/pending, `notification_url`
    - _Requirements: 9.1, 9.2_
  - [x] 9.2 Implement `POST /api/v1/orders/{orderId}/payment`
    - Require authentication; verify order belongs to authenticated user
    - Call `IMercadoPagoService.CreatePreferenceAsync`; store `MercadoPagoPreferenceId` on order; update status to `PendingPayment`; return `{ checkoutUrl }`
    - Return 502 if MP SDK call fails (order stays in `Pending`)
    - _Requirements: 9.1, 9.2, 9.3_
  - [x] 9.3 Write property test for MP preference payload (Property 21)
    - **Property 21: MercadoPago preference payload correctness** — Validates: Requirements 9.2
  - [x] 9.4 Implement `POST /api/v1/payments/webhook`
    - Validate HMAC-SHA256 `x-signature` header against MP webhook secret from Secrets Manager; return 400 on mismatch
    - Look up order by `external_reference`; if not found, return 200 and log
    - Call MP API to verify payment status; map `approved` → `Paid`, `rejected` → `PaymentFailed`, `pending` → `PendingPayment`
    - Check idempotency (skip update if order already in target status); send SES confirmation email on `approved`
    - _Requirements: 9.4, 9.5, 9.6, 9.7, 9.8, 9.9_
  - [x] 9.5 Write property tests for webhook handling (Properties 22, 23)
    - **Property 22: Webhook status mapping** — Validates: Requirements 9.5, 9.6, 9.7
    - **Property 23: Webhook signature validation** — Validates: Requirements 9.9


- [x] 10. Admin order management API
  - [x] 10.1 Implement `GET /api/v1/admin/orders`
    - Require `Admin` role (403 for non-admins); return paginated list of all orders across all users with user info, status, and total
    - _Requirements: 11.1, 11.4_
  - [x] 10.2 Implement `PUT /api/v1/admin/orders/{orderId}/status`
    - Allow transitions to `InProduction`, `Shipped`, or `Delivered` only
    - On `Shipped`: fire-and-forget SES shipment notification email to the order's user
    - _Requirements: 11.2, 11.3_
  - [x] 10.3 Implement `GET /api/v1/admin/orders/{orderId}/design-files`
    - Require `Admin` role; return pre-signed S3 URLs (60-minute TTL) for all design files on the order's items
    - _Requirements: 11.5_
  - [x] 10.4 Write property tests for admin authorization and shipment notification (Properties 26, 27)
    - **Property 26: Admin endpoint authorization** — Validates: Requirements 11.1, 11.4
    - **Property 27: Shipment notification on status update** — Validates: Requirements 11.3


- [x] 10.5 Admin product management API
  - [x] 10.5.1 Add `StockQuantity` field to `ProductVariant` entity and generate EF Core migration
    - Add `public int StockQuantity { get; set; }` to `ProductVariant` in `Filamorfosis.Domain`
    - Run `dotnet ef migrations add AddVariantStockQuantity` and apply
    - _Requirements: 15.10_
  - [x] 10.5.2 Implement `AdminProductsController` — product CRUD
    - `GET /api/v1/admin/products` — paginated list of all products (active + inactive) with variants; require `Admin` role
    - `POST /api/v1/admin/products` — create product; validate with FluentValidation; return 201 with created product
    - `GET /api/v1/admin/products/{id}` — full product detail including all variants
    - `PUT /api/v1/admin/products/{id}` — update any editable product field
    - `DELETE /api/v1/admin/products/{id}` — soft-delete by setting `IsActive = false`
    - Return 403 for non-Admin callers on all endpoints
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.14_
  - [x] 10.5.3 Implement variant CRUD endpoints on `AdminProductsController`
    - `POST /api/v1/admin/products/{id}/variants` — create variant; accept `labelEs`, `labelEn`, `sku`, `price`, `stockQuantity`, `isAvailable`, `acceptsDesignFile`
    - `PUT /api/v1/admin/products/{id}/variants/{variantId}` — update any variant field including `stockQuantity`
    - `DELETE /api/v1/admin/products/{id}/variants/{variantId}` — remove variant
    - _Requirements: 15.6, 15.7, 15.8_
  - [x] 10.5.4 Implement product image upload endpoint
    - `POST /api/v1/admin/products/{id}/images` — accept PNG or JPG (max 10 MB); upload to S3 via existing `IS3Service`; append S3 key to `Product.ImageUrls`; return updated image URL list
    - Reuse the same S3 bucket and `IS3Service` already implemented in task 7.1
    - _Requirements: 15.9_
  - [x] 10.5.5 Implement `AdminCategoriesController` — category management
    - `GET /api/v1/admin/categories` — return all categories
    - `POST /api/v1/admin/categories` — create category; accept `slug`, `nameEs`, `nameEn`
    - `PUT /api/v1/admin/categories/{id}` — update `nameEs` and `nameEn`
    - Require `Admin` role; return 403 for non-admins
    - _Requirements: 15.11, 15.12, 15.13, 15.14_
  - [x] 10.5.6 Write property tests for admin product management (Properties 33, 34, 35, 36)
    - **Property 33: Admin product CRUD round-trip** — Validates: Requirements 15.2, 15.3, 15.4, 15.5
    - **Property 34: Admin variant stock quantity round-trip** — Validates: Requirements 15.6, 15.7, 15.10
    - **Property 35: Admin product image upload association** — Validates: Requirements 15.9
    - **Property 36: Admin product/category authorization** — Validates: Requirements 15.14


- [x] 10.6 Frontend: Admin page (`admin.html`)
  - Create `admin.html` matching the existing dark theme (`#0a0e1a` background, Poppins font, vibrant accent colors)
  - On page load: verify the user has the `Admin` role (check JWT claims or a `/api/v1/users/me` response); redirect unauthenticated or non-admin visitors to the login modal
  - Tab 1 — Products:
    - Fetch and render a table of all products via `GET /api/v1/admin/products`; columns: title (ES), category, active status, actions (Edit / Delete)
    - "Add Product" button opens a modal/inline form with fields: `titleEs`, `titleEn`, `descriptionEs`, `descriptionEn`, category dropdown, tags (comma-separated), isActive toggle; submits to `POST /api/v1/admin/products`
    - Clicking a product row expands a variants sub-table: SKU, label (ES), price (MXN), stock quantity, availability; actions: Edit / Delete
    - "Add Variant" form per product: `labelEs`, `labelEn`, SKU, price, stockQuantity, isAvailable checkbox, acceptsDesignFile checkbox; submits to `POST /api/v1/admin/products/{id}/variants`
    - Image upload control per product: file input (PNG/JPG only); submits to `POST /api/v1/admin/products/{id}/images`; displays current image thumbnails
  - Tab 2 — Categories:
    - Fetch and render a list of all categories via `GET /api/v1/admin/categories`; columns: slug, nameEs, nameEn, Edit button
    - Edit opens an inline form to update `nameEs` and `nameEn` via `PUT /api/v1/admin/categories/{id}`
    - "Add Category" form: slug, nameEs, nameEn; submits to `POST /api/v1/admin/categories`
  - No drag-and-drop, no rich text editor — plain `<input>` and `<textarea>` fields only
  - _Requirements: 15.15, 15.16, 15.17, 15.18, 15.19, 15.20, 15.21, 15.22_


- [x] 11. Checkpoint — Backend complete
  - Ensure all backend unit tests and property tests pass (`dotnet test`)
  - Verify all API endpoints respond correctly against the local SQLite database with seeded data
  - Ask the user if any backend behavior needs adjustment before proceeding to frontend work

- [x] 12. Frontend: API client module (`assets/js/api.js`)
  - Create `assets/js/api.js` with `API_BASE` constant (swappable per environment via a config block at the top)
  - Implement `apiFetch(path, options)`: sets `credentials: 'include'`, `Content-Type: application/json`, `X-Requested-With: XMLHttpRequest`; handles 401 by calling `tryRefresh()` and retrying once; throws normalized error objects on non-OK responses
  - Export named helpers: `getProducts(params)`, `getProduct(id)`, `getCategories()`, `getCart()`, `addToCart(item)`, `updateCartItem(id, qty)`, `removeCartItem(id)`, `clearCart()`, `uploadDesign(itemId, file)`, `createOrder(payload)`, `createPayment(orderId)`, `getOrders()`, `getOrder(id)`, `getMe()`, `updateMe(data)`, `getAddresses()`, `addAddress(addr)`, `deleteAddress(id)`
  - _Requirements: 3.8 (cookie auth), 14.7 (CSRF header)_


- [x] 13. Frontend: Auth module (`assets/js/auth.js`)
  - [x] 13.1 Implement login and register modal HTML (injected into `<body>` by `auth.js` on DOM ready)
    - Login form: email + password fields, inline validation, "Olvidé mi contraseña" link
    - Register form: first name, last name, email, password fields with inline validation feedback per Requirement 2.5
    - Shared modal container with tab switching between login and register
    - _Requirements: 2.5_
  - [x] 13.2 Implement auth JS logic in `auth.js`
    - `login(email, password)`: calls `POST /api/v1/auth/login`, triggers cart merge, updates navbar state
    - `register(data)`: calls `POST /api/v1/auth/register`, auto-logs in, triggers cart merge
    - `logout()`: calls `POST /api/v1/auth/logout`, clears local user state, reloads navbar
    - `tryRefresh()`: calls `POST /api/v1/auth/refresh`; on failure, clears user state and shows login modal
    - Schedule silent token refresh ~23 h after login using `setTimeout`
    - _Requirements: 3.7, 3.8_
  - [x] 13.3 Update navbar state based on auth
    - When logged in: show user's first name and cart badge in navbar; hide login/register links
    - When logged out: show login/register links; hide user name
    - _Requirements: 5.6_


- [x] 14. Frontend: Cart module (`assets/js/cart.js`)
  - [x] 14.1 Implement cart drawer HTML structure (injected into `<body>` by `cart.js`)
    - Slide-out `<div id="cart-drawer">` with item list, quantities, unit prices, subtotal, "Proceder al pago" button, and close button
    - Design file upload control per cart item where `variant.acceptsDesignFile = true`; show file name + image thumbnail on upload
    - _Requirements: 6.10, 6.11, 7.4, 7.5_
  - [x] 14.2 Implement cart state management
    - Module-level cart state object; `loadCart()` fetches `GET /api/v1/cart` and re-renders drawer
    - `addItem(variantId, qty, notes)`: calls `POST /api/v1/cart/items`, updates badge, triggers fly-to-cart animation
    - `updateItem(itemId, qty)`: calls `PUT /api/v1/cart/items/{id}`; qty=0 removes item
    - `removeItem(itemId)`: calls `DELETE /api/v1/cart/items/{id}`
    - `uploadDesignFile(itemId, file)`: calls `POST /api/v1/cart/items/{id}/design`, updates item UI with filename and thumbnail
    - _Requirements: 6.2, 6.4, 6.6, 7.4, 7.5_
  - [x] 14.3 Implement navbar cart badge and add-to-cart animation
    - `<span id="cart-count">` in navbar updated after every cart mutation without page reload
    - CSS keyframe animation: product image thumbnail flies toward cart icon on `addItem`
    - Floating "Comprar" FAB on mobile (≤768px) that opens the cart drawer
    - _Requirements: 6.9, 6.12, 12.2, 12.7_


- [x] 15. Frontend: Checkout page (`checkout.html` + `assets/js/checkout.js`)
  - [x] 15.1 Create `checkout.html`
    - Matches existing dark-theme visual identity; includes: cart summary panel (items, quantities, prices, total in MXN), shipping address section, order notes field, "Pagar con MercadoPago" CTA button
    - Redirect to login modal if user is unauthenticated on page load
    - _Requirements: 8.6, 8.8_
  - [x] 15.2 Implement `checkout.js`
    - On load: fetch and render cart summary; fetch and render saved addresses; show "add new address" form if none exist
    - Address selector: radio buttons for saved addresses + inline form for new address (saved to profile on submit)
    - On "Pagar con MercadoPago" click: call `POST /api/v1/orders` with selected address, then `POST /api/v1/orders/{id}/payment`; redirect browser to returned `checkoutUrl`
    - Show itemized total in MXN before payment; disable button and show spinner during API calls
    - _Requirements: 8.6, 8.7, 8.8, 9.3_


- [x] 16. Frontend: Order confirmation page (`order-confirmation.html`)
  - Create `order-confirmation.html` matching dark-theme identity
  - On load: read `status` and `orderId` query params
  - `status=success`: fetch order details via `GET /api/v1/orders/{orderId}`; display order ID, itemized summary, shipping address, and a "Seguir comprando" link
  - `status=failure`: display payment failure message and a "Reintentar pago" button that calls `POST /api/v1/orders/{orderId}/payment` again and redirects
  - `status=pending`: display pending payment message with order ID and instructions
  - _Requirements: 9.10, 9.11_

- [x] 17. Frontend: Account page (`account.html`)
  - [x] 17.1 Create `account.html` with tab-based SPA structure (Profile, Addresses, Mis Pedidos)
    - Redirect to login modal if unauthenticated on page load
    - Matches dark-theme visual identity; tab switching via JS without page reload
    - _Requirements: 10.4_
  - [x] 17.2 Implement Profile tab
    - Fetch and display user data from `GET /api/v1/users/me`; editable form for first name, last name, phone; save via `PUT /api/v1/users/me`
    - _Requirements: 5.1, 5.2_
  - [x] 17.3 Implement Addresses tab
    - List saved addresses; "Agregar dirección" form (street, city, state, postal code, country); delete button per address
    - _Requirements: 5.3, 5.4_
  - [x] 17.4 Implement Mis Pedidos tab
    - Paginated order list from `GET /api/v1/orders`; each row shows order ID, date, total, status badge
    - Click to expand order detail (items, shipping address) via `GET /api/v1/orders/{id}`
    - Color-coded status badges for all 8 statuses: `Pending`, `PendingPayment`, `Paid`, `InProduction`, `Shipped`, `Delivered`, `Cancelled`, `PaymentFailed`
    - _Requirements: 10.4, 10.5_


- [x] 18. Frontend: Buying-action CTAs on `index.html` and `products.html`
  - [x] 18.1 Update `index.html` hero section
    - Add a "Comprar ahora" CTA button in the hero that links to `products.html`
    - _Requirements: 12.3_
  - [x] 18.2 Add inline "Agregar al carrito" actions to service cards in `index.html`
    - Each service card in the services section gets an "Agregar al carrito" or "Ver productos" button that links to the relevant category in `products.html`
    - _Requirements: 12.4_
  - [x] 18.3 Add "Ver todos los productos" CTA at the end of each gallery carousel in `index.html`
    - _Requirements: 12.5_
  - [x] 18.4 Wire "Agregar al carrito" buttons in `products.html` catalog grid and product detail modal
    - Each product card's add-to-cart button calls `cart.addItem(variantId, 1)` from `cart.js`
    - Product detail modal add-to-cart button respects selected variant before calling `cart.addItem`
    - _Requirements: 1.6, 6.11, 12.1_
  - [x] 18.5 Ensure sticky navbar cart icon with live badge is present on all pages
    - Navbar cart icon visible at all scroll positions; badge shows live item count from `cart.js`
    - _Requirements: 12.2_


- [-] 19. Frontend: Store i18n (`assets/js/store-i18n.js`)
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_
  - [x] 19.1 Create the file scaffold and ES + EN translation keys
    - Create `assets/js/store-i18n.js` with the IIFE scaffold and `window.StoreI18n` export
    - Add Spanish (ES) and English (EN) flat translation objects covering: auth form labels, cart labels, checkout form labels, order status labels, order confirmation labels, account page labels, store CTA labels
    - _Requirements: 13.1, 13.2_
  - [x] 19.2 Add DE, PT, JA, ZH translation keys
    - Add German (DE), Portuguese (PT), Japanese (JA), and Chinese (ZH) translations for every key defined in 19.1
    - _Requirements: 13.2_
  - [x] 19.3 Add API error type URI → localized message map for all 6 languages
    - Map all API error `type` URIs (validation-failed, duplicate-email, invalid-credentials, token-expired, cart-empty, product-unavailable, order-not-found, payment-failed, file-too-large, invalid-file-type, unauthorized, forbidden, rate-limit-exceeded, server-error) to localized strings in all 6 languages
    - Expose `window.StoreI18n.tError(typeUri)` helper
    - _Requirements: 13.4_
  - [x] 19.4 Wire into the global i18n system and apply on page load
    - Merge store keys into `window.translations[lang]` for each language on script load
    - Call `window.switchLanguage()` after merging so the active language is applied immediately
    - On pages without main.js, apply `[data-t]` translations directly on `DOMContentLoaded`
    - Read `localStorage.getItem('preferredLanguage')` on load and apply the saved language
    - _Requirements: 13.3, 13.5_
  - [x] 19.5 Write property tests for translation map completeness and language persistence (Properties 28, 29)
    - **Property 28: Translation map completeness** — Validates: Requirements 13.1, 13.2, 13.4
    - **Property 29: Language persistence round-trip** — Validates: Requirements 13.5
    - **Property 28: Translation map completeness** — Validates: Requirements 13.1, 13.2, 13.4
    - **Property 29: Language persistence round-trip** — Validates: Requirements 13.5

- [x] 20. Checkpoint — Frontend complete
  - Verify cart drawer, auth modals, checkout flow, account page, and order confirmation page render correctly against the backend
  - Confirm all `data-translate` / `data-t` store keys resolve in all 6 languages
  - Ask the user if any frontend behavior or visual polish needs adjustment before infrastructure work


- [x] 21. Property-based and unit tests — backend
  - [x] 21.1 Create `Filamorfosis.Tests` xUnit project; add `FsCheck.Xunit` and `Moq` packages
    - Add `WebApplicationFactory<Program>` base class for integration tests; configure in-memory or test PostgreSQL database
    - Create custom `Arbitrary` generators for `User`, `Product`, `ProductVariant`, `Cart`, `CartItem`, `Order`
    - Each property test file must include comment: `// Feature: online-store, Property N: <property_text>`
    - _Requirements: (all — cross-cutting test coverage)_
  - [x] 21.2 Implement all 36 property-based tests mapped in the design document
    - Implement `ProductCatalogPropertyTests` (P1, P2, P3, P4)
    - Implement `AuthPropertyTests` (P5, P6, P7, P9, P10, P11)
    - Implement `CartMergePropertyTests` (P8), `CartPropertyTests` (P16, P17)
    - Implement `PasswordResetPropertyTests` (P12, P13)
    - Implement `UserProfilePropertyTests` (P14), `AuthorizationPropertyTests` (P15)
    - Implement `DesignFilePropertyTests` (P18)
    - Implement `OrderPropertyTests` (P19, P20, P24, P25)
    - Implement `PaymentPropertyTests` (P21), `WebhookPropertyTests` (P22, P23)
    - Implement `AdminAuthorizationPropertyTests` (P26, P36)
    - Implement `AdminOrderPropertyTests` (P27)
    - Implement `AdminProductPropertyTests` (P33, P34, P35)
    - Implement `SecurityPropertyTests` (P30, P31, P32)
  - [x] 21.3 Implement frontend property tests with fast-check
    - Add `fast-check` npm package; create `tests/` directory alongside frontend assets
    - Implement `I18nPropertyTests` (P28, P29) using fast-check: verify all 6 languages × all store keys yield non-empty strings; verify `localStorage` round-trip
    - Implement `ProductPricePropertyTests` (P4 frontend variant): verify "Desde $X" display equals minimum available variant price for any generated product


- [ ] 22. Security hardening
  - [x] 22.1 Write property tests for security properties (Properties 30, 31, 32)
    - **Property 30: Password hashing strength** — Validates: Requirements 14.2
    - **Property 31: Input sanitization rejects injection payloads** — Validates: Requirements 14.6
    - **Property 32: CSRF header enforcement** — Validates: Requirements 14.7
  - [x] 22.2 Verify HTTPS enforcement and HSTS header
    - Confirm ALB HTTP → HTTPS redirect is configured; add `Strict-Transport-Security` header in API middleware
    - _Requirements: 14.1_
  - [x] 22.3 Verify secrets are never in source code
    - Audit all configuration files and `appsettings.json`; confirm all secrets reference AWS Secrets Manager paths only
    - Add `.gitignore` entries for any local secret override files
    - _Requirements: 14.5_


- [ ] 23. AWS infrastructure setup
  - [ ] 23.1 Create `infrastructure/` directory with IaC files (AWS CDK or CloudFormation)
    - Define ECS Fargate task definition for the .NET 8 API container (1–4 tasks, CPU/memory auto-scaling)
    - Define ALB with HTTPS listener (ACM certificate), HTTP → HTTPS redirect rule
    - _Requirements: 14.1_
  - [ ] 23.2 Configure Litestream for SQLite replication
    - Create `filamorfosis-db` S3 bucket (private, versioning enabled) via IaC
    - Add `litestream.yml` to the repo: `dbs: [{path: /data/filamorfosis.db, replicas: [{url: s3://filamorfosis-db/filamorfosis.db}]}]`
    - Update ECS task definition entrypoint to `litestream replicate -exec "dotnet Filamorfosis.API.dll"` so Litestream restores from S3 on startup and replicates continuously
    - Add IAM inline policy to ECS task role: `s3:GetObject`, `s3:PutObject`, `s3:ListBucket` on `filamorfosis-db` bucket
  - [ ] 23.3 Define S3 buckets and CloudFront distribution
    - `filamorfosis-static`: public, CloudFront origin for static site assets
    - `filamorfosis-designs`: private, no public access, pre-signed URL access only
    - `filamorfosis-db`: private, no public access, Litestream WAL replication target (already created in 23.2)
    - CloudFront distribution: `/api/*` behavior bypasses cache and forwards to ALB origin
  - [ ] 23.4 Define AWS SES configuration
    - Verified sending domain `filamorfosis.com`
    - Create SES email templates: `welcome`, `order-confirmation`, `shipment-notification`, `password-reset`
  - [ ] 23.5 Define AWS Secrets Manager secrets
    - Create secret paths: `/filamorfosis/prod/jwt-key`, `/filamorfosis/prod/mp-credentials`, `/filamorfosis/prod/ses-config`, `/filamorfosis/prod/litestream-config` (if needed)
    - SQLite path is a local file path set via environment variable `SQLITE_DB_PATH=/data/filamorfosis.db` — no DB connection string secret needed
    - Confirm ECS task IAM role has `secretsmanager:GetSecretValue` permission for these paths only
    - _Requirements: 14.5_
  - [ ] 23.6 Define Route 53 DNS records
    - `filamorfosis.com` → CloudFront distribution
    - `api.filamorfosis.com` → ALB


- [ ] 24. CI/CD pipeline
  - [ ] 24.1 Create `.github/workflows/backend.yml` (or equivalent)
    - Trigger on push to `main` and pull requests targeting `main`
    - Steps: checkout → `dotnet restore` → `dotnet build --no-restore` → `dotnet test --no-build` → Docker build → push image to Amazon ECR → update ECS Fargate service (rolling deploy)
    - Inject secrets from GitHub Actions secrets (mapped from AWS Secrets Manager); never hardcode credentials in workflow files
  - [ ] 24.2 Create `.github/workflows/frontend.yml`
    - Trigger on push to `main` affecting frontend files
    - Steps: checkout → sync `index.html`, `products.html`, `checkout.html`, `order-confirmation.html`, `account.html`, `admin.html`, `assets/` to `filamorfosis-static` S3 bucket → invalidate CloudFront distribution cache
  - [ ] 24.3 Add `Dockerfile` for the .NET 8 API
    - Multi-stage build: `sdk` stage for `dotnet publish`, `aspnet` runtime stage for final image
    - Download and install Litestream binary from GitHub releases in the runtime stage
    - Set entrypoint to `litestream replicate -exec "dotnet Filamorfosis.API.dll"`
    - Mount `/data` as the SQLite data directory; set `SQLITE_DB_PATH=/data/filamorfosis.db`
    - Run as non-root user; expose port 8080; set `ASPNETCORE_URLS=http://+:8080`

- [ ] 25. Final checkpoint — All systems integrated
  - Run full test suite: `dotnet test` (backend) and frontend property tests
  - Verify end-to-end flow in staging: browse catalog → add to cart → register/login → checkout → MercadoPago sandbox → order confirmation → account order history
  - Confirm all 6 languages render correctly on all new pages
  - Ask the user if any final adjustments are needed before production deployment


---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP; all property and unit test sub-tasks are optional by this convention
- Each task references specific requirements for full traceability back to `requirements.md`
- All 36 correctness properties from `design.md` are covered by property test sub-tasks
- Checkpoints (tasks 11, 20, 25) are natural pause points to validate progress with the user before moving to the next layer
- Backend tasks (1–10) must be completed before frontend tasks (12–19) since the frontend depends on live API endpoints
- Infrastructure tasks (23–24) can be set up in parallel with frontend work once the backend is stable
- All secrets must flow through AWS Secrets Manager — never appear in source code, `.env` files, or workflow files
