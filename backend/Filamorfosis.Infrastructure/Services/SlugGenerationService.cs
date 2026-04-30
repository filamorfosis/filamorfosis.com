using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using Filamorfosis.Application.Services;
using Filamorfosis.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Filamorfosis.Infrastructure.Services;

/// <summary>
/// Generates and validates URL-friendly slugs for product categories.
/// Handles Spanish text conversion, uniqueness checking, and format validation.
/// </summary>
public partial class SlugGenerationService(FilamorfosisDbContext db) : ISlugGenerationService
{
    // Regex pattern for valid slugs: lowercase letters, numbers, and hyphens only
    [GeneratedRegex(@"^[a-z0-9-]+$")]
    private static partial Regex ValidSlugPattern();

    /// <summary>
    /// Generates a URL-friendly slug from Spanish text.
    /// Converts to lowercase, replaces spaces with hyphens, removes special characters,
    /// and handles Spanish accents (á→a, é→e, í→i, ó→o, ú→u, ñ→n).
    /// </summary>
    public string GenerateSlug(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return string.Empty;

        // Normalize to decomposed form (NFD) to separate base characters from diacritics
        var normalizedString = text.Normalize(NormalizationForm.FormD);
        var stringBuilder = new StringBuilder();

        // Process each character
        foreach (var c in normalizedString)
        {
            var unicodeCategory = CharUnicodeInfo.GetUnicodeCategory(c);

            // Skip non-spacing marks (diacritics/accents)
            if (unicodeCategory == UnicodeCategory.NonSpacingMark)
                continue;

            // Handle Spanish ñ/Ñ explicitly (it doesn't decompose like other accented letters)
            if (c == 'ñ' || c == 'Ñ')
            {
                stringBuilder.Append('n');
                continue;
            }

            // Keep only letters, digits, spaces, and hyphens
            if (char.IsLetterOrDigit(c) || c == ' ' || c == '-')
            {
                stringBuilder.Append(c);
            }
        }

        // Convert to lowercase
        var slug = stringBuilder.ToString().ToLowerInvariant();

        // Replace multiple spaces/hyphens with single hyphen
        slug = Regex.Replace(slug, @"[\s-]+", "-");

        // Remove leading/trailing hyphens
        slug = slug.Trim('-');

        return slug;
    }

    /// <summary>
    /// Ensures the slug is unique in the database by checking for collisions.
    /// If a collision occurs, appends a numeric suffix (-2, -3, etc.) to ensure uniqueness.
    /// </summary>
    public async Task<string> EnsureUniqueSlugAsync(string baseSlug, Guid? excludeId = null)
    {
        if (string.IsNullOrWhiteSpace(baseSlug))
            return string.Empty;

        var slug = baseSlug;
        var suffix = 2;

        // Check if slug exists (excluding the specified ID if provided)
        while (await SlugExistsAsync(slug, excludeId))
        {
            slug = $"{baseSlug}-{suffix}";
            suffix++;
        }

        return slug;
    }

    /// <summary>
    /// Validates that a slug contains only lowercase letters, numbers, and hyphens.
    /// Uses regex pattern: ^[a-z0-9-]+$
    /// </summary>
    public bool IsValidSlug(string slug)
    {
        if (string.IsNullOrWhiteSpace(slug))
            return false;

        return ValidSlugPattern().IsMatch(slug);
    }

    /// <summary>
    /// Checks if a slug already exists in the database (in either categories or subcategories).
    /// </summary>
    private async Task<bool> SlugExistsAsync(string slug, Guid? excludeId)
    {
        // Check in ProductCategories
        var categoryQuery = db.ProductCategories.Where(c => c.Slug == slug);
        if (excludeId.HasValue)
        {
            categoryQuery = categoryQuery.Where(c => c.Id != excludeId.Value);
        }
        if (await categoryQuery.AnyAsync())
            return true;

        // Check in ProductSubCategories
        var subCategoryQuery = db.ProductSubCategories.Where(sc => sc.Slug == slug);
        if (excludeId.HasValue)
        {
            subCategoryQuery = subCategoryQuery.Where(sc => sc.Id != excludeId.Value);
        }
        return await subCategoryQuery.AnyAsync();
    }
}
