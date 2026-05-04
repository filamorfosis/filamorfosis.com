using System.Text.Json;
using Filamorfosis.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Filamorfosis.Infrastructure.Data.Configurations;

public class ProductVariantConfiguration : IEntityTypeConfiguration<ProductVariant>
{
    public void Configure(EntityTypeBuilder<ProductVariant> builder)
    {
        var jsonOptions = new JsonSerializerOptions();
        var stringListConverter = new ValueConverter<string[], string>(
            v => JsonSerializer.Serialize(v, jsonOptions),
            v => JsonSerializer.Deserialize<string[]>(v, jsonOptions) ?? Array.Empty<string>());

        var stringArrayComparer = new ValueComparer<string[]>(
            (a, b) => a != null && b != null && a.SequenceEqual(b),
            v => v.Aggregate(0, (acc, s) => HashCode.Combine(acc, s.GetHashCode())),
            v => v.ToArray());

        // Configure ImageUrls as JSON TEXT
        builder.Property(v => v.ImageUrls)
            .HasConversion(stringListConverter, stringArrayComparer)
            .HasColumnType("TEXT")
            .HasDefaultValue(Array.Empty<string>());
    }
}
