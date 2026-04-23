using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Filamorfosis.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddVariantAttributeProductId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_VariantAttributeValues_VariantId_AttributeDefinitionId",
                table: "VariantAttributeValues");

            migrationBuilder.AddColumn<Guid>(
                name: "ProductId",
                table: "VariantAttributeValues",
                type: "TEXT",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_VariantAttributeValues_ProductId_VariantId_AttributeDefinitionId",
                table: "VariantAttributeValues",
                columns: new[] { "ProductId", "VariantId", "AttributeDefinitionId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_VariantAttributeValues_VariantId",
                table: "VariantAttributeValues",
                column: "VariantId");

            migrationBuilder.AddForeignKey(
                name: "FK_VariantAttributeValues_Products_ProductId",
                table: "VariantAttributeValues",
                column: "ProductId",
                principalTable: "Products",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_VariantAttributeValues_Products_ProductId",
                table: "VariantAttributeValues");

            migrationBuilder.DropIndex(
                name: "IX_VariantAttributeValues_ProductId_VariantId_AttributeDefinitionId",
                table: "VariantAttributeValues");

            migrationBuilder.DropIndex(
                name: "IX_VariantAttributeValues_VariantId",
                table: "VariantAttributeValues");

            migrationBuilder.DropColumn(
                name: "ProductId",
                table: "VariantAttributeValues");

            migrationBuilder.CreateIndex(
                name: "IX_VariantAttributeValues_VariantId_AttributeDefinitionId",
                table: "VariantAttributeValues",
                columns: new[] { "VariantId", "AttributeDefinitionId" },
                unique: true);
        }
    }
}
