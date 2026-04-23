# Requirements Document

## Introduction

This document defines the requirements for converting the existing Filamorfosis® brochure/catalog website into a full-featured online store. The store must preserve the existing visual identity (dark theme, vibrant colors, multilingual support) while adding user management, a shopping cart, checkout, and MercadoPago payment processing. The backend is a new C# .NET 8 REST API hosted on AWS. The frontend remains vanilla HTML/CSS/JS, extended to integrate with the new API.

The buying action must be promoted throughout every page. Every section of the site is an opportunity to convert a visitor into a customer.

---

## Glossary

- **Store**: The Filamorfosis® online store system, encompassing frontend and backend.
- **API**: The ASP.NET Core 8 REST API backend (`/api/v1/`).
- **User**: A registered customer with an account on the Store.
- **Guest**: An unauthenticated visitor browsing or shopping without an account.
- **Cart**: A collection of CartItems associated with a User or Guest session.
- **CartItem**: A single product variant with a quantity and optional customization data inside a Cart.
- **Order**: A confirmed purchase created from a Cart after successful payment initiation.
- **OrderItem**: A single line item within an Order.
- **Product**: A printable item available for purchase, belonging to a Category.
- **Variant**: A specific configuration of a Product (e.g., size, material, finish).
- **Category**: A grouping of Products (UV Printing, 3D Printing, Laser Cutting, Photography).
- **MercadoPago**: The payment gateway used to process all transactions.
- **Preference**: A MercadoPago checkout session object created server-side before redirecting the User to pay.
- **Webhook**: An HTTP callback from MercadoPago to the API notifying of payment status changes.
- **JWT**: JSON Web Token used to authenticate API requests from the frontend.
- **Profile**: A User's personal information and order history stored in the system.
- **Design_File**: An image or vector file uploaded by a User as customization input for an order.
- **Admin**: A privileged User with access to order management and product administration.
- **Admin_UI**: A simple vanilla HTML/CSS/JS page (`admin.html`) protected by the `Admin` role, matching the dark theme, used to manage products and categories.

---

## Requirements

### Requirement 1: Product Catalog API

**User Story:** As a visitor, I want to browse all available products with prices and details, so that I can decide what to purchase.

#### Acceptance Criteria

1. THE API SHALL expose a `GET /api/v1/products` endpoint that returns a paginated list of Products with their Variants and base prices.
2. THE API SHALL expose a `GET /api/v1/products/{id}` endpoint that returns the full details of a single Product including all Variants, pricing rows, features, images, and tags.
3. THE API SHALL expose a `GET /api/v1/categories` endpoint that returns all Categories with their associated product counts.
4. WHEN a `categoryId` query parameter is provided to `GET /api/v1/products`, THE API SHALL return only Products belonging to that Category.
5. WHEN a `search` query parameter is provided to `GET /api/v1/products`, THE API SHALL return only Products whose title or description contains the search term (case-insensitive).
6. THE Store SHALL display a prominent "Agregar al carrito" (Add to Cart) button on every Product card and Product detail modal.
7. THE Store SHALL display the lowest available price for each Product on the catalog grid with a "Desde $X" label to encourage purchase decisions.
8. IF a Product has no available Variants, THEN THE API SHALL return a `400 Bad Request` response when that Product is added to a Cart.

---

### Requirement 2: User Registration

**User Story:** As a visitor, I want to create an account, so that I can track my orders and save my information for future purchases.

#### Acceptance Criteria

1. THE API SHALL expose a `POST /api/v1/auth/register` endpoint that accepts an email address, password, first name, and last name.
2. WHEN a registration request is received with a valid email and a password of at least 8 characters containing at least one uppercase letter and one number, THE API SHALL create a new User account and return a JWT.
3. IF a registration request is received with an email address already associated with an existing User, THEN THE API SHALL return a `409 Conflict` response with a descriptive error message.
4. IF a registration request is received with a password shorter than 8 characters or missing an uppercase letter or number, THEN THE API SHALL return a `422 Unprocessable Entity` response listing each validation failure.
5. THE Store SHALL display the registration form with inline validation feedback before submission to reduce failed requests.
6. WHEN a User successfully registers, THE Store SHALL automatically log the User in and merge any existing Guest Cart into the new User's Cart.
7. THE API SHALL send a welcome email via AWS SES to the registered email address within 60 seconds of successful registration.

---

### Requirement 3: User Login and Authentication

**User Story:** As a registered User, I want to log in to my account, so that I can access my cart, profile, and order history.

#### Acceptance Criteria

1. THE API SHALL expose a `POST /api/v1/auth/login` endpoint that accepts an email address and password and returns a JWT on success.
2. WHEN valid credentials are provided, THE API SHALL return a JWT with a 24-hour expiration and a refresh token with a 30-day expiration.
3. IF invalid credentials are provided, THEN THE API SHALL return a `401 Unauthorized` response without specifying whether the email or password was incorrect.
4. THE API SHALL expose a `POST /api/v1/auth/refresh` endpoint that accepts a valid refresh token and returns a new JWT.
5. IF an expired or invalid refresh token is provided to `POST /api/v1/auth/refresh`, THEN THE API SHALL return a `401 Unauthorized` response.
6. THE API SHALL expose a `POST /api/v1/auth/logout` endpoint that invalidates the refresh token for the authenticated User.
7. WHEN a User logs in, THE Store SHALL merge any Guest Cart items into the User's existing Cart, preserving quantities and Variants.
8. THE Store SHALL store the JWT in an `httpOnly` cookie to prevent JavaScript access and reduce XSS exposure.

---

### Requirement 4: Password Recovery

**User Story:** As a registered User, I want to reset my password if I forget it, so that I can regain access to my account.

#### Acceptance Criteria

1. THE API SHALL expose a `POST /api/v1/auth/forgot-password` endpoint that accepts an email address.
2. WHEN a forgot-password request is received for a registered email, THE API SHALL send a password reset email via AWS SES containing a single-use reset token valid for 60 minutes.
3. WHEN a forgot-password request is received for an unregistered email, THE API SHALL return a `200 OK` response without revealing whether the email exists in the system.
4. THE API SHALL expose a `POST /api/v1/auth/reset-password` endpoint that accepts a reset token and a new password.
5. WHEN a valid reset token and a compliant new password are provided, THE API SHALL update the User's password and invalidate the reset token.
6. IF an expired or already-used reset token is provided, THEN THE API SHALL return a `400 Bad Request` response.

---

### Requirement 5: User Profile Management

**User Story:** As a registered User, I want to view and update my profile information, so that my shipping and contact details are always current.

#### Acceptance Criteria

1. THE API SHALL expose a `GET /api/v1/users/me` endpoint that returns the authenticated User's profile including name, email, phone number, and saved shipping addresses.
2. THE API SHALL expose a `PUT /api/v1/users/me` endpoint that allows the authenticated User to update their first name, last name, and phone number.
3. THE API SHALL expose a `POST /api/v1/users/me/addresses` endpoint that allows the authenticated User to save a shipping address with street, city, state, postal code, and country fields.
4. THE API SHALL expose a `DELETE /api/v1/users/me/addresses/{addressId}` endpoint that allows the authenticated User to remove a saved address.
5. IF an unauthenticated request is made to any `/api/v1/users/me` endpoint, THEN THE API SHALL return a `401 Unauthorized` response.
6. THE Store SHALL display the User's name and a cart item count badge in the navbar when the User is logged in.

---

### Requirement 6: Shopping Cart

**User Story:** As a visitor or User, I want to add products to a cart and manage its contents, so that I can prepare my order before checkout.

#### Acceptance Criteria

1. THE API SHALL expose a `GET /api/v1/cart` endpoint that returns the current Cart contents including CartItems, Variant details, unit prices, and Cart total in MXN.
2. THE API SHALL expose a `POST /api/v1/cart/items` endpoint that adds a CartItem to the Cart, accepting a product ID, variant identifier, quantity, and optional customization notes.
3. WHEN a `POST /api/v1/cart/items` request is received for a product and variant already in the Cart, THE API SHALL increment the existing CartItem quantity rather than creating a duplicate entry.
4. THE API SHALL expose a `PUT /api/v1/cart/items/{itemId}` endpoint that updates the quantity of an existing CartItem.
5. WHEN a quantity of zero is provided to `PUT /api/v1/cart/items/{itemId}`, THE API SHALL remove the CartItem from the Cart.
6. THE API SHALL expose a `DELETE /api/v1/cart/items/{itemId}` endpoint that removes a CartItem from the Cart.
7. THE API SHALL expose a `DELETE /api/v1/cart` endpoint that clears all items from the Cart.
8. WHILE a Guest session is active, THE API SHALL persist the Guest Cart using a session identifier stored in a cookie, valid for 30 days.
9. THE Store SHALL display a persistent cart icon in the navbar with a live item count badge that updates without a full page reload.
10. THE Store SHALL display a slide-out cart drawer showing CartItems, quantities, prices, and a "Proceder al pago" (Proceed to Checkout) button.
11. THE Store SHALL display an "Agregar al carrito" button on every Product card in the catalog grid and inside the Product detail modal.
12. WHEN a Product is added to the Cart from the catalog, THE Store SHALL animate the cart icon to provide visual confirmation of the action.

---

### Requirement 7: Design File Upload

**User Story:** As a User placing a custom order, I want to upload my design file, so that the Filamorfosis team can use it to produce my product.

#### Acceptance Criteria

1. THE API SHALL expose a `POST /api/v1/cart/items/{itemId}/design` endpoint that accepts a Design_File upload (PNG, JPG, SVG, or PDF, maximum 20 MB).
2. WHEN a valid Design_File is uploaded, THE API SHALL store the file in AWS S3 and associate the S3 object key with the CartItem.
3. IF a Design_File exceeds 20 MB or has an unsupported format, THEN THE API SHALL return a `422 Unprocessable Entity` response.
4. THE Store SHALL display a file upload control on the cart drawer and checkout page for CartItems that support custom designs.
5. WHEN a Design_File is successfully uploaded, THE Store SHALL display the file name and a thumbnail preview (for image files) next to the CartItem.

---

### Requirement 8: Checkout and Order Creation

**User Story:** As a User, I want to review my cart and provide shipping details before paying, so that my order is delivered to the right place.

#### Acceptance Criteria

1. THE API SHALL expose a `POST /api/v1/orders` endpoint that creates an Order from the current Cart, accepting a shipping address and optional order notes.
2. WHEN an Order is created, THE API SHALL capture a snapshot of each CartItem's product title, variant, unit price, and quantity into OrderItems so that price changes do not affect historical orders.
3. WHEN an Order is created, THE API SHALL clear the Cart.
4. IF the Cart is empty when `POST /api/v1/orders` is called, THEN THE API SHALL return a `400 Bad Request` response.
5. IF an unauthenticated request is made to `POST /api/v1/orders`, THEN THE API SHALL return a `401 Unauthorized` response.
6. THE Store SHALL display a checkout page with a Cart summary, shipping address form, and order total before payment.
7. THE Store SHALL allow the User to select a previously saved address or enter a new one during checkout.
8. THE Store SHALL display the Order total in MXN including an itemized breakdown before the User proceeds to payment.

---

### Requirement 9: MercadoPago Payment Integration

**User Story:** As a User, I want to pay for my order using MercadoPago, so that I can complete my purchase securely using my preferred payment method.

#### Acceptance Criteria

1. THE API SHALL expose a `POST /api/v1/orders/{orderId}/payment` endpoint that creates a MercadoPago Preference for the Order and returns the MercadoPago checkout URL.
2. WHEN a MercadoPago Preference is created, THE API SHALL include the Order ID as the external reference, the itemized OrderItems as line items, and the back URLs for success, failure, and pending states.
3. WHEN the User is redirected to the MercadoPago checkout URL, THE Store SHALL open it in the same browser tab.
4. THE API SHALL expose a `POST /api/v1/payments/webhook` endpoint that receives and validates MercadoPago payment notifications.
5. WHEN a webhook notification with status `approved` is received for an Order, THE API SHALL update the Order status to `Paid` and send an order confirmation email via AWS SES to the User.
6. WHEN a webhook notification with status `rejected` is received for an Order, THE API SHALL update the Order status to `PaymentFailed`.
7. WHEN a webhook notification with status `pending` is received for an Order, THE API SHALL update the Order status to `PendingPayment`.
8. IF a webhook notification is received with an unrecognized Order external reference, THEN THE API SHALL return a `200 OK` response and log the event without throwing an error.
9. THE API SHALL validate the MercadoPago webhook signature on every incoming webhook request and return `400 Bad Request` for requests with invalid signatures.
10. THE Store SHALL display an order confirmation page with the Order ID and summary when the User returns from a successful MercadoPago payment.
11. THE Store SHALL display a payment failure page with a "Reintentar pago" (Retry Payment) button when the User returns from a failed MercadoPago payment.

---

### Requirement 10: Order History and Tracking

**User Story:** As a registered User, I want to view my past orders and their current status, so that I know when my products will be ready.

#### Acceptance Criteria

1. THE API SHALL expose a `GET /api/v1/orders` endpoint that returns a paginated list of Orders for the authenticated User, ordered by creation date descending.
2. THE API SHALL expose a `GET /api/v1/orders/{orderId}` endpoint that returns the full details of a single Order including OrderItems, shipping address, payment status, and fulfillment status.
3. IF an authenticated User requests an Order that belongs to a different User, THEN THE API SHALL return a `403 Forbidden` response.
4. THE Store SHALL display an "Mis pedidos" (My Orders) section in the User's account area listing all past Orders with their status badges.
5. THE Store SHALL display the following Order statuses with distinct color-coded badges: `Pending`, `PendingPayment`, `Paid`, `InProduction`, `Shipped`, `Delivered`, `Cancelled`, `PaymentFailed`.

---

### Requirement 11: Admin Order Management

**User Story:** As an Admin, I want to view and update all orders, so that I can manage production and fulfillment.

#### Acceptance Criteria

1. THE API SHALL expose a `GET /api/v1/admin/orders` endpoint accessible only to Users with the `Admin` role, returning a paginated list of all Orders across all Users.
2. THE API SHALL expose a `PUT /api/v1/admin/orders/{orderId}/status` endpoint that allows an Admin to update the fulfillment status of an Order to `InProduction`, `Shipped`, or `Delivered`.
3. WHEN an Admin updates an Order status to `Shipped`, THE API SHALL send a shipment notification email via AWS SES to the Order's User.
4. IF a non-Admin User calls any `/api/v1/admin/` endpoint, THEN THE API SHALL return a `403 Forbidden` response.
5. THE API SHALL expose a `GET /api/v1/admin/orders/{orderId}/design-files` endpoint that returns pre-signed S3 URLs for all Design_Files associated with an Order, valid for 60 minutes.

---

### Requirement 12: Buying-Action Promotion Throughout the Site

**User Story:** As the business owner, I want purchase CTAs visible on every section of the site, so that visitors are continuously encouraged to buy.

#### Acceptance Criteria

1. THE Store SHALL display an "Agregar al carrito" or "Comprar ahora" button on every Product card in the catalog grid.
2. THE Store SHALL display a sticky "Ver carrito" (View Cart) button or cart icon with item count in the navbar at all times, visible on every page and scroll position.
3. THE Store SHALL display a promotional CTA banner in the hero section of `index.html` linking directly to the store catalog with a "Comprar ahora" label.
4. THE Store SHALL display an inline "Agregar al carrito" action within each service card on the services section of `index.html`.
5. THE Store SHALL display a "Ver todos los productos" (View All Products) CTA at the end of every gallery carousel section.
6. WHEN the cart drawer is open and contains at least one CartItem, THE Store SHALL display the Cart total and a "Proceder al pago" button prominently at the bottom of the drawer.
7. THE Store SHALL display a floating "Comprar" action button on mobile viewports (width ≤ 768px) that opens the cart drawer.

---

### Requirement 13: Multilingual Store Support

**User Story:** As an international visitor, I want to browse and use the store in my preferred language, so that I can understand product details and complete purchases confidently.

#### Acceptance Criteria

1. THE Store SHALL display all store UI strings (cart labels, checkout form labels, order status labels, error messages, CTA buttons) in the currently selected language.
2. THE Store SHALL support the following languages for store UI strings: Spanish (ES), English (EN), German (DE), Portuguese (PT), Japanese (JA), and Chinese (ZH).
3. WHEN the User changes the language using the existing language switcher, THE Store SHALL update all store UI strings without a full page reload.
4. THE API SHALL accept and return error messages in English regardless of the User's selected language; THE Store SHALL translate API error codes to the selected language on the frontend.
5. THE Store SHALL persist the selected language in `localStorage` and apply it on every page load.

---

### Requirement 14: Security and Data Protection

**User Story:** As a User, I want my personal and payment data to be handled securely, so that I can shop with confidence.

#### Acceptance Criteria

1. THE API SHALL enforce HTTPS on all endpoints; HTTP requests SHALL be redirected to HTTPS.
2. THE API SHALL store User passwords as bcrypt hashes with a minimum cost factor of 12; plaintext passwords SHALL never be stored or logged.
3. THE API SHALL rate-limit `POST /api/v1/auth/login` to a maximum of 10 requests per IP address per minute and return `429 Too Many Requests` when the limit is exceeded.
4. THE API SHALL never store MercadoPago card data; all payment data SHALL be handled exclusively by MercadoPago's hosted checkout.
5. THE API SHALL retrieve all secrets (database connection string, JWT signing key, MercadoPago credentials, AWS SES credentials) from AWS Secrets Manager at startup; secrets SHALL NOT be present in source code or environment variable files committed to version control.
6. THE API SHALL validate and sanitize all user-supplied input before processing to prevent SQL injection and XSS attacks.
7. THE Store SHALL include CSRF protection for all state-changing requests when using cookie-based authentication.

---

### Requirement 15: Admin Product Management

**User Story:** As an Admin, I want a simple interface to add, edit, and delete products, variants, categories, images, and stock quantities, so that I can keep the catalog up to date without touching code or JS files.

#### Acceptance Criteria

1. THE API SHALL expose a `GET /api/v1/admin/products` endpoint accessible only to Users with the `Admin` role, returning a paginated list of all Products (active and inactive) with their Variants.
2. THE API SHALL expose a `POST /api/v1/admin/products` endpoint that creates a new Product, accepting `titleEs`, `titleEn`, `descriptionEs`, `descriptionEn`, `categoryId`, `tags`, and `isActive`.
3. THE API SHALL expose a `GET /api/v1/admin/products/{id}` endpoint that returns the full details of a single Product including all Variants.
4. THE API SHALL expose a `PUT /api/v1/admin/products/{id}` endpoint that updates any editable field of an existing Product.
5. THE API SHALL expose a `DELETE /api/v1/admin/products/{id}` endpoint that soft-deletes a Product by setting `IsActive = false`.
6. THE API SHALL expose a `POST /api/v1/admin/products/{id}/variants` endpoint that creates a new ProductVariant for a Product, accepting `labelEs`, `labelEn`, `sku`, `price`, `stockQuantity`, `isAvailable`, and `acceptsDesignFile`.
7. THE API SHALL expose a `PUT /api/v1/admin/products/{id}/variants/{variantId}` endpoint that updates any editable field of an existing ProductVariant, including `stockQuantity`.
8. THE API SHALL expose a `DELETE /api/v1/admin/products/{id}/variants/{variantId}` endpoint that removes a ProductVariant.
9. THE API SHALL expose a `POST /api/v1/admin/products/{id}/images` endpoint that accepts an image file upload (PNG, JPG, maximum 10 MB), stores it in the existing S3 bucket, and appends the resulting S3 key to the Product's `ImageUrls` array.
10. THE ProductVariant SHALL store a `StockQuantity` integer field representing the number of units currently available.
11. THE API SHALL expose a `GET /api/v1/admin/categories` endpoint returning all Categories.
12. THE API SHALL expose a `POST /api/v1/admin/categories` endpoint that creates a new Category, accepting `slug`, `nameEs`, and `nameEn`.
13. THE API SHALL expose a `PUT /api/v1/admin/categories/{id}` endpoint that updates the `nameEs` and `nameEn` of an existing Category.
14. IF a non-Admin User calls any `/api/v1/admin/products` or `/api/v1/admin/categories` endpoint, THEN THE API SHALL return a `403 Forbidden` response.
15. THE Admin_UI SHALL be a single `admin.html` page matching the existing dark theme (`#0a0e1a` background, Poppins font, vibrant accent colors), protected by a login check that redirects unauthenticated visitors to the login modal.
16. THE Admin_UI SHALL display a Products tab with a table listing all products; each row SHALL include the product title (ES), category, active status, and action buttons for Edit and Delete.
17. THE Admin_UI SHALL display an "Add Product" form (modal or inline) with fields for `titleEs`, `titleEn`, `descriptionEs`, `descriptionEn`, `category`, `tags`, and `isActive`.
18. WHEN an Admin selects a product in the Products tab, THE Admin_UI SHALL display the product's Variants in a sub-table with columns for SKU, label (ES), price (MXN), stock quantity, availability, and action buttons for Edit and Delete.
19. THE Admin_UI SHALL display an "Add Variant" form with fields for `labelEs`, `labelEn`, `SKU`, `price`, `stockQuantity`, `isAvailable`, and `acceptsDesignFile`.
20. THE Admin_UI SHALL display an image upload control per product that allows the Admin to upload a PNG or JPG image and attach it to the product.
21. THE Admin_UI SHALL display a Categories tab with a list of all categories; each row SHALL include the category name (ES and EN) and an Edit button to rename it.
22. THE Admin_UI SHALL display an "Add Category" form with fields for `slug`, `nameEs`, and `nameEn`.
