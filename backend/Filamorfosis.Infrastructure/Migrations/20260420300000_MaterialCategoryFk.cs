using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Filamorfosis.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class MaterialCategoryFk : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Add the new CategoryId column (nullable first so existing rows don't fail)
            migrationBuilder.AddColumn<Guid>(
                name: "CategoryId",
                table: "Materials",
                type: "TEXT",
                nullable: true);

            // 2. Populate CategoryId from the existing Category string by matching Category.NameEs.
            //    Delete any rows that don't match (orphaned materials with no valid category).
            migrationBuilder.Sql(@"
                UPDATE Materials
                SET CategoryId = (
                    SELECT Id FROM Categories WHERE NameEs = Materials.Category LIMIT 1
                )
                WHERE CategoryId IS NULL;
            ");

            migrationBuilder.Sql(@"
                DELETE FROM Materials WHERE CategoryId IS NULL;
            ");

            // 3. Drop the old string Category column
            migrationBuilder.DropColumn(
                name: "Category",
                table: "Materials");

            // 4. Make CategoryId NOT NULL now that data is migrated
            migrationBuilder.AlterColumn<Guid>(
                name: "CategoryId",
                table: "Materials",
                type: "TEXT",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "TEXT",
                oldNullable: true);

            // 5. Add FK and index
            migrationBuilder.CreateIndex(
                name: "IX_Materials_CategoryId",
                table: "Materials",
                column: "CategoryId");

            migrationBuilder.AddForeignKey(
                name: "FK_Materials_Categories_CategoryId",
                table: "Materials",
                column: "CategoryId",
                principalTable: "Categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Materials_Categories_CategoryId",
                table: "Materials");

            migrationBuilder.DropIndex(
                name: "IX_Materials_CategoryId",
                table: "Materials");

            // Restore Category string column from the nav property name
            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "Materials",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.Sql(@"
                UPDATE Materials
                SET Category = (
                    SELECT NameEs FROM Categories WHERE Id = Materials.CategoryId LIMIT 1
                );
            ");

            migrationBuilder.DropColumn(
                name: "CategoryId",
                table: "Materials");
        }
    }
}
