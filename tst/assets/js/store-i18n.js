/**
 * store-i18n.js — Store-specific translation keys for Filamorfosis
 *
 * Merges store UI strings into window.translations for all 6 supported
 * languages (ES, EN, DE, PT, JA, ZH) and wires into the existing i18n system.
 *
 * Usage: include this script after main.js on store pages.
 * On pages without main.js, translations are applied directly on DOMContentLoaded.
 */
(function () {
    'use strict';

    // ─────────────────────────────────────────────────────────────────────────
    // 1. Translation maps — one flat object per language
    // ─────────────────────────────────────────────────────────────────────────

    var storeKeys = {

        // ── Spanish (ES) ─────────────────────────────────────────────────────
        es: {
            // Auth form labels
            'auth.login':        'Iniciar sesión',
            'auth.register':     'Registrarse',
            'auth.loginBtn':     'Entrar',
            'auth.registerBtn':  'Crear cuenta',
            'auth.email':        'Correo electrónico',
            'auth.password':     'Contraseña',
            'auth.firstName':    'Nombre',
            'auth.lastName':     'Apellido',
            'auth.passwordHint': 'Mínimo 8 caracteres, 1 mayúscula y 1 número',
            'auth.forgot':       '¿Olvidé mi contraseña?',
            'auth.forgotDesc':   'Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.',
            'auth.sendReset':    'Enviar enlace',
            'auth.backToLogin':  '← Volver al inicio de sesión',
            'auth.logout':       'Cerrar sesión',

            // Cart labels
            'cart.title':        'Carrito',
            'cart.empty':        'Tu carrito está vacío.',
            'cart.total':        'Total:',
            'cart.checkout':     'Proceder al pago',
            'cart.remove':       'Eliminar',
            'cart.uploadDesign': 'Subir diseño',
            'cart.qty':          'Cantidad',
            'cart.item':         'artículo',
            'cart.items':        'artículos',

            // Checkout form labels
            'checkout.title':       'Finalizar compra',
            'checkout.shipping':    'Dirección de envío',
            'checkout.addAddress':  '+ Agregar nueva dirección',
            'checkout.saveAddress': 'Guardar dirección',
            'checkout.street':      'Calle y número',
            'checkout.city':        'Ciudad',
            'checkout.state':       'Estado',
            'checkout.postalCode':  'Código postal',
            'checkout.country':     'País',
            'checkout.notes':       'Notas del pedido (opcional)',
            'checkout.summary':     'Resumen del pedido',
            'checkout.total':       'Total:',
            'checkout.pay':         'Pagar con MercadoPago',
            'checkout.processing':  'Procesando...',

            // Order status labels
            'status.Pending':        'Pendiente',
            'status.PendingPayment': 'Pago pendiente',
            'status.Paid':           'Pagado',
            'status.InProduction':   'En producción',
            'status.Shipped':        'Enviado',
            'status.Delivered':      'Entregado',
            'status.Cancelled':      'Cancelado',
            'status.PaymentFailed':  'Pago fallido',

            // Order confirmation labels
            'confirmation.successTitle':  '¡Pago exitoso!',
            'confirmation.successMsg':    'Tu pedido ha sido recibido. Te enviaremos una confirmación por correo.',
            'confirmation.failureTitle':  'Pago fallido',
            'confirmation.failureMsg':    'No pudimos procesar tu pago. Puedes intentarlo de nuevo.',
            'confirmation.pendingTitle':  'Pago pendiente',
            'confirmation.pendingMsg':    'Tu pago está siendo procesado. Te notificaremos cuando se confirme.',
            'confirmation.orderId':       'Pedido #',
            'confirmation.total':         'Total:',
            'confirmation.viewOrders':    'Ver mis pedidos',
            'confirmation.keepShopping':  'Seguir comprando',
            'confirmation.retry':         'Reintentar pago',

            // Account page labels
            'account.title':     'Mi cuenta',
            'account.profile':   'Perfil',
            'account.addresses': 'Direcciones',
            'account.orders':    'Mis pedidos',
            'account.phone':     'Teléfono',
            'account.save':      'Guardar cambios',
            'account.delete':    'Eliminar',
            'account.noOrders':  'Aún no tienes pedidos.',
            'account.orderDate': 'Fecha',
            'account.orderTotal':'Total',
            'account.orderStatus':'Estado',

            // Store CTA labels
            'hero.shopNow':        'Explorar Productos',
            'nav.store':           'Tienda',
            'gallery.viewAll':     'Ver todos los productos →',
            'service.viewProducts':'Ver productos',
            'add_to_cart':         'Agregar al carrito',

            // Toast / notification keys
            'toast.added':           'Agregado al carrito',
            'toast.removed':         'Artículo eliminado',
            'toast.profileSaved':    '✓ Perfil actualizado',
            'toast.linkCopied':      '¡Enlace copiado!',
            'toast.invoiceSoon':     'Facturas disponibles próximamente',
            'toast.couponApplied':   'Código aplicado — descuento disponible próximamente',
            'toast.cartEmpty':       'Tu carrito está vacío. Agrega productos primero.',
            'toast.reorderSkipped':  'Algunos productos no están disponibles y fueron omitidos',

            // Mini Cart keys
            'cart.continueShopping': 'Seguir comprando',
            'cart.designWarn':       '⚠ Sube tu diseño',
            'cart.emptyTitle':       'Tu carrito está vacío',
            'cart.emptyAction':      'Ver productos',
            'trust.secure':          'Pago seguro',
            'trust.quality':         'Producción garantizada',
            'trust.support':         'Soporte 24/7',
            'trust.ssl':             'Datos protegidos',

            // Checkout enhancement keys
            'checkout.progress.cart':      'Carrito',
            'checkout.progress.shipping':  'Envío',
            'checkout.progress.payment':   'Pago',
            'checkout.addressQuestion':    '¿A dónde enviamos tu pedido?',
            'checkout.notesQuestion':      '¿Alguna nota para nosotros?',
            'checkout.payBtn':             '¡Listo! Pagar con MercadoPago',
            'checkout.coupon':             'Código de descuento',
            'checkout.couponApply':        'Aplicar',
            'checkout.estimatedDelivery':  'Entrega estimada: 5–8 días hábiles',
            'checkout.guestBtn':           'Continuar como invitado',
            'checkout.returnPolicy':       'Política de devoluciones',

            // Order Confirmation keys
            'confirmation.rewards':        '¡Ganaste puntos por esta compra! 🎉 Próximamente podrás canjearlos por descuentos.',
            'confirmation.share':          '¡Comparte tu pedido!',
            'confirmation.shareBtn':       'Compartir en WhatsApp',
            'confirmation.copyLink':       'Copiar enlace',
            'confirmation.guestUpsell':    '¿Quieres guardar tu pedido? Crea una cuenta gratis.',
            'confirmation.createAccount':  'Crear cuenta',

            // Account / Orders keys
            'account.logout':           'Cerrar sesión',
            'account.reorder':          'Volver a pedir',
            'account.invoice':          'Descargar factura',
            'account.searchOrders':     'Buscar por ID o producto...',
            'account.filterAll':        'Todos',
            'account.filterActive':     'Activos',
            'account.filterDone':       'Completados',
            'account.noOrdersTitle':    'Aún no tienes pedidos — ¡empieza a comprar!',
            'account.noOrdersFilter':   'No encontramos pedidos con ese criterio',
            'account.noOrdersCta':      'Ver productos',
            'account.estimatedDelivery':'Entrega estimada:',
            'account.addAddress':       'Agregar dirección',
            'account.defaultBadge':     'Predeterminada',
            'timeline.paid':            'Pagado',
            'timeline.inProduction':    'En producción',
            'timeline.shipped':         'Enviado',
            'timeline.delivered':       'Entregado',

            // WhatsApp FAB, Promo Banner, Search keys
            'whatsapp.ariaLabel':  'Contactar por WhatsApp',
            'promo.message':       '🚀 ¡Envío gratis en pedidos mayores a $999 MXN! Usa el código FILA999',
            'promo.close':         'Cerrar banner',
            'search.noResults':    'No encontramos resultados para',
            'search.didYouMean':   '¿Quisiste decir',
            'search.viewAll':      'Ver todos los productos',

            // Product Modal enhancement keys
            'modal.socialProof':   'personas han pedido esto este mes',
            'modal.urgency':       '¡Solo quedan',
            'modal.urgencyEnd':    'en stock!',
            'modal.share':         'Compartir',
            'modal.helpSection':   '¿Necesitas ayuda?',
            'modal.relatedTitle':  'Clientes también compraron',
            'modal.specsTitle':    'Especificaciones técnicas',
            'modal.returnPolicy':  'Política de devoluciones',
            'design.title':        'Sube tu diseño aquí',
            'design.sub':          'Arrastra tu imagen o haz clic para seleccionar',
            'design.formats':      'PNG, JPG, SVG, PDF · Máx. 20 MB',
            'design.advisory':     'Recuerda subir tu diseño antes de finalizar tu compra',
            'design.errorSize':    'El archivo supera el límite de 20 MB.',
            'design.errorType':    'Formato no soportado. Usa PNG, JPG, SVG o PDF.',

            // Brand Story and Reviews keys
            'brandStory.title':    'Tus Ideas. Tu Realidad.',
            'brandStory.learnMore':'Conoce nuestra historia →',
            'reviews.title':       'Lo que dicen nuestros clientes',
        },

        // ── English (EN) ─────────────────────────────────────────────────────
        en: {
            'auth.login':        'Sign in',
            'auth.register':     'Register',
            'auth.loginBtn':     'Sign in',
            'auth.registerBtn':  'Create account',
            'auth.email':        'Email address',
            'auth.password':     'Password',
            'auth.firstName':    'First name',
            'auth.lastName':     'Last name',
            'auth.passwordHint': 'At least 8 characters, 1 uppercase and 1 number',
            'auth.forgot':       'Forgot my password?',
            'auth.forgotDesc':   'Enter your email and we will send you a link to reset your password.',
            'auth.sendReset':    'Send link',
            'auth.backToLogin':  '← Back to sign in',
            'auth.logout':       'Sign out',

            'cart.title':        'Cart',
            'cart.empty':        'Your cart is empty.',
            'cart.total':        'Total:',
            'cart.checkout':     'Proceed to checkout',
            'cart.remove':       'Remove',
            'cart.uploadDesign': 'Upload design',
            'cart.qty':          'Quantity',
            'cart.item':         'item',
            'cart.items':        'items',

            'checkout.title':       'Checkout',
            'checkout.shipping':    'Shipping address',
            'checkout.addAddress':  '+ Add new address',
            'checkout.saveAddress': 'Save address',
            'checkout.street':      'Street and number',
            'checkout.city':        'City',
            'checkout.state':       'State',
            'checkout.postalCode':  'Postal code',
            'checkout.country':     'Country',
            'checkout.notes':       'Order notes (optional)',
            'checkout.summary':     'Order summary',
            'checkout.total':       'Total:',
            'checkout.pay':         'Pay with MercadoPago',
            'checkout.processing':  'Processing...',

            'status.Pending':        'Pending',
            'status.PendingPayment': 'Pending payment',
            'status.Paid':           'Paid',
            'status.InProduction':   'In production',
            'status.Shipped':        'Shipped',
            'status.Delivered':      'Delivered',
            'status.Cancelled':      'Cancelled',
            'status.PaymentFailed':  'Payment failed',

            'confirmation.successTitle':  'Payment successful!',
            'confirmation.successMsg':    'Your order has been received. We will send you a confirmation email.',
            'confirmation.failureTitle':  'Payment failed',
            'confirmation.failureMsg':    'We could not process your payment. You can try again.',
            'confirmation.pendingTitle':  'Payment pending',
            'confirmation.pendingMsg':    'Your payment is being processed. We will notify you when confirmed.',
            'confirmation.orderId':       'Order #',
            'confirmation.total':         'Total:',
            'confirmation.viewOrders':    'View my orders',
            'confirmation.keepShopping':  'Keep shopping',
            'confirmation.retry':         'Retry payment',

            'account.title':     'My account',
            'account.profile':   'Profile',
            'account.addresses': 'Addresses',
            'account.orders':    'My orders',
            'account.phone':     'Phone',
            'account.save':      'Save changes',
            'account.delete':    'Delete',
            'account.noOrders':  'You have no orders yet.',
            'account.orderDate': 'Date',
            'account.orderTotal':'Total',
            'account.orderStatus':'Status',

            'hero.shopNow':        'Explore Products',
            'nav.store':           'Store',
            'gallery.viewAll':     'View all products →',
            'service.viewProducts':'View products',
            'add_to_cart':         'Add to cart',

            // Toast / notification keys
            'toast.added':           'Added to cart',
            'toast.removed':         'Item removed',
            'toast.profileSaved':    '✓ Profile updated',
            'toast.linkCopied':      'Link copied!',
            'toast.invoiceSoon':     'Invoices coming soon',
            'toast.couponApplied':   'Code applied — discount coming soon',
            'toast.cartEmpty':       'Your cart is empty. Add products first.',
            'toast.reorderSkipped':  'Some products are unavailable and were skipped',

            // Mini Cart keys
            'cart.continueShopping': 'Continue shopping',
            'cart.designWarn':       '⚠ Upload your design',
            'cart.emptyTitle':       'Your cart is empty',
            'cart.emptyAction':      'View products',
            'trust.secure':          'Secure payment',
            'trust.quality':         'Guaranteed production',
            'trust.support':         '24/7 Support',
            'trust.ssl':             'Protected data',

            // Checkout enhancement keys
            'checkout.progress.cart':      'Cart',
            'checkout.progress.shipping':  'Shipping',
            'checkout.progress.payment':   'Payment',
            'checkout.addressQuestion':    'Where should we ship your order?',
            'checkout.notesQuestion':      'Any notes for us?',
            'checkout.payBtn':             'Ready! Pay with MercadoPago',
            'checkout.coupon':             'Discount code',
            'checkout.couponApply':        'Apply',
            'checkout.estimatedDelivery':  'Estimated delivery: 5–8 business days',
            'checkout.guestBtn':           'Continue as guest',
            'checkout.returnPolicy':       'Return policy',

            // Order Confirmation keys
            'confirmation.rewards':        'You earned points for this purchase! 🎉 Soon you\'ll be able to redeem them for discounts.',
            'confirmation.share':          'Share your order!',
            'confirmation.shareBtn':       'Share on WhatsApp',
            'confirmation.copyLink':       'Copy link',
            'confirmation.guestUpsell':    'Want to save your order? Create a free account.',
            'confirmation.createAccount':  'Create account',

            // Account / Orders keys
            'account.logout':           'Sign out',
            'account.reorder':          'Reorder',
            'account.invoice':          'Download invoice',
            'account.searchOrders':     'Search by ID or product...',
            'account.filterAll':        'All',
            'account.filterActive':     'Active',
            'account.filterDone':       'Completed',
            'account.noOrdersTitle':    'No orders yet — start shopping!',
            'account.noOrdersFilter':   'No orders found for that criteria',
            'account.noOrdersCta':      'View products',
            'account.estimatedDelivery':'Estimated delivery:',
            'account.addAddress':       'Add address',
            'account.defaultBadge':     'Default',
            'timeline.paid':            'Paid',
            'timeline.inProduction':    'In production',
            'timeline.shipped':         'Shipped',
            'timeline.delivered':       'Delivered',

            // WhatsApp FAB, Promo Banner, Search keys
            'whatsapp.ariaLabel':  'Contact via WhatsApp',
            'promo.message':       '🚀 Free shipping on orders over $999 MXN! Use code FILA999',
            'promo.close':         'Close banner',
            'search.noResults':    'No results found for',
            'search.didYouMean':   'Did you mean',
            'search.viewAll':      'View all products',

            // Product Modal enhancement keys
            'modal.socialProof':   'people ordered this this month',
            'modal.urgency':       'Only',
            'modal.urgencyEnd':    'left in stock!',
            'modal.share':         'Share',
            'modal.helpSection':   'Need help?',
            'modal.relatedTitle':  'Customers also bought',
            'modal.specsTitle':    'Technical specifications',
            'modal.returnPolicy':  'Return policy',
            'design.title':        'Upload your design here',
            'design.sub':          'Drag your image or click to select',
            'design.formats':      'PNG, JPG, SVG, PDF · Max. 20 MB',
            'design.advisory':     'Remember to upload your design before completing your purchase',
            'design.errorSize':    'File exceeds the 20 MB limit.',
            'design.errorType':    'Unsupported format. Use PNG, JPG, SVG or PDF.',

            // Brand Story and Reviews keys
            'brandStory.title':    'Your Ideas. Your Reality.',
            'brandStory.learnMore':'Learn our story →',
            'reviews.title':       'What our customers say',
        },

        // ── German (DE) ──────────────────────────────────────────────────────
        de: {
            'auth.login':        'Anmelden',
            'auth.register':     'Registrieren',
            'auth.loginBtn':     'Anmelden',
            'auth.registerBtn':  'Konto erstellen',
            'auth.email':        'E-Mail-Adresse',
            'auth.password':     'Passwort',
            'auth.firstName':    'Vorname',
            'auth.lastName':     'Nachname',
            'auth.passwordHint': 'Mindestens 8 Zeichen, 1 Großbuchstabe und 1 Zahl',
            'auth.forgot':       'Passwort vergessen?',
            'auth.forgotDesc':   'Gib deine E-Mail ein und wir senden dir einen Link zum Zurücksetzen.',
            'auth.sendReset':    'Link senden',
            'auth.backToLogin':  '← Zurück zur Anmeldung',
            'auth.logout':       'Abmelden',

            'cart.title':        'Warenkorb',
            'cart.empty':        'Dein Warenkorb ist leer.',
            'cart.total':        'Gesamt:',
            'cart.checkout':     'Zur Kasse',
            'cart.remove':       'Entfernen',
            'cart.uploadDesign': 'Design hochladen',
            'cart.qty':          'Menge',
            'cart.item':         'Artikel',
            'cart.items':        'Artikel',

            'checkout.title':       'Kasse',
            'checkout.shipping':    'Lieferadresse',
            'checkout.addAddress':  '+ Neue Adresse hinzufügen',
            'checkout.saveAddress': 'Adresse speichern',
            'checkout.street':      'Straße und Hausnummer',
            'checkout.city':        'Stadt',
            'checkout.state':       'Bundesland',
            'checkout.postalCode':  'Postleitzahl',
            'checkout.country':     'Land',
            'checkout.notes':       'Bestellnotizen (optional)',
            'checkout.summary':     'Bestellübersicht',
            'checkout.total':       'Gesamt:',
            'checkout.pay':         'Mit MercadoPago bezahlen',
            'checkout.processing':  'Wird verarbeitet...',

            'status.Pending':        'Ausstehend',
            'status.PendingPayment': 'Zahlung ausstehend',
            'status.Paid':           'Bezahlt',
            'status.InProduction':   'In Produktion',
            'status.Shipped':        'Versandt',
            'status.Delivered':      'Geliefert',
            'status.Cancelled':      'Storniert',
            'status.PaymentFailed':  'Zahlung fehlgeschlagen',

            'confirmation.successTitle':  'Zahlung erfolgreich!',
            'confirmation.successMsg':    'Deine Bestellung wurde empfangen. Wir senden dir eine Bestätigungs-E-Mail.',
            'confirmation.failureTitle':  'Zahlung fehlgeschlagen',
            'confirmation.failureMsg':    'Deine Zahlung konnte nicht verarbeitet werden. Du kannst es erneut versuchen.',
            'confirmation.pendingTitle':  'Zahlung ausstehend',
            'confirmation.pendingMsg':    'Deine Zahlung wird verarbeitet. Wir benachrichtigen dich bei Bestätigung.',
            'confirmation.orderId':       'Bestellung #',
            'confirmation.total':         'Gesamt:',
            'confirmation.viewOrders':    'Meine Bestellungen',
            'confirmation.keepShopping':  'Weiter einkaufen',
            'confirmation.retry':         'Zahlung wiederholen',

            'account.title':     'Mein Konto',
            'account.profile':   'Profil',
            'account.addresses': 'Adressen',
            'account.orders':    'Meine Bestellungen',
            'account.phone':     'Telefon',
            'account.save':      'Änderungen speichern',
            'account.delete':    'Löschen',
            'account.noOrders':  'Du hast noch keine Bestellungen.',
            'account.orderDate': 'Datum',
            'account.orderTotal':'Gesamt',
            'account.orderStatus':'Status',

            'hero.shopNow':        'Produkte entdecken',
            'nav.store':           'Shop',
            'gallery.viewAll':     'Alle Produkte ansehen →',
            'service.viewProducts':'Produkte ansehen',
            'add_to_cart':         'In den Warenkorb',

            // Toast / notification keys
            'toast.added':           'In den Warenkorb gelegt',
            'toast.removed':         'Artikel entfernt',
            'toast.profileSaved':    '✓ Profil aktualisiert',
            'toast.linkCopied':      'Link kopiert!',
            'toast.invoiceSoon':     'Rechnungen demnächst verfügbar',
            'toast.couponApplied':   'Code angewendet — Rabatt demnächst',
            'toast.cartEmpty':       'Dein Warenkorb ist leer. Füge zuerst Produkte hinzu.',
            'toast.reorderSkipped':  'Einige Produkte sind nicht verfügbar und wurden übersprungen',

            // Mini Cart keys
            'cart.continueShopping': 'Weiter einkaufen',
            'cart.designWarn':       '⚠ Design hochladen',
            'cart.emptyTitle':       'Dein Warenkorb ist leer',
            'cart.emptyAction':      'Produkte ansehen',
            'trust.secure':          'Sichere Zahlung',
            'trust.quality':         'Garantierte Produktion',
            'trust.support':         '24/7 Support',
            'trust.ssl':             'Daten geschützt',

            // Checkout enhancement keys
            'checkout.progress.cart':      'Warenkorb',
            'checkout.progress.shipping':  'Versand',
            'checkout.progress.payment':   'Zahlung',
            'checkout.addressQuestion':    'Wohin sollen wir deine Bestellung liefern?',
            'checkout.notesQuestion':      'Irgendwelche Anmerkungen für uns?',
            'checkout.payBtn':             'Bereit! Mit MercadoPago bezahlen',
            'checkout.coupon':             'Rabattcode',
            'checkout.couponApply':        'Anwenden',
            'checkout.estimatedDelivery':  'Geschätzte Lieferzeit: 5–8 Werktage',
            'checkout.guestBtn':           'Als Gast fortfahren',
            'checkout.returnPolicy':       'Rückgaberichtlinie',

            // Order Confirmation keys
            'confirmation.rewards':        'Du hast Punkte für diesen Kauf gesammelt! 🎉 Bald kannst du sie gegen Rabatte einlösen.',
            'confirmation.share':          'Teile deine Bestellung!',
            'confirmation.shareBtn':       'Auf WhatsApp teilen',
            'confirmation.copyLink':       'Link kopieren',
            'confirmation.guestUpsell':    'Möchtest du deine Bestellung speichern? Erstelle ein kostenloses Konto.',
            'confirmation.createAccount':  'Konto erstellen',

            // Account / Orders keys
            'account.logout':           'Abmelden',
            'account.reorder':          'Erneut bestellen',
            'account.invoice':          'Rechnung herunterladen',
            'account.searchOrders':     'Nach ID oder Produkt suchen...',
            'account.filterAll':        'Alle',
            'account.filterActive':     'Aktiv',
            'account.filterDone':       'Abgeschlossen',
            'account.noOrdersTitle':    'Noch keine Bestellungen — fang an zu kaufen!',
            'account.noOrdersFilter':   'Keine Bestellungen für dieses Kriterium gefunden',
            'account.noOrdersCta':      'Produkte ansehen',
            'account.estimatedDelivery':'Geschätzte Lieferung:',
            'account.addAddress':       'Adresse hinzufügen',
            'account.defaultBadge':     'Standard',
            'timeline.paid':            'Bezahlt',
            'timeline.inProduction':    'In Produktion',
            'timeline.shipped':         'Versandt',
            'timeline.delivered':       'Geliefert',

            // WhatsApp FAB, Promo Banner, Search keys
            'whatsapp.ariaLabel':  'Über WhatsApp kontaktieren',
            'promo.message':       '🚀 Kostenloser Versand ab $999 MXN! Code: FILA999',
            'promo.close':         'Banner schließen',
            'search.noResults':    'Keine Ergebnisse für',
            'search.didYouMean':   'Meintest du',
            'search.viewAll':      'Alle Produkte ansehen',

            // Product Modal enhancement keys
            'modal.socialProof':   'Personen haben dies diesen Monat bestellt',
            'modal.urgency':       'Nur noch',
            'modal.urgencyEnd':    'auf Lager!',
            'modal.share':         'Teilen',
            'modal.helpSection':   'Brauchst du Hilfe?',
            'modal.relatedTitle':  'Kunden kauften auch',
            'modal.specsTitle':    'Technische Spezifikationen',
            'modal.returnPolicy':  'Rückgaberichtlinie',
            'design.title':        'Lade dein Design hoch',
            'design.sub':          'Bild hierher ziehen oder klicken',
            'design.formats':      'PNG, JPG, SVG, PDF · Max. 20 MB',
            'design.advisory':     'Vergiss nicht, dein Design vor dem Kauf hochzuladen',
            'design.errorSize':    'Datei überschreitet das 20-MB-Limit.',
            'design.errorType':    'Nicht unterstütztes Format. Verwende PNG, JPG, SVG oder PDF.',

            // Brand Story and Reviews keys
            'brandStory.title':    'Deine Ideen. Deine Realität.',
            'brandStory.learnMore':'Unsere Geschichte →',
            'reviews.title':       'Was unsere Kunden sagen',
        },

        // ── Portuguese (PT) ──────────────────────────────────────────────────
        pt: {
            'auth.login':        'Entrar',
            'auth.register':     'Registrar',
            'auth.loginBtn':     'Entrar',
            'auth.registerBtn':  'Criar conta',
            'auth.email':        'Endereço de e-mail',
            'auth.password':     'Senha',
            'auth.firstName':    'Nome',
            'auth.lastName':     'Sobrenome',
            'auth.passwordHint': 'Mínimo 8 caracteres, 1 maiúscula e 1 número',
            'auth.forgot':       'Esqueci minha senha?',
            'auth.forgotDesc':   'Digite seu e-mail e enviaremos um link para redefinir sua senha.',
            'auth.sendReset':    'Enviar link',
            'auth.backToLogin':  '← Voltar ao login',
            'auth.logout':       'Sair',

            'cart.title':        'Carrinho',
            'cart.empty':        'Seu carrinho está vazio.',
            'cart.total':        'Total:',
            'cart.checkout':     'Finalizar compra',
            'cart.remove':       'Remover',
            'cart.uploadDesign': 'Enviar design',
            'cart.qty':          'Quantidade',
            'cart.item':         'item',
            'cart.items':        'itens',

            'checkout.title':       'Finalizar compra',
            'checkout.shipping':    'Endereço de entrega',
            'checkout.addAddress':  '+ Adicionar novo endereço',
            'checkout.saveAddress': 'Salvar endereço',
            'checkout.street':      'Rua e número',
            'checkout.city':        'Cidade',
            'checkout.state':       'Estado',
            'checkout.postalCode':  'CEP',
            'checkout.country':     'País',
            'checkout.notes':       'Notas do pedido (opcional)',
            'checkout.summary':     'Resumo do pedido',
            'checkout.total':       'Total:',
            'checkout.pay':         'Pagar com MercadoPago',
            'checkout.processing':  'Processando...',

            'status.Pending':        'Pendente',
            'status.PendingPayment': 'Pagamento pendente',
            'status.Paid':           'Pago',
            'status.InProduction':   'Em produção',
            'status.Shipped':        'Enviado',
            'status.Delivered':      'Entregue',
            'status.Cancelled':      'Cancelado',
            'status.PaymentFailed':  'Pagamento falhou',

            'confirmation.successTitle':  'Pagamento realizado!',
            'confirmation.successMsg':    'Seu pedido foi recebido. Enviaremos uma confirmação por e-mail.',
            'confirmation.failureTitle':  'Pagamento falhou',
            'confirmation.failureMsg':    'Não conseguimos processar seu pagamento. Você pode tentar novamente.',
            'confirmation.pendingTitle':  'Pagamento pendente',
            'confirmation.pendingMsg':    'Seu pagamento está sendo processado. Notificaremos quando confirmado.',
            'confirmation.orderId':       'Pedido #',
            'confirmation.total':         'Total:',
            'confirmation.viewOrders':    'Ver meus pedidos',
            'confirmation.keepShopping':  'Continuar comprando',
            'confirmation.retry':         'Tentar novamente',

            'account.title':     'Minha conta',
            'account.profile':   'Perfil',
            'account.addresses': 'Endereços',
            'account.orders':    'Meus pedidos',
            'account.phone':     'Telefone',
            'account.save':      'Salvar alterações',
            'account.delete':    'Excluir',
            'account.noOrders':  'Você ainda não tem pedidos.',
            'account.orderDate': 'Data',
            'account.orderTotal':'Total',
            'account.orderStatus':'Status',

            'hero.shopNow':        'Explorar Produtos',
            'nav.store':           'Loja',
            'gallery.viewAll':     'Ver todos os produtos →',
            'service.viewProducts':'Ver produtos',
            'add_to_cart':         'Adicionar ao carrinho',

            // Toast / notification keys
            'toast.added':           'Adicionado ao carrinho',
            'toast.removed':         'Item removido',
            'toast.profileSaved':    '✓ Perfil atualizado',
            'toast.linkCopied':      'Link copiado!',
            'toast.invoiceSoon':     'Faturas em breve',
            'toast.couponApplied':   'Código aplicado — desconto em breve',
            'toast.cartEmpty':       'Seu carrinho está vazio. Adicione produtos primeiro.',
            'toast.reorderSkipped':  'Alguns produtos não estão disponíveis e foram ignorados',

            // Mini Cart keys
            'cart.continueShopping': 'Continuar comprando',
            'cart.designWarn':       '⚠ Envie seu design',
            'cart.emptyTitle':       'Seu carrinho está vazio',
            'cart.emptyAction':      'Ver produtos',
            'trust.secure':          'Pagamento seguro',
            'trust.quality':         'Produção garantida',
            'trust.support':         'Suporte 24/7',
            'trust.ssl':             'Dados protegidos',

            // Checkout enhancement keys
            'checkout.progress.cart':      'Carrinho',
            'checkout.progress.shipping':  'Envio',
            'checkout.progress.payment':   'Pagamento',
            'checkout.addressQuestion':    'Para onde enviamos seu pedido?',
            'checkout.notesQuestion':      'Alguma nota para nós?',
            'checkout.payBtn':             'Pronto! Pagar com MercadoPago',
            'checkout.coupon':             'Código de desconto',
            'checkout.couponApply':        'Aplicar',
            'checkout.estimatedDelivery':  'Entrega estimada: 5–8 dias úteis',
            'checkout.guestBtn':           'Continuar como convidado',
            'checkout.returnPolicy':       'Política de devoluções',

            // Order Confirmation keys
            'confirmation.rewards':        'Você ganhou pontos por esta compra! 🎉 Em breve poderá trocá-los por descontos.',
            'confirmation.share':          'Compartilhe seu pedido!',
            'confirmation.shareBtn':       'Compartilhar no WhatsApp',
            'confirmation.copyLink':       'Copiar link',
            'confirmation.guestUpsell':    'Quer salvar seu pedido? Crie uma conta gratuita.',
            'confirmation.createAccount':  'Criar conta',

            // Account / Orders keys
            'account.logout':           'Sair',
            'account.reorder':          'Pedir novamente',
            'account.invoice':          'Baixar fatura',
            'account.searchOrders':     'Buscar por ID ou produto...',
            'account.filterAll':        'Todos',
            'account.filterActive':     'Ativos',
            'account.filterDone':       'Concluídos',
            'account.noOrdersTitle':    'Ainda sem pedidos — comece a comprar!',
            'account.noOrdersFilter':   'Nenhum pedido encontrado para esse critério',
            'account.noOrdersCta':      'Ver produtos',
            'account.estimatedDelivery':'Entrega estimada:',
            'account.addAddress':       'Adicionar endereço',
            'account.defaultBadge':     'Padrão',
            'timeline.paid':            'Pago',
            'timeline.inProduction':    'Em produção',
            'timeline.shipped':         'Enviado',
            'timeline.delivered':       'Entregue',

            // WhatsApp FAB, Promo Banner, Search keys
            'whatsapp.ariaLabel':  'Contatar pelo WhatsApp',
            'promo.message':       '🚀 Frete grátis em pedidos acima de $999 MXN! Use o código FILA999',
            'promo.close':         'Fechar banner',
            'search.noResults':    'Nenhum resultado para',
            'search.didYouMean':   'Você quis dizer',
            'search.viewAll':      'Ver todos os produtos',

            // Product Modal enhancement keys
            'modal.socialProof':   'pessoas pediram isso este mês',
            'modal.urgency':       'Restam apenas',
            'modal.urgencyEnd':    'em estoque!',
            'modal.share':         'Compartilhar',
            'modal.helpSection':   'Precisa de ajuda?',
            'modal.relatedTitle':  'Clientes também compraram',
            'modal.specsTitle':    'Especificações técnicas',
            'modal.returnPolicy':  'Política de devoluções',
            'design.title':        'Envie seu design aqui',
            'design.sub':          'Arraste sua imagem ou clique para selecionar',
            'design.formats':      'PNG, JPG, SVG, PDF · Máx. 20 MB',
            'design.advisory':     'Lembre-se de enviar seu design antes de finalizar a compra',
            'design.errorSize':    'O arquivo excede o limite de 20 MB.',
            'design.errorType':    'Formato não suportado. Use PNG, JPG, SVG ou PDF.',

            // Brand Story and Reviews keys
            'brandStory.title':    'Suas Ideias. Sua Realidade.',
            'brandStory.learnMore':'Conheça nossa história →',
            'reviews.title':       'O que nossos clientes dizem',
        },

        // ── Japanese (JA) ────────────────────────────────────────────────────
        ja: {
            'auth.login':        'ログイン',
            'auth.register':     '新規登録',
            'auth.loginBtn':     'ログイン',
            'auth.registerBtn':  'アカウント作成',
            'auth.email':        'メールアドレス',
            'auth.password':     'パスワード',
            'auth.firstName':    '名',
            'auth.lastName':     '姓',
            'auth.passwordHint': '8文字以上、大文字1文字・数字1文字を含む',
            'auth.forgot':       'パスワードをお忘れですか？',
            'auth.forgotDesc':   'メールアドレスを入力してください。パスワード再設定リンクをお送りします。',
            'auth.sendReset':    'リンクを送信',
            'auth.backToLogin':  '← ログインに戻る',
            'auth.logout':       'ログアウト',

            'cart.title':        'カート',
            'cart.empty':        'カートは空です。',
            'cart.total':        '合計：',
            'cart.checkout':     'レジに進む',
            'cart.remove':       '削除',
            'cart.uploadDesign': 'デザインをアップロード',
            'cart.qty':          '数量',
            'cart.item':         '点',
            'cart.items':        '点',

            'checkout.title':       '注文手続き',
            'checkout.shipping':    '配送先住所',
            'checkout.addAddress':  '＋ 新しい住所を追加',
            'checkout.saveAddress': '住所を保存',
            'checkout.street':      '番地・建物名',
            'checkout.city':        '市区町村',
            'checkout.state':       '都道府県',
            'checkout.postalCode':  '郵便番号',
            'checkout.country':     '国',
            'checkout.notes':       '注文メモ（任意）',
            'checkout.summary':     '注文内容',
            'checkout.total':       '合計：',
            'checkout.pay':         'MercadoPagoで支払う',
            'checkout.processing':  '処理中...',

            'status.Pending':        '保留中',
            'status.PendingPayment': '支払い待ち',
            'status.Paid':           '支払い済み',
            'status.InProduction':   '製造中',
            'status.Shipped':        '発送済み',
            'status.Delivered':      '配達済み',
            'status.Cancelled':      'キャンセル',
            'status.PaymentFailed':  '支払い失敗',

            'confirmation.successTitle':  'お支払い完了！',
            'confirmation.successMsg':    'ご注文を受け付けました。確認メールをお送りします。',
            'confirmation.failureTitle':  'お支払い失敗',
            'confirmation.failureMsg':    '決済を処理できませんでした。もう一度お試しください。',
            'confirmation.pendingTitle':  'お支払い処理中',
            'confirmation.pendingMsg':    '決済を処理しています。確認後にご連絡します。',
            'confirmation.orderId':       '注文番号 #',
            'confirmation.total':         '合計：',
            'confirmation.viewOrders':    '注文履歴を見る',
            'confirmation.keepShopping':  'ショッピングを続ける',
            'confirmation.retry':         '再度お支払い',

            'account.title':     'マイアカウント',
            'account.profile':   'プロフィール',
            'account.addresses': '住所',
            'account.orders':    '注文履歴',
            'account.phone':     '電話番号',
            'account.save':      '変更を保存',
            'account.delete':    '削除',
            'account.noOrders':  'まだ注文はありません。',
            'account.orderDate': '日付',
            'account.orderTotal':'合計',
            'account.orderStatus':'ステータス',

            'hero.shopNow':        '製品を探す',
            'nav.store':           'ストア',
            'gallery.viewAll':     'すべての商品を見る →',
            'service.viewProducts':'商品を見る',
            'add_to_cart':         'カートに追加',

            // Toast / notification keys
            'toast.added':           'カートに追加しました',
            'toast.removed':         'アイテムを削除しました',
            'toast.profileSaved':    '✓ プロフィールを更新しました',
            'toast.linkCopied':      'リンクをコピーしました！',
            'toast.invoiceSoon':     '請求書は近日公開予定',
            'toast.couponApplied':   'コード適用済み — 割引は近日公開',
            'toast.cartEmpty':       'カートが空です。先に商品を追加してください。',
            'toast.reorderSkipped':  '一部の商品は利用できないためスキップされました',

            // Mini Cart keys
            'cart.continueShopping': 'ショッピングを続ける',
            'cart.designWarn':       '⚠ デザインをアップロード',
            'cart.emptyTitle':       'カートは空です',
            'cart.emptyAction':      '商品を見る',
            'trust.secure':          '安全な支払い',
            'trust.quality':         '品質保証',
            'trust.support':         '24時間サポート',
            'trust.ssl':             'データ保護',

            // Checkout enhancement keys
            'checkout.progress.cart':      'カート',
            'checkout.progress.shipping':  '配送',
            'checkout.progress.payment':   '支払い',
            'checkout.addressQuestion':    'どこにお届けしますか？',
            'checkout.notesQuestion':      '何かご要望はありますか？',
            'checkout.payBtn':             '準備完了！MercadoPagoで支払う',
            'checkout.coupon':             '割引コード',
            'checkout.couponApply':        '適用',
            'checkout.estimatedDelivery':  '配達予定：5〜8営業日',
            'checkout.guestBtn':           'ゲストとして続ける',
            'checkout.returnPolicy':       '返品ポリシー',

            // Order Confirmation keys
            'confirmation.rewards':        'このご購入でポイントを獲得しました！🎉 近日中に割引と交換できます。',
            'confirmation.share':          '注文をシェアしよう！',
            'confirmation.shareBtn':       'WhatsAppでシェア',
            'confirmation.copyLink':       'リンクをコピー',
            'confirmation.guestUpsell':    '注文を保存しますか？無料アカウントを作成してください。',
            'confirmation.createAccount':  'アカウント作成',

            // Account / Orders keys
            'account.logout':           'ログアウト',
            'account.reorder':          '再注文',
            'account.invoice':          '請求書をダウンロード',
            'account.searchOrders':     'IDまたは商品で検索...',
            'account.filterAll':        'すべて',
            'account.filterActive':     'アクティブ',
            'account.filterDone':       '完了',
            'account.noOrdersTitle':    'まだ注文はありません — 買い物を始めましょう！',
            'account.noOrdersFilter':   'その条件に一致する注文が見つかりません',
            'account.noOrdersCta':      '商品を見る',
            'account.estimatedDelivery':'配達予定：',
            'account.addAddress':       '住所を追加',
            'account.defaultBadge':     'デフォルト',
            'timeline.paid':            '支払い済み',
            'timeline.inProduction':    '製造中',
            'timeline.shipped':         '発送済み',
            'timeline.delivered':       '配達済み',

            // WhatsApp FAB, Promo Banner, Search keys
            'whatsapp.ariaLabel':  'WhatsAppで連絡する',
            'promo.message':       '🚀 $999 MXN以上のご注文で送料無料！コード: FILA999',
            'promo.close':         'バナーを閉じる',
            'search.noResults':    '検索結果が見つかりません：',
            'search.didYouMean':   'もしかして：',
            'search.viewAll':      'すべての商品を見る',

            // Product Modal enhancement keys
            'modal.socialProof':   '人が今月これを注文しました',
            'modal.urgency':       '残りわずか',
            'modal.urgencyEnd':    '在庫！',
            'modal.share':         'シェア',
            'modal.helpSection':   'お困りですか？',
            'modal.relatedTitle':  '他のお客様はこちらも購入',
            'modal.specsTitle':    '技術仕様',
            'modal.returnPolicy':  '返品ポリシー',
            'design.title':        'デザインをここにアップロード',
            'design.sub':          '画像をドラッグするかクリックして選択',
            'design.formats':      'PNG, JPG, SVG, PDF · 最大20MB',
            'design.advisory':     '購入を完了する前にデザインをアップロードしてください',
            'design.errorSize':    'ファイルが20MBの制限を超えています。',
            'design.errorType':    'サポートされていない形式です。PNG、JPG、SVG、PDFを使用してください。',

            // Brand Story and Reviews keys
            'brandStory.title':    'あなたのアイデア。あなたの現実。',
            'brandStory.learnMore':'私たちのストーリー →',
            'reviews.title':       'お客様の声',
        },

        // ── Chinese (ZH) ─────────────────────────────────────────────────────
        zh: {
            'auth.login':        '登录',
            'auth.register':     '注册',
            'auth.loginBtn':     '登录',
            'auth.registerBtn':  '创建账户',
            'auth.email':        '电子邮件地址',
            'auth.password':     '密码',
            'auth.firstName':    '名字',
            'auth.lastName':     '姓氏',
            'auth.passwordHint': '至少8个字符，包含1个大写字母和1个数字',
            'auth.forgot':       '忘记密码？',
            'auth.forgotDesc':   '输入您的邮箱，我们将发送重置密码链接。',
            'auth.sendReset':    '发送链接',
            'auth.backToLogin':  '← 返回登录',
            'auth.logout':       '退出登录',

            'cart.title':        '购物车',
            'cart.empty':        '您的购物车是空的。',
            'cart.total':        '合计：',
            'cart.checkout':     '去结账',
            'cart.remove':       '删除',
            'cart.uploadDesign': '上传设计',
            'cart.qty':          '数量',
            'cart.item':         '件',
            'cart.items':        '件',

            'checkout.title':       '结账',
            'checkout.shipping':    '收货地址',
            'checkout.addAddress':  '＋ 添加新地址',
            'checkout.saveAddress': '保存地址',
            'checkout.street':      '街道和门牌号',
            'checkout.city':        '城市',
            'checkout.state':       '省/州',
            'checkout.postalCode':  '邮政编码',
            'checkout.country':     '国家',
            'checkout.notes':       '订单备注（可选）',
            'checkout.summary':     '订单摘要',
            'checkout.total':       '合计：',
            'checkout.pay':         '通过MercadoPago支付',
            'checkout.processing':  '处理中...',

            'status.Pending':        '待处理',
            'status.PendingPayment': '待付款',
            'status.Paid':           '已付款',
            'status.InProduction':   '生产中',
            'status.Shipped':        '已发货',
            'status.Delivered':      '已送达',
            'status.Cancelled':      '已取消',
            'status.PaymentFailed':  '付款失败',

            'confirmation.successTitle':  '付款成功！',
            'confirmation.successMsg':    '您的订单已收到。我们将发送确认邮件。',
            'confirmation.failureTitle':  '付款失败',
            'confirmation.failureMsg':    '我们无法处理您的付款，请重试。',
            'confirmation.pendingTitle':  '付款处理中',
            'confirmation.pendingMsg':    '您的付款正在处理中，确认后我们将通知您。',
            'confirmation.orderId':       '订单 #',
            'confirmation.total':         '合计：',
            'confirmation.viewOrders':    '查看我的订单',
            'confirmation.keepShopping':  '继续购物',
            'confirmation.retry':         '重试付款',

            'account.title':     '我的账户',
            'account.profile':   '个人资料',
            'account.addresses': '地址',
            'account.orders':    '我的订单',
            'account.phone':     '电话',
            'account.save':      '保存更改',
            'account.delete':    '删除',
            'account.noOrders':  '您还没有订单。',
            'account.orderDate': '日期',
            'account.orderTotal':'合计',
            'account.orderStatus':'状态',

            'hero.shopNow':        '探索产品',
            'nav.store':           '商店',
            'gallery.viewAll':     '查看所有产品 →',
            'service.viewProducts':'查看产品',
            'add_to_cart':         '加入购物车',

            // Toast / notification keys
            'toast.added':           '已加入购物车',
            'toast.removed':         '商品已删除',
            'toast.profileSaved':    '✓ 个人资料已更新',
            'toast.linkCopied':      '链接已复制！',
            'toast.invoiceSoon':     '发票即将推出',
            'toast.couponApplied':   '代码已应用 — 折扣即将推出',
            'toast.cartEmpty':       '您的购物车是空的，请先添加商品。',
            'toast.reorderSkipped':  '部分商品不可用，已跳过',

            // Mini Cart keys
            'cart.continueShopping': '继续购物',
            'cart.designWarn':       '⚠ 上传您的设计',
            'cart.emptyTitle':       '您的购物车是空的',
            'cart.emptyAction':      '查看产品',
            'trust.secure':          '安全支付',
            'trust.quality':         '生产保证',
            'trust.support':         '24/7支持',
            'trust.ssl':             '数据保护',

            // Checkout enhancement keys
            'checkout.progress.cart':      '购物车',
            'checkout.progress.shipping':  '配送',
            'checkout.progress.payment':   '支付',
            'checkout.addressQuestion':    '我们应该将您的订单发送到哪里？',
            'checkout.notesQuestion':      '有什么备注吗？',
            'checkout.payBtn':             '准备好了！通过MercadoPago支付',
            'checkout.coupon':             '折扣码',
            'checkout.couponApply':        '应用',
            'checkout.estimatedDelivery':  '预计送达：5-8个工作日',
            'checkout.guestBtn':           '以访客身份继续',
            'checkout.returnPolicy':       '退货政策',

            // Order Confirmation keys
            'confirmation.rewards':        '您通过此次购买获得了积分！🎉 即将可以兑换折扣。',
            'confirmation.share':          '分享您的订单！',
            'confirmation.shareBtn':       '在WhatsApp上分享',
            'confirmation.copyLink':       '复制链接',
            'confirmation.guestUpsell':    '想保存您的订单吗？创建免费账户。',
            'confirmation.createAccount':  '创建账户',

            // Account / Orders keys
            'account.logout':           '退出登录',
            'account.reorder':          '重新订购',
            'account.invoice':          '下载发票',
            'account.searchOrders':     '按ID或产品搜索...',
            'account.filterAll':        '全部',
            'account.filterActive':     '活跃',
            'account.filterDone':       '已完成',
            'account.noOrdersTitle':    '还没有订单 — 开始购物吧！',
            'account.noOrdersFilter':   '未找到符合该条件的订单',
            'account.noOrdersCta':      '查看产品',
            'account.estimatedDelivery':'预计送达：',
            'account.addAddress':       '添加地址',
            'account.defaultBadge':     '默认',
            'timeline.paid':            '已付款',
            'timeline.inProduction':    '生产中',
            'timeline.shipped':         '已发货',
            'timeline.delivered':       '已送达',

            // WhatsApp FAB, Promo Banner, Search keys
            'whatsapp.ariaLabel':  '通过WhatsApp联系',
            'promo.message':       '🚀 订单满$999 MXN免运费！使用代码FILA999',
            'promo.close':         '关闭横幅',
            'search.noResults':    '未找到结果：',
            'search.didYouMean':   '您是否想搜索：',
            'search.viewAll':      '查看所有产品',

            // Product Modal enhancement keys
            'modal.socialProof':   '人本月订购了此商品',
            'modal.urgency':       '仅剩',
            'modal.urgencyEnd':    '件库存！',
            'modal.share':         '分享',
            'modal.helpSection':   '需要帮助？',
            'modal.relatedTitle':  '客户还购买了',
            'modal.specsTitle':    '技术规格',
            'modal.returnPolicy':  '退货政策',
            'design.title':        '在此上传您的设计',
            'design.sub':          '拖动图片或点击选择',
            'design.formats':      'PNG, JPG, SVG, PDF · 最大20MB',
            'design.advisory':     '请在完成购买前上传您的设计',
            'design.errorSize':    '文件超过20MB限制。',
            'design.errorType':    '不支持的格式，请使用PNG、JPG、SVG或PDF。',

            // Brand Story and Reviews keys
            'brandStory.title':    '您的创意。您的现实。',
            'brandStory.learnMore':'了解我们的故事 →',
            'reviews.title':       '客户评价',
        },
    };

    // ─────────────────────────────────────────────────────────────────────────
    // 2. API error type URI → localized message map (all 6 languages)
    // ─────────────────────────────────────────────────────────────────────────

    var errorMessages = {
        es: {
            'validation-failed':   'Los datos enviados no son válidos.',
            'duplicate-email':     'Este correo electrónico ya está registrado.',
            'invalid-credentials': 'Correo o contraseña incorrectos.',
            'token-expired':       'Tu sesión ha expirado. Por favor inicia sesión de nuevo.',
            'cart-empty':          'Tu carrito está vacío.',
            'product-unavailable': 'Este producto no está disponible en este momento.',
            'order-not-found':     'No se encontró el pedido.',
            'payment-failed':      'El pago no pudo procesarse. Por favor intenta de nuevo.',
            'file-too-large':      'El archivo es demasiado grande. El tamaño máximo es 20 MB.',
            'invalid-file-type':   'Tipo de archivo no permitido. Se aceptan PNG, JPG, SVG y PDF.',
            'unauthorized':        'Debes iniciar sesión para continuar.',
            'forbidden':           'No tienes permiso para realizar esta acción.',
            'rate-limit-exceeded': 'Demasiados intentos. Por favor espera un momento e intenta de nuevo.',
            'server-error':        'Ocurrió un error en el servidor. Por favor intenta más tarde.',
        },
        en: {
            'validation-failed':   'The submitted data is not valid.',
            'duplicate-email':     'This email address is already registered.',
            'invalid-credentials': 'Incorrect email or password.',
            'token-expired':       'Your session has expired. Please log in again.',
            'cart-empty':          'Your cart is empty.',
            'product-unavailable': 'This product is not available at this time.',
            'order-not-found':     'Order not found.',
            'payment-failed':      'Payment could not be processed. Please try again.',
            'file-too-large':      'File is too large. Maximum size is 20 MB.',
            'invalid-file-type':   'File type not allowed. PNG, JPG, SVG, and PDF are accepted.',
            'unauthorized':        'You must be logged in to continue.',
            'forbidden':           'You do not have permission to perform this action.',
            'rate-limit-exceeded': 'Too many attempts. Please wait a moment and try again.',
            'server-error':        'A server error occurred. Please try again later.',
        },
        de: {
            'validation-failed':   'Die übermittelten Daten sind ungültig.',
            'duplicate-email':     'Diese E-Mail-Adresse ist bereits registriert.',
            'invalid-credentials': 'Falsche E-Mail oder falsches Passwort.',
            'token-expired':       'Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.',
            'cart-empty':          'Ihr Warenkorb ist leer.',
            'product-unavailable': 'Dieses Produkt ist derzeit nicht verfügbar.',
            'order-not-found':     'Bestellung nicht gefunden.',
            'payment-failed':      'Die Zahlung konnte nicht verarbeitet werden. Bitte versuchen Sie es erneut.',
            'file-too-large':      'Die Datei ist zu groß. Maximale Größe ist 20 MB.',
            'invalid-file-type':   'Dateityp nicht erlaubt. PNG, JPG, SVG und PDF werden akzeptiert.',
            'unauthorized':        'Sie müssen angemeldet sein, um fortzufahren.',
            'forbidden':           'Sie haben keine Berechtigung, diese Aktion durchzuführen.',
            'rate-limit-exceeded': 'Zu viele Versuche. Bitte warten Sie einen Moment und versuchen Sie es erneut.',
            'server-error':        'Ein Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut.',
        },
        pt: {
            'validation-failed':   'Os dados enviados não são válidos.',
            'duplicate-email':     'Este endereço de e-mail já está registrado.',
            'invalid-credentials': 'E-mail ou senha incorretos.',
            'token-expired':       'Sua sessão expirou. Por favor, faça login novamente.',
            'cart-empty':          'Seu carrinho está vazio.',
            'product-unavailable': 'Este produto não está disponível no momento.',
            'order-not-found':     'Pedido não encontrado.',
            'payment-failed':      'O pagamento não pôde ser processado. Por favor, tente novamente.',
            'file-too-large':      'O arquivo é muito grande. O tamanho máximo é 20 MB.',
            'invalid-file-type':   'Tipo de arquivo não permitido. PNG, JPG, SVG e PDF são aceitos.',
            'unauthorized':        'Você precisa estar logado para continuar.',
            'forbidden':           'Você não tem permissão para realizar esta ação.',
            'rate-limit-exceeded': 'Muitas tentativas. Por favor, aguarde um momento e tente novamente.',
            'server-error':        'Ocorreu um erro no servidor. Por favor, tente novamente mais tarde.',
        },
        ja: {
            'validation-failed':   '送信されたデータが無効です。',
            'duplicate-email':     'このメールアドレスはすでに登録されています。',
            'invalid-credentials': 'メールアドレスまたはパスワードが正しくありません。',
            'token-expired':       'セッションの有効期限が切れました。再度ログインしてください。',
            'cart-empty':          'カートが空です。',
            'product-unavailable': 'この商品は現在ご利用いただけません。',
            'order-not-found':     '注文が見つかりません。',
            'payment-failed':      '支払いを処理できませんでした。もう一度お試しください。',
            'file-too-large':      'ファイルが大きすぎます。最大サイズは20MBです。',
            'invalid-file-type':   '許可されていないファイル形式です。PNG、JPG、SVG、PDFが使用できます。',
            'unauthorized':        '続行するにはログインが必要です。',
            'forbidden':           'このアクションを実行する権限がありません。',
            'rate-limit-exceeded': '試行回数が多すぎます。しばらく待ってから再度お試しください。',
            'server-error':        'サーバーエラーが発生しました。後でもう一度お試しください。',
        },
        zh: {
            'validation-failed':   '提交的数据无效。',
            'duplicate-email':     '该电子邮件地址已被注册。',
            'invalid-credentials': '电子邮件或密码不正确。',
            'token-expired':       '您的会话已过期，请重新登录。',
            'cart-empty':          '您的购物车是空的。',
            'product-unavailable': '该产品目前不可用。',
            'order-not-found':     '未找到订单。',
            'payment-failed':      '付款无法处理，请重试。',
            'file-too-large':      '文件太大，最大大小为20MB。',
            'invalid-file-type':   '不允许的文件类型，接受PNG、JPG、SVG和PDF。',
            'unauthorized':        '您需要登录才能继续。',
            'forbidden':           '您没有权限执行此操作。',
            'rate-limit-exceeded': '尝试次数过多，请稍等片刻后重试。',
            'server-error':        '服务器发生错误，请稍后重试。',
        },
    };

    // ─────────────────────────────────────────────────────────────────────────
    // 3. Public API
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * tError(typeUri) — translate an API error type URI to the current language.
     *
     * Accepts a full RFC 7807 type URI (e.g. "https://filamorfosis.com/errors/validation-failed")
     * or just the slug ("validation-failed").
     * Falls back to English, then to the raw typeUri if no translation is found.
     *
     * @param {string} typeUri  Full URI or slug, e.g. "validation-failed"
     * @returns {string}
     */
    function tError(typeUri) {
        // Extract slug from full URI (take the last path segment)
        var slug = typeUri ? typeUri.replace(/^.*\//, '') : typeUri;
        var lang = localStorage.getItem('preferredLanguage') || window.currentLang || 'es';
        var map  = errorMessages[lang] || errorMessages['es'];
        return map[slug] || (errorMessages['en'] || {})[slug] || typeUri;
    }

    window.StoreI18n = {
        keys:          storeKeys,
        errorMessages: errorMessages,
        tError:        tError,
    };

    // ─────────────────────────────────────────────────────────────────────────
    // 4. Merge into global translations and apply
    // ─────────────────────────────────────────────────────────────────────────

    function mergeAndApply() {
        var langs = Object.keys(storeKeys);

        // Merge store keys into window.translations (set by main.js)
        if (window.translations) {
            langs.forEach(function (lang) {
                if (!window.translations[lang]) {
                    window.translations[lang] = {};
                }
                var src = storeKeys[lang];
                for (var k in src) {
                    if (Object.prototype.hasOwnProperty.call(src, k)) {
                        window.translations[lang][k] = src[k];
                    }
                }
            });

            // Re-apply the active language so newly merged keys render immediately
            if (typeof window.switchLanguage === 'function') {
                var activeLang = localStorage.getItem('preferredLanguage') || window.currentLang || 'es';
                window.switchLanguage(activeLang);
                return; // switchLanguage already handles [data-t] elements
            }
        }

        // Fallback: pages without main.js — apply [data-t] directly
        applyDataT();
    }

    /**
     * Apply [data-t] translations directly (for pages that don't load main.js).
     */
    function applyDataT() {
        var lang = localStorage.getItem('preferredLanguage') || 'es';
        var tl   = storeKeys[lang] || storeKeys['es'];

        document.querySelectorAll('[data-t]').forEach(function (el) {
            var key = el.getAttribute('data-t');
            var val = tl[key];
            if (val === undefined) return;
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = val;
            } else {
                el.textContent = val;
            }
        });
    }

    // Run after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mergeAndApply);
    } else {
        mergeAndApply();
    }

}());
