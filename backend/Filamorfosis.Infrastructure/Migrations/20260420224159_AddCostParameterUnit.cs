using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Filamorfosis.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCostParameterUnit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Unit",
                table: "CostParameters",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "CostParameters",
                keyColumn: "Id",
                keyValue: new Guid("a1000001-0000-0000-0000-000000000001"),
                column: "Unit",
                value: "");

            migrationBuilder.UpdateData(
                table: "CostParameters",
                keyColumn: "Id",
                keyValue: new Guid("a1000001-0000-0000-0000-000000000002"),
                column: "Unit",
                value: "");

            migrationBuilder.UpdateData(
                table: "CostParameters",
                keyColumn: "Id",
                keyValue: new Guid("a1000001-0000-0000-0000-000000000003"),
                column: "Unit",
                value: "");

            migrationBuilder.UpdateData(
                table: "CostParameters",
                keyColumn: "Id",
                keyValue: new Guid("a1000002-0000-0000-0000-000000000001"),
                column: "Unit",
                value: "");

            migrationBuilder.UpdateData(
                table: "CostParameters",
                keyColumn: "Id",
                keyValue: new Guid("a1000002-0000-0000-0000-000000000002"),
                column: "Unit",
                value: "");

            migrationBuilder.UpdateData(
                table: "CostParameters",
                keyColumn: "Id",
                keyValue: new Guid("a1000003-0000-0000-0000-000000000001"),
                column: "Unit",
                value: "");

            migrationBuilder.UpdateData(
                table: "CostParameters",
                keyColumn: "Id",
                keyValue: new Guid("a1000004-0000-0000-0000-000000000001"),
                column: "Unit",
                value: "");

            migrationBuilder.UpdateData(
                table: "CostParameters",
                keyColumn: "Id",
                keyValue: new Guid("a1000005-0000-0000-0000-000000000001"),
                column: "Unit",
                value: "");

            migrationBuilder.UpdateData(
                table: "CostParameters",
                keyColumn: "Id",
                keyValue: new Guid("a1000005-0000-0000-0000-000000000002"),
                column: "Unit",
                value: "");

            migrationBuilder.UpdateData(
                table: "CostParameters",
                keyColumn: "Id",
                keyValue: new Guid("a1000005-0000-0000-0000-000000000003"),
                column: "Unit",
                value: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Unit",
                table: "CostParameters");
        }
    }
}
