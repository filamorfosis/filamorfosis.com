using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Filamorfosis.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddVariantSizeWeight : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SizeLabel",
                table: "ProductVariants",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "WeightGrams",
                table: "ProductVariants",
                type: "INTEGER",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SizeLabel",
                table: "ProductVariants");

            migrationBuilder.DropColumn(
                name: "WeightGrams",
                table: "ProductVariants");
        }
    }
}
