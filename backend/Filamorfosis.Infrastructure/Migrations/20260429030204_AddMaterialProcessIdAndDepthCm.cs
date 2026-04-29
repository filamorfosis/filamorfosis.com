using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Filamorfosis.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMaterialProcessIdAndDepthCm : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add new columns
            migrationBuilder.AddColumn<string>(
                name: "ProcessId",
                table: "Materials",
                type: "TEXT",
                nullable: true); // Temporarily nullable for data migration

            migrationBuilder.AddColumn<string>(
                name: "DepthCm",
                table: "Materials",
                type: "TEXT",
                nullable: true);

            // Migrate data: Map old Category string to ProcessId Guid
            // Map based on NameEs in Processes table
            migrationBuilder.Sql(@"
                UPDATE Materials
                SET ProcessId = (
                    SELECT p.Id
                    FROM Processes p
                    WHERE p.NameEs = Materials.Category
                    LIMIT 1
                )
                WHERE Category IS NOT NULL;
            ");

            // Make ProcessId non-nullable now that data is migrated
            migrationBuilder.AlterColumn<string>(
                name: "ProcessId",
                table: "Materials",
                type: "TEXT",
                nullable: false);

            // Create index on ProcessId for FK performance
            migrationBuilder.CreateIndex(
                name: "IX_Materials_ProcessId",
                table: "Materials",
                column: "ProcessId");

            // Add FK constraint
            migrationBuilder.AddForeignKey(
                name: "FK_Materials_Processes_ProcessId",
                table: "Materials",
                column: "ProcessId",
                principalTable: "Processes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            // Drop old Category column
            migrationBuilder.DropColumn(
                name: "Category",
                table: "Materials");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop FK constraint
            migrationBuilder.DropForeignKey(
                name: "FK_Materials_Processes_ProcessId",
                table: "Materials");

            // Drop index
            migrationBuilder.DropIndex(
                name: "IX_Materials_ProcessId",
                table: "Materials");

            // Add back Category column
            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "Materials",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            // Drop new columns
            migrationBuilder.DropColumn(
                name: "ProcessId",
                table: "Materials");

            migrationBuilder.DropColumn(
                name: "DepthCm",
                table: "Materials");
        }
    }
}
