using Microsoft.Extensions.Logging;

namespace Filamorfosis.Infrastructure.Services;

/// <summary>
/// No-op email service used in tests and local dev when SES is not configured.
/// </summary>
public class NoOpEmailService(ILogger<NoOpEmailService> logger) : IEmailService
{
    public Task SendWelcomeAsync(string toEmail, string firstName)
    {
        logger.LogInformation("[NoOp] Welcome email to {Email}", toEmail);
        return Task.CompletedTask;
    }

    public Task SendPasswordResetAsync(string toEmail, string resetToken)
    {
        logger.LogInformation("[NoOp] Password reset email to {Email}", toEmail);
        return Task.CompletedTask;
    }

    public Task SendOrderConfirmationAsync(string toEmail, Guid orderId)
    {
        logger.LogInformation("[NoOp] Order confirmation email to {Email} for order {OrderId}", toEmail, orderId);
        return Task.CompletedTask;
    }

    public Task SendShipmentNotificationAsync(string toEmail, Guid orderId)
    {
        logger.LogInformation("[NoOp] Shipment notification email to {Email} for order {OrderId}", toEmail, orderId);
        return Task.CompletedTask;
    }
}
