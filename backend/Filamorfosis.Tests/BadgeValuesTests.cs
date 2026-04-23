// Feature: product-catalog-migration, Property 1: Badge validation rejects invalid values
using Filamorfosis.Application.Validation;

namespace Filamorfosis.Tests;

public class BadgeValuesTests
{
    [Theory]
    [InlineData("hot", true)]
    [InlineData("new", true)]
    [InlineData("promo", true)]
    [InlineData("popular", true)]
    [InlineData(null, true)]
    [InlineData("", false)]
    [InlineData("invalid", false)]
    [InlineData("HOT", true)]   // case-insensitive
    [InlineData("NEW", true)]
    [InlineData("sale", false)]
    [InlineData("featured", false)]
    [InlineData("best", false)]
    public void IsValid_ReturnsExpected(string? badge, bool expected)
    {
        Assert.Equal(expected, BadgeValues.IsValid(badge));
    }
}
