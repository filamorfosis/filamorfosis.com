using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Filamorfosis.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class TranslateCostParameterLabels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "CostParameters",
                keyColumn: "Id",
                keyValue: new Guid("a1000001-0000-0000-0000-000000000001"),
                column: "Label",
                value: "Costo eléctrico por hora (MXN/hr)");

            migrationBuilder.UpdateData(
                table: "CostParameters",
                keyColumn: "Id",
                keyValue: new Guid("a1000001-0000-0000-0000-000000000002"),
                column: "Label",
                value: "Costo de tinta plana por cm² (MXN/cm²)");

            migrationBuilder.UpdateData(
                table: "CostParameters",
                keyColumn: "Id",
                keyValue: new Guid("a1000001-0000-0000-0000-000000000003"),
                column: "Label",
                value: "Costo de tinta relieve por cm² (MXN/cm²)");

            migrationBuilder.UpdateData(
                table: "CostParameters",
                keyColumn: "Id",
                keyValue: new Guid("a1000002-0000-0000-0000-000000000001"),
                column: "Label",
                value: "Costo de filamento por gramo (MXN/g)");

            migrationBuilder.UpdateData(
                table: "CostParameters",
                keyColumn: "Id",
                keyValue: new Guid("a1000002-0000-0000-0000-000000000002"),
                column: "Label",
                value: "Costo eléctrico por hora (MXN/hr)");

            migrationBuilder.UpdateData(
                table: "CostParameters",
                keyColumn: "Id",
                keyValue: new Guid("a1000003-0000-0000-0000-000000000001"),
                column: "Label",
                value: "Costo eléctrico por hora (MXN/hr)");

            migrationBuilder.UpdateData(
                table: "CostParameters",
                keyColumn: "Id",
                keyValue: new Guid("a1000004-0000-0000-0000-000000000001"),
                column: "Label",
                value: "Costo eléctrico por hora (MXN/hr)");

            migrationBuilder.UpdateData(
                table: "CostParameters",
                keyColumn: "Id",
                keyValue: new Guid("a1000005-0000-0000-0000-000000000001"),
                column: "Label",
                value: "Costo de papel por cm² (MXN/cm²)");

            migrationBuilder.UpdateData(
                table: "CostParameters",
                keyColumn: "Id",
                keyValue: new Guid("a1000005-0000-0000-0000-000000000002"),
                column: "Label",
                value: "Costo de tinta por cm² (MXN/cm²)");

            migrationBuilder.UpdateData(
                table: "CostParameters",
                keyColumn: "Id",
                keyValue: new Guid("a1000005-0000-0000-0000-000000000003"),
                column: "Label",
                value: "Costo eléctrico por hora (MXN/hr)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "CostParameters",
                keyColumn: "Id",
                keyValue: new Guid("a1000001-0000-0000-0000-000000000001"),
                column: "Label",
                value: "Electric cost per hour (MXN/hr)");

            migrationBuilder.UpdateData(
                table: "CostParameters",
                keyColumn: "Id",
                keyValue: new Guid("a1000001-0000-0000-0000-000000000002"),
                column: "Label",
                value: "Ink cost per cm² for flat print (MXN/cm²)");

            migrationBuilder.UpdateData(
                table: "CostParameters",
                keyColumn: "Id",
                keyValue: new Guid("a1000001-0000-0000-0000-000000000003"),
                column: "Label",
                value: "Ink cost per cm² for relief print (MXN/cm²)");

            migrationBuilder.UpdateData(
                table: "CostParameters",
                keyColumn: "Id",
                keyValue: new Guid("a1000002-0000-0000-0000-000000000001"),
                column: "Label",
                value: "Filament cost per gram (MXN/g)");

            migrationBuilder.UpdateData(
                table: "CostParameters",
                keyColumn: "Id",
                keyValue: new Guid("a1000002-0000-0000-0000-000000000002"),
                column: "Label",
                value: "Electric cost per hour (MXN/hr)");

            migrationBuilder.UpdateData(
                table: "CostParameters",
                keyColumn: "Id",
                keyValue: new Guid("a1000003-0000-0000-0000-000000000001"),
                column: "Label",
                value: "Electric cost per hour (MXN/hr)");

            migrationBuilder.UpdateData(
                table: "CostParameters",
                keyColumn: "Id",
                keyValue: new Guid("a1000004-0000-0000-0000-000000000001"),
                column: "Label",
                value: "Electric cost per hour (MXN/hr)");

            migrationBuilder.UpdateData(
                table: "CostParameters",
                keyColumn: "Id",
                keyValue: new Guid("a1000005-0000-0000-0000-000000000001"),
                column: "Label",
                value: "Paper cost per cm² (MXN/cm²)");

            migrationBuilder.UpdateData(
                table: "CostParameters",
                keyColumn: "Id",
                keyValue: new Guid("a1000005-0000-0000-0000-000000000002"),
                column: "Label",
                value: "Ink cost per cm² (MXN/cm²)");

            migrationBuilder.UpdateData(
                table: "CostParameters",
                keyColumn: "Id",
                keyValue: new Guid("a1000005-0000-0000-0000-000000000003"),
                column: "Label",
                value: "Electric cost per hour (MXN/hr)");
        }
    }
}
