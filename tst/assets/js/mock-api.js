/**
 * mock-api.js — Filamorfosis Mock API
 *
 * Overrides all API helper functions defined in api.js with in-memory
 * implementations so the store UI works without a running backend.
 *
 * Include AFTER api.js on any page during development.
 * Remove (or don't include) this file when the real backend is available.
 */
(function () {
  'use strict';

  // ── Simulated delay ────────────────────────────────────────────────────────
  function delay(ms) { return new Promise(r => setTimeout(r, ms || 300)); }

  // ── In-memory state ────────────────────────────────────────────────────────
  var _state = (function () {
    try { return JSON.parse(localStorage.getItem('_mockState') || 'null') || {}; } catch { return {}; }
  })();

  function _save() {
    try { localStorage.setItem('_mockState', JSON.stringify(_state)); } catch {}
  }

  // Defaults
  if (!_state.users)   _state.users   = [];
  if (!_state.session) _state.session = null; // { userId, firstName, email }
  if (!_state.cart)    _state.cart    = { id: 'cart-1', items: [], total: 0 };
  if (!_state.orders)  _state.orders  = [];

  // ── Seed data ──────────────────────────────────────────────────────────────
  var CATEGORIES = [
    { id: 'cat-uv',    slug: 'uv-printing',   nameEs: 'Impresión UV',    nameEn: 'UV Printing',    productCount: 3 },
    { id: 'cat-3d',    slug: '3d-printing',   nameEs: 'Impresión 3D',   nameEn: '3D Printing',    productCount: 4 },
    { id: 'cat-laser', slug: 'laser-cutting', nameEs: 'Corte Láser',    nameEn: 'Laser Cutting',  productCount: 2 },
    { id: 'cat-photo', slug: 'photography',   nameEs: 'Fotografía',     nameEn: 'Photography',    productCount: 2 },
  ];

  var PRODUCTS = [
    {
      id: 'prod-1', categoryId: 'cat-uv', slug: 'taza-personalizada',
      titleEs: 'Taza Personalizada UV', titleEn: 'Custom UV Mug',
      descriptionEs: 'Impresión UV directa sobre taza de cerámica. Colores vibrantes y duraderos.',
      descriptionEn: 'Direct UV printing on ceramic mug. Vibrant and durable colors.',
      tags: ['taza', 'uv', 'personalizado'], imageUrls: [], isActive: true,
      variants: [
        { id: 'v1-1', sku: 'MUG-WHT-11', labelEs: 'Blanca 11oz', labelEn: 'White 11oz', price: 180, isAvailable: true, acceptsDesignFile: true, stockQuantity: 50 },
        { id: 'v1-2', sku: 'MUG-BLK-11', labelEs: 'Negra 11oz',  labelEn: 'Black 11oz', price: 200, isAvailable: true, acceptsDesignFile: true, stockQuantity: 30 },
        { id: 'v1-3', sku: 'MUG-WHT-15', labelEs: 'Blanca 15oz', labelEn: 'White 15oz', price: 220, isAvailable: true, acceptsDesignFile: true, stockQuantity: 20 },
      ]
    },
    {
      id: 'prod-2', categoryId: 'cat-uv', slug: 'sticker-uv-dtf',
      titleEs: 'Sticker UV DTF', titleEn: 'UV DTF Sticker',
      descriptionEs: 'Stickers resistentes al agua con acabado UV. Perfectos para cualquier superficie.',
      descriptionEn: 'Waterproof stickers with UV finish. Perfect for any surface.',
      tags: ['sticker', 'uv', 'dtf'], imageUrls: [], isActive: true,
      variants: [
        { id: 'v2-1', sku: 'STK-5X5',  labelEs: '5×5 cm (pack 10)', labelEn: '5×5 cm (pack 10)', price: 120, isAvailable: true, acceptsDesignFile: true, stockQuantity: 100 },
        { id: 'v2-2', sku: 'STK-10X10', labelEs: '10×10 cm (pack 5)', labelEn: '10×10 cm (pack 5)', price: 150, isAvailable: true, acceptsDesignFile: true, stockQuantity: 80 },
      ]
    },
    {
      id: 'prod-3', categoryId: 'cat-uv', slug: 'magneto-personalizado',
      titleEs: 'Magneto Personalizado', titleEn: 'Custom Magnet',
      descriptionEs: 'Magnetos de refrigerador con impresión UV de alta resolución.',
      descriptionEn: 'Fridge magnets with high-resolution UV printing.',
      tags: ['magneto', 'uv'], imageUrls: [], isActive: true,
      variants: [
        { id: 'v3-1', sku: 'MAG-RND-5', labelEs: 'Redondo 5cm', labelEn: 'Round 5cm', price: 80, isAvailable: true, acceptsDesignFile: true, stockQuantity: 200 },
        { id: 'v3-2', sku: 'MAG-SQR-7', labelEs: 'Cuadrado 7cm', labelEn: 'Square 7cm', price: 95, isAvailable: true, acceptsDesignFile: true, stockQuantity: 150 },
      ]
    },
    {
      id: 'prod-4', categoryId: 'cat-3d', slug: 'figura-personalizada-3d',
      titleEs: 'Figura Personalizada 3D', titleEn: 'Custom 3D Figure',
      descriptionEs: 'Impresión 3D multicolor en PLA. Ideal para figuras, miniaturas y decoración.',
      descriptionEn: 'Multicolor 3D printing in PLA. Ideal for figures, miniatures and decoration.',
      tags: ['3d', 'figura', 'pla'], imageUrls: [], isActive: true,
      variants: [
        { id: 'v4-1', sku: 'FIG-SM', labelEs: 'Pequeña (hasta 10cm)', labelEn: 'Small (up to 10cm)', price: 250, isAvailable: true, acceptsDesignFile: true, stockQuantity: 30 },
        { id: 'v4-2', sku: 'FIG-MD', labelEs: 'Mediana (10–20cm)',    labelEn: 'Medium (10–20cm)',   price: 450, isAvailable: true, acceptsDesignFile: true, stockQuantity: 20 },
        { id: 'v4-3', sku: 'FIG-LG', labelEs: 'Grande (20–30cm)',     labelEn: 'Large (20–30cm)',    price: 750, isAvailable: true, acceptsDesignFile: true, stockQuantity: 10 },
      ]
    },
    {
      id: 'prod-5', categoryId: 'cat-3d', slug: 'pieza-funcional-petg',
      titleEs: 'Pieza Funcional PETG', titleEn: 'Functional PETG Part',
      descriptionEs: 'Piezas mecánicas y funcionales en PETG. Alta resistencia y durabilidad.',
      descriptionEn: 'Mechanical and functional parts in PETG. High strength and durability.',
      tags: ['3d', 'petg', 'funcional'], imageUrls: [], isActive: true,
      variants: [
        { id: 'v5-1', sku: 'PETG-SM', labelEs: 'Pequeña', labelEn: 'Small', price: 180, isAvailable: true, acceptsDesignFile: true, stockQuantity: 50 },
        { id: 'v5-2', sku: 'PETG-MD', labelEs: 'Mediana', labelEn: 'Medium', price: 320, isAvailable: true, acceptsDesignFile: true, stockQuantity: 30 },
      ]
    },
    {
      id: 'prod-6', categoryId: 'cat-laser', slug: 'letrero-madera-laser',
      titleEs: 'Letrero de Madera Láser', titleEn: 'Laser Wood Sign',
      descriptionEs: 'Corte y grabado láser en madera. Perfecto para letreros, decoración y regalos.',
      descriptionEn: 'Laser cutting and engraving on wood. Perfect for signs, decoration and gifts.',
      tags: ['laser', 'madera', 'letrero'], imageUrls: [], isActive: true,
      variants: [
        { id: 'v6-1', sku: 'WD-A5',  labelEs: 'A5 (14×21cm)', labelEn: 'A5 (14×21cm)', price: 200, isAvailable: true, acceptsDesignFile: true, stockQuantity: 40 },
        { id: 'v6-2', sku: 'WD-A4',  labelEs: 'A4 (21×29cm)', labelEn: 'A4 (21×29cm)', price: 320, isAvailable: true, acceptsDesignFile: true, stockQuantity: 25 },
        { id: 'v6-3', sku: 'WD-A3',  labelEs: 'A3 (29×42cm)', labelEn: 'A3 (29×42cm)', price: 480, isAvailable: true, acceptsDesignFile: true, stockQuantity: 15 },
      ]
    },
    {
      id: 'prod-7', categoryId: 'cat-laser', slug: 'acrilico-grabado',
      titleEs: 'Acrílico Grabado Láser', titleEn: 'Laser Engraved Acrylic',
      descriptionEs: 'Grabado láser en acrílico transparente o de color. Ideal para señalética y decoración.',
      descriptionEn: 'Laser engraving on clear or colored acrylic. Ideal for signage and decoration.',
      tags: ['laser', 'acrilico'], imageUrls: [], isActive: true,
      variants: [
        { id: 'v7-1', sku: 'ACR-SM', labelEs: 'Pequeño (10×10cm)', labelEn: 'Small (10×10cm)', price: 150, isAvailable: true, acceptsDesignFile: true, stockQuantity: 60 },
        { id: 'v7-2', sku: 'ACR-MD', labelEs: 'Mediano (20×20cm)', labelEn: 'Medium (20×20cm)', price: 280, isAvailable: true, acceptsDesignFile: true, stockQuantity: 35 },
      ]
    },
    {
      id: 'prod-8', categoryId: 'cat-photo', slug: 'foto-profesional',
      titleEs: 'Impresión Fotográfica', titleEn: 'Photo Print',
      descriptionEs: 'Impresión fotográfica profesional en papel de alta calidad.',
      descriptionEn: 'Professional photo printing on high-quality paper.',
      tags: ['foto', 'impresion'], imageUrls: [], isActive: true,
      variants: [
        { id: 'v8-1', sku: 'PHT-4X6',  labelEs: '10×15cm (4×6")', labelEn: '10×15cm (4×6")', price: 25, isAvailable: true, acceptsDesignFile: true, stockQuantity: 500 },
        { id: 'v8-2', sku: 'PHT-5X7',  labelEs: '13×18cm (5×7")', labelEn: '13×18cm (5×7")', price: 40, isAvailable: true, acceptsDesignFile: true, stockQuantity: 300 },
        { id: 'v8-3', sku: 'PHT-8X10', labelEs: '20×25cm (8×10")', labelEn: '20×25cm (8×10")', price: 80, isAvailable: true, acceptsDesignFile: true, stockQuantity: 200 },
      ]
    },
    {
      id: 'prod-9', categoryId: 'cat-photo', slug: 'canvas-personalizado',
      titleEs: 'Canvas Personalizado', titleEn: 'Custom Canvas',
      descriptionEs: 'Impresión en canvas estirado sobre bastidor de madera. Calidad de galería.',
      descriptionEn: 'Canvas print stretched on wooden frame. Gallery quality.',
      tags: ['canvas', 'foto', 'decoracion'], imageUrls: [], isActive: true,
      variants: [
        { id: 'v9-1', sku: 'CVS-20X20', labelEs: '20×20cm', labelEn: '20×20cm', price: 350, isAvailable: true, acceptsDesignFile: true, stockQuantity: 30 },
        { id: 'v9-2', sku: 'CVS-30X40', labelEs: '30×40cm', labelEn: '30×40cm', price: 550, isAvailable: true, acceptsDesignFile: true, stockQuantity: 20 },
        { id: 'v9-3', sku: 'CVS-50X70', labelEs: '50×70cm', labelEn: '50×70cm', price: 950, isAvailable: true, acceptsDesignFile: true, stockQuantity: 10 },
      ]
    },
  ];

  // ── Helpers ────────────────────────────────────────────────────────────────
  function _minPrice(product) {
    var avail = product.variants.filter(function (v) { return v.isAvailable; });
    if (!avail.length) return 0;
    return Math.min.apply(null, avail.map(function (v) { return v.price; }));
  }

  function _recalcCart() {
    _state.cart.total = _state.cart.items.reduce(function (s, i) {
      return s + i.unitPrice * i.quantity;
    }, 0);
    _save();
  }

  function _cartItemView(item) {
    var variant = null;
    var product = null;
    PRODUCTS.forEach(function (p) {
      p.variants.forEach(function (v) {
        if (v.id === item.productVariantId) { variant = v; product = p; }
      });
    });

    // Handle catalog-format IDs: "productId__variantLabel"
    var titleEs = product ? product.titleEs : '';
    var titleEn = product ? product.titleEn : '';
    var labelEs = variant ? variant.labelEs : '';
    var labelEn = variant ? variant.labelEn : '';
    var acceptsDesign = variant ? variant.acceptsDesignFile : false;

    if (!product && typeof item.productVariantId === 'string' && item.productVariantId.includes('__')) {
      var parts = item.productVariantId.split('__');
      titleEs = parts[0] || 'Producto';
      titleEn = parts[0] || 'Product';
      labelEs = parts[1] || '';
      labelEn = parts[1] || '';
      acceptsDesign = true;
    }

    return {
      id: item.id,
      productVariantId: item.productVariantId,
      productTitleEs: titleEs,
      productTitleEn: titleEn,
      variantLabelEs: labelEs,
      variantLabelEn: labelEn,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      customizationNotes: item.customizationNotes || null,
      acceptsDesignFile: acceptsDesign,
      designFileName: item.designFileName || null,
    };
  }

  function _cartView() {
    return {
      id: _state.cart.id,
      items: _state.cart.items.map(_cartItemView),
      total: _state.cart.total,
    };
  }

  // ── Override API functions ─────────────────────────────────────────────────

  // Categories
  window.getCategories = async function () {
    await delay(200);
    return CATEGORIES;
  };

  // Products
  window.getProducts = async function (params) {
    await delay(250);
    params = params || {};
    var items = PRODUCTS.filter(function (p) { return p.isActive; });

    if (params.categoryId) {
      var cat = CATEGORIES.find(function (c) { return c.id === params.categoryId || c.slug === params.categoryId; });
      if (cat) items = items.filter(function (p) { return p.categoryId === cat.id; });
    }

    if (params.search) {
      var q = params.search.toLowerCase();
      items = items.filter(function (p) {
        return p.titleEs.toLowerCase().includes(q) ||
               p.titleEn.toLowerCase().includes(q) ||
               p.descriptionEs.toLowerCase().includes(q);
      });
    }

    var page = parseInt(params.page) || 1;
    var pageSize = parseInt(params.pageSize) || 20;
    var total = items.length;
    var paged = items.slice((page - 1) * pageSize, page * pageSize);

    return {
      items: paged.map(function (p) {
        return Object.assign({}, p, { basePrice: _minPrice(p) });
      }),
      page: page,
      pageSize: pageSize,
      totalCount: total,
    };
  };

  window.getProduct = async function (id) {
    await delay(200);
    var p = PRODUCTS.find(function (p) { return p.id === id || p.slug === id; });
    if (!p) throw { status: 404, detail: 'Product not found' };
    return Object.assign({}, p, { basePrice: _minPrice(p) });
  };

  // Auth
  window.authRegister = async function (data) {
    await delay(400);
    var existing = _state.users.find(function (u) { return u.email === data.email; });
    if (existing) throw { status: 409, detail: 'Email already registered', type: 'duplicate-email' };

    var pw = data.password || '';
    if (pw.length < 8) throw { status: 422, detail: 'Password too short', type: 'validation-failed' };
    if (!/[A-Z]/.test(pw)) throw { status: 422, detail: 'Password needs uppercase', type: 'validation-failed' };
    if (!/\d/.test(pw)) throw { status: 422, detail: 'Password needs a digit', type: 'validation-failed' };

    var user = {
      id: 'user-' + Date.now(),
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: null,
      addresses: [],
      _password: data.password,
    };
    _state.users.push(user);
    _state.session = { userId: user.id, firstName: user.firstName, email: user.email };
    _save();
    return { id: user.id, firstName: user.firstName, email: user.email };
  };

  window.authLogin = async function (data) {
    await delay(400);
    var user = _state.users.find(function (u) { return u.email === data.email && u._password === data.password; });
    if (!user) throw { status: 401, detail: 'Invalid credentials', type: 'invalid-credentials' };
    _state.session = { userId: user.id, firstName: user.firstName, email: user.email };
    _save();
    return { id: user.id, firstName: user.firstName, email: user.email };
  };

  window.authLogout = async function () {
    await delay(200);
    _state.session = null;
    _save();
    return null;
  };

  window.authRefresh = async function () {
    await delay(100);
    if (!_state.session) throw { status: 401, detail: 'No session' };
    return { ok: true };
  };

  window.forgotPassword = async function (email) {
    await delay(400);
    // Always return 200 (don't reveal if email exists)
    return { ok: true };
  };

  window.resetPassword = async function (token, newPassword) {
    await delay(400);
    return { ok: true };
  };

  // User profile
  window.getMe = async function () {
    await delay(200);
    if (!_state.session) throw { status: 401, detail: 'Unauthorized' };
    var user = _state.users.find(function (u) { return u.id === _state.session.userId; });
    if (!user) throw { status: 401, detail: 'Unauthorized' };
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      addresses: user.addresses || [],
    };
  };

  window.updateMe = async function (data) {
    await delay(300);
    if (!_state.session) throw { status: 401, detail: 'Unauthorized' };
    var user = _state.users.find(function (u) { return u.id === _state.session.userId; });
    if (!user) throw { status: 401, detail: 'Unauthorized' };
    if (data.firstName !== undefined) user.firstName = data.firstName;
    if (data.lastName !== undefined) user.lastName = data.lastName;
    if (data.phoneNumber !== undefined) user.phoneNumber = data.phoneNumber;
    _state.session.firstName = user.firstName;
    _save();
    return { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, phoneNumber: user.phoneNumber };
  };

  window.addAddress = async function (addr) {
    await delay(300);
    if (!_state.session) throw { status: 401, detail: 'Unauthorized' };
    var user = _state.users.find(function (u) { return u.id === _state.session.userId; });
    if (!user) throw { status: 401, detail: 'Unauthorized' };
    var newAddr = Object.assign({ id: 'addr-' + Date.now() }, addr);
    user.addresses = user.addresses || [];
    user.addresses.push(newAddr);
    _save();
    return newAddr;
  };

  window.deleteAddress = async function (id) {
    await delay(300);
    if (!_state.session) throw { status: 401, detail: 'Unauthorized' };
    var user = _state.users.find(function (u) { return u.id === _state.session.userId; });
    if (!user) throw { status: 401, detail: 'Unauthorized' };
    user.addresses = (user.addresses || []).filter(function (a) { return a.id !== id; });
    _save();
    return null;
  };

  window.getAddresses = async function () {
    var me = await window.getMe();
    return me.addresses;
  };

  // Cart
  window.getCart = async function () {
    await delay(200);
    return _cartView();
  };

  window.addToCart = async function (item) {
    await delay(300);
    var variantId = item.productVariantId;
    var qty = item.quantity || 1;

    // Find variant price — supports both mock API UUIDs and catalog "productId__variantName" format
    var price = 0;
    PRODUCTS.forEach(function (p) {
      p.variants.forEach(function (v) {
        if (v.id === variantId) price = v.price;
      });
    });
    // Fallback for catalog-format IDs (e.g. "uv-1__Taza Blanca 11oz")
    if (!price && typeof variantId === 'string' && variantId.includes('__')) {
      price = 150; // default placeholder price for catalog items
    }
    if (!price) price = 100;

    // Check if already in cart
    var existing = _state.cart.items.find(function (i) { return i.productVariantId === variantId; });
    if (existing) {
      existing.quantity += qty;
    } else {
      _state.cart.items.push({
        id: 'ci-' + Date.now(),
        productVariantId: variantId,
        quantity: qty,
        unitPrice: price,
        customizationNotes: item.customizationNotes || null,
        designFileName: null,
      });
    }
    _recalcCart();
    return _cartView();
  };

  window.updateCartItem = async function (id, qty) {
    await delay(200);
    if (qty <= 0) {
      _state.cart.items = _state.cart.items.filter(function (i) { return i.id !== id; });
    } else {
      var item = _state.cart.items.find(function (i) { return i.id === id; });
      if (item) item.quantity = qty;
    }
    _recalcCart();
    return _cartView();
  };

  window.removeCartItem = async function (id) {
    await delay(200);
    _state.cart.items = _state.cart.items.filter(function (i) { return i.id !== id; });
    _recalcCart();
    return _cartView();
  };

  window.clearCart = async function () {
    await delay(200);
    _state.cart.items = [];
    _state.cart.total = 0;
    _save();
    return null;
  };

  window.uploadDesign = async function (itemId, file) {
    await delay(500);
    var item = _state.cart.items.find(function (i) { return i.id === itemId; });
    if (item) item.designFileName = file.name;
    _save();
    return { designFileId: 'df-' + Date.now(), fileName: file.name };
  };

  // Orders
  window.createOrder = async function (payload) {
    await delay(500);
    // Allow guest orders (no session required)
    if (!_state.cart.items.length) throw { status: 400, detail: 'Cart is empty', type: 'cart-empty' };

    var orderId = 'order-' + Date.now();
    var userId = _state.session ? _state.session.userId : 'guest';
    var order = {
      id: orderId,
      userId: userId,
      shippingAddressId: payload.shippingAddressId || null,
      notes: payload.notes || null,
      total: _state.cart.total,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: _state.cart.items.map(function (i) {
        var view = _cartItemView(i);
        return {
          id: 'oi-' + Date.now() + Math.random(),
          orderId: orderId,
          productVariantId: i.productVariantId,
          productTitleEs: view.productTitleEs,
          productTitleEn: view.productTitleEn,
          variantLabelEs: view.variantLabelEs,
          variantLabelEn: view.variantLabelEn,
          unitPrice: i.unitPrice,
          quantity: i.quantity,
        };
      }),
    };

    _state.orders.push(order);
    // Clear cart
    _state.cart.items = [];
    _state.cart.total = 0;
    _save();
    return { orderId: orderId };
  };

  window.createPayment = async function (orderId) {
    await delay(400);
    // In mock mode, redirect to success confirmation page
    var url = 'order-confirmation.html?status=success&orderId=' + encodeURIComponent(orderId);
    return { checkoutUrl: url, preferenceId: 'mock-pref-' + Date.now() };
  };

  window.getOrders = async function (params) {
    await delay(300);
    if (!_state.session) throw { status: 401, detail: 'Unauthorized' };
    params = params || {};
    var userOrders = _state.orders.filter(function (o) { return o.userId === _state.session.userId; });
    userOrders = userOrders.slice().reverse(); // newest first
    var page = parseInt(params.page) || 1;
    var pageSize = parseInt(params.pageSize) || 10;
    return {
      items: userOrders.slice((page - 1) * pageSize, page * pageSize),
      page: page,
      pageSize: pageSize,
      totalCount: userOrders.length,
    };
  };

  window.getOrder = async function (id) {
    await delay(200);
    var order = _state.orders.find(function (o) { return o.id === id; });
    if (!order) throw { status: 404, detail: 'Order not found', type: 'order-not-found' };
    return order;
  };

  console.info('[MockAPI] Active — all API calls are mocked. Remove mock-api.js when backend is ready.');
})();
