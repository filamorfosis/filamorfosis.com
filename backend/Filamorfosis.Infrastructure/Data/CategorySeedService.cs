using Filamorfosis.Application.Services;
using Filamorfosis.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Filamorfosis.Infrastructure.Data;

/// <summary>
/// Seeds the initial product category structure (simplified two-level system).
/// Creates 8 root categories and their subcategories.
/// </summary>
public class CategorySeedService(FilamorfosisDbContext db, ISlugGenerationService slugService)
{
    /// <summary>
    /// Seeds all product categories with Spanish names, emoji icons, and proper hierarchy.
    /// Includes idempotency check to prevent duplicate seeding.
    /// </summary>
    public async Task SeedCategoriesAsync()
    {
        // Idempotency check: skip if categories already exist
        if (await db.ProductCategories.AnyAsync())
            return;

        // ── ROOT CATEGORIES ──────────────────────────────────────────────────

        var rootCategories = new List<ProductCategory>();

        // 1. Regalos Personalizados 🎁 (Personalized Gifts)
        var regalos = await CreateCategoryAsync(
            name: "Regalos Personalizados",
            icon: "🎁"
        );
        rootCategories.Add(regalos);

        // 2. Bodas & Eventos 💍 (Weddings & Events)
        var bodas = await CreateCategoryAsync(
            name: "Bodas & Eventos",
            icon: "💍"
        );
        rootCategories.Add(bodas);

        // 3. Negocios & Branding 🏢 (Business & Branding)
        var negocios = await CreateCategoryAsync(
            name: "Negocios & Branding",
            icon: "🏢"
        );
        rootCategories.Add(negocios);

        // 4. Hogar & Decoración 🏠 (Home & Decor)
        var hogar = await CreateCategoryAsync(
            name: "Hogar & Decoración",
            icon: "🏠"
        );
        rootCategories.Add(hogar);

        // 5. Mascotas 🐾 (Pets)
        var mascotas = await CreateCategoryAsync(
            name: "Mascotas",
            icon: "🐾"
        );
        rootCategories.Add(mascotas);

        // 6. Geek & Hobby 🎮 (Geek & Hobby)
        var geek = await CreateCategoryAsync(
            name: "Geek & Hobby",
            icon: "🎮"
        );
        rootCategories.Add(geek);

        // 7. Ediciones Especiales ✨ (Special Editions)
        var ediciones = await CreateCategoryAsync(
            name: "Ediciones Especiales",
            icon: "✨"
        );
        rootCategories.Add(ediciones);

        // 8. Personaliza el Tuyo ⚡ (Customize Yours)
        var personaliza = await CreateCategoryAsync(
            name: "Personaliza el Tuyo",
            icon: "⚡"
        );
        rootCategories.Add(personaliza);

        // Save root categories
        db.ProductCategories.AddRange(rootCategories);
        await db.SaveChangesAsync();

        // ── SUBCATEGORIES ────────────────────────────────────────────────────

        // Subcategories of "Regalos Personalizados"
        await CreateSubCategoriesAsync(regalos.Id, new[]
        {
            "Para él",
            "Para ella",
            "Cumpleaños",
            "Aniversarios",
            "Regalos originales",
            "Menos de $500",
            "Menos de $1000"
        });

        // Subcategories of "Bodas & Eventos"
        await CreateSubCategoriesAsync(bodas.Id, new[]
        {
            "Recuerdos para invitados",
            "Decoración personalizada",
            "Propuestas / compromiso",
            "Bridal party"
        });

        // Subcategories of "Negocios & Branding"
        await CreateSubCategoriesAsync(negocios.Id, new[]
        {
            "Regalos corporativos",
            "Artículos promocionales",
            "Señalización / placas",
            "Merch personalizado"
        });

        // Subcategories of "Hogar & Decoración"
        await CreateSubCategoriesAsync(hogar.Id, new[]
        {
            "Decoración moderna",
            "Cocina & bar",
            "Organización",
            "Cuadros / arte personalizado"
        });

        // Subcategories of "Mascotas"
        await CreateSubCategoriesAsync(mascotas.Id, new[]
        {
            "Placas personalizadas",
            "Recuerdos",
            "Accesorios"
        });

        // Subcategories of "Geek & Hobby"
        await CreateSubCategoriesAsync(geek.Id, new[]
        {
            "Gaming",
            "Anime / cultura pop",
            "Gadgets impresos 3D",
            "Accesorios personalizados"
        });

        // Subcategories of "Ediciones Especiales"
        await CreateSubCategoriesAsync(ediciones.Id, new[]
        {
            "Tendencias",
            "Temporada",
            "Lo más vendido",
            "Nuevos productos"
        });

        // Note: "Personaliza el Tuyo" has no subcategories
    }

    /// <summary>
    /// Creates a single root category and generates a unique slug.
    /// </summary>
    private async Task<ProductCategory> CreateCategoryAsync(
        string name,
        string? icon = null)
    {
        // Generate slug from name
        var baseSlug = slugService.GenerateSlug(name);
        var uniqueSlug = await slugService.EnsureUniqueSlugAsync(baseSlug);

        return new ProductCategory
        {
            Id = Guid.NewGuid(),
            Name = name,
            Slug = uniqueSlug,
            Icon = icon
        };
    }

    /// <summary>
    /// Creates multiple subcategories under a parent category.
    /// </summary>
    private async Task CreateSubCategoriesAsync(Guid parentId, string[] subCategoryNames)
    {
        var subCategories = new List<ProductSubCategory>();

        foreach (var name in subCategoryNames)
        {
            var baseSlug = slugService.GenerateSlug(name);
            var uniqueSlug = await slugService.EnsureUniqueSlugAsync(baseSlug);

            var subCategory = new ProductSubCategory
            {
                Id = Guid.NewGuid(),
                Name = name,
                Slug = uniqueSlug,
                ParentCategoryId = parentId
            };
            subCategories.Add(subCategory);
        }

        db.ProductSubCategories.AddRange(subCategories);
        await db.SaveChangesAsync();
    }
}
