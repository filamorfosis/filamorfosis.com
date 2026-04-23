# Requirements Document — Admin Store Management

## Introduction

This document defines the requirements for the Filamorfosis® Admin Store Management site — a fully managed, browser-based administration panel (`admin.html`) that allows privileged users (Admins) to manage every aspect of the online store without touching code or database files.

The admin site extends the existing `admin.html` page (currently covering products and categories) to include:

- **Category management** — create, edit, and organize categories including types, colors, and sizes
- **Product management** — full CRUD for products, variants, stock quantities, prices, and discounts
- **Order management** — an approval workflow that advances orders through the states: `Paid → Preparing → Shipped → Delivered`, with status changes reflected in real time on the customer's account page

The admin panel matches the existing dark-theme visual identity (`#0a0e1a` background, Poppins font, vibrant accent colors) and is built with vanilla HTML5/CSS3/JS — no framework. All data operations go through the existing `.NET 8` REST API under `/api/v1/admin/`.

---

## Glossary

- **Admin**: A registered User with the `Admin` role, authorized to access all `/api/v1/admin/` endpoints.
- **Admin_Panel**: The single-page admin interface served at `admin.html`.
- **API**: The ASP.NET Core 8 REST API backend (`/api/v1/`).
- **Category**: A top-level grouping of Products (e.g., UV Printing, 3D Printing).
- **Category_Attribute**: A typed metadata dimension attached to a Category — one of `Type`, `Color`, or `Size`.
- **Product**: A printable item available for purchase, belonging to a Category.
- **ProductVariant**: A specific configuration of a Product combining one or more Category_Attributes (e.g., size + color + material), with its own SKU, price, stock quantity, and availability flag.
- **Discount**: A percentage or fixed-amount reduction applied to a Product or ProductVariant, with optional start and end dates.
- **Order**: A confirmed purchase created from a Cart after successful payment.
- **OrderItem**: A single line item within an Order, snapshotting product title, variant label, unit price, and quantity at the time of purchase.
- **OrderStatus**: The current fulfillment state of an Order. Valid values: `Pending`, `PendingPayment`, `Paid`, `Preparing`, `Shipped`, `Delivered`, `Cancelled`, `PaymentFailed`.
- **Approval_Workflow**: The admin-driven sequence of status transitions: `Paid → Preparing → Shipped → Delivered`.
- **Stock**: The integer count of units currently available for a given ProductVariant.
- **User**: A registered customer with an account on the store.
- **JWT**: JSON Web Token used to authenticate API requests.

---

## Requirements

### Requirement 1: Admin Authentication and Access Control

**User Story:** As an Admin, I want the admin panel to verify my identity before granting access, so that unauthorized users cannot manage store data.

#### Acceptance Criteria

1. WHEN an unauthenticated visitor navigates to `admin.html`, THE Admin_Panel SHALL redirect the visitor to the login modal before rendering any admin content.
2. WHEN a logged-in User without the `Admin` role navigates to `admin.html`, THE Admin_Panel SHALL display an "Access Denied" message and SHALL NOT render any admin content.
3. WHEN an authenticated Admin navigates to `admin.html`, THE Admin_Panel SHALL render the full admin interface without additional prompts.
4. IF a request to any `/api/v1/admin/` endpoint is made without a valid JWT, THEN THE API SHALL return a `401 Unauthorized` response.
5. IF a request to any `/api/v1/admin/` endpoint is made by a User without the `Admin` role, THEN THE API SHALL return a `403 Forbidden` response.
6. THE Admin_Panel SHALL display the authenticated Admin's name in the navbar.
7. WHEN the Admin clicks the logout action, THE Admin_Panel SHALL call `POST /api/v1/auth/logout`, clear the session, and redirect to `index.html`.
8. WHEN an Admin logs in with valid credentials, THE API SHALL require a valid TOTP (Time-based One-Time Password) code before issuing an access token, making MFA mandatory for all Admin accounts.
9. WHEN an Admin account is created or first accessed, THE API SHALL expose a `POST /api/v1/auth/admin/mfa/setup` endpoint that generates a TOTP secret and returns a QR code URI compatible with authenticator apps (e.g., Google Authenticator, Authy).
10. WHEN an Admin submits a TOTP code during login, THE API SHALL validate the code against the stored TOTP secret and SHALL reject codes that are expired or have already been used (replay protection).
11. WHEN an Admin's MFA setup is not yet confirmed, THE API SHALL NOT grant full access to any `/api/v1/admin/` endpoint until MFA enrollment is completed.
12. THE Admin_Panel login flow SHALL present a two-step UI: first collect email and password, then — upon valid credentials — present a TOTP code input field before completing authentication.

---

### Requirement 2: Category Management

**User Story:** As an Admin, I want to create, edit, and organize product categories including their types, colors, and sizes, so that the catalog is structured and filterable for customers.

#### Acceptance Criteria

1. THE API SHALL expose a `GET /api/v1/admin/categories` endpoint that returns all Categories including their associated Category_Attributes.
2. THE API SHALL expose a `POST /api/v1/admin/categories` endpoint that creates a new Category, accepting `slug`, `nameEs`, `nameEn`, and an optional `imageUrl`.
3. THE API SHALL expose a `PUT /api/v1/admin/categories/{id}` endpoint that updates the `nameEs`, `nameEn`, `slug`, and `imageUrl` of an existing Category.
4. THE API SHALL expose a `DELETE /api/v1/admin/categories/{id}` endpoint that soft-deletes a Category by setting `IsActive = false`.
5. IF a `DELETE /api/v1/admin/categories/{id}` request is received for a Category that has one or more active Products assigned to it, THEN THE API SHALL return a `409 Conflict` response with a descriptive error message.
6. THE API SHALL expose a `POST /api/v1/admin/categories/{id}/attributes` endpoint that adds a Category_Attribute to a Category, accepting `attributeType` (one of `Type`, `Color`, `Size`) and `value`.
7. THE API SHALL expose a `DELETE /api/v1/admin/categories/{id}/attributes/{attributeId}` endpoint that removes a Category_Attribute.
8. THE Admin_Panel SHALL display a Categories tab listing all categories with columns for slug, name (ES), name (EN), attribute count, and action buttons for Edit and Delete.
9. THE Admin_Panel SHALL display an "Add Category" inline form with fields for `slug`, `nameEs`, `nameEn`, and `imageUrl`.
10. WHEN an Admin expands a category row in the Admin_Panel, THE Admin_Panel SHALL display the category's Category_Attributes grouped by type (Type, Color, Size) with an Add and Delete action per attribute.
11. WHEN an Admin submits the "Add Category" form with a duplicate `slug`, THE Admin_Panel SHALL display the API error message inline without a page reload.

---

### Requirement 3: Product Management

**User Story:** As an Admin, I want to create, edit, and delete products with full control over their variants, stock, prices, and discounts, so that the catalog always reflects what is available for purchase.

#### Acceptance Criteria

1. THE API SHALL expose a `GET /api/v1/admin/products` endpoint that returns a paginated list of all Products (active and inactive) with their Variants, accepting `page`, `pageSize`, `categoryId`, and `search` query parameters.
2. THE API SHALL expose a `POST /api/v1/admin/products` endpoint that creates a new Product, accepting `titleEs`, `titleEn`, `descriptionEs`, `descriptionEn`, `categoryId`, `tags`, and `isActive`.
3. THE API SHALL expose a `GET /api/v1/admin/products/{id}` endpoint that returns the full details of a single Product including all Variants and Discounts.
4. THE API SHALL expose a `PUT /api/v1/admin/products/{id}` endpoint that updates any editable field of an existing Product.
5. THE API SHALL expose a `DELETE /api/v1/admin/products/{id}` endpoint that soft-deletes a Product by setting `IsActive = false`.
6. THE API SHALL expose a `POST /api/v1/admin/products/{id}/variants` endpoint that creates a new ProductVariant, accepting `labelEs`, `labelEn`, `sku`, `price`, `stockQuantity`, `isAvailable`, and `acceptsDesignFile`.
7. THE API SHALL expose a `PUT /api/v1/admin/products/{id}/variants/{variantId}` endpoint that updates any editable field of an existing ProductVariant, including `stockQuantity` and `price`.
8. THE API SHALL expose a `DELETE /api/v1/admin/products/{id}/variants/{variantId}` endpoint that removes a ProductVariant.
9. IF a `DELETE /api/v1/admin/products/{id}/variants/{variantId}` request is received for a variant that is referenced by one or more existing OrderItems, THEN THE API SHALL return a `409 Conflict` response.
10. THE API SHALL expose a `POST /api/v1/admin/products/{id}/images` endpoint that accepts a PNG or JPG image (maximum 10 MB), stores it in AWS S3, and appends the resulting URL to the Product's `imageUrls` array.
11. THE API SHALL expose a `DELETE /api/v1/admin/products/{id}/images` endpoint that accepts an `imageUrl` body parameter and removes that URL from the Product's `imageUrls` array.
12. THE Admin_Panel SHALL display a Products tab with a searchable, paginated table of all products; each row SHALL include the product title (ES), category, active status, variant count, and action buttons for Edit and Delete.
13. THE Admin_Panel SHALL display an "Add Product" inline form with fields for `titleEs`, `titleEn`, `descriptionEs`, `descriptionEn`, category dropdown, tags (comma-separated), and `isActive` toggle.
14. WHEN an Admin expands a product row in the Admin_Panel, THE Admin_Panel SHALL display the product's Variants in a sub-table with columns for SKU, label (ES), price (MXN), stock quantity, availability, and action buttons for Edit and Delete.
15. THE Admin_Panel SHALL display an "Add Variant" inline form per product with fields for `labelEs`, `labelEn`, `SKU`, `price`, `stockQuantity`, `isAvailable` checkbox, and `acceptsDesignFile` checkbox.
16. THE Admin_Panel SHALL display an image management section per product showing current image thumbnails with a Delete button per image and a file input to upload new images.
17. WHEN an Admin updates a variant's `stockQuantity` to zero, THE Admin_Panel SHALL visually indicate that the variant is out of stock without requiring a page reload.

---

### Requirement 4: Discount Management

**User Story:** As an Admin, I want to apply percentage or fixed-amount discounts to products or specific variants, so that I can run promotions and sales.

#### Acceptance Criteria

1. THE API SHALL expose a `POST /api/v1/admin/products/{id}/discounts` endpoint that creates a Discount for a Product, accepting `discountType` (one of `Percentage`, `FixedAmount`), `value`, optional `startsAt` (ISO 8601 datetime), and optional `endsAt` (ISO 8601 datetime).
2. THE API SHALL expose a `POST /api/v1/admin/products/{id}/variants/{variantId}/discounts` endpoint that creates a Discount for a specific ProductVariant with the same fields as above.
3. THE API SHALL expose a `DELETE /api/v1/admin/discounts/{discountId}` endpoint that removes a Discount.
4. WHEN a Discount with a `Percentage` type is active for a ProductVariant, THE API SHALL return the discounted price as `effectivePrice = price * (1 - value / 100)` in all product and variant responses.
5. WHEN a Discount with a `FixedAmount` type is active for a ProductVariant, THE API SHALL return the discounted price as `effectivePrice = max(0, price - value)` in all product and variant responses.
6. WHEN the current UTC datetime is outside the range `[startsAt, endsAt]` for a Discount, THE API SHALL treat the Discount as inactive and SHALL NOT apply it to the `effectivePrice`.
7. WHEN no Discount is active for a ProductVariant, THE API SHALL return `effectivePrice` equal to `price`.
8. THE Admin_Panel SHALL display active Discounts per product and per variant in the product detail expansion, showing type, value, start date, end date, and a Delete button.
9. THE Admin_Panel SHALL display an "Add Discount" inline form per product and per variant with fields for `discountType`, `value`, `startsAt`, and `endsAt`.
10. WHEN an Admin submits a Discount with `endsAt` earlier than `startsAt`, THE API SHALL return a `422 Unprocessable Entity` response with a descriptive error message.

---

### Requirement 5: Order Management and Approval Workflow

**User Story:** As an Admin, I want to view all customer orders and advance them through the fulfillment workflow, so that I can manage production and keep customers informed.

#### Acceptance Criteria

1. THE API SHALL expose a `GET /api/v1/admin/orders` endpoint accessible only to Admins, returning a paginated list of all Orders across all Users, accepting `page`, `pageSize`, `status`, and `search` (by order ID or customer email) query parameters.
2. THE API SHALL expose a `GET /api/v1/admin/orders/{orderId}` endpoint that returns the full details of a single Order including OrderItems, shipping address, customer email, payment status, and fulfillment status.
3. THE API SHALL expose a `PUT /api/v1/admin/orders/{orderId}/status` endpoint that allows an Admin to advance the Order status according to the Approval_Workflow: `Paid → Preparing → Shipped → Delivered`.
4. IF a `PUT /api/v1/admin/orders/{orderId}/status` request attempts a status transition not permitted by the Approval_Workflow, THEN THE API SHALL return a `422 Unprocessable Entity` response listing the allowed next statuses.
5. WHEN an Admin advances an Order to `Preparing`, THE API SHALL update `Order.Status` to `Preparing` and SHALL record the transition timestamp in `Order.UpdatedAt`.
6. WHEN an Admin advances an Order to `Shipped`, THE API SHALL update `Order.Status` to `Shipped`, record the transition timestamp, and send a shipment notification email via AWS SES to the Order's User.
7. WHEN an Admin advances an Order to `Delivered`, THE API SHALL update `Order.Status` to `Delivered` and record the transition timestamp.
8. WHEN an Order status is updated by an Admin, THE API SHALL ensure that a subsequent `GET /api/v1/orders/{orderId}` by the Order's User returns the updated status.
9. THE Admin_Panel SHALL display an Orders tab with a filterable, paginated table of all orders; each row SHALL include order ID (truncated), customer email, order total (MXN), current status badge, creation date, and an action button to open the order detail view.
10. THE Admin_Panel SHALL display an order detail view showing all OrderItems, shipping address, customer email, payment status, and a status advancement control.
11. THE Admin_Panel SHALL display the status advancement control as a button labeled with the next logical status (e.g., "Marcar como Preparando", "Marcar como Enviado", "Marcar como Entregado") and SHALL disable the button when no further advancement is possible.
12. WHEN an Admin clicks the status advancement button, THE Admin_Panel SHALL call `PUT /api/v1/admin/orders/{orderId}/status`, update the displayed status badge without a full page reload, and show a success toast notification.
13. THE Admin_Panel SHALL display all Order statuses with distinct color-coded badges: `Pending` (gray), `PendingPayment` (yellow), `Paid` (blue), `Preparing` (orange), `Shipped` (purple), `Delivered` (green), `Cancelled` (red), `PaymentFailed` (red).
14. THE API SHALL expose a `GET /api/v1/admin/orders/{orderId}/design-files` endpoint that returns pre-signed S3 URLs (60-minute TTL) for all Design_Files associated with an Order's items.
15. THE Admin_Panel SHALL display a "Ver archivos de diseño" (View Design Files) button in the order detail view for orders that contain items with associated Design_Files; clicking it SHALL open the pre-signed URLs in new browser tabs.

---

### Requirement 6: Order Status Reflected in Customer Account

**User Story:** As a customer, I want my order status to update in real time on my account page when the Admin advances the fulfillment workflow, so that I always know the current state of my purchase.

#### Acceptance Criteria

1. WHEN an Admin updates an Order status via `PUT /api/v1/admin/orders/{orderId}/status`, THE API SHALL persist the new status such that the next `GET /api/v1/orders/{orderId}` by the authenticated Order owner returns the updated status.
2. WHEN a customer views the "Mis Pedidos" section of `account.html`, THE Store SHALL fetch the current order list from `GET /api/v1/orders` and display the latest status for each Order.
3. THE Store SHALL display the `Preparing` status with an orange badge labeled "En Preparación" in the customer's order list.
4. THE Store SHALL display the `Shipped` status with a purple badge labeled "Enviado" in the customer's order list.
5. THE Store SHALL display the `Delivered` status with a green badge labeled "Entregado" in the customer's order list.
6. WHEN a customer expands an order in "Mis Pedidos", THE Store SHALL display the full order detail including the current status, OrderItems, and shipping address fetched from `GET /api/v1/orders/{orderId}`.
7. THE Store i18n module SHALL include translations for `Preparing`, `Shipped`, and `Delivered` status labels in all six supported languages: Spanish (ES), English (EN), German (DE), Portuguese (PT), Japanese (JA), and Chinese (ZH).

---

### Requirement 7: Store Content Management — Full Catalog Control

**User Story:** As an Admin, I want a single interface to manage all store content — products, categories, variants, images, and discounts — so that I can keep the catalog accurate and up to date without developer involvement.

#### Acceptance Criteria

1. THE Admin_Panel SHALL provide a single `admin.html` page with tab-based navigation covering: Orders, Products, and Categories.
2. THE Admin_Panel SHALL load all data via the existing `/api/v1/admin/` REST API endpoints using the authenticated Admin's JWT cookie.
3. THE Admin_Panel SHALL display inline success and error feedback for every create, update, and delete operation without requiring a full page reload.
4. THE Admin_Panel SHALL match the existing dark-theme visual identity: `#0a0e1a` background, Poppins font, vibrant gradient accent colors (`#6366f1` → `#8b5cf6` → `#ec4899`).
5. THE Admin_Panel SHALL be fully functional on viewport widths of 768px and above.
6. WHEN an Admin performs a destructive action (Delete product, Delete category, Delete variant), THE Admin_Panel SHALL display a confirmation prompt before calling the API.
7. THE Admin_Panel SHALL display a loading spinner while any API request is in flight and SHALL disable the triggering button to prevent duplicate submissions.
8. WHEN the API returns an error response, THE Admin_Panel SHALL display the `detail` field from the RFC 7807 Problem Details response body as an inline error message near the relevant form or action.
9. THE Admin_Panel SHALL paginate the Products table and the Orders table, displaying 20 rows per page with Previous and Next navigation controls.
10. THE Admin_Panel SHALL provide a search input on the Products tab that filters the product list by title (ES or EN) via the `search` query parameter on `GET /api/v1/admin/products`.
11. THE Admin_Panel SHALL provide a status filter dropdown on the Orders tab that filters the order list by `status` via the `status` query parameter on `GET /api/v1/admin/orders`.
