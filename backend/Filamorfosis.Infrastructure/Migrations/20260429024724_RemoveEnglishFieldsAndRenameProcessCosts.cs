using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Filamorfosis.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveEnglishFieldsAndRenameProcessCosts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CostParameters");

            migrationBuilder.DropColumn(
                name: "PrintType",
                table: "ProductVariants");

            migrationBuilder.DropColumn(
                name: "WeightGrams",
                table: "ProductVariants");

            migrationBuilder.DropColumn(
                name: "DescriptionEn",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "TitleEn",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "NameEn",
                table: "Processes");

            migrationBuilder.DropColumn(
                name: "ProductTitleEn",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "VariantLabelEn",
                table: "OrderItems");

            // Add StockQuantity column to Materials if it doesn't exist
            migrationBuilder.AddColumn<int>(
                name: "StockQuantity",
                table: "Materials",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            // Add ManualBaseCost column to Materials if it doesn't exist
            migrationBuilder.AddColumn<decimal>(
                name: "ManualBaseCost",
                table: "Materials",
                type: "TEXT",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateTable(
                name: "ProcessesCosts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    ProcessId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Key = table.Column<string>(type: "TEXT", nullable: false),
                    Label = table.Column<string>(type: "TEXT", nullable: false),
                    Unit = table.Column<string>(type: "TEXT", nullable: false),
                    Value = table.Column<decimal>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProcessesCosts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProcessesCosts_Processes_ProcessId",
                        column: x => x.ProcessId,
                        principalTable: "Processes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MaterialSupplyUsages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    MaterialId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ProcessCostId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Quantity = table.Column<decimal>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MaterialSupplyUsages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MaterialSupplyUsages_Materials_MaterialId",
                        column: x => x.MaterialId,
                        principalTable: "Materials",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MaterialSupplyUsages_ProcessesCosts_ProcessCostId",
                        column: x => x.ProcessCostId,
                        principalTable: "ProcessesCosts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MaterialSupplyUsages_MaterialId_ProcessCostId",
                table: "MaterialSupplyUsages",
                columns: new[] { "MaterialId", "ProcessCostId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MaterialSupplyUsages_ProcessCostId",
                table: "MaterialSupplyUsages",
                column: "ProcessCostId");

            migrationBuilder.CreateIndex(
                name: "IX_ProcessesCosts_ProcessId_Key",
                table: "ProcessesCosts",
                columns: new[] { "ProcessId", "Key" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MaterialSupplyUsages_ProcessesCosts_ProcessCostId",
                table: "MaterialSupplyUsages");

            migrationBuilder.DropTable(
                name: "ProcessesCosts");

            migrationBuilder.RenameColumn(
                name: "ProcessCostId",
                table: "MaterialSupplyUsages",
                newName: "CostParameterId");

            migrationBuilder.RenameIndex(
                name: "IX_MaterialSupplyUsages_ProcessCostId",
                table: "MaterialSupplyUsages",
                newName: "IX_MaterialSupplyUsages_CostParameterId");

            migrationBuilder.RenameIndex(
                name: "IX_MaterialSupplyUsages_MaterialId_ProcessCostId",
                table: "MaterialSupplyUsages",
                newName: "IX_MaterialSupplyUsages_MaterialId_CostParameterId");

            migrationBuilder.AddColumn<string>(
                name: "PrintType",
                table: "ProductVariants",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "WeightGrams",
                table: "ProductVariants",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DescriptionEn",
                table: "Products",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TitleEn",
                table: "Products",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "NameEn",
                table: "Processes",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ProductTitleEn",
                table: "OrderItems",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "VariantLabelEn",
                table: "OrderItems",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "CostParameters",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    ProcessId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Key = table.Column<string>(type: "TEXT", nullable: false),
                    Label = table.Column<string>(type: "TEXT", nullable: false),
                    Unit = table.Column<string>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Value = table.Column<decimal>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CostParameters", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CostParameters_Processes_ProcessId",
                        column: x => x.ProcessId,
                        principalTable: "Processes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CostParameters_ProcessId_Key",
                table: "CostParameters",
                columns: new[] { "ProcessId", "Key" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_MaterialSupplyUsages_CostParameters_CostParameterId",
                table: "MaterialSupplyUsages",
                column: "CostParameterId",
                principalTable: "CostParameters",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
