// Feature: admin-store-management, Property 10: Order status workflow state machine

using System.Net;
using System.Net.Http.Json;
using Filamorfosis.Domain.Entities;
using Filamorfosis.Tests.Infrastructure;
using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;

namespace Filamorfosis.Tests;

/// <summary>
/// Property-based tests for the order status state machine enforced by
/// PUT /api/v1/admin/orders/{id}/status.
///
/// Property 10: For any order in a given status, the endpoint SHALL succeed (200)
/// only for the single allowed next status in the sequence
/// Paid → Preparing → Shipped → Delivered, and SHALL return 422 for any other target.
///
/// Validates: Requirements 5.3, 5.4
/// </summary>
public class OrderStatusStateMachineTests
{
    // The complete set of statuses the admin can target via the endpoint.
    private static readonly OrderStatus[] AdminTargetableStatuses =
    [
        OrderStatus.Preparing,
        OrderStatus.Shipped,
        OrderStatus.Delivered,
        // Also include statuses that should never be allowed via admin workflow:
        OrderStatus.Pending,
        OrderStatus.PendingPayment,
        OrderStatus.Paid,
        OrderStatus.Cancelled,
        OrderStatus.PaymentFailed,
    ];

    // Valid transitions as defined by AllowedTransitions in AdminOrdersController.
    private static readonly Dictionary<OrderStatus, OrderStatus?> AllowedNext = new()
    {
        [OrderStatus.Paid]      = OrderStatus.Preparing,
        [OrderStatus.Preparing] = OrderStatus.Shipped,
        [OrderStatus.Shipped]   = OrderStatus.Delivered,
        [OrderStatus.Delivered] = null, // terminal — no further transitions
    };

    // The three starting statuses that have at least one valid next transition.
    private static readonly OrderStatus[] TransitionableStatuses =
    [
        OrderStatus.Paid,
        OrderStatus.Preparing,
        OrderStatus.Shipped,
    ];

    // ── Helpers ───────────────────────────────────────────────────────────────

    /// <summary>
    /// Seeds an order in the given status directly into the DB and returns its ID.
    /// </summary>
    private static async Task<Guid> SeedOrderWithStatusAsync(
        FilamorfosisWebFactory factory, OrderStatus status)
    {
        var orderId = Guid.NewGuid();
        await factory.SeedAsync(async db =>
        {
            var userId    = Guid.NewGuid();
            var addressId = Guid.NewGuid();

            // Seed a real user so FK constraints are satisfied in the in-memory DB
            db.Users.Add(new User
            {
                Id = userId,
                UserName = $"sm-{userId:N}@test.com",
                Email    = $"sm-{userId:N}@test.com",
                NormalizedEmail    = $"SM-{userId:N}@TEST.COM",
                NormalizedUserName = $"SM-{userId:N}@TEST.COM",
                FirstName = "Test", LastName = "User",
                CreatedAt = DateTime.UtcNow
            });

            db.Addresses.Add(new Address
            {
                Id = addressId, UserId = userId,
                Street = "Calle 1", City = "CDMX", State = "CDMX",
                PostalCode = "06600", Country = "MX", IsDefault = false
            });

            db.Orders.Add(new Order
            {
                Id = orderId,
                UserId = userId,
                ShippingAddressId = addressId,
                Status = status,
                Total = 100m,
                Notes = null,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Items = []
            });

            await db.SaveChangesAsync();
        });
        return orderId;
    }

    // ── Property 10a: Valid transitions return 200 ────────────────────────────
    //
    // For each valid transition (Paid→Preparing, Preparing→Shipped, Shipped→Delivered),
    // PUT /api/v1/admin/orders/{id}/status SHALL return 200.
    //
    // Validates: Requirements 5.3

    [Property(MaxTest = 100)]
    public Property ValidTransitions_Return200()
    {
        // Generate one of the three transitionable starting statuses.
        var startStatusGen = Gen.Elements(TransitionableStatuses);

        return Prop.ForAll(
            Arb.From(startStatusGen),
            fromStatus => RunValidTransitionAsync(fromStatus).GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunValidTransitionAsync(OrderStatus fromStatus)
    {
        await using var factory = new FilamorfosisWebFactory();
        var admin = await AdminPropertyTests.LoginAsAdminAsync(factory);

        var orderId = await SeedOrderWithStatusAsync(factory, fromStatus);
        var toStatus = AllowedNext[fromStatus]!.Value;

        var resp = await admin.PutAsJsonAsync(
            $"/api/v1/admin/orders/{orderId}/status",
            new { status = toStatus.ToString() });

        return resp.StatusCode == HttpStatusCode.OK;
    }

    // ── Property 10b: Invalid transitions return 422 ──────────────────────────
    //
    // For each invalid transition (any combination other than the three valid ones),
    // PUT /api/v1/admin/orders/{id}/status SHALL return 422 Unprocessable Entity.
    //
    // Validates: Requirements 5.4

    [Property(MaxTest = 100)]
    public Property InvalidTransitions_Return422()
    {
        // Generate a (fromStatus, toStatus) pair where the transition is NOT allowed.
        var invalidPairGen =
            from fromStatus in Gen.Elements(AdminTargetableStatuses)
            from toStatus   in Gen.Elements(AdminTargetableStatuses)
            where !IsValidTransition(fromStatus, toStatus)
            select (fromStatus, toStatus);

        return Prop.ForAll(
            Arb.From(invalidPairGen),
            pair => RunInvalidTransitionAsync(pair.fromStatus, pair.toStatus)
                        .GetAwaiter().GetResult()
        );
    }

    private static async Task<bool> RunInvalidTransitionAsync(
        OrderStatus fromStatus, OrderStatus toStatus)
    {
        await using var factory = new FilamorfosisWebFactory();
        var admin = await AdminPropertyTests.LoginAsAdminAsync(factory);

        var orderId = await SeedOrderWithStatusAsync(factory, fromStatus);

        var resp = await admin.PutAsJsonAsync(
            $"/api/v1/admin/orders/{orderId}/status",
            new { status = toStatus.ToString() });

        return resp.StatusCode == HttpStatusCode.UnprocessableEntity;
    }

    // ── Helper: is a transition valid according to the state machine? ──────────

    private static bool IsValidTransition(OrderStatus from, OrderStatus to)
    {
        return AllowedNext.TryGetValue(from, out var allowed) && allowed == to;
    }
}
