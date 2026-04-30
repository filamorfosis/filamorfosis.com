using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Filamorfosis.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateProductCategoryAssignmentPrimaryKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProductCategoryAssignments_ProductSubCategories_SubCategoryId",
                table: "ProductCategoryAssignments");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ProductCategoryAssignments",
                table: "ProductCategoryAssignments");

            migrationBuilder.AlterColumn<Guid>(
                name: "SubCategoryId",
                table: "ProductCategoryAssignments",
                type: "TEXT",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "TEXT",
                oldNullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_ProductCategoryAssignments",
                table: "ProductCategoryAssignments",
                columns: new[] { "ProductId", "CategoryId", "SubCategoryId" });

            migrationBuilder.AddForeignKey(
                name: "FK_ProductCategoryAssignments_ProductSubCategories_SubCategoryId",
                table: "ProductCategoryAssignments",
                column: "SubCategoryId",
                principalTable: "ProductSubCategories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProductCategoryAssignments_ProductSubCategories_SubCategoryId",
                table: "ProductCategoryAssignments");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ProductCategoryAssignments",
                table: "ProductCategoryAssignments");

            migrationBuilder.AlterColumn<Guid>(
                name: "SubCategoryId",
                table: "ProductCategoryAssignments",
                type: "TEXT",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "TEXT");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ProductCategoryAssignments",
                table: "ProductCategoryAssignments",
                columns: new[] { "ProductId", "CategoryId" });

            migrationBuilder.AddForeignKey(
                name: "FK_ProductCategoryAssignments_ProductSubCategories_SubCategoryId",
                table: "ProductCategoryAssignments",
                column: "SubCategoryId",
                principalTable: "ProductSubCategories",
                principalColumn: "Id");
        }
    }
}
