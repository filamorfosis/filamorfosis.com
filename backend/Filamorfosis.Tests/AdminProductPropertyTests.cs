// Feature: admin-store-management, Property 7: Product pagination invariant
// Feature: admin-store-management, Property 8: Variant delete conflict

using System.Net;
using System.Net.Http.Json;
using Filamorfosis.Application.DTOs;
using Filamorfosis.Domain.Entities;
using Filamorfosis.Tests.Infrastructure;
using static Filamorfosis.Domain.Entities.OrderStatus;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;
using Microsoft.EntityFrameworkCore;

namespace Filamorfosis.Tests;

/// <summary>
/// Property-based tests for AdminProductsController.
/// Covers Properties 7 and 8 from the admin-store-management spec.
/// </summary>
public class AdminProductPropertyTests
{
    // ── Property 7: Product pagination invariant ─────────────────────────────
    // For any page and pageSize, items returned ≤ pageSize and totalCount equals
    // the actual number of products in the database.
    // Validates: Requirements 3.1

    [Property(MaxTest = 20)]
    public Property ProductPagination_ItemsLtePageSize_AndTotalCountMatchesDb()
    {
        return Prop.ForAll(
            Arb.From(Gen.Choose(1, 5)),   // page
            Arb.From(Gen.Choose(1, 10)),  // pageSize
            (page, pageSize) =>
                RunPaginationInvariantAsync(page, pageSize).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunPaginationInvariantAsync(int page, int pageSize)
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        // Seed 15 additional products (DbSeeder already seeds 1 on startup)
        await factory.SeedAsync(async db =>
        {
            // Find the category seeded by DbSeeder
            var existingCatId = db.Processes.First().Id;

            for (var i = 0; i < 15; i++)
            {
                db.Products.Add(new Product
                {
                    Id = Guid.NewGuid(),
                    ProcessId = existingCatId,
                    Slug = $"pg-prod-{Guid.NewGuid():N}",
                    TitleEs = $"Producto {i}",
                    DescriptionEs = "Desc",
                    Tags = [], ImageUrls = [],
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                });
            }

            await db.SaveChangesAsync();
        });

        // Get the actual total from the DB to use as ground truth
        int actualTotal = 0;
        await factory.SeedAsync(async db =>
        {
            actualTotal = await db.Products.CountAsync();
            // no SaveChangesAsync needed — read only
        });

        var resp = await client.GetAsync(
            $"/api/v1/admin/products?page={page}&pageSize={pageSize}");

        if (!resp.IsSuccessStatusCode) return false;

        var result = await resp.Content.ReadFromJsonAsync<PagedResult<ProductDetailDto>>();
        if (result is null) return false;

        // Items on any page must not exceed pageSize
        if (result.Items.Count > pageSize)
            throw new Exception($"Items.Count ({result.Items.Count}) > pageSize ({pageSize})");

        // totalCount must always equal the actual number of products in the DB
        if (result.TotalCount != actualTotal)
            throw new Exception($"TotalCount ({result.TotalCount}) != actualTotal ({actualTotal}). page={page}, pageSize={pageSize}");

        return true;
    }

    // ── Property 8: Variant delete conflict ──────────────────────────────────
    // For any ProductVariant that is referenced by one or more OrderItems,
    // DELETE /api/v1/admin/products/{id}/variants/{variantId} SHALL return 409.
    // Validates: Requirements 3.9

    [Property(MaxTest = 10)]
    public Property VariantDelete_ReferencedByOrderItem_Returns409()
    {
        return Prop.ForAll(
            Arb.From(Gen.Choose(1, 3)),   // number of order items referencing the variant
            orderItemCount =>
                RunVariantDeleteConflictAsync(orderItemCount).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunVariantDeleteConflictAsync(int orderItemCount)
    {
        await using var factory = new FilamorfosisWebFactory();
        var client = await AdminPropertyTests.LoginAsAdminAsync(factory);

        Guid prodId = Guid.Empty, variantId = Guid.Empty;

        await factory.SeedAsync(async db =>
        {
            var catId = Guid.NewGuid();
            db.Processes.Add(new Process {
                Id = catId,
                Slug = $"vc-cat-{Guid.NewGuid():N}",
                NameEs = "VCat"});

            prodId = Guid.NewGuid();
            db.Products.Add(new Product
            {
                Id = prodId, ProcessId = catId,
                Slug = $"vc-prod-{Guid.NewGuid():N}",
                TitleEs = "P",
                DescriptionEs = "D",
                Tags = [], ImageUrls = [],
                IsActive = true, CreatedAt = DateTime.UtcNow
            });

            variantId = Guid.NewGuid();
            db.ProductVariants.Add(new ProductVariant
            {
                Id = variantId, ProductId = prodId,
                Sku = $"VC-{Guid.NewGuid():N}",
                LabelEs = "V",
                Price = 100m, StockQuantity = 10,
                IsAvailable = true, AcceptsDesignFile = false
            });

            // Seed a user for the order
            var userId = Guid.NewGuid();
            db.Users.Add(new User
            {
                Id = userId,
                UserName = $"user-{Guid.NewGuid():N}@test.com",
                Email = $"user-{Guid.NewGuid():N}@test.com",
                FirstName = "Test", LastName = "User",
                CreatedAt = DateTime.UtcNow,
                NormalizedEmail = $"USER@TEST.COM",
                NormalizedUserName = $"USER@TEST.COM"
            });

            // Seed an address
            var addressId = Guid.NewGuid();
            db.Addresses.Add(new Address
            {
                Id = addressId, UserId = userId,
                Street = "Calle 1", City = "CDMX",
                State = "CDMX", PostalCode = "06600",
                Country = "MX", IsDefault = true
            });

            // Seed an order referencing the variant
            var orderId = Guid.NewGuid();
            db.Orders.Add(new Order
            {
                Id = orderId, UserId = userId,
                ShippingAddressId = addressId,
                Status = OrderStatus.Paid,
                Total = 100m * orderItemCount,
                CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow
            });

            for (var i = 0; i < orderItemCount; i++)
            {
                db.OrderItems.Add(new OrderItem
                {
                    Id = Guid.NewGuid(),
                    OrderId = orderId,
                    ProductVariantId = variantId,
                    ProductTitleEs = "P", VariantLabelEs = "V", UnitPrice = 100m, Quantity = 1
                });
            }

            await db.SaveChangesAsync();
        });

        // Attempt to delete the variant — must return 409
        var resp = await client.DeleteAsync($"/api/v1/admin/products/{prodId}/variants/{variantId}");
        return resp.StatusCode == HttpStatusCode.Conflict;
    }
}
