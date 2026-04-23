using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Filamorfosis.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCostManagement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Drop the old string Material column added by AddVariantMaterial migration
            migrationBuilder.DropColumn(
                name: "Material",
                table: "ProductVariants");

            // Create Materials table
            migrationBuilder.CreateTable(
                name: "Materials",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Category = table.Column<string>(type: "TEXT", nullable: false),
                    SizeLabel = table.Column<string>(type: "TEXT", nullable: true),
                    WidthCm = table.Column<decimal>(type: "TEXT", nullable: true),
                    HeightCm = table.Column<decimal>(type: "TEXT", nullable: true),
                    WeightGrams = table.Column<int>(type: "INTEGER", nullable: true),
                    BaseCost = table.Column<decimal>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Materials", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Materials_Name",
                table: "Materials",
                column: "Name");

            // Create CostParameters table
            migrationBuilder.CreateTable(
                name: "CostParameters",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Category = table.Column<string>(type: "TEXT", nullable: false),
                    Key = table.Column<string>(type: "TEXT", nullable: false),
                    Label = table.Column<string>(type: "TEXT", nullable: false),
                    Value = table.Column<decimal>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CostParameters", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CostParameters_Category_Key",
                table: "CostParameters",
                columns: new[] { "Category", "Key" },
                unique: true);

            // Create GlobalParameters table
            migrationBuilder.CreateTable(
                name: "GlobalParameters",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Key = table.Column<string>(type: "TEXT", nullable: false),
                    Label = table.Column<string>(type: "TEXT", nullable: false),
                    Value = table.Column<string>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GlobalParameters", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_GlobalParameters_Key",
                table: "GlobalParameters",
                column: "Key",
                unique: true);

            // Add new cost columns to ProductVariants
            migrationBuilder.AddColumn<Guid>(
                name: "MaterialId",
                table: "ProductVariants",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "BaseCost",
                table: "ProductVariants",
                type: "TEXT",
                nullable: false);

            migrationBuilder.AddColumn<decimal>(
                name: "Profit",
                table: "ProductVariants",
                type: "TEXT",
                nullable: false);

            migrationBuilder.AddColumn<int>(
                name: "ManufactureTimeMinutes",
                table: "ProductVariants",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "FilamentGrams",
                table: "ProductVariants",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PrintType",
                table: "ProductVariants",
                type: "TEXT",
                nullable: true);

            // FK from ProductVariants.MaterialId → Materials.Id (ON DELETE SET NULL)
            migrationBuilder.CreateIndex(
                name: "IX_ProductVariants_MaterialId",
                table: "ProductVariants",
                column: "MaterialId");

            migrationBuilder.AddForeignKey(
                name: "FK_ProductVariants_Materials_MaterialId",
                table: "ProductVariants",
                column: "MaterialId",
                principalTable: "Materials",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            // Seed CostParameters
            var seedDate = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);

            migrationBuilder.InsertData(
                table: "CostParameters",
                columns: new[] { "Id", "Category", "Key", "Label", "Value", "UpdatedAt" },
                values: new object[,]
                {
                    // UV Printing
                    { new Guid("a1000001-0000-0000-0000-000000000001"), "UV Printing", "electric_cost_per_hour", "Electric cost per hour (MXN/hr)", 0m, seedDate },
                    { new Guid("a1000001-0000-0000-0000-000000000002"), "UV Printing", "ink_cost_flat_per_cm2", "Ink cost per cm\u00b2 for flat print (MXN/cm\u00b2)", 0m, seedDate },
                    { new Guid("a1000001-0000-0000-0000-000000000003"), "UV Printing", "ink_cost_relief_per_cm2", "Ink cost per cm\u00b2 for relief print (MXN/cm\u00b2)", 0m, seedDate },
                    // 3D Printing
                    { new Guid("a1000002-0000-0000-0000-000000000001"), "3D Printing", "filament_cost_per_gram", "Filament cost per gram (MXN/g)", 0m, seedDate },
                    { new Guid("a1000002-0000-0000-0000-000000000002"), "3D Printing", "electric_cost_per_hour", "Electric cost per hour (MXN/hr)", 0m, seedDate },
                    // Laser Engraving
                    { new Guid("a1000003-0000-0000-0000-000000000001"), "Laser Engraving", "electric_cost_per_hour", "Electric cost per hour (MXN/hr)", 0m, seedDate },
                    // Laser Cutting
                    { new Guid("a1000004-0000-0000-0000-000000000001"), "Laser Cutting", "electric_cost_per_hour", "Electric cost per hour (MXN/hr)", 0m, seedDate },
                    // Photo Printing
                    { new Guid("a1000005-0000-0000-0000-000000000001"), "Photo Printing", "paper_cost_per_cm2", "Paper cost per cm\u00b2 (MXN/cm\u00b2)", 0m, seedDate },
                    { new Guid("a1000005-0000-0000-0000-000000000002"), "Photo Printing", "ink_cost_per_cm2", "Ink cost per cm\u00b2 (MXN/cm\u00b2)", 0m, seedDate },
                    { new Guid("a1000005-0000-0000-0000-000000000003"), "Photo Printing", "electric_cost_per_hour", "Electric cost per hour (MXN/hr)", 0m, seedDate }
                });

            // Seed GlobalParameters
            migrationBuilder.InsertData(
                table: "GlobalParameters",
                columns: new[] { "Id", "Key", "Label", "Value", "UpdatedAt" },
                values: new object[] { new Guid("b0000001-0000-0000-0000-000000000001"), "tax_rate", "IVA (%)", "0.16", seedDate });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "GlobalParameters",
                keyColumn: "Id",
                keyValue: new Guid("b0000001-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                table: "CostParameters",
                keyColumn: "Id",
                keyValues: new object[]
                {
                    new Guid("a1000001-0000-0000-0000-000000000001"),
                    new Guid("a1000001-0000-0000-0000-000000000002"),
                    new Guid("a1000001-0000-0000-0000-000000000003"),
                    new Guid("a1000002-0000-0000-0000-000000000001"),
                    new Guid("a1000002-0000-0000-0000-000000000002"),
                    new Guid("a1000003-0000-0000-0000-000000000001"),
                    new Guid("a1000004-0000-0000-0000-000000000001"),
                    new Guid("a1000005-0000-0000-0000-000000000001"),
                    new Guid("a1000005-0000-0000-0000-000000000002"),
                    new Guid("a1000005-0000-0000-0000-000000000003")
                });

            migrationBuilder.DropForeignKey(
                name: "FK_ProductVariants_Materials_MaterialId",
                table: "ProductVariants");

            migrationBuilder.DropIndex(
                name: "IX_ProductVariants_MaterialId",
                table: "ProductVariants");

            migrationBuilder.DropColumn(name: "MaterialId", table: "ProductVariants");
            migrationBuilder.DropColumn(name: "BaseCost", table: "ProductVariants");
            migrationBuilder.DropColumn(name: "Profit", table: "ProductVariants");
            migrationBuilder.DropColumn(name: "ManufactureTimeMinutes", table: "ProductVariants");
            migrationBuilder.DropColumn(name: "FilamentGrams", table: "ProductVariants");
            migrationBuilder.DropColumn(name: "PrintType", table: "ProductVariants");

            migrationBuilder.DropTable(name: "GlobalParameters");
            migrationBuilder.DropTable(name: "CostParameters");
            migrationBuilder.DropTable(name: "Materials");

            // Restore the old string Material column
            migrationBuilder.AddColumn<string>(
                name: "Material",
                table: "ProductVariants",
                type: "TEXT",
                nullable: true,
                defaultValue: null);
        }
    }
}
