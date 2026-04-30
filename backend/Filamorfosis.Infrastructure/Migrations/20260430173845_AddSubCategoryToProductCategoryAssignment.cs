using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Filamorfosis.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSubCategoryToProductCategoryAssignment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "SubCategoryId",
                table: "ProductCategoryAssignments",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProductCategoryAssignments_SubCategoryId",
                table: "ProductCategoryAssignments",
                column: "SubCategoryId");

            migrationBuilder.AddForeignKey(
                name: "FK_ProductCategoryAssignments_ProductSubCategories_SubCategoryId",
                table: "ProductCategoryAssignments",
                column: "SubCategoryId",
                principalTable: "ProductSubCategories",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProductCategoryAssignments_ProductSubCategories_SubCategoryId",
                table: "ProductCategoryAssignments");

            migrationBuilder.DropIndex(
                name: "IX_ProductCategoryAssignments_SubCategoryId",
                table: "ProductCategoryAssignments");

            migrationBuilder.DropColumn(
                name: "SubCategoryId",
                table: "ProductCategoryAssignments");
        }
    }
}
