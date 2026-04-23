namespace Filamorfosis.Domain.Entities;

public enum OrderStatus
{
    Pending,
    PendingPayment,
    Paid,
    Preparing,
    Shipped,
    Delivered,
    Cancelled,
    PaymentFailed
}
