using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Filamorfosis.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SimplifyCategorySystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProductCategories_ProductCategories_ParentId",
                table: "ProductCategories");

            migrationBuilder.DropIndex(
                name: "IX_ProductCategories_DisplayOrder",
                table: "ProductCategories");

            migrationBuilder.DropIndex(
                name: "IX_ProductCategories_IsActive",
                table: "ProductCategories");

            migrationBuilder.DropIndex(
                name: "IX_ProductCategories_ParentId",
                table: "ProductCategories");

            migrationBuilder.DropCheckConstraint(
                name: "CK_ProductCategories_NoSelfReference",
                table: "ProductCategories");

            migrationBuilder.DropColumn(
                name: "DisplayOrder",
                table: "ProductCategories");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "ProductCategories");

            migrationBuilder.DropColumn(
                name: "NameDe",
                table: "ProductCategories");

            migrationBuilder.DropColumn(
                name: "NameEn",
                table: "ProductCategories");

            migrationBuilder.DropColumn(
                name: "NameEs",
                table: "ProductCategories");

            migrationBuilder.DropColumn(
                name: "NameJa",
                table: "ProductCategories");

            migrationBuilder.DropColumn(
                name: "NamePt",
                table: "ProductCategories");

            migrationBuilder.DropColumn(
                name: "ParentId",
                table: "ProductCategories");

            migrationBuilder.RenameColumn(
                name: "NameZh",
                table: "ProductCategories",
                newName: "Name");

            migrationBuilder.CreateTable(
                name: "ProductSubCategories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Slug = table.Column<string>(type: "TEXT", nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: true),
                    Icon = table.Column<string>(type: "TEXT", nullable: true),
                    ParentCategoryId = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductSubCategories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductSubCategories_ProductCategories_ParentCategoryId",
                        column: x => x.ParentCategoryId,
                        principalTable: "ProductCategories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProductSubCategories_ParentCategoryId",
                table: "ProductSubCategories",
                column: "ParentCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductSubCategories_Slug",
                table: "ProductSubCategories",
                column: "Slug",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProductSubCategories");

            migrationBuilder.RenameColumn(
                name: "Name",
                table: "ProductCategories",
                newName: "NameZh");

            migrationBuilder.AddColumn<int>(
                name: "DisplayOrder",
                table: "ProductCategories",
                type: "INTEGER",
                nullable: false,
                defaultValue: 999);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "ProductCategories",
                type: "INTEGER",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<string>(
                name: "NameDe",
                table: "ProductCategories",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "NameEn",
                table: "ProductCategories",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "NameEs",
                table: "ProductCategories",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "NameJa",
                table: "ProductCategories",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "NamePt",
                table: "ProductCategories",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "ParentId",
                table: "ProductCategories",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProductCategories_DisplayOrder",
                table: "ProductCategories",
                column: "DisplayOrder");

            migrationBuilder.CreateIndex(
                name: "IX_ProductCategories_IsActive",
                table: "ProductCategories",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_ProductCategories_ParentId",
                table: "ProductCategories",
                column: "ParentId");

            migrationBuilder.AddCheckConstraint(
                name: "CK_ProductCategories_NoSelfReference",
                table: "ProductCategories",
                sql: "\"Id\" != \"ParentId\"");

            migrationBuilder.AddForeignKey(
                name: "FK_ProductCategories_ProductCategories_ParentId",
                table: "ProductCategories",
                column: "ParentId",
                principalTable: "ProductCategories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
