using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Filamorfosis.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixCategoryIsActiveDefault : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Fix all existing categories that were inserted with IsActive = false
            // due to the wrong defaultValue in the AddCategoryIsActive migration.
            migrationBuilder.Sql("UPDATE \"Categories\" SET \"IsActive\" = 1 WHERE \"IsActive\" = 0;");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE \"Categories\" SET \"IsActive\" = 0;");
        }
    }
}
