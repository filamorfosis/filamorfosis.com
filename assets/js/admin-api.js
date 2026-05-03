/**
 * Filamorfosis Admin API Client
 * Thin fetch wrapper for all /api/v1/admin/* and auth/admin/* endpoints.
 * Exposes all functions as window.adminApi.<name> for use by admin modules.
 *
 * Requirements: 7.2
 */

(function (window) {
  'use strict';

  const ADMIN_API_BASE = (() => {
    if (window.FILAMORFOSIS_API_BASE) return window.FILAMORFOSIS_API_BASE;
    return 'https://api.filamorfosis.com/api/v1';
  })();

  /**
   * Core fetch wrapper.
   * - Prepends ADMIN_API_BASE (which already includes /api/v1)
   * - Adds X-Requested-With header
   * - On non-2xx reads RFC 7807 `detail` and throws { status, title, detail, ... }
   * - Returns parsed JSON, or null for 204 No Content
   *
   * @param {string} path  - relative path, e.g. '/admin/categories'
   * @param {RequestInit} options
   * @returns {Promise<any>}
   */
  async function apiFetch(path, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(options.headers || {})
    };

    const res = await fetch(`${ADMIN_API_BASE}${path}`, {
      credentials: 'include',
      ...options,
      headers
    });

    if (!res.ok) {
      let errorBody = { status: res.status, detail: res.statusText };
      try {
        const body = await res.json();
        errorBody = { status: res.status, ...body };
      } catch (_) {
        // non-JSON error body — use statusText fallback
      }
      throw errorBody;
    }

    if (res.status === 204) return null;
    return res.json();
  }

  // ── Processes ────────────────────────────────────────────────────────────

  /** GET /api/v1/admin/processes — returns all processes with their attributes */
  function adminGetProcesses() {
    return apiFetch('/admin/processes');
  }

  /** POST /api/v1/admin/processes — create a new process */
  function adminCreateProcess(data) {
    return apiFetch('/admin/processes', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /** PUT /api/v1/admin/processes/{id} — update an existing process */
  function adminUpdateProcess(id, data) {
    return apiFetch(`/admin/processes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /** DELETE /api/v1/admin/processes/{id} — soft-delete a process */
  function adminDeleteProcess(id) {
    return apiFetch(`/admin/processes/${id}`, { method: 'DELETE' });
  }

  /** POST /api/v1/admin/processes/{id}/attributes — add an attribute to a process */
  function adminAddProcessAttribute(processId, data) {
    return apiFetch(`/admin/processes/${processId}/attributes`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /** DELETE /api/v1/admin/processes/{id}/attributes/{attributeId} — remove an attribute */
  function adminDeleteProcessAttribute(processId, attributeId) {
    return apiFetch(`/admin/processes/${processId}/attributes/${attributeId}`, {
      method: 'DELETE'
    });
  }

  // ── Products ──────────────────────────────────────────────────────────────

  /**
   * GET /api/v1/admin/products — paginated product list
   * @param {{ page?: number, pageSize?: number, categoryId?: string, search?: string }} params
   */
  function adminGetProducts(params = {}) {
    // Strip empty/null values so they don't appear as ?search=&... in the URL
    const clean = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    );
    const qs = new URLSearchParams(clean).toString();
    return apiFetch(`/admin/products${qs ? '?' + qs : ''}`);
  }

  /** GET /api/v1/admin/products/{id} — single product with variants + discounts */
  function adminGetProduct(id, bustCache = false) {
    const url = bustCache 
      ? `/admin/products/${id}?_t=${Date.now()}`
      : `/admin/products/${id}`;
    return apiFetch(url);
  }

  /** POST /api/v1/admin/products — create a new product */
  function adminCreateProduct(data) {
    return apiFetch('/admin/products', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /** PUT /api/v1/admin/products/{id} — update a product */
  function adminUpdateProduct(id, data) {
    return apiFetch(`/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /** DELETE /api/v1/admin/products/{id} — soft-delete a product */
  function adminDeleteProduct(id) {
    return apiFetch(`/admin/products/${id}`, { method: 'DELETE' });
  }

  // ── Variants ──────────────────────────────────────────────────────────────

  /** POST /api/v1/admin/products/{productId}/variants — create a variant */
  function adminCreateVariant(productId, data) {
    return apiFetch(`/admin/products/${productId}/variants`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /** PUT /api/v1/admin/products/{productId}/variants/{variantId} — update a variant */
  function adminUpdateVariant(productId, variantId, data) {
    return apiFetch(`/admin/products/${productId}/variants/${variantId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /** DELETE /api/v1/admin/products/{productId}/variants/{variantId} — delete a variant */
  function adminDeleteVariant(productId, variantId) {
    return apiFetch(`/admin/products/${productId}/variants/${variantId}`, {
      method: 'DELETE'
    });
  }

  // ── Images ────────────────────────────────────────────────────────────────

  /**
   * POST /api/v1/admin/products/{productId}/images — upload an image (multipart)
   * Uses raw fetch (no Content-Type override so browser sets multipart boundary).
   * @param {string} productId
   * @param {File} file
   */
  function adminUploadImage(productId, file) {
    const form = new FormData();
    form.append('file', file);
    return fetch(`${ADMIN_API_BASE}/admin/products/${productId}/images`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      body: form
    }).then(async (res) => {
      if (!res.ok) {
        let errorBody = { status: res.status, detail: res.statusText };
        try { errorBody = { status: res.status, ...await res.json() }; } catch (_) {}
        throw errorBody;
      }
      return res.status === 204 ? null : res.json();
    });
  }

  /**
   * DELETE /api/v1/admin/products/{productId}/images — remove an image URL
   * @param {string} productId
   * @param {string} imageUrl
   */
  function adminDeleteImage(productId, imageUrl) {
    return apiFetch(`/admin/products/${productId}/images`, {
      method: 'DELETE',
      body: JSON.stringify({ imageUrl })
    });
  }

  // ── Discounts ─────────────────────────────────────────────────────────────

  /**
   * POST /api/v1/admin/products/{productId}/discounts — create a product-level discount
   * @param {string} productId
   * @param {{ discountType: string, value: number, startsAt?: string, endsAt?: string }} data
   */
  function adminCreateProductDiscount(productId, data) {
    return apiFetch(`/admin/products/${productId}/discounts`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * POST /api/v1/admin/products/{productId}/variants/{variantId}/discounts
   * @param {string} productId
   * @param {string} variantId
   * @param {{ discountType: string, value: number, startsAt?: string, endsAt?: string }} data
   */
  function adminCreateVariantDiscount(productId, variantId, data) {
    return apiFetch(`/admin/products/${productId}/variants/${variantId}/discounts`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /** DELETE /api/v1/admin/discounts/{discountId} — remove a discount */
  function adminDeleteDiscount(discountId) {
    return apiFetch(`/admin/discounts/${discountId}`, { method: 'DELETE' });
  }

  // ── Orders ────────────────────────────────────────────────────────────────

  /**
   * GET /api/v1/admin/orders — paginated order list
   * @param {{ page?: number, pageSize?: number, status?: string, search?: string }} params
   */
  function adminGetOrders(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/admin/orders${qs ? '?' + qs : ''}`);
  }

  /** GET /api/v1/admin/orders/{orderId} — full order detail */
  function adminGetOrder(orderId) {
    return apiFetch(`/admin/orders/${orderId}`);
  }

  /**
   * PUT /api/v1/admin/orders/{orderId}/status — advance order status
   * @param {string} orderId
   * @param {string} status — "Preparing" | "Shipped" | "Delivered"
   */
  function adminUpdateOrderStatus(orderId, status) {
    return apiFetch(`/admin/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }

  /** GET /api/v1/admin/orders/{orderId}/design-files — presigned S3 URLs for design files */
  function adminGetDesignFiles(orderId) {
    return apiFetch(`/admin/orders/${orderId}/design-files`);
  }

  // ── Attribute Definitions ─────────────────────────────────────────────────

  /** GET /api/v1/admin/attribute-definitions — list all attribute definitions */
  function adminGetAttributeDefinitions() {
    return apiFetch('/admin/attribute-definitions');
  }

  /** POST /api/v1/admin/attribute-definitions — create a new attribute definition */
  function adminCreateAttributeDefinition(data) {
    return apiFetch('/admin/attribute-definitions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /** POST /api/v1/admin/products/{productId}/attributes — add an attribute to a product */
  function adminAddProductAttribute(productId, data) {
    return apiFetch(`/admin/products/${productId}/attributes`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /** DELETE /api/v1/admin/products/{productId}/attributes/{attributeDefinitionId} — remove an attribute from a product */
  function adminRemoveProductAttribute(productId, attributeDefinitionId) {
    return apiFetch(`/admin/products/${productId}/attributes/${attributeDefinitionId}`, {
      method: 'DELETE'
    });
  }

  /** PUT /api/v1/admin/products/{productId}/variants/{variantId} — set variant attributes (reuses adminUpdateVariant with attributes payload) */
  function adminSetVariantAttributes(productId, variantId, attributes) {
    return apiFetch(`/admin/products/${productId}/variants/${variantId}`, {
      method: 'PUT',
      body: JSON.stringify({ attributes })
    });
  }

  // ── Users ─────────────────────────────────────────────────────────────────

  /** GET /api/v1/admin/users — list all admin users */
  function adminGetUsers() {
    return apiFetch('/admin/users');
  }

  /**
   * PUT /api/v1/admin/users/{userId}/roles — replace all roles for a user
   * @param {string} userId
   * @param {string[]} roles
   */
  function adminUpdateUserRoles(userId, roles) {
    return apiFetch(`/admin/users/${userId}/roles`, {
      method: 'PUT',
      body: JSON.stringify({ roles })
    });
  }

  // ── Materials ─────────────────────────────────────────────────────────────

  /**
   * GET /api/v1/admin/materials — list materials, optional ?category= filter
   * @param {{ category?: string }} params
   */
  function adminGetMaterials(params = {}) {
    const clean = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    );
    const qs = new URLSearchParams(clean).toString();
    return apiFetch(`/admin/materials${qs ? '?' + qs : ''}`);
  }

  /** POST /api/v1/admin/materials — create a material */
  function adminCreateMaterial(data) {
    return apiFetch('/admin/materials', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /** PUT /api/v1/admin/materials/{id} — update a material */
  function adminUpdateMaterial(id, data) {
    return apiFetch(`/admin/materials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /** DELETE /api/v1/admin/materials/{id} — delete a material */
  function adminDeleteMaterial(id) {
    return apiFetch(`/admin/materials/${id}`, { method: 'DELETE' });
  }

  /** POST /api/v1/admin/materials/{id}/recompute-variants — recalculate variant prices after material cost change */
  function adminRecomputeVariantPrices(materialId) {
    return apiFetch(`/admin/materials/${materialId}/recompute-variants`, {
      method: 'POST'
    });
  }

  // ── Process Costs ─────────────────────────────────────────────────────────

  /** GET /api/v1/admin/process-costs — returns all process costs grouped by process */
  function adminGetProcessCosts() {
    return apiFetch('/admin/process-costs');
  }

  /** PUT /api/v1/admin/process-costs/{processId}/{key} — upsert a process cost */
  function adminUpsertProcessCost(processId, key, data) {
    return apiFetch(`/admin/process-costs/${processId}/${key}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /** DELETE /api/v1/admin/processes/{processId}/cost-parameters/{parameterId} — delete a cost parameter */
  function adminDeleteProcessCost(processId, parameterId) {
    return apiFetch(`/admin/processes/${processId}/cost-parameters/${parameterId}`, {
      method: 'DELETE'
    });
  }

  // ── Global Parameters ─────────────────────────────────────────────────────

  /** GET /api/v1/admin/global-parameters — returns all global parameters */
  function adminGetGlobalParameters() {
    return apiFetch('/admin/global-parameters');
  }

  /**
   * PUT /api/v1/admin/global-parameters/{key} — update a global parameter
   * @param {string} key
   * @param {{ label: string, value: string }} data
   */
  function adminUpdateGlobalParameter(key, data) {
    return apiFetch(`/admin/global-parameters/${encodeURIComponent(key)}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // ── Product Categories ────────────────────────────────────────────────────

  /** GET /api/v1/admin/categories — returns all categories with their subcategories */
  function adminGetCategories() {
    return apiFetch('/admin/categories');
  }

  /** GET /api/v1/admin/categories/{id} — returns a single category by ID */
  function adminGetCategory(id) {
    return apiFetch(`/admin/categories/${id}`);
  }

  /** POST /api/v1/admin/categories — create a new category */
  function adminCreateCategory(data) {
    return apiFetch('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /** PUT /api/v1/admin/categories/{id} — update an existing category */
  function adminUpdateCategory(id, data) {
    return apiFetch(`/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /** DELETE /api/v1/admin/categories/{id} — delete a category (cascade deletes subcategories) */
  function adminDeleteCategory(id) {
    return apiFetch(`/admin/categories/${id}`, { method: 'DELETE' });
  }

  /** POST /api/v1/admin/categories/{id}/subcategories — create a new subcategory under a category */
  function adminCreateSubCategory(categoryId, data) {
    return apiFetch(`/admin/categories/${categoryId}/subcategories`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /** GET /api/v1/admin/categories/subcategories/{id} — get a single subcategory by ID */
  function adminGetSubCategory(id) {
    return apiFetch(`/admin/categories/subcategories/${id}`);
  }

  /** PUT /api/v1/admin/categories/subcategories/{id} — update an existing subcategory */
  function adminUpdateSubCategory(id, data) {
    return apiFetch(`/admin/categories/subcategories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /** DELETE /api/v1/admin/categories/subcategories/{id} — delete a subcategory */
  function adminDeleteSubCategory(id) {
    return apiFetch(`/admin/categories/subcategories/${id}`, { method: 'DELETE' });
  }

  /**
   * GET /api/v1/admin/products/{id}/categories — get all categories assigned to a product
   * @param {string} productId
   */
  function adminGetProductCategories(productId) {
    return apiFetch(`/admin/products/${productId}/categories`);
  }

  /**
   * PUT /api/v1/admin/products/{id}/categories — replace all category assignments for a product
   * @param {string} productId
   * @param {Array} assignments - Array of {categoryId, subCategoryId} objects
   */
  function adminUpdateProductCategories(productId, assignments) {
    return apiFetch(`/admin/products/${productId}/categories`, {
      method: 'PUT',
      body: JSON.stringify({ assignments })
    });
  }

  // ── Namespace export ──────────────────────────────────────────────────────

  window.adminApi = {
    // core
    apiFetch,
    // processes
    adminGetProcesses,
    adminCreateProcess,
    adminUpdateProcess,
    adminDeleteProcess,
    adminAddProcessAttribute,
    adminDeleteProcessAttribute,
    // products
    adminGetProducts,
    adminGetProduct,
    adminCreateProduct,
    adminUpdateProduct,
    adminDeleteProduct,
    // variants
    adminCreateVariant,
    adminUpdateVariant,
    adminDeleteVariant,
    // images
    adminUploadImage,
    adminDeleteImage,
    // discounts
    adminCreateProductDiscount,
    adminCreateVariantDiscount,
    adminDeleteDiscount,
    // attribute definitions
    adminGetAttributeDefinitions,
    adminCreateAttributeDefinition,
    adminAddProductAttribute,
    adminRemoveProductAttribute,
    adminSetVariantAttributes,
    // orders
    adminGetOrders,
    adminGetOrder,
    adminUpdateOrderStatus,
    adminGetDesignFiles,
    // users
    adminGetUsers,
    adminUpdateUserRoles,
    // materials
    adminGetMaterials,
    adminCreateMaterial,
    adminUpdateMaterial,
    adminDeleteMaterial,
    adminRecomputeVariantPrices,
    // process costs
    adminGetProcessCosts,
    adminUpsertProcessCost,
    adminDeleteProcessCost,
    // global parameters
    adminGetGlobalParameters,
    adminUpdateGlobalParameter,
    // product categories
    adminGetCategories,
    adminGetCategory,
    adminCreateCategory,
    adminUpdateCategory,
    adminDeleteCategory,
    adminCreateSubCategory,
    adminGetSubCategory,
    adminUpdateSubCategory,
    adminDeleteSubCategory,
    adminGetProductCategories,
    adminUpdateProductCategories
  };

  // Also expose each function directly on window so existing admin.html inline
  // scripts that reference e.g. window.adminGetProcesses continue to work.
  Object.assign(window, window.adminApi);

}(window));
