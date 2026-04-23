using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Filamorfosis.Domain.Entities;
using Filamorfosis.Infrastructure.Data;
using Filamorfosis.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Filamorfosis.API.Controllers;

[ApiController]
[Route("api/v1")]
public class PaymentsController(
    FilamorfosisDbContext db,
    IMercadoPagoService mpService,
    IEmailService emailService,
    IConfiguration config,
    ILogger<PaymentsController> logger) : ControllerBase
{
    // ── POST /api/v1/orders/{orderId}/payment ─────────────────────────────────

    [HttpPost("orders/{orderId:guid}/payment")]
    [Authorize]
    public async Task<IActionResult> CreatePayment(Guid orderId)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")!);

        var order = await db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == orderId);

        if (order is null)
            return NotFound(new { detail = "Order not found." });

        if (order.UserId != userId)
            return StatusCode(403, new { detail = "Forbidden." });

        var frontendBase = config["FrontendOrigin"] ?? "https://filamorfosis.com";

        try
        {
            var (prefId, checkoutUrl) = await mpService.CreatePreferenceAsync(order, frontendBase);
            order.MercadoPagoPreferenceId = prefId;
            order.Status = OrderStatus.PendingPayment;
            order.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();

            return Ok(new { checkoutUrl });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "MercadoPago preference creation failed for order {OrderId}", orderId);
            return StatusCode(502, new
            {
                type = "https://filamorfosis.com/errors/payment-gateway-error",
                title = "Bad Gateway",
                status = 502,
                detail = "Payment gateway is unavailable. Please try again."
            });
        }
    }

    // ── POST /api/v1/payments/webhook ─────────────────────────────────────────

    [HttpPost("payments/webhook")]
    public async Task<IActionResult> Webhook()
    {
        // Validate HMAC-SHA256 signature
        var webhookSecret = config["MercadoPago:WebhookSecret"] ?? string.Empty;
        if (!string.IsNullOrEmpty(webhookSecret) && webhookSecret != "PLACEHOLDER_SET_VIA_AWS_SECRETS_MANAGER")
        {
            if (!Request.Headers.TryGetValue("x-signature", out var sig))
                return BadRequest(new { detail = "Missing x-signature header." });

            Request.EnableBuffering();
            using var reader = new StreamReader(Request.Body, Encoding.UTF8, leaveOpen: true);
            var body = await reader.ReadToEndAsync();
            Request.Body.Position = 0;

            var expected = ComputeHmac(webhookSecret, body);
            if (!CryptographicOperations.FixedTimeEquals(
                    Encoding.UTF8.GetBytes(sig.ToString()),
                    Encoding.UTF8.GetBytes(expected)))
                return BadRequest(new { detail = "Invalid webhook signature." });
        }

        // Parse notification
        var notification = await System.Text.Json.JsonSerializer.DeserializeAsync<WebhookNotification>(
            Request.Body,
            new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        if (notification?.Data?.Id is null)
            return Ok();

        var paymentId = notification.Data.Id;

        // Verify payment with MP
        var mpStatus = await mpService.GetPaymentStatusAsync(paymentId);
        if (mpStatus is null)
        {
            logger.LogWarning("MP payment {PaymentId} not found", paymentId);
            return Ok();
        }

        // Find order by external reference (we use paymentId lookup via MercadoPagoPaymentId)
        // For webhook, MP sends the payment ID; we look up by preference or payment ID
        var order = await db.Orders
            .Include(o => o.User)
            .FirstOrDefaultAsync(o => o.MercadoPagoPaymentId == paymentId
                || o.MercadoPagoPreferenceId == notification.Data.Id);

        if (order is null)
        {
            logger.LogWarning("Webhook: no order found for payment {PaymentId}", paymentId);
            return Ok();
        }

        var newStatus = mpStatus switch
        {
            "approved" => OrderStatus.Paid,
            "rejected" => OrderStatus.PaymentFailed,
            "pending" or "in_process" => OrderStatus.PendingPayment,
            _ => order.Status
        };

        // Idempotency check
        if (order.Status == newStatus)
            return Ok();

        order.Status = newStatus;
        order.MercadoPagoPaymentId = paymentId;
        order.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        if (newStatus == OrderStatus.Paid && order.User?.Email is not null)
        {
            _ = Task.Run(async () =>
            {
                try { await emailService.SendOrderConfirmationAsync(order.User.Email, order.Id); }
                catch (Exception ex) { logger.LogError(ex, "Failed to send order confirmation for {OrderId}", order.Id); }
            });
        }

        return Ok();
    }

    private static string ComputeHmac(string secret, string payload)
    {
        var keyBytes = Encoding.UTF8.GetBytes(secret);
        var payloadBytes = Encoding.UTF8.GetBytes(payload);
        var hash = HMACSHA256.HashData(keyBytes, payloadBytes);
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    private class WebhookNotification
    {
        public string? Action { get; set; }
        public WebhookData? Data { get; set; }
    }

    private class WebhookData
    {
        public string? Id { get; set; }
    }
}
