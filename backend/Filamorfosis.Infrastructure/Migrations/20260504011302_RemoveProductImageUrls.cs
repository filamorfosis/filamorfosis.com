using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Filamorfosis.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveProductImageUrls : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImageUrls",
                table: "Products");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ImageUrls",
                table: "Products",
                type: "TEXT",
                nullable: false,
                defaultValue: "");
        }
    }
}
