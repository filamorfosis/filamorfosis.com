// Feature: online-store — Custom FsCheck Arbitrary generators for domain entities
// Used across all property test files to produce well-formed test data.

using Filamorfosis.Domain.Entities;
using FsCheck;
using FsCheck.Fluent;

namespace Filamorfosis.Tests.Infrastructure;

/// <summary>
/// FsCheck Arbitrary generators for Filamorfosis domain entities.
/// Register via <c>Arb.Register&lt;FilamorfosisGenerators&gt;()</c> or use
/// <c>Arb.From(FilamorfosisGenerators.XxxGen())</c> directly in property tests.
/// </summary>
public static class FilamorfosisGenerators
{
    // ── Primitive helpers ────────────────────────────────────────────────────

    private static Gen<string> NonEmptyStringGen(int maxLen = 40) =>
        Gen.Choose(3, maxLen)
           .SelectMany(len => Gen.Choose(0, 35).ListOf(len))
           .Select(indices =>
           {
               const string chars = "abcdefghijklmnopqrstuvwxyz0123456789";
               return new string(indices.Select(i => chars[i % chars.Length]).ToArray());
           });

    private static Gen<string> EmailGen() =>
        Gen.Choose(1, 99999).Select(n => $"gen{n}@filamorfosis-test.com");

    private static Gen<decimal> PriceGen() =>
        Gen.Choose(50, 50000).Select(n => (decimal)n / 100m);   // 0.50 – 500.00 MXN

    private static Gen<int> PositiveIntGen(int max = 100) =>
        Gen.Choose(1, max);

    // ── Process ─────────────────────────────────────────────────────────────

    public static Gen<Process> ProcessGen() =>
        NonEmptyStringGen(20).SelectMany(slug =>
        NonEmptyStringGen(30).Select(nameEs =>
        {
            var id = Guid.NewGuid();
            return new Process
            {
                Id       = id,
                Slug     = $"{slug}-{id:N}",
                NameEs   = nameEs,
                ImageUrl = null
            };
        }));

    public static Arbitrary<Process> ProcessArb() => Arb.From(ProcessGen());

    // ── ProductVariant ───────────────────────────────────────────────────────

    public static Gen<ProductVariant> ProductVariantGen(Guid productId) =>
        PriceGen().SelectMany(price =>
        PositiveIntGen(200).SelectMany(stock =>
        Gen.Elements(true, false).SelectMany(isAvailable =>
        Gen.Elements(true, false).Select(acceptsDesign =>
        {
            var id = Guid.NewGuid();
            return new ProductVariant
            {
                Id               = id,
                ProductId        = productId,
                Sku              = $"SKU-{id:N[..8]}",
                LabelEs          = $"Variante {id:N[..4]}",
                Price            = price,
                IsAvailable      = isAvailable,
                AcceptsDesignFile = acceptsDesign,
                StockQuantity    = stock
            };
        }))));

    // ── Product ──────────────────────────────────────────────────────────────

    public static Gen<Product> ProductGen(Guid processId, int variantCount = 2) =>
        NonEmptyStringGen(30).SelectMany(titleEs =>
        Gen.Elements(true, false).Select(isActive =>
        {
            var id = Guid.NewGuid();
            var variants = Enumerable.Range(0, variantCount)
                .Select(_ => ProductVariantGen(id).Sample(0, 1).First())
                .ToList();

            return new Product
            {
                Id            = id,
                ProcessId    = processId,
                Slug          = $"product-{id:N}",
                TitleEs       = titleEs,
                DescriptionEs = $"Descripción de {titleEs}",
                Tags          = [],
                IsActive      = isActive,
                CreatedAt     = DateTime.UtcNow,
                Variants      = variants
            };
        }));

    public static Arbitrary<Product> ProductArb() => Arb.From(ProductGen(Guid.NewGuid()));

    // ── Cart ─────────────────────────────────────────────────────────────────

    public static Gen<Cart> GuestCartGen() =>
        Gen.Choose(0, 5).Select(itemCount =>
        {
            var id = Guid.NewGuid();
            return new Cart
            {
                Id         = id,
                UserId     = null,
                GuestToken = Guid.NewGuid().ToString("N"),
                UpdatedAt  = DateTime.UtcNow,
                ExpiresAt  = DateTime.UtcNow.AddDays(30),
                Items      = new List<CartItem>()
            };
        });

    public static Gen<Cart> UserCartGen(Guid userId) =>
        Gen.Constant(new Cart
        {
            Id        = Guid.NewGuid(),
            UserId    = userId,
            UpdatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(365),
            Items     = new List<CartItem>()
        });

    public static Arbitrary<Cart> GuestCartArb() => Arb.From(GuestCartGen());

    // ── CartItem ─────────────────────────────────────────────────────────────

    public static Gen<CartItem> CartItemGen(Guid cartId, Guid variantId) =>
        PositiveIntGen(10).Select(qty => new CartItem
        {
            Id               = Guid.NewGuid(),
            CartId           = cartId,
            ProductVariantId = variantId,
            Quantity         = qty,
            CustomizationNotes = null,
            DesignFileId     = null
        });

    public static Arbitrary<CartItem> CartItemArb(Guid cartId, Guid variantId) =>
        Arb.From(CartItemGen(cartId, variantId));

    // ── Order ────────────────────────────────────────────────────────────────

    public static Gen<Order> OrderGen(Guid userId, Guid addressId) =>
        PriceGen().Select(total => new Order
        {
            Id                = Guid.NewGuid(),
            UserId            = userId,
            ShippingAddressId = addressId,
            Notes             = null,
            Total             = total,
            Status            = Domain.Entities.OrderStatus.Pending,
            CreatedAt         = DateTime.UtcNow,
            UpdatedAt         = DateTime.UtcNow,
            Items             = new List<OrderItem>()
        });

    public static Arbitrary<Order> OrderArb(Guid userId, Guid addressId) =>
        Arb.From(OrderGen(userId, addressId));

    // ── User (lightweight — Identity manages the real entity) ────────────────

    public static Gen<(string email, string password, string firstName, string lastName)> ValidUserGen() =>
        EmailGen().SelectMany(email =>
        Gen.Elements("Password1", "Secure2Pass", "Hello3World", "Test4Valid").SelectMany(pwd =>
        NonEmptyStringGen(15).SelectMany(first =>
        NonEmptyStringGen(15).Select(last =>
            (email, pwd, first, last)))));

    public static Arbitrary<(string email, string password, string firstName, string lastName)> ValidUserArb() =>
        Arb.From(ValidUserGen());
}

/// <summary>
/// FsCheck Arbitrary registration class — pass to <c>[Property(Arbitrary = new[] { typeof(FilamorfosisArbitraries) })]</c>
/// to auto-register all generators.
/// </summary>
public class FilamorfosisArbitraries
{
    public static Arbitrary<Process>     Process()  => FilamorfosisGenerators.ProcessArb();
    public static Arbitrary<Product>      Product()   => FilamorfosisGenerators.ProductArb();
    public static Arbitrary<Cart>         Cart()      => FilamorfosisGenerators.GuestCartArb();
}
