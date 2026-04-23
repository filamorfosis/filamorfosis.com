using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Filamorfosis.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class CostParameterCategoryFk : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Add CategoryId column (nullable first)
            migrationBuilder.AddColumn<Guid>(
                name: "CategoryId",
                table: "CostParameters",
                type: "TEXT",
                nullable: true);

            // 2. Populate from Categories.NameEs match
            migrationBuilder.Sql(@"
                UPDATE CostParameters
                SET CategoryId = (
                    SELECT Id FROM Categories WHERE NameEs = CostParameters.Category LIMIT 1
                )
                WHERE CategoryId IS NULL;
            ");

            // 3. Delete rows with no match
            migrationBuilder.Sql("DELETE FROM CostParameters WHERE CategoryId IS NULL;");

            // 4. Make NOT NULL
            migrationBuilder.AlterColumn<Guid>(
                name: "CategoryId",
                table: "CostParameters",
                type: "TEXT",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "TEXT",
                oldNullable: true);

            // 5. Drop old Category string column
            migrationBuilder.DropColumn(name: "Category", table: "CostParameters");

            // 6. Drop old unique index on (Category, Key)
            migrationBuilder.DropIndex(
                name: "IX_CostParameters_Category_Key",
                table: "CostParameters");

            // 7. Add new FK index and unique index on (CategoryId, Key)
            migrationBuilder.CreateIndex(
                name: "IX_CostParameters_CategoryId_Key",
                table: "CostParameters",
                columns: new[] { "CategoryId", "Key" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_CostParameters_Categories_CategoryId",
                table: "CostParameters",
                column: "CategoryId",
                principalTable: "Categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CostParameters_Categories_CategoryId",
                table: "CostParameters");

            migrationBuilder.DropIndex(
                name: "IX_CostParameters_CategoryId_Key",
                table: "CostParameters");

            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "CostParameters",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.Sql(@"
                UPDATE CostParameters
                SET Category = (
                    SELECT NameEs FROM Categories WHERE Id = CostParameters.CategoryId LIMIT 1
                );
            ");

            migrationBuilder.DropColumn(name: "CategoryId", table: "CostParameters");

            migrationBuilder.CreateIndex(
                name: "IX_CostParameters_Category_Key",
                table: "CostParameters",
                columns: new[] { "Category", "Key" },
                unique: true);
        }
    }
}
