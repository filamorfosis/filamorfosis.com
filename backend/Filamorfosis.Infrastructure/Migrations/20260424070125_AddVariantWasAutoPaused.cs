using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Filamorfosis.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddVariantWasAutoPaused : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "WasAutoPaused",
                table: "ProductVariants",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "WasAutoPaused",
                table: "ProductVariants");
        }
    }
}
