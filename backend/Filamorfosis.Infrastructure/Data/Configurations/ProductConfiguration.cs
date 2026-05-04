using System.Text.Json;
using Filamorfosis.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Filamorfosis.Infrastructure.Data.Configurations;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        var jsonOptions = new JsonSerializerOptions();
        var stringListConverter = new ValueConverter<string[], string>(
            v => JsonSerializer.Serialize(v, jsonOptions),
            v => JsonSerializer.Deserialize<string[]>(v, jsonOptions) ?? Array.Empty<string>());

        var stringArrayComparer = new ValueComparer<string[]>(
            (a, b) => a != null && b != null && a.SequenceEqual(b),
            v => v.Aggregate(0, (acc, s) => HashCode.Combine(acc, s.GetHashCode())),
            v => v.ToArray());

        // Configure Tags as JSON TEXT
        builder.Property(p => p.Tags)
            .HasConversion(stringListConverter, stringArrayComparer)
            .HasColumnType("TEXT");

        // Configure UseCases as JSON TEXT (SQLite compatibility)
        builder.Property(p => p.UseCases)
            .HasColumnName("use_cases")
            .HasConversion(stringListConverter, stringArrayComparer)
            .HasColumnType("TEXT")
            .IsRequired();
    }
}
