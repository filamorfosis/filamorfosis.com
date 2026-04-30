namespace Filamorfosis.Application.Services;

/// <summary>
/// Generates and validates URL-friendly slugs for product categories.
/// Handles Spanish text conversion, uniqueness checking, and format validation.
/// </summary>
public interface ISlugGenerationService
{
    /// <summary>
    /// Generates a URL-friendly slug from Spanish text.
    /// Converts to lowercase, replaces spaces with hyphens, removes special characters,
    /// and handles Spanish accents (á→a, é→e, í→i, ó→o, ú→u, ñ→n).
    /// </summary>
    /// <param name="text">The text to convert to a slug</param>
    /// <returns>A URL-friendly slug</returns>
    string GenerateSlug(string text);

    /// <summary>
    /// Ensures the slug is unique in the database by checking for collisions.
    /// If a collision occurs, appends a numeric suffix (-2, -3, etc.) to ensure uniqueness.
    /// </summary>
    /// <param name="baseSlug">The base slug to check for uniqueness</param>
    /// <param name="excludeId">Optional category ID to exclude from uniqueness check (for updates)</param>
    /// <returns>A unique slug</returns>
    Task<string> EnsureUniqueSlugAsync(string baseSlug, Guid? excludeId = null);

    /// <summary>
    /// Validates that a slug contains only lowercase letters, numbers, and hyphens.
    /// Uses regex pattern: ^[a-z0-9-]+$
    /// </summary>
    /// <param name="slug">The slug to validate</param>
    /// <returns>True if the slug is valid, false otherwise</returns>
    bool IsValidSlug(string slug);
}
