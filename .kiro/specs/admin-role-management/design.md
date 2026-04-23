# Design Document — admin-role-management

## Overview

This feature replaces the single monolithic `Admin` role with four granular admin roles:
`Master`, `UserManagement`, `ProductManagement`, and `OrderManagement`. Every admin user
still requires MFA (TOTP) before accessing any admin endpoint. The change is purely
additive at the identity layer — the JWT, cookie, and MFA flows are unchanged. What
changes is (a) which role names are valid, (b) which controllers accept which roles, and
(c) how the frontend reads the `roles` array to show/hide tabs and action controls.

### Key Design Decisions

1. **No new auth mechanism** — role enforcement is added as a second `[Authorize]`
   attribute on each controller, layered on top of the existing `[RequireMfa]` filter.
   This keeps the two concerns separate and avoids modifying the MFA filter's core logic.

2. **`RequireMfaAttribute` is widened, not replaced** — the filter currently hard-codes
   `IsInRole("Admin")`. It will be updated to check for any of the four new role names.
   The MFA-verified claim check is unchanged.

3. **`POST /admin/users` and `PUT /admin/users/{id}/role` are Master-only** — a separate
   `[Authorize(Roles = "Master")]` attribute is added to those action methods only,
   rather than to the whole controller, because `GET /admin/users` must remain accessible
   to `UserManagement` users.

4. **Frontend tab visibility is computed client-side from `user.roles`** — no extra API
   call is needed because the JWT already embeds all role claims, and `GET /users/me`
   returns the decoded roles array.

5. **Migration renames `Admin` → `Master` in-place** — a new EF Core migration updates
   the `AspNetRoles` row and re-seeds the three new roles. No user data or MFA secrets
   are touched.

---

## Architecture

```mermaid
graph TD
    subgraph Frontend ["admin.html + JS modules"]
        AA[admin-auth.js<br/>checkAdminSession]
        AU[admin-users.js]
        HTML[admin.html<br/>tab bar + modals]
    end

    subgraph Backend ["ASP.NET Core API"]
        MFA[RequireMfaAttribute<br/>checks any of 4 roles + mfa_verified]
        AUC[AdminUsersController<br/>Master | UserManagement]
        AOC[AdminOrdersController<br/>Master | OrderManagement]
        APC[AdminProductsController<br/>Master | ProductManagement]
        ACC[AdminCategoriesController<br/>Master | ProductManagement]
        JWT[JwtService<br/>embeds all role claims]
        SEED[DbSeeder / Migration<br/>Admin→Master + 3 new roles]
    end

    subgraph Identity ["ASP.NET Core Identity"]
        ROLES[(AspNetRoles<br/>Master, UserManagement,<br/>ProductManagement, OrderManagement, Customer)]
        UR[(AspNetUserRoles)]
    end

    AA -->|GET /users/me → roles[]| Backend
    AA -->|auth:login event + user obj| AU
    AA -->|auth:login event + user obj| HTML
    HTML -->|tab visibility logic| HTML
    AU -->|GET /admin/users| AUC
    AU -->|POST /admin/users| AUC
    AU -->|PUT /admin/users/{id}/role| AUC

    MFA --> AUC
    MFA --> AOC
    MFA --> APC
    MFA --> ACC

    JWT --> MFA
    SEED --> ROLES
    ROLES --> UR
    UR --> JWT
```

---

## Components and Interfaces

### Backend

#### `RequireMfaAttribute` (updated)

```csharp
// Before
if (!user.IsInRole("Admin")) { ... 403 ... }

// After — accepts any of the four admin roles
private static readonly string[] AdminRoles =
    ["Master", "UserManagement", "ProductManagement", "OrderManagement"];

if (!AdminRoles.Any(r => user.IsInRole(r))) { ... 403 ... }
```

The MFA-verified claim check (`mfa_verified == "true"`) is unchanged.

#### Per-controller role enforcement

Each admin controller gains a second `[Authorize]` attribute. The `[RequireMfa]` filter
continues to run first (it is an `IAuthorizationFilter`, so it runs before `[Authorize]`
policy evaluation).

```csharp
// AdminOrdersController
[Authorize(Roles = "Master,OrderManagement")]
[RequireMfa]
public class AdminOrdersController ...

// AdminProductsController
[Authorize(Roles = "Master,ProductManagement")]
[RequireMfa]
public class AdminProductsController ...

// AdminCategoriesController
[Authorize(Roles = "Master,ProductManagement")]
[RequireMfa]
public class AdminCategoriesController ...

// AdminUsersController — controller-level allows Master + UserManagement
[Authorize(Roles = "Master,UserManagement")]
[RequireMfa]
public class AdminUsersController ...
```

#### `AdminUsersController` — action-level Master-only enforcement

`POST /admin/users` and `PUT /admin/users/{id}/role` require `Master` only:

```csharp
[HttpPost]
[Authorize(Roles = "Master")]
public async Task<IActionResult> CreateAdminUser(...)

[HttpPut("{userId}/role")]
[Authorize(Roles = "Master")]
public async Task<IActionResult> UpdateUserRole(...)
```

#### `AdminUsersController` — `GET /admin/users` exclusion

```csharp
var users = await userManager.Users
    .Where(u => u.Email != "admin@filamorfosis.com")   // exclude master account
    .Include(u => u.MfaSecret)
    .OrderByDescending(u => u.CreatedAt)
    .ToListAsync();
```

#### Updated DTOs

```csharp
// CreateAdminUserRequest — adds Role field
public record CreateAdminUserRequest(
    string Email,
    string Password,
    string? FirstName,
    string? LastName,
    string? Role          // defaults to "OrderManagement" if null/absent
);

// UpdateUserRoleRequest — unchanged shape, but validation expands to 5 valid values
public record UpdateUserRoleRequest(string Role);
// Valid values: "Master" | "UserManagement" | "ProductManagement" | "OrderManagement" | "Customer"
```

#### Role validation helper (in `AdminUsersController`)

```csharp
private static readonly HashSet<string> ValidAdminRoles =
    ["Master", "UserManagement", "ProductManagement", "OrderManagement"];

private static readonly HashSet<string> ValidAssignableRoles =
    ["Master", "UserManagement", "ProductManagement", "OrderManagement", "Customer"];
```

#### Self-action and master-account protection

```csharp
// In UpdateUserRole and any future Delete action:
var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

if (userId == currentUserId)
    return StatusCode(403, new { detail = "No puedes modificar tu propia cuenta." });

var targetUser = await userManager.FindByIdAsync(userId);
if (targetUser?.Email == "admin@filamorfosis.com")
    return StatusCode(403, new { detail = "La cuenta maestra no puede ser modificada." });
```

#### Migration / Seed

A new EF Core migration (`AdminRoleManagement`) will:

1. Rename the `Admin` row in `AspNetRoles` to `Master` (UPDATE by normalized name).
2. Insert `UserManagement`, `ProductManagement`, `OrderManagement` if absent.
3. Update `AspNetUserRoles` to point to the new `Master` role id for any user previously
   assigned `Admin`.

`DbSeeder` is updated to seed all four roles and use `Master` instead of `Admin` for the
default superuser account.

---

### Frontend

#### `admin-auth.js` — `checkAdminSession` update

```js
// Before
if (!user.roles.includes('Admin')) { _showAccessDenied(); return; }

// After
const ADMIN_ROLES = ['Master', 'UserManagement', 'ProductManagement', 'OrderManagement'];
if (!user.roles.some(r => ADMIN_ROLES.includes(r))) { _showAccessDenied(); return; }
```

The `auth:login` event is fired with the full user object (including `roles`) unchanged.

#### `admin.html` — tab visibility after `auth:login`

A new `_applyTabVisibility(roles)` function is called from the `auth:login` handler in
the inline `<script>` block. It hides/shows tabs and sets the first visible tab active:

```js
const TAB_PERMISSIONS = {
  orders:     ['Master', 'OrderManagement'],
  products:   ['Master', 'ProductManagement'],
  categories: ['Master', 'ProductManagement'],
  users:      ['Master', 'UserManagement'],
};

function _applyTabVisibility(roles) {
  let firstVisible = null;
  document.querySelectorAll('.admin-tab').forEach(btn => {
    const tab = btn.dataset.tab;
    const allowed = TAB_PERMISSIONS[tab] || [];
    const visible = roles.some(r => allowed.includes(r));
    btn.style.display = visible ? '' : 'none';
    if (visible && !firstVisible) firstVisible = tab;
  });

  // Activate first visible tab
  if (firstVisible) {
    document.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
    document.querySelector(`.admin-tab[data-tab="${firstVisible}"]`)?.classList.add('active');
    document.getElementById(`panel-${firstVisible}`)?.classList.add('active');
  } else {
    // No visible tabs — show access denied
    document.querySelector('.admin-wrap').innerHTML = ACCESS_DENIED_HTML;
  }
}
```

Called from the `auth:login` listener:

```js
document.addEventListener('auth:login', async (e) => {
  const user = e.detail;
  _applyTabVisibility(user.roles || []);
  // ... existing init calls
});
```

#### `admin.html` — role selector in "Add Administrator" modal

A `<select>` is added to the `#add-admin-form`:

```html
<div class="modal-form-field">
  <label for="add-admin-role">Rol</label>
  <select id="add-admin-role" name="role" required>
    <option value="OrderManagement" selected>OrderManagement</option>
    <option value="ProductManagement">ProductManagement</option>
    <option value="UserManagement">UserManagement</option>
    <option value="Master">Master</option>
  </select>
</div>
```

#### `admin-users.js` — updates

**`separateUsers()`** — updated to check for any of the four admin roles:

```js
const ADMIN_ROLES = ['Master', 'UserManagement', 'ProductManagement', 'OrderManagement'];

separateUsers() {
  this.adminUsers = this.allUsers.filter(u =>
    (u.roles || []).some(r => ADMIN_ROLES.includes(r))
  );
  this.storeUsers = this.allUsers.filter(u =>
    !(u.roles || []).some(r => ADMIN_ROLES.includes(r))
  );
},
```

**`renderAdminUsersTable()`** — adds role badge column, hides own-row controls, hides
master account row, shows role-change dropdown only for Master users:

```js
renderAdminUsersTable() {
  const currentUser = window.AdminAuth.getCurrentUser();
  const isMaster = (currentUser?.roles || []).includes('Master');

  tbody.innerHTML = this.adminUsers.map(user => {
    const isSelf = user.id === currentUser?.id;
    const roleBadge = (user.roles || [])
      .filter(r => ADMIN_ROLES.includes(r))
      .map(r => `<span class="badge badge-purple">${r}</span>`)
      .join(' ');

    const actions = isSelf ? '' : `
      ${isMaster ? `
        <select onchange="AdminUsers.changeRole('${user.id}', this.value)" ...>
          <option value="Master" ${user.roles.includes('Master') ? 'selected' : ''}>Master</option>
          <option value="OrderManagement" ...>OrderManagement</option>
          <option value="ProductManagement" ...>ProductManagement</option>
          <option value="UserManagement" ...>UserManagement</option>
          <option value="Customer" ...>Customer (Remover)</option>
        </select>` : ''}`;

    return `<tr>
      <td>${user.email}</td>
      <td>${fullName}</td>
      <td>${date}</td>
      <td>${mfaBadge}</td>
      <td>${roleBadge}</td>
      <td>${actions}</td>
    </tr>`;
  }).join('');
},
```

**`handleAddAdmin()`** — reads the `role` field from the form:

```js
const data = {
  email:     formData.get('email'),
  password:  formData.get('password'),
  firstName: formData.get('firstName'),
  lastName:  formData.get('lastName'),
  role:      formData.get('role') || 'OrderManagement',
};
```

**`changeRole(userId, newRole)`** — new method:

```js
async changeRole(userId, newRole) {
  const confirmed = await this.showConfirm(
    'Cambiar Rol',
    `¿Cambiar el rol de este usuario a "${newRole}"?`
  );
  if (!confirmed) return;
  try {
    await window.adminApi.apiFetch(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role: newRole })
    });
    window.toast('Rol actualizado', true);
    await this.loadUsers();
  } catch (err) {
    window.toast(err.detail || 'Error al cambiar rol', false);
  }
},
```

---

## Data Models

### Role names (Identity)

| Role name          | Scope                                      |
|--------------------|--------------------------------------------|
| `Master`           | All admin endpoints and tabs               |
| `UserManagement`   | `/admin/users` GET only; Users tab         |
| `ProductManagement`| `/admin/products`, `/admin/categories`; Products + Categories tabs |
| `OrderManagement`  | `/admin/orders`; Orders tab                |
| `Customer`         | No admin access                            |

### JWT claims (no schema change)

The `JwtService.GenerateAccessToken` already emits one `ClaimTypes.Role` claim per role.
No changes needed — multi-role users will have multiple role claims in the token, which
ASP.NET Core's `[Authorize(Roles = "...")]` evaluates correctly.

### `CreateAdminUserRequest` (updated)

```csharp
public record CreateAdminUserRequest(
    string Email,
    string Password,
    string? FirstName,
    string? LastName,
    string? Role   // "Master" | "UserManagement" | "ProductManagement" | "OrderManagement"
                   // null → defaults to "OrderManagement"
);
```

### `UpdateUserRoleRequest` (unchanged shape, expanded validation)

```csharp
public record UpdateUserRoleRequest(string Role);
// Valid: "Master" | "UserManagement" | "ProductManagement" | "OrderManagement" | "Customer"
```

### `GET /admin/users` response shape (updated)

Each user object in the response array gains a `roles` field (already present in the
current implementation via `GetRolesAsync`). No schema change needed — the field is
already returned.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid
executions of a system — essentially, a formal statement about what the system should do.
Properties serve as the bridge between human-readable specifications and
machine-verifiable correctness guarantees.*

### Property 1: Role-scoped endpoint access

*For any* admin role and any admin API endpoint, if the endpoint is outside that role's
permitted scope, the API SHALL return HTTP 403; if the endpoint is within the role's
permitted scope, the API SHALL return a non-403 response (given a valid MFA-verified JWT).

**Validates: Requirements 1.3, 1.4, 1.5, 1.6, 2.2, 2.3, 2.4, 2.5, 2.6**

### Property 2: JWT contains all role claims

*For any* admin user assigned N roles, the access token issued after successful MFA
verification SHALL contain exactly those N role claims and no other admin role claims.

**Validates: Requirements 2.7**

### Property 3: Tab visibility equals role permission union

*For any* non-empty set of admin roles assigned to a user, the set of visible tabs
computed by `_applyTabVisibility(roles)` SHALL equal the union of tabs permitted by each
individual role in the set.

**Validates: Requirements 3.2, 3.3, 3.4, 3.5, 3.6**

### Property 4: Admin user creation role round-trip

*For any* valid admin role value (`Master`, `UserManagement`, `ProductManagement`,
`OrderManagement`), creating an admin user via `POST /admin/users` with that role SHALL
result in the response body containing that exact role, and a subsequent `GET /admin/users`
SHALL include the new user with that role.

**Validates: Requirements 4.1, 4.4**

### Property 5: Invalid role values are rejected

*For any* string that is not one of the five valid role values (`Master`, `UserManagement`,
`ProductManagement`, `OrderManagement`, `Customer`), both `POST /admin/users` and
`PUT /admin/users/{id}/role` SHALL return HTTP 400.

**Validates: Requirements 4.3, 5.4**

### Property 6: Role update round-trip

*For any* admin user and any valid target role, after a successful
`PUT /admin/users/{userId}/role` call, the user SHALL have exactly the new role and no
previous admin roles.

**Validates: Requirements 5.1, 5.2**

### Property 7: Non-Master users cannot write to admin/users

*For any* of the three non-Master admin roles (`UserManagement`, `ProductManagement`,
`OrderManagement`), both `POST /admin/users` and `PUT /admin/users/{id}/role` SHALL
return HTTP 403.

**Validates: Requirements 4.6, 5.6**

### Property 8: Master account excluded from all user list responses

*For any* database state, `GET /admin/users` SHALL never include a user with email
`admin@filamorfosis.com` in its response body.

**Validates: Requirements 9.1**

### Property 9: Self-action prevention

*For any* authenticated admin user, submitting `PUT /admin/users/{userId}/role` where
`userId` matches the caller's own identity SHALL return HTTP 403.

**Validates: Requirements 9.4, 9.5**

### Property 10: Master account exclusion in rendered UI

*For any* user list passed to the admin users table renderer that contains a user with
email `admin@filamorfosis.com`, the rendered HTML SHALL not contain that email address.

**Validates: Requirements 6.7, 9.2**

### Property 11: Own-row action controls hidden

*For any* admin user viewing the administrators table, the rendered row corresponding to
their own `user.id` SHALL not contain role-change or delete action controls.

**Validates: Requirements 6.8, 9.6**

---

## Error Handling

| Scenario | HTTP status | Response body |
|---|---|---|
| Unauthenticated request to any admin endpoint | 401 | Problem Details |
| Authenticated but wrong role for endpoint | 403 | Problem Details |
| MFA not verified (valid JWT, no `mfa_verified` claim) | 403 | Problem Details |
| `POST /admin/users` with invalid role string | 400 | `{ detail: "Rol inválido. ..." }` |
| `PUT /admin/users/{id}/role` with invalid role string | 400 | `{ detail: "Rol inválido. ..." }` |
| `PUT /admin/users/{id}/role` targeting own account | 403 | `{ detail: "No puedes modificar tu propia cuenta." }` |
| `PUT /admin/users/{id}/role` targeting master account | 403 | `{ detail: "La cuenta maestra no puede ser modificada." }` |
| `PUT /admin/users/{id}/role` by non-Master user | 403 | Problem Details (from `[Authorize(Roles="Master")]`) |
| `POST /admin/users` by non-Master user | 403 | Problem Details |
| Target user not found | 404 | `{ detail: "Usuario no encontrado" }` |
| Frontend: role change API returns 403 | — | Toast error with `err.detail` |
| Frontend: no visible tabs for user's roles | — | Access-denied message in `.admin-wrap` |

---

## Testing Strategy

### Unit / Example tests

- `RequireMfaAttribute` accepts each of the four admin roles with `mfa_verified=true`.
- `RequireMfaAttribute` rejects a user with no admin role.
- `AdminUsersController.GetAllUsers` excludes `admin@filamorfosis.com`.
- `AdminUsersController.CreateAdminUser` defaults to `OrderManagement` when `role` is null.
- `AdminUsersController.UpdateUserRole` returns 403 when caller targets their own id.
- `AdminUsersController.UpdateUserRole` returns 403 when target is master account.
- `_applyTabVisibility([])` renders access-denied state.
- `_applyTabVisibility(['Master'])` shows all four tabs.
- Role selector is present in the Add Administrator modal.

### Property-based tests (FsCheck, minimum 100 iterations each)

The project uses FsCheck with `WebApplicationFactory` for integration-level property
tests. New tests follow the same pattern as `AdminAuthorizationPropertyTests.cs`.

**Property 1 — Role-scoped endpoint access**
Tag: `Feature: admin-role-management, Property 1: Role-scoped endpoint access`
- Generator: `(role, endpoint)` pairs where `role ∈ {UserManagement, ProductManagement, OrderManagement}` and `endpoint` is sampled from all admin endpoint prefixes.
- Assertion: if `endpoint` is outside `role`'s scope → 403; if inside → not 403.

**Property 2 — JWT contains all role claims**
Tag: `Feature: admin-role-management, Property 2: JWT contains all role claims`
- Generator: random subset of admin roles assigned to a generated user.
- Assertion: decoded JWT `role` claims match the assigned roles exactly.

**Property 3 — Tab visibility equals role permission union**
Tag: `Feature: admin-role-management, Property 3: Tab visibility equals role permission union`
- Generator: random non-empty subsets of `{Master, UserManagement, ProductManagement, OrderManagement}`.
- Assertion: `_applyTabVisibility(roles)` visible tab set equals union of each role's permitted tabs.
- Note: this is a pure-function test on the JS tab visibility logic; can be tested with a lightweight DOM mock.

**Property 4 — Admin user creation role round-trip**
Tag: `Feature: admin-role-management, Property 4: Admin user creation role round-trip`
- Generator: random valid admin role + random user credentials.
- Assertion: POST response contains the role; subsequent GET includes the user with that role.

**Property 5 — Invalid role values are rejected**
Tag: `Feature: admin-role-management, Property 5: Invalid role values are rejected`
- Generator: arbitrary strings filtered to exclude the five valid role values.
- Assertion: both POST and PUT return 400.

**Property 6 — Role update round-trip**
Tag: `Feature: admin-role-management, Property 6: Role update round-trip`
- Generator: random admin user + random target role from the five valid values.
- Assertion: after PUT, GET /admin/users shows the user with exactly the new role.

**Property 7 — Non-Master users cannot write to admin/users**
Tag: `Feature: admin-role-management, Property 7: Non-Master users cannot write to admin/users`
- Generator: random role from `{UserManagement, ProductManagement, OrderManagement}`.
- Assertion: POST /admin/users and PUT /admin/users/{id}/role both return 403.

**Property 8 — Master account excluded from all user list responses**
Tag: `Feature: admin-role-management, Property 8: Master account excluded from all user list responses`
- Generator: random number of additional users in the DB alongside the seeded master account.
- Assertion: GET /admin/users response never contains `admin@filamorfosis.com`.

**Property 9 — Self-action prevention**
Tag: `Feature: admin-role-management, Property 9: Self-action prevention`
- Generator: random admin role for the caller.
- Assertion: PUT /admin/users/{callerId}/role returns 403.
