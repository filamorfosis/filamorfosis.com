# Requirements Document

## Introduction

The current admin system uses a single monolithic `Admin` role that grants full access to all admin panel features (Orders, Products, Categories, Users). This feature splits that role into four granular admin roles to support least-privilege access control:

- **Master** — full access, equivalent to the current `Admin` role
- **UserManagement** — can only manage users (view, create, promote, demote)
- **ProductManagement** — can only manage categories and products
- **OrderManagement** — can only manage orders

All four roles still require MFA (TOTP) verification before accessing the admin panel. The backend must enforce role-based authorization on every admin API endpoint, and the frontend must show or hide tabs and actions based on the authenticated user's role(s).

---

## Glossary

- **Admin_Panel**: The `admin.html` single-page application used to manage the store.
- **Admin_User**: Any user account that holds at least one of the four admin roles.
- **Master**: Admin role with full access to all admin panel features and all admin API endpoints.
- **UserManagement**: Admin role restricted to user-related endpoints and the Users tab.
- **ProductManagement**: Admin role restricted to product and category endpoints and the Products/Categories tabs.
- **OrderManagement**: Admin role restricted to order endpoints and the Orders tab.
- **RequireMfa_Filter**: The `RequireMfaAttribute` authorization filter applied to all admin controllers.
- **Admin_Auth**: The `admin-auth.js` module responsible for session checking and login flow.
- **JWT**: JSON Web Token issued by the backend after successful MFA verification, containing role claims.
- **Role_Claim**: A claim of type `role` embedded in the JWT that identifies the user's admin role(s).
- **Tab**: A top-level navigation section in the Admin_Panel (Orders, Products, Categories, Users).
- **AdminUsersController**: The ASP.NET Core controller at `api/v1/admin/users`.
- **AdminOrdersController**: The ASP.NET Core controller at `api/v1/admin/orders`.
- **AdminProductsController**: The ASP.NET Core controller at `api/v1/admin/products`.
- **AdminCategoriesController**: The ASP.NET Core controller at `api/v1/admin/categories`.
- **Master_Account**: The protected superuser account with email `admin@filamorfosis.com`. This account is invisible to all admin panel users and cannot be modified, demoted, or deleted through the admin panel.

---

## Requirements

### Requirement 1: Granular Admin Role Definitions

**User Story:** As a store owner, I want four distinct admin roles with different permission scopes, so that I can assign the minimum necessary access to each team member.

#### Acceptance Criteria

1. THE System SHALL define four admin roles: `Master`, `UserManagement`, `ProductManagement`, and `OrderManagement`.
2. THE System SHALL store admin role assignments in the ASP.NET Core Identity role system, using the exact role names defined above.
3. WHEN a user holds the `Master` role, THE System SHALL grant that user access to all admin API endpoints and all Admin_Panel tabs.
4. WHEN a user holds the `UserManagement` role, THE System SHALL grant that user access only to the `api/v1/admin/users` endpoints and the Users tab.
5. WHEN a user holds the `ProductManagement` role, THE System SHALL grant that user access only to the `api/v1/admin/products` and `api/v1/admin/categories` endpoints, and the Products and Categories tabs.
6. WHEN a user holds the `OrderManagement` role, THE System SHALL grant that user access only to the `api/v1/admin/orders` endpoints and the Orders tab.
7. THE System SHALL support a user holding multiple admin roles simultaneously, granting the union of permissions for all held roles.

---

### Requirement 2: Backend Authorization Enforcement

**User Story:** As a security-conscious developer, I want every admin API endpoint to enforce the correct role requirement at the server level, so that unauthorized access is impossible regardless of frontend state.

#### Acceptance Criteria

1. THE RequireMfa_Filter SHALL be updated to accept any of the four admin roles (`Master`, `UserManagement`, `ProductManagement`, `OrderManagement`) as valid admin identities, in addition to requiring `mfa_verified = "true"`.
2. THE AdminOrdersController SHALL require the caller to hold the `Master` or `OrderManagement` role; WHEN the caller holds neither role, THE AdminOrdersController SHALL return HTTP 403.
3. THE AdminProductsController SHALL require the caller to hold the `Master` or `ProductManagement` role; WHEN the caller holds neither role, THE AdminProductsController SHALL return HTTP 403.
4. THE AdminCategoriesController SHALL require the caller to hold the `Master` or `ProductManagement` role; WHEN the caller holds neither role, THE AdminCategoriesController SHALL return HTTP 403.
5. THE AdminUsersController SHALL require the caller to hold the `Master` or `UserManagement` role; WHEN the caller holds neither role, THE AdminUsersController SHALL return HTTP 403.
6. WHEN an authenticated Admin_User with a valid MFA-verified JWT accesses an endpoint outside their role's scope, THE System SHALL return HTTP 403 with a Problem Details response body.
7. THE JWT SHALL include all admin role claims for the authenticated user so that the frontend can determine tab visibility without an additional API call.

---

### Requirement 3: Role-Based Tab Visibility in the Admin Panel

**User Story:** As an admin user, I want the Admin_Panel to show only the tabs I have permission to access, so that I am not presented with features I cannot use.

#### Acceptance Criteria

1. WHEN the Admin_Auth module receives a successful `auth:login` event, THE Admin_Panel SHALL read the `roles` array from the authenticated user object returned by `GET /api/v1/users/me`.
2. WHEN the authenticated user holds only the `OrderManagement` role, THE Admin_Panel SHALL display only the Orders tab and hide the Products, Categories, and Users tabs.
3. WHEN the authenticated user holds only the `ProductManagement` role, THE Admin_Panel SHALL display only the Products and Categories tabs and hide the Orders and Users tabs.
4. WHEN the authenticated user holds only the `UserManagement` role, THE Admin_Panel SHALL display only the Users tab and hide the Orders, Products, and Categories tabs.
5. WHEN the authenticated user holds the `Master` role, THE Admin_Panel SHALL display all four tabs.
6. WHEN the authenticated user holds multiple non-Master roles, THE Admin_Panel SHALL display the union of tabs permitted by each held role.
7. WHEN the Admin_Panel hides a tab, THE Admin_Panel SHALL also set the first visible tab as the active default tab on load.
8. IF no tabs are visible for the authenticated user's roles, THE Admin_Panel SHALL display an access-denied message instead of the tab bar.

---

### Requirement 4: Admin User Creation with Role Assignment

**User Story:** As a Master admin, I want to create new admin users and assign them a specific role, so that I can onboard team members with the correct access level from the start.

#### Acceptance Criteria

1. THE AdminUsersController SHALL accept a `role` field in the `POST /api/v1/admin/users` request body, where the value must be one of `Master`, `UserManagement`, `ProductManagement`, or `OrderManagement`.
2. IF the `role` field is absent from the create request, THEN THE AdminUsersController SHALL default to assigning the `OrderManagement` role.
3. IF the `role` field contains a value that is not one of the four valid admin roles, THEN THE AdminUsersController SHALL return HTTP 400 with a descriptive error message.
4. WHEN a new admin user is created successfully, THE AdminUsersController SHALL return the created user's id, email, and assigned role in the response body.
5. THE Admin_Panel Users tab SHALL include a role selector in the "Add Administrator" modal, allowing the Master admin to choose one of the four roles when creating a new admin user.
6. WHEN the `POST /api/v1/admin/users` endpoint is called by a user who does not hold the `Master` role, THE AdminUsersController SHALL return HTTP 403.

---

### Requirement 5: Admin Role Update

**User Story:** As a Master admin, I want to change the role of an existing admin user, so that I can adjust team member permissions as responsibilities change.

#### Acceptance Criteria

1. THE AdminUsersController `PUT /api/v1/admin/users/{userId}/role` endpoint SHALL accept any of the four admin role values (`Master`, `UserManagement`, `ProductManagement`, `OrderManagement`) in addition to `Customer`.
2. WHEN a valid role update request is submitted, THE AdminUsersController SHALL remove all current admin roles from the target user and assign the new role.
3. IF the target user does not exist, THEN THE AdminUsersController SHALL return HTTP 404.
4. IF the submitted role value is not one of the five valid values (`Master`, `UserManagement`, `ProductManagement`, `OrderManagement`, `Customer`), THEN THE AdminUsersController SHALL return HTTP 400.
5. WHEN the role update is successful, THE AdminUsersController SHALL return the updated userId and newRole in the response body.
6. WHEN the `PUT /api/v1/admin/users/{userId}/role` endpoint is called by a user who does not hold the `Master` role, THE AdminUsersController SHALL return HTTP 403.

---

### Requirement 6: Admin Panel Users Tab — Role Display and Management

**User Story:** As a Master admin, I want to see each admin user's current role in the Users tab and be able to change it, so that I can manage the team's access at a glance.

#### Acceptance Criteria

1. THE Admin_Panel Users tab SHALL display each admin user's current role(s) in the administrators table.
2. WHEN the authenticated user holds the `Master` role, THE Admin_Panel SHALL display a role-change control (dropdown or button) next to each admin user row.
3. WHEN the authenticated user does not hold the `Master` role, THE Admin_Panel SHALL hide the role-change controls in the administrators table.
4. WHEN a Master admin changes an admin user's role via the role-change control, THE Admin_Panel SHALL call `PUT /api/v1/admin/users/{userId}/role` and refresh the administrators table on success.
5. THE Admin_Panel SHALL display a confirmation dialog before submitting a role change.
6. WHEN the role change API call fails, THE Admin_Panel SHALL display a toast error message with the error detail returned by the API.
7. THE Admin_Panel Users tab SHALL omit the master admin account (`admin@filamorfosis.com`) from the administrators table and from any user list or selector, regardless of which admin role the authenticated user holds.
8. WHEN the authenticated user's own row appears in the administrators table, THE Admin_Panel SHALL hide the delete and role-change controls on that row.

---

### Requirement 7: MFA Login Flow Compatibility

**User Story:** As any admin user, I want the existing MFA login flow to work unchanged regardless of my specific admin role, so that security is not degraded by the role split.

#### Acceptance Criteria

1. THE Admin_Auth module SHALL accept any user whose `roles` array contains at least one of `Master`, `UserManagement`, `ProductManagement`, or `OrderManagement` as a valid admin identity during session check.
2. WHEN `GET /api/v1/users/me` returns a user whose `roles` array contains none of the four admin roles, THE Admin_Auth module SHALL display the access-denied state instead of the admin panel.
3. WHILE an admin user's MFA is not verified (`mfaVerified` is false), THE Admin_Auth module SHALL redirect the user to the TOTP verification step regardless of their specific admin role.
4. THE Admin_Auth module SHALL fire the `auth:login` event with the full user object (including the `roles` array) after successful MFA verification, so that downstream modules can apply role-based visibility.

---

### Requirement 8: Backward Compatibility and Migration

**User Story:** As a developer, I want existing `Admin` role users to be migrated to the `Master` role, so that no admin loses access when the feature is deployed.

#### Acceptance Criteria

1. THE System SHALL include a database migration or seed script that renames the existing `Admin` role to `Master` in the ASP.NET Core Identity `AspNetRoles` table.
2. WHEN the migration runs, THE System SHALL reassign all users currently in the `Admin` role to the `Master` role.
3. THE System SHALL seed the three new roles (`UserManagement`, `ProductManagement`, `OrderManagement`) into the `AspNetRoles` table if they do not already exist.
4. WHEN the migration completes, THE System SHALL leave no users assigned to a role named `Admin`.
5. THE System SHALL preserve all existing MFA secrets and user data during the migration.

---

### Requirement 9: Master Account Invisibility and Self-Action Prevention

**User Story:** As a system architect, I want the master admin account to be permanently hidden from the admin panel UI and want to prevent any admin from modifying or deleting their own account, so that the superuser account is protected and no admin can accidentally lock themselves out.

#### Acceptance Criteria

1. THE AdminUsersController SHALL exclude the master admin account (`admin@filamorfosis.com`) from all responses to `GET /api/v1/admin/users` and any other endpoint that returns lists of admin users.
2. THE Admin_Panel SHALL never render the master admin account in any table, dropdown, selector, or list within the admin panel, regardless of the authenticated user's role.
3. WHEN a request to delete or demote the master admin account is received, THE AdminUsersController SHALL return HTTP 403 with a descriptive error message.
4. WHEN an Admin_User submits a `DELETE /api/v1/admin/users/{userId}` request where `userId` matches their own account, THE AdminUsersController SHALL return HTTP 403 with a descriptive error message.
5. WHEN an Admin_User submits a `PUT /api/v1/admin/users/{userId}/role` request where `userId` matches their own account, THE AdminUsersController SHALL return HTTP 403 with a descriptive error message.
6. THE Admin_Panel SHALL hide the delete and role-change action controls on the row corresponding to the currently authenticated user's own account in the administrators table.
7. IF the Admin_Panel receives an HTTP 403 response from a self-action attempt, THEN THE Admin_Panel SHALL display a toast error message indicating that self-modification is not permitted.
