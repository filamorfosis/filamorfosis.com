# Implementation Plan: Admin Role Management

## Overview

Replace the single monolithic `Admin` role with four granular admin roles (`Master`, `UserManagement`, `ProductManagement`, `OrderManagement`). Work proceeds layer by layer: Migration → Backend (RequireMfa + Controllers + DTOs) → Property Tests → Frontend. Each task builds directly on the previous ones so no code is left orphaned.

The existing `Admin` role is renamed to `Master` in-place via a migration. All four new roles still require MFA verification. The frontend reads the `roles` array from the JWT to show/hide tabs and action controls.

---

## Tasks

- [x] 1. Database migration — rename `Admin` to `Master` and seed new roles
  - [x] 1.1 Create EF Core migration `AdminRoleManagement` in `Filamorfosis.Infrastructure`
    - UPDATE `AspNetRoles` row where `NormalizedName = 'ADMIN'` → set `Name = 'Master'`, `NormalizedName = 'MASTER'`
    - UPDATE `AspNetUserRoles` to point to the new `Master` role id for any user previously assigned `Admin`
    - INSERT `UserManagement`, `ProductManagement`, `OrderManagement` rows into `AspNetRoles` if absent
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  - [x] 1.2 Update `DbSeeder` to use `Master` instead of `Admin` for the default superuser account and to seed all four roles
    - Replace `"Admin"` string literals with `"Master"` in the seeder
    - Add seeding for `UserManagement`, `ProductManagement`, `OrderManagement` roles
    - _Requirements: 8.1, 8.3_

- [x] 2. Backend — update `RequireMfaAttribute` to accept all four admin roles
  - Update `RequireMfaAttribute.cs` in `Filamorfosis.API/Authorization/`
  - Replace the hard-coded `IsInRole("Admin")` check with a check against `["Master", "UserManagement", "ProductManagement", "OrderManagement"]`
  - The `mfa_verified == "true"` claim check is unchanged
  - _Requirements: 2.1, 7.1_

- [x] 3. Backend — add role-scoped `[Authorize]` to admin controllers
  - [x] 3.1 Add `[Authorize(Roles = "Master,OrderManagement")]` to `AdminOrdersController`
    - Keep existing `[RequireMfa]` attribute; add the new `[Authorize]` above it
    - _Requirements: 1.6, 2.2_
  - [x] 3.2 Add `[Authorize(Roles = "Master,ProductManagement")]` to `AdminProductsController`
    - _Requirements: 1.5, 2.3_
  - [x] 3.3 Add `[Authorize(Roles = "Master,ProductManagement")]` to `AdminCategoriesController`
    - _Requirements: 1.5, 2.4_
  - [x] 3.4 Add `[Authorize(Roles = "Master,UserManagement")]` to `AdminUsersController` (controller level)
    - _Requirements: 1.4, 2.5_

- [x] 4. Backend — update `AdminUsersController` with granular role logic
  - [x] 4.1 Add `[Authorize(Roles = "Master")]` to `CreateAdminUser` and `UpdateUserRole` action methods
    - These two write actions are Master-only; `GET /admin/users` remains accessible to `UserManagement`
    - _Requirements: 4.6, 5.6_
  - [x] 4.2 Update `CreateAdminUserRequest` record to add `string? Role` field
    - Default to `"OrderManagement"` when `Role` is null or absent
    - Validate that `Role` is one of `Master | UserManagement | ProductManagement | OrderManagement`; return 400 with descriptive message if invalid
    - Assign the validated role instead of hard-coded `"Admin"`
    - Return `id`, `email`, and `role` in the 200 response body
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [x] 4.3 Update `UpdateUserRole` action to accept all five valid role values
    - Valid values: `Master | UserManagement | ProductManagement | OrderManagement | Customer`
    - Replace the old `"Admin" | "Customer"` validation with the new set; return 400 with descriptive message for any other value
    - Remove all current admin roles from the user before assigning the new role
    - Return `userId` and `newRole` in the 200 response body
    - _Requirements: 5.1, 5.2, 5.4, 5.5_
  - [x] 4.4 Add self-action and master-account protection to `UpdateUserRole` (and any future delete action)
    - If `userId` matches the caller's own id → return 403 `{ detail: "No puedes modificar tu propia cuenta." }`
    - If target user email is `admin@filamorfosis.com` → return 403 `{ detail: "La cuenta maestra no puede ser modificada." }`
    - _Requirements: 9.3, 9.4, 9.5_
  - [x] 4.5 Update `GetAllUsers` to exclude the master account and filter to admin users only
    - Add `.Where(u => u.Email != "admin@filamorfosis.com")` to the query
    - _Requirements: 9.1_

- [x] 5. Backend — property-based tests (FsCheck + WebApplicationFactory)
  - [x] 5.1 Create `AdminRoleManagementPropertyTests.cs` in `Filamorfosis.Tests/`
    - Follow the same file structure and helper pattern as `AdminAuthorizationPropertyTests.cs`
    - Add file-level tag comments for all properties covered in this file
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 2.2, 2.3, 2.4, 2.5, 4.1, 4.3, 4.6, 5.1, 5.4, 5.6, 9.1, 9.4, 9.5_
  - [x] 5.2 Write property test for role-scoped endpoint access — **Property 1**
    - Tag: `// Feature: admin-role-management, Property 1: Role-scoped endpoint access`
    - Generator: `(role, endpoint)` pairs where `role ∈ {UserManagement, ProductManagement, OrderManagement}` and `endpoint` is sampled from all admin endpoint prefixes
    - Assertion: if `endpoint` is outside `role`'s scope → 403; if inside → not 403 (given valid MFA-verified JWT)
    - **Validates: Requirements 1.3, 1.4, 1.5, 1.6, 2.2, 2.3, 2.4, 2.5, 2.6**
  - [x] 5.3 Write property test for JWT role claims — **Property 2**
    - Tag: `// Feature: admin-role-management, Property 2: JWT contains all role claims`
    - Generator: random subset of admin roles assigned to a generated user
    - Assertion: decoded JWT `role` claims match the assigned roles exactly (no more, no fewer)
    - **Validates: Requirements 2.7**
  - [x] 5.4 Write property test for admin user creation role round-trip — **Property 4**
    - Tag: `// Feature: admin-role-management, Property 4: Admin user creation role round-trip`
    - Generator: random valid admin role + random user credentials
    - Assertion: POST response contains the role; subsequent GET /admin/users includes the new user with that exact role
    - **Validates: Requirements 4.1, 4.4**
  - [x] 5.5 Write property test for invalid role values rejected — **Property 5**
    - Tag: `// Feature: admin-role-management, Property 5: Invalid role values are rejected`
    - Generator: arbitrary strings filtered to exclude the five valid role values
    - Assertion: both `POST /admin/users` and `PUT /admin/users/{id}/role` return 400
    - **Validates: Requirements 4.3, 5.4**
  - [x] 5.6 Write property test for role update round-trip — **Property 6**
    - Tag: `// Feature: admin-role-management, Property 6: Role update round-trip`
    - Generator: random admin user + random target role from the five valid values
    - Assertion: after PUT, GET /admin/users shows the user with exactly the new role and no previous admin roles
    - **Validates: Requirements 5.1, 5.2**
  - [x] 5.7 Write property test for non-Master write restriction — **Property 7**
    - Tag: `// Feature: admin-role-management, Property 7: Non-Master users cannot write to admin/users`
    - Generator: random role from `{UserManagement, ProductManagement, OrderManagement}`
    - Assertion: `POST /admin/users` and `PUT /admin/users/{id}/role` both return 403
    - **Validates: Requirements 4.6, 5.6**
  - [x] 5.8 Write property test for master account exclusion — **Property 8**
    - Tag: `// Feature: admin-role-management, Property 8: Master account excluded from all user list responses`
    - Generator: random number of additional users in the DB alongside the seeded master account
    - Assertion: `GET /admin/users` response never contains `admin@filamorfosis.com`
    - **Validates: Requirements 9.1**
  - [x] 5.9 Write property test for self-action prevention — **Property 9**
    - Tag: `// Feature: admin-role-management, Property 9: Self-action prevention`
    - Generator: random admin role for the caller
    - Assertion: `PUT /admin/users/{callerId}/role` returns 403
    - **Validates: Requirements 9.4, 9.5**

- [x] 6. Checkpoint — backend complete
  - Ensure all backend tests pass: `dotnet test` from `backend/`
  - Verify the new migration applies cleanly against a fresh SQLite database
  - Ask the user if any questions arise before proceeding to the frontend

- [x] 7. Frontend — `admin-auth.js` session check update
  - Update `checkAdminSession()` in `assets/js/admin-auth.js`
  - Replace `user.roles.includes('Admin')` with a check against `['Master', 'UserManagement', 'ProductManagement', 'OrderManagement']`
  - Fire the `auth:login` event with the full user object (including `roles`) unchanged
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 8. Frontend — `admin.html` tab visibility logic
  - [x] 8.1 Add `_applyTabVisibility(roles)` function to the inline `<script>` block in `admin.html`
    - Define `TAB_PERMISSIONS` map: `orders → [Master, OrderManagement]`, `products → [Master, ProductManagement]`, `categories → [Master, ProductManagement]`, `users → [Master, UserManagement]`
    - Hide tabs whose role list has no intersection with the user's roles; show the rest
    - Set the first visible tab as the active default
    - If no tabs are visible, replace `.admin-wrap` content with an access-denied message
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_
  - [x] 8.2 Call `_applyTabVisibility(user.roles || [])` from the `auth:login` event listener in `admin.html`
    - _Requirements: 3.1_
  - [x] 8.3 Add role selector `<select>` to the `#add-admin-form` modal in `admin.html`
    - Options: `OrderManagement` (default/selected), `ProductManagement`, `UserManagement`, `Master`
    - _Requirements: 4.5_

- [x] 9. Frontend — `admin-users.js` role display and management
  - [x] 9.1 Update `separateUsers()` to check for any of the four admin roles
    - Define `ADMIN_ROLES = ['Master', 'UserManagement', 'ProductManagement', 'OrderManagement']`
    - `adminUsers`: users whose `roles` array intersects `ADMIN_ROLES`
    - `storeUsers`: all others
    - _Requirements: 6.1_
  - [x] 9.2 Update `renderAdminUsersTable()` to add role badge column and conditional controls
    - Add a `Rol` column showing each admin role as a `<span class="badge badge-purple">` per role
    - Hide delete and role-change controls on the row matching the current user's own id
    - Omit any row where `user.email === 'admin@filamorfosis.com'`
    - Show role-change `<select>` (with all four admin roles + `Customer (Remover)`) only when the authenticated user holds `Master`
    - _Requirements: 6.1, 6.2, 6.3, 6.7, 6.8, 9.2_
  - [x] 9.3 Update `handleAddAdmin()` to read the `role` field from the form and include it in the POST body
    - Default to `'OrderManagement'` if the field is absent
    - _Requirements: 4.5_
  - [x] 9.4 Add `changeRole(userId, newRole)` method to `AdminUsers`
    - Show confirmation dialog before submitting
    - Call `PUT /api/v1/admin/users/{userId}/role` via `window.adminApi.apiFetch`
    - On success: show success toast and call `loadUsers()`
    - On failure: show toast with `err.detail` (handle 403 self-action response specifically)
    - _Requirements: 6.4, 6.5, 6.6, 9.6, 9.7_

- [x] 10. Final checkpoint — full stack integration
  - Ensure all backend tests pass: `dotnet test` from `backend/`
  - Manually verify that a `UserManagement` user sees only the Users tab, a `ProductManagement` user sees only Products and Categories, an `OrderManagement` user sees only Orders, and a `Master` user sees all four tabs
  - Ask the user if any questions arise before marking the feature complete

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests use `FsCheck` with `WebApplicationFactory` following the same pattern as `AdminAuthorizationPropertyTests.cs`; each property test file carries tag comments `// Feature: admin-role-management, Property N: <text>` for traceability
- Property 3 (tab visibility) is a pure-function JS test and is intentionally omitted from the backend test file; it can be validated manually or with a lightweight DOM mock
- Property 10 and Property 11 (UI rendering) are frontend-only concerns validated manually in Task 10
- The `[RequireMfa]` filter update (Task 2) must be completed before any role-scoped controller work (Task 3), because the filter runs first and must not reject valid non-`Admin` role tokens
- The migration (Task 1) must be applied before any integration tests that create users with the new role names
- All error responses follow the RFC 7807 Problem Details format already established in the codebase
