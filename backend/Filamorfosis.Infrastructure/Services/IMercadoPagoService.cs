using Filamorfosis.Domain.Entities;

namespace Filamorfosis.Infrastructure.Services;

public interface IMercadoPagoService
{
    Task<(string preferenceId, string checkoutUrl)> CreatePreferenceAsync(Order order, string frontendBase);
    Task<string?> GetPaymentStatusAsync(string paymentId);
}
