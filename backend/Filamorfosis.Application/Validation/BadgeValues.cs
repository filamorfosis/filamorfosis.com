namespace Filamorfosis.Application.Validation;

public static class BadgeValues
{
    public static readonly HashSet<string> Allowed =
        new(StringComparer.OrdinalIgnoreCase) { "hot", "new", "promo", "popular" };

    public static bool IsValid(string? badge) =>
        badge is null || Allowed.Contains(badge);
}
