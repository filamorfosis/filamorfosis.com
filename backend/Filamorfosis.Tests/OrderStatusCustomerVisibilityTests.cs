// Feature: admin-store-management, Property 11: Order status visibility to customer

using System.Net;
using System.Net.Http.Json;
using Filamorfosis.Application.DTOs;
using Filamorfosis.Domain.Entities;
using Filamorfosis.Tests.Infrastructure;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;

namespace Filamorfosis.Tests;

/// <summary>
/// Property-based tests for order status visibility to the customer after an admin update.
///
/// Property 11: For any order whose status is updated by an Admin via
/// PUT /api/v1/admin/orders/{id}/status, a subsequent GET /api/v1/orders/{id}
/// by the order's owner SHALL return the updated status.
///
/// Validates: Requirements 5.8, 6.1
/// </summary>
public class OrderStatusCustomerVisibilityTests
{
    // The three admin-advanceable starting statuses, each with its allowed next status.
    private static readonly (OrderStatus From, OrderStatus To)[] ValidTransitions =
    [
        (OrderStatus.Paid,      OrderStatus.Preparing),
        (OrderStatus.Preparing, OrderStatus.Shipped),
        (OrderStatus.Shipped,   OrderStatus.Delivered),
    ];

    // ── Helpers ───────────────────────────────────────────────────────────────

    /// <summary>
    /// Registers a customer, seeds an order owned by that customer in the given
    /// status, and returns both the authenticated customer HttpClient and the orderId.
    /// </summary>
    private static async Task<(HttpClient customerClient, Guid orderId)> SetupCustomerWithOrderAsync(
        FilamorfosisWebFactory factory, OrderStatus status)
    {
        var email = $"customer-{Guid.NewGuid():N}@test.com";
        const string password = "Password1";

        // Seed the user via Identity so the FK on Order.UserId resolves.
        Guid userId;
        using (var scope = factory.Services.CreateScope())
        {
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
            var user = new User
            {
                Id = Guid.NewGuid(),
                UserName = email,
                Email = email,
                FirstName = "Customer",
                LastName = "Test",
                CreatedAt = DateTime.UtcNow
            };
            await userManager.CreateAsync(user, password);
            userId = user.Id;
        }

        // Seed an order directly in the DB with the desired status.
        var orderId = Guid.NewGuid();
        await factory.SeedAsync(async db =>
        {
            var addressId = Guid.NewGuid();
            db.Addresses.Add(new Address
            {
                Id = addressId, UserId = userId,
                Street = "Calle Test", City = "CDMX", State = "CDMX",
                PostalCode = "06600", Country = "MX", IsDefault = false
            });

            db.Orders.Add(new Order
            {
                Id = orderId,
                UserId = userId,
                ShippingAddressId = addressId,
                Status = status,
                Total = 250m,
                Notes = null,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Items = []
            });

            await db.SaveChangesAsync();
        });

        // Authenticate the customer via the regular login endpoint.
        var customerClient = factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            HandleCookies = true,
            AllowAutoRedirect = false
        });
        customerClient.DefaultRequestHeaders.Add("X-Requested-With", "XMLHttpRequest");

        var loginResp = await customerClient.PostAsJsonAsync("/api/v1/auth/login",
            new LoginRequest { Email = email, Password = password });

        if (!loginResp.IsSuccessStatusCode)
            throw new InvalidOperationException($"Customer login failed: {loginResp.StatusCode}");

        return (customerClient, orderId);
    }

    // ── Property 11: Admin status update is visible to customer ──────────────
    //
    // For any valid admin transition (Paid→Preparing, Preparing→Shipped, Shipped→Delivered),
    // after the admin advances the order status, the order owner's
    // GET /api/v1/orders/{id} SHALL reflect the new status.
    //
    // Validates: Requirements 5.8, 6.1

    [Property(MaxTest = 100)]
    public Property AdminStatusUpdate_IsVisibleToCustomer()
    {
        // Generate one of the three valid (from, to) transition pairs.
        var transitionGen = Gen.Elements(ValidTransitions);

        return Prop.ForAll(
            Arb.From(transitionGen),
            pair => RunVisibilityCheckAsync(pair.From, pair.To).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunVisibilityCheckAsync(OrderStatus fromStatus, OrderStatus toStatus)
    {
        await using var factory = new FilamorfosisWebFactory();

        // Set up customer with an order in fromStatus.
        var (customerClient, orderId) = await SetupCustomerWithOrderAsync(factory, fromStatus);

        // Admin logs in and advances the order status.
        var adminClient = await AdminPropertyTests.LoginAsAdminAsync(factory);

        var updateResp = await adminClient.PutAsJsonAsync(
            $"/api/v1/admin/orders/{orderId}/status",
            new { status = toStatus.ToString() });

        if (updateResp.StatusCode != HttpStatusCode.OK)
            return false;

        // Customer fetches their order and verifies the updated status is reflected.
        var getResp = await customerClient.GetAsync($"/api/v1/orders/{orderId}");

        if (!getResp.IsSuccessStatusCode)
            return false;

        var order = await getResp.Content.ReadFromJsonAsync<OrderDetailDto>();
        return order?.Status == toStatus.ToString();
    }
}
