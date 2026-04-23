using Filamorfosis.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace Filamorfosis.Infrastructure.Services;

/// <summary>
/// No-op MercadoPago service for local dev and tests.
/// </summary>
public class NoOpMercadoPagoService(ILogger<NoOpMercadoPagoService> logger) : IMercadoPagoService
{
    public Task<(string preferenceId, string checkoutUrl)> CreatePreferenceAsync(Order order, string frontendBase)
    {
        logger.LogInformation("[NoOp] MP preference for order {OrderId}", order.Id);
        var fakeId = $"fake-pref-{order.Id}";
        var fakeUrl = $"https://sandbox.mercadopago.com/checkout/v1/redirect?pref_id={fakeId}";
        return Task.FromResult((fakeId, fakeUrl));
    }

    public Task<string?> GetPaymentStatusAsync(string paymentId)
    {
        logger.LogInformation("[NoOp] MP get payment status for {PaymentId}", paymentId);
        return Task.FromResult<string?>("approved");
    }
}
