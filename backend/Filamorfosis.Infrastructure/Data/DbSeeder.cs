using Filamorfosis.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Filamorfosis.Infrastructure.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(FilamorfosisDbContext db, UserManager<User> userManager, RoleManager<IdentityRole<Guid>> roleManager)
    {
        // Apply any pending migrations (creates schema on first run, applies new migrations on updates).
        // In-memory databases used by tests don't support migrations — EnsureCreated handles those.
        if (db.Database.IsRelational())
            await db.Database.MigrateAsync();
        else
            await db.Database.EnsureCreatedAsync();

        // ── Migrate legacy 'Admin' role to 'Master' ───────────────────────────
        var adminRole = await roleManager.FindByNameAsync("Admin");
        if (adminRole is not null)
        {
            var adminUsers = await userManager.GetUsersInRoleAsync("Admin");
            foreach (var u in adminUsers)
            {
                await userManager.RemoveFromRoleAsync(u, "Admin");
                if (!await roleManager.RoleExistsAsync("Master"))
                    await roleManager.CreateAsync(new IdentityRole<Guid>("Master"));
                await userManager.AddToRoleAsync(u, "Master");
            }
            await roleManager.DeleteAsync(adminRole);
        }

        // Seed roles
        if (!await roleManager.RoleExistsAsync("Master"))
            await roleManager.CreateAsync(new IdentityRole<Guid>("Master"));
        if (!await roleManager.RoleExistsAsync("UserManagement"))
            await roleManager.CreateAsync(new IdentityRole<Guid>("UserManagement"));
        if (!await roleManager.RoleExistsAsync("ProductManagement"))
            await roleManager.CreateAsync(new IdentityRole<Guid>("ProductManagement"));
        if (!await roleManager.RoleExistsAsync("OrderManagement"))
            await roleManager.CreateAsync(new IdentityRole<Guid>("OrderManagement"));
        if (!await roleManager.RoleExistsAsync("PriceManagement"))
            await roleManager.CreateAsync(new IdentityRole<Guid>("PriceManagement"));
        if (!await roleManager.RoleExistsAsync("Customer"))
            await roleManager.CreateAsync(new IdentityRole<Guid>("Customer"));

        // Seed default admin user if none exists
        const string adminEmail = "admin@filamorfosis.com";
        if (await userManager.FindByEmailAsync(adminEmail) is null)
        {
            var admin = new User
            {
                UserName       = adminEmail,
                Email          = adminEmail,
                FirstName      = "Admin",
                LastName       = "Filamorfosis",
                CreatedAt      = DateTime.UtcNow,
                EmailConfirmed = true
            };
            await userManager.CreateAsync(admin, "Admin1234!");
            await userManager.AddToRoleAsync(admin, "Master");

            // Seed a pre-confirmed MFA secret for the dev admin so the admin panel
            // is accessible without going through TOTP enrollment.
            // Secret: JBSWY3DPEHPK3PXP (base32) — add to any authenticator app if needed.
            // In production this is never seeded; real users enroll via the UI.
            var seededAdmin = await userManager.FindByEmailAsync(adminEmail);
            if (seededAdmin is not null && !await db.AdminMfaSecrets.AnyAsync(m => m.UserId == seededAdmin.Id))
            {
                db.AdminMfaSecrets.Add(new AdminMfaSecret
                {
                    Id = Guid.NewGuid(),
                    UserId = seededAdmin.Id,
                    SecretBase32 = "JBSWY3DPEHPK3PXP",
                    IsConfirmed = true,
                    CreatedAt = DateTime.UtcNow
                });
                await db.SaveChangesAsync();
            }
        }

        // Ensure the dev admin always has a confirmed MFA secret (idempotent patch for existing DBs).
        // This runs even if the user was already seeded in a previous run without an MFA secret.
        var existingAdmin = await userManager.FindByEmailAsync(adminEmail);
        if (existingAdmin is not null && !await db.AdminMfaSecrets.AnyAsync(m => m.UserId == existingAdmin.Id))
        {
            db.AdminMfaSecrets.Add(new AdminMfaSecret
            {
                Id = Guid.NewGuid(),
                UserId = existingAdmin.Id,
                SecretBase32 = "JBSWY3DPEHPK3PXP",
                IsConfirmed = true,
                CreatedAt = DateTime.UtcNow
            });
            await db.SaveChangesAsync();
        }

        // Seed processes if none exist
        if (!await db.Processes.AnyAsync())
        {
            var processes = new[]
            {
                new Process { Id = Guid.NewGuid(), Slug = "uv-printing",    NameEs = "Impresión UV",       NameEn = "UV Printing" },
                new Process { Id = Guid.NewGuid(), Slug = "3d-printing",    NameEs = "Impresión 3D",       NameEn = "3D Printing" },
                new Process { Id = Guid.NewGuid(), Slug = "laser-cutting",  NameEs = "Corte Láser",        NameEn = "Laser Cutting" },
                new Process { Id = Guid.NewGuid(), Slug = "photo-printing", NameEs = "Impresión de Fotos", NameEn = "Photo Printing" },
                new Process { Id = Guid.NewGuid(), Slug = "material",       NameEs = "Material",           NameEn = "Material" }
            };
            db.Processes.AddRange(processes);
            await db.SaveChangesAsync();

            // Seed Material process attributes
            var materialProcess = processes[4]; // "material" is index 4
            var materials = new[] {
                "Vidrio", "Madera", "Cerámica", "Metal", "Cuero",
                "Acrílico", "Tela", "Plástico", "Papel", "Piedra",
                "Bambú", "Corcho", "Aluminio", "Acero Inoxidable", "Cobre"
            };
            db.ProcessesAttributes.AddRange(materials.Select(m => new ProcessAttribute
            {
                Id = Guid.NewGuid(),
                ProcessId = materialProcess.Id,
                AttributeType = "Type",
                Value = m
            }));
            await db.SaveChangesAsync();

            // Seed one legacy product
            var uvProcess = processes[0];
            var product = new Product
            {
                Id            = Guid.NewGuid(),
                ProcessId    = uvProcess.Id,
                Slug          = "taza-personalizada-uv",
                TitleEs       = "Taza Personalizada UV",
                TitleEn       = "Custom UV Mug",
                DescriptionEs = "Impresión UV directa sobre taza de cerámica.",
                DescriptionEn = "Direct UV printing on ceramic mug.",
                Tags          = ["taza", "uv", "personalizado"],
                ImageUrls     = [],
                IsActive      = true,
                CreatedAt     = DateTime.UtcNow
            };
            db.Products.Add(product);
            await db.SaveChangesAsync();

            db.ProductVariants.AddRange(
                new ProductVariant
                {
                    Id = Guid.NewGuid(), ProductId = product.Id,
                    Sku = "UV-MUG-SM", LabelEs = "Taza Pequeña 300ml", LabelEn = "Small Mug 300ml",
                    Price = 199.00m, IsAvailable = true, AcceptsDesignFile = true, StockQuantity = 50
                },
                new ProductVariant
                {
                    Id = Guid.NewGuid(), ProductId = product.Id,
                    Sku = "UV-MUG-LG", LabelEs = "Taza Grande 450ml", LabelEn = "Large Mug 450ml",
                    Price = 249.00m, IsAvailable = true, AcceptsDesignFile = true, StockQuantity = 30
                }
            );
            await db.SaveChangesAsync();
        }

        // Seed all UV and laser-engraving products
        await SeedProductsAsync(db);
    }

    // ── Price parsing helper ─────────────────────────────────────────────────

    private static (decimal price, bool isAvailable) ParsePrice(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw) ||
            raw.Equals("Cotizar", StringComparison.OrdinalIgnoreCase) ||
            raw.Equals("N/A", StringComparison.OrdinalIgnoreCase))
            return (0m, false);

        var cleaned = raw.Replace("$", "").Replace(",", "").Trim();
        if (decimal.TryParse(cleaned, System.Globalization.NumberStyles.Any,
                System.Globalization.CultureInfo.InvariantCulture, out var value))
            return (value, true);

        return (0m, false);
    }

    // ── Product seed record ──────────────────────────────────────────────────

    public record PricingRow(string Variant, string Flat, string Relief);

    public record ProductDef(
        string Slug,
        string CategorySlug,
        string? Badge,
        string Title,
        string Desc,
        string[] Tags,
        string[] Images,
        PricingRow[] Rows);

    // ── Main seed method ─────────────────────────────────────────────────────

    public static async Task SeedProductsAsync(FilamorfosisDbContext db)
    {
        var uvProcess     = await db.Processes.FirstOrDefaultAsync(c => c.Slug == "uv-printing");
        var laserProcess  = await db.Processes.FirstOrDefaultAsync(c => c.Slug == "laser-cutting");

        var products = BuildProductDefinitions();

        foreach (var def in products)
        {
            // Skip if already seeded (idempotence)
            if (await db.Products.AnyAsync(p => p.Slug == def.Slug))
                continue;

            var processId = def.CategorySlug == "uv-printing"
                ? uvProcess?.Id
                : laserProcess?.Id;

            if (processId is null)
                continue; // process not found — skip

            var product = new Product
            {
                Id            = Guid.NewGuid(),
                ProcessId    = processId.Value,
                Slug          = def.Slug,
                TitleEs       = def.Title,
                TitleEn       = def.Title,
                DescriptionEs = def.Desc,
                DescriptionEn = def.Desc,
                Tags          = def.Tags,
                ImageUrls     = def.Images,
                Badge         = def.Badge,
                IsActive      = true,
                CreatedAt     = DateTime.UtcNow
            };
            db.Products.Add(product);
            await db.SaveChangesAsync();

            var variants = new List<ProductVariant>();
            for (int i = 0; i < def.Rows.Length; i++)
            {
                var row = def.Rows[i];
                var (flatPrice, flatAvail)     = ParsePrice(row.Flat);
                var (reliefPrice, reliefAvail) = ParsePrice(row.Relief);

                variants.Add(new ProductVariant
                {
                    Id                = Guid.NewGuid(),
                    ProductId         = product.Id,
                    Sku               = $"{def.Slug}-{i}-F",
                    LabelEs           = $"{row.Variant} — Flat",
                    LabelEn           = $"{row.Variant} — Flat",
                    Price             = flatPrice,
                    IsAvailable       = flatAvail,
                    AcceptsDesignFile = true
                });
                variants.Add(new ProductVariant
                {
                    Id                = Guid.NewGuid(),
                    ProductId         = product.Id,
                    Sku               = $"{def.Slug}-{i}-R",
                    LabelEs           = $"{row.Variant} — Relieve",
                    LabelEn           = $"{row.Variant} — Relief",
                    Price             = reliefPrice,
                    IsAvailable       = reliefAvail,
                    AcceptsDesignFile = true
                });
            }
            db.ProductVariants.AddRange(variants);
            await db.SaveChangesAsync();
        }
    }

    // ── Product definitions ──────────────────────────────────────────────────

    public static ProductDef[] BuildProductDefinitions() =>
    [
        // ── UV PRODUCTS ──────────────────────────────────────────────────────

        new("uv-coaster", "uv-printing", "hot",
            "Coasters Personalizados",
            "Posavasos con tu diseño, logo o foto en una variedad de materiales.",
            ["Vidrio","Madera","Corcho","Cerámica","Silicón","Plástico"],
            ["products/images/uv/uv-coaster-1.jpeg","products/images/uv/uv-coaster-2.jpeg"],
            [
                new("Vidrio (9cm)",       "$85",  "$110"),
                new("Vidrio (11cm)",      "$95",  "$125"),
                new("Madera (9cm)",       "$75",  "$100"),
                new("Madera (11cm)",      "$85",  "$115"),
                new("Corcho (9cm)",       "$70",  "$95"),
                new("Cerámica (9cm)",     "$90",  "$120"),
                new("Cerámica (11cm)",    "$105", "$135"),
                new("Silicón (9cm)",      "$80",  "$105"),
                new("Plástico ABS (9cm)", "$65",  "$90"),
            ]),

        new("uv-tumbler", "uv-printing", "hot",
            "Tumblers Personalizados",
            "Vasos térmicos de doble pared con impresión UV de alta resolución.",
            ["12oz","20oz","30oz","40oz","Acero inox","Tapa incluida"],
            ["products/images/uv/uv-tumbler-1.jpeg","products/images/uv/uv-tumbler-2.jpeg"],
            [
                new("12oz — Impresión parcial", "$120", "$155"),
                new("12oz — Impresión 360°",    "$160", "$200"),
                new("20oz — Impresión parcial", "$140", "$180"),
                new("20oz — Impresión 360°",    "$185", "$230"),
                new("30oz — Impresión parcial", "$165", "$210"),
                new("30oz — Impresión 360°",    "$215", "$265"),
                new("40oz — Impresión parcial", "$190", "$240"),
                new("40oz — Impresión 360°",    "$245", "$300"),
            ]),

        new("uv-mug", "uv-printing", "new",
            "Tazas Personalizadas",
            "Tazas de cerámica y acero con tu diseño, foto o logo.",
            ["11oz","15oz","20oz","Cerámica","Acero","Mágica"],
            ["products/images/uv/uv-mug-1.jpeg","products/images/uv/uv-mug-2.jpeg"],
            [
                new("11oz Cerámica — 1 lado",  "$95",  "$125"),
                new("11oz Cerámica — 2 lados", "$120", "$155"),
                new("15oz Cerámica — 1 lado",  "$110", "$145"),
                new("15oz Cerámica — 2 lados", "$140", "$180"),
                new("20oz Cerámica — 1 lado",  "$130", "$165"),
                new("11oz Acero — 360°",       "$145", "$185"),
                new("15oz Mágica — 1 lado",    "$135", "N/A"),
            ]),

        new("uv-sticker", "uv-printing", "hot",
            "Stickers UV DTF",
            "Calcomanías de alta resolución resistentes al agua, UV y rayones.",
            ["Resistente agua","Anti-UV","Cualquier superficie","Sin fondo"],
            ["products/images/uv/uv-sticker-1.jpeg"],
            [
                new("3×3cm",              "$18",    "$25"),
                new("5×5cm",              "$28",    "$38"),
                new("7×7cm",              "$40",    "$55"),
                new("10×10cm",            "$60",    "$80"),
                new("Forma personalizada","Cotizar","Cotizar"),
            ]),

        new("uv-magnet", "uv-printing", null,
            "Magnetos Personalizados",
            "Imanes para refrigerador con impresión UV de alta calidad.",
            ["Refrigerador","Souvenir","Branding","Varios tamaños"],
            ["products/images/uv/uv-magnet-1.jpeg"],
            [
                new("5×5cm",      "$45",    "$60"),
                new("7×5cm",      "$55",    "$72"),
                new("10×7cm",     "$70",    "$90"),
                new("Redondo 6cm","$50",    "$65"),
                new("Forma libre","Cotizar","Cotizar"),
            ]),

        new("uv-bottle", "uv-printing", "new",
            "Botellas de Agua",
            "Botellas de acero inoxidable o aluminio con impresión UV 360°.",
            ["500ml","750ml","1L","Acero","Aluminio","360°"],
            ["products/images/uv/uv-bottle-1.jpeg"],
            [
                new("500ml Aluminio — parcial", "$130", "$165"),
                new("500ml Aluminio — 360°",    "$170", "$210"),
                new("500ml Acero — parcial",    "$150", "$190"),
                new("500ml Acero — 360°",       "$195", "$240"),
                new("750ml Acero — 360°",       "$220", "$270"),
                new("1L Acero — 360°",          "$250", "$305"),
            ]),

        new("uv-phone-case", "uv-printing", null,
            "Fundas de Teléfono UV",
            "Fundas personalizadas con impresión UV directa.",
            ["iPhone","Samsung","Xiaomi","Transparente","Negra"],
            ["products/images/uv/uv-phone-case-1.jpeg"],
            [
                new("Funda transparente", "$150", "$190"),
                new("Funda negra",        "$150", "$190"),
                new("Funda mate",         "$165", "$205"),
                new("Funda con borde",    "$175", "$215"),
            ]),

        new("uv-wood-sign", "uv-printing", null,
            "Placas de Madera UV",
            "Placas de madera natural con impresión UV a todo color.",
            ["Pino","MDF","Bambú","Decoración","Señalética"],
            ["products/images/uv/uv-wood-sign-1.jpeg"],
            [
                new("10×15cm",     "$90",    "$120"),
                new("15×20cm",     "$120",   "$155"),
                new("20×30cm",     "$165",   "$210"),
                new("30×40cm",     "$230",   "$285"),
                new("Tamaño libre","Cotizar","Cotizar"),
            ]),

        new("uv-keychain", "uv-printing", "promo",
            "Llaveros UV",
            "Llaveros de acrílico, madera o metal con impresión UV.",
            ["Acrílico","Madera","Metal","Souvenir","Branding"],
            ["products/images/uv/uv-keychain-1.jpeg"],
            [
                new("Acrílico 5×3cm",     "$35",    "$48"),
                new("Madera 5×3cm",        "$38",    "$52"),
                new("Metal 5×3cm",         "$55",    "$72"),
                new("Forma personalizada", "Cotizar","Cotizar"),
            ]),

        new("uv-tile", "uv-printing", null,
            "Azulejos y Cerámicas UV",
            "Azulejos de cerámica con impresión UV fotorrealista.",
            ["Cerámica","10×10","15×15","20×20","Decoración"],
            ["products/images/uv/uv-tile-1.jpeg"],
            [
                new("10×10cm", "$80",  "$105"),
                new("15×15cm", "$110", "$140"),
                new("20×20cm", "$150", "$190"),
                new("20×30cm", "$195", "$245"),
            ]),

        new("uv-stained-glass", "uv-printing", "new",
            "Vidrio Emplomado UV",
            "Paneles de vidrio con impresión UV que imitan el efecto de vitral emplomado.",
            ["Vidrio","Translúcido","Decoración","Ventana","Arte"],
            [],
            [
                new("15×20cm",     "$180",   "$230"),
                new("20×30cm",     "$260",   "$320"),
                new("30×40cm",     "$380",   "$460"),
                new("40×60cm",     "$550",   "$660"),
                new("Tamaño libre","Cotizar","Cotizar"),
            ]),

        new("uv-metal-poster", "uv-printing", "hot",
            "Posters de Metal Personalizados",
            "Impresión UV directa sobre aluminio o acero.",
            ["Aluminio","Acero","Arte","Decoración","Señalética"],
            [],
            [
                new("20×30cm",     "$220",   "$280"),
                new("30×40cm",     "$320",   "$400"),
                new("40×60cm",     "$480",   "$590"),
                new("60×90cm",     "$750",   "$900"),
                new("Tamaño libre","Cotizar","Cotizar"),
            ]),

        new("uv-wood-frame", "uv-printing", null,
            "Cuadros en Marco de Madera",
            "Impresión UV sobre lienzo o madera con marco de madera natural incluido.",
            ["Marco","Madera","Lienzo","Arte","Retrato"],
            [],
            [
                new("13×18cm", "$180", "$230"),
                new("20×25cm", "$250", "$310"),
                new("30×40cm", "$380", "$460"),
                new("40×50cm", "$520", "$630"),
                new("50×70cm", "$720", "$860"),
            ]),

        new("uv-canvas", "uv-printing", null,
            "Impresión en Canvas",
            "Impresión UV sobre lienzo de alta calidad.",
            ["Lienzo","Arte","Foto","Decoración","Pared"],
            [],
            [
                new("20×30cm",  "$200", "$255"),
                new("30×40cm",  "$290", "$360"),
                new("40×60cm",  "$420", "$510"),
                new("60×80cm",  "$620", "$750"),
                new("80×120cm", "$950", "$1,150"),
            ]),

        new("uv-bottle-opener", "uv-printing", "promo",
            "Destapadores Personalizados",
            "Destapadores de metal o madera con impresión UV a todo color.",
            ["Metal","Madera","Boda","Bar","Regalo"],
            [],
            [
                new("Metal rectangular",  "$65", "$85"),
                new("Metal redondo",       "$70", "$90"),
                new("Madera rectangular",  "$55", "$72"),
                new("Llavero destapador",  "$75", "$95"),
            ]),

        new("uv-acrylic-art", "uv-printing", "new",
            "Arte en Acrílico",
            "Impresión UV sobre acrílico transparente o de color.",
            ["Acrílico","Transparente","Arte","Decoración","Premium"],
            [],
            [
                new("15×20cm",     "$210",   "$265"),
                new("20×30cm",     "$300",   "$375"),
                new("30×40cm",     "$440",   "$540"),
                new("40×60cm",     "$650",   "$790"),
                new("Tamaño libre","Cotizar","Cotizar"),
            ]),

        new("uv-tote-bag", "uv-printing", null,
            "Tote Bags Personalizadas",
            "Bolsas de tela con impresión UV a todo color.",
            ["Tela","Eco","Moda","Branding","Evento"],
            [],
            [
                new("Tote estándar 38×42cm", "$120", "$155"),
                new("Tote grande 42×48cm",   "$145", "$185"),
                new("Tote con bolsillo",     "$165", "$210"),
            ]),

        new("uv-business-card", "uv-printing", null,
            "Tarjetas de Presentación UV",
            "Tarjetas de presentación con impresión UV sobre acrílico, madera o metal.",
            ["Acrílico","Madera","Metal","Negocio","Premium"],
            [],
            [
                new("Acrílico transparente", "$28", "$38"),
                new("Acrílico negro",        "$28", "$38"),
                new("Madera",                "$32", "$42"),
                new("Aluminio cepillado",    "$45", "$58"),
            ]),

        new("uv-pet-tag", "uv-printing", null,
            "Accesorios para Mascotas",
            "Placas de identificación y accesorios personalizados para tu mascota.",
            ["Mascota","Perro","Gato","Placa","Llavero"],
            [],
            [
                new("Placa redonda 3cm",       "$55", "$72"),
                new("Placa ósea 4cm",          "$60", "$78"),
                new("Placa rectangular 4×3cm", "$58", "$75"),
                new("Llavero mascota",         "$65", "$85"),
            ]),

        new("uv-award", "uv-printing", null,
            "Trofeos y Reconocimientos",
            "Trofeos y placas de reconocimiento en acrílico con impresión UV.",
            ["Acrílico","Trofeo","Corporativo","Deportivo","Premio"],
            [],
            [
                new("Bloque 8×6×3cm",  "$180", "$230"),
                new("Bloque 10×8×4cm", "$240", "$300"),
                new("Placa 15×20cm",   "$200", "$255"),
                new("Trofeo con base", "$320", "$400"),
            ]),

        new("uv-nail-art", "uv-printing", "new",
            "Nail Art UV",
            "Uñas postizas con diseños UV de alta resolución.",
            ["Uñas","Moda","Arte","Postizas","Diseño"],
            [],
            [
                new("Set 10 — diseño simple",    "$120", "$160"),
                new("Set 10 — diseño detallado", "$160", "$210"),
                new("Set 10 — con textura",      "$200", "$260"),
            ]),

        new("uv-golf-ball", "uv-printing", null,
            "Pelotas de Golf Personalizadas",
            "Pelotas de golf con impresión UV directa.",
            ["Golf","Deporte","Regalo","Branding","Evento"],
            [],
            [
                new("1 lado — logo/texto",       "$85",  "$110"),
                new("2 lados — diseño completo", "$110", "$140"),
                new("Set 3 pelotas",             "$270", "$345"),
                new("Set 6 pelotas",             "$510", "$650"),
            ]),

        new("uv-luggage-tag", "uv-printing", null,
            "Etiquetas y Tags Personalizados",
            "Etiquetas de equipaje, marcadores de plantas y tags con código QR.",
            ["Equipaje","QR","Jardín","Viaje","Organización"],
            [],
            [
                new("Etiqueta equipaje acrílico", "$55", "$72"),
                new("Etiqueta equipaje metal",    "$70", "$90"),
                new("Marcador de planta",         "$35", "$48"),
                new("Tag QR empresarial",         "$65", "$85"),
            ]),

        new("uv-wedding", "uv-printing", null,
            "Papelería de Boda UV",
            "Papelería de boda con impresión UV sobre acrílico y madera.",
            ["Boda","Invitación","Acrílico","Lujo","Evento"],
            [],
            [
                new("Invitación acrílico A5", "$85",    "$110"),
                new("Invitación madera A5",   "$75",    "$98"),
                new("Menú de mesa",           "$55",    "$72"),
                new("Número de mesa",         "$45",    "$60"),
                new("Señalética boda",        "Cotizar","Cotizar"),
            ]),

        new("uv-jewelry", "uv-printing", "new",
            "Joyería Personalizada UV",
            "Aretes, colgantes y pulseras personalizados con impresión UV.",
            ["Aretes","Colgante","Moda","Acrílico","Regalo"],
            [],
            [
                new("Par de aretes",         "$95",  "$125"),
                new("Colgante simple",       "$80",  "$105"),
                new("Set aretes + colgante", "$160", "$210"),
                new("Pulsera acrílico",      "$90",  "$118"),
            ]),

        new("uv-skateboard", "uv-printing", null,
            "Tablas de Skate Personalizadas",
            "Tablas de skate y longboard con impresión UV.",
            ["Skate","Longboard","Deporte","Arte","Gráfico"],
            [],
            [
                new("Cara inferior", "$280", "$350"),
                new("Ambas caras",   "$420", "$520"),
                new("Solo grip tape","$150", "$195"),
                new("Longboard",     "$350", "$430"),
            ]),

        new("uv-challenge-coin", "uv-printing", null,
            "Monedas Conmemorativas",
            "Monedas de acrílico o metal con impresión UV.",
            ["Metal","Acrílico","Souvenir","Club","Evento"],
            [],
            [
                new("Acrílico 4cm", "$65",  "$85"),
                new("Acrílico 5cm", "$80",  "$105"),
                new("Metal 4cm",    "$95",  "$125"),
                new("Metal 5cm",    "$115", "$150"),
            ]),

        new("uv-poster", "uv-printing", null,
            "Posters UV Premium",
            "Posters con impresión UV sobre papel fotográfico o acrílico.",
            ["Papel","Acrílico","PVC","Arte","Señalética"],
            [],
            [
                new("A3 — papel fotográfico", "$85",  "$110"),
                new("A2 — papel fotográfico", "$130", "$165"),
                new("A1 — papel fotográfico", "$200", "$250"),
                new("A2 — acrílico",          "$280", "$350"),
                new("A1 — acrílico",          "$420", "$520"),
            ]),

        // ── LASER ENGRAVING PRODUCTS ─────────────────────────────────────────

        new("engrave-wood", "laser-cutting", "hot",
            "Grabado en Madera",
            "Grabado láser de alta precisión sobre madera natural, MDF y bambú.",
            ["Madera","MDF","Bambú","Personalizado","Regalo"],
            [],
            [
                new("10×15cm",     "$80",    "N/A"),
                new("15×20cm",     "$110",   "N/A"),
                new("20×30cm",     "$155",   "N/A"),
                new("30×40cm",     "$220",   "N/A"),
                new("Tamaño libre","Cotizar","N/A"),
            ]),

        new("engrave-metal", "laser-cutting", "new",
            "Grabado en Metal",
            "Grabado láser sobre acero inoxidable, aluminio y latón.",
            ["Acero","Aluminio","Latón","Trofeo","Corporativo"],
            [],
            [
                new("Placa 10×7cm",       "$120",   "N/A"),
                new("Placa 15×10cm",      "$170",   "N/A"),
                new("Placa 20×15cm",      "$240",   "N/A"),
                new("Llavero metal",      "$65",    "N/A"),
                new("Pieza personalizada","Cotizar","N/A"),
            ]),

        new("engrave-glass", "laser-cutting", null,
            "Grabado en Vidrio",
            "Grabado láser sobre vasos, botellas, espejos y cristal.",
            ["Vidrio","Vaso","Botella","Espejo","Branding"],
            [],
            [
                new("Vaso estándar",       "$90",    "N/A"),
                new("Vaso térmico",        "$110",   "N/A"),
                new("Botella de vino",     "$130",   "N/A"),
                new("Espejo decorativo",   "$150",   "N/A"),
                new("Pieza personalizada", "Cotizar","N/A"),
            ]),

        new("engrave-leather", "laser-cutting", null,
            "Grabado en Cuero",
            "Grabado láser sobre cuero genuino y sintético.",
            ["Cuero","Cartera","Cinturón","Agenda","Moda"],
            [],
            [
                new("Cartera/billetera",   "$95",    "N/A"),
                new("Cinturón",            "$110",   "N/A"),
                new("Agenda/libreta",      "$120",   "N/A"),
                new("Llavero cuero",       "$55",    "N/A"),
                new("Pieza personalizada", "Cotizar","N/A"),
            ]),

        new("engrave-acrylic", "laser-cutting", "new",
            "Grabado en Acrílico",
            "Grabado láser sobre acrílico transparente, de color o espejado.",
            ["Acrílico","Transparente","Espejado","Letrero","Display"],
            [],
            [
                new("10×15cm",     "$95",    "N/A"),
                new("15×20cm",     "$130",   "N/A"),
                new("20×30cm",     "$185",   "N/A"),
                new("30×40cm",     "$260",   "N/A"),
                new("Tamaño libre","Cotizar","N/A"),
            ]),

        new("engrave-stone", "laser-cutting", null,
            "Grabado en Piedra",
            "Grabado láser sobre pizarra, mármol y granito.",
            ["Pizarra","Mármol","Granito","Decoración","Memorial"],
            [],
            [
                new("Pizarra 10×15cm",       "$100",   "N/A"),
                new("Pizarra 20×30cm",       "$160",   "N/A"),
                new("Mármol 10×10cm",        "$140",   "N/A"),
                new("Granito personalizado", "Cotizar","N/A"),
            ]),
    ];
}
