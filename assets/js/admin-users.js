/**
 * admin-users.js — Users tab for admin.html
 *
 * Responsibilities:
 *  - loadUsers(): fetches all registered users from GET /api/v1/admin/users
 *  - Separates admin users and store users into different tables
 *  - Handles pagination for store users
 *  - Provides functionality to add new admin users with multi-role checkboxes
 *  - Allows editing admin user roles via multi-role modal (Master only)
 *
 * Requirements: 1.1, 1.7, 6.1–6.8, 9.1–9.7
 */

(function (window) {
  'use strict';

  // Valid admin roles (Requirements 1.1, 1.5)
  var ADMIN_ROLES = ['Master', 'UserManagement', 'ProductManagement', 'OrderManagement', 'PriceManagement'];

  var AdminUsers = {
    allUsers: [],
    adminUsers: [],
    storeUsers: [],
    currentPage: 1,
    pageSize: 10,

    async loadUsers() {
      try {
        var users = await window.adminGetUsers();
        this.allUsers = users || [];
        this.separateUsers();
        this.renderAdminUsersTable();
        this.renderStoreUsersTable();
      } catch (err) {
        console.error('[AdminUsers] Load failed:', err);
        this.showError('admin-users-tbody', 6);
        this.showError('store-users-tbody', 5);
      }
    },

    // Requirements: 6.1 — separate users by admin role membership
    separateUsers() {
      var adminUsers = [];
      var storeUsers = [];

      this.allUsers.forEach(function (user) {
        var roles = user.roles || [];
        if (roles.some(function (r) { return ADMIN_ROLES.includes(r); })) {
          adminUsers.push(user);
        } else {
          storeUsers.push(user);
        }
      });

      this.adminUsers = adminUsers;
      this.storeUsers = storeUsers;
    },

    // Requirements: 6.1–6.3, 6.7, 6.8, 9.2
    renderAdminUsersTable() {
      var tbody = document.getElementById('admin-users-tbody');
      if (!tbody) return;

      if (!this.adminUsers || this.adminUsers.length === 0) {
        tbody.innerHTML = `
          <tr><td colspan="6" style="text-align:center;padding:24px;color:#64748b">
            No hay administradores registrados
          </td></tr>`;
        return;
      }

      var currentUser = window.AdminAuth ? window.AdminAuth.getCurrentUser() : null;
      var isMaster = currentUser && (currentUser.roles || []).includes('Master');

      tbody.innerHTML = this.adminUsers.map(function (user) {
        var fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || '—';
        var mfaBadge = user.mfaEnabled
          ? '<span class="badge badge-green"><i class="fas fa-check-circle"></i> Activo</span>'
          : '<span class="badge" style="background:rgba(100,116,139,0.15);color:#64748b">Inactivo</span>';
        var _d0 = user.createdAt ? new Date(user.createdAt) : null;
        var date = _d0 && _d0.getFullYear() > 2000 ? _d0.toLocaleDateString('es-MX') : '—';

        // Role badges — one per role (Req 1.7)
        var roleBadges = (user.roles || [])
          .filter(function (r) { return ADMIN_ROLES.includes(r); })
          .map(function (r) { return '<span class="badge badge-purple">' + r + '</span>'; })
          .join(' ') || '—';

        // Hide own-row controls (Req 6.8, 9.2, 9.6)
        var isSelf = currentUser && user.id === currentUser.id;
        var actions = '';

        if (!isSelf && isMaster) {
          var adminRoles = (user.roles || []).filter(function(r){ return ADMIN_ROLES.includes(r); });
          actions = `
            <button class="btn-admin btn-admin-sm btn-admin-secondary btn-edit-roles"
                    data-user-id="${user.id}"
                    data-user-roles="${adminRoles.join(',')}"
                    title="Editar roles">
              <i class="fas fa-user-tag"></i> Roles
            </button>
            <button class="btn-admin btn-admin-sm btn-admin-danger btn-delete-admin"
                    data-user-id="${user.id}"
                    data-user-email="${user.email || ''}"
                    title="Eliminar administrador">
              <i class="fas fa-trash"></i>
            </button>`;
        }

        return `
          <tr>
            <td>${user.email || '—'}</td>
            <td>${fullName}</td>
            <td>${date}</td>
            <td>${mfaBadge}</td>
            <td>${roleBadges}</td>
            <td>${actions}</td>
          </tr>`;
      }).join('');
    },

    renderStoreUsersTable() {
      var tbody = document.getElementById('store-users-tbody');
      if (!tbody) return;

      if (!this.storeUsers || this.storeUsers.length === 0) {
        tbody.innerHTML = `
          <tr><td colspan="5" style="text-align:center;padding:24px;color:#64748b">
            No hay usuarios de tienda registrados
          </td></tr>`;
        return;
      }

      var start = (this.currentPage - 1) * this.pageSize;
      var end = start + this.pageSize;
      var paginatedUsers = this.storeUsers.slice(start, end);

      tbody.innerHTML = paginatedUsers.map(function (user) {
        var fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || '—';
        var mfaBadge = user.mfaEnabled
          ? '<span class="badge badge-green"><i class="fas fa-check-circle"></i> Activo</span>'
          : '<span class="badge" style="background:rgba(100,116,139,0.15);color:#64748b">Inactivo</span>';
        var _d1 = user.createdAt ? new Date(user.createdAt) : null;
        var date = _d1 && _d1.getFullYear() > 2000 ? _d1.toLocaleDateString('es-MX') : '—';

        return `
          <tr>
            <td>${user.email || '—'}</td>
            <td>${fullName}</td>
            <td>${date}</td>
            <td>${mfaBadge}</td>
            <td>
              <button class="btn-admin btn-admin-sm btn-admin-primary" onclick="AdminUsers.promoteToAdmin('${user.id}')" title="Promover a administrador">
                <i class="fas fa-user-shield"></i> Hacer Admin
              </button>
            </td>
          </tr>`;
      }).join('');

      this.renderPagination();
    },

    renderPagination() {
      var container = document.getElementById('store-users-pagination');
      if (!container) return;

      var totalPages = Math.ceil(this.storeUsers.length / this.pageSize);
      if (totalPages <= 1) {
        container.innerHTML = '';
        return;
      }

      var self = this;
      var html = '<div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:20px">';
      html += `<button class="btn-admin btn-admin-sm btn-admin-secondary" ${this.currentPage === 1 ? 'disabled' : ''} onclick="AdminUsers.goToPage(${this.currentPage - 1})"><i class="fas fa-chevron-left"></i></button>`;
      for (var i = 1; i <= totalPages; i++) {
        if (i === this.currentPage) {
          html += `<button class="btn-admin btn-admin-sm btn-admin-primary">${i}</button>`;
        } else {
          html += `<button class="btn-admin btn-admin-sm btn-admin-secondary" onclick="AdminUsers.goToPage(${i})">${i}</button>`;
        }
      }
      html += `<button class="btn-admin btn-admin-sm btn-admin-secondary" ${this.currentPage === totalPages ? 'disabled' : ''} onclick="AdminUsers.goToPage(${this.currentPage + 1})"><i class="fas fa-chevron-right"></i></button>`;
      html += '</div>';
      container.innerHTML = html;
    },

    goToPage(page) {
      var totalPages = Math.ceil(this.storeUsers.length / this.pageSize);
      if (page < 1 || page > totalPages) return;
      this.currentPage = page;
      this.renderStoreUsersTable();
    },

    showError(tbodyId, colspan) {
      var tbody = document.getElementById(tbodyId);
      if (tbody) {
        tbody.innerHTML = `
          <tr><td colspan="${colspan}" style="text-align:center;padding:24px;color:#f87171">
            <i class="fas fa-exclamation-triangle"></i> Error al cargar usuarios
          </td></tr>`;
      }
    },

    // Modal handlers
    initAddAdminModal() {
      var btn = document.getElementById('btn-add-admin');
      var modal = document.getElementById('add-admin-modal');
      var closeBtn = document.getElementById('btn-close-add-admin');
      var form = document.getElementById('add-admin-form');

      function resetModalToCreateMode() {
        var titleEl = document.getElementById('add-admin-title');
        var subtitleEl = modal.querySelector('.admin-modal-subtitle');
        titleEl.innerHTML = '<i class="fas fa-user-plus" style="margin-right:8px"></i>Agregar Administrador';
        subtitleEl.textContent = 'Crear una nueva cuenta de administrador';
        // Show all credential fields
        ['add-admin-email', 'add-admin-password', 'add-admin-firstname', 'add-admin-lastname'].forEach(function (id) {
          var el = document.getElementById(id);
          if (el) el.closest('.modal-form-field').style.display = '';
        });
        // Reset submit button text
        var submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-check"></i>&nbsp; Crear Administrador';
        // Clear edit state
        delete form.dataset.editUserId;
        // Default checkboxes
        ADMIN_ROLES.forEach(function (role) {
          var cb = document.getElementById('role-cb-' + role);
          if (cb) cb.checked = (role === 'OrderManagement');
        });
        form.reset();
        document.getElementById('add-admin-err').textContent = '';
      }

      if (btn && modal) {
        btn.addEventListener('click', function () {
          resetModalToCreateMode();
          modal.style.display = 'flex';
        });
      }

      if (closeBtn && modal) {
        closeBtn.addEventListener('click', function () {
          modal.style.display = 'none';
          resetModalToCreateMode();
        });
      }

      if (modal) {
        modal.addEventListener('click', function (e) {
          if (e.target === modal) {
            modal.style.display = 'none';
            resetModalToCreateMode();
          }
        });
      }

      if (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          AdminUsers.handleAddAdmin(form);
        });
      }
    },

    // Requirements: 1.1, 1.2, 1.6 — handles both create and edit-roles modes
    async handleAddAdmin(form) {
      var errEl = document.getElementById('add-admin-err');
      var submitBtn = form.querySelector('button[type="submit"]');
      var editUserId = form.dataset.editUserId || null;

      try {
        submitBtn.disabled = true;
        errEl.textContent = '';

        // Collect checked roles (Req 1.1)
        var roles = ADMIN_ROLES.filter(function (role) {
          var cb = document.getElementById('role-cb-' + role);
          return cb && cb.checked;
        });

        if (roles.length === 0) {
          errEl.textContent = 'Selecciona al menos un rol';
          return;
        }

        if (editUserId) {
          // Edit-roles mode: call adminUpdateUserRoles (Req 1.2)
          await window.adminApi.adminUpdateUserRoles(editUserId, roles);
          window.toast('Roles actualizados exitosamente', true);
        } else {
          // Create mode: POST with roles array (Req 1.6)
          var formData = new FormData(form);
          var data = {
            email:     formData.get('email'),
            password:  formData.get('password'),
            firstName: formData.get('firstName'),
            lastName:  formData.get('lastName'),
            roles:     roles
          };
          await window.adminApi.apiFetch('/admin/users', {
            method: 'POST',
            body: JSON.stringify(data)
          });
          window.toast('Administrador creado exitosamente', true);
        }

        document.getElementById('add-admin-modal').style.display = 'none';
        await this.loadUsers();
      } catch (err) {
        console.error('[AdminUsers] Add/edit admin failed:', err);
        errEl.textContent = err.detail || 'Error al guardar administrador';
      } finally {
        submitBtn.disabled = false;
      }
    },

    // Requirements: 1.1, 1.2 — open modal pre-populated with user's current roles
    openEditRolesModal(userId, currentRoles) {
      var modal = document.getElementById('add-admin-modal');
      var form = document.getElementById('add-admin-form');
      var titleEl = document.getElementById('add-admin-title');
      var subtitleEl = modal.querySelector('.admin-modal-subtitle');

      // Switch modal to "edit roles" mode
      titleEl.innerHTML = '<i class="fas fa-user-tag" style="margin-right:8px"></i>Editar Roles';
      subtitleEl.textContent = 'Actualizar roles del administrador';

      // Hide credential fields
      ['add-admin-email', 'add-admin-password', 'add-admin-firstname', 'add-admin-lastname'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.closest('.modal-form-field').style.display = 'none';
      });

      // Pre-check current roles
      ADMIN_ROLES.forEach(function (role) {
        var cb = document.getElementById('role-cb-' + role);
        if (cb) cb.checked = currentRoles.includes(role);
      });

      document.getElementById('add-admin-err').textContent = '';

      // Update submit button label
      var submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.innerHTML = '<i class="fas fa-check"></i>&nbsp; Guardar Roles';

      // Store edit state on the form element
      form.dataset.editUserId = userId;

      modal.style.display = 'flex';
    },

    async promoteToAdmin(userId) {
      var confirmed = await adminConfirm(
        '¿Estás seguro de que quieres promover este usuario a administrador?',
        'Promover a Administrador'
      );
      if (!confirmed) return;

      try {
        await window.adminApi.apiFetch('/admin/users/' + userId + '/role', {
          method: 'PUT',
          body: JSON.stringify({ role: 'OrderManagement' })
        });
        window.toast('Usuario promovido a administrador', true);
        await this.loadUsers();
      } catch (err) {
        console.error('[AdminUsers] Promote failed:', err);
        window.toast(err.detail || 'Error al promover usuario', false);
      }
    },

    async deleteAdminUser(userId, email) {
      var confirmed = await adminConfirm(
        `¿Eliminar al administrador ${email || ''}? Esta acción no se puede deshacer.`,
        'Eliminar Administrador'
      );
      if (!confirmed) return;
      try {
        await window.adminApi.apiFetch('/admin/users/' + userId, { method: 'DELETE' });
        window.toast('Administrador eliminado', true);
        await this.loadUsers();
      } catch (err) {
        window.toast(err.detail || 'Error al eliminar administrador', false);
      }
    },

    // Search functionality
    initSearch() {
      var searchInput = document.getElementById('store-users-search');
      if (searchInput) {
        searchInput.addEventListener('input', function (e) {
          var query = e.target.value.toLowerCase().trim();
          if (query) {
            AdminUsers.storeUsers = AdminUsers.allUsers.filter(function (user) {
              var roles = user.roles || [];
              if (roles.some(function (r) { return ADMIN_ROLES.includes(r); })) return false;
              var email = (user.email || '').toLowerCase();
              var firstName = (user.firstName || '').toLowerCase();
              var lastName = (user.lastName || '').toLowerCase();
              return email.includes(query) || firstName.includes(query) || lastName.includes(query);
            });
          } else {
            AdminUsers.separateUsers();
          }
          AdminUsers.currentPage = 1;
          AdminUsers.renderStoreUsersTable();
        });
      }
    }
  };

  window.AdminUsers = AdminUsers;

  // Auto-load when auth:login fires
  document.addEventListener('auth:login', function () {
    AdminUsers.loadUsers();
    AdminUsers.initAddAdminModal();
    AdminUsers.initSearch();

    // Delegated click handler for edit-roles and delete buttons
    var adminTbody = document.getElementById('admin-users-tbody');
    if (adminTbody) {
      adminTbody.addEventListener('click', function (e) {
        var editBtn = e.target.closest('.btn-edit-roles');
        if (editBtn) {
          var userId = editBtn.dataset.userId;
          var rolesStr = editBtn.dataset.userRoles || '';
          var currentRoles = rolesStr ? rolesStr.split(',') : [];
          AdminUsers.openEditRolesModal(userId, currentRoles);
        }
        var delBtn = e.target.closest('.btn-delete-admin');
        if (delBtn) {
          AdminUsers.deleteAdminUser(delBtn.dataset.userId, delBtn.dataset.userEmail);
        }
      });
    }
  });

}(window));
