using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Filamorfosis.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class DropVariantUnusedColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "FilamentGrams", table: "ProductVariants");
            migrationBuilder.DropColumn(name: "LabelEn",       table: "ProductVariants");
            migrationBuilder.DropColumn(name: "SizeLabel",     table: "ProductVariants");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SizeLabel", table: "ProductVariants",
                type: "TEXT", nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LabelEn", table: "ProductVariants",
                type: "TEXT", nullable: false, defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "FilamentGrams", table: "ProductVariants",
                type: "TEXT", nullable: true);
        }
    }
}
