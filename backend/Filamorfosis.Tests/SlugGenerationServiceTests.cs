// Requirements: 9.1, 9.2, 9.4

using Filamorfosis.Domain.Entities;
using Filamorfosis.Infrastructure.Data;
using Filamorfosis.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace Filamorfosis.Tests;

public class SlugGenerationServiceTests
{
    // ── Helpers ───────────────────────────────────────────────────────────────

    private static FilamorfosisDbContext CreateInMemoryDb(string dbName)
    {
        var options = new DbContextOptionsBuilder<FilamorfosisDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
        return new FilamorfosisDbContext(options);
    }

    private static SlugGenerationService CreateService(FilamorfosisDbContext db)
        => new(db);

    // ── GenerateSlug tests ────────────────────────────────────────────────────

    // Test 1: Basic Spanish text with spaces
    [Fact]
    public void GenerateSlug_BasicSpanishText_ReturnsLowercaseWithHyphens()
    {
        var db = CreateInMemoryDb(nameof(GenerateSlug_BasicSpanishText_ReturnsLowercaseWithHyphens));
        var svc = CreateService(db);

        var result = svc.GenerateSlug("Regalos Personalizados");

        Assert.Equal("regalos-personalizados", result);
    }

    // Test 2: Spanish accents (á, é, í, ó, ú)
    [Fact]
    public void GenerateSlug_SpanishAccents_RemovesAccents()
    {
        var db = CreateInMemoryDb(nameof(GenerateSlug_SpanishAccents_RemovesAccents));
        var svc = CreateService(db);

        var result = svc.GenerateSlug("Decoración Única");

        Assert.Equal("decoracion-unica", result);
    }

    // Test 3: Spanish ñ character
    [Fact]
    public void GenerateSlug_SpanishNTilde_ConvertsToN()
    {
        var db = CreateInMemoryDb(nameof(GenerateSlug_SpanishNTilde_ConvertsToN));
        var svc = CreateService(db);

        var result = svc.GenerateSlug("Año Nuevo");

        Assert.Equal("ano-nuevo", result);
    }

    // Test 4: Mixed case with special characters
    [Fact]
    public void GenerateSlug_MixedCaseWithSpecialChars_RemovesSpecialChars()
    {
        var db = CreateInMemoryDb(nameof(GenerateSlug_MixedCaseWithSpecialChars_RemovesSpecialChars));
        var svc = CreateService(db);

        var result = svc.GenerateSlug("Bodas & Eventos!");

        Assert.Equal("bodas-eventos", result);
    }

    // Test 5: Multiple spaces and hyphens
    [Fact]
    public void GenerateSlug_MultipleSpaces_CollapsesToSingleHyphen()
    {
        var db = CreateInMemoryDb(nameof(GenerateSlug_MultipleSpaces_CollapsesToSingleHyphen));
        var svc = CreateService(db);

        var result = svc.GenerateSlug("Para   él");

        Assert.Equal("para-el", result);
    }

    // Test 6: Leading and trailing spaces
    [Fact]
    public void GenerateSlug_LeadingTrailingSpaces_TrimsHyphens()
    {
        var db = CreateInMemoryDb(nameof(GenerateSlug_LeadingTrailingSpaces_TrimsHyphens));
        var svc = CreateService(db);

        var result = svc.GenerateSlug("  Regalos  ");

        Assert.Equal("regalos", result);
    }

    // Test 7: Numbers in text
    [Fact]
    public void GenerateSlug_WithNumbers_PreservesNumbers()
    {
        var db = CreateInMemoryDb(nameof(GenerateSlug_WithNumbers_PreservesNumbers));
        var svc = CreateService(db);

        var result = svc.GenerateSlug("Menos de $500");

        Assert.Equal("menos-de-500", result);
    }

    // Test 8: All Spanish accented vowels
    [Fact]
    public void GenerateSlug_AllAccentedVowels_RemovesAllAccents()
    {
        var db = CreateInMemoryDb(nameof(GenerateSlug_AllAccentedVowels_RemovesAllAccents));
        var svc = CreateService(db);

        var result = svc.GenerateSlug("Ángel José María Mónica Úrsula");

        Assert.Equal("angel-jose-maria-monica-ursula", result);
    }

    // Test 9: Empty string
    [Fact]
    public void GenerateSlug_EmptyString_ReturnsEmpty()
    {
        var db = CreateInMemoryDb(nameof(GenerateSlug_EmptyString_ReturnsEmpty));
        var svc = CreateService(db);

        var result = svc.GenerateSlug("");

        Assert.Equal(string.Empty, result);
    }

    // Test 10: Whitespace only
    [Fact]
    public void GenerateSlug_WhitespaceOnly_ReturnsEmpty()
    {
        var db = CreateInMemoryDb(nameof(GenerateSlug_WhitespaceOnly_ReturnsEmpty));
        var svc = CreateService(db);

        var result = svc.GenerateSlug("   ");

        Assert.Equal(string.Empty, result);
    }

    // Test 11: Complex Spanish text with all features
    [Fact]
    public void GenerateSlug_ComplexSpanishText_HandlesAllFeatures()
    {
        var db = CreateInMemoryDb(nameof(GenerateSlug_ComplexSpanishText_HandlesAllFeatures));
        var svc = CreateService(db);

        var result = svc.GenerateSlug("¡Niños & Niñas! Año 2024");

        Assert.Equal("ninos-ninas-ano-2024", result);
    }

    // ── IsValidSlug tests ─────────────────────────────────────────────────────

    // Test 12: Valid slug with lowercase letters
    [Fact]
    public void IsValidSlug_LowercaseLetters_ReturnsTrue()
    {
        var db = CreateInMemoryDb(nameof(IsValidSlug_LowercaseLetters_ReturnsTrue));
        var svc = CreateService(db);

        var result = svc.IsValidSlug("regalos-personalizados");

        Assert.True(result);
    }

    // Test 13: Valid slug with numbers
    [Fact]
    public void IsValidSlug_WithNumbers_ReturnsTrue()
    {
        var db = CreateInMemoryDb(nameof(IsValidSlug_WithNumbers_ReturnsTrue));
        var svc = CreateService(db);

        var result = svc.IsValidSlug("menos-de-500");

        Assert.True(result);
    }

    // Test 14: Invalid slug with uppercase letters
    [Fact]
    public void IsValidSlug_UppercaseLetters_ReturnsFalse()
    {
        var db = CreateInMemoryDb(nameof(IsValidSlug_UppercaseLetters_ReturnsFalse));
        var svc = CreateService(db);

        var result = svc.IsValidSlug("Regalos-Personalizados");

        Assert.False(result);
    }

    // Test 15: Invalid slug with spaces
    [Fact]
    public void IsValidSlug_WithSpaces_ReturnsFalse()
    {
        var db = CreateInMemoryDb(nameof(IsValidSlug_WithSpaces_ReturnsFalse));
        var svc = CreateService(db);

        var result = svc.IsValidSlug("regalos personalizados");

        Assert.False(result);
    }

    // Test 16: Invalid slug with special characters
    [Fact]
    public void IsValidSlug_WithSpecialChars_ReturnsFalse()
    {
        var db = CreateInMemoryDb(nameof(IsValidSlug_WithSpecialChars_ReturnsFalse));
        var svc = CreateService(db);

        var result = svc.IsValidSlug("regalos&eventos");

        Assert.False(result);
    }

    // Test 17: Invalid slug with accents
    [Fact]
    public void IsValidSlug_WithAccents_ReturnsFalse()
    {
        var db = CreateInMemoryDb(nameof(IsValidSlug_WithAccents_ReturnsFalse));
        var svc = CreateService(db);

        var result = svc.IsValidSlug("decoración");

        Assert.False(result);
    }

    // Test 18: Empty string
    [Fact]
    public void IsValidSlug_EmptyString_ReturnsFalse()
    {
        var db = CreateInMemoryDb(nameof(IsValidSlug_EmptyString_ReturnsFalse));
        var svc = CreateService(db);

        var result = svc.IsValidSlug("");

        Assert.False(result);
    }

    // Test 19: Whitespace only
    [Fact]
    public void IsValidSlug_WhitespaceOnly_ReturnsFalse()
    {
        var db = CreateInMemoryDb(nameof(IsValidSlug_WhitespaceOnly_ReturnsFalse));
        var svc = CreateService(db);

        var result = svc.IsValidSlug("   ");

        Assert.False(result);
    }

    // ── EnsureUniqueSlugAsync tests ───────────────────────────────────────────

    // Test 20: Unique slug (no collision)
    [Fact]
    public async Task EnsureUniqueSlugAsync_NoCollision_ReturnsSameSlug()
    {
        var db = CreateInMemoryDb(nameof(EnsureUniqueSlugAsync_NoCollision_ReturnsSameSlug));
        var svc = CreateService(db);

        var result = await svc.EnsureUniqueSlugAsync("regalos-personalizados");

        Assert.Equal("regalos-personalizados", result);
    }

    // Test 21: Slug collision (append -2)
    [Fact]
    public async Task EnsureUniqueSlugAsync_OneCollision_AppendsSuffix2()
    {
        var db = CreateInMemoryDb(nameof(EnsureUniqueSlugAsync_OneCollision_AppendsSuffix2));
        var svc = CreateService(db);

        // Add existing category with the slug
        db.ProductCategories.Add(new ProductCategory
        {
            Id = Guid.NewGuid(),
            NameEs = "Regalos Personalizados",
            NameEn = "Personalized Gifts",
            NameDe = "Personalisierte Geschenke",
            NamePt = "Presentes Personalizados",
            NameJa = "パーソナライズされたギフト",
            NameZh = "个性化礼品",
            Slug = "regalos-personalizados"
        });
        await db.SaveChangesAsync();

        var result = await svc.EnsureUniqueSlugAsync("regalos-personalizados");

        Assert.Equal("regalos-personalizados-2", result);
    }

    // Test 22: Multiple collisions (append -3)
    [Fact]
    public async Task EnsureUniqueSlugAsync_MultipleCollisions_AppendsSuffix3()
    {
        var db = CreateInMemoryDb(nameof(EnsureUniqueSlugAsync_MultipleCollisions_AppendsSuffix3));
        var svc = CreateService(db);

        // Add existing categories with the slug and -2 suffix
        db.ProductCategories.AddRange(
            new ProductCategory
            {
                Id = Guid.NewGuid(),
                NameEs = "Regalos",
                NameEn = "Gifts",
                NameDe = "Geschenke",
                NamePt = "Presentes",
                NameJa = "ギフト",
                NameZh = "礼品",
                Slug = "regalos"
            },
            new ProductCategory
            {
                Id = Guid.NewGuid(),
                NameEs = "Regalos 2",
                NameEn = "Gifts 2",
                NameDe = "Geschenke 2",
                NamePt = "Presentes 2",
                NameJa = "ギフト 2",
                NameZh = "礼品 2",
                Slug = "regalos-2"
            }
        );
        await db.SaveChangesAsync();

        var result = await svc.EnsureUniqueSlugAsync("regalos");

        Assert.Equal("regalos-3", result);
    }

    // Test 23: Exclude current category ID (for updates)
    [Fact]
    public async Task EnsureUniqueSlugAsync_ExcludeId_ReturnsSameSlug()
    {
        var db = CreateInMemoryDb(nameof(EnsureUniqueSlugAsync_ExcludeId_ReturnsSameSlug));
        var svc = CreateService(db);

        var categoryId = Guid.NewGuid();

        // Add existing category
        db.ProductCategories.Add(new ProductCategory
        {
            Id = categoryId,
            NameEs = "Regalos",
            NameEn = "Gifts",
            NameDe = "Geschenke",
            NamePt = "Presentes",
            NameJa = "ギフト",
            NameZh = "礼品",
            Slug = "regalos"
        });
        await db.SaveChangesAsync();

        // Should not collide with itself
        var result = await svc.EnsureUniqueSlugAsync("regalos", categoryId);

        Assert.Equal("regalos", result);
    }

    // Test 24: Empty slug
    [Fact]
    public async Task EnsureUniqueSlugAsync_EmptySlug_ReturnsEmpty()
    {
        var db = CreateInMemoryDb(nameof(EnsureUniqueSlugAsync_EmptySlug_ReturnsEmpty));
        var svc = CreateService(db);

        var result = await svc.EnsureUniqueSlugAsync("");

        Assert.Equal(string.Empty, result);
    }

    // Test 25: Whitespace only
    [Fact]
    public async Task EnsureUniqueSlugAsync_WhitespaceOnly_ReturnsEmpty()
    {
        var db = CreateInMemoryDb(nameof(EnsureUniqueSlugAsync_WhitespaceOnly_ReturnsEmpty));
        var svc = CreateService(db);

        var result = await svc.EnsureUniqueSlugAsync("   ");

        Assert.Equal(string.Empty, result);
    }
}
