using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Filamorfosis.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddVariantSupplyUsage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "VariantSupplyUsages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    VariantId = table.Column<Guid>(type: "TEXT", nullable: false),
                    CostParameterId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Quantity = table.Column<decimal>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VariantSupplyUsages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VariantSupplyUsages_CostParameters_CostParameterId",
                        column: x => x.CostParameterId,
                        principalTable: "CostParameters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_VariantSupplyUsages_ProductVariants_VariantId",
                        column: x => x.VariantId,
                        principalTable: "ProductVariants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_VariantSupplyUsages_CostParameterId",
                table: "VariantSupplyUsages",
                column: "CostParameterId");

            migrationBuilder.CreateIndex(
                name: "IX_VariantSupplyUsages_VariantId_CostParameterId",
                table: "VariantSupplyUsages",
                columns: new[] { "VariantId", "CostParameterId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "VariantSupplyUsages");
        }
    }
}
