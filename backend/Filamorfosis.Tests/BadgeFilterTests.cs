// Feature: product-catalog-migration, Property 6: Badge API filter
using System.Net;
using System.Net.Http.Json;
using Filamorfosis.Application.DTOs;
using Filamorfosis.Domain.Entities;
using Filamorfosis.Tests.Infrastructure;

namespace Filamorfosis.Tests;

public class BadgeFilterTests
{
    [Theory]
    [InlineData("hot")]
    [InlineData("new")]
    [InlineData("promo")]
    [InlineData("popular")]
    public async Task GetAll_BadgeFilter_ReturnsOnlyMatchingProducts(string badge)
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = factory.CreateClient();

        await factory.SeedAsync(async db =>
        {
            var catId = db.Processes.First().Id;
            // Seed products with different badges
            var badges = new string?[] { "hot", "new", "promo", "popular", null };
            foreach (var b in badges)
            {
                db.Products.Add(new Product
                {
                    Id = Guid.NewGuid(), ProcessId = catId,
                    Slug = $"badge-filter-{b ?? "null"}-{Guid.NewGuid():N}",
                    TitleEs = $"Product {b}",
                    DescriptionEs = "D",
                    Tags = [], ImageUrls = [],
                    Badge = b,
                    IsActive = true, CreatedAt = DateTime.UtcNow
                });
            }
            await db.SaveChangesAsync();
        });

        var resp = await client.GetAsync($"/api/v1/products?badge={badge}");
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);

        var result = await resp.Content.ReadFromJsonAsync<PagedResult<ProductSummaryDto>>();
        Assert.NotNull(result);
        Assert.All(result.Items, p => Assert.Equal(badge, p.Badge));
    }
}
