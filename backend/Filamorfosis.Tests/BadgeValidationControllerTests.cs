// Feature: product-catalog-migration, Property 1: Badge validation rejects invalid values
using System.Net;
using System.Net.Http.Json;
using Filamorfosis.Application.DTOs;
using Filamorfosis.Domain.Entities;
using Filamorfosis.Tests.Infrastructure;

namespace Filamorfosis.Tests;

public class BadgeValidationControllerTests
{
    [Theory]
    [InlineData("invalid-badge")]
    [InlineData("sale")]
    [InlineData("featured")]
    [InlineData("")]
    public async Task Update_InvalidBadge_Returns422(string badge)
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        Guid prodId = Guid.Empty;
        await factory.SeedAsync(async db =>
        {
            var catId = db.Processes.First().Id;
            prodId = Guid.NewGuid();
            db.Products.Add(new Product
            {
                Id = prodId, ProcessId = catId,
                Slug = $"badge-test-{Guid.NewGuid():N}",
                TitleEs = "Test",
                DescriptionEs = "D",
                Tags = [], ImageUrls = [],
                IsActive = true, CreatedAt = DateTime.UtcNow
            });
            await db.SaveChangesAsync();
        });

        var resp = await client.PutAsJsonAsync(
            $"/api/v1/admin/products/{prodId}",
            new UpdateProductRequest { Badge = badge });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, resp.StatusCode);
    }

    [Theory]
    [InlineData("hot")]
    [InlineData("new")]
    [InlineData("promo")]
    [InlineData("popular")]
    [InlineData(null)]
    public async Task Update_ValidBadge_Returns200(string? badge)
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        Guid prodId = Guid.Empty;
        await factory.SeedAsync(async db =>
        {
            var catId = db.Processes.First().Id;
            prodId = Guid.NewGuid();
            db.Products.Add(new Product
            {
                Id = prodId, ProcessId = catId,
                Slug = $"badge-valid-{Guid.NewGuid():N}",
                TitleEs = "Test",
                DescriptionEs = "D",
                Tags = [], ImageUrls = [],
                IsActive = true, CreatedAt = DateTime.UtcNow
            });
            await db.SaveChangesAsync();
        });

        var resp = await client.PutAsJsonAsync(
            $"/api/v1/admin/products/{prodId}",
            new UpdateProductRequest { Badge = badge });

        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
    }
}
