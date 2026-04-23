namespace Filamorfosis.Infrastructure.Services;

public interface IEmailService
{
    Task SendWelcomeAsync(string toEmail, string firstName);
    Task SendPasswordResetAsync(string toEmail, string resetToken);
    Task SendOrderConfirmationAsync(string toEmail, Guid orderId);
    Task SendShipmentNotificationAsync(string toEmail, Guid orderId);
}
