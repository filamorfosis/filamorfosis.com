using System.Text.Json;
using Filamorfosis.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Filamorfosis.Infrastructure.Data;

public class FilamorfosisDbContext(DbContextOptions<FilamorfosisDbContext> options)
    : IdentityDbContext<User, IdentityRole<Guid>, Guid>(options)
{
    public DbSet<Process> Processes => Set<Process>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductVariant> ProductVariants => Set<ProductVariant>();
    public DbSet<Cart> Carts => Set<Cart>();
    public DbSet<CartItem> CartItems => Set<CartItem>();
    public DbSet<DesignFile> DesignFiles => Set<DesignFile>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<Address> Addresses => Set<Address>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();
    public DbSet<AdminMfaSecret> AdminMfaSecrets => Set<AdminMfaSecret>();
    public DbSet<ProcessAttribute> ProcessesAttributes => Set<ProcessAttribute>();
    public DbSet<Discount> Discounts => Set<Discount>();
    public DbSet<AttributeDefinition> AttributeDefinitions => Set<AttributeDefinition>();
    public DbSet<ProductAttributeDefinition> ProductAttributeDefinitions => Set<ProductAttributeDefinition>();
    public DbSet<VariantAttributeValue> VariantAttributeValues => Set<VariantAttributeValue>();
    public DbSet<Material> Materials => Set<Material>();
    public DbSet<CostParameter> CostParameters => Set<CostParameter>();
    public DbSet<GlobalParameter> GlobalParameters => Set<GlobalParameter>();
    public DbSet<MaterialSupplyUsage> MaterialSupplyUsages => Set<MaterialSupplyUsage>();
    public DbSet<VariantMaterialUsage> VariantMaterialUsages => Set<VariantMaterialUsage>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply Product configuration
        modelBuilder.ApplyConfiguration(new Configurations.ProductConfiguration());

        // OrderStatus as TEXT
        modelBuilder.Entity<Order>()
            .Property(o => o.Status)
            .HasConversion<string>()
            .HasColumnType("TEXT");

        // Relationships
        modelBuilder.Entity<User>()
            .HasMany(u => u.Addresses)
            .WithOne(a => a.User)
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<User>()
            .HasMany(u => u.Orders)
            .WithOne(o => o.User)
            .HasForeignKey(o => o.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<User>()
            .HasOne(u => u.Cart)
            .WithOne(c => c.User)
            .HasForeignKey<Cart>(c => c.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Process>()
            .HasMany(c => c.Products)
            .WithOne(p => p.Process)
            .HasForeignKey(p => p.ProcessId);

        modelBuilder.Entity<Cart>()
            .HasMany(c => c.Items)
            .WithOne(i => i.Cart)
            .HasForeignKey(i => i.CartId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<CartItem>()
            .HasOne(ci => ci.Variant)
            .WithMany()
            .HasForeignKey(ci => ci.ProductVariantId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<CartItem>()
            .HasOne(ci => ci.DesignFile)
            .WithMany()
            .HasForeignKey(ci => ci.DesignFileId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Order>()
            .HasMany(o => o.Items)
            .WithOne(i => i.Order)
            .HasForeignKey(i => i.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<OrderItem>()
            .HasOne(oi => oi.Variant)
            .WithMany()
            .HasForeignKey(oi => oi.ProductVariantId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<OrderItem>()
            .HasOne(oi => oi.DesignFile)
            .WithMany()
            .HasForeignKey(oi => oi.DesignFileId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Order>()
            .HasOne(o => o.ShippingAddress)
            .WithMany()
            .HasForeignKey(o => o.ShippingAddressId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<RefreshToken>()
            .HasOne(rt => rt.User)
            .WithMany()
            .HasForeignKey(rt => rt.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<PasswordResetToken>()
            .HasOne(prt => prt.User)
            .WithMany()
            .HasForeignKey(prt => prt.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        modelBuilder.Entity<Cart>()
            .HasIndex(c => c.GuestToken);

        modelBuilder.Entity<Cart>()
            .HasIndex(c => c.UserId);

        modelBuilder.Entity<Order>()
            .HasIndex(o => o.UserId);

        modelBuilder.Entity<Order>()
            .HasIndex(o => o.MercadoPagoPaymentId);

        modelBuilder.Entity<RefreshToken>()
            .HasIndex(rt => rt.Token);

        modelBuilder.Entity<PasswordResetToken>()
            .HasIndex(prt => prt.TokenHash);

        // AdminMfaSecret — one-to-one with User, cascade delete
        modelBuilder.Entity<AdminMfaSecret>()
            .HasOne(m => m.User)
            .WithOne(u => u.MfaSecret)
            .HasForeignKey<AdminMfaSecret>(m => m.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<AdminMfaSecret>()
            .HasIndex(m => m.UserId);

        // ProcessAttribute — many-to-one with Process, cascade delete
        modelBuilder.Entity<ProcessAttribute>()
            .HasOne(a => a.Process)
            .WithMany(c => c.Attributes)
            .HasForeignKey(a => a.ProcessId)
            .OnDelete(DeleteBehavior.Cascade);

        // Discount — optional FK to Product
        modelBuilder.Entity<Discount>()
            .HasOne(d => d.Product)
            .WithMany(p => p.Discounts)
            .HasForeignKey(d => d.ProductId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Cascade);

        // Discount — optional FK to ProductVariant
        modelBuilder.Entity<Discount>()
            .HasOne(d => d.Variant)
            .WithMany(v => v.Discounts)
            .HasForeignKey(d => d.ProductVariantId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Discount>()
            .Property(d => d.Value)
            .HasColumnType("TEXT");

        // AttributeDefinition — no special config needed (simple entity)

        // ProductAttributeDefinition — composite PK + cascade FKs
        modelBuilder.Entity<ProductAttributeDefinition>()
            .HasKey(pa => new { pa.ProductId, pa.AttributeDefinitionId });

        modelBuilder.Entity<ProductAttributeDefinition>()
            .HasOne(pa => pa.Product)
            .WithMany(p => p.AttributeDefinitions)
            .HasForeignKey(pa => pa.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ProductAttributeDefinition>()
            .HasOne(pa => pa.AttributeDefinition)
            .WithMany(a => a.ProductAttributes)
            .HasForeignKey(pa => pa.AttributeDefinitionId)
            .OnDelete(DeleteBehavior.Cascade);

        // VariantAttributeValue — cascade FKs + unique index
        modelBuilder.Entity<VariantAttributeValue>()
            .HasOne(va => va.Product)
            .WithMany()
            .HasForeignKey(va => va.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<VariantAttributeValue>()
            .HasOne(va => va.Variant)
            .WithMany(v => v.AttributeValues)
            .HasForeignKey(va => va.VariantId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<VariantAttributeValue>()
            .HasOne(va => va.AttributeDefinition)
            .WithMany(a => a.VariantValues)
            .HasForeignKey(va => va.AttributeDefinitionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<VariantAttributeValue>()
            .HasIndex(va => new { va.ProductId, va.VariantId, va.AttributeDefinitionId })
            .IsUnique();

        // Material — FK to Process, index on Name
        modelBuilder.Entity<Material>()
            .HasOne(m => m.Process)
            .WithMany()
            .HasForeignKey(m => m.ProcessId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Material>()
            .HasIndex(m => m.Name);

        modelBuilder.Entity<Material>()
            .Property(m => m.StockQuantity).HasDefaultValue(0);

        modelBuilder.Entity<Material>()
            .Property(m => m.ManualBaseCost).HasDefaultValue(0m);

        // MaterialSupplyUsage — FK to Material (cascade) and CostParameter (cascade), unique index
        modelBuilder.Entity<MaterialSupplyUsage>()
            .HasOne(u => u.Material).WithMany(m => m.SupplyUsages)
            .HasForeignKey(u => u.MaterialId).OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<MaterialSupplyUsage>()
            .HasOne(u => u.CostParameter).WithMany()
            .HasForeignKey(u => u.CostParameterId).OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<MaterialSupplyUsage>()
            .HasIndex(u => new { u.MaterialId, u.CostParameterId }).IsUnique();

        // VariantMaterialUsage — FK to Variant (cascade) and Material (restrict), unique index
        modelBuilder.Entity<VariantMaterialUsage>()
            .HasOne(u => u.Variant).WithMany(v => v.MaterialUsages)
            .HasForeignKey(u => u.VariantId).OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<VariantMaterialUsage>()
            .HasOne(u => u.Material).WithMany(m => m.VariantUsages)
            .HasForeignKey(u => u.MaterialId).OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<VariantMaterialUsage>()
            .HasIndex(u => new { u.VariantId, u.MaterialId }).IsUnique();

        // CostParameter — FK to Process, unique index on (ProcessId, Key)
        modelBuilder.Entity<CostParameter>()
            .HasOne(cp => cp.Process)
            .WithMany()
            .HasForeignKey(cp => cp.ProcessId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<CostParameter>()
            .HasIndex(cp => new { cp.ProcessId, cp.Key })
            .IsUnique();

        // GlobalParameter — unique index on Key
        modelBuilder.Entity<GlobalParameter>()
            .HasIndex(gp => gp.Key)
            .IsUnique();

        // Seed data — GlobalParameters
        var seedDate = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        modelBuilder.Entity<GlobalParameter>().HasData(
            new GlobalParameter { Id = new Guid("b0000001-0000-0000-0000-000000000001"), Key = "tax_rate", Label = "IVA (%)", Value = "0.16", UpdatedAt = seedDate },
            new GlobalParameter { Id = new Guid("b0000001-0000-0000-0000-000000000002"), Key = "electric_cost_per_hour", Label = "Costo eléctrico por hora (MXN/hr)", Value = "0", UpdatedAt = seedDate }
        );
    }
}
