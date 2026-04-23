using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Filamorfosis.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ReSeedCostParameters : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "CostParameters",
                keyColumn: "Id",
                keyValue: new Guid("a1000001-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                table: "CostParameters",
                keyColumn: "Id",
                keyValue: new Guid("a1000002-0000-0000-0000-000000000002"));

            migrationBuilder.DeleteData(
                table: "CostParameters",
                keyColumn: "Id",
                keyValue: new Guid("a1000003-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                table: "CostParameters",
                keyColumn: "Id",
                keyValue: new Guid("a1000004-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                table: "CostParameters",
                keyColumn: "Id",
                keyValue: new Guid("a1000005-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                table: "CostParameters",
                keyColumn: "Id",
                keyValue: new Guid("a1000005-0000-0000-0000-000000000003"));

            migrationBuilder.UpdateData(
                table: "CostParameters",
                keyColumn: "Id",
                keyValue: new Guid("a1000001-0000-0000-0000-000000000002"),
                columns: new[] { "Label", "Unit" },
                values: new object[] { "Costo de tinta plana por cm²", "MXN/cm²" });

            migrationBuilder.UpdateData(
                table: "CostParameters",
                keyColumn: "Id",
                keyValue: new Guid("a1000001-0000-0000-0000-000000000003"),
                columns: new[] { "Label", "Unit" },
                values: new object[] { "Costo de tinta relieve por cm²", "MXN/cm²" });

            migrationBuilder.UpdateData(
                table: "CostParameters",
                keyColumn: "Id",
                keyValue: new Guid("a1000002-0000-0000-0000-000000000001"),
                columns: new[] { "Category", "Key", "Label", "Unit" },
                values: new object[] { "Impresión 3D", "filament_pla_per_gram", "Filamento PLA por gramo", "MXN/g" });

            migrationBuilder.UpdateData(
                table: "CostParameters",
                keyColumn: "Id",
                keyValue: new Guid("a1000005-0000-0000-0000-000000000002"),
                columns: new[] { "Category", "Label", "Unit" },
                values: new object[] { "Impresión de Fotos", "Costo de tinta por cm²", "MXN/cm²" });

            migrationBuilder.InsertData(
                table: "CostParameters",
                columns: new[] { "Id", "Category", "Key", "Label", "Unit", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("a1000002-0000-0000-0000-000000000003"), "Impresión 3D", "filament_petg_per_gram", "Filamento PETG por gramo", "MXN/g", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 0m },
                    { new Guid("a1000002-0000-0000-0000-000000000004"), "Impresión 3D", "filament_tpu_per_gram", "Filamento TPU por gramo", "MXN/g", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 0m },
                    { new Guid("a1000005-0000-0000-0000-000000000004"), "Impresión de Fotos", "paper_10x15_per_sheet", "Papel 10×15 cm por hoja", "MXN/hoja", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 0m },
                    { new Guid("a1000005-0000-0000-0000-000000000005"), "Impresión de Fotos", "paper_a4_per_sheet", "Papel A4 por hoja", "MXN/hoja", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 0m },
                    { new Guid("a1000005-0000-0000-0000-000000000006"), "Impresión de Fotos", "paper_a3_per_sheet", "Papel A3 por hoja", "MXN/hoja", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 0m }
                });

            migrationBuilder.InsertData(
                table: "GlobalParameters",
                columns: new[] { "Id", "Key", "Label", "UpdatedAt", "Value" },
                values: new object[] { new Guid("b0000001-0000-0000-0000-000000000002"), "electric_cost_per_hour", "Costo eléctrico por hora (MXN/hr)", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "0" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "CostParameters",
                keyColumn: "Id",
                keyValue: new Guid("a1000002-0000-0000-0000-000000000003"));

            migrationBuilder.DeleteData(
                table: "CostParameters",
                keyColumn: "Id",
                keyValue: new Guid("a1000002-0000-0000-0000-000000000004"));

            migrationBuilder.DeleteData(
                table: "CostParameters",
                keyColumn: "Id",
                keyValue: new Guid("a1000005-0000-0000-0000-000000000004"));

            migrationBuilder.DeleteData(
                table: "CostParameters",
                keyColumn: "Id",
                keyValue: new Guid("a1000005-0000-0000-0000-000000000005"));

            migrationBuilder.DeleteData(
                table: "CostParameters",
                keyColumn: "Id",
                keyValue: new Guid("a1000005-0000-0000-0000-000000000006"));

            migrationBuilder.DeleteData(
                table: "GlobalParameters",
                keyColumn: "Id",
                keyValue: new Guid("b0000001-0000-0000-0000-000000000002"));

            migrationBuilder.UpdateData(
                table: "CostParameters",
                keyColumn: "Id",
                keyValue: new Guid("a1000001-0000-0000-0000-000000000002"),
                columns: new[] { "Label", "Unit" },
                values: new object[] { "Costo de tinta plana por cm² (MXN/cm²)", "" });

            migrationBuilder.UpdateData(
                table: "CostParameters",
                keyColumn: "Id",
                keyValue: new Guid("a1000001-0000-0000-0000-000000000003"),
                columns: new[] { "Label", "Unit" },
                values: new object[] { "Costo de tinta relieve por cm² (MXN/cm²)", "" });

            migrationBuilder.UpdateData(
                table: "CostParameters",
                keyColumn: "Id",
                keyValue: new Guid("a1000002-0000-0000-0000-000000000001"),
                columns: new[] { "Category", "Key", "Label", "Unit" },
                values: new object[] { "3D Printing", "filament_cost_per_gram", "Costo de filamento por gramo (MXN/g)", "" });

            migrationBuilder.UpdateData(
                table: "CostParameters",
                keyColumn: "Id",
                keyValue: new Guid("a1000005-0000-0000-0000-000000000002"),
                columns: new[] { "Category", "Label", "Unit" },
                values: new object[] { "Photo Printing", "Costo de tinta por cm² (MXN/cm²)", "" });

            migrationBuilder.InsertData(
                table: "CostParameters",
                columns: new[] { "Id", "Category", "Key", "Label", "Unit", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("a1000001-0000-0000-0000-000000000001"), "UV Printing", "electric_cost_per_hour", "Costo eléctrico por hora (MXN/hr)", "", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 0m },
                    { new Guid("a1000002-0000-0000-0000-000000000002"), "3D Printing", "electric_cost_per_hour", "Costo eléctrico por hora (MXN/hr)", "", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 0m },
                    { new Guid("a1000003-0000-0000-0000-000000000001"), "Laser Engraving", "electric_cost_per_hour", "Costo eléctrico por hora (MXN/hr)", "", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 0m },
                    { new Guid("a1000004-0000-0000-0000-000000000001"), "Laser Cutting", "electric_cost_per_hour", "Costo eléctrico por hora (MXN/hr)", "", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 0m },
                    { new Guid("a1000005-0000-0000-0000-000000000001"), "Photo Printing", "paper_cost_per_cm2", "Costo de papel por cm² (MXN/cm²)", "", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 0m },
                    { new Guid("a1000005-0000-0000-0000-000000000003"), "Photo Printing", "electric_cost_per_hour", "Costo eléctrico por hora (MXN/hr)", "", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 0m }
                });
        }
    }
}
